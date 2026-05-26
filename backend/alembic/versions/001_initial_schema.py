"""Initial schema with roles, users, news, notices, activities, galleries, images and history.

Revision ID: 001
Revises:
Create Date: 2026-05-22 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
import sqlmodel
from uuid import uuid4


# revision identifiers, used by Alembic.
revision = '001'
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Create role table
    op.create_table(
        'role',
        sa.Column('id', sa.UUID(), nullable=False, default=uuid4),
        sa.Column('name', sa.String(), nullable=False),
        sa.PrimaryKeyConstraint('id')
    )

    # Create user table
    op.create_table(
        'user',
        sa.Column('id', sa.UUID(), nullable=False, default=uuid4),
        sa.Column('name', sa.String(), nullable=False),
        sa.Column('email', sa.String(), nullable=False),
        sa.Column('password_hash', sa.String(), nullable=False),
        sa.Column('role_id', sa.UUID(), nullable=True),
        sa.ForeignKeyConstraint(['role_id'], ['role.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_user_email'), 'user', ['email'], unique=False)

    # Create news table
    op.create_table(
        'news',
        sa.Column('id', sa.UUID(), nullable=False, default=uuid4),
        sa.Column('title', sa.String(), nullable=False),
        sa.Column('slug', sa.String(), nullable=False),
        sa.Column('excerpt', sa.String(), nullable=True),
        sa.Column('content', sa.String(), nullable=True),
        sa.Column('cover_image', sa.String(), nullable=True),
        sa.Column('status', sa.String(), nullable=False),
        sa.Column('publish_at', sa.DateTime(), nullable=True),
        sa.Column('author_id', sa.UUID(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['author_id'], ['user.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_news_slug'), 'news', ['slug'], unique=False)
    op.create_index(op.f('ix_news_publish_at'), 'news', ['publish_at'], unique=False)

    # Create notice table
    op.create_table(
        'notice',
        sa.Column('id', sa.UUID(), nullable=False, default=uuid4),
        sa.Column('title', sa.String(), nullable=False),
        sa.Column('content', sa.String(), nullable=False),
        sa.Column('audience', sa.String(), nullable=False),
        sa.Column('start_at', sa.DateTime(), nullable=True),
        sa.Column('end_at', sa.DateTime(), nullable=True),
        sa.Column('pinned', sa.Boolean(), nullable=False),
        sa.Column('created_by', sa.UUID(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['created_by'], ['user.id'], ),
        sa.PrimaryKeyConstraint('id')
    )

    # Create activity table
    op.create_table(
        'activity',
        sa.Column('id', sa.UUID(), nullable=False, default=uuid4),
        sa.Column('title', sa.String(), nullable=False),
        sa.Column('description', sa.String(), nullable=True),
        sa.Column('date', sa.DateTime(), nullable=True),
        sa.Column('location', sa.String(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.PrimaryKeyConstraint('id')
    )

    # Create gallery table
    op.create_table(
        'gallery',
        sa.Column('id', sa.UUID(), nullable=False, default=uuid4),
        sa.Column('title', sa.String(), nullable=False),
        sa.Column('description', sa.String(), nullable=True),
        sa.Column('cover_image', sa.String(), nullable=True),
        sa.PrimaryKeyConstraint('id')
    )

    # Create image table
    op.create_table(
        'image',
        sa.Column('id', sa.UUID(), nullable=False, default=uuid4),
        sa.Column('gallery_id', sa.UUID(), nullable=True),
        sa.Column('url', sa.String(), nullable=False),
        sa.Column('thumbnail_url', sa.String(), nullable=True),
        sa.Column('alt_text', sa.String(), nullable=True),
        sa.Column('uploaded_by', sa.UUID(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['gallery_id'], ['gallery.id'], ),
        sa.ForeignKeyConstraint(['uploaded_by'], ['user.id'], ),
        sa.PrimaryKeyConstraint('id')
    )

    # Create history table
    op.create_table(
        'history',
        sa.Column('id', sa.UUID(), nullable=False, default=uuid4),
        sa.Column('content', sa.String(), nullable=True),
        sa.Column('last_updated_by', sa.UUID(), nullable=True),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['last_updated_by'], ['user.id'], ),
        sa.PrimaryKeyConstraint('id')
    )


def downgrade() -> None:
    op.drop_table('history')
    op.drop_table('image')
    op.drop_table('gallery')
    op.drop_table('activity')
    op.drop_table('notice')
    op.drop_index(op.f('ix_news_publish_at'), table_name='news')
    op.drop_index(op.f('ix_news_slug'), table_name='news')
    op.drop_table('news')
    op.drop_index(op.f('ix_user_email'), table_name='user')
    op.drop_table('user')
    op.drop_table('role')

