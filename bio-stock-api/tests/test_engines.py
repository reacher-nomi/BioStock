"""Unit tests for the core scoring/reward logic."""
from services.delta_engine import calculate_delta_bonus, improvement_breakdown
from services.streak_engine import calculate_streak_bonus, classify_metric, evaluate_daily_log
from services.validator import validate_health_log


def test_classify_metric_in_and_out_of_range():
    assert classify_metric("systolic_bp", 110) is True
    assert classify_metric("systolic_bp", 200) is False
    assert classify_metric("unknown_metric", 1) is False


def test_evaluate_daily_log_zones():
    green = evaluate_daily_log({"systolic_bp": 115, "diastolic_bp": 75, "steps": 9000, "sleep_hours": 8, "resting_hr": 60})
    assert green["zone"] == "green"
    assert green["tokens_earned"] == 10
    assert green["compliance_rate"] == 100.0

    red = evaluate_daily_log({"systolic_bp": 180, "diastolic_bp": 130, "steps": 100, "sleep_hours": 2, "resting_hr": 200})
    assert red["zone"] == "red"
    assert red["tokens_earned"] == 0


def test_streak_bonus_multipliers():
    assert calculate_streak_bonus(0, 10) == 10
    assert calculate_streak_bonus(7, 10) == 15
    assert calculate_streak_bonus(30, 10) == 20
    assert calculate_streak_bonus(90, 10) == 30


def test_validator_rejects_impossible_and_all_zero():
    assert validate_health_log({"systolic_bp": 0, "diastolic_bp": 0, "steps": 0, "sleep_hours": 0, "resting_hr": 0}) is False
    assert validate_health_log({"systolic_bp": 9999, "diastolic_bp": 70, "steps": 1, "sleep_hours": 8, "resting_hr": 60}) is False
    assert validate_health_log({"systolic_bp": 115, "diastolic_bp": 75, "steps": 9000, "sleep_hours": 8, "resting_hr": 60}) is True


def test_delta_bonus_rewards_improvement_only():
    baseline = {"systolic_bp": 140, "diastolic_bp": 95, "resting_hr": 80}
    improved = {"systolic_bp": 120, "diastolic_bp": 80, "resting_hr": 65}
    assert calculate_delta_bonus(baseline, improved) > 0
    assert calculate_delta_bonus(baseline, baseline) == 0
    assert calculate_delta_bonus(None, improved) == 0
    breakdown = improvement_breakdown(baseline, improved)
    assert breakdown["systolic_bp"] > 0
