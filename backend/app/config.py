import os
from dataclasses import dataclass, field
from typing import Optional

from dotenv import load_dotenv


load_dotenv()


def _env(name: str, default: Optional[str] = None) -> Optional[str]:
    return os.getenv(name, default)


def _env_int(name: str) -> Optional[int]:
    value = os.getenv(name)
    if value is None or value == "":
        return None
    try:
        return int(value)
    except ValueError:
        return None


def _env_bool(name: str, default: bool = False) -> bool:
    value = os.getenv(name)
    if value is None or value == "":
        return default
    return value.lower() in {"1", "true", "yes", "on"}


def _parse_origins(value: Optional[str]) -> list:
    """Parse a semicolon or comma separated list of origins from env.
    Returns a list of non-empty, stripped origin strings. If value is falsy,
    the caller should fall back to defaults.
    """
    if not value:
        return []
    # Accept both ; and , as separators and strip whitespace
    parts = [p.strip() for p in value.replace("\n", "").replace(",", ";").split(";")]
    return [p for p in parts if p]


@dataclass(slots=True)
class Settings:
    database_url: str = field(default_factory=lambda: _env("DATABASE_URL", "postgresql+asyncpg://postgres:postgres@localhost:5432/sagradocorazon") or "")
    admin_email: Optional[str] = field(default_factory=lambda: _env("ADMIN_EMAIL"))
    admin_password: Optional[str] = field(default_factory=lambda: _env("ADMIN_PASSWORD"))
    admin_name: Optional[str] = field(default_factory=lambda: _env("ADMIN_NAME"))
    smtp_host: Optional[str] = field(default_factory=lambda: _env("SMTP_HOST"))
    smtp_port: Optional[int] = field(default_factory=lambda: _env_int("SMTP_PORT"))
    smtp_user: Optional[str] = field(default_factory=lambda: _env("SMTP_USER"))
    smtp_password: Optional[str] = field(default_factory=lambda: _env("SMTP_PASSWORD"))
    vapid_public: Optional[str] = field(default_factory=lambda: _env("VAPID_PUBLIC_KEY"))
    vapid_private: Optional[str] = field(default_factory=lambda: _env("VAPID_PRIVATE_KEY"))
    google_client_id: Optional[str] = field(default_factory=lambda: _env("GOOGLE_CLIENT_ID"))
    google_client_secret: Optional[str] = field(default_factory=lambda: _env("GOOGLE_CLIENT_SECRET"))
    google_redirect_uri: Optional[str] = field(default_factory=lambda: _env("GOOGLE_REDIRECT_URI"))
    secret_key: str = field(default_factory=lambda: os.getenv("SECRET_KEY", "change-me-in-production"))
    
    # CORS settings - can be overridden with CORS_ALLOWED_ORIGINS environment variable
    cors_allowed_origins: list = field(default_factory=lambda: (
        (_parse_origins(_env("CORS_ALLOWED_ORIGINS")) or ["http://localhost:3000", "http://127.0.0.1:3000", "http://localhost"])
    ))

    # MinIO settings
    minio_endpoint: str = field(default_factory=lambda: os.getenv("MINIO_ENDPOINT", "localhost:9000"))
    minio_public_endpoint: str = field(default_factory=lambda: os.getenv("MINIO_PUBLIC_ENDPOINT", "localhost:9000"))
    minio_access_key: str = field(default_factory=lambda: os.getenv("MINIO_ACCESS_KEY", "minioadmin"))
    minio_secret_key: str = field(default_factory=lambda: os.getenv("MINIO_SECRET_KEY", "minioadmin"))
    minio_secure: bool = field(default_factory=lambda: _env_bool("MINIO_SECURE", False))
    minio_public_secure: bool = field(default_factory=lambda: _env_bool("MINIO_PUBLIC_SECURE", False))
    minio_bucket: str = field(default_factory=lambda: os.getenv("MINIO_BUCKET", "sagrado-corazon"))


settings = Settings()

