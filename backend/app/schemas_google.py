from pydantic import BaseModel, Field, ConfigDict
from typing import Optional
from datetime import datetime
from uuid import UUID

class GoogleAuthUrlRead(BaseModel):
    url: str
    state: str

class GoogleCallbackRead(BaseModel):
    status: str
    connected: bool
    user_id: Optional[UUID] = None

class GoogleTokenRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: UUID
    user_id: Optional[UUID]
    active: bool
    calendar_id: Optional[str]
    expiry: Optional[datetime]
    created_at: datetime
    updated_at: datetime

class GoogleEventCreate(BaseModel):
    summary: str
    description: Optional[str] = None
    location: Optional[str] = None
    start: datetime
    end: datetime
    timezone: str = "America/La_Paz"
    calendar_id: Optional[str] = None
    send_updates: str = Field(default="all", pattern="^(all|externalOnly|none)$")

