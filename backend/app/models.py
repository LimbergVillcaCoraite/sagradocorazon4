from typing import Optional
from sqlmodel import SQLModel, Field, Relationship
from datetime import datetime
from uuid import uuid4, UUID
from pydantic import ConfigDict

class Role(SQLModel, table=True):
    id: Optional[UUID] = Field(default_factory=uuid4, primary_key=True)
    name: str

class User(SQLModel, table=True):
    id: Optional[UUID] = Field(default_factory=uuid4, primary_key=True)
    name: str
    email: str
    password_hash: str
    role_id: Optional[UUID] = Field(default=None, foreign_key="role.id")

class News(SQLModel, table=True):
    id: Optional[UUID] = Field(default_factory=uuid4, primary_key=True)
    title: str
    slug: str
    excerpt: Optional[str] = None
    content: Optional[str] = None
    cover_image: Optional[str] = None
    attachments_json: Optional[str] = None
    status: str = "draft"  # draft|published
    publish_at: Optional[datetime] = None
    author_id: Optional[UUID] = Field(default=None, foreign_key="user.id")
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class Notice(SQLModel, table=True):
    model_config = ConfigDict(extra="allow")

    id: Optional[UUID] = Field(default_factory=uuid4, primary_key=True)
    title: str
    content: str
    audience: str = "all"  # students|parents|teachers|all
    start_at: Optional[datetime] = None
    end_at: Optional[datetime] = None
    pinned: bool = False
    created_by: Optional[UUID] = Field(default=None, foreign_key="user.id")
    created_at: datetime = Field(default_factory=datetime.utcnow)
    # Relationship to get creator details
    creator: Optional["User"] = Relationship(back_populates=None)

class Activity(SQLModel, table=True):
    id: Optional[UUID] = Field(default_factory=uuid4, primary_key=True)
    title: str
    description: Optional[str] = None
    date: Optional[datetime] = None
    location: Optional[str] = None
    cover_image: Optional[str] = None
    attachments_json: Optional[str] = None
    publish_at: Optional[datetime] = None
    activity_type: Optional[str] = None  # deportiva|cultural|academica
    created_at: datetime = Field(default_factory=datetime.utcnow)

class Gallery(SQLModel, table=True):
    id: Optional[UUID] = Field(default_factory=uuid4, primary_key=True)
    title: str
    description: Optional[str] = None
    cover_image: Optional[str] = None

class Image(SQLModel, table=True):
    id: Optional[UUID] = Field(default_factory=uuid4, primary_key=True)
    gallery_id: Optional[UUID] = Field(default=None, foreign_key="gallery.id")
    url: str
    thumbnail_url: Optional[str] = None
    alt_text: Optional[str] = None
    uploaded_by: Optional[UUID] = Field(default=None, foreign_key="user.id")
    created_at: datetime = Field(default_factory=datetime.utcnow)

class PushSubscription(SQLModel, table=True):
    __tablename__ = "push_subscription"

    id: Optional[UUID] = Field(default_factory=uuid4, primary_key=True)
    user_id: Optional[UUID] = Field(default=None, foreign_key="user.id")
    endpoint: str
    p256dh: str
    auth: str
    expiration_time: Optional[str] = None
    active: bool = True
    created_at: datetime = Field(default_factory=datetime.utcnow)

class Notification(SQLModel, table=True):
    __tablename__ = "notification"

    id: Optional[UUID] = Field(default_factory=uuid4, primary_key=True)
    title: str
    body: str
    audience: str = "all"  # all|students|parents|teachers
    source_type: Optional[str] = None  # manual|notice|news|activity
    source_id: Optional[str] = None
    created_by: Optional[UUID] = Field(default=None, foreign_key="user.id")
    email_sent_count: int = 0
    push_sent_count: int = 0
    created_at: datetime = Field(default_factory=datetime.utcnow)

class GoogleCalendarToken(SQLModel, table=True):
    __tablename__ = "google_calendar_token"

    id: Optional[UUID] = Field(default_factory=uuid4, primary_key=True)
    user_id: Optional[UUID] = Field(default=None, foreign_key="user.id", index=True)
    access_token: str
    refresh_token: str
    token_uri: str = "https://oauth2.googleapis.com/token"
    client_id: Optional[str] = None
    client_secret: Optional[str] = None
    scopes: str = "https://www.googleapis.com/auth/calendar.events"
    expiry: Optional[datetime] = None
    calendar_id: Optional[str] = None
    active: bool = True
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class SiteProfile(SQLModel, table=True):
    __tablename__ = "site_profile"

    id: Optional[UUID] = Field(default_factory=uuid4, primary_key=True)
    school_name: str = "U.E. Sagrado Corazón 4"
    tagline: Optional[str] = "Formamos con valores, educamos para la vida"
    hero_title: Optional[str] = "Sagrado Corazón 4"
    hero_subtitle: Optional[str] = "Promovemos el periodismo estudiantil para informar, inspirar y conectar a toda nuestra comunidad educativa."
    hero_cta: Optional[str] = "Más información"
    hero_image_url: Optional[str] = "https://images.unsplash.com/photo-1523580846011-d3a5bc25702b?auto=format&fit=crop&w=1600&q=80"
    address: Optional[str] = "San Juan de Yapacaní, Bolivia"
    phone: Optional[str] = "+591 3 1234567"
    email: Optional[str] = "uesagradocorazon4@gmail.com"
    facebook_url: Optional[str] = None
    instagram_url: Optional[str] = None
    youtube_url: Optional[str] = None
    search_placeholder: Optional[str] = "Buscar noticias..."
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class History(SQLModel, table=True):
    id: Optional[UUID] = Field(default_factory=uuid4, primary_key=True)
    content: Optional[str] = None
    last_updated_by: Optional[UUID] = Field(default=None, foreign_key="user.id")
    updated_at: datetime = Field(default_factory=datetime.utcnow)

