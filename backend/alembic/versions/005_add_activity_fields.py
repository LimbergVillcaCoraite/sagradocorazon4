"""Add cover_image and activity_type to Activity table.

Revision ID: 005
Revises: 004
Create Date: 2026-05-23 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '005'
down_revision = '004'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Add cover_image column to activity table
    op.add_column('activity', sa.Column('cover_image', sa.String(), nullable=True))

    # Add activity_type column to activity table
    op.add_column('activity', sa.Column('activity_type', sa.String(), nullable=True))


def downgrade() -> None:
    # Remove activity_type column
    op.drop_column('activity', 'activity_type')

    # Remove cover_image column
    op.drop_column('activity', 'cover_image')


