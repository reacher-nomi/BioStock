"""Relative-improvement (Delta) reward engine.

Implements the pitch-deck algorithm: reward is driven by improvement relative
to a personal baseline rather than absolute values, so a high-risk user who
lowers their blood pressure is rewarded more than an already-healthy user
holding steady.

    reward = sum_over_metrics( (M_baseline - M_current) / M_baseline ) * W_effort

Only cardiovascular "lower is better" metrics contribute (systolic, diastolic,
resting heart rate). The baseline is the average of the user's first few logs.
"""
from sqlalchemy.orm import Session

from models.health_log import HealthLog

RISK_METRICS = ("systolic_bp", "diastolic_bp", "resting_hr")
W_EFFORT = 40          # token weight applied to the aggregate improvement ratio
BASELINE_SAMPLE = 3    # number of earliest logs averaged into the baseline
MAX_DELTA_BONUS = 60   # safety cap per log


def get_baseline(user_id: int, db: Session) -> dict | None:
    """Average of the user's earliest logs; None until enough history exists."""
    logs = (
        db.query(HealthLog)
        .filter(HealthLog.user_id == user_id)
        .order_by(HealthLog.date.asc())
        .limit(BASELINE_SAMPLE)
        .all()
    )
    if not logs:
        return None
    return {m: sum(getattr(log, m) for log in logs) / len(logs) for m in RISK_METRICS}


def improvement_breakdown(baseline: dict, current: dict) -> dict[str, float]:
    """Per-metric relative improvement (positive = better, as a percentage)."""
    out = {}
    for m in RISK_METRICS:
        base = baseline.get(m) or 0
        if base > 0:
            out[m] = round((base - current[m]) / base * 100, 1)
        else:
            out[m] = 0.0
    return out


def calculate_delta_bonus(baseline: dict | None, current: dict) -> int:
    """Token bonus for improving cardiovascular metrics relative to baseline."""
    if not baseline:
        return 0
    ratio = 0.0
    for m in RISK_METRICS:
        base = baseline.get(m) or 0
        if base > 0:
            ratio += max(0.0, (base - current[m]) / base)
    return min(MAX_DELTA_BONUS, int(round(ratio * W_EFFORT)))
