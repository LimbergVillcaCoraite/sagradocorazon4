import pytest
from fastapi.testclient import TestClient
from sqlmodel import Session, create_engine, select
from sqlmodel.pool import StaticPool

from app.main import app, get_session
from app.models import User, Role, PushSubscription, Notification
from app.utils import get_password_hash


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
def client_fixture(session: Session):
    def get_session_override():
        return session

    app.dependency_overrides[get_session] = get_session_override
    client = TestClient(app)

    # seed roles
    admin_role = Role(name="ADMIN")
    professor_role = Role(name="PROFESSOR")
    student_role = Role(name="STUDENT")
    session.add(admin_role)
    session.add(professor_role)
    session.add(student_role)
    session.commit()

    # seed users
    admin = User(name="Admin", email="admin@test.com", password_hash=get_password_hash("admin123"), role_id=admin_role.id)
    professor = User(name="Prof", email="prof@test.com", password_hash=get_password_hash("prof123"), role_id=professor_role.id)
    student = User(name="Stud", email="stud@test.com", password_hash=get_password_hash("stud123"), role_id=student_role.id)
    session.add(admin)
    session.add(professor)
    session.add(student)
    session.commit()

    yield client
    app.dependency_overrides.clear()


def _login(client: TestClient, email: str, password: str) -> str:
    resp = client.post("/api/v1/auth/login", json={"email": email, "password": password})
    assert resp.status_code == 200
    return resp.json()["access_token"]


def test_subscribe_device(client: TestClient, session: Session):
    token = _login(client, "stud@test.com", "stud123")
    payload = {
        "endpoint": "https://push.example/sub/1",
        "keys": {"p256dh": "key1", "auth": "auth1"},
        "expirationTime": None,
    }
    resp = client.post(
        "/api/v1/notifications/subscribe",
        headers={"Authorization": f"Bearer {token}"},
        json=payload,
    )
    assert resp.status_code == 200
    data = resp.json()
    assert data["endpoint"] == payload["endpoint"]
    assert data["active"] is True

    sub = session.exec(select(PushSubscription).where(PushSubscription.endpoint == payload["endpoint"])).one_or_none()
    assert sub is not None
    assert sub.p256dh == "key1"


def test_send_notification_and_dispatch(client: TestClient, session: Session, monkeypatch):
    token = _login(client, "admin@test.com", "admin123")

    # create a subscription for student
    sub = PushSubscription(
        user_id=session.exec(select(User).where(User.email == "stud@test.com")).one().id,
        endpoint="https://push.example/sub/2",
        p256dh="key2",
        auth="auth2",
        active=True,
    )
    session.add(sub)
    session.commit()

    sent_emails = []
    sent_pushes = []

    async def fake_send_email(subject, body, recipients):
        sent_emails.append((subject, body, recipients))

    def fake_send_web_push(subscription_info, title, body):
        sent_pushes.append((subscription_info, title, body))

    monkeypatch.setattr("app.routers.notifications.notification_service.send_email", fake_send_email)
    monkeypatch.setattr("app.routers.notifications.notification_service.send_web_push", fake_send_web_push)

    resp = client.post(
        "/api/v1/notifications/send",
        headers={"Authorization": f"Bearer {token}"},
        json={
            "title": "Aviso importante",
            "body": "Se realizará reunión mañana",
            "audience": "students",
            "send_email": True,
            "send_push": True,
        },
    )
    assert resp.status_code == 200
    data = resp.json()
    assert data["title"] == "Aviso importante"
    assert data["email_sent_count"] == 1
    assert data["push_sent_count"] == 1

    assert len(sent_emails) == 1
    assert sent_emails[0][2] == ["stud@test.com"]
    assert len(sent_pushes) == 1
    assert sent_pushes[0][1] == "Aviso importante"

    stored = session.exec(select(Notification).where(Notification.title == "Aviso importante")).one_or_none()
    assert stored is not None
    assert stored.audience == "students"


def test_my_notifications(client: TestClient, session: Session, monkeypatch):
    token = _login(client, "stud@test.com", "stud123")

    n1 = Notification(title="General", body="Todos", audience="all")
    n2 = Notification(title="Students only", body="Solo estudiantes", audience="students")
    n3 = Notification(title="Parents only", body="Solo padres", audience="parents")
    session.add(n1)
    session.add(n2)
    session.add(n3)
    session.commit()

    resp = client.get("/api/v1/notifications/me", headers={"Authorization": f"Bearer {token}"})
    assert resp.status_code == 200
    data = resp.json()
    titles = [item["title"] for item in data]
    assert "General" in titles
    assert "Students only" in titles
    assert "Parents only" not in titles


def test_unsubscribe_device(client: TestClient, session: Session):
    token = _login(client, "stud@test.com", "stud123")
    user = session.exec(select(User).where(User.email == "stud@test.com")).one()
    sub = PushSubscription(
        user_id=user.id,
        endpoint="https://push.example/sub/3",
        p256dh="key3",
        auth="auth3",
        active=True,
    )
    session.add(sub)
    session.commit()

    resp = client.delete(
        "/api/v1/notifications/subscribe",
        params={"endpoint": sub.endpoint},
        headers={"Authorization": f"Bearer {token}"},
    )
    assert resp.status_code == 200
    updated = session.exec(select(PushSubscription).where(PushSubscription.endpoint == sub.endpoint)).one()
    assert updated.active is False

