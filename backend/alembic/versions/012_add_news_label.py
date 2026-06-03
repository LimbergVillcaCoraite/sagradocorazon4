"""Add label to news

Revision ID: 012
Revises: 011
Create Date: 2026-05-31

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = '012'
down_revision = '011'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column('news', sa.Column('label', sa.String(), nullable=True))


def downgrade() -> None:
    op.drop_column('news', 'label')

