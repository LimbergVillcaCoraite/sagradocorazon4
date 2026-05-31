"""Seed script to populate the database with example data."""
import asyncio
from datetime import datetime
from uuid import uuid4
from sqlmodel import select
from sqlmodel.ext.asyncio.session import AsyncSession as SQLAsyncSession

from app.db import engine
from app.models import Gallery, Album, Image
from app.session_ops import session_exec, session_commit, session_refresh


async def seed_data():
    """Populate database with example galleries and albums."""
    async with SQLAsyncSession(engine) as session:
        # Check if galleries already exist
        q = select(Gallery)
        result = await session_exec(session, q)
        existing_galleries = result.all()
        if existing_galleries:
            print(f"Database already has {len(existing_galleries)} galleries. Skipping seed.")
            return

        # Create a gallery
        gallery = Gallery(
            id=uuid4(),
            title="Actos y memorias",
            description="Galería de fotos de eventos escolares y actividades de la unidad educativa."
        )
        session.add(gallery)
        await session_commit(session)
        await session_refresh(session, gallery)
        print(f"Created gallery: {gallery.title} (ID: {gallery.id})")

        # Create albums for the gallery
        albums_data = [
            {
                "title": "Día del estudiante 2024",
                "description": "Fotos del día del estudiante con actividades recreativas y competencias"
            },
            {
                "title": "Actividades deportivas",
                "description": "Campeonatos internos y torneos participativos de todas las disciplinas"
            },
            {
                "title": "Acto de graduación",
                "description": "Ceremonia de egreso de la promoción 2024"
            },
        ]

        for album_data in albums_data:
            album = Album(
                id=uuid4(),
                gallery_id=gallery.id,
                title=album_data["title"],
                description=album_data["description"],
            )
            session.add(album)
            await session_commit(session)
            await session_refresh(session, album)
            print(f"  Created album: {album.title} (ID: {album.id})")

        print("Seeding complete!")


if __name__ == "__main__":
    asyncio.run(seed_data())

