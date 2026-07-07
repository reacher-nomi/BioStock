from datetime import UTC, date, datetime

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from database import get_db
from models.health_log import HealthLog
from routes.auth import verify_token
from schemas import HealthLogRequest, HealthLogResponse
from services.delta_engine import calculate_delta_bonus, get_baseline, improvement_breakdown
from services.streak_engine import calculate_streak_bonus, evaluate_daily_log, get_current_streak
from services.token_engine import TokenEngine

router = APIRouter(prefix="/health", tags=["health"])

# How far a client-reported local date may drift from the server's UTC date.
# 1 day covers ordinary timezone skew around midnight; it deliberately does not
# try to cover every offset on Earth (up to ~26h at the date line) — a wider
# window would let a client backdate logs to game streaks/history.
_LOCAL_DATE_TOLERANCE_DAYS = 1


def resolve_log_date(local_date: str | None) -> date:
    """The user's device-local date wins over the server's date, within a
    bounded tolerance, so "today" matches the user rather than the server."""
    server_today = datetime.now(UTC).date()
    if not local_date:
        return server_today
    try:
        parsed = date.fromisoformat(local_date)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail="Invalid local_date format, expected YYYY-MM-DD") from exc
    if abs((parsed - server_today).days) > _LOCAL_DATE_TOLERANCE_DAYS:
        raise HTTPException(status_code=400, detail="local_date is outside the allowed range")
    return parsed


@router.post("/log", response_model=HealthLogResponse)
def log_health(
    health_log: HealthLogRequest,
    db: Session = Depends(get_db),
    user_id: int = Depends(verify_token),
):
    today = resolve_log_date(health_log.local_date)
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

    evaluation = evaluate_daily_log(health_dict)
    zone = evaluation["zone"]
    base_tokens = evaluation["tokens_earned"]
    streak = get_current_streak(user_id, db)
    streak_tokens = calculate_streak_bonus(streak, base_tokens) if base_tokens > 0 else 0

    # Relative-improvement (Delta) reward vs the user's baseline.
    baseline = get_baseline(user_id, db)
    delta_bonus = calculate_delta_bonus(baseline, health_dict)

    total_tokens = streak_tokens + delta_bonus

    log_entry = HealthLog(
        user_id=user_id,
        date=today,
        systolic_bp=health_log.systolic_bp,
        diastolic_bp=health_log.diastolic_bp,
        steps=health_log.steps,
        sleep_hours=health_log.sleep_hours,
        resting_hr=health_log.resting_hr,
        zone=zone,
        tokens_earned=total_tokens,
    )
    db.add(log_entry)
    try:
        db.commit()
    except IntegrityError as exc:
        # Two concurrent requests can both pass the "already logged" check
        # before either commits; the UNIQUE(user_id, date) constraint is the
        # real guard, so turn its violation into the same clean 409.
        db.rollback()
        raise HTTPException(status_code=409, detail="Already logged today") from exc
    db.refresh(log_entry)

    if streak_tokens > 0:
        TokenEngine.mint_tokens(
            user_id, streak_tokens, f"Daily log: {zone.upper()} zone (streak: {streak} days)", db
        )
    if delta_bonus > 0:
        TokenEngine.mint_tokens(user_id, delta_bonus, "Improvement bonus (Delta vs baseline)", db)

    return {
        "id": log_entry.id,
        "zone": zone,
        "tokens_earned": total_tokens,
        "compliance_rate": evaluation["compliance_rate"],
        "metric_breakdown": evaluation["metric_breakdown"],
        "delta_bonus": delta_bonus,
        "has_baseline": baseline is not None,
    }


@router.get("/today")
def get_today(local_date: str | None = None, db: Session = Depends(get_db), user_id: int = Depends(verify_token)):
    today = resolve_log_date(local_date)
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
    return [
        {
            "date": str(log.date),
            "zone": log.zone,
            "tokens_earned": log.tokens_earned,
            "systolic_bp": log.systolic_bp,
            "diastolic_bp": log.diastolic_bp,
            "steps": log.steps,
            "sleep_hours": log.sleep_hours,
            "resting_hr": log.resting_hr,
        }
        for log in reversed(logs)
    ]


@router.get("/progress")
def get_progress(db: Session = Depends(get_db), user_id: int = Depends(verify_token)):
    """Baseline vs latest reading with per-metric relative improvement."""
    baseline = get_baseline(user_id, db)
    latest = (
        db.query(HealthLog)
        .filter(HealthLog.user_id == user_id)
        .order_by(HealthLog.date.desc())
        .first()
    )
    if not baseline or not latest:
        return {"has_baseline": False}

    current = {
        "systolic_bp": latest.systolic_bp,
        "diastolic_bp": latest.diastolic_bp,
        "resting_hr": latest.resting_hr,
    }
    return {
        "has_baseline": True,
        "baseline": {k: round(v, 1) for k, v in baseline.items()},
        "current": current,
        "improvement": improvement_breakdown(baseline, current),
    }
