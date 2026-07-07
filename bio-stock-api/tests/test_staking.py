"""Tests for staking resolution and reward economics."""
from datetime import date, timedelta

from models.goal import Goal
from models.health_log import HealthLog
from services.goal_engine import resolve_all_due_goals, resolve_due_goals, reward_for
from services.token_engine import TokenEngine


def test_reward_includes_yield_bonus():
    # Success returns the stake plus a 20% yield, so net gain is positive.
    assert reward_for(100) == 120
    assert reward_for(50) == 60


def _add_logs(db, user_id, start, count, zone):
    for i in range(count):
        db.add(HealthLog(
            user_id=user_id, date=start + timedelta(days=i),
            systolic_bp=115, diastolic_bp=75, steps=9000, sleep_hours=8, resting_hr=60,
            zone=zone, tokens_earned=10,
        ))
    db.commit()


def test_successful_goal_pays_stake_plus_bonus(db_session):
    user_id = 1
    start = date.today() - timedelta(days=8)
    end = date.today() - timedelta(days=1)
    _add_logs(db_session, user_id, start, 6, "green")  # meets target of 5
    TokenEngine.burn_tokens(user_id, 100, "stake", db_session)  # stake locked
    db_session.add(Goal(
        user_id=user_id, goal_name="Test", stake_amount=100, target_green_days=5,
        duration_days=7, start_date=start, end_date=end, status="ACTIVE",
    ))
    db_session.commit()

    resolve_due_goals(user_id, db_session)

    goal = db_session.query(Goal).first()
    assert goal.status == "SUCCESS"
    # -100 (burn) + 120 (stake + 20% bonus) = +20 net.
    assert TokenEngine.get_balance(user_id, db_session) == 20


def test_failed_goal_forfeits_stake(db_session):
    user_id = 2
    start = date.today() - timedelta(days=8)
    end = date.today() - timedelta(days=1)
    _add_logs(db_session, user_id, start, 2, "green")  # below target of 5
    TokenEngine.burn_tokens(user_id, 100, "stake", db_session)
    db_session.add(Goal(
        user_id=user_id, goal_name="Test", stake_amount=100, target_green_days=5,
        duration_days=7, start_date=start, end_date=end, status="ACTIVE",
    ))
    db_session.commit()

    resolve_due_goals(user_id, db_session)

    goal = db_session.query(Goal).first()
    assert goal.status == "FAILED"
    assert TokenEngine.get_balance(user_id, db_session) == -100  # stake forfeited


def test_resolve_all_due_goals_covers_every_user_in_one_pass(db_session):
    # The background scheduler's backstop: two different users each have a
    # due ACTIVE goal; one call must resolve both, independently of each other.
    start = date.today() - timedelta(days=8)
    end = date.today() - timedelta(days=1)

    _add_logs(db_session, 10, start, 6, "green")  # will succeed
    TokenEngine.burn_tokens(10, 100, "stake", db_session)
    db_session.add(Goal(
        user_id=10, goal_name="A", stake_amount=100, target_green_days=5,
        duration_days=7, start_date=start, end_date=end, status="ACTIVE",
    ))

    _add_logs(db_session, 11, start, 1, "green")  # will fail
    TokenEngine.burn_tokens(11, 50, "stake", db_session)
    db_session.add(Goal(
        user_id=11, goal_name="B", stake_amount=50, target_green_days=5,
        duration_days=7, start_date=start, end_date=end, status="ACTIVE",
    ))
    db_session.commit()

    resolved_count = resolve_all_due_goals(db_session)

    assert resolved_count == 2
    goals_by_user = {g.user_id: g.status for g in db_session.query(Goal).all()}
    assert goals_by_user == {10: "SUCCESS", 11: "FAILED"}
