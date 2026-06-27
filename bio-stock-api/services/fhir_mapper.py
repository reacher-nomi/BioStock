"""Map Bio-Stock health logs to validated FHIR R4 resources.

Each biometric is expressed as a FHIR Observation with its real LOINC code and
UCUM unit. Building through fhir.resources guarantees the output validates
against the FHIR schema.
"""
from fhir.resources.bundle import Bundle
from fhir.resources.observation import Observation
from fhir.resources.patient import Patient

LOINC = "http://loinc.org"
UCUM = "http://unitsofmeasure.org"

# metric -> (LOINC code, display, unit, UCUM code)
METRIC_CODES = {
    "systolic_bp": ("8480-6", "Systolic blood pressure", "mmHg", "mm[Hg]"),
    "diastolic_bp": ("8462-4", "Diastolic blood pressure", "mmHg", "mm[Hg]"),
    "steps": ("41950-7", "Number of steps in 24 hour Measured", "steps", "/d"),
    "sleep_hours": ("93832-4", "Sleep duration", "h", "h"),
    "resting_hr": ("40443-4", "Heart rate - resting", "beats/minute", "/min"),
}


def patient_resource(user_id: int, email: str) -> dict:
    patient = Patient.model_validate({
        "resourceType": "Patient",
        "id": str(user_id),
        "identifier": [{"system": "urn:bio-stock:user", "value": str(user_id)}],
        "telecom": [{"system": "email", "value": email}],
    })
    return patient.model_dump(mode="json")


def _observation(metric: str, value, log, user_id: int) -> dict:
    code, display, unit, ucum = METRIC_CODES[metric]
    obs = Observation.model_validate({
        "resourceType": "Observation",
        "id": f"{log.id}-{metric.replace('_', '-')}",
        "status": "final",
        "category": [{
            "coding": [{
                "system": "http://terminology.hl7.org/CodeSystem/observation-category",
                "code": "vital-signs",
                "display": "Vital Signs",
            }]
        }],
        "code": {"coding": [{"system": LOINC, "code": code, "display": display}], "text": display},
        "subject": {"reference": f"Patient/{user_id}"},
        "effectiveDateTime": f"{log.date}T00:00:00Z",
        "valueQuantity": {"value": value, "unit": unit, "system": UCUM, "code": ucum},
    })
    return obs.model_dump(mode="json")


def log_to_observations(log, user_id: int) -> list[dict]:
    """Return one FHIR Observation per biometric in a health log."""
    values = {
        "systolic_bp": log.systolic_bp,
        "diastolic_bp": log.diastolic_bp,
        "steps": log.steps,
        "sleep_hours": log.sleep_hours,
        "resting_hr": log.resting_hr,
    }
    return [_observation(metric, value, log, user_id) for metric, value in values.items()]


def observations_bundle(logs, user_id: int) -> dict:
    """Wrap all observations from the given logs into a FHIR searchset Bundle."""
    entries = []
    for log in logs:
        for obs in log_to_observations(log, user_id):
            entries.append({"resource": obs})
    bundle = Bundle.model_validate({
        "resourceType": "Bundle",
        "type": "searchset",
        "total": len(entries),
        "entry": entries,
    })
    return bundle.model_dump(mode="json")
