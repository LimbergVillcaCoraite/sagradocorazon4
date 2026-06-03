from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Query
from sqlmodel import select
from sqlmodel.ext.asyncio.session import AsyncSession
from typing import List, Optional
from datetime import datetime, timezone
from uuid import UUID

from ..db import get_session
from ..models import Image, Gallery, Album, News, Activity
from ..utils import get_current_user, require_role
from ..schemas_uploads import ImageUploadResponse, ImageRead, ImageUpdate, GalleryCreate, GalleryUpdate, GalleryRead, GalleryDetailRead, AlbumCreate, AlbumUpdate, AlbumRead, AlbumDetailRead
from ..schemas_content import NewsRead, ActivityRead
from ..storage_service import upload_file, delete_file, create_thumbnail, generate_file_path, ensure_bucket_exists
from ..session_ops import session_exec, session_commit, session_refresh, session_delete

router = APIRouter(prefix="/api/v1", tags=["uploads"])

# Initialize MinIO bucket on startup
@router.on_event("startup")
async def startup():
    await ensure_bucket_exists()

# UPLOAD ENDPOINTS
@router.post("/upload", response_model=ImageUploadResponse)
async def upload_image(
    file: UploadFile = File(...),
    alt_text: Optional[str] = None,
    user_id: UUID = Depends(get_current_user),
    session: AsyncSession = Depends(get_session)
):
    """Upload image to MinIO."""
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File must be an image")

    # Read file
    content = await file.read()

    # Generate file paths
    file_path = generate_file_path(file.filename, prefix="images")
    thumb_path = file_path.replace(".", "_thumb.")

    try:
        # Upload original
        url = await upload_file(file_path, content, file.content_type)

        # Create and upload thumbnail
        thumb_data = await create_thumbnail(content)
        thumbnail_url = None
        if thumb_data:
            thumbnail_url = await upload_file(thumb_path, thumb_data, "image/jpeg")

        # Save to DB
        image = Image(
            url=url,
            thumbnail_url=thumbnail_url,
            alt_text=alt_text,
            uploaded_by=user_id,
            created_at=datetime.now().replace(tzinfo=None)
        )
        session.add(image)
        await session_commit(session)
        await session_refresh(session, image)

        return ImageUploadResponse(
            url=url,
            thumbnail_url=thumbnail_url,
            alt_text=alt_text
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Upload failed: {str(e)}")

# GALLERY ENDPOINTS
@router.get("/galleries", response_model=List[GalleryRead])
async def list_galleries(
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=100),
    session: AsyncSession = Depends(get_session)
):
    """List all galleries."""
    query = select(Gallery).order_by(Gallery.title)

    # Get total count
    count_result = await session_exec(session, query)
    total = len(count_result.all())

    # Re-build for pagination
    query = select(Gallery).order_by(Gallery.title)
    offset = (page - 1) * limit
    query = query.offset(offset).limit(limit)

    result = await session_exec(session, query)
    galleries = result.all()

    # Calculate albums count for each
    gallery_list = []
    for gallery in galleries:
        album_query = select(Album).where(Album.gallery_id == gallery.id)
        album_result = await session_exec(session, album_query)
        albums_count = len(album_result.all())
        gallery_list.append(
            GalleryRead(
                id=gallery.id,
                title=gallery.title,
                description=gallery.description,
                cover_image=gallery.cover_image,
                albums_count=albums_count
            )
        )

    return gallery_list

@router.get("/galleries/{gallery_id}", response_model=GalleryDetailRead)
async def get_gallery(
    gallery_id: UUID,
    session: AsyncSession = Depends(get_session)
):
    """Get gallery with all albums."""
    q = select(Gallery).where(Gallery.id == gallery_id)
    result = await session_exec(session, q)
    gallery = result.one_or_none()
    if not gallery:
        raise HTTPException(status_code=404, detail="Gallery not found")

    # Get albums
    album_query = select(Album).where(Album.gallery_id == gallery.id).order_by(Album.created_at.desc())
    album_result = await session_exec(session, album_query)
    albums = album_result.all()

    albums_with_images = []
    for album in albums:
        img_query = select(Image).where(Image.album_id == album.id).order_by(Image.created_at.desc())
        img_result = await session_exec(session, img_query)
        images = img_result.all()

        albums_with_images.append(
            AlbumRead(
                id=album.id,
                gallery_id=album.gallery_id,
                title=album.title,
                description=album.description,
                cover_image=album.cover_image,
                images_count=len(images),
                created_at=album.created_at
            )
        )

    return GalleryDetailRead(
        id=gallery.id,
        title=gallery.title,
        description=gallery.description,
        cover_image=gallery.cover_image,
        albums=albums_with_images
     )



