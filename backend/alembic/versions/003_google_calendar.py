"""Add Google Calendar token table.

Revision ID: 003
Revises: 002
Create Date: 2026-05-22 00:00:00.000002
"""
from alembic import op
import sqlalchemy as sa

revision = '003'
down_revision = '002'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        'google_calendar_token',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('user_id', sa.UUID(), nullable=True),
        sa.Column('access_token', sa.String(), nullable=False),
        sa.Column('refresh_token', sa.String(), nullable=False),
        sa.Column('token_uri', sa.String(), nullable=False),
        sa.Column('client_id', sa.String(), nullable=True),
        sa.Column('client_secret', sa.String(), nullable=True),
        sa.Column('scopes', sa.String(), nullable=False),
        sa.Column('expiry', sa.DateTime(), nullable=True),
        sa.Column('calendar_id', sa.String(), nullable=True),
        sa.Column('active', sa.Boolean(), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['user_id'], ['user.id']),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_google_calendar_token_user_id'), 'google_calendar_token', ['user_id'], unique=False)


def downgrade() -> None:
    op.drop_index(op.f('ix_google_calendar_token_user_id'), table_name='google_calendar_token')
    op.drop_table('google_calendar_token')

