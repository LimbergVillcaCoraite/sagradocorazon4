from fastapi import APIRouter, Depends, HTTPException, Query
from sqlmodel import select
from sqlmodel.ext.asyncio.session import AsyncSession
from typing import List, Optional
from uuid import UUID

from ..db import get_session
from ..models import Notification, PushSubscription, User, Role
from ..utils import get_current_user, require_role
from ..schemas_notifications import BrowserSubscriptionCreate, BrowserSubscriptionRead, NotificationCreate, NotificationRead
from .. import notifications as notification_service
from ..session_ops import session_exec, session_commit, session_refresh

router = APIRouter(prefix="/api/v1/notifications", tags=["notifications"])

ROLE_AUDIENCE_MAP = {
    "students": "STUDENT",
    "parents": "PARENT",
    "teachers": "PROFESSOR",
    "all": None,
}

ROLE_TO_AUDIENCE_MAP = {
    "STUDENT": "students",
    "PARENT": "parents",
    "PROFESSOR": "teachers",
}

async def _get_user_role_name(session: AsyncSession, user_id: UUID) -> Optional[str]:
    q = select(User).where(User.id == user_id)
    user_res = await session_exec(session, q)
    user = user_res.one_or_none()
    if not user or not user.role_id:
        return None
    q_role = select(Role).where(Role.id == user.role_id)
    role_res = await session_exec(session, q_role)
    role = role_res.one_or_none()
    return role.name if role else None

async def _get_target_users(session: AsyncSession, audience: str) -> List[User]:
    q = select(User)
    if audience != "all":
        role_name = ROLE_AUDIENCE_MAP.get(audience)
        if role_name:
            q = select(User).join(Role, User.role_id == Role.id).where(Role.name == role_name)
    res = await session_exec(session, q)
    return res.all()

async def _get_push_subscriptions(session: AsyncSession, audience: str) -> List[PushSubscription]:
    users = await _get_target_users(session, audience)
    user_ids = [u.id for u in users]
    if not user_ids:
        return []
    q = select(PushSubscription).where(PushSubscription.active == True).where(PushSubscription.user_id.in_(user_ids))
    res = await session_exec(session, q)
    return res.all()

# PUBLIC / IN-APP FEED
@router.get("", response_model=List[NotificationRead])
async def list_notifications(
    audience: Optional[str] = Query(None),
    session: AsyncSession = Depends(get_session)
):
    q = select(Notification)
    if audience:
        q = q.where(Notification.audience == audience)
    q = q.order_by(Notification.created_at.desc())
    res = await session_exec(session, q)
    return res.all()

@router.get("/me", response_model=List[NotificationRead])
async def my_notifications(
    user_id: UUID = Depends(get_current_user),
    session: AsyncSession = Depends(get_session)
):
    role_name = await _get_user_role_name(session, user_id)
    if not role_name:
        raise HTTPException(status_code=404, detail="User role not found")
    audience = ROLE_TO_AUDIENCE_MAP.get(role_name, role_name.lower())
    q = select(Notification).where((Notification.audience == "all") | (Notification.audience == audience))
    q = q.order_by(Notification.created_at.desc())
    res = await session_exec(session, q)
    return res.all()

# SUBSCRIPTIONS
@router.post("/subscribe", response_model=BrowserSubscriptionRead)
async def subscribe_device(
    payload: BrowserSubscriptionCreate,
    user_id: UUID = Depends(get_current_user),
    session: AsyncSession = Depends(get_session)
):
    existing_q = select(PushSubscription).where(PushSubscription.endpoint == payload.endpoint)
    existing_res = await session_exec(session, existing_q)
    existing = existing_res.one_or_none()
    if existing:
        existing.user_id = user_id
        existing.p256dh = payload.keys.p256dh
        existing.auth = payload.keys.auth
        existing.expiration_time = payload.expirationTime
        existing.active = True
        session.add(existing)
        await session_commit(session)
        await session_refresh(session, existing)
        return existing

    sub = PushSubscription(
        user_id=user_id,
        endpoint=payload.endpoint,
        p256dh=payload.keys.p256dh,
        auth=payload.keys.auth,
        expiration_time=payload.expirationTime,
        active=True,
    )
    session.add(sub)
    await session_commit(session)
    await session_refresh(session, sub)
    return sub

@router.delete("/subscribe")
async def unsubscribe_device(
    endpoint: str,
    user_id: UUID = Depends(get_current_user),
    session: AsyncSession = Depends(get_session)
):
    q = select(PushSubscription).where(PushSubscription.endpoint == endpoint).where(PushSubscription.user_id == user_id)
    res = await session_exec(session, q)
    sub = res.one_or_none()
    if not sub:
        raise HTTPException(status_code=404, detail="Subscription not found")
    sub.active = False
    session.add(sub)
    await session_commit(session)
    return {"status": "unsubscribed"}

# SEND / DISPATCH
@router.post("/send", response_model=NotificationRead)
async def send_notification(
    payload: NotificationCreate,
    user_id: UUID = Depends(get_current_user),
    _: UUID = Depends(require_role("ADMIN", "PROFESSOR")),
    session: AsyncSession = Depends(get_session)
):
    notification = Notification(
        title=payload.title,
        body=payload.body,
        audience=payload.audience,
        source_type=payload.source_type,
        source_id=payload.source_id,
        created_by=user_id,
    )
    session.add(notification)
    await session_commit(session)
    await session_refresh(session, notification)

    email_count = 0
    push_count = 0

    if payload.send_email:
        target_users = await _get_target_users(session, payload.audience)
        recipients = [u.email for u in target_users if u.email]
        if recipients:
            await notification_service.send_email(payload.title, payload.body, recipients)
            email_count = len(recipients)

    if payload.send_push:
        subscriptions = await _get_push_subscriptions(session, payload.audience)
        for sub in subscriptions:
            subscription_info = {
                "endpoint": sub.endpoint,
                "keys": {
                    "p256dh": sub.p256dh,
                    "auth": sub.auth,
                },
            }
            notification_service.send_web_push(subscription_info, payload.title, payload.body)
            push_count += 1

    notification.email_sent_count = email_count
    notification.push_sent_count = push_count
    session.add(notification)
    await session_commit(session)
    await session_refresh(session, notification)
    return notification

@router.get("/subscriptions", response_model=List[BrowserSubscriptionRead])
async def list_subscriptions(
    user_id: UUID = Depends(get_current_user),
    _: UUID = Depends(require_role("ADMIN")),
    session: AsyncSession = Depends(get_session)
):
    q = select(PushSubscription).order_by(PushSubscription.created_at.desc())
    res = await session_exec(session, q)
    return res.all()

