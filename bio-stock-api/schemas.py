from datetime import date
from typing import Any

from pydantic import BaseModel, EmailStr, Field, field_validator


class UserRegister(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)

    @field_validator("password")
    @classmethod
    def password_strength(cls, v: str) -> str:
        if not any(c.isalpha() for c in v) or not any(c.isdigit() for c in v):
            raise ValueError("Password must contain at least one letter and one number")
        return v


class UserLogin(BaseModel):
    email: EmailStr
    password: str
    otp_code: str | None = None  # required if the account has MFA enabled


class MFAVerify(BaseModel):
    code: str


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


class HealthLogRequest(BaseModel):
    systolic_bp: int = Field(ge=60, le=250)
    diastolic_bp: int = Field(ge=30, le=150)
    steps: int = Field(ge=0, le=100000)
    sleep_hours: float = Field(ge=0, le=24)
    resting_hr: int = Field(ge=30, le=220)


class HealthLogResponse(BaseModel):
    id: int
    zone: str
    tokens_earned: int
    compliance_rate: float
    metric_breakdown: dict[str, bool]
    delta_bonus: int = 0
    has_baseline: bool = False


class TokenBalance(BaseModel):
    user_id: int
    balance: int


class GoalCreate(BaseModel):
    goal_name: str = Field(min_length=1, max_length=100)
    stake_amount: int = Field(gt=0, le=1_000_000)


class GoalResponse(BaseModel):
    id: int
    goal_name: str
    stake_amount: int
    status: str
    start_date: date | str
    end_date: date | str


class DashboardResponse(BaseModel):
    user_email: str
    token_balance: int
    current_streak: int
    today_zone: str | None
    recent_logs: list[dict[str, Any]]
    active_goals: list[dict[str, Any]]
