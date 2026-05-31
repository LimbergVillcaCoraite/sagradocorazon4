from pydantic import BaseModel, ConfigDict
from typing import Optional, List
from datetime import datetime
from uuid import UUID

# Upload/Image schemas
class ImageUploadResponse(BaseModel):
    url: str
    thumbnail_url: Optional[str]
    alt_text: Optional[str]

class ImageRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: UUID
    album_id: Optional[UUID]
    url: str
    thumbnail_url: Optional[str]
    alt_text: Optional[str]
    uploaded_by: Optional[UUID]
    created_at: datetime

class ImageUpdate(BaseModel):
    alt_text: Optional[str] = None
    album_id: Optional[UUID] = None

# Album schemas (new - albums contain images)
class AlbumCreate(BaseModel):
    gallery_id: Optional[UUID] = None
    title: str
    description: Optional[str] = None

class AlbumUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    # cover_image may contain a single URL string or a JSON array string when multiple covers are set
    cover_image: Optional[str] = None

class AlbumRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: UUID
    gallery_id: Optional[UUID]
    title: str
    description: Optional[str]
    cover_image: Optional[str]
    images_count: int = 0
    created_at: datetime

class AlbumDetailRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: UUID
    gallery_id: Optional[UUID]
    title: str
    description: Optional[str]
    cover_image: Optional[str]
    images: List[ImageRead] = []
    created_at: datetime

# Gallery schemas (contains albums)
class GalleryCreate(BaseModel):
    title: str
    description: Optional[str] = None

class GalleryUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None

class GalleryRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: UUID
    title: str
    description: Optional[str]
    cover_image: Optional[str]
    albums_count: int = 0

class GalleryDetailRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: UUID
    title: str
    description: Optional[str]
    cover_image: Optional[str]
    albums: List[AlbumRead] = []