@router.post("/galleries", response_model=GalleryRead)
async def create_gallery(
    gallery_data: GalleryCreate,
    user_id: UUID = Depends(get_current_user),
    _: UUID = Depends(require_role("ADMIN")),
    session: AsyncSession = Depends(get_session)
):
    """Create new gallery."""
    gallery = Gallery(
        title=gallery_data.title,
        description=gallery_data.description
    )
    session.add(gallery)
    await session_commit(session)
    await session_refresh(session, gallery)

    return GalleryRead(
        id=gallery.id,
        title=gallery.title,
        description=gallery.description,
        cover_image=gallery.cover_image,
        albums_count=0
    )

async def _resolve_gallery_upload_album(gallery_id: str, session: AsyncSession):
    """Compatibility helper: map an old gallery upload request to a real album.

    If the gallery already has albums, use the oldest one to preserve a stable target.
    If it has none, create a default album automatically so legacy clients don't fail.
    """
    gallery_query = select(Gallery).where(Gallery.id == gallery_id)
    gallery_result = await session_exec(session, gallery_query)
    gallery = gallery_result.one_or_none()
    if not gallery:
        raise HTTPException(status_code=404, detail="Gallery not found")

    album_query = select(Album).where(Album.gallery_id == gallery.id).order_by(Album.created_at.asc())
    album_result = await session_exec(session, album_query)
    album = album_result.one_or_none()
    if album:
        return gallery, album

    album = Album(
        gallery_id=gallery.id,
        title=f"Álbum principal de {gallery.title}",
        description="Creado automáticamente para compatibilidad de subida",
    )
    session.add(album)
    await session_commit(session)
    await session_refresh(session, album)
    return gallery, album

@router.post("/galleries/{gallery_id}/upload-image", response_model=ImageRead)
async def upload_gallery_image_compat(
    gallery_id: str,
    file: UploadFile = File(...),
    alt_text: Optional[str] = None,
    user_id: UUID = Depends(get_current_user),
    _: UUID = Depends(require_role("ADMIN")),
    session: AsyncSession = Depends(get_session)
):
    """Backward-compatible endpoint for legacy frontend bundles.

    It uploads the image to a real album associated with the gallery, creating a
    default album if necessary.
    """
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File must be an image")

    _, album = await _resolve_gallery_upload_album(gallery_id, session)

    try:
        content = await file.read()
        file_path = generate_file_path(file.filename, prefix="album-images")
        url = await upload_file(file_path, content, file.content_type)

        thumb_path = file_path.replace(".", "_thumb.")
        thumb_data = await create_thumbnail(content)
        thumbnail_url = None
        if thumb_data:
            thumbnail_url = await upload_file(thumb_path, thumb_data, "image/jpeg")

        image = Image(
            album_id=album.id,
            url=url,
            thumbnail_url=thumbnail_url,
            alt_text=alt_text,
            uploaded_by=user_id,
            created_at=datetime.now().replace(tzinfo=None)
        )
        session.add(image)
        await session_commit(session)
        await session_refresh(session, image)

        if not album.cover_image:
            album.cover_image = url
            session.add(album)
            await session_commit(session)

        return ImageRead(
            id=image.id,
            album_id=image.album_id,
            url=image.url,
            thumbnail_url=image.thumbnail_url,
            alt_text=image.alt_text,
            uploaded_by=image.uploaded_by,
            created_at=image.created_at
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Upload failed: {str(e)}")

# ALBUM ENDPOINTS (Albums contain images within a gallery)
@router.get("/albums", response_model=List[AlbumRead])
async def list_albums(
    gallery_id: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=100),
    session: AsyncSession = Depends(get_session)
):
    """List all albums, optionally filtered by gallery."""
    if gallery_id:
        query = select(Album).where(Album.gallery_id == gallery_id).order_by(Album.created_at.desc())
    else:
        query = select(Album).order_by(Album.created_at.desc())

    # Get total count
    count_result = await session_exec(session, query)
    total = len(count_result.all())

    # Re-build for pagination
    if gallery_id:
        query = select(Album).where(Album.gallery_id == gallery_id).order_by(Album.created_at.desc())
    else:
        query = select(Album).order_by(Album.created_at.desc())
    offset = (page - 1) * limit
    query = query.offset(offset).limit(limit)

    result = await session_exec(session, query)
    albums = result.all()

    # Calculate images count for each
    album_list = []
    for album in albums:
        img_query = select(Image).where(Image.album_id == album.id)
        img_result = await session_exec(session, img_query)
        images_count = len(img_result.all())
        album_list.append(
            AlbumRead(
                id=album.id,
                gallery_id=album.gallery_id,
                title=album.title,
                description=album.description,
                cover_image=album.cover_image,
                images_count=images_count,
                created_at=album.created_at
            )
        )

    return album_list

