import re
from typing import List, Dict, Any, Optional
from datetime import datetime, timezone
import uuid
from pydantic import BaseModel
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session

from database.connection import get_db
from database.models import DLPEvent, SecurityEvent, Alert, Incident, IncidentEvidence

router = APIRouter(prefix="/api/v1/dlp", tags=["Data Loss Prevention (DLP)"])

class DLPScanTextRequest(BaseModel):
    content: str
    file_name: Optional[str] = "unnamed_payload.txt"
    username: Optional[str] = "alice"
    destination: Optional[str] = "cloud_upload"
    policy_action: Optional[str] = "BLOCK"  # BLOCK, REDACT, WARN, LOG
    tenant_id: Optional[str] = "tenant-enterprise-01"

def luhn_checksum(card_number: str) -> bool:
    digits = [int(c) for c in card_number if c.isdigit()]
    if len(digits) < 13 or len(digits) > 19:
        return False
    checksum = 0
    reverse_digits = digits[::-1]
    for i, d in enumerate(reverse_digits):
        if i % 2 == 1:
            doubled = d * 2
            checksum += (doubled - 9) if doubled > 9 else doubled
        else:
            checksum += d
    return checksum % 10 == 0

def redact_credit_card(match: re.Match) -> str:
    raw = match.group(0)
    digits = re.sub(r"\D", "", raw)
    if len(digits) >= 12:
        return f"{digits[:4]}-XXXX-XXXX-{digits[-4:]}"
    return "XXXX-XXXX-XXXX-XXXX"

def redact_ssn(match: re.Match) -> str:
    raw = match.group(0)
    return f"XXX-XX-{raw[-4:]}"

def redact_api_key(match: re.Match) -> str:
    raw = match.group(0)
    return f"{raw[:4]}****************"

DLP_RULES = [
    {
        "type": "CREDIT_CARD",
        "pattern": re.compile(r"\b(?:\d{4}[ -]?){3}\d{4}\b"),
        "severity": "CRITICAL",
        "description": "PCI-DSS: Payment card primary account number",
        "validator": luhn_checksum,
        "redactor": redact_credit_card
    },
    {
        "type": "SSN",
        "pattern": re.compile(r"\b\d{3}-\d{2}-\d{4}\b"),
        "severity": "HIGH",
        "description": "PII: US Social Security Number",
        "validator": None,
        "redactor": redact_ssn
    },
    {
        "type": "AWS_API_KEY",
        "pattern": re.compile(r"\bAKIA[0-9A-Z]{16}\b"),
        "severity": "CRITICAL",
        "description": "Cloud Secrets: AWS Access Key ID",
        "validator": None,
        "redactor": redact_api_key
    },
    {
        "type": "PRIVATE_KEY",
        "pattern": re.compile(r"-----BEGIN [A-Z ]*PRIVATE KEY-----"),
        "severity": "CRITICAL",
        "description": "Cryptographic Secret: Unencrypted Private Key",
        "validator": None,
        "redactor": lambda m: "[REDACTED_RSA_PRIVATE_KEY]"
    },
    {
        "type": "EMPLOYEE_DATA",
        "pattern": re.compile(r"(EMP-\d{4,6}|salary[\s:=]+\$?\d{4,9}|payroll_account[\s:=]+\d+)", re.IGNORECASE),
        "severity": "HIGH",
        "description": "Corporate Confidential: Employee Record & Compensation Data",
        "validator": None,
        "redactor": lambda m: "[REDACTED_EMPLOYEE_RECORD]"
    }
]

def scan_text_for_dlp(text: str) -> Dict[str, Any]:
    findings = []
    redacted_text = text

    for rule in DLP_RULES:
        matches = list(rule["pattern"].finditer(text))
        valid_matches = []
        for m in matches:
            matched_str = m.group(0)
            if rule["validator"] is None or rule["validator"](matched_str):
                valid_matches.append(matched_str)

        if valid_matches:
            findings.append({
                "type": rule["type"],
                "severity": rule["severity"],
                "description": rule["description"],
                "count": len(valid_matches),
                "samples": [v[:6] + "..." for v in valid_matches[:3]]
            })
            if rule["redactor"]:
                redacted_text = rule["pattern"].sub(rule["redactor"], redacted_text)

    return {
        "has_violations": len(findings) > 0,
        "findings": findings,
        "redacted_text": redacted_text
    }

