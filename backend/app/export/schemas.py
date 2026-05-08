"""
Pydantic schemas for the export module.

MetadataJson matches the required metadata.json structure described in Requirement 6.2.
"""
from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel


class ResponseEntry(BaseModel):
    """A single question/answer entry inside metadata.json (Req 6.2)."""

    question: str
    answer: str  # "Yes" or "No"
    face_detected: bool
    score: int  # 0–100
    face_image: Optional[str] = None  # relative path inside the ZIP, e.g. "images/q1_face.png"


class MetadataJson(BaseModel):
    """
    Full metadata.json schema for a submission export (Req 6.2).

    This schema is used both for serialization (writing metadata.json into the ZIP)
    and for deserialization (round-trip validation, Property 10).
    """

    submission_id: str
    survey_id: str
    started_at: datetime
    completed_at: Optional[datetime] = None
    ip_address: str
    device: str
    browser: str
    os: str
    location: Optional[str] = None
    responses: List[ResponseEntry]
    overall_score: Optional[int] = None

    model_config = {"from_attributes": True}
