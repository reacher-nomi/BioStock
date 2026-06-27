"""FHIR R4 interoperability endpoints.

Exposes the user's biometric history as standards-compliant FHIR resources so
the data can interoperate with external FHIR servers / EHRs.
"""
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session

from database import get_db
from models.health_log import HealthLog
from models.user import User
from routes.auth import verify_token
from services.fhir_mapper import observations_bundle, patient_resource

router = APIRouter(prefix="/fhir", tags=["fhir"])

# FHIR responses use the application/fhir+json content type.
FHIR_MEDIA = "application/fhir+json"


@router.get("/Patient/me")
def fhir_patient(db: Session = Depends(get_db), user_id: int = Depends(verify_token)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Patient not found")
    return JSONResponse(content=patient_resource(user.id, user.email), media_type=FHIR_MEDIA)


@router.get("/Observation")
def fhir_observations(days: int = 30, db: Session = Depends(get_db), user_id: int = Depends(verify_token)):
    """All biometric observations for the user as a FHIR searchset Bundle."""
    logs = (
        db.query(HealthLog)
        .filter(HealthLog.user_id == user_id)
        .order_by(HealthLog.date.desc())
        .limit(days)
        .all()
    )
    return JSONResponse(content=observations_bundle(logs, user_id), media_type=FHIR_MEDIA)
