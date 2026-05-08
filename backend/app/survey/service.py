from backend.app.common.base_service import BaseService
from backend.app.common.errors import NotFoundError, ValidationError
from backend.app.survey.models import Survey, SurveyQuestion
from backend.app.survey.repository import SurveyRepository

REQUIRED_QUESTION_COUNT = 5
MIN_ORDER = 1
MAX_ORDER = 5


class SurveyService(BaseService):
    def __init__(self, repository: SurveyRepository):
        self.repository = repository

    def create_survey(self, title: str) -> Survey:
        return self.repository.create_survey(title)

    def add_question(self, survey_id: str, question_text: str, order: int) -> SurveyQuestion:
        # Requirement 1.3: order must be 1–5
        if order < MIN_ORDER or order > MAX_ORDER:
            raise ValidationError(f"Question order must be between {MIN_ORDER} and {MAX_ORDER}.")

        survey = self.repository.get_by_id(survey_id)
        if survey is None:
            raise NotFoundError(f"Survey '{survey_id}' not found.")

        # No more than 5 questions total
        existing_count = self.repository.count_questions(survey_id)
        if existing_count >= REQUIRED_QUESTION_COUNT:
            raise ValidationError("Survey already has 5 questions. No more can be added.")

        # Order must not already be taken
        existing_orders = self.repository.get_existing_orders(survey_id)
        if order in existing_orders:
            raise ValidationError(f"A question with order {order} already exists in this survey.")

        return self.repository.add_question(survey_id, question_text, order)

    def add_questions_bulk(self, survey_id: str, questions: list) -> list:
        """Add questions in bulk — fills remaining slots, rejects duplicates and overflow."""
        survey = self.repository.get_by_id(survey_id)
        if survey is None:
            raise NotFoundError(f"Survey '{survey_id}' not found.")

        existing_orders = self.repository.get_existing_orders(survey_id)
        existing_count = len(existing_orders)
        incoming_orders = [q.order for q in questions]

        # Reject duplicate orders within the incoming batch
        if len(incoming_orders) != len(set(incoming_orders)):
            raise ValidationError("Duplicate order values in the request.")

        # Reject orders that conflict with already-saved questions
        conflicts = set(incoming_orders) & existing_orders
        if conflicts:
            raise ValidationError(
                f"Order(s) {sorted(conflicts)} already exist in this survey."
            )

        # Reject if total would exceed 5
        if existing_count + len(questions) > REQUIRED_QUESTION_COUNT:
            slots_left = REQUIRED_QUESTION_COUNT - existing_count
            raise ValidationError(
                f"Survey already has {existing_count} question(s). "
                f"You can only add {slots_left} more."
            )

        # All orders must be in 1–5
        bad_orders = [o for o in incoming_orders if o < MIN_ORDER or o > MAX_ORDER]
        if bad_orders:
            raise ValidationError(f"Order(s) {bad_orders} are outside the allowed range 1–5.")

        return self.repository.add_questions_bulk(
            survey_id,
            [{"question_text": q.question_text, "order": q.order} for q in questions],
        )

    def get_survey_with_questions(self, survey_id: str) -> Survey:
        survey = self.repository.get_survey_with_questions(survey_id)
        if survey is None:
            raise NotFoundError(f"Survey '{survey_id}' not found.")
        return survey

    def publish_survey(self, survey_id: str) -> Survey:
        survey = self.repository.get_by_id(survey_id)
        if survey is None:
            raise NotFoundError(f"Survey '{survey_id}' not found.")

        # Requirement 1.5: must have exactly 5 questions before publishing
        count = self.repository.count_questions(survey_id)
        if count != REQUIRED_QUESTION_COUNT:
            raise ValidationError(
                f"Survey must have exactly {REQUIRED_QUESTION_COUNT} questions to publish; found {count}."
            )

        return self.repository.set_active(survey)
