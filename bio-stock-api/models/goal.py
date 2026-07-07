from sqlalchemy import Column, Date, DateTime, ForeignKey, Integer, String
from sqlalchemy.orm import relationship

from database import Base
from time_utils import utcnow


class Goal(Base):
    __tablename__ = "goals"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    goal_name = Column(String, nullable=False)
    stake_amount = Column(Integer, nullable=False)
    # The win condition: how many GREEN days are required within the window.
    target_green_days = Column(Integer, nullable=False, default=5)
    duration_days = Column(Integer, nullable=False, default=7)
    start_date = Column(Date, nullable=False)
    end_date = Column(Date, nullable=False)
    status = Column(String, nullable=False, default="ACTIVE", index=True)
    created_at = Column(DateTime, default=utcnow, nullable=False)

    user = relationship("User", back_populates="goals")