@router.post("/albums", response_model=AlbumRead)
async def create_album(
    album_data: AlbumCreate,
    user_id: UUID = Depends(get_current_user),
    _: UUID = Depends(require_role("ADMIN")),
    session: AsyncSession = Depends(get_session)
):
    """Create new album within a gallery."""
    album = Album(
        gallery_id=album_data.gallery_id,
        title=album_data.title,
        description=album_data.description
    )
    session.add(album)
    await session_commit(session)
    await session_refresh(session, album)

    return AlbumRead(
        id=album.id,
        gallery_id=album.gallery_id,
        title=album.title,
        description=album.description,
        cover_image=album.cover_image,
        images_count=0,
        created_at=album.created_at
    )

@router.get("/albums/{album_id}", response_model=AlbumDetailRead)
async def get_album(
    album_id: str,
    session: AsyncSession = Depends(get_session)
):
    """Get album with all images."""
    q = select(Album).where(Album.id == album_id)
    result = await session_exec(session, q)
    album = result.one_or_none()
    if not album:
        raise HTTPException(status_code=404, detail="Album not found")

    # Get images
    img_query = select(Image).where(Image.album_id == album.id).order_by(Image.created_at.desc())
    img_result = await session_exec(session, img_query)
    images = img_result.all()

    return AlbumDetailRead(
        id=album.id,
        gallery_id=album.gallery_id,
        title=album.title,
        description=album.description,
        cover_image=album.cover_image,
        images=[
            ImageRead(
                id=img.id,
                album_id=img.album_id,
                url=img.url,
                thumbnail_url=img.thumbnail_url,
                alt_text=img.alt_text,
                uploaded_by=img.uploaded_by,
                created_at=img.created_at
            )
            for img in images
        ],
        created_at=album.created_at
    )

@router.put("/albums/{album_id}", response_model=AlbumRead)
async def update_album(
    album_id: str,
    album_data: AlbumUpdate,
    user_id: UUID = Depends(get_current_user),
    _: UUID = Depends(require_role("ADMIN")),
    session: AsyncSession = Depends(get_session)
):
    """Update album."""
    q = select(Album).where(Album.id == album_id)
    result = await session_exec(session, q)
    album = result.one_or_none()
    if not album:
        raise HTTPException(status_code=404, detail="Album not found")

    if album_data.title:
        album.title = album_data.title
    if album_data.description is not None:
        album.description = album_data.description
    # allow updating cover_image; frontend may send either a single URL or a JSON array string
    if getattr(album_data, 'cover_image', None) is not None:
        album.cover_image = album_data.cover_image

    session.add(album)
    await session_commit(session)
    await session_refresh(session, album)

    # Count images
    img_query = select(Image).where(Image.album_id == album.id)
    img_result = await session_exec(session, img_query)
    images_count = len(img_result.all())

    return AlbumRead(
        id=album.id,
        gallery_id=album.gallery_id,
        title=album.title,
        description=album.description,
        cover_image=album.cover_image,
        images_count=images_count,
        created_at=album.created_at
    )

