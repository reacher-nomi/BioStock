from datetime import datetime

from sqlalchemy import Column, Date, DateTime, Float, ForeignKey, Integer, String, UniqueConstraint
from sqlalchemy.orm import relationship

from database import Base


class HealthLog(Base):
    __tablename__ = "health_logs"
    __table_args__ = (UniqueConstraint("user_id", "date", name="uq_healthlog_user_date"),)

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    date = Column(Date, nullable=False, index=True)
    systolic_bp = Column(Integer, nullable=False)
    diastolic_bp = Column(Integer, nullable=False)
    steps = Column(Integer, nullable=False)
    sleep_hours = Column(Float, nullable=False)
    resting_hr = Column(Integer, nullable=False)
    zone = Column(String, nullable=False)
    tokens_earned = Column(Integer, default=0, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    user = relationship("User", back_populates="health_logs")
