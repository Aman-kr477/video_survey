from fastapi import APIRouter, Depends
from typing import List

from backend.app.core.container import get_survey_controller
from backend.app.survey.controller import SurveyController
from backend.app.survey.schemas import (
    BulkQuestionsCreateRequest,
    SurveyCreateRequest,
    SurveyResponse,
    QuestionCreateRequest,
    QuestionResponse,
    SurveyWithQuestionsResponse,
)

router = APIRouter(prefix="/surveys", tags=["surveys"])


@router.post("/", response_model=SurveyResponse, status_code=201)
def create_survey(
    payload: SurveyCreateRequest,
    ctrl: SurveyController = Depends(get_survey_controller),
):
    return ctrl.create(payload)


@router.post("/{survey_id}/questions", response_model=QuestionResponse, status_code=201)
def add_question(
    survey_id: str,
    payload: QuestionCreateRequest,
    ctrl: SurveyController = Depends(get_survey_controller),
):
    return ctrl.add_question(survey_id, payload)


@router.post("/{survey_id}/questions/bulk", response_model=List[QuestionResponse], status_code=201)
def add_questions_bulk(
    survey_id: str,
    payload: BulkQuestionsCreateRequest,
    ctrl: SurveyController = Depends(get_survey_controller),
):
    """Add all 5 questions in a single request."""
    return ctrl.add_questions_bulk(survey_id, payload)


@router.get("/{survey_id}", response_model=SurveyWithQuestionsResponse)
def get_survey(
    survey_id: str,
    ctrl: SurveyController = Depends(get_survey_controller),
):
    return ctrl.get(survey_id)


@router.post("/{survey_id}/publish", response_model=SurveyResponse)
def publish_survey(
    survey_id: str,
    ctrl: SurveyController = Depends(get_survey_controller),
):
    return ctrl.publish(survey_id)
