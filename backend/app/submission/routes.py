from fastapi import APIRouter, Depends, UploadFile, File

from backend.app.core.container import get_submission_controller
from backend.app.submission.controller import SubmissionController
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
    SubmissionStateResponse,
)

router = APIRouter(tags=["submissions"])


@router.post("/surveys/{survey_id}/start", response_model=StartSubmissionResponse, status_code=201)
def start_submission(
    survey_id: str,
    payload: StartSubmissionRequest,
    ctrl: SubmissionController = Depends(get_submission_controller),
):
    return ctrl.start(survey_id, payload)


@router.get("/surveys/{survey_id}/resume", response_model=ResumeSubmissionResponse)
def resume_submission(
    survey_id: str,
    ip: str,
    browser: str,
    os: str,
    device: str,
    ctrl: SubmissionController = Depends(get_submission_controller),
):
    return ctrl.resume(survey_id, ip, browser, os, device)


@router.post("/submissions/{submission_id}/answers", response_model=SubmitAnswerResponse, status_code=201)
def submit_answer(
    submission_id: str,
    payload: SubmitAnswerRequest,
    ctrl: SubmissionController = Depends(get_submission_controller),
):
    return ctrl.submit_answer(submission_id, payload)


@router.post("/submissions/{submission_id}/media", response_model=MediaUploadResponse, status_code=201)
async def upload_media(
    submission_id: str,
    file: UploadFile = File(...),
    ctrl: SubmissionController = Depends(get_submission_controller),
):
    return await ctrl.upload_media(submission_id, file)


@router.post("/submissions/{submission_id}/violation", response_model=ViolationResponse)
def record_violation(
    submission_id: str,
    payload: ViolationRequest,
    ctrl: SubmissionController = Depends(get_submission_controller),
):
    return ctrl.record_violation(submission_id, payload)


@router.post("/submissions/{submission_id}/complete", response_model=CompleteSubmissionResponse)
def complete_submission(
    submission_id: str,
    ctrl: SubmissionController = Depends(get_submission_controller),
):
    return ctrl.complete(submission_id)


@router.get("/submissions/{submission_id}", response_model=SubmissionStateResponse)
def get_submission_state(
    submission_id: str,
    ctrl: SubmissionController = Depends(get_submission_controller),
):
    """Fetch current submission state by ID — used for session restore on page refresh."""
    return ctrl.get_state(submission_id)
