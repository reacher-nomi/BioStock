"""Centralized, validated configuration.

Uses pydantic-settings so every environment variable is typed and validated at
startup (automatic environment validation). Supports environment isolation via
APP_ENV and JWT key rotation via a primary key plus optional previous keys that
are still accepted for verification.
"""
from functools import lru_cache

from pydantic import Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    app_env: str = Field(default="development")  # development | staging | production
    jwt_secret_key: str = Field(default="")
    # Comma-separated previous keys, still valid for verifying old tokens during rotation.
    jwt_previous_keys: str = Field(default="")
    access_token_expire_minutes: int = Field(default=30)
    cors_origins: str = Field(default="http://localhost:8081,http://localhost:19006,http://localhost:3000")
    database_url: str = Field(default="sqlite:///./biostock.db")

    @field_validator("jwt_secret_key")
    @classmethod
    def _require_secret_in_prod(cls, v, info):
        env = info.data.get("app_env", "development")
        if env == "production" and not v:
            raise ValueError("JWT_SECRET_KEY must be set in production")
        return v

    @property
    def is_production(self) -> bool:
        return self.app_env == "production"

    @property
    def signing_key(self) -> str:
        return self.jwt_secret_key or "dev-only-secret-do-not-use-in-production"

    @property
    def verification_keys(self) -> list[str]:
        """All keys accepted when verifying a token (current + rotated-out)."""
        keys = [self.signing_key]
        keys += [k.strip() for k in self.jwt_previous_keys.split(",") if k.strip()]
        return keys

    @property
    def origins_list(self) -> list[str]:
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()
