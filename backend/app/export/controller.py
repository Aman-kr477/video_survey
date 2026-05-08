from fastapi.responses import Response

from backend.app.export.service import ExportService


class ExportController:
    """Bridges routes and ExportService. No logic here — just calls the right service method."""

    def __init__(self, service: ExportService):
        self.service = service

    def export(self, submission_id: str) -> Response:
        zip_bytes = self.service.build_export_zip(submission_id)
        return Response(
            content=zip_bytes,
            media_type="application/zip",
            headers={
                "Content-Disposition": f'attachment; filename="submission_{submission_id}.zip"'
            },
        )
