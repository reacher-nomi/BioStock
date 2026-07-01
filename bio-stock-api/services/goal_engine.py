"""Staking goal resolution.

A goal locks (burns) a stake for a fixed window with a structured win condition:
reach `target_green_days` GREEN days before the end date. Resolution is lazy —
it runs whenever goals/dashboard are read.

Economics (real yield, not just a refund):
  SUCCESS -> stake is returned PLUS a reward bonus (REWARD_BONUS_PCT).
             Net gain = bonus. The bonus is minted as a health-improvement
             incentive; in a production system it would be funded by an
             insurer / risk pool that saves money when users get healthier.
  FAILED  -> the stake is forfeited (already burned at stake time).
"""
from datetime import date

from sqlalchemy.orm import Session

from models.goal import Goal
from models.health_log import HealthLog
from services.token_engine import TokenEngine

REWARD_BONUS_PCT = 0.20  # yield paid on a successful stake


def reward_for(stake_amount: int) -> int:
    """Total tokens returned on success: the stake back plus the yield bonus."""
    return stake_amount + round(stake_amount * REWARD_BONUS_PCT)


def resolve_due_goals(user_id: int, db: Session) -> None:
    today = date.today()
    due_goals = (
        db.query(Goal)
        .filter(Goal.user_id == user_id, Goal.status == "ACTIVE", Goal.end_date <= today)
        .all()
    )

    for goal in due_goals:
        green_days = (
            db.query(HealthLog)
            .filter(
                HealthLog.user_id == user_id,
                HealthLog.date >= goal.start_date,
                HealthLog.date <= goal.end_date,
                HealthLog.zone == "green",
            )
            .count()
        )

        if green_days >= goal.target_green_days:
            goal.status = "SUCCESS"
            payout = reward_for(goal.stake_amount)
            bonus = payout - goal.stake_amount
            TokenEngine.mint_tokens(
                user_id, payout,
                f"Goal succeeded: {goal.goal_name} (stake {goal.stake_amount} + {bonus} bonus)", db,
            )
        else:
            goal.status = "FAILED"

    if due_goals:
        db.commit()
