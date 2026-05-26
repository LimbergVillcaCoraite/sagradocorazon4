import pytest
from fastapi.testclient import TestClient
from sqlmodel import Session, create_engine, select
from sqlmodel.pool import StaticPool
from datetime import datetime
import json

from app.main import app, get_session
from app.models import User, Role, News, Notice, Activity
from app.utils import get_password_hash


@pytest.fixture(name="session")
def session_fixture():
    """Fixture for test DB session."""
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
    """Fixture for test client."""
    def get_session_override():
        return session

    app.dependency_overrides[get_session] = get_session_override
    client = TestClient(app)

    # Seed roles and admin
    role_admin = Role(name="ADMIN")
    role_editor = Role(name="EDITOR")
    role_prof = Role(name="PROFESSOR")
    session.add(role_admin)
    session.add(role_editor)
    session.add(role_prof)
    session.commit()

    # Create admin user
    admin_user = User(
        name="Admin",
        email="admin@test.com",
        password_hash=get_password_hash("admin123"),
        role_id=role_admin.id
    )
    session.add(admin_user)
    session.commit()

    yield client
    app.dependency_overrides.clear()


def test_list_news_empty(client: TestClient):
    """Test listing news when empty."""
    response = client.get("/api/v1/news")
    assert response.status_code == 200
    assert response.json() == []


def test_create_news(client: TestClient, session: Session):
    """Test creating news."""
    # Login first
    login_resp = client.post(
        "/api/v1/auth/login",
        json={"email": "admin@test.com", "password": "admin123"}
    )
    token = login_resp.json()["access_token"]

    # Create news
    response = client.post(
        "/api/v1/news",
        headers={"Authorization": f"Bearer {token}"},
        json={
            "title": "Test News",
            "content": "Test content",
            "status": "draft"
        }
    )
    assert response.status_code == 200
    data = response.json()
    assert data["title"] == "Test News"
    assert data["slug"] == "test-news"
    assert data["status"] == "draft"


def test_get_news_by_slug(client: TestClient, session: Session):
    """Test getting published news by slug."""
    # Create news directly in session
    news = News(
        title="Published News",
        slug="published-news",
        content="Content",
        status="published",
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow()
    )
    session.add(news)
    session.commit()

    # Get it
    response = client.get("/api/v1/news/published-news")
    assert response.status_code == 200
    data = response.json()
    assert data["title"] == "Published News"


def test_create_notice(client: TestClient, session: Session):
    """Test creating notice."""
    # Login
    login_resp = client.post(
        "/api/v1/auth/login",
        json={"email": "admin@test.com", "password": "admin123"}
    )
    token = login_resp.json()["access_token"]

    # Create notice
    response = client.post(
        "/api/v1/notices",
        headers={"Authorization": f"Bearer {token}"},
        json={
            "title": "Important Notice",
            "content": "Notice content",
            "audience": "students"
        }
    )
    assert response.status_code == 200
    data = response.json()
    assert data["title"] == "Important Notice"
    assert data["audience"] == "students"


def test_list_notices(client: TestClient, session: Session):
    """Test listing notices."""
    # Create notice in session
    role = session.exec(select(Role)).first()
    user = session.exec(select(User)).first()

    notice = Notice(
        title="Test Notice",
        content="Content",
        audience="all",
        created_by=user.id,
        created_at=datetime.utcnow()
    )
    session.add(notice)
    session.commit()

    # List
    response = client.get("/api/v1/notices")
    assert response.status_code == 200
    data = response.json()
    assert len(data) > 0
    assert data[0]["title"] == "Test Notice"


def test_create_activity(client: TestClient, session: Session):
    """Test creating activity."""
    # Login
    login_resp = client.post(
        "/api/v1/auth/login",
        json={"email": "admin@test.com", "password": "admin123"}
    )
    token = login_resp.json()["access_token"]

    # Create activity
    response = client.post(
        "/api/v1/activities",
        headers={"Authorization": f"Bearer {token}"},
        json={
            "title": "Soccer Match",
            "description": "Friendly match",
            "activity_type": "deportiva",
            "location": "Sports field"
        }
    )
    assert response.status_code == 200
    data = response.json()
    assert data["title"] == "Soccer Match"
    assert data["activity_type"] == "deportiva"


def test_list_activities(client: TestClient, session: Session):
    """Test listing activities."""
    # Create activity
    activity = Activity(
        title="Test Activity",
        description="Description",
        activity_type="cultural",
        created_at=datetime.utcnow()
    )
    session.add(activity)
    session.commit()

    # List
    response = client.get("/api/v1/activities")
    assert response.status_code == 200
    data = response.json()
    assert len(data) > 0
    assert data[0]["title"] == "Test Activity"

