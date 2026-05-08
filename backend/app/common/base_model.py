import uuid
from datetime import datetime

from sqlalchemy import Column, DateTime, String
from backend.app.config.database import Base


class BaseModel(Base):

    __abstract__ = True

    id = Column(
        String(36),
        primary_key=True,
        default=lambda: str(uuid.uuid4()),
        nullable=False,
    )
    created_at = Column(
        DateTime,
        default=datetime.utcnow,
        nullable=False,
    )
