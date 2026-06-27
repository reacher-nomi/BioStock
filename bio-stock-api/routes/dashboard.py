from datetime import date, timedelta

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from database import get_db
from models.goal import Goal
from models.health_log import HealthLog
from models.user import User
from routes.auth import verify_token
from schemas import DashboardResponse
from services.goal_engine import resolve_due_goals
from services.streak_engine import get_current_streak
from services.token_engine import TokenEngine

router = APIRouter(prefix="/dashboard", tags=["dashboard"])


@router.get("/", response_model=DashboardResponse)
def get_dashboard(db: Session = Depends(get_db), user_id: int = Depends(verify_token)):
    resolve_due_goals(user_id, db)
    user = db.query(User).filter(User.id == user_id).first()
    balance = TokenEngine.get_balance(user_id, db)
    streak = get_current_streak(user_id, db)

    today = date.today()
    today_log = db.query(HealthLog).filter(HealthLog.user_id == user_id, HealthLog.date == today).first()
    today_zone = today_log.zone if today_log else None

    seven_days_ago = today - timedelta(days=7)
    recent_logs = (
        db.query(HealthLog)
        .filter(HealthLog.user_id == user_id, HealthLog.date >= seven_days_ago)
        .order_by(HealthLog.date)
        .all()
    )
    active_goals = db.query(Goal).filter(Goal.user_id == user_id, Goal.status == "ACTIVE").all()

    return {
        "user_email": user.email if user else "",
        "token_balance": balance,
        "current_streak": streak,
        "today_zone": today_zone,
        "recent_logs": [{"date": str(log.date), "zone": log.zone, "tokens": log.tokens_earned} for log in recent_logs],
        "active_goals": [
            {"id": g.id, "name": g.goal_name, "stake_amount": g.stake_amount, "days_remaining": (g.end_date - today).days}
            for g in active_goals
        ],
    }
