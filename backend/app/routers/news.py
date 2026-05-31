import json
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, Query, UploadFile, File, Form
from sqlmodel import select
from sqlmodel.ext.asyncio.session import AsyncSession
from typing import List, Optional
from uuid import UUID, uuid4
from urllib.parse import urlparse

from ..db import get_session
from ..models import News, User
from ..utils import get_current_user, require_role
from ..schemas_content import NewsCreate, NewsUpdate, NewsRead, NewsAttachment
from ..content_service import generate_slug, check_slug_unique
from ..session_ops import session_exec, session_commit, session_refresh, session_delete
from ..config import settings
from ..storage_service import build_public_file_url

router = APIRouter(prefix="/api/v1/news", tags=["news"])


def _load_attachments(raw: Optional[str]) -> List[NewsAttachment]:
    if not raw:
        return []
    try:
        parsed = json.loads(raw)
        if not isinstance(parsed, list):
            return []
        attachments = []
        for item in parsed:
            if isinstance(item, dict):
                attachments.append(NewsAttachment(**item))
        return attachments
    except Exception:
        return []


def _storage_path_from_url(url: Optional[str]) -> Optional[str]:
    if not url:
        return None
    parsed = urlparse(url)
    path = parsed.path.lstrip('/')
    if not path:
        return None
    return path


def _public_url(url: Optional[str]) -> Optional[str]:
    if not url:
        return None
    parsed = urlparse(url)
    # Rebuild URLs that point to MinIO so the browser can reach them even when the bucket is private.
    if parsed.netloc in {settings.minio_endpoint, settings.minio_public_endpoint, "localhost:9000", "127.0.0.1:9000", "minio:9000"}:
        path = parsed.path.lstrip("/")
        # MinIO object path is always bucket/object_name after the host.
        if path:
            try:
                return build_public_file_url(path.split("/", 1)[1]) if "/" in path else url
            except Exception:
                return url
    return url


async def serialize_news(news: News, session: AsyncSession) -> NewsRead:
    author_name = None
    if news.author_id:
        q = select(User).where(User.id == news.author_id)
        result = await session_exec(session, q)
        user = result.one_or_none()
        if user:
            author_name = user.name

    return NewsRead(
        id=news.id,
        title=news.title,
        slug=news.slug,
        excerpt=news.excerpt,
        content=news.content or '',
        cover_image=_public_url(news.cover_image),
        attachments=[
            # Normalize attachments: ensure url is public and adjust kind based on content_type
            (attachment.model_copy(update={
                "url": _public_url(attachment.url),
                "kind": (
                    "video" if (attachment.content_type or "").lower().startswith("video/") else (
                        attachment.kind if (attachment.kind in {"image", "video", "audio", "document"}) else (
                            (attachment.content_type.split("/", 1)[0] if attachment.content_type and "/" in attachment.content_type else "document")
                        )
                    )
                )
            }))
            for attachment in _load_attachments(news.attachments_json)
        ],
        status=news.status,
        author_id=news.author_id,
        author_name=author_name,
        created_at=news.created_at,
        updated_at=news.updated_at,
    )

# PUBLIC ENDPOINTS
@router.get("", response_model=List[NewsRead])
async def list_news(
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=100),
    q: Optional[str] = Query(None),
    sort_by: str = Query("created_at"),
    sort_order: str = Query("desc"),
    session: AsyncSession = Depends(get_session)
):
    """List published news with pagination and search."""
    query = select(News).where(News.status == "published")

    if q:
        query = query.where(
            (News.title.ilike(f"%{q}%")) |
            (News.content.ilike(f"%{q}%"))
        )

    # Apply sorting
    if sort_by == "title":
        query = query.order_by(News.title if sort_order == "asc" else News.title.desc())
    else:
        query = query.order_by(News.created_at if sort_order == "asc" else News.created_at.desc())

    # Get total count
    count_query = select(News).where(News.status == "published")
    if q:
        count_query = count_query.where(
            (News.title.ilike(f"%{q}%")) |
            (News.content.ilike(f"%{q}%"))
        )
    count_result = await session_exec(session, count_query)
    total = len(count_result.all())

    # Apply pagination
    offset = (page - 1) * limit
    query = query.offset(offset).limit(limit)

    result = await session_exec(session, query)
    items = result.all()
    return [await serialize_news(item, session) for item in items]

