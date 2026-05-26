import pytest
from fastapi.testclient import TestClient
from sqlmodel import Session, create_engine, select
from sqlmodel.pool import StaticPool
from datetime import datetime, timezone, timedelta

from app.main import app, get_session
from app.models import User, Role, GoogleCalendarToken
from app.utils import get_password_hash
from app import config as app_config


@pytest.fixture(name="session")
def session_fixture():
    engine = create_engine(
        "sqlite://",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    from app.models import SQLModel
    SQLModel.metadata.create_all(engine)
    with Session(engine) as session:
        yield session


@pytest.fixture(name="client")
def client_fixture(session: Session, monkeypatch):
    def get_session_override():
        return session

    app.dependency_overrides[get_session] = get_session_override
    client = TestClient(app)

    admin_role = Role(name="ADMIN")
    session.add(admin_role)
    session.commit()
    admin = User(
        name="Admin",
        email="admin@test.com",
        password_hash=get_password_hash("admin123"),
        role_id=admin_role.id,
    )
    session.add(admin)
    session.commit()

    monkeypatch.setattr(app_config.settings, "google_client_id", "client-id")
    monkeypatch.setattr(app_config.settings, "google_client_secret", "client-secret")
    monkeypatch.setattr(app_config.settings, "google_redirect_uri", "http://localhost:4000/api/v1/google/callback")

    yield client
    app.dependency_overrides.clear()


def _login(client: TestClient) -> str:
    resp = client.post("/api/v1/auth/login", json={"email": "admin@test.com", "password": "admin123"})
    assert resp.status_code == 200
    return resp.json()["access_token"]


def test_google_auth_url(client: TestClient):
    token = _login(client)
    resp = client.get("/api/v1/google/auth_url", headers={"Authorization": f"Bearer {token}"})
    assert resp.status_code == 200
    data = resp.json()
    assert "accounts.google.com/o/oauth2/v2/auth" in data["url"]
    assert data["state"]


def test_google_callback_stores_tokens(client: TestClient, session: Session, monkeypatch):
    from app.routers import google_calendar as gc_router

    state = '{"user_id":"' + str(session.exec(select(User)).first().id) + '","ts":1234567890}'

    def fake_exchange(code, redirect_uri):
        assert code == "auth-code"
        assert redirect_uri == "http://localhost:4000/api/v1/google/callback"
        return {
            "access_token": "access-token-1",
            "refresh_token": "refresh-token-1",
            "expires_in": 3600,
            "scope": "https://www.googleapis.com/auth/calendar.events",
        }

    monkeypatch.setattr(gc_router, "exchange_code_for_tokens", fake_exchange)

    resp = client.get(
        "/api/v1/google/callback",
        params={"code": "auth-code", "state": state},
    )
    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] == "connected"

    token = session.exec(select(GoogleCalendarToken)).one_or_none()
    assert token is not None
    assert token.access_token == "access-token-1"
    assert token.refresh_token == "refresh-token-1"
    assert token.active is True


def test_google_sync_event(client: TestClient, session: Session, monkeypatch):
    from app.routers import google_calendar as gc_router
    user = session.exec(select(User).where(User.email == "admin@test.com")).one()
    token = GoogleCalendarToken(
        user_id=user.id,
        access_token="access-token-1",
        refresh_token="refresh-token-1",
        expiry=datetime.now(timezone.utc) + timedelta(hours=1),
        active=True,
        scopes="https://www.googleapis.com/auth/calendar.events",
    )
    session.add(token)
    session.commit()

    captured = {}

    def fake_create_calendar_event(creds, event_payload, calendar_id=None):
        captured["event_payload"] = event_payload
        captured["calendar_id"] = calendar_id
        return {"id": "event-1", "summary": event_payload["summary"]}

    monkeypatch.setattr(gc_router, "create_calendar_event", fake_create_calendar_event)

    access_token = _login(client)
    resp = client.post(
        "/api/v1/google/sync_event",
        headers={"Authorization": f"Bearer {access_token}"},
        json={
            "summary": "Reunión de padres",
            "description": "Evento escolar",
            "location": "Auditorio",
            "start": "2026-05-23T18:00:00Z",
            "end": "2026-05-23T19:00:00Z",
            "timezone": "America/La_Paz",
            "send_updates": "all",
        },
    )
    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] == "synced"
    assert data["event"]["summary"] == "Reunión de padres"
    assert captured["event_payload"]["summary"] == "Reunión de padres"


def test_google_disconnect(client: TestClient, session: Session):
    user = session.exec(select(User).where(User.email == "admin@test.com")).one()
    token = GoogleCalendarToken(
        user_id=user.id,
        access_token="access-token-1",
        refresh_token="refresh-token-1",
        expiry=datetime.now(timezone.utc) + timedelta(hours=1),
        active=True,
        scopes="https://www.googleapis.com/auth/calendar.events",
    )
    session.add(token)
    session.commit()

    access_token = _login(client)
    resp = client.delete(
        "/api/v1/google/disconnect",
        headers={"Authorization": f"Bearer {access_token}"},
    )
    assert resp.status_code == 200
    updated = session.exec(select(GoogleCalendarToken)).one()
    assert updated.active is False