@router.delete("/albums/{album_id}")
async def delete_album(
    album_id: str,
    user_id: UUID = Depends(get_current_user),
    _: UUID = Depends(require_role("ADMIN")),
    session: AsyncSession = Depends(get_session)
):
    """Delete album and all associated images."""
    q = select(Album).where(Album.id == album_id)
    result = await session_exec(session, q)
    album = result.one_or_none()
    if not album:
        raise HTTPException(status_code=404, detail="Album not found")

    # Delete associated images from storage
    img_query = select(Image).where(Image.album_id == album.id)
    img_result = await session_exec(session, img_query)
    images = img_result.all()

    for image in images:
        # Extract file path from URL
        url_parts = image.url.split("/")
        file_path = "/".join(url_parts[-2:])
        await delete_file(file_path)
        if image.thumbnail_url:
            thumb_parts = image.thumbnail_url.split("/")
            thumb_path = "/".join(thumb_parts[-2:])
            await delete_file(thumb_path)
        await session_delete(session, image)

        await session_delete(session, album)
        await session_commit(session)
        return {"status": "deleted", "album_id": album_id}

@router.put("/galleries/{gallery_id}", response_model=GalleryRead)
async def update_gallery(
    gallery_id: str,
    gallery_data: GalleryUpdate,
    user_id: UUID = Depends(get_current_user),
    _: UUID = Depends(require_role("ADMIN")),
    session: AsyncSession = Depends(get_session)
):
    """Update gallery."""
    q = select(Gallery).where(Gallery.id == gallery_id)
    result = await session_exec(session, q)
    gallery = result.one_or_none()
    if not gallery:
        raise HTTPException(status_code=404, detail="Gallery not found")

    if gallery_data.title:
        gallery.title = gallery_data.title
    if gallery_data.description is not None:
        gallery.description = gallery_data.description

    session.add(gallery)
    await session_commit(session)
    await session_refresh(session, gallery)

    # Count albums
    album_query = select(Album).where(Album.gallery_id == gallery.id)
    album_result = await session_exec(session, album_query)
    albums_count = len(album_result.all())

    return GalleryRead(
        id=gallery.id,
        title=gallery.title,
        description=gallery.description,
        cover_image=gallery.cover_image,
        albums_count=albums_count
    )

@router.delete("/galleries/{gallery_id}")
async def delete_gallery(
    gallery_id: UUID,
    user_id: UUID = Depends(get_current_user),
    _: UUID = Depends(require_role("ADMIN")),
    session: AsyncSession = Depends(get_session)
):
    """Delete gallery and all associated albums and images."""
    q = select(Gallery).where(Gallery.id == gallery_id)
    result = await session_exec(session, q)
    gallery = result.one_or_none()
    if not gallery:
        raise HTTPException(status_code=404, detail="Gallery not found")

    # Delete associated albums and their images
    album_query = select(Album).where(Album.gallery_id == gallery.id)
    album_result = await session_exec(session, album_query)
    albums = album_result.all()

    for album in albums:
        # Delete images in this album
        img_query = select(Image).where(Image.album_id == album.id)
        img_result = await session_exec(session, img_query)
        images = img_result.all()

        for image in images:
            # Delete from storage
            url_parts = image.url.split("/")
            file_path = "/".join(url_parts[-2:])
            await delete_file(file_path)
            if image.thumbnail_url:
                thumb_parts = image.thumbnail_url.split("/")
                thumb_path = "/".join(thumb_parts[-2:])
                await delete_file(thumb_path)
            await session_delete(session, image)

        await session_delete(session, album)

    await session_delete(session, gallery)
    await session_commit(session)
    return {"status": "deleted", "gallery_id": gallery_id}

