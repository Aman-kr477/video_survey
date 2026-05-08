from typing import List

from backend.app.survey.service import SurveyService
from backend.app.survey.schemas import (
    BulkQuestionsCreateRequest,
    SurveyCreateRequest,
    SurveyResponse,
    QuestionCreateRequest,
    QuestionResponse,
    SurveyWithQuestionsResponse,
)


class SurveyController:
    """Bridges routes and SurveyService. No logic here — just calls the right service method."""

    def __init__(self, service: SurveyService):
        self.service = service

    def create(self, payload: SurveyCreateRequest) -> SurveyResponse:
        return self.service.create_survey(payload.title)

    def add_question(self, survey_id: str, payload: QuestionCreateRequest) -> QuestionResponse:
        return self.service.add_question(survey_id, payload.question_text, payload.order)

    def add_questions_bulk(self, survey_id: str, payload: BulkQuestionsCreateRequest) -> List[QuestionResponse]:
        return self.service.add_questions_bulk(survey_id, payload.questions)

    def get(self, survey_id: str) -> SurveyWithQuestionsResponse:
        return self.service.get_survey_with_questions(survey_id)

    def publish(self, survey_id: str) -> SurveyResponse:
        return self.service.publish_survey(survey_id)
