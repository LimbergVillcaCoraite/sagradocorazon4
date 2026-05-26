from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import select
from sqlmodel.ext.asyncio.session import AsyncSession
from uuid import UUID

from ..db import get_session
from ..models import History
from ..utils import get_current_user, require_role
from ..schemas_history import HistoryRead, HistoryUpdate
from ..session_ops import session_exec, session_commit, session_refresh

router = APIRouter(prefix="/api/v1/history", tags=["history"])

async def _get_or_create_history(session: AsyncSession) -> History:
    q = select(History).order_by(History.updated_at.desc())
    res = await session_exec(session, q)
    history = res.one_or_none()
    if history:
        return history
    history = History(content="", updated_at=datetime.utcnow())
    session.add(history)
    await session_commit(session)
    await session_refresh(session, history)
    return history

@router.get("", response_model=HistoryRead)
async def get_history(session: AsyncSession = Depends(get_session)):
    return await _get_or_create_history(session)

@router.put("", response_model=HistoryRead)
async def update_history(
    payload: HistoryUpdate,
    user_id: UUID = Depends(get_current_user),
    _: UUID = Depends(require_role("ADMIN")),
    session: AsyncSession = Depends(get_session),
):
    history = await _get_or_create_history(session)
    history.content = payload.content
    history.last_updated_by = user_id
    history.updated_at = datetime.utcnow()
    session.add(history)
    await session_commit(session)
    await session_refresh(session, history)
    return history

