import json
from datetime import datetime
from urllib.parse import urlparse
from uuid import UUID, uuid4

from fastapi import APIRouter, Depends, File, Form, HTTPException, Query, UploadFile
from sqlmodel import select
from sqlmodel.ext.asyncio.session import AsyncSession
from typing import List, Optional

from ..config import settings
from ..db import get_session
from ..models import Activity, Role, User
from ..schemas_content import ActivityAttachment, ActivityCreate, ActivityRead, ActivityUpdate
from ..session_ops import session_commit, session_delete, session_exec, session_refresh
from ..storage_service import build_public_file_url, delete_file, generate_file_path, upload_file
from ..utils import get_current_user, require_role

router = APIRouter(prefix="/api/v1/activities", tags=["activities"])


def _load_activity_attachments(raw: Optional[str]) -> List[ActivityAttachment]:
    if not raw:
        return []
    try:
        parsed = json.loads(raw)
        if not isinstance(parsed, list):
            return []
        items = []
        for item in parsed:
            if isinstance(item, dict):
                items.append(ActivityAttachment(**item))
        return items
    except Exception:
        return []


def _storage_path_from_url(url: Optional[str]) -> Optional[str]:
    if not url:
        return None
    parsed = urlparse(url)
    path = parsed.path.lstrip("/")
    if not path:
        return None
    return path


def _public_url(url: Optional[str]) -> Optional[str]:
    if not url:
        return None
    parsed = urlparse(url)
    if parsed.netloc in {settings.minio_endpoint, settings.minio_public_endpoint, "localhost:9000", "127.0.0.1:9000", "minio:9000"}:
        path = parsed.path.lstrip("/")
        if path:
            try:
                return build_public_file_url(path.split("/", 1)[1]) if "/" in path else url
            except Exception:
                return url
    return url


async def serialize_activity(activity: Activity) -> ActivityRead:
    attachments = _load_activity_attachments(activity.attachments_json)
    return ActivityRead(
        id=activity.id,
        title=activity.title,
        description=activity.description,
        date=activity.date,
        location=activity.location,
        cover_image=_public_url(activity.cover_image),
        attachments=[attachment.model_copy(update={"url": _public_url(attachment.url)}) for attachment in attachments],
        publish_at=activity.publish_at,
        activity_type=activity.activity_type,
        created_at=activity.created_at,
    )

# PUBLIC ENDPOINTS
@router.get("", response_model=List[ActivityRead])
async def list_activities(
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=100),
    activity_type: Optional[str] = Query(None),
    q: Optional[str] = Query(None),
    session: AsyncSession = Depends(get_session)
):
    """List activities with optional filtering."""
    query = select(Activity).order_by(Activity.publish_at.desc(), Activity.date.desc(), Activity.created_at.desc())

    if activity_type:
        query = query.where(Activity.activity_type == activity_type)

    if q:
        query = query.where(
            (Activity.title.ilike(f"%{q}%")) |
            (Activity.description.ilike(f"%{q}%"))
        )

    # Get total count
    count_result = await session_exec(session, query)
    total = len(count_result.all())

    # Re-build query for pagination
    query = select(Activity).order_by(Activity.publish_at.desc(), Activity.date.desc(), Activity.created_at.desc())

    if activity_type:
        query = query.where(Activity.activity_type == activity_type)

    if q:
        query = query.where(
            (Activity.title.ilike(f"%{q}%")) |
            (Activity.description.ilike(f"%{q}%"))
        )

    offset = (page - 1) * limit
    query = query.offset(offset).limit(limit)

    result = await session_exec(session, query)
    return [await serialize_activity(item) for item in result.all()]

@router.get("/{activity_id}", response_model=ActivityRead)
async def get_activity(activity_id: str, session: AsyncSession = Depends(get_session)):
    """Get activity by ID."""
    q = select(Activity).where(Activity.id == activity_id)
    result = await session_exec(session, q)
    activity = result.one_or_none()
    if not activity:
        raise HTTPException(status_code=404, detail="Activity not found")
    return await serialize_activity(activity)

# PROTECTED ENDPOINTS (Admin/Professor)
@router.post("", response_model=ActivityRead)
async def create_activity(
    activity_data: ActivityCreate,
    current_user_id: UUID = Depends(get_current_user),
    role_guard_id: UUID = Depends(require_role("ADMIN", "PROFESSOR")),
    session: AsyncSession = Depends(get_session)
):
    """Create new activity."""
    activity = Activity(
        title=activity_data.title,
        description=activity_data.description,
        date=activity_data.date,
        location=activity_data.location,
        cover_image=activity_data.cover_image,
        publish_at=activity_data.publish_at,
        activity_type=activity_data.activity_type,
        created_at=datetime.utcnow()
    )
    session.add(activity)
    await session_commit(session)
    await session_refresh(session, activity)
    return await serialize_activity(activity)

