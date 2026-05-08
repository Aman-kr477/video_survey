from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, DeclarativeBase
from backend.app.config.settings import settings


def _build_engine(url: str):
    """Build a SQLAlchemy engine appropriate for the given URL.

    PostgreSQL (production): uses PgBouncer-compatible pool settings.
    SQLite (testing): uses minimal settings compatible with the dialect.
    """
    if url.startswith("sqlite"):
        return create_engine(url, connect_args={"check_same_thread": False})

    # Supabase / PgBouncer transaction-mode requirements:
    # - pool_pre_ping=False  — PgBouncer handles keepalives
    # - pool_size=0, max_overflow=-1 — let PgBouncer manage the pool
    # - prepare_threshold=None — disable prepared statements
    return create_engine(
        url,
        pool_pre_ping=False,
        pool_size=0,
        max_overflow=-1,
        connect_args={
            "options": "-c statement_timeout=30000",
            "prepare_threshold": None,
        },
    )


engine = _build_engine(settings.database_url)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


class Base(DeclarativeBase):
    pass


def get_db():
    """FastAPI dependency that provides a database session."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
