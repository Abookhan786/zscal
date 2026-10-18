import re
from typing import List, Dict, Any, Optional
from datetime import datetime, timezone
from pydantic import BaseModel
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from database.connection import get_db
from database.models import WAFEvent, SecurityEvent

router = APIRouter(prefix="/api/v1/waf", tags=["Application Protection & WAF"])

class WAFInspectRequest(BaseModel):
    application: str = "Git Server"
    method: str = "GET"
    path: str = "/search"
    query_params: Optional[Dict[str, str]] = {}
    headers: Optional[Dict[str, str]] = {}
    body: Optional[str] = None
    source_ip: Optional[str] = "192.168.1.100"
    tenant_id: Optional[str] = "tenant-enterprise-01"

# WAF Attack Signature Regexes
WAF_SIGNATURES = [
    {
        "id": "WAF-942100",
        "type": "SQL_INJECTION",
        "pattern": re.compile(r"(\b(union|select|insert|update|delete|drop|alter|exec|cast)\b[\s\S]+\b(from|into|where|table)\b|--|\/\*|\*\/|'(\s*or\s*|\s*and\s*)[\d\w'\"=]+|sleep\(\d+\))", re.IGNORECASE),
        "severity": "HIGH",
        "description": "SQL Injection attempt detected via statement chaining or boolean injection"
    },
    {
        "id": "WAF-941100",
        "type": "CROSS_SITE_SCRIPTING",
        "pattern": re.compile(r"(<\s*script[^>]*>|javascript\s*:|on(load|error|click|mouseover|submit)\s*=|<\s*img[^>]+src=[^>]*onerror\s*=|<\s*iframe[^>]*>)", re.IGNORECASE),
        "severity": "HIGH",
        "description": "Cross-Site Scripting (XSS) payload detected in request parameters or body"
    },
    {
        "id": "WAF-930100",
        "type": "PATH_TRAVERSAL",
        "pattern": re.compile(r"(\.\.\/|\.\.\\|\/etc\/passwd|c:\\windows\\system32|win\.ini|boot\.ini)", re.IGNORECASE),
        "severity": "CRITICAL",
        "description": "Directory / Path Traversal attempt targeting sensitive local operating system files"
    },
    {
        "id": "WAF-932100",
        "type": "COMMAND_INJECTION",
        "pattern": re.compile(r"(\||;|&&|\$\()\s*(cat|whoami|id|ls|dir|net\s+user|powershell|bash|sh|cmd|curl|wget)\b", re.IGNORECASE),
        "severity": "CRITICAL",
        "description": "Operating System command execution chaining detected"
    }
]

def scan_waf_payload(payload_str: str) -> Optional[Dict[str, Any]]:
    if not payload_str:
        return None
    for sig in WAF_SIGNATURES:
        match = sig["pattern"].search(payload_str)
        if match:
            return {
                "rule_id": sig["id"],
                "attack_type": sig["type"],
                "severity": sig["severity"],
                "description": sig["description"],
                "matched_sample": match.group(0)[:120]
            }
    return None

@router.post("/inspect")
def inspect_waf_request(req: WAFInspectRequest, db: Session = Depends(get_db)):
    # Combine query params, headers, and body for inspection
    search_targets = []
    search_targets.append(req.path)
    if req.query_params:
        for k, v in req.query_params.items():
            search_targets.append(f"{k}={v}")
    if req.body:
        search_targets.append(req.body)

    combined_text = " \n ".join(search_targets)
    match_result = scan_waf_payload(combined_text)

    if match_result:
        # Record WAF Event
        waf_ev = WAFEvent(
            tenant_id=req.tenant_id,
            application=req.application,
            attack_type=match_result["attack_type"],
            severity=match_result["severity"],
            action="BLOCK",
            matched_payload=match_result["matched_sample"],
            source_ip=req.source_ip,
            rule_id=match_result["rule_id"]
        )
        db.add(waf_ev)

        # Log Central Security Event
        sec_event = SecurityEvent(
            tenant_id=req.tenant_id,
            event_type="WAF_BLOCK",
            severity=match_result["severity"],
            source_ip=req.source_ip,
            application=req.application,
            reason=f"WAF blocked {match_result['attack_type']} (Rule: {match_result['rule_id']})",
            risk_score=85
        )
        db.add(sec_event)
        db.commit()

        return {
            "action": "BLOCK",
            "blocked": True,
            "status_code": 403,
            "rule_id": match_result["rule_id"],
            "attack_type": match_result["attack_type"],
            "severity": match_result["severity"],
            "matched_sample": match_result["matched_sample"],
            "description": match_result["description"]
        }

    return {
        "action": "ALLOW",
        "blocked": False,
        "status_code": 200,
        "message": "Request passed WAF and API security inspection"
    }

@router.get("/events")
def list_waf_events(tenant_id: str = "tenant-enterprise-01", limit: int = 50, db: Session = Depends(get_db)):
    return db.query(WAFEvent).filter(WAFEvent.tenant_id == tenant_id).order_by(WAFEvent.timestamp.desc()).limit(limit).all()

@router.get("/rules")
def list_waf_rules():
    return [
        {
            "id": sig["id"],
            "type": sig["type"],
            "severity": sig["severity"],
            "description": sig["description"],
            "status": "ENFORCED"
        }
        for sig in WAF_SIGNATURES
    ]
