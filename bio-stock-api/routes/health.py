from datetime import date

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from database import get_db
from models.health_log import HealthLog
from routes.auth import verify_token
from schemas import HealthLogRequest, HealthLogResponse
from services.streak_engine import calculate_streak_bonus, evaluate_daily_log, get_current_streak
from services.token_engine import TokenEngine
from services.validator import validate_health_log

router = APIRouter(prefix="/health", tags=["health"])


@router.post("/log", response_model=HealthLogResponse)
def log_health(
    health_log: HealthLogRequest,
    db: Session = Depends(get_db),
    user_id: int = Depends(verify_token),
):
    today = date.today()
    existing = db.query(HealthLog).filter(HealthLog.user_id == user_id, HealthLog.date == today).first()
    if existing:
        raise HTTPException(status_code=409, detail="Already logged today")

    health_dict = {
        "systolic_bp": health_log.systolic_bp,
        "diastolic_bp": health_log.diastolic_bp,
        "steps": health_log.steps,
        "sleep_hours": health_log.sleep_hours,
        "resting_hr": health_log.resting_hr,
    }
    if not validate_health_log(health_dict):
        raise HTTPException(status_code=400, detail="Invalid health data")

    evaluation = evaluate_daily_log(health_dict)
    zone = evaluation["zone"]
    base_tokens = evaluation["tokens_earned"]
    streak = get_current_streak(user_id, db)
    bonus_tokens = calculate_streak_bonus(streak, base_tokens) if base_tokens > 0 else 0

    log_entry = HealthLog(
        user_id=user_id,
        date=today,
        systolic_bp=health_log.systolic_bp,
        diastolic_bp=health_log.diastolic_bp,
        steps=health_log.steps,
        sleep_hours=health_log.sleep_hours,
        resting_hr=health_log.resting_hr,
        zone=zone,
        tokens_earned=bonus_tokens if base_tokens > 0 else 0,
    )
    db.add(log_entry)
    db.commit()
    db.refresh(log_entry)

    if bonus_tokens > 0:
        TokenEngine.mint_tokens(
            user_id, bonus_tokens, f"Daily log: {zone.upper()} zone (streak bonus: {streak} days)", db
        )

    return {
        "id": log_entry.id,
        "zone": zone,
        "tokens_earned": bonus_tokens if base_tokens > 0 else 0,
        "compliance_rate": evaluation["compliance_rate"],
        "metric_breakdown": evaluation["metric_breakdown"],
    }


@router.get("/today")
def get_today(db: Session = Depends(get_db), user_id: int = Depends(verify_token)):
    today = date.today()
    log = db.query(HealthLog).filter(HealthLog.user_id == user_id, HealthLog.date == today).first()
    if not log:
        return {"logged": False}
    return {"logged": True, "zone": log.zone, "tokens_earned": log.tokens_earned}


@router.get("/history")
def get_history(days: int = 7, db: Session = Depends(get_db), user_id: int = Depends(verify_token)):
    logs = (
        db.query(HealthLog)
        .filter(HealthLog.user_id == user_id)
        .order_by(HealthLog.date.desc())
        .limit(days)
        .all()
    )
    return [{"date": str(log.date), "zone": log.zone, "tokens_earned": log.tokens_earned} for log in reversed(logs)]
