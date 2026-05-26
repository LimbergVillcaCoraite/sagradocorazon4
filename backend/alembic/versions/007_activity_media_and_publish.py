from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '007'
down_revision = '006'
depends_on = None


def upgrade() -> None:
    op.add_column('activity', sa.Column('attachments_json', sa.Text(), nullable=True))
    op.add_column('activity', sa.Column('publish_at', sa.DateTime(), nullable=True))


def downgrade() -> None:
    op.drop_column('activity', 'publish_at')
    op.drop_column('activity', 'attachments_json')

