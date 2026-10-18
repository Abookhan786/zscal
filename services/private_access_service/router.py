from typing import List, Dict, Any, Optional
from datetime import datetime, timezone, timedelta
import uuid
from pydantic import BaseModel
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from database.connection import get_db
from database.models import (
    Application, ApplicationSegment, Connector, ConnectorGroup,
    User, Device, DevicePosture, Policy, AccessSession,
    AccessDecision, SecurityEvent
)
from services.policy_service.evaluator import evaluate_policies
from services.risk_service.router import calculate_dynamic_risk

router = APIRouter(prefix="/api/v1/access", tags=["Private Application Access Plane"])

class AccessRequest(BaseModel):
    username: str
    device_id: str
    application_domain: str
    client_ip: Optional[str] = "10.100.4.12"
    tenant_id: Optional[str] = "tenant-enterprise-01"

class ApplicationCreateRequest(BaseModel):
    name: str
    domain: str
    port: int = 443
    protocol: str = "HTTPS"
    sensitivity: str = "HIGH"
    connector_group_id: Optional[str] = None
    description: Optional[str] = None
    tenant_id: Optional[str] = "tenant-enterprise-01"

@router.get("/applications")
def list_applications(tenant_id: str = "tenant-enterprise-01", db: Session = Depends(get_db)):
    return db.query(Application).filter(Application.tenant_id == tenant_id).all()

@router.post("/applications")
def create_application(req: ApplicationCreateRequest, db: Session = Depends(get_db)):
    app = Application(
        tenant_id=req.tenant_id,
        name=req.name,
        domain=req.domain,
        port=req.port,
        protocol=req.protocol,
        sensitivity=req.sensitivity,
        connector_group_id=req.connector_group_id,
        description=req.description,
        status="ONLINE",
        health="HEALTHY"
    )
    db.add(app)
    db.commit()
    db.refresh(app)
    return app

@router.get("/sessions")
def list_active_sessions(tenant_id: str = "tenant-enterprise-01", db: Session = Depends(get_db)):
    sessions = db.query(AccessSession).filter(
        AccessSession.tenant_id == tenant_id,
        AccessSession.status == "ACTIVE"
    ).order_by(AccessSession.created_at.desc()).all()
    return sessions

@router.get("/logs")
def list_access_logs(tenant_id: str = "tenant-enterprise-01", limit: int = 50, db: Session = Depends(get_db)):
    decisions = db.query(AccessDecision).filter(
        AccessDecision.tenant_id == tenant_id
    ).order_by(AccessDecision.timestamp.desc()).limit(limit).all()
    return decisions

