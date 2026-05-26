from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlmodel import SQLModel, select
from sqlalchemy import text

from . import models
from .config import settings
from .db import engine, get_session  # noqa: F401 - re-exported for tests
from .auth import router as auth_router
from .routers import news as news_router
from .routers import notices as notices_router
from .routers import activities as activities_router
from .routers import uploads as uploads_router
from .routers import notifications as notifications_router
from .routers import google_calendar as google_calendar_router
from .routers import history as history_router
from .routers import site as site_router
from .storage_service import ensure_bucket_exists
from .utils import get_password_hash
from .session_ops import session_exec, session_commit, session_delete

app = FastAPI(title="U.E. Sagrado Corazón API")
__all__ = ["app", "get_session"]

# Be explicit about allowed origins so browsers receive a proper
# Access-Control-Allow-Origin value (don't use '*' when allow_credentials=True).
FRONTEND_ORIGINS = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=FRONTEND_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# include auth router
app.include_router(auth_router)
# include content routers
app.include_router(news_router.router)
app.include_router(notices_router.router)
app.include_router(activities_router.router)
# include uploads router
app.include_router(uploads_router.router)
# include notifications router
app.include_router(notifications_router.router)
# include google calendar router
app.include_router(google_calendar_router.router)
# include history router
app.include_router(history_router.router)
# include site router
app.include_router(site_router.router)


@app.on_event("startup")
async def on_startup():
    # create tables
    async with engine.begin() as conn:
        await conn.run_sync(SQLModel.metadata.create_all)
        await conn.execute(text("ALTER TABLE site_profile ADD COLUMN IF NOT EXISTS hero_image_url VARCHAR"))
    # seed roles and admin user
    from sqlmodel.ext.asyncio.session import AsyncSession as SQLAsyncSession
    async with SQLAsyncSession(engine) as session:
        # seed roles
        roles = ["ADMIN", "EDITOR", "PROFESSOR", "PARENT", "STUDENT", "GUEST"]
        for r in roles:
            q = select(models.Role).where(models.Role.name == r)
            res = await session_exec(session, q)
            if not res.one_or_none():
                session.add(models.Role(name=r))
        await session_commit(session)
        # seed admin user from secure environment variables
        admin_email = settings.admin_email
        admin_password = settings.admin_password
        if admin_email and admin_password:
            q = select(models.User).where(models.User.email == admin_email)
            res = await session_exec(session, q)
            admin_users = res.all()
            admin_user = admin_users[0] if admin_users else None
            for duplicate in admin_users[1:]:
                await session_delete(session, duplicate)

            q2 = select(models.Role).where(models.Role.name == "ADMIN")
            rres = await session_exec(session, q2)
            admin_role = rres.one_or_none()

            hashed = get_password_hash(admin_password)
            if admin_user:
                admin_user.name = settings.admin_name or admin_user.name or "Administrador"
                admin_user.password_hash = hashed
                admin_user.role_id = admin_role.id if admin_role else admin_user.role_id
                session.add(admin_user)
            else:
                admin_user = models.User(
                    name=settings.admin_name or "Administrador",
                    email=admin_email,
                    password_hash=hashed,
                    role_id=(admin_role.id if admin_role else None),
                )
                session.add(admin_user)
            await session_commit(session)

        # seed site profile
        q_profile = select(models.SiteProfile)
        profile_res = await session_exec(session, q_profile)
        if not profile_res.one_or_none():
            session.add(models.SiteProfile())
            await session_commit(session)


    # ensure MinIO bucket exists for uploads
    await ensure_bucket_exists()


# --- Simple health ---
@app.get("/api/v1/health")
async def health():
    return {"status": "ok"}


# Global exception handler that logs server-side errors so they can be
# inspected in container logs and returns a JSON 500 body. CORS middleware
# will still apply headers to this response.
from fastapi import Request
from fastapi.responses import JSONResponse
import traceback


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    # Log stacktrace to the application logs
    tb = traceback.format_exc()
    import logging

    logger = logging.getLogger("uvicorn.error")
    logger.error("Unhandled exception: %s\n%s", exc, tb)
    return JSONResponse(status_code=500, content={"detail": "Internal Server Error"})


# Google Calendar endpoints are implemented in `backend/app/routers/google_calendar.py`.