@router.post("/scan")
def scan_dlp_content(req: DLPScanTextRequest, db: Session = Depends(get_db)):
    result = scan_text_for_dlp(req.content)

    if not result["has_violations"]:
        return {
            "action": "ALLOW",
            "violations_found": False,
            "message": "Content cleared DLP inspection"
        }

    # Violations found
    top_severity = "CRITICAL" if any(f["severity"] == "CRITICAL" for f in result["findings"]) else "HIGH"
    first_type = result["findings"][0]["type"]

    # Record DLP Event
    dlp_ev = DLPEvent(
        tenant_id=req.tenant_id,
        username=req.username,
        file_name=req.file_name,
        sensitivity_type=first_type,
        action=req.policy_action,
        severity=top_severity,
        match_count=sum(f["count"] for f in result["findings"]),
        redacted_preview=result["redacted_text"][:250],
        destination=req.destination
    )
    db.add(dlp_ev)

    # Central Security Event
    sec_ev = SecurityEvent(
        tenant_id=req.tenant_id,
        event_type="DLP_DETECTION",
        severity=top_severity,
        username=req.username,
        application="DLP Gateway",
        reason=f"Exfiltration attempt blocked: {first_type} detected in {req.file_name}",
        risk_score=88
    )
    db.add(sec_ev)

    # Trigger Alert and Incident if policy action is BLOCK
    if req.policy_action == "BLOCK":
        alert = Alert(
            tenant_id=req.tenant_id,
            title=f"DLP Policy Violation: {first_type} in {req.file_name}",
            description=f"User '{req.username}' attempted to transfer file containing sensitive {first_type} records to destination '{req.destination}'.",
            severity=top_severity,
            status="OPEN",
            source="DLP_ENGINE",
            affected_entity=req.username
        )
        db.add(alert)
        db.commit()

        # Create Incident
        inc_number = f"INC-{uuid.uuid4().hex[:6].upper()}"
        incident = Incident(
            tenant_id=req.tenant_id,
            incident_number=inc_number,
            title=f"Data Exfiltration Block: {first_type} [{req.username}]",
            severity=top_severity,
            status="OPEN",
            assignee="Security Analyst",
            affected_user=req.username,
            affected_application="DLP Gateway",
            summary=f"Automated DLP containment triggered on user {req.username} attempting to upload {req.file_name} with {first_type} sensitive records.",
            remediation_notes="User notified; endpoint session restricted pending review."
        )
        db.add(incident)
        db.commit()

        evidence = IncidentEvidence(
            incident_id=incident.id,
            evidence_type="DLP_SNIPPET",
            description=f"Redacted evidence snapshot of {req.file_name}",
            data={"findings": result["findings"], "redacted_preview": result["redacted_text"][:200]}
        )
        db.add(evidence)
        db.commit()

    return {
        "action": req.policy_action,
        "violations_found": True,
        "severity": top_severity,
        "findings": result["findings"],
        "redacted_content": result["redacted_text"] if req.policy_action == "REDACT" else None,
        "message": f"DLP policy {req.policy_action} triggered. Security incident generated."
    }

@router.get("/events")
def list_dlp_events(tenant_id: str = "tenant-enterprise-01", limit: int = 50, db: Session = Depends(get_db)):
    return db.query(DLPEvent).filter(DLPEvent.tenant_id == tenant_id).order_by(DLPEvent.timestamp.desc()).limit(limit).all()

@router.get("/rules")
def list_dlp_rules():
    return [
        {
            "type": r["type"],
            "severity": r["severity"],
            "description": r["description"]
        }
        for r in DLP_RULES
    ]