# IMAGE ENDPOINTS
@router.put("/images/{image_id}", response_model=ImageRead)
async def update_image(
    image_id: UUID,
    image_data: ImageUpdate,
    user_id: UUID = Depends(get_current_user),
    _: UUID = Depends(require_role("ADMIN")),
    session: AsyncSession = Depends(get_session)
):
    """Update image metadata."""
    q = select(Image).where(Image.id == image_id)
    result = await session_exec(session, q)
    image = result.one_or_none()
    if not image:
        raise HTTPException(status_code=404, detail="Image not found")

    if image_data.alt_text is not None:
        image.alt_text = image_data.alt_text
    if image_data.album_id is not None:
        image.album_id = image_data.album_id

    session.add(image)
    await session_commit(session)
    await session_refresh(session, image)
    return image

@router.delete("/images/{image_id}")
async def delete_image(
    image_id: UUID,
    user_id: UUID = Depends(get_current_user),
    _: UUID = Depends(require_role("ADMIN")),
    session: AsyncSession = Depends(get_session)
):
    """Delete image."""
    q = select(Image).where(Image.id == image_id)
    result = await session_exec(session, q)
    image = result.one_or_none()
    if not image:
        raise HTTPException(status_code=404, detail="Image not found")

    # Delete from MinIO
    url_parts = image.url.split("/")
    file_path = "/".join(url_parts[-2:])
    await delete_file(file_path)

    if image.thumbnail_url:
        thumb_parts = image.thumbnail_url.split("/")
        thumb_path = "/".join(thumb_parts[-2:])
        await delete_file(thumb_path)

    await session_delete(session, image)
    await session_commit(session)
    return {"status": "deleted", "image_id": image_id}


# NEWS UPLOAD ENDPOINTS
@router.post("/news/{news_id}/upload-cover", response_model=NewsRead)
async def upload_news_cover(
    news_id: str,
    file: UploadFile = File(...),
    user_id: UUID = Depends(get_current_user),
    _: UUID = Depends(require_role("ADMIN", "EDITOR")),
    session: AsyncSession = Depends(get_session)
):
    """Upload and assign cover image to news."""
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File must be an image")

    # Get news
    q = select(News).where(News.id == news_id)
    result = await session_exec(session, q)
    news = result.one_or_none()
    if not news:
        raise HTTPException(status_code=404, detail="News not found")

    try:
        # Read and upload file
        content = await file.read()
        file_path = generate_file_path(file.filename, prefix="news-covers")
        url = await upload_file(file_path, content, file.content_type)

        # Update news with cover image URL
        news.cover_image = url
        news.updated_at = datetime.now().replace(tzinfo=None)
        session.add(news)
        await session_commit(session)
        await session_refresh(session, news)

        return news
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Upload failed: {str(e)}")


# ACTIVITY UPLOAD ENDPOINTS
@router.post("/activities/{activity_id}/upload-cover", response_model=ActivityRead)
async def upload_activity_cover(
    activity_id: str,
    file: UploadFile = File(...),
    user_id: UUID = Depends(get_current_user),
    _: UUID = Depends(require_role("ADMIN", "PROFESSOR")),
    session: AsyncSession = Depends(get_session)
):
    """Upload and assign cover image to activity."""
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File must be an image")

    # Get activity
    q = select(Activity).where(Activity.id == activity_id)
    result = await session_exec(session, q)
    activity = result.one_or_none()
    if not activity:
        raise HTTPException(status_code=404, detail="Activity not found")

    try:
        # Read and upload file
        content = await file.read()
        file_path = generate_file_path(file.filename, prefix="activity-covers")
        url = await upload_file(file_path, content, file.content_type)

        # Update activity with cover image URL
        activity.cover_image = url
        session.add(activity)
        await session_commit(session)
        await session_refresh(session, activity)

        return activity
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Upload failed: {str(e)}")


