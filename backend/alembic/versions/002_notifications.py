"""Add notification and push subscription tables.

Revision ID: 002
Revises: 001
Create Date: 2026-05-22 00:00:00.000001
"""
from alembic import op
import sqlalchemy as sa

revision = '002'
down_revision = '001'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        'push_subscription',
        sa.Column('id', sa.Uuid(), nullable=False),
        sa.Column('user_id', sa.Uuid(), nullable=True),
        sa.Column('endpoint', sa.String(), nullable=False),
        sa.Column('p256dh', sa.String(), nullable=False),
        sa.Column('auth', sa.String(), nullable=False),
        sa.Column('expiration_time', sa.String(), nullable=True),
        sa.Column('active', sa.Boolean(), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['user_id'], ['user.id']),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_push_subscription_endpoint'), 'push_subscription', ['endpoint'], unique=False)
    op.create_index(op.f('ix_push_subscription_user_id'), 'push_subscription', ['user_id'], unique=False)

    op.create_table(
        'notification',
        sa.Column('id', sa.Uuid(), nullable=False),
        sa.Column('title', sa.String(), nullable=False),
        sa.Column('body', sa.String(), nullable=False),
        sa.Column('audience', sa.String(), nullable=False),
        sa.Column('source_type', sa.String(), nullable=True),
        sa.Column('source_id', sa.String(), nullable=True),
        sa.Column('created_by', sa.Uuid(), nullable=True),
        sa.Column('email_sent_count', sa.Integer(), nullable=False),
        sa.Column('push_sent_count', sa.Integer(), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['created_by'], ['user.id']),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_notification_audience'), 'notification', ['audience'], unique=False)


def downgrade() -> None:
    op.drop_index(op.f('ix_notification_audience'), table_name='notification')
    op.drop_table('notification')
    op.drop_index(op.f('ix_push_subscription_user_id'), table_name='push_subscription')
    op.drop_index(op.f('ix_push_subscription_endpoint'), table_name='push_subscription')
    op.drop_table('push_subscription')

