"""Bring the database schema up to date via Alembic.

Replaces the old Base.metadata.create_all() pattern, which only creates
missing tables and can never apply an ALTER — so any schema change required
deleting the SQLite file by hand. Both main.py and seed_data.py call this at
startup so the schema is always migration-driven, in dev and in containers.
"""
import os

from alembic.config import Config

from alembic import command


def run_migrations() -> None:
    here = os.path.dirname(os.path.abspath(__file__))
    cfg = Config(os.path.join(here, "alembic.ini"))
    cfg.set_main_option("script_location", os.path.join(here, "alembic"))
    command.upgrade(cfg, "head")
