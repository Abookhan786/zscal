from typing import List, Dict, Any, Optional
from datetime import datetime, timezone
import uuid
from pydantic import BaseModel
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from database.connection import get_db
from database.models import Incident, IncidentEvidence, AuditLog

router = APIRouter(prefix="/api/v1/incidents", tags=["SOC Incident Management"])

class IncidentUpdateRequest(BaseModel):
    status: Optional[str] = None  # OPEN, INVESTIGATING, CONTAINED, RESOLVED, CLOSED, FALSE_POSITIVE
    assignee: Optional[str] = None
    remediation_notes: Optional[str] = None

class AddEvidenceRequest(BaseModel):
    evidence_type: str  # LOG, DLP_SNIPPET, PACKET_DUMP, POSTURE_DIFF
    description: str
    data: Dict[str, Any]

@router.get("/")
def list_incidents(tenant_id: str = "tenant-enterprise-01", db: Session = Depends(get_db)):
    return db.query(Incident).filter(Incident.tenant_id == tenant_id).order_by(Incident.created_at.desc()).all()

@router.get("/{incident_id}")
def get_incident(incident_id: str, db: Session = Depends(get_db)):
    inc = db.query(Incident).filter(Incident.id == incident_id).first()
    if not inc:
        raise HTTPException(status_code=404, detail="Incident not found")
    evidence = db.query(IncidentEvidence).filter(IncidentEvidence.incident_id == incident_id).all()
    return {
        "incident": inc,
        "evidence": evidence
    }

@router.patch("/{incident_id}")
def update_incident(incident_id: str, req: IncidentUpdateRequest, db: Session = Depends(get_db)):
    inc = db.query(Incident).filter(Incident.id == incident_id).first()
    if not inc:
        raise HTTPException(status_code=404, detail="Incident not found")

    old_status = inc.status
    if req.status:
        inc.status = req.status
    if req.assignee:
        inc.assignee = req.assignee
    if req.remediation_notes:
        inc.remediation_notes = req.remediation_notes
    inc.updated_at = datetime.now(timezone.utc)

    # Audit log
    audit = AuditLog(
        tenant_id=inc.tenant_id,
        actor=inc.assignee or "analyst@zerotrustx.internal",
        action="INCIDENT_STATUS_CHANGED",
        resource=f"incidents/{inc.incident_number}",
        before_state={"status": old_status},
        after_state={"status": inc.status, "notes": inc.remediation_notes}
    )
    db.add(audit)
    db.commit()
    db.refresh(inc)
    return inc

@router.post("/{incident_id}/evidence")
def add_incident_evidence(incident_id: str, req: AddEvidenceRequest, db: Session = Depends(get_db)):
    inc = db.query(Incident).filter(Incident.id == incident_id).first()
    if not inc:
        raise HTTPException(status_code=404, detail="Incident not found")

    ev = IncidentEvidence(
        incident_id=incident_id,
        evidence_type=req.evidence_type,
        description=req.description,
        data=req.data
    )
    db.add(ev)
    db.commit()
    db.refresh(ev)
    return ev
