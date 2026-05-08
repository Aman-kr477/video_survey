from sqlalchemy import Boolean, Column, ForeignKey, Integer, String
from sqlalchemy.orm import relationship

from backend.app.common.base_model import BaseModel


class Survey(BaseModel):
    """Survey entity — a collection of exactly 5 Yes/No questions."""

    __tablename__ = "surveys"

    title = Column(String(255), nullable=False)
    is_active = Column(Boolean, default=False, nullable=False)

    questions = relationship(
        "SurveyQuestion",
        back_populates="survey",
        cascade="all, delete-orphan",
        order_by="SurveyQuestion.order",
    )
    submissions = relationship(
        "SurveySubmission",
        back_populates="survey",
        cascade="all, delete-orphan",
    )


class SurveyQuestion(BaseModel):
    """A single Yes/No question belonging to a survey, ordered 1–5."""

    __tablename__ = "survey_questions"

    survey_id = Column(String(36), ForeignKey("surveys.id"), nullable=False)
    question_text = Column(String(1024), nullable=False)
    order = Column(Integer, nullable=False)  # 1–5

    survey = relationship("Survey", back_populates="questions")
    answers = relationship(
        "SurveyAnswer",
        back_populates="question",
        cascade="all, delete-orphan",
    )
