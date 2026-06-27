from datetime import date, timedelta

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from database import get_db
from models.goal import Goal
from routes.auth import verify_token
from schemas import GoalCreate, GoalResponse, TokenBalance
from services.goal_engine import resolve_due_goals
from services.token_engine import TokenEngine

router = APIRouter(prefix="/tokens", tags=["tokens"])


@router.get("/balance", response_model=TokenBalance)
def get_balance(db: Session = Depends(get_db), user_id: int = Depends(verify_token)):
    balance = TokenEngine.get_balance(user_id, db)
    return {"user_id": user_id, "balance": balance}


@router.get("/ledger")
def get_ledger(limit: int = 50, db: Session = Depends(get_db), user_id: int = Depends(verify_token)):
    """Full token transaction history (rewards minted, stakes burned, refunds)."""
    entries = TokenEngine.get_ledger_history(user_id, db, limit=limit)
    return [
        {
            "id": e.id,
            "amount": e.amount,
            "transaction_type": e.transaction_type,
            "reason": e.reason,
            "created_at": e.created_at.isoformat(),
        }
        for e in entries
    ]


@router.post("/stake", response_model=GoalResponse)
def stake_tokens(goal: GoalCreate, db: Session = Depends(get_db), user_id: int = Depends(verify_token)):
    balance = TokenEngine.get_balance(user_id, db)
    if balance < goal.stake_amount:
        raise HTTPException(status_code=400, detail="Insufficient token balance")

    start_date = date.today()
    end_date = start_date + timedelta(days=7)
    new_goal = Goal(
        user_id=user_id,
        goal_name=goal.goal_name,
        stake_amount=goal.stake_amount,
        start_date=start_date,
        end_date=end_date,
        status="ACTIVE",
    )
    db.add(new_goal)
    db.commit()
    db.refresh(new_goal)

    TokenEngine.burn_tokens(user_id, goal.stake_amount, f"Staked on goal: {goal.goal_name}", db)
    return {
        "id": new_goal.id,
        "goal_name": new_goal.goal_name,
        "stake_amount": new_goal.stake_amount,
        "status": new_goal.status,
        "start_date": str(new_goal.start_date),
        "end_date": str(new_goal.end_date),
    }


@router.get("/goals")
def get_goals(db: Session = Depends(get_db), user_id: int = Depends(verify_token)):
    resolve_due_goals(user_id, db)
    goals = db.query(Goal).filter(Goal.user_id == user_id).all()
    today = date.today()
    return [
        {
            "id": g.id,
            "goal_name": g.goal_name,
            "stake_amount": g.stake_amount,
            "status": g.status,
            "start_date": str(g.start_date),
            "end_date": str(g.end_date),
            "days_remaining": max(0, (g.end_date - today).days),
        }
        for g in goals
    ]
