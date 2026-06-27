from datetime import date, timedelta

from sqlalchemy.orm import Session

from models.health_log import HealthLog

METRIC_THRESHOLDS = {
    "systolic_bp": {"min": 90, "max": 120},
    "diastolic_bp": {"min": 60, "max": 80},
    "steps": {"min": 7000, "max": 99999},
    "sleep_hours": {"min": 7, "max": 9},
    "resting_hr": {"min": 50, "max": 85},
}

TOKEN_REWARDS = {
    "green": 10,
    "yellow": 3,
    "red": 0,
}


def classify_metric(metric_name: str, value: float) -> bool:
    bounds = METRIC_THRESHOLDS.get(metric_name)
    if not bounds:
        return False
    return bounds["min"] <= value <= bounds["max"]


def evaluate_daily_log(health_log: dict) -> dict:
    results = {}
    passed = 0

    for metric, value in health_log.items():
        if metric in METRIC_THRESHOLDS:
            in_range = classify_metric(metric, value)
            results[metric] = in_range
            if in_range:
                passed += 1

    total = len([k for k in health_log if k in METRIC_THRESHOLDS])
    compliance_rate = (passed / total * 100) if total > 0 else 0

    if compliance_rate >= 80:
        zone = "green"
    elif compliance_rate >= 50:
        zone = "yellow"
    else:
        zone = "red"

    return {
        "zone": zone,
        "tokens_earned": TOKEN_REWARDS[zone],
        "compliance_rate": round(compliance_rate, 1),
        "metric_breakdown": results,
    }


def calculate_streak_bonus(streak_days: int, base_tokens: int) -> int:
    if streak_days >= 90:
        multiplier = 3.0
    elif streak_days >= 30:
        multiplier = 2.0
    elif streak_days >= 7:
        multiplier = 1.5
    else:
        multiplier = 1.0

    return int(base_tokens * multiplier)


def get_current_streak(user_id: int, db: Session) -> int:
    streak = 0
    cursor_day = date.today()

    # Count backwards from today until a non-green day or missing log.
    while True:
        log = (
            db.query(HealthLog)
            .filter(HealthLog.user_id == user_id, HealthLog.date == cursor_day)
            .first()
        )
        if not log or log.zone.lower() != "green":
            break
        streak += 1
        cursor_day -= timedelta(days=1)

    return streak
