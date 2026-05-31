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
from .session_ops import session_exec, session_commit, session_delete, session_refresh
from .activity_scheduler import start_activity_scheduler

app = FastAPI(title="U.E. Sagrado Corazón API")
__all__ = ["app", "get_session"]

# Be explicit about allowed origins so browsers receive a proper
# Access-Control-Allow-Origin value (don't use '*' when allow_credentials=True).
FRONTEND_ORIGINS = settings.cors_allowed_origins

# Log the configured CORS origins on startup so it's easy to debug missing headers
import logging
logger = logging.getLogger("uvicorn")
logger.info("Configured CORS allowed origins: %s", FRONTEND_ORIGINS)

# If a wildcard origin is used, browsers don't allow Access-Control-Allow-Credentials
allow_credentials = True
if len(FRONTEND_ORIGINS) == 1 and FRONTEND_ORIGINS[0] == "*":
    allow_credentials = False

app.add_middleware(
    CORSMiddleware,
    allow_origins=FRONTEND_ORIGINS,
    allow_credentials=allow_credentials,
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
        try:
            await conn.run_sync(SQLModel.metadata.create_all)
        except Exception as e:
            # Ignore errors from existing tables/types (e.g., duplicate key errors)
            import logging
            logger = logging.getLogger("uvicorn")
            logger.warning(f"Warning during table creation (likely already exists): {str(e)}")
        try:
            await conn.execute(text("ALTER TABLE site_profile ADD COLUMN IF NOT EXISTS hero_image_url VARCHAR"))
            await conn.execute(text("ALTER TABLE \"user\" ADD COLUMN IF NOT EXISTS avatar_url VARCHAR"))
            await conn.execute(text("ALTER TABLE activity ADD COLUMN IF NOT EXISTS attachments_json TEXT"))
            await conn.execute(text("ALTER TABLE activity ADD COLUMN IF NOT EXISTS publish_at TIMESTAMP"))
            await conn.execute(text("ALTER TABLE activity ADD COLUMN IF NOT EXISTS created_by UUID"))
        except Exception as e:
            import logging
            logger = logging.getLogger("uvicorn")
            logger.warning(f"Warning during ALTER TABLE (columns may already exist): {str(e)}")
    # NOTE: seeding roles, admin user and example data was causing startup
    # failures in environments where the database already contains duplicate
    # rows (MultipleResultsFound). To avoid crashing the app on startup, the
    # automatic seeding has been disabled here. Use the `seed.py` script or
    # manual SQL to populate roles/users/albums when needed.


    # ensure MinIO bucket exists for uploads
    await ensure_bucket_exists()
    
    # Start background activity scheduler
    await start_activity_scheduler()


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

