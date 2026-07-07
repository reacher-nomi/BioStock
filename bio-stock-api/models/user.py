from sqlalchemy import Column, DateTime, Integer, String
from sqlalchemy.orm import relationship

from database import Base
from time_utils import utcnow


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, nullable=False, index=True)
    password_hash = Column(String, nullable=False)
    created_at = Column(DateTime, default=utcnow, nullable=False)
    updated_at = Column(DateTime, default=utcnow, onupdate=utcnow, nullable=False)

    health_logs = relationship("HealthLog", back_populates="user", cascade="all, delete-orphan")
    token_ledger_entries = relationship("TokenLedger", back_populates="user", cascade="all, delete-orphan")
    goals = relationship("Goal", back_populates="user", cascade="all, delete-orphan")
