from pydantic import BaseModel, ConfigDict
from typing import Optional
from datetime import datetime
from uuid import UUID


class SiteProfileRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: UUID
    school_name: str
    tagline: Optional[str]
    hero_title: Optional[str]
    hero_subtitle: Optional[str]
    hero_cta: Optional[str]
    hero_image_url: Optional[str]
    address: Optional[str]
    phone: Optional[str]
    email: Optional[str]
    facebook_url: Optional[str]
    instagram_url: Optional[str]
    youtube_url: Optional[str]
    search_placeholder: Optional[str]
    updated_at: datetime


class SiteProfileUpdate(BaseModel):
    school_name: Optional[str] = None
    tagline: Optional[str] = None
    hero_title: Optional[str] = None
    hero_subtitle: Optional[str] = None
    hero_cta: Optional[str] = None
    hero_image_url: Optional[str] = None
    address: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    facebook_url: Optional[str] = None
    instagram_url: Optional[str] = None
    youtube_url: Optional[str] = None
    search_placeholder: Optional[str] = None

