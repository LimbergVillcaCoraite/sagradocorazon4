from datetime import datetime, timezone, timedelta
from typing import Optional
import json
from urllib.parse import urlencode

import requests
from .config import settings

GOOGLE_AUTH_URI = "https://accounts.google.com/o/oauth2/v2/auth"
GOOGLE_TOKEN_URI = "https://oauth2.googleapis.com/token"
GOOGLE_SCOPES = ["https://www.googleapis.com/auth/calendar.events"]


def build_state_token(user_id: str) -> str:
    """Build a signed-ish state payload for OAuth callback.

    For MVP we keep it simple and deterministic; it's enough to bind the callback
    to the authenticated user while still being easy to test.
    """
    payload = {"user_id": user_id, "ts": int(datetime.now(tz=timezone.utc).timestamp())}
    return json.dumps(payload, separators=(",", ":"))


def parse_state_token(state: str) -> dict:
    return json.loads(state)


def build_auth_url(redirect_uri: str, state: str) -> str:
    client_id = settings.google_client_id
    if not client_id:
        raise ValueError("Google OAuth client id is not configured")
    scopes = " ".join(GOOGLE_SCOPES)
    params = {
        "client_id": client_id,
        "redirect_uri": redirect_uri,
        "response_type": "code",
        "scope": scopes,
        "access_type": "offline",
        "prompt": "consent",
        "state": state,
    }
    return f"{GOOGLE_AUTH_URI}?{urlencode(params)}"


def exchange_code_for_tokens(code: str, redirect_uri: str) -> dict:
    if not settings.google_client_id or not settings.google_client_secret:
        raise ValueError("Google OAuth credentials are not configured")
    response = requests.post(
        GOOGLE_TOKEN_URI,
        data={
            "code": code,
            "client_id": settings.google_client_id,
            "client_secret": settings.google_client_secret,
            "redirect_uri": redirect_uri,
            "grant_type": "authorization_code",
        },
        timeout=30,
    )
    response.raise_for_status()
    return response.json()


def refresh_access_token(refresh_token: str) -> dict:
    if not settings.google_client_id or not settings.google_client_secret:
        raise ValueError("Google OAuth credentials are not configured")
    response = requests.post(
        GOOGLE_TOKEN_URI,
        data={
            "refresh_token": refresh_token,
            "client_id": settings.google_client_id,
            "client_secret": settings.google_client_secret,
            "grant_type": "refresh_token",
        },
        timeout=30,
    )
    response.raise_for_status()
    return response.json()


def build_credentials(access_token: str, refresh_token: str, expiry: Optional[datetime], scopes: str) -> dict:
    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "expiry": expiry,
        "scopes": scopes.split() if scopes else GOOGLE_SCOPES,
    }


def ensure_valid_credentials(creds: dict) -> dict:
    expiry = creds.get("expiry")
    if expiry and expiry.tzinfo is None:
        expiry = expiry.replace(tzinfo=timezone.utc)
    if expiry and expiry <= datetime.now(timezone.utc) and creds.get("refresh_token"):
        refreshed = refresh_access_token(creds["refresh_token"])
        creds["access_token"] = refreshed.get("access_token", creds["access_token"])
        creds["expiry"] = datetime.now(timezone.utc) + timedelta(seconds=int(refreshed.get("expires_in", 3600)))
    return creds


def create_calendar_event(creds: dict, event_payload: dict, calendar_id: Optional[str] = None) -> dict:
    creds = ensure_valid_credentials(creds)
    calendar = calendar_id or "primary"
    response = requests.post(
        f"https://www.googleapis.com/calendar/v3/calendars/{calendar}/events",
        headers={"Authorization": f"Bearer {creds['access_token']}", "Content-Type": "application/json"},
        json=event_payload,
        timeout=30,
    )
    if response.status_code == 401 and creds.get("refresh_token"):
        refreshed = refresh_access_token(creds["refresh_token"])
        creds["access_token"] = refreshed.get("access_token", creds["access_token"])
        response = requests.post(
            f"https://www.googleapis.com/calendar/v3/calendars/{calendar}/events",
            headers={"Authorization": f"Bearer {creds['access_token']}", "Content-Type": "application/json"},
            json=event_payload,
            timeout=30,
        )
    response.raise_for_status()
    return response.json()

