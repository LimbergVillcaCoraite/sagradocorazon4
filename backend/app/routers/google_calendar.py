from datetime import datetime, timezone, timedelta
from json import JSONDecodeError
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlmodel import select
from sqlmodel.ext.asyncio.session import AsyncSession
from typing import Optional
from uuid import UUID

from ..config import settings
from ..db import get_session
from ..models import GoogleCalendarToken
from ..utils import get_current_user
from ..schemas_google import GoogleAuthUrlRead, GoogleCallbackRead, GoogleTokenRead, GoogleEventCreate
from ..google_calendar_service import (
    build_state_token,
    parse_state_token,
    build_auth_url,
    exchange_code_for_tokens,
    build_credentials,
    create_calendar_event,
)
from ..session_ops import session_exec, session_commit, session_refresh

router = APIRouter(prefix="/api/v1/google", tags=["google-calendar"])


def _expiry_from_payload(payload: dict) -> Optional[datetime]:
    expires_in = payload.get("expires_in")
    if not expires_in:
        return None
    return datetime.now(timezone.utc) + timedelta(seconds=int(expires_in))


@router.get("/auth_url", response_model=GoogleAuthUrlRead)
async def get_auth_url(
    user_id: UUID = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    if not settings.google_client_id or not settings.google_redirect_uri:
        raise HTTPException(status_code=500, detail="Google OAuth not configured")
    state = build_state_token(str(user_id))
    url = build_auth_url(settings.google_redirect_uri, state)
    return GoogleAuthUrlRead(url=url, state=state)


@router.get("/callback", response_model=GoogleCallbackRead)
async def google_callback(
    code: str = Query(...),
    state: str = Query(...),
    session: AsyncSession = Depends(get_session),
):
    if not settings.google_redirect_uri:
        raise HTTPException(status_code=500, detail="Google redirect URI not configured")
    try:
        try:
            state_payload = parse_state_token(state)
        except JSONDecodeError:
            raise HTTPException(status_code=400, detail="Invalid state payload")

        user_id_value = state_payload.get("user_id")
        if not user_id_value:
            raise HTTPException(status_code=400, detail="Invalid state payload")
        try:
            user_id = UUID(user_id_value)
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid state payload")

        token_payload = exchange_code_for_tokens(code, settings.google_redirect_uri)
        expiry = None
        if token_payload.get("expires_in"):
            expiry = datetime.now(timezone.utc) + timedelta(seconds=int(token_payload["expires_in"]))

        existing_q = select(GoogleCalendarToken).where(GoogleCalendarToken.user_id == user_id)
        existing_res = await session_exec(session, existing_q)
        token = existing_res.one_or_none()

        if not token:
            token = GoogleCalendarToken(
                user_id=user_id,
                access_token=token_payload["access_token"],
                refresh_token=token_payload.get("refresh_token", ""),
                token_uri=token_payload.get("token_uri", "https://oauth2.googleapis.com/token"),
                client_id=settings.google_client_id,
                client_secret=settings.google_client_secret,
                scopes=" ".join(token_payload.get("scope", "https://www.googleapis.com/auth/calendar.events").split()),
                expiry=expiry,
                active=True,
            )
        else:
            token.access_token = token_payload["access_token"]
            if token_payload.get("refresh_token"):
                token.refresh_token = token_payload["refresh_token"]
            token.expiry = expiry
            token.active = True
            token.updated_at = datetime.now(timezone.utc)

        session.add(token)
        await session_commit(session)
        await session_refresh(session, token)
        return GoogleCallbackRead(status="connected", connected=True, user_id=user_id)
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Google callback failed: {exc}")


@router.get("/status", response_model=GoogleTokenRead)
async def google_status(
    user_id: UUID = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    q = select(GoogleCalendarToken).where(GoogleCalendarToken.user_id == user_id)
    res = await session_exec(session, q)
    token = res.one_or_none()
    if not token:
        raise HTTPException(status_code=404, detail="Google Calendar not connected")
    return token


@router.delete("/disconnect")
async def disconnect_google(
    user_id: UUID = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    q = select(GoogleCalendarToken).where(GoogleCalendarToken.user_id == user_id)
    res = await session_exec(session, q)
    token = res.one_or_none()
    if not token:
        raise HTTPException(status_code=404, detail="Google Calendar not connected")
    token.active = False
    token.updated_at = datetime.now(timezone.utc)
    session.add(token)
    await session_commit(session)
    return {"status": "disconnected"}


@router.post("/sync_event")
async def sync_event(
    payload: GoogleEventCreate,
    user_id: UUID = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    q = select(GoogleCalendarToken).where(GoogleCalendarToken.user_id == user_id, GoogleCalendarToken.active == True)
    res = await session_exec(session, q)
    token = res.one_or_none()
    if not token:
        raise HTTPException(status_code=404, detail="Google Calendar not connected")

    creds = build_credentials(token.access_token, token.refresh_token, token.expiry, token.scopes)
    event_body = {
        "summary": payload.summary,
        "description": payload.description,
        "location": payload.location,
        "start": {"dateTime": payload.start.isoformat(), "timeZone": payload.timezone},
        "end": {"dateTime": payload.end.isoformat(), "timeZone": payload.timezone},
        "sendUpdates": payload.send_updates,
    }
    created = create_calendar_event(creds, event_body, payload.calendar_id or token.calendar_id)
    return {"status": "synced", "event": created}

