from typing import List, Dict, Any, Optional
from datetime import datetime, timezone
from urllib.parse import urlparse
from pydantic import BaseModel
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from database.connection import get_db
from database.models import WebRequest, DNSRequest, SecurityEvent

router = APIRouter(prefix="/api/v1/web-security", tags=["Secure Web Gateway & DNS"])

class WebInspectionRequest(BaseModel):
    url: str
    user_id: Optional[str] = None
    username: Optional[str] = "alice"
    device_id: Optional[str] = "dev-alice-laptop"
    source_ip: Optional[str] = "10.100.4.12"
    tenant_id: Optional[str] = "tenant-enterprise-01"

class DNSInspectionRequest(BaseModel):
    domain: str
    record_type: str = "A"
    username: Optional[str] = "alice"
    tenant_id: Optional[str] = "tenant-enterprise-01"

# Domain threat intelligence database
DOMAIN_DATABASE = {
    "malware.test": {"category": "Malicious / Malware", "decision": "BLOCK", "reputation": 5, "threat": "Trojan-Dropper"},
    "phishing.test": {"category": "Credential Phishing", "decision": "BLOCK", "reputation": 2, "threat": "Spearphishing"},
    "c2-botnet.xyz": {"category": "Command & Control", "decision": "BLOCK", "reputation": 0, "threat": "C2 Server"},
    "crypto-drainer.cc": {"category": "Cryptomining / Malicious", "decision": "BLOCK", "reputation": 10, "threat": "Wallet Drainer"},
    "unknown-risk.test": {"category": "Uncategorized / Suspicious", "decision": "WARN", "reputation": 45, "threat": "Newly Registered Domain"},
    "github.com": {"category": "Developer Tools", "decision": "ALLOW", "reputation": 99, "threat": None},
    "gitlab.com": {"category": "Developer Tools", "decision": "ALLOW", "reputation": 98, "threat": None},
    "stackoverflow.com": {"category": "Technology Reference", "decision": "ALLOW", "reputation": 98, "threat": None},
    "aws.amazon.com": {"category": "Cloud Infrastructure", "decision": "ALLOW", "reputation": 99, "threat": None},
    "google.com": {"category": "Search Engines", "decision": "ALLOW", "reputation": 100, "threat": None},
    "microsoft.com": {"category": "Business Collaboration", "decision": "ALLOW", "reputation": 100, "threat": None}
}

def inspect_domain(domain_str: str) -> Dict[str, Any]:
    clean_domain = domain_str.lower().strip()
    if clean_domain.startswith("www."):
        clean_domain = clean_domain[4:]

    # Direct match or subdomain
    for threat_dom, data in DOMAIN_DATABASE.items():
        if clean_domain == threat_dom or clean_domain.endswith("." + threat_dom):
            return data

    # Default category for other safe domains
    return {
        "category": "General Web / Safe",
        "decision": "ALLOW",
        "reputation": 90,
        "threat": None
    }

@router.post("/inspect-url")
def inspect_url(req: WebInspectionRequest, db: Session = Depends(get_db)):
    parsed = urlparse(req.url if "://" in req.url else f"https://{req.url}")
    domain = parsed.netloc or parsed.path

    analysis = inspect_domain(domain)

    # Record web request log
    log = WebRequest(
        tenant_id=req.tenant_id,
        user_id=req.user_id,
        url=req.url,
        domain=domain,
        category=analysis["category"],
        decision=analysis["decision"],
        reputation_score=analysis["reputation"],
        threat_type=analysis["threat"],
        source_ip=req.source_ip
    )
    db.add(log)

    if analysis["decision"] == "BLOCK":
        sec_event = SecurityEvent(
            tenant_id=req.tenant_id,
            event_type="MALICIOUS_DOMAIN",
            severity="HIGH",
            user_id=req.user_id,
            username=req.username,
            device_id=req.device_id,
            source_ip=req.source_ip,
            reason=f"Web Gateway intercepted and blocked {domain} classified as {analysis['category']}",
            risk_score=75
        )
        db.add(sec_event)

    db.commit()

    return {
        "url": req.url,
        "domain": domain,
        "decision": analysis["decision"],
        "category": analysis["category"],
        "reputation_score": analysis["reputation"],
        "threat_type": analysis["threat"],
        "action": "CONNECTION_BLOCKED" if analysis["decision"] == "BLOCK" else "CONNECTION_ALLOWED"
    }

@router.post("/dns-query")
def inspect_dns(req: DNSInspectionRequest, db: Session = Depends(get_db)):
    analysis = inspect_domain(req.domain)

    resolved_ip = "192.0.2.1" if analysis["decision"] == "ALLOW" else "0.0.0.0"

    dns_log = DNSRequest(
        tenant_id=req.tenant_id,
        domain=req.domain,
        record_type=req.record_type,
        category=analysis["category"],
        decision=analysis["decision"],
        resolved_ip=resolved_ip,
        user=req.username
    )
    db.add(dns_log)

    if analysis["decision"] == "BLOCK":
        sec_event = SecurityEvent(
            tenant_id=req.tenant_id,
            event_type="DNS_THREAT_BLOCKED",
            severity="HIGH",
            username=req.username,
            reason=f"DNS sinkhole applied to malicious domain {req.domain} ({analysis['category']})"
        )
        db.add(sec_event)

    db.commit()

    return {
        "domain": req.domain,
        "record_type": req.record_type,
        "decision": analysis["decision"],
        "category": analysis["category"],
        "resolved_ip": resolved_ip,
        "sinkhole": analysis["decision"] == "BLOCK"
    }

@router.get("/logs")
def list_web_logs(tenant_id: str = "tenant-enterprise-01", limit: int = 50, db: Session = Depends(get_db)):
    return db.query(WebRequest).filter(WebRequest.tenant_id == tenant_id).order_by(WebRequest.timestamp.desc()).limit(limit).all()

@router.get("/dns-logs")
def list_dns_logs(tenant_id: str = "tenant-enterprise-01", limit: int = 50, db: Session = Depends(get_db)):
    return db.query(DNSRequest).filter(DNSRequest.tenant_id == tenant_id).order_by(DNSRequest.timestamp.desc()).limit(limit).all()
