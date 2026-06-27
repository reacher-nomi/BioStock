PHYSIOLOGICAL_BOUNDS = {
    "systolic_bp": (60, 250),
    "diastolic_bp": (30, 150),
    "steps": (0, 100000),
    "sleep_hours": (0, 24),
    "resting_hr": (30, 220),
}


def validate_health_log(health_log: dict) -> bool:
    if all(v == 0 for v in health_log.values()):
        return False

    for metric, (low, high) in PHYSIOLOGICAL_BOUNDS.items():
        value = health_log.get(metric)
        if value is None or value < low or value > high:
            return False

    if health_log.get("diastolic_bp", 0) >= health_log.get("systolic_bp", 0):
        return False

    return True
