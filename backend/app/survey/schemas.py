from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, Field


# ---------------------------------------------------------------------------
# Request schemas
# ---------------------------------------------------------------------------

class SurveyCreateRequest(BaseModel):
    title: str = Field(..., min_length=1, max_length=255)


class QuestionCreateRequest(BaseModel):
    question_text: str = Field(..., min_length=1, max_length=1024)
    order: int = Field(..., ge=1, le=5)


class BulkQuestionsCreateRequest(BaseModel):
    """Add remaining questions in a single request (1–5 items, service validates the total)."""
    questions: List[QuestionCreateRequest] = Field(..., min_length=1, max_length=5)


# ---------------------------------------------------------------------------
# Response schemas
# ---------------------------------------------------------------------------

class QuestionResponse(BaseModel):
    id: str
    survey_id: str
    question_text: str
    order: int
    created_at: datetime

    model_config = {"from_attributes": True}


class SurveyResponse(BaseModel):
    id: str
    title: str
    is_active: bool
    created_at: datetime

    model_config = {"from_attributes": True}


class SurveyWithQuestionsResponse(BaseModel):
    id: str
    title: str
    is_active: bool
    created_at: datetime
    questions: List[QuestionResponse] = []

    model_config = {"from_attributes": True}
