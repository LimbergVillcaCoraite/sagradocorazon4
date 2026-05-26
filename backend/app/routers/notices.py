from fastapi import APIRouter, Depends, HTTPException, Query
from sqlmodel import select
from sqlmodel.ext.asyncio.session import AsyncSession
from typing import List, Optional
from datetime import datetime
from uuid import UUID
import logging

logger = logging.getLogger(__name__)

from ..db import get_session
from ..models import Notice, User
from ..utils import get_current_user, require_role
from ..schemas_content import NoticeCreate, NoticeUpdate, NoticeRead
from ..session_ops import session_exec, session_commit, session_refresh, session_delete

router = APIRouter(prefix="/api/v1/notices", tags=["notices"])


def _to_naive_datetime(dt: Optional[datetime]) -> Optional[datetime]:
    """
    Convert a datetime with timezone info to a naive datetime.
    The database columns are defined as TIMESTAMP WITHOUT TIME ZONE,
    so we need to strip timezone info before inserting.
    """
    if dt is None:
        return None
    if dt.tzinfo is not None:
        # Convert to naive by replacing tzinfo with None
        return dt.replace(tzinfo=None)
    return dt


async def _creator_name(created_by: Optional[UUID], session: AsyncSession) -> Optional[str]:
    if not created_by:
        return None
    q = select(User).where(User.id == created_by)
    result = await session_exec(session, q)
    user = result.one_or_none()
    return user.name if user else None


async def serialize_notice(notice: Notice, session: AsyncSession) -> NoticeRead:
    creator_name = await _creator_name(notice.created_by, session)
    return NoticeRead(
        id=notice.id,
        title=notice.title,
        content=notice.content,
        audience=notice.audience,
        pinned=notice.pinned,
        created_at=notice.created_at,
        start_at=notice.start_at,
        end_at=notice.end_at,
        created_by=notice.created_by,
        created_by_name=creator_name,
    )


# PUBLIC ENDPOINTS
@router.get("/debug/last", response_model=NoticeRead)
async def debug_last_notice(
    session: AsyncSession = Depends(get_session)
):
    """Debug: Get the last created notice."""
    query = select(Notice).order_by(Notice.created_at.desc()).limit(1)
    result = await session_exec(session, query)
    notice = result.one_or_none()
    if not notice:
        raise HTTPException(status_code=404, detail="No notices found")
    return await serialize_notice(notice, session)

@router.get("", response_model=List[NoticeRead])
async def list_notices(
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=100),
    audience: Optional[str] = Query(None),
    pinned_only: bool = Query(False),
    session: AsyncSession = Depends(get_session)
):
    """List notices with optional filtering. Excludes expired notices."""
    now = datetime.utcnow()
    query = select(Notice).where(
        (Notice.end_at.is_(None)) | (Notice.end_at > now)
    ).order_by(Notice.pinned.desc(), Notice.created_at.desc())

    if audience and audience != "all":
        query = query.where(
            (Notice.audience == audience) | (Notice.audience == "all")
        )

    if pinned_only:
        query = query.where(Notice.pinned == True)

    # Get total count
    count_result = await session_exec(session, query)
    total = len(count_result.all())

    # Apply pagination
    offset = (page - 1) * limit
    query = select(Notice).where(
        (Notice.end_at.is_(None)) | (Notice.end_at > now)
    ).order_by(Notice.pinned.desc(), Notice.created_at.desc())

    if audience and audience != "all":
        query = query.where(
            (Notice.audience == audience) | (Notice.audience == "all")
        )

    if pinned_only:
        query = query.where(Notice.pinned == True)

    query = query.offset(offset).limit(limit)
    result = await session_exec(session, query)
    notices = result.all()
    return [await serialize_notice(notice, session) for notice in notices]

# PROTECTED ENDPOINTS (Admin/Professor)
@router.post("", response_model=NoticeRead)
async def create_notice(
    notice_data: NoticeCreate,
    user_id: UUID = Depends(get_current_user),
    _: UUID = Depends(require_role("ADMIN", "PROFESSOR")),
    session: AsyncSession = Depends(get_session)
):
    """Create new notice."""
    notice = Notice(
        title=notice_data.title,
        content=notice_data.content,
        audience=notice_data.audience,
        pinned=notice_data.pinned,
        created_by=user_id,
        created_at=datetime.utcnow()
    )
    # Assign optional fields separately
    if notice_data.end_at is not None:
        notice.end_at = _to_naive_datetime(notice_data.end_at)
    if notice_data.start_at is not None:
        notice.start_at = _to_naive_datetime(notice_data.start_at)

    session.add(notice)
    await session_commit(session)
    await session_refresh(session, notice)
    return await serialize_notice(notice, session)

@router.put("/{notice_id}", response_model=NoticeRead)
async def update_notice(
    notice_id: str,
    notice_data: NoticeUpdate,
    user_id: UUID = Depends(get_current_user),
    _: UUID = Depends(require_role("ADMIN", "PROFESSOR")),
    session: AsyncSession = Depends(get_session)
):
    """Update notice (admin or creator)."""
    q = select(Notice).where(Notice.id == notice_id)
    result = await session_exec(session, q)
    notice = result.one_or_none()
    if not notice:
        raise HTTPException(status_code=404, detail="Notice not found")

    # Check permissions
    from ..models import Role
    q_user = select(User).where(User.id == user_id)
    user_res = await session_exec(session, q_user)
    user = user_res.one_or_none()

    q_role = select(Role).where(Role.id == user.role_id)
    role_res = await session_exec(session, q_role)
    role = role_res.one_or_none()

    if role.name != "ADMIN" and notice.created_by != user_id:
        raise HTTPException(status_code=403, detail="Cannot edit this notice")

    if notice_data.title:
        notice.title = notice_data.title
    if notice_data.content:
        notice.content = notice_data.content
    if notice_data.audience:
        notice.audience = notice_data.audience
    if notice_data.pinned is not None:
        notice.pinned = notice_data.pinned
    if notice_data.end_at is not None:
        notice.end_at = _to_naive_datetime(notice_data.end_at)
    if notice_data.start_at is not None:
        notice.start_at = _to_naive_datetime(notice_data.start_at)

    session.add(notice)
    await session_commit(session)
    await session_refresh(session, notice)
    return await serialize_notice(notice, session)

@router.get("/{notice_id}", response_model=NoticeRead)
async def get_notice(
    notice_id: str,
    session: AsyncSession = Depends(get_session)
):
    """Get a specific notice by ID."""
    query = select(Notice).where(Notice.id == notice_id)
    result = await session_exec(session, query)
    notice = result.one_or_none()
    if not notice:
        raise HTTPException(status_code=404, detail="Notice not found")
    return await serialize_notice(notice, session)

@router.delete("/{notice_id}")
async def delete_notice(
    notice_id: str,
    user_id: UUID = Depends(get_current_user),
    _: UUID = Depends(require_role("ADMIN")),
    session: AsyncSession = Depends(get_session)
):
    """Delete notice (admin only)."""
    q = select(Notice).where(Notice.id == notice_id)
    result = await session_exec(session, q)
    notice = result.one_or_none()
    if not notice:
        raise HTTPException(status_code=404, detail="Notice not found")

    await session_delete(session, notice)
    await session_commit(session)
    return {"status": "deleted", "notice_id": notice_id}

