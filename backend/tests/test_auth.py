import pytest
from fastapi.testclient import TestClient
from sqlmodel import Session, create_engine, select
from sqlmodel.pool import StaticPool
from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy.orm import sessionmaker
from typing import Optional

from app.main import app, get_session
from app.models import User, Role
from app.utils import get_password_hash, verify_password, create_access_token, decode_token


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
    yield client
    app.dependency_overrides.clear()


def ensure_role(session: Session, name: str) -> Role:
    role = session.exec(select(Role).where(Role.name == name)).first()
    if role:
        return role
    role = Role(name=name)
    session.add(role)
    session.commit()
    session.refresh(role)
    return role


def create_user(session: Session, *, name: str, email: str, password: str, role_name: str = "STUDENT", avatar_url: Optional[str] = None) -> User:
    role = ensure_role(session, role_name)
    user = User(name=name, email=email, password_hash=get_password_hash(password), role_id=role.id, avatar_url=avatar_url)
    session.add(user)
    session.commit()
    session.refresh(user)
    return user


def create_admin_token(session: Session) -> str:
    admin = create_user(session, name="Admin User", email="admin@example.com", password="adminpass", role_name="ADMIN")
    return create_access_token(str(admin.id))


def test_register_user_requires_admin(client: TestClient):
    """Non-admins should not be able to create users."""
    response = client.post(
        "/api/v1/auth/register",
        json={
            "name": "Test User",
            "email": "test@example.com",
            "password": "password123",
        },
    )
    assert response.status_code in (401, 403)


def test_admin_can_register_user(client: TestClient, session: Session):
    """Admin can create accounts and receive the new avatar field."""
    token = create_admin_token(session)
    response = client.post(
        "/api/v1/auth/register",
        headers={"Authorization": f"Bearer {token}"},
        json={
            "name": "Test User",
            "email": "test@example.com",
            "password": "password123",
            "role_name": "STUDENT",
            "avatar_url": "https://example.com/avatar.png",
        },
    )
    assert response.status_code == 200
    data = response.json()
    assert data["email"] == "test@example.com"
    assert data["name"] == "Test User"
    assert data["avatar_url"] == "https://example.com/avatar.png"
    assert data["role_name"] == "STUDENT"
    assert data["role_id"] is not None
    assert "id" in data


def test_non_admin_cannot_create_users_or_assign_roles(client: TestClient, session: Session):
    """A student token must not be able to hit user creation endpoints."""
    student = create_user(session, name="Student User", email="student@example.com", password="studentpass", role_name="STUDENT")
    token = create_access_token(str(student.id))
    response = client.post(
        "/api/v1/auth/users",
        headers={"Authorization": f"Bearer {token}"},
        json={
            "name": "Blocked User",
            "email": "blocked@example.com",
            "password": "password123",
            "role_name": "ADMIN",
        },
    )
    assert response.status_code == 403


def test_admin_cannot_assign_unknown_role(client: TestClient, session: Session):
    """Role assignment should only allow known platform roles."""
    token = create_admin_token(session)
    response = client.post(
        "/api/v1/auth/users",
        headers={"Authorization": f"Bearer {token}"},
        json={
            "name": "Role Test",
            "email": "roletest@example.com",
            "password": "password123",
            "role_name": "SUPERADMIN",
        },
    )
    assert response.status_code == 400
    assert "Invalid role" in response.json()["detail"]


def test_register_duplicate_email(client: TestClient, session: Session):
    """Test registering with duplicate email."""
    token = create_admin_token(session)
    # First registration
    client.post(
        "/api/v1/auth/register",
        headers={"Authorization": f"Bearer {token}"},
        json={
            "name": "Test User",
            "email": "test@example.com",
            "password": "password123",
        },
    )
    # Second registration with same email
    response = client.post(
        "/api/v1/auth/register",
        headers={"Authorization": f"Bearer {token}"},
        json={
            "name": "Another User",
            "email": "test@example.com",
            "password": "password456",
        },
    )
    assert response.status_code == 400
    assert "already registered" in response.json()["detail"]


def test_login_success(client: TestClient, session: Session):
    """Test successful login."""
    create_user(session, name="Test User", email="test@example.com", password="password123")
    # Login
    response = client.post(
        "/api/v1/auth/login",
        json={
            "email": "test@example.com",
            "password": "password123",
        },
    )
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert "refresh_token" in data
    assert data["token_type"] == "bearer"


def test_login_invalid_password(client: TestClient, session: Session):
    """Test login with incorrect password."""
    create_user(session, name="Test User", email="test@example.com", password="password123")
    # Try to login with wrong password
    response = client.post(
        "/api/v1/auth/login",
        json={
            "email": "test@example.com",
            "password": "wrongpassword",
        },
    )
    assert response.status_code == 401
    assert "Invalid credentials" in response.json()["detail"]


def test_login_nonexistent_user(client: TestClient):
    """Test login with non-existent user."""
    response = client.post(
        "/api/v1/auth/login",
        json={
            "email": "nonexistent@example.com",
            "password": "password123",
        },
    )
    assert response.status_code == 401


def test_refresh_token(client: TestClient, session: Session):
    """Test token refresh."""
    # Create user and login
    create_user(session, name="Test User", email="test@example.com", password="password123")
    login_response = client.post(
        "/api/v1/auth/login",
        json={
            "email": "test@example.com",
            "password": "password123",
        },
    )
    refresh_token = login_response.json()["refresh_token"]

    # Refresh
    response = client.post(
        "/api/v1/auth/refresh",
        json={"refresh_token": refresh_token},
    )
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert "refresh_token" in data


def test_refresh_invalid_token(client: TestClient):
    """Test refresh with invalid token."""
    response = client.post(
        "/api/v1/auth/refresh",
        json={"refresh_token": "invalid_token"},
    )
    assert response.status_code == 401


def test_password_hashing():
    """Test password hashing utilities."""
    password = "test_password"
    hashed = get_password_hash(password)
    assert hashed != password
    assert verify_password(password, hashed)
    assert not verify_password("wrong_password", hashed)


def test_token_creation_and_decode():
    """Test JWT token creation and decoding."""
    user_id = "test-user-123"
    token = create_access_token(user_id, expires_minutes=60)
    payload = decode_token(token)
    assert payload is not None
    assert payload["sub"] == user_id
    assert payload["type"] == "access"

    # Test invalid token
    assert decode_token("invalid_token") is None

