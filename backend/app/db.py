from sqlmodel import SQLModel
from sqlmodel.ext.asyncio.session import AsyncSession
from sqlalchemy.ext.asyncio import create_async_engine
import os
from .config import settings

DATABASE_URL = os.getenv("DATABASE_URL", settings.database_url)

engine = create_async_engine(DATABASE_URL, echo=False)


async def get_session() -> AsyncSession:
    # Keep loaded attributes available after commit to avoid async lazy-load issues.
    async with AsyncSession(engine, expire_on_commit=False) as session:
        yield session
