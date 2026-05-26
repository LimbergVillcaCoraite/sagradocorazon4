import pytest
from fastapi.testclient import TestClient
from sqlmodel import Session, create_engine, select
from sqlmodel.pool import StaticPool

from app.main import app, get_session
from app.models import User, Role, History
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

    admin_role = Role(name="ADMIN")
    session.add(admin_role)
    session.commit()
    admin = User(name="Admin", email="admin@test.com", password_hash=get_password_hash("admin123"), role_id=admin_role.id)
    session.add(admin)
    session.commit()

    yield client
    app.dependency_overrides.clear()


def _login(client: TestClient) -> str:
    resp = client.post("/api/v1/auth/login", json={"email": "admin@test.com", "password": "admin123"})
    assert resp.status_code == 200
    return resp.json()["access_token"]


def test_get_history_creates_default_record(client: TestClient, session: Session):
    resp = client.get("/api/v1/history")
    assert resp.status_code == 200
    data = resp.json()
    assert "content" in data
    assert data["content"] == ""


def test_update_history(client: TestClient, session: Session):
    token = _login(client)
    resp = client.put(
        "/api/v1/history",
        headers={"Authorization": f"Bearer {token}"},
        json={"content": "Nuestra escuela fue fundada en 1980."},
    )
    assert resp.status_code == 200
    data = resp.json()
    assert data["content"] == "Nuestra escuela fue fundada en 1980."

    history = session.exec(select(History)).one()
    assert history.content == "Nuestra escuela fue fundada en 1980."

