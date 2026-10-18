from typing import Dict, Any, Optional
from datetime import datetime, timezone
import uuid
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from database.connection import get_db
from database.models import (
    User, Device, DevicePosture, Application, Policy, AccessDecision,
    SecurityEvent, Alert, Incident, IncidentEvidence, ExperienceMetric
)
from services.policy_service.evaluator import evaluate_policies
from services.risk_service.router import calculate_dynamic_risk
from services.dlp_service.router import scan_text_for_dlp
from services.event_service.router import broadcast_event

router = APIRouter(prefix="/api/v1/scenario", tags=["Attack Lab & Demonstration Scenario"])

@router.post("/step/{step_number}")
async def execute_scenario_step(step_number: int, tenant_id: str = "tenant-enterprise-01", db: Session = Depends(get_db)):
    """
    Executes an individual step of the Section 77 Verification Narrative:
    Step 1: Alice MFA Sign-in
    Step 2: Posture Verification & Low Risk
    Step 3: Access Git Server (ALLOW)
    Step 4: Access Finance Application (DENY)
    Step 5: Disable Firewall & Retest Git (DENY due to non-compliant posture & risk 82)
    Step 6: Exfiltrate Employee Data (DLP BLOCK & Incident Created)
    Step 7: Git Server Latency Spike (DEM Alert)
    Step 8: SOC Analyst Incident Triage
    """
    alice = db.query(User).filter(User.username == "alice", User.tenant_id == tenant_id).first()
    alice_dev = db.query(Device).filter(Device.device_name == "Alice-ThinkPad-X1").first()
    alice_posture = db.query(DevicePosture).filter(DevicePosture.device_id == alice_dev.id).first() if alice_dev else None
    app_git = db.query(Application).filter(Application.domain == "git.internal").first()
    app_fin = db.query(Application).filter(Application.domain == "finance.internal").first()
    policies = db.query(Policy).filter(Policy.tenant_id == tenant_id).order_by(Policy.priority.asc()).all()

    now = datetime.now(timezone.utc)

    if step_number == 1:
        # Step 1: Alice signs in using MFA
        alice.failed_login_attempts = 0
        alice.last_login_at = now
        alice.current_risk = 12
        event = SecurityEvent(
            tenant_id=tenant_id,
            event_type="AUTH_LOGIN",
            severity="INFO",
            user_id=alice.id,
            username="alice",
            device_id=alice_dev.id if alice_dev else None,
            source_ip="10.100.4.12",
            application="Identity Service",
            reason="MFA TOTP verified successfully for user alice",
            risk_score=12
        )
        db.add(event)
        db.commit()
        await broadcast_event({
            "event_type": "AUTH_LOGIN",
            "severity": "INFO",
            "username": "alice",
            "reason": "MFA TOTP verified successfully",
            "risk_score": 12,
            "timestamp": now.isoformat()
        })
        return {
            "step": 1,
            "title": "MFA Authentication",
            "status": "SUCCESS",
            "details": {
                "user": "alice",
                "role": "developer",
                "mfa_verified": True,
                "token_issued": True
            }
        }

    elif step_number == 2:
        # Step 2: Managed laptop reports compliant posture
        alice_posture.firewall_enabled = True
        alice_posture.antivirus_enabled = True
        alice_posture.disk_encrypted = True
        alice_posture.patches_up_to_date = True
        alice_dev.compliance_status = "COMPLIANT"
        alice_dev.risk_score = 12
        alice.current_risk = 12
        db.commit()
        return {
            "step": 2,
            "title": "Device Posture Evaluated",
            "status": "COMPLIANT",
            "details": {
                "firewall": "ON",
                "antivirus": "ON",
                "encryption": "ON",
                "patch_status": "COMPLIANT",
                "risk_score": 12,
                "risk_band": "LOW"
            }
        }

    elif step_number == 3:
        # Step 3: Alice requests Git -> ALLOW
        eval_context = {
            "user": {"role": alice.role, "department": alice.department},
            "device": {"managed": alice_dev.is_managed, "firewall_enabled": True, "antivirus_enabled": True},
            "application": {"name": app_git.name, "domain": app_git.domain},
            "risk": {"score": 12}
        }
        res = evaluate_policies(policies, eval_context)
        dec = AccessDecision(
            tenant_id=tenant_id,
            user_id=alice.id,
            username=alice.username,
            device_id=alice_dev.id,
            application=app_git.name,
            decision=res.decision,
            matched_policy=res.matched_policy_name,
            risk_score=12,
            reason=res.reason
        )
        db.add(dec)
        event = SecurityEvent(
            tenant_id=tenant_id,
            event_type="ACCESS_ALLOWED",
            severity="INFO",
            username=alice.username,
            device_id=alice_dev.id,
            application=app_git.name,
            reason=f"Matched policy: {res.matched_policy_name}",
            risk_score=12
        )
        db.add(event)
        db.commit()
        await broadcast_event({
            "event_type": "ACCESS_ALLOWED",
            "severity": "INFO",
            "username": "alice",
            "application": "Git Server",
            "reason": "Matched policy: Developer Git Access",
            "risk_score": 12,
            "timestamp": now.isoformat()
        })
        return {
            "step": 3,
            "title": "Private Access to Git Server",
            "decision": res.decision,
            "policy": res.matched_policy_name,
            "reason": res.reason,
            "risk_score": 12
        }

    elif step_number == 4:
        # Step 4: Alice tries Finance -> DENY (Developer role + finance app)
        eval_context = {
            "user": {"role": alice.role, "department": alice.department},
            "device": {"managed": alice_dev.is_managed, "firewall_enabled": True},
            "application": {"name": app_fin.name, "domain": app_fin.domain},
            "risk": {"score": 12}
        }
        res = evaluate_policies(policies, eval_context)
        dec = AccessDecision(
            tenant_id=tenant_id,
            user_id=alice.id,
            username=alice.username,
            device_id=alice_dev.id,
            application=app_fin.name,
            decision="DENY",
            matched_policy="Implicit Default Zero Trust Deny",
            risk_score=12,
            reason="Role 'developer' is not authorized for Finance Application segment"
        )
        db.add(dec)
        event = SecurityEvent(
            tenant_id=tenant_id,
            event_type="ACCESS_DENIED",
            severity="MEDIUM",
            username=alice.username,
            device_id=alice_dev.id,
            application=app_fin.name,
            reason="Role 'developer' unauthorized for Finance Application",
            risk_score=12
        )
        db.add(event)
        db.commit()
        await broadcast_event({
            "event_type": "ACCESS_DENIED",
            "severity": "MEDIUM",
            "username": "alice",
            "application": "Finance Application",
            "reason": "Developer role unauthorized for Finance segment",
            "risk_score": 12,
            "timestamp": now.isoformat()
        })
        return {
            "step": 4,
            "title": "Access to Finance Application",
            "decision": "DENY",
            "policy": "Implicit Default Zero Trust Deny",
            "reason": "User role 'developer' lacks entitlement to finance.internal segment"
        }

    elif step_number == 5:
        # Step 5: Posture degrades (Firewall disabled) -> Git access blocked, Risk 82
        alice_posture.firewall_enabled = False
        alice_dev.compliance_status = "NON_COMPLIANT"
        alice_dev.risk_score = 82
        alice.current_risk = 82

        event_posture = SecurityEvent(
            tenant_id=tenant_id,
            event_type="DEVICE_POSTURE_CHANGE",
            severity="HIGH",
            username=alice.username,
            device_id=alice_dev.id,
            reason="Endpoint firewall disabled. Posture drifted to NON_COMPLIANT.",
            risk_score=82
        )
        db.add(event_posture)

        # Attempting Git now triggers High Risk policy (priority 10)
        eval_context = {
            "user": {"role": alice.role, "department": alice.department},
            "device": {"managed": True, "firewall_enabled": False},
            "application": {"name": app_git.name, "domain": app_git.domain},
            "risk": {"score": 82}
        }
        res = evaluate_policies(policies, eval_context)
        dec = AccessDecision(
            tenant_id=tenant_id,
            user_id=alice.id,
            username=alice.username,
            device_id=alice_dev.id,
            application=app_git.name,
            decision="DENY",
            matched_policy=res.matched_policy_name,
            risk_score=82,
            reason=f"Device posture compromised: {res.reason}"
        )
        db.add(dec)
        db.commit()
        await broadcast_event({
            "event_type": "DEVICE_POSTURE_CHANGE",
            "severity": "HIGH",
            "username": "alice",
            "reason": "Endpoint firewall disabled! Posture NON_COMPLIANT, Risk 82",
            "risk_score": 82,
            "timestamp": now.isoformat()
        })
        return {
            "step": 5,
            "title": "Posture Drift & Access Revocation",
            "firewall_state": "OFF",
            "compliance_status": "NON_COMPLIANT",
            "risk_score": 82,
            "git_access_decision": "DENY",
            "triggered_policy": res.matched_policy_name
        }

    elif step_number == 6:
        # Step 6: Alice attempts to upload sensitive employee data -> DLP Block & Incident
        sample_payload = "Employee Payroll Batch:\nEMP-94021: Alice Developer, salary: $145000\nEMP-81092: John Smith, salary: $182000\nCard: 4532-0192-8841-1027"
        scan_res = scan_text_for_dlp(sample_payload)

        inc_num = f"INC-SEC-{uuid.uuid4().hex[:5].upper()}"
        incident = Incident(
            tenant_id=tenant_id,
            incident_number=inc_num,
            title="DLP Exfiltration Violation: Corporate Employee Salary Records",
            severity="CRITICAL",
            status="OPEN",
            assignee="Security Analyst",
            affected_user="alice",
            affected_device="Alice-ThinkPad-X1",
            affected_application="Git Server / File Gateway",
            summary="DLP inspection intercepted outbound upload of confidential employee salaries and payment card numbers.",
            remediation_notes="Payload was blocked. Endpoint session quarantined pending analyst investigation."
        )
        db.add(incident)
        db.commit()

        evidence = IncidentEvidence(
            incident_id=incident.id,
            evidence_type="DLP_SNIPPET",
            description="Redacted payload preview of secret-data.csv",
            data={"findings": scan_res["findings"], "redacted_preview": scan_res["redacted_text"]}
        )
        db.add(evidence)

        sec_ev = SecurityEvent(
            tenant_id=tenant_id,
            event_type="DLP_DETECTION",
            severity="CRITICAL",
            username="alice",
            application="Git Server",
            reason=f"DLP blocked sensitive data transfer. Incident {inc_num} opened.",
            risk_score=94
        )
        db.add(sec_ev)
        db.commit()
        await broadcast_event({
            "event_type": "DLP_DETECTION",
            "severity": "CRITICAL",
            "username": "alice",
            "application": "Git Server",
            "reason": f"DLP blocked sensitive upload! Incident {inc_num} opened.",
            "risk_score": 94,
            "timestamp": now.isoformat()
        })
        return {
            "step": 6,
            "title": "DLP Data Exfiltration Attempt",
            "action": "BLOCK",
            "severity": "CRITICAL",
            "incident_number": inc_num,
            "findings": scan_res["findings"],
            "redacted_evidence": scan_res["redacted_text"]
        }

    elif step_number == 7:
        # Step 7: Git server latency jumps from 150 ms to 900 ms
        metric = ExperienceMetric(
            tenant_id=tenant_id,
            application_name="Git Server",
            dns_ms=18.0,
            tcp_ms=28.0,
            tls_ms=45.0,
            http_ms=810.0,
            total_ms=901.0,
            packet_loss_percent=6.2,
            availability_percent=91.4,
            status="DEGRADED",
            timestamp=now
        )
        db.add(metric)
        alert = Alert(
            tenant_id=tenant_id,
            title="Performance Degradation: Git Server",
            description="HTTP round-trip latency exceeded 900ms threshold (nominal: 150ms). Synthetic probes detected 6.2% packet loss.",
            severity="MEDIUM",
            status="OPEN",
            source="DEM_PROBES",
            affected_entity="Git Server"
        )
        db.add(alert)
        sec_ev = SecurityEvent(
            tenant_id=tenant_id,
            event_type="LATENCY_ALERT",
            severity="MEDIUM",
            application="Git Server",
            reason="Git Server latency jumped to 901ms (status DEGRADED)",
            risk_score=50
        )
        db.add(sec_ev)
        db.commit()
        await broadcast_event({
            "event_type": "LATENCY_ALERT",
            "severity": "MEDIUM",
            "application": "Git Server",
            "reason": "DEM Probe: Git Server latency jumped from 150ms to 901ms!",
            "risk_score": 50,
            "timestamp": now.isoformat()
        })
        return {
            "step": 7,
            "title": "Digital Experience Monitoring Spike",
            "application": "Git Server",
            "latency_ms": 901.0,
            "status": "DEGRADED",
            "alert_created": True
        }

    elif step_number == 8:
        # Step 8: SOC Analyst incident view
        inc = db.query(Incident).filter(Incident.affected_user == "alice").order_by(Incident.created_at.desc()).first()
        evidence = db.query(IncidentEvidence).filter(IncidentEvidence.incident_id == inc.id).all() if inc else []
        return {
            "step": 8,
            "title": "SOC Incident Triage Summary",
            "incident": inc,
            "evidence": evidence,
            "narrative_complete": True
        }

    raise HTTPException(status_code=400, detail="Invalid step number. Steps range from 1 to 8.")

