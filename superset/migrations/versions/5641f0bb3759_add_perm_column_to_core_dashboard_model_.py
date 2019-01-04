"""add_perm_column_to_core_dashboard_model.py

Revision ID: 5641f0bb3759
Revises: f1630a1380dd
Create Date: 2018-11-14 12:04:07.132408

"""

# revision identifiers, used by Alembic.
revision = '5641f0bb3759'
down_revision = 'f1630a1380dd'

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

def upgrade():
    op.add_column('dashboards', sa.Column('perm', sa.String(length=1500), nullable=True))

def downgrade():
    op.drop_column('dashboards', 'perm')
