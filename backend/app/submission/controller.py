from fastapi import UploadFile

from backend.app.submission.service import SubmissionService
from backend.app.submission.schemas import (
    StartSubmissionRequest,
    StartSubmissionResponse,
    ResumeSubmissionResponse,
    SubmitAnswerRequest,
    SubmitAnswerResponse,
    MediaUploadResponse,
    ViolationRequest,
    ViolationResponse,
    CompleteSubmissionResponse,
)


class SubmissionController:
    """Bridges routes and SubmissionService. No logic here — just calls the right service method."""

    def __init__(self, service: SubmissionService):
        self.service = service

    def start(self, survey_id: str, payload: StartSubmissionRequest) -> StartSubmissionResponse:
        submission = self.service.start_submission(
            survey_id=survey_id,
            ip=payload.ip,
            user_agent_string=payload.user_agent,
            device=payload.device,
            os_name=payload.os,
            browser=payload.browser,
        )
        return StartSubmissionResponse(
            submission_id=submission.id,
            current_question_index=submission.current_question_index,
        )

    def resume(
        self,
        survey_id: str,
        ip: str,
        browser: str,
        os: str,
        device: str,
    ) -> ResumeSubmissionResponse:
        submission = self.service.find_resumable_submission(
            survey_id=survey_id,
            ip=ip,
            browser=browser,
            os_name=os,
            device=device,
        )
        if submission is None:
            return ResumeSubmissionResponse(submission_id=None)
        return ResumeSubmissionResponse(
            submission_id=submission.id,
            current_question_index=submission.current_question_index,
            violation_count=submission.violation_count,
        )

    def submit_answer(
        self, submission_id: str, payload: SubmitAnswerRequest
    ) -> SubmitAnswerResponse:
        answer = self.service.submit_answer(
            submission_id=submission_id,
            question_id=payload.question_id,
            answer=payload.answer,
            face_detected=payload.face_detected,
            face_score=payload.face_score,
            face_image_base64=payload.face_image_base64,
        )
        updated = self.service.repository.get_by_id(submission_id)
        return SubmitAnswerResponse(
            answer_id=answer.id,
            current_question_index=updated.current_question_index,
        )

    async def upload_media(
        self, submission_id: str, file: UploadFile
    ) -> MediaUploadResponse:
        file_bytes = await file.read()
        content_type = file.content_type or ""
        file_type = "video" if content_type.startswith("video") else "image"
        media_file = self.service.store_media_file(
            submission_id=submission_id,
            file_type=file_type,
            file_bytes=file_bytes,
            filename=file.filename or f"{file_type}.bin",
        )
        return MediaUploadResponse(media_id=media_file.id, path=media_file.path)

    def record_violation(
        self, submission_id: str, payload: ViolationRequest
    ) -> ViolationResponse:
        submission = self.service.record_violation(submission_id)
        return ViolationResponse(
            violation_count=submission.violation_count,
            is_terminated=submission.is_terminated,
        )

    def complete(self, submission_id: str) -> CompleteSubmissionResponse:
        submission = self.service.complete_submission(submission_id)
        return CompleteSubmissionResponse(
            submission_id=submission.id,
            completed_at=submission.completed_at,
            overall_score=submission.overall_score,
        )