@router.get("/{slug}", response_model=NewsRead)
async def get_news_by_slug(slug: str, session: AsyncSession = Depends(get_session)):
    """Get published news by slug."""
    q = select(News).where((News.slug == slug) & (News.status == "published"))
    result = await session_exec(session, q)
    news = result.one_or_none()
    if not news:
        raise HTTPException(status_code=404, detail="News not found")
    return await serialize_news(news, session)

# PROTECTED ENDPOINTS (Admin/Editor)
@router.post("", response_model=NewsRead)
async def create_news(
    news_data: NewsCreate,
    user_id: UUID = Depends(get_current_user),
    _: UUID = Depends(require_role("ADMIN", "EDITOR")),
    session: AsyncSession = Depends(get_session)
):
    """Create new news (draft by default)."""
    # Generate slug if not provided
    slug = news_data.slug or generate_slug(news_data.title)

    # Check slug uniqueness
    is_unique = await check_slug_unique(session, slug)
    if not is_unique:
        raise HTTPException(status_code=400, detail="Slug already exists")

    now = datetime.now().replace(tzinfo=None)
    news = News(
        title=news_data.title,
        slug=slug,
        excerpt=news_data.excerpt,
        content=news_data.content,
        cover_image=news_data.cover_image,
        status=news_data.status or "draft",
        author_id=user_id,
        created_at=now,
        updated_at=now
    )
    session.add(news)
    await session_commit(session)
    await session_refresh(session, news)
    return await serialize_news(news, session)

@router.post("/{news_id}/attachments", response_model=NewsRead)
async def upload_news_attachment(
    news_id: str,
    # accept one or multiple files under the form field name `file`
    file: List[UploadFile] = File(...),
    caption: Optional[str] = Form(None),
    user_id: UUID = Depends(get_current_user),
    session: AsyncSession = Depends(get_session)
):
    """Upload one or more file attachments (image or document) and append them to a news post.
    Backwards compatible: clients that send a single `file` field will still work because
    FastAPI will provide a list with one UploadFile.
    """
    q = select(News).where(News.id == news_id)
    result = await session_exec(session, q)
    news = result.one_or_none()
    if not news:
        raise HTTPException(status_code=404, detail="News not found")

    # Permission: only admin or the creator may add attachments
    from ..models import Role, User
    q_user = select(User).where(User.id == user_id)
    user_res = await session_exec(session, q_user)
    user = user_res.one_or_none()
    if not user:
        raise HTTPException(status_code=403, detail="User not found")

    q_role = select(Role).where(Role.id == user.role_id)
    role_res = await session_exec(session, q_role)
    role = role_res.one_or_none()
    is_admin = bool(role and role.name == "ADMIN")
    if not is_admin and news.author_id != user_id:
        raise HTTPException(status_code=403, detail="Only the creator or admin can modify this news")

    from ..storage_service import upload_file, generate_file_path

    # existing attachments (as plain dicts)
    attachments = [attachment.model_dump(mode="json") for attachment in _load_attachments(news.attachments_json)]

    # iterate over provided files and upload each
    for upfile in file:
        content = await upfile.read()
        file_path = generate_file_path(upfile.filename, prefix="news-attachments")
        url = await upload_file(file_path, content, upfile.content_type or "application/octet-stream")

        ctype = upfile.content_type or "application/octet-stream"
        kind = "image" if ctype.startswith("image/") else ("video" if ctype.startswith("video/") else "document")
        attachment = {
            "id": str(uuid4()),
            "url": url,
            "storage_path": file_path,
            "filename": upfile.filename,
            "content_type": ctype,
            "kind": kind,
            "caption": caption,
            "created_at": datetime.now().replace(tzinfo=None).isoformat(),
        }
        attachments.append(attachment)
        # set cover image if none and file is an image (first image wins)
        if not news.cover_image and (upfile.content_type or "").startswith("image/"):
            news.cover_image = url

    news.attachments_json = json.dumps(attachments)
    news.updated_at = datetime.now().replace(tzinfo=None)
    session.add(news)
    await session_commit(session)
    await session_refresh(session, news)
    return await serialize_news(news, session)


