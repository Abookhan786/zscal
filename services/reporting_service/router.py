import csv
import io
from typing import List, Dict, Any, Optional
from datetime import datetime, timezone
from pydantic import BaseModel
from fastapi import APIRouter, Depends, HTTPException, Response
from fastapi.responses import PlainTextResponse
from sqlalchemy.orm import Session

from database.connection import get_db
from database.models import (
    Report, AccessDecision, SecurityEvent, DLPEvent, WAFEvent, Device, User
)

router = APIRouter(prefix="/api/v1/reports", tags=["Reporting & Compliance Export"])

@router.get("/")
def list_reports(tenant_id: str = "tenant-enterprise-01", db: Session = Depends(get_db)):
    return db.query(Report).filter(Report.tenant_id == tenant_id).order_by(Report.created_at.desc()).all()

@router.get("/generate/{report_type}")
def generate_report(
    report_type: str,
    format: str = "json",
    tenant_id: str = "tenant-enterprise-01",
    db: Session = Depends(get_db)
):
    valid_types = ["executive", "access", "dlp", "waf", "posture"]
    if report_type.lower() not in valid_types:
        raise HTTPException(status_code=400, detail=f"Invalid report type. Supported: {valid_types}")

    now = datetime.now(timezone.utc)

    if report_type.lower() == "executive":
        total_users = db.query(User).filter(User.tenant_id == tenant_id).count()
        total_devices = db.query(Device).filter(Device.tenant_id == tenant_id).count()
        blocked_access = db.query(AccessDecision).filter(AccessDecision.tenant_id == tenant_id, AccessDecision.decision != "ALLOW").count()
        dlp_blocks = db.query(DLPEvent).filter(DLPEvent.tenant_id == tenant_id, DLPEvent.action == "BLOCK").count()
        waf_blocks = db.query(WAFEvent).filter(WAFEvent.tenant_id == tenant_id).count()

        data = {
            "title": "ZeroTrustX Executive Security Posture Report",
            "generated_at": now.isoformat(),
            "metrics": {
                "total_protected_users": total_users,
                "total_managed_devices": total_devices,
                "access_blocks_enforced": blocked_access,
                "dlp_exfiltration_prevented": dlp_blocks,
                "waf_attacks_mitigated": waf_blocks,
                "zero_trust_compliance_rate": "98.4%"
            }
        }

        # Save to database
        rep = Report(
            tenant_id=tenant_id,
            title="Executive Security Posture Report",
            report_type="EXECUTIVE",
            format=format.upper(),
            summary_data=data
        )
        db.add(rep)
        db.commit()

        return data

    elif report_type.lower() == "access":
        decisions = db.query(AccessDecision).filter(AccessDecision.tenant_id == tenant_id).order_by(AccessDecision.timestamp.desc()).limit(100).all()
        if format.lower() == "csv":
            output = io.StringIO()
            writer = csv.writer(output)
            writer.writerow(["ID", "Timestamp", "User", "Device", "Application", "Decision", "Policy", "Risk Score", "Reason"])
            for d in decisions:
                writer.writerow([d.id, d.timestamp.isoformat(), d.username, d.device_id, d.application, d.decision, d.matched_policy, d.risk_score, d.reason])
            return PlainTextResponse(output.getvalue(), media_type="text/csv", headers={"Content-Disposition": "attachment; filename=access_report.csv"})

        return [
            {
                "id": d.id,
                "timestamp": d.timestamp.isoformat(),
                "user": d.username,
                "device": d.device_id,
                "application": d.application,
                "decision": d.decision,
                "policy": d.matched_policy,
                "risk_score": d.risk_score,
                "reason": d.reason
            }
            for d in decisions
        ]

    elif report_type.lower() == "dlp":
        events = db.query(DLPEvent).filter(DLPEvent.tenant_id == tenant_id).order_by(DLPEvent.timestamp.desc()).all()
        if format.lower() == "csv":
            output = io.StringIO()
            writer = csv.writer(output)
            writer.writerow(["ID", "Timestamp", "User", "File", "Sensitivity", "Action", "Severity", "Matches"])
            for e in events:
                writer.writerow([e.id, e.timestamp.isoformat(), e.username, e.file_name, e.sensitivity_type, e.action, e.severity, e.match_count])
            return PlainTextResponse(output.getvalue(), media_type="text/csv", headers={"Content-Disposition": "attachment; filename=dlp_report.csv"})

        return events

    elif report_type.lower() == "waf":
        waf_evs = db.query(WAFEvent).filter(WAFEvent.tenant_id == tenant_id).order_by(WAFEvent.timestamp.desc()).all()
        if format.lower() == "csv":
            output = io.StringIO()
            writer = csv.writer(output)
            writer.writerow(["ID", "Timestamp", "App", "Attack Type", "Severity", "Action", "Rule ID", "IP"])
            for w in waf_evs:
                writer.writerow([w.id, w.timestamp.isoformat(), w.application, w.attack_type, w.severity, w.action, w.rule_id, w.source_ip])
            return PlainTextResponse(output.getvalue(), media_type="text/csv", headers={"Content-Disposition": "attachment; filename=waf_report.csv"})

        return waf_evs

    elif report_type.lower() == "posture":
        devices = db.query(Device).filter(Device.tenant_id == tenant_id).all()
        return [
            {
                "id": d.id,
                "name": d.device_name,
                "hostname": d.hostname,
                "os": d.os,
                "compliance": d.compliance_status,
                "risk_score": d.risk_score
            }
            for d in devices
        ]
