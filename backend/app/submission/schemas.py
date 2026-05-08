from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field


# ---------------------------------------------------------------------------
# Request schemas
# ---------------------------------------------------------------------------

class StartSubmissionRequest(BaseModel):
    """Payload sent by the Frontend when a respondent starts a survey."""
    ip: str = Field(..., description="Respondent IP address")
    user_agent: str = Field(..., description="Raw User-Agent string")
    device: str = Field(..., description="Device type: Mobile/Desktop/Tablet")
    os: str = Field(..., description="Operating system name")
    browser: str = Field(..., description="Browser name")


class SubmitAnswerRequest(BaseModel):
    """Payload for submitting a single question answer."""
    question_id: str
    answer: str = Field(..., pattern="^(Yes|No)$")
    face_detected: bool
    face_score: int = Field(..., ge=0, le=100)
    # Base64-encoded face snapshot image (optional — may be sent as multipart separately)
    face_image_base64: Optional[str] = Field(None, description="Base64-encoded PNG face snapshot")


class ViolationRequest(BaseModel):
    """Payload for reporting a multi-face violation."""
    violation_type: str = Field(default="multiple_faces")


# ---------------------------------------------------------------------------
# Response schemas
# ---------------------------------------------------------------------------

class StartSubmissionResponse(BaseModel):
    submission_id: str
    current_question_index: int

    model_config = {"from_attributes": True}


class ResumeSubmissionResponse(BaseModel):
    submission_id: Optional[str]
    current_question_index: Optional[int] = None
    violation_count: Optional[int] = None

    model_config = {"from_attributes": True}


class SubmitAnswerResponse(BaseModel):
    answer_id: str
    current_question_index: int

    model_config = {"from_attributes": True}


class MediaUploadResponse(BaseModel):
    media_id: str
    path: str

    model_config = {"from_attributes": True}


class ViolationResponse(BaseModel):
    violation_count: int
    is_terminated: bool

    model_config = {"from_attributes": True}


class CompleteSubmissionResponse(BaseModel):
    submission_id: str
    completed_at: datetime
    overall_score: Optional[int]

    model_config = {"from_attributes": True}
