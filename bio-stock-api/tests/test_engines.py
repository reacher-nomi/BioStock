"""Unit tests for the core scoring/reward logic."""
from datetime import date, timedelta

import pytest
from pydantic import ValidationError

from models.health_log import HealthLog
from schemas import HealthLogRequest
from services.delta_engine import calculate_delta_bonus, get_baseline, improvement_breakdown
from services.streak_engine import calculate_streak_bonus, classify_metric, evaluate_daily_log, get_current_streak


def test_classify_metric_in_and_out_of_range():
    assert classify_metric("systolic_bp", 110) is True
    assert classify_metric("systolic_bp", 200) is False
    assert classify_metric("unknown_metric", 1) is False


def test_evaluate_daily_log_zones():
    green = evaluate_daily_log(
        {"systolic_bp": 115, "diastolic_bp": 75, "steps": 9000, "sleep_hours": 8, "resting_hr": 60}
    )
    assert green["zone"] == "green"
    assert green["tokens_earned"] == 10
    assert green["compliance_rate"] == 100.0

    red = evaluate_daily_log(
        {"systolic_bp": 180, "diastolic_bp": 130, "steps": 100, "sleep_hours": 2, "resting_hr": 200}
    )
    assert red["zone"] == "red"
    assert red["tokens_earned"] == 0


def test_streak_bonus_multipliers():
    assert calculate_streak_bonus(0, 10) == 10
    assert calculate_streak_bonus(7, 10) == 15
    assert calculate_streak_bonus(30, 10) == 20
    assert calculate_streak_bonus(90, 10) == 30


def test_schema_rejects_impossible_and_all_zero_and_accepts_healthy():
    healthy = {"systolic_bp": 115, "diastolic_bp": 75, "steps": 9000, "sleep_hours": 8, "resting_hr": 60}
    HealthLogRequest(**healthy)  # does not raise

    all_zero = {"systolic_bp": 0, "diastolic_bp": 0, "steps": 0, "sleep_hours": 0, "resting_hr": 0}
    with pytest.raises(ValidationError):
        HealthLogRequest(**all_zero)

    impossible = {"systolic_bp": 9999, "diastolic_bp": 70, "steps": 1, "sleep_hours": 8, "resting_hr": 60}
    with pytest.raises(ValidationError):
        HealthLogRequest(**impossible)


def test_schema_rejects_diastolic_at_or_above_systolic():
    with pytest.raises(ValidationError):
        HealthLogRequest(systolic_bp=110, diastolic_bp=110, steps=8000, sleep_hours=8, resting_hr=60)


def test_delta_bonus_rewards_improvement_only():
    baseline = {"systolic_bp": 140, "diastolic_bp": 95, "resting_hr": 80}
    improved = {"systolic_bp": 120, "diastolic_bp": 80, "resting_hr": 65}
    assert calculate_delta_bonus(baseline, improved) > 0
    assert calculate_delta_bonus(baseline, baseline) == 0
    assert calculate_delta_bonus(None, improved) == 0
    breakdown = improvement_breakdown(baseline, improved)
    assert breakdown["systolic_bp"] > 0


def _log(db, user_id, day, zone, systolic_bp=115, diastolic_bp=75, resting_hr=60):
    db.add(HealthLog(
        user_id=user_id, date=day, systolic_bp=systolic_bp, diastolic_bp=diastolic_bp,
        steps=9000, sleep_hours=8, resting_hr=resting_hr, zone=zone, tokens_earned=10,
    ))
    db.commit()


def test_get_current_streak_counts_consecutive_green_days_ending_today(db_session):
    today = date.today()
    _log(db_session, 1, today, "green")
    _log(db_session, 1, today - timedelta(days=1), "green")
    _log(db_session, 1, today - timedelta(days=2), "green")
    _log(db_session, 1, today - timedelta(days=3), "yellow")  # breaks the streak
    assert get_current_streak(1, db_session) == 3


def test_get_current_streak_zero_when_today_missing_or_not_green(db_session):
    today = date.today()
    assert get_current_streak(1, db_session) == 0  # no logs at all

    _log(db_session, 1, today, "yellow")
    assert get_current_streak(1, db_session) == 0


def test_baseline_falls_back_to_earliest_logs_for_new_users(db_session):
    today = date.today()
    for i in range(3):
        _log(db_session, 1, today - timedelta(days=i), "green", systolic_bp=150 - i)
    baseline = get_baseline(1, db_session)
    assert baseline is not None
    assert baseline["systolic_bp"] == pytest.approx((150 + 149 + 148) / 3)


def test_baseline_prefers_rolling_window_once_available(db_session):
    today = date.today()
    # Old, high-risk readings ~33 days ago (inside the rolling window).
    for offset in (31, 33, 35):
        _log(db_session, 1, today - timedelta(days=offset), "yellow", systolic_bp=145)
    # Recent, healthier readings (should NOT be used as the baseline).
    for offset in (0, 1, 2):
        _log(db_session, 1, today - timedelta(days=offset), "green", systolic_bp=115)

    baseline = get_baseline(1, db_session)
    assert baseline["systolic_bp"] == pytest.approx(145)  # the rolling window, not the recent logs