@router.post("/reset")
def reset_scenario_state(tenant_id: str = "tenant-enterprise-01", db: Session = Depends(get_db)):
    """Resets Alice's posture and risk back to healthy baseline."""
    alice = db.query(User).filter(User.username == "alice", User.tenant_id == tenant_id).first()
    alice_dev = db.query(Device).filter(Device.device_name == "Alice-ThinkPad-X1").first()
    alice_posture = db.query(DevicePosture).filter(DevicePosture.device_id == alice_dev.id).first() if alice_dev else None

    if alice:
        alice.failed_login_attempts = 0
        alice.current_risk = 12
        alice.is_locked = False
    if alice_dev:
        alice_dev.compliance_status = "COMPLIANT"
        alice_dev.risk_score = 12
    if alice_posture:
        alice_posture.firewall_enabled = True
        alice_posture.antivirus_enabled = True
        alice_posture.disk_encrypted = True
        alice_posture.patches_up_to_date = True

    # Reset metrics
    metric = ExperienceMetric(
        tenant_id=tenant_id,
        application_name="Git Server",
        dns_ms=12.0,
        tcp_ms=18.0,
        tls_ms=24.0,
        http_ms=110.0,
        total_ms=164.0,
        packet_loss_percent=0.0,
        availability_percent=100.0,
        status="OPTIMAL",
        timestamp=datetime.now(timezone.utc)
    )
    db.add(metric)
    db.commit()
    return {"status": "baseline_restored", "message": "Alice device posture and risk restored to COMPLIANT baseline."}