@router.post("/request")
def request_private_access(req: AccessRequest, db: Session = Depends(get_db)):
    # 1. Resolve Application
    app = db.query(Application).filter(
        Application.domain == req.application_domain,
        Application.tenant_id == req.tenant_id
    ).first()
    if not app:
        raise HTTPException(status_code=404, detail=f"Target private application {req.application_domain} is not registered in Zero Trust catalog")

    # 2. Resolve User & Device
    user = db.query(User).filter(
        (User.username == req.username) | (User.email == req.username),
        User.tenant_id == req.tenant_id
    ).first()
    if not user:
        raise HTTPException(status_code=401, detail="User identity not found or tenant unverified")

    device = db.query(Device).filter(Device.id == req.device_id).first()
    if not device:
        # Check if device_id matches hostname
        device = db.query(Device).filter(Device.hostname == req.device_id).first()
    if not device:
        raise HTTPException(status_code=400, detail="Endpoint device registration not found in zero-trust inventory")

    posture = db.query(DevicePosture).filter(DevicePosture.device_id == device.id).first()

    # 3. Dynamic Risk Evaluation
    risk_info = calculate_dynamic_risk(user, device, posture, {})
    calculated_risk = risk_info["score"]

    # 4. Zero Trust Policy Evaluation
    policies = db.query(Policy).filter(Policy.tenant_id == req.tenant_id).order_by(Policy.priority.asc()).all()

    eval_context = {
        "user": {
            "id": user.id,
            "username": user.username,
            "role": user.role,
            "department": user.department
        },
        "device": {
            "id": device.id,
            "managed": device.is_managed,
            "compliance_status": device.compliance_status,
            "firewall_enabled": posture.firewall_enabled if posture else False,
            "antivirus_enabled": posture.antivirus_enabled if posture else False,
            "disk_encrypted": posture.disk_encrypted if posture else False
        },
        "application": {
            "id": app.id,
            "name": app.name,
            "domain": app.domain,
            "sensitivity": app.sensitivity
        },
        "risk": {
            "score": calculated_risk
        }
    }

    eval_result = evaluate_policies(policies, eval_context)

    # 5. Handle Decision
    decision_record = AccessDecision(
        tenant_id=req.tenant_id,
        user_id=user.id,
        username=user.username,
        device_id=device.id,
        application=app.name,
        decision=eval_result.decision,
        matched_policy=eval_result.matched_policy_name,
        risk_score=calculated_risk,
        reason=eval_result.reason,
        details=eval_result.to_dict()
    )
    db.add(decision_record)

    if eval_result.decision != "ALLOW":
        # Denied or Step-up
        sec_event = SecurityEvent(
            tenant_id=req.tenant_id,
            event_type="ACCESS_DENIED",
            severity="HIGH" if calculated_risk > 75 else "MEDIUM",
            user_id=user.id,
            username=user.username,
            device_id=device.id,
            source_ip=req.client_ip,
            application=app.name,
            reason=f"Access denied: {eval_result.reason} (Policy: {eval_result.matched_policy_name})",
            risk_score=calculated_risk
        )
        db.add(sec_event)
        db.commit()

        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail={
                "error": "ACCESS_DENIED",
                "decision": eval_result.decision,
                "reason": eval_result.reason,
                "policy_triggered": eval_result.matched_policy_name,
                "risk_score": calculated_risk,
                "device_compliance": device.compliance_status,
                "matched_conditions": eval_result.matched_conditions
            }
        )

    # 6. Select Healthy Connector for Brokered Access (HA failover)
    active_connector = db.query(Connector).filter(
        Connector.tenant_id == req.tenant_id,
        Connector.status == "ONLINE"
    ).order_by(Connector.latency_ms.asc()).first()

    connector_id = active_connector.id if active_connector else None

    # Create Access Session
    session_id = f"ztx-sess-{uuid.uuid4().hex[:12]}"
    access_session = AccessSession(
        id=session_id,
        tenant_id=req.tenant_id,
        user_id=user.id,
        device_id=device.id,
        application_id=app.id,
        connector_id=connector_id,
        status="ACTIVE",
        source_ip=req.client_ip,
        risk_score_at_access=calculated_risk,
        policy_id=eval_result.matched_policy_id,
        expires_at=datetime.now(timezone.utc) + timedelta(hours=4)
    )
    db.add(access_session)

    # Log Security Event
    sec_event = SecurityEvent(
        tenant_id=req.tenant_id,
        event_type="ACCESS_ALLOWED",
        severity="INFO",
        user_id=user.id,
        username=user.username,
        device_id=device.id,
        source_ip=req.client_ip,
        application=app.name,
        reason=f"Authorized via policy: {eval_result.matched_policy_name}",
        risk_score=calculated_risk
    )
    db.add(sec_event)
    db.commit()

    return {
        "status": "ACCESS_GRANTED",
        "session_id": session_id,
        "application": {
            "name": app.name,
            "domain": app.domain,
            "protocol": app.protocol,
            "sensitivity": app.sensitivity
        },
        "brokered_connector": {
            "id": active_connector.id if active_connector else "direct-fallback",
            "name": active_connector.name if active_connector else "ZeroTrustX Local Gateway",
            "region": active_connector.region if active_connector else "ap-south-1",
            "latency_ms": active_connector.latency_ms if active_connector else 5.0
        },
        "policy_matched": eval_result.matched_policy_name,
        "risk_score": calculated_risk,
        "expires_in_seconds": 14400,
        "secure_payload_preview": {
            "message": f"Welcome to {app.name}. You have been securely tunneled through ZeroTrustX App Connector.",
            "authorized_role": user.role,
            "device_verified": device.device_name
        }
    }
