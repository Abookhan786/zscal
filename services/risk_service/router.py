from typing import List, Dict, Any, Optional
from datetime import datetime, timezone
from pydantic import BaseModel
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from database.connection import get_db
from database.models import User, Device, DevicePosture, RiskScore, RiskEvent, SecurityEvent

router = APIRouter(prefix="/api/v1/risk", tags=["Adaptive Risk Engine"])

class RiskEvaluationRequest(BaseModel):
    user_id: Optional[str] = None
    device_id: Optional[str] = None
    untrusted_network: bool = False
    suspicious_location: bool = False
    failed_attempts: int = 0
    dlp_violation: bool = False
    tenant_id: Optional[str] = "tenant-enterprise-01"

def calculate_dynamic_risk(
    user: Optional[User],
    device: Optional[Device],
    posture: Optional[DevicePosture],
    extra_signals: Dict[str, Any]
) -> Dict[str, Any]:
    score = 10  # Base risk
    factors = []

    # User base risk
    if user:
        if user.failed_login_attempts > 0:
            delta = min(30, user.failed_login_attempts * 10)
            score += delta
            factors.append(f"Failed login attempts ({user.failed_login_attempts}): +{delta}")
        if user.is_locked:
            score += 50
            factors.append("Account currently locked: +50")

    # Device checks
    if device:
        if not device.is_managed:
            score += 25
            factors.append("Unmanaged / BYOD device: +25")
        if device.compliance_status == "NON_COMPLIANT":
            score += 35
            factors.append("Device non-compliant posture: +35")
        elif device.compliance_status == "DEGRADED":
            score += 15
            factors.append("Device degraded posture: +15")

    # Posture specific
    if posture:
        if not posture.firewall_enabled:
            score += 20
            factors.append("Endpoint firewall disabled: +20")
        if not posture.antivirus_enabled:
            score += 20
            factors.append("Endpoint antivirus disabled: +20")
        if not posture.disk_encrypted:
            score += 15
            factors.append("Disk encryption disabled: +15")
        if not posture.certificate_valid:
            score += 25
            factors.append("Invalid device mTLS certificate: +25")

    # Contextual flags
    if extra_signals.get("untrusted_network"):
        score += 15
        factors.append("Untrusted public network: +15")
    if extra_signals.get("suspicious_location"):
        score += 25
        factors.append("Impossible travel / abnormal geolocation: +25")
    if extra_signals.get("dlp_violation"):
        score += 40
        factors.append("Recent DLP exfiltration violation: +40")

    final_score = min(100, max(0, score))

    # Risk band
    if final_score <= 30:
        band = "LOW"
        recommendation = "ALLOW"
    elif final_score <= 60:
        band = "MEDIUM"
        recommendation = "ALLOW"
    elif final_score <= 80:
        band = "HIGH"
        recommendation = "STEP_UP_MFA"
    else:
        band = "CRITICAL"
        recommendation = "DENY"

    return {
        "score": final_score,
        "band": band,
        "factors": factors,
        "recommendation": recommendation
    }

@router.post("/evaluate")
def evaluate_risk(req: RiskEvaluationRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == req.user_id).first() if req.user_id else None
    device = db.query(Device).filter(Device.id == req.device_id).first() if req.device_id else None
    posture = db.query(DevicePosture).filter(DevicePosture.device_id == req.device_id).first() if req.device_id else None

    extra = {
        "untrusted_network": req.untrusted_network,
        "suspicious_location": req.suspicious_location,
        "dlp_violation": req.dlp_violation
    }

    result = calculate_dynamic_risk(user, device, posture, extra)

    # Update device and user current risk
    if user:
        user.current_risk = result["score"]
    if device:
        device.risk_score = result["score"]
    db.commit()

    return result

@router.get("/scores")
def list_risk_overview(tenant_id: str = "tenant-enterprise-01", db: Session = Depends(get_db)):
    users = db.query(User).filter(User.tenant_id == tenant_id).all()
    devices = db.query(Device).filter(Device.tenant_id == tenant_id).all()

    user_risks = [
        {"id": u.id, "name": u.username, "role": u.role, "risk": u.current_risk, "department": u.department}
        for u in users
    ]
    device_risks = [
        {"id": d.id, "name": d.device_name, "os": d.os, "risk": d.risk_score, "compliance": d.compliance_status}
        for d in devices
    ]

    critical_count = sum(1 for u in users if u.current_risk > 80) + sum(1 for d in devices if d.risk_score > 80)
    high_count = sum(1 for u in users if 60 < u.current_risk <= 80) + sum(1 for d in devices if 60 < d.risk_score <= 80)

    return {
        "summary": {
            "critical_entities": critical_count,
            "high_risk_entities": high_count,
            "average_user_risk": sum(u.current_risk for u in users) / max(1, len(users)),
            "average_device_risk": sum(d.risk_score for d in devices) / max(1, len(devices))
        },
        "users": user_risks,
        "devices": device_risks
    }
