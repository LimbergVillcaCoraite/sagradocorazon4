import re
from typing import Optional
from sqlalchemy.orm import Session
from .session_ops import session_exec

def generate_slug(title: str) -> str:
    """Generate URL-friendly slug from title."""
    slug = title.lower()
    slug = re.sub(r'[^\w\s-]', '', slug)
    slug = re.sub(r'[-\s]+', '-', slug)
    slug = slug.strip('-')
    return slug

async def check_slug_unique(session, slug: str, exclude_id: Optional[str] = None) -> bool:
    """Check if slug is unique."""
    from sqlmodel import select
    from .models import News

    q = select(News).where(News.slug == slug)
    if exclude_id:
        q = q.where(News.id != exclude_id)
    result = await session_exec(session, q)
    return result.one_or_none() is None

def build_query_filters(query, model, search: Optional[str] = None, status: Optional[str] = None):
    """Build dynamic query filters."""
    if search:
        query = query.where(
            (model.title.ilike(f"%{search}%")) |
            (model.content.ilike(f"%{search}%"))
        )
    if status and hasattr(model, 'status'):
        query = query.where(model.status == status)
    return query

def apply_pagination(query, page: int = 1, limit: int = 10):
    """Apply pagination to query."""
    offset = (page - 1) * limit
    return query.offset(offset).limit(limit)

def apply_sorting(query, model, sort_by: str = "created_at", sort_order: str = "desc"):
    """Apply sorting to query."""
    sort_column = getattr(model, sort_by, None)
    if sort_column is None:
        sort_column = model.created_at

    if sort_order == "asc":
        query = query.order_by(sort_column)
    else:
        query = query.order_by(sort_column.desc())
    return query

