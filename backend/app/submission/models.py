from sqlalchemy import Boolean, Column, DateTime, ForeignKey, Integer, String
from sqlalchemy.orm import relationship

from backend.app.common.base_model import BaseModel


class SurveySubmission(BaseModel):
    """
    A record of a user's completion of a survey.
    Includes metadata, progress tracking, violation tracking, and overall face score.
    """

    __tablename__ = "survey_submissions"

    survey_id = Column(String(36), ForeignKey("surveys.id"), nullable=False)
    ip_address = Column(String(45), nullable=False)  # IPv6 max length
    device = Column(String(50), nullable=False)  # Mobile/Desktop/Tablet
    browser = Column(String(100), nullable=False)
    os = Column(String(100), nullable=False)
    location = Column(String(255), nullable=True)  # Country/region from IP
    started_at = Column(DateTime, nullable=False)
    completed_at = Column(DateTime, nullable=True)
    overall_score = Column(Integer, nullable=True)  # Average face score (0–100)
    current_question_index = Column(Integer, default=1, nullable=False)  # 1–5
    violation_count = Column(Integer, default=0, nullable=False)
    is_terminated = Column(Boolean, default=False, nullable=False)

    survey = relationship("Survey", back_populates="submissions")
    answers = relationship(
        "SurveyAnswer",
        back_populates="submission",
        cascade="all, delete-orphan",
    )
    media_files = relationship(
        "MediaFile",
        back_populates="submission",
        cascade="all, delete-orphan",
    )


class SurveyAnswer(BaseModel):
    """
    A record of a user's answer to a single question.
    Includes face detection result, face score, and face image path.
    """

    __tablename__ = "survey_answers"

    submission_id = Column(String(36), ForeignKey("survey_submissions.id"), nullable=False)
    question_id = Column(String(36), ForeignKey("survey_questions.id"), nullable=False)
    answer = Column(String(10), nullable=False)  # "Yes" or "No"
    face_detected = Column(Boolean, nullable=False)
    face_score = Column(Integer, nullable=False)  # 0–100
    face_image_path = Column(String(512), nullable=True)

    submission = relationship("SurveySubmission", back_populates="answers")
    question = relationship("SurveyQuestion", back_populates="answers")


class MediaFile(BaseModel):
    """
    A record referencing a stored video or image file on the server filesystem.
    """

    __tablename__ = "media_files"

    submission_id = Column(String(36), ForeignKey("survey_submissions.id"), nullable=False)
    type = Column(String(20), nullable=False)  # "video" or "image"
    path = Column(String(512), nullable=False)  # Relative path

    submission = relationship("SurveySubmission", back_populates="media_files")
