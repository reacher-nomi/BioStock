import random
from datetime import date, timedelta

from passlib.context import CryptContext

from database import Base, SessionLocal, engine
from models.health_log import HealthLog
from models.token_ledger import TokenLedger
from models.user import User
from services.streak_engine import evaluate_daily_log

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def generate_metrics(zone: str):
    if zone == "green":
        return {
            "systolic_bp": random.randint(100, 120),
            "diastolic_bp": random.randint(65, 80),
            "steps": random.randint(7000, 12000),
            "sleep_hours": round(random.uniform(7.0, 9.0), 1),
            "resting_hr": random.randint(55, 80),
        }
    if zone == "yellow":
        return {
            "systolic_bp": random.randint(118, 130),
            "diastolic_bp": random.randint(75, 90),
            "steps": random.randint(5000, 8000),
            "sleep_hours": round(random.uniform(6.0, 8.0), 1),
            "resting_hr": random.randint(65, 90),
        }
    return {
        "systolic_bp": random.randint(130, 150),
        "diastolic_bp": random.randint(85, 105),
        "steps": random.randint(1500, 5500),
        "sleep_hours": round(random.uniform(4.0, 6.5), 1),
        "resting_hr": random.randint(80, 105),
    }


def run():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        user = db.query(User).filter(User.email == "test@test.com").first()
        if not user:
            user = User(email="test@test.com", password_hash=pwd_context.hash("password"))
            db.add(user)
            db.commit()
            db.refresh(user)

        db.query(HealthLog).filter(HealthLog.user_id == user.id).delete()
        db.query(TokenLedger).filter(TokenLedger.user_id == user.id).delete()
        db.commit()

        zones = (["green"] * 15) + (["yellow"] * 10) + (["red"] * 5)
        random.shuffle(zones)

        today = date.today()
        for idx, zone in enumerate(zones):
            day = today - timedelta(days=29 - idx)
            metrics = generate_metrics(zone)
            evaluation = evaluate_daily_log(metrics)
            log = HealthLog(
                user_id=user.id,
                date=day,
                systolic_bp=metrics["systolic_bp"],
                diastolic_bp=metrics["diastolic_bp"],
                steps=metrics["steps"],
                sleep_hours=metrics["sleep_hours"],
                resting_hr=metrics["resting_hr"],
                zone=evaluation["zone"],
                tokens_earned=evaluation["tokens_earned"],
            )
            db.add(log)
            if evaluation["tokens_earned"] > 0:
                db.add(
                    TokenLedger(
                        user_id=user.id,
                        amount=evaluation["tokens_earned"],
                        transaction_type="MINT",
                        reason=f"Seed daily log {day} ({evaluation['zone']})",
                    )
                )
        db.commit()
        print("Seed complete: test@test.com / password")
    finally:
        db.close()


if __name__ == "__main__":
    run()
