from pathlib import Path
from urllib.parse import quote_plus

from pydantic import computed_field
from pydantic_settings import BaseSettings, SettingsConfigDict

# Always resolve .env relative to this file (backend/.env), regardless of cwd
_ENV_FILE = Path(__file__).resolve().parent.parent.parent / ".env"


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=str(_ENV_FILE),
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    # Database — individual parts assembled into a URL
    db_host: str = "localhost"
    db_port: int = 5432
    db_name: str = "postgres"
    db_user: str = "postgres"
    db_pass: str = "postgres"
    db_dialect: str = "postgresql"

    @computed_field
    @property
    def database_url(self) -> str:
        dialect = self.db_dialect if self.db_dialect != "postgres" else "postgresql"
        # URL-encode user and password to handle special chars like @, #, etc.
        user = quote_plus(self.db_user)
        password = quote_plus(self.db_pass)
        return f"{dialect}://{user}:{password}@{self.db_host}:{self.db_port}/{self.db_name}"

    # App
    app_name: str = "Video Survey Platform"
    debug: bool = False
    secret_key: str = "change-me-in-production"

    # Media storage
    media_root: str = "media"

    # Geolocation
    geolocation_api_url: str = "https://ipapi.co/{ip}/json/"

    # CORS
    allowed_origins: list[str] = ["http://localhost:3000"]


settings = Settings()
