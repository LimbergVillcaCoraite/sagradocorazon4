from minio import Minio
from minio.error import S3Error
from io import BytesIO
import os
from typing import Optional, Tuple
import json
import asyncio
from concurrent.futures import ThreadPoolExecutor
from .config import settings

# Initialize MinIO client
client = Minio(
    settings.minio_endpoint,
    access_key=settings.minio_access_key,
    secret_key=settings.minio_secret_key,
    secure=settings.minio_secure
)

# Thread executor for I/O operations
executor = ThreadPoolExecutor(max_workers=5)

def build_public_file_url(file_path: str) -> str:
    scheme = "https" if settings.minio_secure else "http"
    return f"{scheme}://{settings.minio_public_endpoint}/{settings.minio_bucket}/{file_path}"

async def ensure_bucket_exists():
    """Ensure MinIO bucket exists, create if not."""
    try:
        loop = asyncio.get_event_loop()
        await loop.run_in_executor(executor, _ensure_bucket_exists_sync)
    except Exception as e:
        print(f"Warning: MinIO bucket setup skipped: {e}")

def _ensure_bucket_exists_sync():
    """Synchronous version of ensure_bucket_exists."""
    if not client.bucket_exists(settings.minio_bucket):
        client.make_bucket(settings.minio_bucket)
    policy = {
        "Version": "2012-10-17",
        "Statement": [
            {
                "Effect": "Allow",
                "Principal": {"AWS": ["*"]},
                "Action": ["s3:GetObject"],
                "Resource": [f"arn:aws:s3:::{settings.minio_bucket}/*"],
            }
        ],
    }
    client.set_bucket_policy(settings.minio_bucket, json.dumps(policy))

async def upload_file(file_path: str, file_data: bytes, content_type: str = "application/octet-stream") -> str:
    """Upload file to MinIO and return URL asynchronously."""
    loop = asyncio.get_event_loop()
    return await loop.run_in_executor(
        executor,
        _upload_file_sync,
        file_path,
        file_data,
        content_type
    )

def _upload_file_sync(file_path: str, file_data: bytes, content_type: str) -> str:
    """Synchronous version of upload_file."""
    try:
        client.put_object(
            settings.minio_bucket,
            file_path,
            BytesIO(file_data),
            len(file_data),
            content_type=content_type
        )
        return build_public_file_url(file_path)
    except S3Error as e:
        raise Exception(f"Upload failed: {e}")

async def delete_file(file_path: str) -> bool:
    """Delete file from MinIO asynchronously."""
    loop = asyncio.get_event_loop()
    return await loop.run_in_executor(executor, _delete_file_sync, file_path)

def _delete_file_sync(file_path: str) -> bool:
    """Synchronous version of delete_file."""
    try:
        client.remove_object(settings.minio_bucket, file_path)
        return True
    except S3Error as e:
        print(f"Delete failed: {e}")
        return False

async def create_thumbnail(image_data: bytes, size: Tuple[int, int] = (200, 200)) -> Optional[bytes]:
    """Create thumbnail from image bytes asynchronously."""
    loop = asyncio.get_event_loop()
    return await loop.run_in_executor(executor, _create_thumbnail_sync, image_data, size)

def _create_thumbnail_sync(image_data: bytes, size: Tuple[int, int] = (200, 200)) -> Optional[bytes]:
    """Synchronous version of create_thumbnail."""
    try:
        from PIL import Image

        image = Image.open(BytesIO(image_data))
        image.thumbnail(size, Image.Resampling.LANCZOS)
        output = BytesIO()
        image.save(output, format="JPEG", quality=85)
        return output.getvalue()
    except ModuleNotFoundError:
        print("Thumbnail creation skipped: Pillow is not installed")
        return None
    except Exception as e:
        print(f"Thumbnail creation failed: {e}")
        return None

def generate_file_path(filename: str, prefix: str = "uploads") -> str:
    """Generate unique file path."""
    import uuid
    ext = os.path.splitext(filename)[1]
    return f"{prefix}/{uuid.uuid4()}{ext}"

