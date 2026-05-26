from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import select
from typing import Optional
from .schemas import UserCreate, UserLogin, Token, TokenRefresh, UserRead
from .models import User, Role
from .utils import get_password_hash, verify_password, create_access_token, create_refresh_token, decode_token, get_current_user
from .db import get_session
from .session_ops import session_exec, session_commit, session_refresh
from sqlmodel.ext.asyncio.session import AsyncSession
from uuid import UUID

router = APIRouter(prefix="/api/v1/auth", tags=["auth"])


def _to_user_read(user: User, role_name: Optional[str] = None) -> UserRead:
    return UserRead(
        id=str(user.id),
        name=user.name,
        email=user.email,
        role_id=(str(user.role_id) if user.role_id else None),
        role_name=role_name,
    )


@router.post("/register", response_model=UserRead)
async def register(payload: UserCreate, session: AsyncSession = Depends(get_session)):
    # check existing
    q = select(User).where(User.email == payload.email)
    res = await session_exec(session, q)
    existing = res.first()
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    hashed = get_password_hash(payload.password)
    # default role: STUDENT
    role_q = select(Role).where(Role.name == "STUDENT")
    role_res = await session_exec(session, role_q)
    role = role_res.one_or_none()
    role_name = role.name if role else "STUDENT"
    user = User(name=payload.name, email=payload.email, password_hash=hashed, role_id=(role.id if role else None))
    session.add(user)
    await session_commit(session)
    await session_refresh(session, user)
    return _to_user_read(user, role_name=role_name)


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
        role = role_res.one_or_none()
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
    user = res.one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    role_name = None
    if user.role_id:
        q_role = select(Role).where(Role.id == user.role_id)
        res_role = await session_exec(session, q_role)
        role = res_role.one_or_none()
        role_name = role.name if role else None
    return _to_user_read(user, role_name=role_name)

