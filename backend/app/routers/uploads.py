from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Query
from sqlmodel import select
from sqlmodel.ext.asyncio.session import AsyncSession
from typing import List, Optional
from datetime import datetime
from uuid import UUID

from ..db import get_session
from ..models import Image, Gallery, News, Activity
from ..utils import get_current_user, require_role
from ..schemas_uploads import ImageUploadResponse, ImageRead, ImageUpdate, GalleryCreate, GalleryUpdate, GalleryRead, GalleryDetailRead
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
        url = upload_file(file_path, content, file.content_type)

        # Create and upload thumbnail
        thumb_data = create_thumbnail(content)
        thumbnail_url = None
        if thumb_data:
            thumbnail_url = upload_file(thumb_path, thumb_data, "image/jpeg")

        # Save to DB
        image = Image(
            url=url,
            thumbnail_url=thumbnail_url,
            alt_text=alt_text,
            uploaded_by=user_id,
            created_at=datetime.utcnow()
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

    # Calculate images count for each
    gallery_list = []
    for gallery in galleries:
        img_query = select(Image).where(Image.gallery_id == gallery.id)
        img_result = await session_exec(session, img_query)
        images_count = len(img_result.all())
        gallery_list.append(
            GalleryRead(
                id=gallery.id,
                title=gallery.title,
                description=gallery.description,
                cover_image=gallery.cover_image,
                images_count=images_count
            )
        )

    return gallery_list

@router.get("/galleries/{gallery_id}", response_model=GalleryDetailRead)
async def get_gallery(
    gallery_id: str,
    session: AsyncSession = Depends(get_session)
):
    """Get gallery with all images."""
    q = select(Gallery).where(Gallery.id == gallery_id)
    result = await session_exec(session, q)
    gallery = result.one_or_none()
    if not gallery:
        raise HTTPException(status_code=404, detail="Gallery not found")

    # Get images
    img_query = select(Image).where(Image.gallery_id == gallery.id).order_by(Image.created_at.desc())
    img_result = await session_exec(session, img_query)
    images = img_result.all()

    return GalleryDetailRead(
        id=gallery.id,
        title=gallery.title,
        description=gallery.description,
        cover_image=gallery.cover_image,
        images=[
            ImageRead(
                id=img.id,
                gallery_id=img.gallery_id,
                url=img.url,
                thumbnail_url=img.thumbnail_url,
                alt_text=img.alt_text,
                uploaded_by=img.uploaded_by,
                created_at=img.created_at
            )
            for img in images
        ]
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
        images_count=0
    )

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

    # Count images
    img_query = select(Image).where(Image.gallery_id == gallery.id)
    img_result = await session_exec(session, img_query)
    images_count = len(img_result.all())

    return GalleryRead(
        id=gallery.id,
        title=gallery.title,
        description=gallery.description,
        cover_image=gallery.cover_image,
        images_count=images_count
    )

@router.delete("/galleries/{gallery_id}")
async def delete_gallery(
    gallery_id: str,
    user_id: UUID = Depends(get_current_user),
    _: UUID = Depends(require_role("ADMIN")),
    session: AsyncSession = Depends(get_session)
):
    """Delete gallery and all associated images."""
    q = select(Gallery).where(Gallery.id == gallery_id)
    result = await session_exec(session, q)
    gallery = result.one_or_none()
    if not gallery:
        raise HTTPException(status_code=404, detail="Gallery not found")

    # Delete associated images from storage
    img_query = select(Image).where(Image.gallery_id == gallery.id)
    img_result = await session_exec(session, img_query)
    images = img_result.all()

    for image in images:
        # Extract file path from URL
        url_parts = image.url.split("/")
        file_path = "/".join(url_parts[-2:])
        delete_file(file_path)
        await session_delete(session, image)

    await session_delete(session, gallery)
    await session_commit(session)
    return {"status": "deleted", "gallery_id": gallery_id}

# IMAGE ENDPOINTS
@router.put("/images/{image_id}", response_model=ImageRead)
async def update_image(
    image_id: str,
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
    if image_data.gallery_id is not None:
        image.gallery_id = image_data.gallery_id

    session.add(image)
    await session_commit(session)
    await session_refresh(session, image)
    return image

@router.delete("/images/{image_id}")
async def delete_image(
    image_id: str,
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
    delete_file(file_path)

    if image.thumbnail_url:
        thumb_parts = image.thumbnail_url.split("/")
        thumb_path = "/".join(thumb_parts[-2:])
        delete_file(thumb_path)

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
        url = upload_file(file_path, content, file.content_type)

        # Update news with cover image URL
        news.cover_image = url
        news.updated_at = datetime.utcnow()
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
        url = upload_file(file_path, content, file.content_type)

        # Update activity with cover image URL
        activity.cover_image = url
        session.add(activity)
        await session_commit(session)
        await session_refresh(session, activity)

        return activity
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Upload failed: {str(e)}")


# GALLERY IMAGE UPLOAD ENDPOINTS
@router.post("/galleries/{gallery_id}/upload-image", response_model=ImageRead)
async def upload_gallery_image(
    gallery_id: str,
    file: UploadFile = File(...),
    alt_text: Optional[str] = None,
    user_id: UUID = Depends(get_current_user),
    _: UUID = Depends(require_role("ADMIN")),
    session: AsyncSession = Depends(get_session)
):
    """Upload image to gallery."""
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File must be an image")

    # Verify gallery exists
    q = select(Gallery).where(Gallery.id == gallery_id)
    result = await session_exec(session, q)
    gallery = result.one_or_none()
    if not gallery:
        raise HTTPException(status_code=404, detail="Gallery not found")

    try:
        # Read and upload file
        content = await file.read()
        file_path = generate_file_path(file.filename, prefix="gallery-images")
        url = upload_file(file_path, content, file.content_type)

        # Create thumbnail (optional)
        thumb_path = file_path.replace(".", "_thumb.")
        thumb_data = create_thumbnail(content)
        thumbnail_url = None
        if thumb_data:
            thumbnail_url = upload_file(thumb_path, thumb_data, "image/jpeg")

        # Save image to DB with gallery association
        image = Image(
            gallery_id=UUID(gallery_id),
            url=url,
            thumbnail_url=thumbnail_url,
            alt_text=alt_text,
            uploaded_by=user_id,
            created_at=datetime.utcnow()
        )
        session.add(image)
        await session_commit(session)
        await session_refresh(session, image)

        return ImageRead(
            id=image.id,
            gallery_id=image.gallery_id,
            url=image.url,
            thumbnail_url=image.thumbnail_url,
            alt_text=image.alt_text,
            uploaded_by=image.uploaded_by,
            created_at=image.created_at
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
        url = upload_file(file_path, content, file.content_type)

        # Update gallery with cover image URL
        gallery.cover_image = url
        session.add(gallery)
        await session_commit(session)
        await session_refresh(session, gallery)

        # Count images
        img_query = select(Image).where(Image.gallery_id == gallery.id)
        img_result = await session_exec(session, img_query)
        images_count = len(img_result.all())

        return GalleryRead(
            id=gallery.id,
            title=gallery.title,
            description=gallery.description,
            cover_image=gallery.cover_image,
            images_count=images_count
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Upload failed: {str(e)}")
