from datetime import date
from typing import Any

from pydantic import BaseModel, EmailStr, Field


class UserRegister(BaseModel):
    email: EmailStr
    password: str = Field(min_length=6)


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


class HealthLogRequest(BaseModel):
    systolic_bp: int
    diastolic_bp: int
    steps: int
    sleep_hours: float
    resting_hr: int


class HealthLogResponse(BaseModel):
    id: int
    zone: str
    tokens_earned: int
    compliance_rate: float
    metric_breakdown: dict[str, bool]


class TokenBalance(BaseModel):
    user_id: int
    balance: int


class GoalCreate(BaseModel):
    goal_name: str
    stake_amount: int


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
