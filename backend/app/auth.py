from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from sqlmodel import select
from typing import Optional, List
from .schemas import UserCreate, UserLogin, Token, TokenRefresh, UserRead, UserUpdate
from .models import User, Role
from .utils import get_password_hash, verify_password, create_access_token, create_refresh_token, decode_token, get_current_user, require_role
from .db import get_session
from .session_ops import session_exec, session_commit, session_refresh
from sqlmodel.ext.asyncio.session import AsyncSession
from uuid import UUID
from .storage_service import upload_file, generate_file_path
import logging

logger = logging.getLogger("uvicorn")

router = APIRouter(prefix="/api/v1/auth", tags=["auth"])

ALLOWED_ROLE_NAMES = {"STUDENT", "EDITOR", "PROFESSOR", "ADMIN", "PARENT", "GUEST"}


# Spanish label -> internal name mapping (frontend displays Spanish labels)
ROLE_LABELS_ES_TO_INTERNAL = {
    "ESTUDIANTE": "STUDENT",
    "EDITOR": "EDITOR",
    "PROFESOR": "PROFESSOR",
    "ADMIN": "ADMIN",
    "PADRE": "PARENT",
    "INVITADO": "GUEST",
}

def _to_user_read(user: User, role_name: Optional[str] = None) -> UserRead:
    return UserRead(
        id=str(user.id),
        name=user.name,
        email=user.email,
        avatar_url=getattr(user, "avatar_url", None),
        role_id=(str(user.role_id) if user.role_id else None),
        role_name=role_name,
    )


async def _resolve_role(session: AsyncSession, role_name: Optional[str]):
    # Accept either internal role names or Spanish labels from the frontend.
    raw = (role_name or "STUDENT").strip().upper() or "STUDENT"

    # Map Spanish label to internal name if provided
    desired = ROLE_LABELS_ES_TO_INTERNAL.get(raw, raw)

    if desired not in ALLOWED_ROLE_NAMES:
        raise HTTPException(status_code=400, detail=f"Invalid role: {desired}")
    role_q = select(Role).where(Role.name == desired)
    role_res = await session_exec(session, role_q)
    role = role_res.first()
    if not role:
        role = Role(name=desired)
        session.add(role)
        await session_commit(session)
        await session_refresh(session, role)
    return role, desired


