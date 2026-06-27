from sqlalchemy import func
from sqlalchemy.orm import Session

from models.token_ledger import TokenLedger


class TokenEngine:
    @staticmethod
    def mint_tokens(user_id: int, amount: int, reason: str, db: Session):
        entry = TokenLedger(
            user_id=user_id,
            amount=amount,
            transaction_type="MINT",
            reason=reason,
        )
        db.add(entry)
        db.commit()

    @staticmethod
    def burn_tokens(user_id: int, amount: int, reason: str, db: Session):
        entry = TokenLedger(
            user_id=user_id,
            amount=-abs(amount),
            transaction_type="BURN",
            reason=reason,
        )
        db.add(entry)
        db.commit()

    @staticmethod
    def get_balance(user_id: int, db: Session) -> int:
        result = db.query(func.sum(TokenLedger.amount)).filter(TokenLedger.user_id == user_id).scalar()
        return result or 0

    @staticmethod
    def get_ledger_history(user_id: int, db: Session, limit: int = 50):
        return (
            db.query(TokenLedger)
            .filter(TokenLedger.user_id == user_id)
            .order_by(TokenLedger.created_at.desc())
            .limit(limit)
            .all()
        )
