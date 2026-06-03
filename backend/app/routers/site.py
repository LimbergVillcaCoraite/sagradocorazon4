from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import select
from sqlmodel.ext.asyncio.session import AsyncSession
from uuid import UUID

from ..db import get_session
from ..models import SiteProfile
from ..schemas_site import SiteProfileRead, SiteProfileUpdate
from ..utils import get_current_user, require_role
from ..session_ops import session_exec, session_commit, session_refresh

router = APIRouter(prefix="/api/v1/site", tags=["site"])


def _default_profile() -> SiteProfile:
    return SiteProfile(
        school_name="U.E. Sagrado Corazón 4",
        tagline="Formamos con valores, educamos para la vida",
        hero_title="Sagrado Corazón 4",
        hero_subtitle="Promovemos el periodismo estudiantil para informar, inspirar y conectar a toda nuestra comunidad educativa.",
        hero_cta="Más información",
        hero_image_url="https://images.unsplash.com/photo-1523580846011-d3a5bc25702b?auto=format&fit=crop&w=1600&q=80",
        address="San Juan de Yapacaní, Bolivia",
        phone="+591 3 1234567",
        email="sagradocorazon4@ue.edu.bo",
        search_placeholder="Buscar noticias...",
        updated_at=datetime.utcnow(),
    )


async def _get_or_create_profile(session: AsyncSession) -> SiteProfile:
    q = select(SiteProfile).order_by(SiteProfile.updated_at.desc())
    res = await session_exec(session, q)
    profile = res.one_or_none()
    if profile:
        return profile
    profile = _default_profile()
    session.add(profile)
    await session_commit(session)
    await session_refresh(session, profile)
    return profile


@router.get("/profile", response_model=SiteProfileRead)
async def get_site_profile(session: AsyncSession = Depends(get_session)):
    return await _get_or_create_profile(session)


@router.put("/profile", response_model=SiteProfileRead)
async def update_site_profile(
    payload: SiteProfileUpdate,
    user_id: UUID = Depends(get_current_user),
    _: UUID = Depends(require_role("ADMIN")),
    session: AsyncSession = Depends(get_session),
):
    profile = await _get_or_create_profile(session)
    data = payload.model_dump(exclude_unset=True)
    if not data:
        return profile

    for key, value in data.items():
        setattr(profile, key, value)

    profile.updated_at = datetime.utcnow()
    session.add(profile)
    await session_commit(session)
    await session_refresh(session, profile)
    return profile