async def _create_user(session: AsyncSession, payload: UserCreate):
    q = select(User).where(User.email == payload.email)
    res = await session_exec(session, q)
    existing = res.first()
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")

    try:
        hashed = get_password_hash(payload.password)
        role, role_name = await _resolve_role(session, payload.role_name)
        user = User(
            name=payload.name,
            email=payload.email,
            password_hash=hashed,
            avatar_url=payload.avatar_url,
            role_id=(role.id if role else None),
        )
        session.add(user)
        await session_commit(session)
        await session_refresh(session, user)
        return _to_user_read(user, role_name=role.name if role else role_name)
    except Exception as e:
        logger.error(f"Error creating user: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"No se pudo crear el usuario: {str(e)}")


@router.post("/register", response_model=UserRead)
async def register(payload: UserCreate, session: AsyncSession = Depends(get_session), _: UUID = Depends(require_role("ADMIN"))):
    return await _create_user(session, payload)


@router.post("/users", response_model=UserRead)
async def create_user(payload: UserCreate, session: AsyncSession = Depends(get_session), _: UUID = Depends(require_role("ADMIN"))):
    return await _create_user(session, payload)


@router.get("/users", response_model=List[UserRead])
async def list_users(session: AsyncSession = Depends(get_session), _: UUID = Depends(require_role("ADMIN"))):
    q = select(User)
    res = await session_exec(session, q)
    users = res.all()
    results = []
    for user in users:
        role_name = None
        if user.role_id:
            role_q = select(Role).where(Role.id == user.role_id)
            role_res = await session_exec(session, role_q)
            role = role_res.first()
            role_name = role.name if role else None
        results.append(_to_user_read(user, role_name=role_name))
    return results


@router.post("/login", response_model=Token)
async def login(payload: UserLogin, session: AsyncSession = Depends(get_session)):
    q = select(User).where(User.email == payload.email)
    res = await session_exec(session, q)
    user = res.first()
    if not user or not verify_password(payload.password, user.password_hash):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")
    role_name = None
    if user.role_id:
        role_q = select(Role).where(Role.id == user.role_id)
        role_res = await session_exec(session, role_q)
        role = role_res.first()
        role_name = role.name if role else None
    access = create_access_token(str(user.id))
    refresh = create_refresh_token(str(user.id))
    return Token(access_token=access, refresh_token=refresh)


@router.post("/refresh", response_model=Token)
async def refresh_token(payload: TokenRefresh):
    data = decode_token(payload.refresh_token)
    if not data or data.get("type") != "refresh":
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid refresh token")
    sub = data.get("sub")
    access = create_access_token(sub)
    refresh = create_refresh_token(sub)
    return Token(access_token=access, refresh_token=refresh)


@router.get("/me", response_model=UserRead)
async def get_me(user_id: UUID = Depends(get_current_user), session: AsyncSession = Depends(get_session)):
    q = select(User).where(User.id == user_id)
    res = await session_exec(session, q)
    user = res.first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    role_name = None
    if user.role_id:
        q_role = select(Role).where(Role.id == user.role_id)
        res_role = await session_exec(session, q_role)
        role = res_role.first()
        role_name = role.name if role else None
    return _to_user_read(user, role_name=role_name)


@router.post("/me/avatar", response_model=UserRead)
async def upload_user_avatar(
    file: UploadFile = File(...),
    user_id: UUID = Depends(get_current_user),
    session: AsyncSession = Depends(get_session)
):
    """Upload user profile avatar."""
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File must be an image")
    
    try:
        # Get current user
        q = select(User).where(User.id == user_id)
        res = await session_exec(session, q)
        user = res.first()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        # Read file
        content = await file.read()
        
        # Generate file path
        file_path = generate_file_path(file.filename, prefix="avatars")
        
        # Upload to storage
        avatar_url = await upload_file(file_path, content, file.content_type)
        
        # Update user
        user.avatar_url = avatar_url
        session.add(user)
        await session_commit(session)
        await session_refresh(session, user)
        
        # Get role name
        role_name = None
        if user.role_id:
            role_q = select(Role).where(Role.id == user.role_id)
            role_res = await session_exec(session, role_q)
            role = role_res.first()
            role_name = role.name if role else None
        
        return _to_user_read(user, role_name=role_name)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error uploading avatar: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"No se pudo subir la foto de perfil: {str(e)}")

@router.post("/users/{user_id}/avatar", response_model=UserRead)
async def admin_upload_user_avatar(
    user_id: UUID,
    file: UploadFile = File(...),
    session: AsyncSession = Depends(get_session),
    _: UUID = Depends(require_role("ADMIN")),
):
    """Admin endpoint to upload avatar for any user by id."""
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File must be an image")
    try:
        q = select(User).where(User.id == user_id)
        res = await session_exec(session, q)
        user = res.first()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        content = await file.read()
        file_path = generate_file_path(file.filename, prefix="avatars")
        avatar_url = await upload_file(file_path, content, file.content_type)
        user.avatar_url = avatar_url
        session.add(user)
        await session_commit(session)
        await session_refresh(session, user)
        role_name = None
        if user.role_id:
            role_q = select(Role).where(Role.id == user.role_id)
            role_res = await session_exec(session, role_q)
            role = role_res.first()
            role_name = role.name if role else None
        return _to_user_read(user, role_name=role_name)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error uploading avatar for user {user_id}: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"No se pudo subir la foto de perfil: {str(e)}")


@router.put("/users/{user_id}", response_model=UserRead)
async def update_user_admin(user_id: UUID, payload: UserUpdate, session: AsyncSession = Depends(get_session), _: UUID = Depends(require_role("ADMIN"))):
    q = select(User).where(User.id == user_id)
    res = await session_exec(session, q)
    user = res.first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    try:
        if payload.name is not None:
            user.name = payload.name
        if payload.email is not None:
            user.email = payload.email
        if payload.avatar_url is not None:
            user.avatar_url = payload.avatar_url
        if payload.role_name is not None:
            role, resolved = await _resolve_role(session, payload.role_name)
            user.role_id = role.id if role else None
        if payload.password:
            user.password_hash = get_password_hash(payload.password)
        session.add(user)
        await session_commit(session)
        await session_refresh(session, user)
        role_name = None
        if user.role_id:
            role_q = select(Role).where(Role.id == user.role_id)
            role_res = await session_exec(session, role_q)
            role = role_res.first()
            role_name = role.name if role else None
        return _to_user_read(user, role_name=role_name)
    except Exception as e:
        logger.error(f"Error updating user {user_id}: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"No se pudo actualizar el usuario: {str(e)}")

