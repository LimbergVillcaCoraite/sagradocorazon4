from pydantic import BaseModel, Field, ConfigDict
from typing import Optional, List
from datetime import datetime
from uuid import UUID

class NewsAttachment(BaseModel):
    id: str
    url: str
    storage_path: Optional[str] = None
    filename: str
    content_type: str
    kind: str  # image | document
    caption: Optional[str] = None
    created_at: datetime

# News schemas
class NewsCreate(BaseModel):
    title: str
    slug: Optional[str] = None
    excerpt: Optional[str] = None
    content: str
    cover_image: Optional[str] = None
    status: str = "draft"  # draft | published
    category_id: Optional[UUID] = None

class NewsUpdate(BaseModel):
    title: Optional[str] = None
    excerpt: Optional[str] = None
    content: Optional[str] = None
    cover_image: Optional[str] = None
    status: Optional[str] = None
    category_id: Optional[UUID] = None

class NewsRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: UUID
    title: str
    slug: str
    excerpt: Optional[str]
    content: str
    cover_image: Optional[str]
    attachments: List[NewsAttachment] = Field(default_factory=list)
    status: str
    author_id: Optional[UUID]
    author_name: Optional[str] = None
    created_at: datetime
    updated_at: datetime

# Notice schemas
class NoticeCreate(BaseModel):
    title: str
    content: str
    audience: str = "all"  # all | students | parents | teachers
    pinned: bool = False
    start_at: Optional[datetime] = None
    end_at: Optional[datetime] = None

class NoticeUpdate(BaseModel):
    title: Optional[str] = None
    content: Optional[str] = None
    audience: Optional[str] = None
    pinned: Optional[bool] = None
    start_at: Optional[datetime] = None
    end_at: Optional[datetime] = None

class NoticeRead(BaseModel):
    model_config = ConfigDict(from_attributes=True, populate_by_name=True, exclude_none=False)
    id: UUID
    title: str
    content: str
    audience: str
    pinned: bool
    created_at: datetime
    start_at: Optional[datetime] = None
    end_at: Optional[datetime] = None
    created_by: Optional[UUID] = None
    created_by_name: Optional[str] = None  # Will be populated from User

# Activity schemas
class ActivityCreate(BaseModel):
    title: str
    description: Optional[str] = None
    date: Optional[datetime] = None
    location: Optional[str] = None
    cover_image: Optional[str] = None
    publish_at: Optional[datetime] = None
    activity_type: Optional[str] = None  # deportiva | cultural | academica

class ActivityUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    date: Optional[datetime] = None
    location: Optional[str] = None
    cover_image: Optional[str] = None
    publish_at: Optional[datetime] = None
    activity_type: Optional[str] = None


class ActivityAttachment(BaseModel):
    id: str
    url: str
    storage_path: Optional[str] = None
    filename: str
    content_type: str
    kind: str  # image | video | audio | document
    caption: Optional[str] = None
    created_at: datetime

class ActivityRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: UUID
    title: str
    description: Optional[str]
    date: Optional[datetime]
    location: Optional[str]
    cover_image: Optional[str]
    attachments: List[ActivityAttachment] = Field(default_factory=list)
    publish_at: Optional[datetime]
    activity_type: Optional[str]
    created_at: datetime

# Pagination
class PaginationParams(BaseModel):
    page: int = Field(ge=1, default=1)
    limit: int = Field(ge=1, le=100, default=10)
    q: Optional[str] = None  # search query
    sort_by: Optional[str] = None  # created_at, title, etc.
    sort_order: Optional[str] = "desc"  # asc | desc

