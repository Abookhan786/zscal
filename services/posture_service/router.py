from typing import List, Dict, Any, Optional
from datetime import datetime, timezone
from pydantic import BaseModel
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from database.connection import get_db
from database.models import Device, DevicePosture, SecurityEvent

router = APIRouter(prefix="/api/v1/posture", tags=["Device Posture Engine"])

class PostureReportRequest(BaseModel):
    device_id: str
    tenant_id: Optional[str] = "tenant-enterprise-01"
    firewall_enabled: bool
    antivirus_enabled: bool
    disk_encrypted: bool
    screen_lock_enabled: bool
    patches_up_to_date: bool
    certificate_valid: bool = True
    reported_ip: Optional[str] = "10.100.4.12"
    raw_details: Optional[Dict[str, Any]] = None

class DeviceRegistrationRequest(BaseModel):
    device_name: str
    hostname: str
    os: str
    os_version: str
    agent_version: str = "1.2.0"
    is_managed: bool = True
    tenant_id: Optional[str] = "tenant-enterprise-01"
    user_id: Optional[str] = None

def compute_compliance_status(posture: DevicePosture) -> str:
    # If all critical security controls are enabled -> COMPLIANT
    # If patches missing or screen lock missing -> DEGRADED
    # If firewall or antivirus or disk encryption disabled -> NON_COMPLIANT
    if not posture.firewall_enabled or not posture.antivirus_enabled or not posture.disk_encrypted:
        return "NON_COMPLIANT"
    if not posture.patches_up_to_date or not posture.screen_lock_enabled or not posture.certificate_valid:
        return "DEGRADED"
    return "COMPLIANT"

@router.get("/devices")
def list_devices(tenant_id: str = "tenant-enterprise-01", db: Session = Depends(get_db)):
    devices = db.query(Device).filter(Device.tenant_id == tenant_id).all()
    results = []
    for d in devices:
        posture = db.query(DevicePosture).filter(DevicePosture.device_id == d.id).first()
        results.append({
            "id": d.id,
            "device_name": d.device_name,
            "hostname": d.hostname,
            "os": d.os,
            "os_version": d.os_version,
            "agent_version": d.agent_version,
            "is_managed": d.is_managed,
            "compliance_status": d.compliance_status,
            "risk_score": d.risk_score,
            "last_seen_at": d.last_seen_at,
            "posture": {
                "firewall_enabled": posture.firewall_enabled if posture else False,
                "antivirus_enabled": posture.antivirus_enabled if posture else False,
                "disk_encrypted": posture.disk_encrypted if posture else False,
                "screen_lock_enabled": posture.screen_lock_enabled if posture else False,
                "patches_up_to_date": posture.patches_up_to_date if posture else False,
                "certificate_valid": posture.certificate_valid if posture else False,
                "reported_ip": posture.reported_ip if posture else "unknown"
            } if posture else None
        })
    return results

@router.get("/devices/{device_id}")
def get_device(device_id: str, db: Session = Depends(get_db)):
    d = db.query(Device).filter(Device.id == device_id).first()
    if not d:
        raise HTTPException(status_code=404, detail="Device not found")
    posture = db.query(DevicePosture).filter(DevicePosture.device_id == d.id).first()
    return {
        "device": d,
        "posture": posture
    }

@router.post("/report")
def report_posture(req: PostureReportRequest, db: Session = Depends(get_db)):
    device = db.query(Device).filter(Device.id == req.device_id).first()
    if not device:
        raise HTTPException(status_code=404, detail="Device not found")

    posture = db.query(DevicePosture).filter(DevicePosture.device_id == req.device_id).first()
    if not posture:
        posture = DevicePosture(
            device_id=req.device_id,
            tenant_id=req.tenant_id
        )
        db.add(posture)

    # Detect posture degradation
    was_compliant = device.compliance_status == "COMPLIANT"

    posture.firewall_enabled = req.firewall_enabled
    posture.antivirus_enabled = req.antivirus_enabled
    posture.disk_encrypted = req.disk_encrypted
    posture.screen_lock_enabled = req.screen_lock_enabled
    posture.patches_up_to_date = req.patches_up_to_date
    posture.certificate_valid = req.certificate_valid
    posture.reported_ip = req.reported_ip or posture.reported_ip
    if req.raw_details:
        posture.raw_details = req.raw_details
    posture.updated_at = datetime.now(timezone.utc)

    # Compute new compliance & adjust risk score
    new_compliance = compute_compliance_status(posture)
    device.compliance_status = new_compliance
    device.last_seen_at = datetime.now(timezone.utc)

    if new_compliance == "NON_COMPLIANT":
        device.risk_score = max(device.risk_score, 82)
    elif new_compliance == "DEGRADED":
        device.risk_score = max(device.risk_score, 45)
    else:
        device.risk_score = 12

    # Emit security event if status degraded
    if was_compliant and new_compliance != "COMPLIANT":
        event = SecurityEvent(
            tenant_id=device.tenant_id,
            event_type="DEVICE_POSTURE_CHANGE",
            severity="HIGH" if new_compliance == "NON_COMPLIANT" else "MEDIUM",
            device_id=device.id,
            reason=f"Device posture shifted to {new_compliance} (Firewall: {req.firewall_enabled}, AV: {req.antivirus_enabled}, Disk: {req.disk_encrypted})",
            risk_score=device.risk_score
        )
        db.add(event)

    db.commit()
    db.refresh(device)

    return {
        "status": "posture_recorded",
        "compliance_status": device.compliance_status,
        "device_risk_score": device.risk_score
    }

@router.post("/register")
def register_device(req: DeviceRegistrationRequest, db: Session = Depends(get_db)):
    dev = Device(
        tenant_id=req.tenant_id,
        user_id=req.user_id,
        device_name=req.device_name,
        hostname=req.hostname,
        os=req.os,
        os_version=req.os_version,
        agent_version=req.agent_version,
        is_managed=req.is_managed,
        compliance_status="COMPLIANT" if req.is_managed else "NON_COMPLIANT",
        risk_score=10 if req.is_managed else 75
    )
    db.add(dev)
    db.commit()
    db.refresh(dev)

    posture = DevicePosture(
        device_id=dev.id,
        tenant_id=dev.tenant_id,
        firewall_enabled=True if req.is_managed else False,
        antivirus_enabled=True if req.is_managed else False,
        disk_encrypted=True if req.is_managed else False,
        screen_lock_enabled=True,
        patches_up_to_date=True,
        certificate_valid=True,
        reported_ip="10.100.4.15"
    )
    db.add(posture)
    db.commit()

    return {
        "id": dev.id,
        "device_name": dev.device_name,
        "hostname": dev.hostname,
        "os": dev.os,
        "os_version": dev.os_version,
        "is_managed": dev.is_managed,
        "compliance_status": dev.compliance_status,
        "risk_score": dev.risk_score
    }
