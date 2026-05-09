from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import inspect, text

from backend.app.config.database import Base, engine
from backend.app.config.settings import settings
from backend.app.common.errors import (
    AppError,
    ConflictError,
    NotFoundError,
    ValidationError,
    app_error_handler,
    conflict_error_handler,
    not_found_handler,
    validation_error_handler,
)

# Import models so Base.metadata is populated before sync_schema runs
import backend.app.survey.models  # noqa: F401
import backend.app.submission.models  # noqa: F401


def sync_schema() -> None:
    """
    Creates tables that don't exist yet and adds any new columns.
    Never drops columns or tables — safe to run on every startup.
    """
    inspector = inspect(engine)
    Base.metadata.create_all(bind=engine, checkfirst=True)

    for table in Base.metadata.sorted_tables:
        if not inspector.has_table(table.name):
            continue
        existing_cols = {col["name"] for col in inspector.get_columns(table.name)}
        for col in table.columns:
            if col.name not in existing_cols:
                col_type = col.type.compile(engine.dialect)
                nullable = "NULL" if col.nullable else "NOT NULL"
                default = (
                    f"DEFAULT {col.default.arg}"
                    if col.default and not callable(col.default.arg)
                    else ""
                )
                with engine.connect() as conn:
                    conn.execute(
                        text(
                            f'ALTER TABLE "{table.name}" ADD COLUMN '
                            f'"{col.name}" {col_type} {nullable} {default}'
                        )
                    )
                    conn.commit()
                print(f"[db] Added column '{col.name}' to table '{table.name}'")

    print("[db] Schema sync complete")


@asynccontextmanager
async def lifespan(app: FastAPI):
    sync_schema()
    yield


app = FastAPI(
    title=settings.app_name,
    debug=settings.debug,
    lifespan=lifespan,
)

# ---------------------------------------------------------------------------
# CORS
# ---------------------------------------------------------------------------
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------------------------------------------------------------------
# Exception handlers
# ---------------------------------------------------------------------------
app.add_exception_handler(AppError, app_error_handler)
app.add_exception_handler(NotFoundError, not_found_handler)
app.add_exception_handler(ValidationError, validation_error_handler)
app.add_exception_handler(ConflictError, conflict_error_handler)

# ---------------------------------------------------------------------------
# Routers
# ---------------------------------------------------------------------------
from backend.app.survey.routes import router as survey_router
from backend.app.submission.routes import router as submission_router
from backend.app.export.routes import router as export_router

app.include_router(survey_router, prefix="/api")
app.include_router(submission_router, prefix="/api")
app.include_router(export_router, prefix="/api")


@app.get("/health")
def health_check():
    return {"status": "ok"}


@app.get("/api/my-ip")
def my_ip(request: Request):
    """Return the client's real IP address so the frontend can pass it to start/resume."""
    forwarded_for = request.headers.get("x-forwarded-for")
    if forwarded_for:
        ip = forwarded_for.split(",")[0].strip()
    else:
        ip = request.client.host if request.client else "0.0.0.0"
    return {"ip": ip}
