from pydantic import BaseModel, Field, ConfigDict
from typing import Optional
from datetime import datetime
from uuid import UUID

class BrowserSubscriptionKeys(BaseModel):
    p256dh: str
    auth: str

class BrowserSubscriptionCreate(BaseModel):
    endpoint: str
    keys: BrowserSubscriptionKeys
    expirationTime: Optional[str] = None

class BrowserSubscriptionRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: UUID
    user_id: Optional[UUID]
    endpoint: str
    active: bool
    created_at: datetime

class NotificationCreate(BaseModel):
    title: str
    body: str
    audience: str = Field(default="all", pattern="^(all|students|parents|teachers)$")
    source_type: Optional[str] = None
    source_id: Optional[str] = None
    send_email: bool = True
    send_push: bool = True

class NotificationRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: UUID
    title: str
    body: str
    audience: str
    source_type: Optional[str]
    source_id: Optional[str]
    created_by: Optional[UUID]
    email_sent_count: int
    push_sent_count: int
    created_at: datetime

