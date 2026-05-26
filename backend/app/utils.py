from jose import jwt, JWTError
from datetime import datetime, timedelta
import base64
import hashlib
import hmac
import secrets
from typing import Optional
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlmodel import select
from uuid import UUID
from .config import settings
from .session_ops import session_exec

ALGORITHM = "HS256"
security = HTTPBearer()

_HASH_PREFIX = "pbkdf2_sha256$"
_PBKDF2_ITERATIONS = 210000

def get_password_hash(password: str) -> str:
    salt = secrets.token_hex(16)
    digest = hashlib.pbkdf2_hmac(
        "sha256",
        password.encode("utf-8"),
        salt.encode("utf-8"),
        _PBKDF2_ITERATIONS,
    )
    encoded = base64.b64encode(digest).decode("ascii")
    return f"{_HASH_PREFIX}{_PBKDF2_ITERATIONS}${salt}${encoded}"

def verify_password(plain_password: str, hashed_password: str) -> bool:
    try:
        if not hashed_password.startswith(_HASH_PREFIX):
            return False
        _, iterations, salt, encoded = hashed_password.split("$", 3)
        expected = base64.b64decode(encoded.encode("ascii"))
        test = hashlib.pbkdf2_hmac(
            "sha256",
            plain_password.encode("utf-8"),
            salt.encode("utf-8"),
            int(iterations),
        )
        return hmac.compare_digest(test, expected)
    except Exception:
        return False

def create_access_token(subject: str, expires_minutes: int = 1440) -> str:
    expire = datetime.utcnow() + timedelta(minutes=expires_minutes)
    to_encode = {"sub": subject, "exp": expire, "type": "access"}
    return jwt.encode(to_encode, settings.secret_key, algorithm=ALGORITHM)

def create_refresh_token(subject: str, expires_days: int = 7) -> str:
    expire = datetime.utcnow() + timedelta(days=expires_days)
    to_encode = {"sub": subject, "exp": expire, "type": "refresh"}
    return jwt.encode(to_encode, settings.secret_key, algorithm=ALGORITHM)

def decode_token(token: str) -> Optional[dict]:
    try:
        payload = jwt.decode(token, settings.secret_key, algorithms=[ALGORITHM])
        return payload
    except JWTError:
        return None

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    token = credentials.credentials
    payload = decode_token(token)
    if not payload or payload.get("type") != "access":
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")
    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token missing user id")
    try:
        return UUID(user_id)
    except ValueError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token subject")

def require_role(*allowed_roles: str):
    from .db import get_session
    from .models import User, Role

    async def check_role(user_id: UUID = Depends(get_current_user), session = Depends(get_session)):

        q = select(User).where(User.id == user_id)
        res = await session_exec(session, q)
        user = res.one_or_none()
        if not user or not user.role_id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="No role assigned")

        q2 = select(Role).where(Role.id == user.role_id)
        res2 = await session_exec(session, q2)
        role = res2.one_or_none()
        if not role or role.name not in allowed_roles:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=f"Role {role.name if role else 'unknown'} not allowed")
        return user_id

    return check_role

