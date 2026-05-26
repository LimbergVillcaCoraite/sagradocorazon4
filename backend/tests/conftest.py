"""
Shared pytest fixtures for backend tests.
"""
import pytest
from fastapi.testclient import TestClient
from sqlmodel import Session, create_engine, select
from sqlmodel.pool import StaticPool
from app.main import app, get_session
from app.models import User, Role
from app.utils import get_password_hash, create_access_token


@pytest.fixture(name="session")
def session_fixture():
    """Fixture for test DB session (synchronous)."""
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


@pytest.fixture(name="admin_user")
def admin_user_fixture(session: Session):
    """Fixture for admin user."""
    # Create ADMIN role if not exists
    admin_role = session.query(Role).filter(Role.name == "ADMIN").first()
    if not admin_role:
        admin_role = Role(name="ADMIN", description="Administrator")
        session.add(admin_role)
        session.commit()
        session.refresh(admin_role)

    # Create admin user
    admin = User(
        name="Test Admin",
        email="admin@test.com",
        hashed_password=get_password_hash("adminpass123"),
        role_id=admin_role.id
    )
    session.add(admin)
    session.commit()
    session.refresh(admin)
    return admin


@pytest.fixture(name="editor_user")
def editor_user_fixture(session: Session):
    """Fixture for editor user."""
    # Create EDITOR role if not exists
    editor_role = session.query(Role).filter(Role.name == "EDITOR").first()
    if not editor_role:
        editor_role = Role(name="EDITOR", description="Editor")
        session.add(editor_role)
        session.commit()
        session.refresh(editor_role)

    # Create editor user
    editor = User(
        name="Test Editor",
        email="editor@test.com",
        hashed_password=get_password_hash("editorpass123"),
        role_id=editor_role.id
    )
    session.add(editor)
    session.commit()
    session.refresh(editor)
    return editor


@pytest.fixture(name="other_editor_user")
def other_editor_user_fixture(session: Session):
    """Fixture for second editor user (for permission tests)."""
    # Get EDITOR role
    editor_role = session.query(Role).filter(Role.name == "EDITOR").first()
    if not editor_role:
        editor_role = Role(name="EDITOR", description="Editor")
        session.add(editor_role)
        session.commit()
        session.refresh(editor_role)

    # Create second editor user
    editor = User(
        name="Other Editor",
        email="other.editor@test.com",
        hashed_password=get_password_hash("otherpass123"),
        role_id=editor_role.id
    )
    session.add(editor)
    session.commit()
    session.refresh(editor)
    return editor


@pytest.fixture(name="admin_token")
def admin_token_fixture(admin_user: User):
    """Fixture that returns JWT token for admin user."""
    return create_access_token(str(admin_user.id))


@pytest.fixture(name="editor_token")
def editor_token_fixture(editor_user: User):
    """Fixture that returns JWT token for editor user."""
    return create_access_token(str(editor_user.id))


@pytest.fixture(name="other_editor_token")
def other_editor_token_fixture(other_editor_user: User):
    """Fixture that returns JWT token for second editor user."""
    return create_access_token(str(other_editor_user.id))

