from fastapi import APIRouter, Depends, HTTPException, Query
from sqlmodel import select
from sqlmodel.ext.asyncio.session import AsyncSession
from typing import List, Optional
from datetime import datetime
from uuid import UUID

from ..db import get_session
from ..models import Activity
from ..utils import get_current_user, require_role
from ..schemas_content import ActivityCreate, ActivityUpdate, ActivityRead
from ..session_ops import session_exec, session_commit, session_refresh, session_delete

router = APIRouter(prefix="/api/v1/activities", tags=["activities"])

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
    query = select(Activity).order_by(Activity.date.desc() if Activity.date else Activity.created_at.desc())

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
    query = select(Activity).order_by(Activity.date.desc() if Activity.date else Activity.created_at.desc())

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
    return result.all()

@router.get("/{activity_id}", response_model=ActivityRead)
async def get_activity(activity_id: str, session: AsyncSession = Depends(get_session)):
    """Get activity by ID."""
    q = select(Activity).where(Activity.id == activity_id)
    result = await session_exec(session, q)
    activity = result.one_or_none()
    if not activity:
        raise HTTPException(status_code=404, detail="Activity not found")
    return activity

# PROTECTED ENDPOINTS (Admin/Professor)
@router.post("", response_model=ActivityRead)
async def create_activity(
    activity_data: ActivityCreate,
    user_id: UUID = Depends(get_current_user),
    _: UUID = Depends(require_role("ADMIN", "PROFESSOR")),
    session: AsyncSession = Depends(get_session)
):
    """Create new activity."""
    activity = Activity(
        title=activity_data.title,
        description=activity_data.description,
        date=activity_data.date,
        location=activity_data.location,
        cover_image=activity_data.cover_image,
        activity_type=activity_data.activity_type,
        created_at=datetime.utcnow()
    )
    session.add(activity)
    await session_commit(session)
    await session_refresh(session, activity)
    return activity

@router.put("/{activity_id}", response_model=ActivityRead)
async def update_activity(
    activity_id: str,
    activity_data: ActivityUpdate,
    user_id: UUID = Depends(get_current_user),
    _: UUID = Depends(require_role("ADMIN", "PROFESSOR")),
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
    if activity_data.activity_type is not None:
        activity.activity_type = activity_data.activity_type

    session.add(activity)
    await session_commit(session)
    await session_refresh(session, activity)
    return activity

@router.delete("/{activity_id}")
async def delete_activity(
    activity_id: str,
    user_id: UUID = Depends(get_current_user),
    _: UUID = Depends(require_role("ADMIN")),
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

