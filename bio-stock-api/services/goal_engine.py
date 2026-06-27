from datetime import date

from sqlalchemy.orm import Session

from models.goal import Goal
from models.health_log import HealthLog
from services.token_engine import TokenEngine

SUCCESS_GREEN_DAYS_REQUIRED = 5


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

        if green_days >= SUCCESS_GREEN_DAYS_REQUIRED:
            goal.status = "SUCCESS"
            TokenEngine.mint_tokens(
                user_id, goal.stake_amount, f"Goal succeeded: {goal.goal_name} (refund stake)", db
            )
        else:
            goal.status = "FAILED"

    if due_goals:
        db.commit()