@router.put("/{activity_id}", response_model=ActivityRead)
async def update_activity(
    activity_id: str,
    activity_data: ActivityUpdate,
    current_user_id: UUID = Depends(get_current_user),
    role_guard_id: UUID = Depends(require_role("ADMIN", "PROFESSOR")),
    session: AsyncSession = Depends(get_session)
):
    """Update activity."""
    q = select(Activity).where(Activity.id == activity_id)
    result = await session_exec(session, q)
    activity = result.one_or_none()
    if not activity:
        raise HTTPException(status_code=404, detail="Activity not found")

    if activity_data.title:
        activity.title = activity_data.title
    if activity_data.description is not None:
        activity.description = activity_data.description
    if activity_data.date:
        activity.date = activity_data.date
    if activity_data.location is not None:
        activity.location = activity_data.location
    if activity_data.cover_image is not None:
        activity.cover_image = activity_data.cover_image
    if activity_data.publish_at is not None:
        activity.publish_at = activity_data.publish_at
    if activity_data.activity_type is not None:
        activity.activity_type = activity_data.activity_type

    session.add(activity)
    await session_commit(session)
    await session_refresh(session, activity)
    return await serialize_activity(activity)


@router.post("/{activity_id}/attachments", response_model=ActivityRead)
async def upload_activity_attachment(
    activity_id: str,
    file: List[UploadFile] = File(...),
    caption: Optional[str] = Form(None),
    user_id: UUID = Depends(get_current_user),
    _: UUID = Depends(require_role("ADMIN", "PROFESSOR")),
    session: AsyncSession = Depends(get_session)
):
    q = select(Activity).where(Activity.id == activity_id)
    result = await session_exec(session, q)
    activity = result.one_or_none()
    if not activity:
        raise HTTPException(status_code=404, detail="Activity not found")

    attachments = [attachment.model_dump(mode="json") for attachment in _load_activity_attachments(activity.attachments_json)]

    for upfile in file:
        content = await upfile.read()
        file_path = generate_file_path(upfile.filename, prefix="activity-attachments")
        content_type = upfile.content_type or "application/octet-stream"
        url = upload_file(file_path, content, content_type)

        if content_type.startswith("image/"):
            kind = "image"
        elif content_type.startswith("video/"):
            kind = "video"
        elif content_type.startswith("audio/"):
            kind = "audio"
        else:
            kind = "document"

        attachments.append({
            "id": str(uuid4()),
            "url": url,
            "storage_path": file_path,
            "filename": upfile.filename,
            "content_type": content_type,
            "kind": kind,
            "caption": caption,
            "created_at": datetime.utcnow().isoformat(),
        })
        if not activity.cover_image and kind == "image":
            activity.cover_image = url

    activity.attachments_json = json.dumps(attachments)
    session.add(activity)
    await session_commit(session)
    await session_refresh(session, activity)
    return await serialize_activity(activity)


@router.delete("/{activity_id}/attachments/{attachment_id}", response_model=ActivityRead)
async def delete_activity_attachment(
    activity_id: str,
    attachment_id: str,
    user_id: UUID = Depends(get_current_user),
    _: UUID = Depends(require_role("ADMIN", "PROFESSOR")),
    session: AsyncSession = Depends(get_session)
):
    q = select(Activity).where(Activity.id == activity_id)
    result = await session_exec(session, q)
    activity = result.one_or_none()
    if not activity:
        raise HTTPException(status_code=404, detail="Activity not found")

    q_user = select(User).where(User.id == user_id)
    user_res = await session_exec(session, q_user)
    user = user_res.one_or_none()
    if not user:
        raise HTTPException(status_code=403, detail="User not found")

    q_role = select(Role).where(Role.id == user.role_id)
    role_res = await session_exec(session, q_role)
    role = role_res.one_or_none()
    if not role or role.name not in {"ADMIN", "PROFESSOR"}:
        raise HTTPException(status_code=403, detail="Insufficient permissions")

    attachments = _load_activity_attachments(activity.attachments_json)
    target = next((item for item in attachments if item.id == attachment_id), None)
    if not target:
        raise HTTPException(status_code=404, detail="Attachment not found")

    storage_path = target.storage_path or _storage_path_from_url(target.url)
    if storage_path:
        delete_file(storage_path)

    remaining = [item for item in attachments if item.id != attachment_id]
    activity.attachments_json = json.dumps([item.model_dump(mode="json") for item in remaining])
    if activity.cover_image == target.url:
        next_image = next((item.url for item in remaining if item.kind == "image"), None)
        activity.cover_image = next_image

    session.add(activity)
    await session_commit(session)
    await session_refresh(session, activity)
    return await serialize_activity(activity)

@router.delete("/{activity_id}")
async def delete_activity(
    activity_id: str,
    current_user_id: UUID = Depends(get_current_user),
    role_guard_id: UUID = Depends(require_role("ADMIN")),
    session: AsyncSession = Depends(get_session)
):
    """Delete activity (admin only)."""
    q = select(Activity).where(Activity.id == activity_id)
    result = await session_exec(session, q)
    activity = result.one_or_none()
    if not activity:
        raise HTTPException(status_code=404, detail="Activity not found")

    await session_delete(session, activity)
    await session_commit(session)
    return {"status": "deleted", "activity_id": activity_id}

