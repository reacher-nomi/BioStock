from sqlalchemy import Column, DateTime, ForeignKey, Integer, String
from sqlalchemy.orm import relationship

from database import Base
from time_utils import utcnow


class TokenLedger(Base):
    __tablename__ = "token_ledger"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    amount = Column(Integer, nullable=False)
    transaction_type = Column(String, nullable=False)
    reason = Column(String, nullable=False)
    created_at = Column(DateTime, default=utcnow, nullable=False, index=True)

    user = relationship("User", back_populates="token_ledger_entries")
