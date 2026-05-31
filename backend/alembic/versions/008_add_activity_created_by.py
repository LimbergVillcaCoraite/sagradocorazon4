"""Add created_by to activity

Revision ID: 008
Revises: 001
Create Date: 2026-05-26 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = '008'
down_revision = '001'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column('activity', sa.Column('created_by', sa.UUID(), nullable=True))
    op.create_foreign_key('fk_activity_created_by_user', 'activity', 'user', ['created_by'], ['id'])


def downgrade() -> None:
    op.drop_constraint('fk_activity_created_by_user', 'activity', type_='foreignkey')
    op.drop_column('activity', 'created_by')

