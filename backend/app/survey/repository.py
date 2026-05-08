from typing import Optional

from sqlalchemy.orm import Session

from backend.app.common.base_repository import BaseRepository
from backend.app.survey.models import Survey, SurveyQuestion


class SurveyRepository(BaseRepository[Survey]):
    def __init__(self, db: Session):
        super().__init__(Survey, db)

    def create_survey(self, title: str) -> Survey:
        survey = Survey(title=title)
        return self.create(survey)

    def add_question(self, survey_id: str, question_text: str, order: int) -> SurveyQuestion:
        question = SurveyQuestion(
            survey_id=survey_id,
            question_text=question_text,
            order=order,
        )
        self.db.add(question)
        self.db.commit()
        self.db.refresh(question)
        return question

    def add_questions_bulk(self, survey_id: str, questions: list) -> list:
        """Insert multiple questions in a single transaction."""
        records = [
            SurveyQuestion(survey_id=survey_id, question_text=q["question_text"], order=q["order"])
            for q in questions
        ]
        self.db.add_all(records)
        self.db.commit()
        for r in records:
            self.db.refresh(r)
        return records

    def get_survey_with_questions(self, survey_id: str) -> Optional[Survey]:
        return (
            self.db.query(Survey)
            .filter(Survey.id == survey_id)
            .first()
        )

    def count_questions(self, survey_id: str) -> int:
        return (
            self.db.query(SurveyQuestion)
            .filter(SurveyQuestion.survey_id == survey_id)
            .count()
        )

    def get_existing_orders(self, survey_id: str) -> set:
        """Return the set of order values already used for this survey."""
        rows = (
            self.db.query(SurveyQuestion.order)
            .filter(SurveyQuestion.survey_id == survey_id)
            .all()
        )
        return {r.order for r in rows}

    def set_active(self, survey: Survey) -> Survey:
        survey.is_active = True
        return self.update(survey)
