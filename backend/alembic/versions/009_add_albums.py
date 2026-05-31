"""Add albums table and update images to use album_id instead of gallery_id

Revision ID: 009
Revises: 008
Create Date: 2024-05-26

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


# revision identifiers, used by Alembic.
revision = '009'
down_revision = '008'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Create album table
    op.create_table(
        'album',
        sa.Column('id', postgresql.UUID(), nullable=False),
        sa.Column('gallery_id', postgresql.UUID(), nullable=True),
        sa.Column('title', sa.String(), nullable=False),
        sa.Column('description', sa.String(), nullable=True),
        sa.Column('cover_image', sa.String(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['gallery_id'], ['gallery.id'], ),
        sa.PrimaryKeyConstraint('id')
    )

    # Add album_id column to image table
    op.add_column('image', sa.Column('album_id', postgresql.UUID(), nullable=True))
    op.create_foreign_key('image_album_id_fk', 'image', 'album', ['album_id'], ['id'])


def downgrade() -> None:
    # Drop foreign key
    op.drop_constraint('image_album_id_fk', 'image', type_='foreignkey')

    # Remove album_id column
    op.drop_column('image', 'album_id')

    # Drop album table
    op.drop_table('album')



