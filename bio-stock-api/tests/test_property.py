"""Property-based and fuzz tests for the scoring/validation logic."""
import random

from hypothesis import given
from hypothesis import strategies as st

from services.streak_engine import calculate_streak_bonus, evaluate_daily_log
from services.validator import validate_health_log
from tests.conftest import GREEN_LOG

metric = st.integers(min_value=-10_000, max_value=200_000)


@given(
    systolic_bp=metric, diastolic_bp=metric, steps=metric,
    sleep_hours=st.floats(min_value=-5, max_value=30, allow_nan=False),
    resting_hr=metric,
)
def test_evaluate_invariants_hold_for_any_input(systolic_bp, diastolic_bp, steps, sleep_hours, resting_hr):
    result = evaluate_daily_log({
        "systolic_bp": systolic_bp, "diastolic_bp": diastolic_bp,
        "steps": steps, "sleep_hours": sleep_hours, "resting_hr": resting_hr,
    })
    assert result["zone"] in {"green", "yellow", "red"}
    assert 0 <= result["compliance_rate"] <= 100
    assert result["tokens_earned"] in (0, 3, 10)


@given(streak=st.integers(min_value=0, max_value=10_000), base=st.integers(min_value=1, max_value=1_000))
def test_streak_bonus_never_below_base(streak, base):
    # Multiplier is always >= 1, so the bonus can never reduce earnings.
    assert calculate_streak_bonus(streak, base) >= base


@given(st.dictionaries(st.text(), st.integers()))
def test_validator_never_crashes_on_arbitrary_input(payload):
    assert isinstance(validate_health_log(payload), bool)


def test_fuzz_health_log_endpoint_never_500s(auth_client):
    # Throw random (often invalid) payloads at the API; it must degrade
    # gracefully (4xx), never crash with a 500.
    for _ in range(60):
        payload = {
            "systolic_bp": random.randint(-1000, 100000),
            "diastolic_bp": random.randint(-1000, 100000),
            "steps": random.randint(-1000, 10_000_000),
            "sleep_hours": random.uniform(-50, 100),
            "resting_hr": random.randint(-1000, 100000),
        }
        status = auth_client.post("/health/log", json=payload).status_code
        assert status != 500, f"500 on payload {payload}"


def test_fuzz_malformed_json_types_handled(auth_client):
    bad_payloads = [
        {**GREEN_LOG, "steps": "not-a-number"},
        {**GREEN_LOG, "systolic_bp": None},
        {"systolic_bp": 110},  # missing fields
        {},
    ]
    for p in bad_payloads:
        assert auth_client.post("/health/log", json=p).status_code != 500
