"""add icon column to custom_badges

Revision ID: c766ca824a3f
Revises: 6cabfa763ddf
Create Date: 2026-09-14 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'c766ca824a3f'
down_revision = '6cabfa763ddf'
branch_labels = None
depends_on = None


def upgrade():
    op.add_column('custom_badges', sa.Column('icon', sa.String(), nullable=False, server_default='sparkle'))


def downgrade():
    op.drop_column('custom_badges', 'icon')
