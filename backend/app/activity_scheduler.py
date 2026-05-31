"""
Background scheduler for publishing activities at scheduled times.
"""
import asyncio
from datetime import datetime, timezone
from sqlmodel import select
from sqlmodel.ext.asyncio.session import AsyncSession
from .db import engine
from .models import Activity
from .session_ops import session_exec, session_commit
import logging

logger = logging.getLogger("activity_scheduler")


async def check_and_publish_scheduled_activities():
    """
    Check if any activities should be published based on their publish_at time.
    This function should be called periodically (e.g., every minute).
    """
    try:
        async with AsyncSession(engine) as session:
            now = datetime.now().replace(tzinfo=None)  # Use naive datetime for database comparison

            # Query all activities that should be published
            # (publish_at is in the past or now, and they haven't been marked as published yet)
            query = select(Activity).where(
                Activity.publish_at <= now
            )

            result = await session_exec(session, query)
            activities_to_publish = result.all()

            if activities_to_publish:
                logger.info(f"Publishing {len(activities_to_publish)} scheduled activities")
                # Mark them as published or update any visibility flag if needed
                # For now, we just log them since the Activity model doesn't have a 'published' field
                for activity in activities_to_publish:
                    logger.info(f"Activity '{activity.title}' (ID: {activity.id}) is ready to publish at {activity.publish_at}")
    except Exception as exc:
        logger.error(f"Error in activity scheduler: {exc}", exc_info=True)


async def start_activity_scheduler():
    """
    Start the background scheduler that checks for scheduled activities.
    This should be called during application startup.
    """
    asyncio.create_task(_scheduler_loop())


async def _scheduler_loop():
    """
    Main scheduler loop that runs every 60 seconds.
    """
    while True:
        try:
            await check_and_publish_scheduled_activities()
            # Check every 60 seconds
            await asyncio.sleep(60)
        except Exception as exc:
            logger.error(f"Scheduler loop error: {exc}", exc_info=True)
            # Wait before retrying
            await asyncio.sleep(60)

