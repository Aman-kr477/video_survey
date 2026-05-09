import base64
import os
from datetime import datetime
from typing import Optional

import httpx
import user_agents

from backend.app.common.base_service import BaseService
from backend.app.common.errors import NotFoundError, ValidationError
from backend.app.config.settings import settings
from backend.app.submission.models import MediaFile, SurveyAnswer, SurveySubmission
from backend.app.submission.repository import SubmissionRepository


class SubmissionService(BaseService):
    def __init__(self, repository: SubmissionRepository):
        self.repository = repository

    # ------------------------------------------------------------------
    # Start a new submission (Req 4.1, 4.3, 4.4, 9.1)
    # ------------------------------------------------------------------

    def start_submission(
        self,
        survey_id: str,
        ip: str,
        user_agent_string: str,
        device: str,
        os_name: str,
        browser: str,
        location: Optional[str] = None,
    ) -> SurveySubmission:
        """Create a new SurveySubmission with parsed metadata."""
        parsed_device, parsed_os, parsed_browser = self._parse_user_agent(
            user_agent_string, device, os_name, browser
        )

        # Use browser-provided location if available, fall back to IP geolocation
        resolved_location = location if location and location != "Unknown" else self._geolocate_ip(ip)

        return self.repository.create_submission(
            survey_id=survey_id,
            ip_address=ip,
            device=parsed_device,
            browser=parsed_browser,
            os=parsed_os,
            location=resolved_location,
            started_at=datetime.utcnow(),
        )

    # ------------------------------------------------------------------
    # Resume an existing session (Req 9.3)
    # ------------------------------------------------------------------

    def find_resumable_submission(
        self,
        survey_id: str,
        ip: str,
        browser: str,
        os_name: str,
        device: str,
    ) -> Optional[SurveySubmission]:
        """Return an active submission matching the session fingerprint, or None."""
        return self.repository.find_by_fingerprint(
            survey_id=survey_id,
            ip_address=ip,
            browser=browser,
            os=os_name,
            device=device,
        )

    # ------------------------------------------------------------------
    # Submit an answer (Req 5.2, 9.2)
    # ------------------------------------------------------------------

    def submit_answer(
        self,
        submission_id: str,
        question_id: str,
        answer: str,
        face_detected: bool,
        face_score: int,
        face_image_base64: Optional[str],
    ) -> SurveyAnswer:
        """Persist an answer, store face snapshot, and advance question index."""
        submission = self.repository.get_by_id(submission_id)
        if submission is None:
            raise NotFoundError(f"Submission '{submission_id}' not found.")

        if submission.is_terminated:
            raise ValidationError("This survey session has been terminated.")

        # Req 5.2 — store face snapshot to filesystem
        face_image_path: Optional[str] = None
        if face_image_base64:
            face_image_path = self._store_face_image(
                submission_id=submission_id,
                question_index=submission.current_question_index,
                image_base64=face_image_base64,
            )

        next_index = submission.current_question_index + 1  # Req 9.2

        return self.repository.save_answer(
            submission_id=submission_id,
            question_id=question_id,
            answer=answer,
            face_detected=face_detected,
            face_score=face_score,
            face_image_path=face_image_path,
            next_question_index=next_index,
        )

    # ------------------------------------------------------------------
    # Store a media file (Req 5.1, 5.3, 5.4)
    # ------------------------------------------------------------------

    def store_media_file(
        self,
        submission_id: str,
        file_type: str,
        file_bytes: bytes,
        filename: str,
    ) -> MediaFile:
        """Save a video or image file to the filesystem and record the path."""
        submission = self.repository.get_by_id(submission_id)
        if submission is None:
            raise NotFoundError(f"Submission '{submission_id}' not found.")

        # Req 5.3 — consistent directory structure
        relative_path = os.path.join("submissions", submission_id, filename)
        absolute_path = os.path.join(settings.media_root, relative_path)

        os.makedirs(os.path.dirname(absolute_path), exist_ok=True)
        with open(absolute_path, "wb") as f:
            f.write(file_bytes)

        return self.repository.save_media_file(
            submission_id=submission_id,
            file_type=file_type,
            path=relative_path,
        )

    # ------------------------------------------------------------------
    # Record a violation (Req 3.7)
    # ------------------------------------------------------------------

    def record_violation(self, submission_id: str) -> SurveySubmission:
        """Increment violation count; terminate session at 3 violations."""
        submission = self.repository.get_by_id(submission_id)
        if submission is None:
            raise NotFoundError(f"Submission '{submission_id}' not found.")

        return self.repository.increment_violation(submission_id)

    # ------------------------------------------------------------------
    # Complete a submission
    # ------------------------------------------------------------------

    def complete_submission(self, submission_id: str) -> SurveySubmission:
        """Mark submission as complete and compute overall_score."""
        submission = self.repository.get_by_id(submission_id)
        if submission is None:
            raise NotFoundError(f"Submission '{submission_id}' not found.")

        return self.repository.complete_submission(submission_id)

    # ------------------------------------------------------------------
    # Private helpers
    # ------------------------------------------------------------------

    def _parse_user_agent(
        self,
        ua_string: str,
        fallback_device: str,
        fallback_os: str,
        fallback_browser: str,
    ):
        """Parse UA string; fall back to client-supplied values if parsing yields nothing."""
        try:
            ua = user_agents.parse(ua_string)
            device = (
                "Mobile" if ua.is_mobile
                else "Tablet" if ua.is_tablet
                else "Desktop"
            )
            os_name = ua.os.family or fallback_os
            browser = ua.browser.family or fallback_browser
        except Exception:
            device = fallback_device
            os_name = fallback_os
            browser = fallback_browser

        return device, os_name, browser

    def _geolocate_ip(self, ip: str) -> Optional[str]:
        """Perform IP geolocation; return country/region string or 'Unknown'."""
        # Skip loopback / private addresses
        if ip in ("127.0.0.1", "::1") or ip.startswith("192.168.") or ip.startswith("10."):
            return "Unknown"
        try:
            url = settings.geolocation_api_url.format(ip=ip)
            with httpx.Client(timeout=3.0) as client:
                response = client.get(url)
                if response.status_code == 200:
                    data = response.json()
                    return data.get("country_name") or data.get("region") or "Unknown"
        except Exception:
            pass
        return "Unknown"

    def _store_face_image(
        self,
        submission_id: str,
        question_index: int,
        image_base64: str,
    ) -> str:
        """Decode base64 image and write to filesystem; return relative path."""
        filename = f"q{question_index}_face.png"
        relative_path = os.path.join("submissions", submission_id, filename)
        absolute_path = os.path.join(settings.media_root, relative_path)

        os.makedirs(os.path.dirname(absolute_path), exist_ok=True)

        # Strip data URI prefix if present (e.g. "data:image/png;base64,...")
        if "," in image_base64:
            image_base64 = image_base64.split(",", 1)[1]

        image_bytes = base64.b64decode(image_base64)
        with open(absolute_path, "wb") as f:
            f.write(image_bytes)

        return relative_path
