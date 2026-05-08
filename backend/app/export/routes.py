from fastapi import APIRouter, Depends
from fastapi.responses import Response

from backend.app.core.container import get_export_controller
from backend.app.export.controller import ExportController

router = APIRouter(tags=["export"])


@router.get("/submissions/{submission_id}/export", response_class=Response)
def export_submission(
    submission_id: str,
    ctrl: ExportController = Depends(get_export_controller),
):
    return ctrl.export(submission_id)
