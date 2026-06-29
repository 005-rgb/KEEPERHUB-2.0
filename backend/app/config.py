import os
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    database_url: str = os.getenv("DATABASE_URL", "")
    secret_key: str = os.getenv("SECRET_KEY", "keeperhub-super-secret-key-change-in-production")
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 60 * 24
    magic_link_secret: str = os.getenv("MAGIC_LINK_SECRET", "keeperhub-magic-link-secret-change-in-production")

    class Config:
        env_file = ".env"


settings = Settings()