# GALLERY IMAGE UPLOAD ENDPOINTS
@router.post("/albums/{album_id}/upload-image", response_model=ImageRead)
async def upload_album_image(
    album_id: str,
    file: UploadFile = File(...),
    alt_text: Optional[str] = None,
    user_id: UUID = Depends(get_current_user),
    _: UUID = Depends(require_role("ADMIN", "EDITOR", "PROFESSOR")),
    session: AsyncSession = Depends(get_session)
):
    """Upload image to album."""
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File must be an image")

    # Verify album exists
    q = select(Album).where(Album.id == album_id)
    result = await session_exec(session, q)
    album = result.one_or_none()
    if not album:
        raise HTTPException(status_code=404, detail="Album not found")

    try:
        # Read and upload file
        content = await file.read()
        file_path = generate_file_path(file.filename, prefix="album-images")
        url = await upload_file(file_path, content, file.content_type)

        # Create thumbnail (optional)
        thumb_path = file_path.replace(".", "_thumb.")
        thumb_data = await create_thumbnail(content)
        thumbnail_url = None
        if thumb_data:
            thumbnail_url = await upload_file(thumb_path, thumb_data, "image/jpeg")

        # Save image to DB with album association
        image = Image(
            album_id=UUID(album_id),
            url=url,
            thumbnail_url=thumbnail_url,
            alt_text=alt_text,
            uploaded_by=user_id,
            created_at=datetime.now().replace(tzinfo=None)
        )
        session.add(image)
        await session_commit(session)
        await session_refresh(session, image)
        
        # Update album cover image if it's the first image
        if not album.cover_image:
            album.cover_image = url
            session.add(album)
            await session_commit(session)

        return ImageRead(
            id=image.id,
            album_id=image.album_id,
            url=image.url,
            thumbnail_url=image.thumbnail_url,
            alt_text=image.alt_text,
            uploaded_by=image.uploaded_by,
            created_at=image.created_at
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Upload failed: {str(e)}")


@router.post("/albums/{album_id}/upload-cover", response_model=AlbumRead)
async def upload_album_cover(
    album_id: str,
    file: UploadFile = File(...),
    user_id: UUID = Depends(get_current_user),
    _: UUID = Depends(require_role("ADMIN", "EDITOR", "PROFESSOR")),
    session: AsyncSession = Depends(get_session)
):
    """Upload and assign cover image to album."""
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File must be an image")

    # Get album
    q = select(Album).where(Album.id == album_id)
    result = await session_exec(session, q)
    album = result.one_or_none()
    if not album:
        raise HTTPException(status_code=404, detail="Album not found")

    try:
        # Read and upload file
        content = await file.read()
        file_path = generate_file_path(file.filename, prefix="album-covers")
        url = await upload_file(file_path, content, file.content_type)

        # Update album with cover image URL
        album.cover_image = url
        session.add(album)
        await session_commit(session)
        await session_refresh(session, album)

        # Count images
        img_query = select(Image).where(Image.album_id == album.id)
        img_result = await session_exec(session, img_query)
        images_count = len(img_result.all())

        return AlbumRead(
            id=album.id,
            gallery_id=album.gallery_id,
            title=album.title,
            description=album.description,
            cover_image=album.cover_image,
            images_count=images_count,
            created_at=album.created_at
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Upload failed: {str(e)}")


@router.post("/galleries/{gallery_id}/upload-cover", response_model=GalleryRead)
async def upload_gallery_cover(
    gallery_id: str,
    file: UploadFile = File(...),
    user_id: UUID = Depends(get_current_user),
    _: UUID = Depends(require_role("ADMIN")),
    session: AsyncSession = Depends(get_session)
):
    """Upload and assign cover image to gallery."""
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File must be an image")

    # Get gallery
    q = select(Gallery).where(Gallery.id == gallery_id)
    result = await session_exec(session, q)
    gallery = result.one_or_none()
    if not gallery:
        raise HTTPException(status_code=404, detail="Gallery not found")

    try:
        # Read and upload file
        content = await file.read()
        file_path = generate_file_path(file.filename, prefix="gallery-covers")
        url = await upload_file(file_path, content, file.content_type)

        # Update gallery with cover image URL
        gallery.cover_image = url
        session.add(gallery)
        await session_commit(session)
        await session_refresh(session, gallery)

        # Count albums
        album_query = select(Album).where(Album.gallery_id == gallery.id)
        album_result = await session_exec(session, album_query)
        albums_count = len(album_result.all())

        return GalleryRead(
            id=gallery.id,
            title=gallery.title,
            description=gallery.description,
            cover_image=gallery.cover_image,
            albums_count=albums_count
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Upload failed: {str(e)}")
