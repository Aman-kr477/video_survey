from datetime import datetime
from typing import Optional

from sqlalchemy.orm import Session

from backend.app.common.base_repository import BaseRepository
from backend.app.submission.models import MediaFile, SurveyAnswer, SurveySubmission


class SubmissionRepository(BaseRepository[SurveySubmission]):
    def __init__(self, db: Session):
        super().__init__(SurveySubmission, db)

    # ------------------------------------------------------------------
    # Creation
    # ------------------------------------------------------------------

    def create_submission(
        self,
        survey_id: str,
        ip_address: str,
        device: str,
        browser: str,
        os: str,
        location: Optional[str],
        started_at: datetime,
    ) -> SurveySubmission:
        """Create a new SurveySubmission with initial state (Req 9.1)."""
        submission = SurveySubmission(
            survey_id=survey_id,
            ip_address=ip_address,
            device=device,
            browser=browser,
            os=os,
            location=location,
            started_at=started_at,
            current_question_index=1,
            violation_count=0,
            is_terminated=False,
        )
        return self.create(submission)

    # ------------------------------------------------------------------
    # Session fingerprint lookup (Req 9.3)
    # ------------------------------------------------------------------

    def find_by_fingerprint(
        self,
        survey_id: str,
        ip_address: str,
        browser: str,
        os: str,
        device: str,
    ) -> Optional[SurveySubmission]:
        """Return an active (non-terminated, incomplete) submission matching the fingerprint."""
        return (
            self.db.query(SurveySubmission)
            .filter(
                SurveySubmission.survey_id == survey_id,
                SurveySubmission.ip_address == ip_address,
                SurveySubmission.browser == browser,
                SurveySubmission.os == os,
                SurveySubmission.device == device,
                SurveySubmission.current_question_index < 6,
                SurveySubmission.is_terminated == False,  # noqa: E712
            )
            .first()
        )

    # ------------------------------------------------------------------
    # Answer persistence (Req 9.2)
    # ------------------------------------------------------------------

    def save_answer(
        self,
        submission_id: str,
        question_id: str,
        answer: str,
        face_detected: bool,
        face_score: int,
        face_image_path: Optional[str],
        next_question_index: int,
    ) -> SurveyAnswer:
        """Persist a SurveyAnswer and advance current_question_index."""
        survey_answer = SurveyAnswer(
            submission_id=submission_id,
            question_id=question_id,
            answer=answer,
            face_detected=face_detected,
            face_score=face_score,
            face_image_path=face_image_path,
        )
        self.db.add(survey_answer)

        # Advance progress tracker (Req 9.2)
        submission = self.get_by_id(submission_id)
        if submission:
            submission.current_question_index = next_question_index

        self.db.commit()
        self.db.refresh(survey_answer)
        return survey_answer

    # ------------------------------------------------------------------
    # Media file persistence (Req 5.1, 5.4)
    # ------------------------------------------------------------------

    def save_media_file(
        self,
        submission_id: str,
        file_type: str,
        path: str,
    ) -> MediaFile:
        """Persist a MediaFile record with the stored path."""
        media_file = MediaFile(
            submission_id=submission_id,
            type=file_type,
            path=path,
        )
        self.db.add(media_file)
        self.db.commit()
        self.db.refresh(media_file)
        return media_file

    # ------------------------------------------------------------------
    # Violation state machine (Req 3.7)
    # ------------------------------------------------------------------

    def increment_violation(self, submission_id: str) -> SurveySubmission:
        """Increment violation_count; set is_terminated=True when count reaches 3."""
        submission = self.get_by_id(submission_id)
        if submission is None:
            return None  # caller handles NotFoundError
        submission.violation_count += 1
        if submission.violation_count >= 3:
            submission.is_terminated = True
        return self.update(submission)

    # ------------------------------------------------------------------
    # Completion (Req 9.1 overall_score)
    # ------------------------------------------------------------------

    def complete_submission(self, submission_id: str) -> SurveySubmission:
        """Set completed_at and compute overall_score as average face_score."""
        submission = self.get_by_id(submission_id)
        if submission is None:
            return None  # caller handles NotFoundError

        submission.completed_at = datetime.utcnow()

        # Compute overall_score from all answers
        answers = (
            self.db.query(SurveyAnswer)
            .filter(SurveyAnswer.submission_id == submission_id)
            .all()
        )
        if answers:
            submission.overall_score = round(
                sum(a.face_score for a in answers) / len(answers)
            )

        return self.update(submission)
