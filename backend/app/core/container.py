"""
Dependency Injection Container.

Wiring order per module:
  1. Repository  (needs DB session)
  2. Service     (needs repository)
  3. Controller  (needs service)

Routes import `container` and call e.g. `container.survey_ctrl.create(payload)`.
The DB session is injected per-request via FastAPI's Depends(get_db) at the
container level — controllers never touch the DB directly.
"""
from fastapi import Depends
from sqlalchemy.orm import Session

from backend.app.config.database import get_db
from backend.app.survey.repository import SurveyRepository
from backend.app.survey.service import SurveyService
from backend.app.survey.controller import SurveyController
from backend.app.submission.repository import SubmissionRepository
from backend.app.submission.service import SubmissionService
from backend.app.submission.controller import SubmissionController
from backend.app.export.service import ExportService
from backend.app.export.controller import ExportController


def get_survey_controller(db: Session = Depends(get_db)) -> SurveyController:
    repo = SurveyRepository(db)
    service = SurveyService(repo)
    return SurveyController(service)


def get_submission_controller(db: Session = Depends(get_db)) -> SubmissionController:
    repo = SubmissionRepository(db)
    service = SubmissionService(repo)
    return SubmissionController(service)


def get_export_controller(db: Session = Depends(get_db)) -> ExportController:
    service = ExportService(db)
    return ExportController(service)
