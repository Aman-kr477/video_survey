"""
ExportService — builds an in-memory ZIP archive for a submission (Req 6.1, 6.2, 6.4).

ZIP structure:
  metadata.json
  videos/full_session.mp4
  images/q1_face.png … images/q5_face.png
"""
import io
import json
import os
import zipfile
from typing import Optional

from sqlalchemy.orm import Session

from backend.app.common.errors import NotFoundError
from backend.app.config.settings import settings
from backend.app.export.schemas import MetadataJson, ResponseEntry
from backend.app.submission.models import SurveyAnswer, SurveySubmission
from backend.app.survey.models import SurveyQuestion


class ExportService:
    def __init__(self, db: Session):
        self.db = db

    # ------------------------------------------------------------------
    # Public API
    # ------------------------------------------------------------------

    def build_export_zip(self, submission_id: str) -> bytes:
        """
        Return the raw bytes of a ZIP archive for the given submission.
        Raises NotFoundError if the submission does not exist (Req 6.3).
        """
        submission = (
            self.db.query(SurveySubmission)
            .filter(SurveySubmission.id == submission_id)
            .first()
        )
        if submission is None:
            raise NotFoundError(f"Submission '{submission_id}' not found.")

        metadata = self._build_metadata(submission)
        buf = io.BytesIO()

        with zipfile.ZipFile(buf, mode="w", compression=zipfile.ZIP_DEFLATED) as zf:
            # metadata.json (Req 6.2, 6.4)
            zf.writestr("metadata.json", metadata.model_dump_json(indent=2))

            # Full session video — videos/full_session.mp4 (Req 6.1)
            self._add_media_file(zf, submission, "videos/full_session.mp4")

            # Per-question face snapshots — images/q{n}_face.png (Req 6.1)
            answers = self._get_ordered_answers(submission)
            for idx, answer in enumerate(answers, start=1):
                zip_path = f"images/q{idx}_face.png"
                self._add_face_image(zf, answer, zip_path)

        return buf.getvalue()

    # ------------------------------------------------------------------
    # Private helpers
    # ------------------------------------------------------------------

    def _build_metadata(self, submission: SurveySubmission) -> MetadataJson:
        """Serialize a SurveySubmission to the MetadataJson schema (Req 6.2)."""
        answers = self._get_ordered_answers(submission)
        responses = []
        for idx, answer in enumerate(answers, start=1):
            question_text = self._get_question_text(answer.question_id)
            responses.append(
                ResponseEntry(
                    question=question_text,
                    answer=answer.answer,
                    face_detected=answer.face_detected,
                    score=answer.face_score,
                    face_image=f"images/q{idx}_face.png" if answer.face_image_path else None,
                )
            )

        return MetadataJson(
            submission_id=submission.id,
            survey_id=submission.survey_id,
            started_at=submission.started_at,
            completed_at=submission.completed_at,
            ip_address=submission.ip_address,
            device=submission.device,
            browser=submission.browser,
            os=submission.os,
            location=submission.location,
            responses=responses,
            overall_score=submission.overall_score,
        )

    def _get_ordered_answers(self, submission: SurveySubmission):
        """Return answers ordered by the question's order field."""
        answers = (
            self.db.query(SurveyAnswer)
            .join(SurveyQuestion, SurveyAnswer.question_id == SurveyQuestion.id)
            .filter(SurveyAnswer.submission_id == submission.id)
            .order_by(SurveyQuestion.order)
            .all()
        )
        return answers

    def _get_question_text(self, question_id: str) -> str:
        question = (
            self.db.query(SurveyQuestion)
            .filter(SurveyQuestion.id == question_id)
            .first()
        )
        return question.question_text if question else ""

    def _add_media_file(
        self,
        zf: zipfile.ZipFile,
        submission: SurveySubmission,
        zip_path: str,
    ) -> None:
        """Add the full session video to the ZIP; write empty entry if not found."""
        from backend.app.submission.models import MediaFile

        media = (
            self.db.query(MediaFile)
            .filter(
                MediaFile.submission_id == submission.id,
                MediaFile.type == "video",
            )
            .first()
        )
        if media and media.path:
            abs_path = os.path.join(settings.media_root, media.path)
            if os.path.exists(abs_path):
                zf.write(abs_path, zip_path)
                return
        # Placeholder so the ZIP entry always exists (Req 6.1)
        zf.writestr(zip_path, b"")

    def _add_face_image(
        self,
        zf: zipfile.ZipFile,
        answer: SurveyAnswer,
        zip_path: str,
    ) -> None:
        """Add a face snapshot to the ZIP; write empty entry if file not found."""
        if answer.face_image_path:
            abs_path = os.path.join(settings.media_root, answer.face_image_path)
            if os.path.exists(abs_path):
                zf.write(abs_path, zip_path)
                return
        # Placeholder so the ZIP entry always exists (Req 6.1)
        zf.writestr(zip_path, b"")
