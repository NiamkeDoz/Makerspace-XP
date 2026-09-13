"""add app_settings table

Revision ID: c3f1a4e6b2d7
Revises: 5bf1e01e85f7
Create Date: 2026-09-12 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'c3f1a4e6b2d7'
down_revision = '5bf1e01e85f7'
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        'app_settings',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('base_points', sa.Integer(), nullable=False, server_default='10'),
        sa.PrimaryKeyConstraint('id'),
    )


def downgrade():
    op.drop_table('app_settings')