@router.delete("/{news_id}/attachments/{attachment_id}", response_model=NewsRead)
async def delete_news_attachment(
    news_id: str,
    attachment_id: str,
    user_id: UUID = Depends(get_current_user),
    session: AsyncSession = Depends(get_session)
):
    """Delete one news attachment and update the post media list."""
    q = select(News).where(News.id == news_id)
    result = await session_exec(session, q)
    news = result.one_or_none()
    if not news:
        raise HTTPException(status_code=404, detail="News not found")

    from ..models import Role, User
    q_user = select(User).where(User.id == user_id)
    user_res = await session_exec(session, q_user)
    user = user_res.one_or_none()
    if not user:
        raise HTTPException(status_code=403, detail="User not found")

    q_role = select(Role).where(Role.id == user.role_id)
    role_res = await session_exec(session, q_role)
    role = role_res.one_or_none()
    # Only admin or the creator can delete attachments
    is_admin = bool(role and role.name == "ADMIN")
    if not is_admin and news.author_id != user_id:
        raise HTTPException(status_code=403, detail="Only the creator or admin can modify this news")

    attachments = _load_attachments(news.attachments_json)
    target = next((attachment for attachment in attachments if attachment.id == attachment_id), None)
    if not target:
        raise HTTPException(status_code=404, detail="Attachment not found")

    from ..storage_service import delete_file

    storage_path = getattr(target, 'storage_path', None) or _storage_path_from_url(target.url)
    if storage_path:
        await delete_file(storage_path)

    remaining = [attachment for attachment in attachments if attachment.id != attachment_id]
    news.attachments_json = json.dumps([attachment.model_dump(mode="json") for attachment in remaining])
    if news.cover_image == target.url:
        next_image = next((attachment.url for attachment in remaining if attachment.kind == "image"), None)
        news.cover_image = next_image

    news.updated_at = datetime.now().replace(tzinfo=None)
    session.add(news)
    await session_commit(session)
    await session_refresh(session, news)
    return await serialize_news(news, session)

@router.put("/{news_id}", response_model=NewsRead)
async def update_news(
    news_id: str,
    news_data: NewsUpdate,
    user_id: UUID = Depends(get_current_user),
    session: AsyncSession = Depends(get_session)
):
    """Update news. Only the creator or admin can edit; only admin can set status to published."""
    q = select(News).where(News.id == news_id)
    result = await session_exec(session, q)
    news = result.one_or_none()
    if not news:
        raise HTTPException(status_code=404, detail="News not found")

    # Check permissions (editor can only edit own drafts)
    from ..models import Role, User
    q_user = select(User).where(User.id == user_id)
    user_res = await session_exec(session, q_user)
    user = user_res.one_or_none()

    q_role = select(Role).where(Role.id == user.role_id)
    role_res = await session_exec(session, q_role)
    role = role_res.one_or_none()

    is_admin = bool(role and role.name == "ADMIN")
    # Only admin or the creator may update the news
    if not is_admin and news.author_id != user_id:
        raise HTTPException(status_code=403, detail="Only the creator or admin can edit this news")

    # Non-admins cannot set the status to 'published'
    if news_data.status == "published" and not is_admin:
        raise HTTPException(status_code=403, detail="Only admin can publish a news item")

    # Update fields
    if news_data.title:
        news.title = news_data.title
        news.slug = generate_slug(news_data.title)
    if news_data.excerpt is not None:
        news.excerpt = news_data.excerpt
    if news_data.content:
        news.content = news_data.content
    if news_data.cover_image is not None:
        news.cover_image = news_data.cover_image
    if news_data.status:
        news.status = news_data.status

    news.updated_at = datetime.now().replace(tzinfo=None)
    session.add(news)
    await session_commit(session)
    await session_refresh(session, news)
    return await serialize_news(news, session)

@router.post("/{news_id}/publish")
async def publish_news(
    news_id: str,
    user_id: UUID = Depends(get_current_user),
    _: UUID = Depends(require_role("ADMIN")),
    session: AsyncSession = Depends(get_session)
):
    """Publish news (admin only)."""
    q = select(News).where(News.id == news_id)
    result = await session_exec(session, q)
    news = result.one_or_none()
    if not news:
        raise HTTPException(status_code=404, detail="News not found")

    news.status = "published"
    news.updated_at = datetime.now().replace(tzinfo=None)
    session.add(news)
    await session_commit(session)
    await session_refresh(session, news)
    return {"status": "published", "news_id": str(news.id)}

@router.delete("/{news_id}")
async def delete_news(
    news_id: str,
    user_id: UUID = Depends(get_current_user),
    _: UUID = Depends(require_role("ADMIN")),
    session: AsyncSession = Depends(get_session)
):
    """Delete news (admin only)."""
    q = select(News).where(News.id == news_id)
    result = await session_exec(session, q)
    news = result.one_or_none()
    if not news:
        raise HTTPException(status_code=404, detail="News not found")

    await session_delete(session, news)
    await session_commit(session)
    return {"status": "deleted", "news_id": news_id}
