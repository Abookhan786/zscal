from typing import List, Dict, Any, Optional
from datetime import datetime, timezone, timedelta
from pydantic import BaseModel
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from database.connection import get_db
from database.models import ExperienceMetric, SecurityEvent, Alert

router = APIRouter(prefix="/api/v1/experience", tags=["Digital Experience Monitoring (DEM)"])

class SimulateDegradationRequest(BaseModel):
    application_name: str = "Git Server"
    http_latency_ms: float = 900.0
    packet_loss_percent: float = 4.5
    tenant_id: Optional[str] = "tenant-enterprise-01"

@router.get("/metrics")
def get_experience_metrics(tenant_id: str = "tenant-enterprise-01", db: Session = Depends(get_db)):
    metrics = db.query(ExperienceMetric).filter(ExperienceMetric.tenant_id == tenant_id).order_by(ExperienceMetric.timestamp.desc()).all()
    # Deduplicate to latest per application
    latest = {}
    for m in metrics:
        if m.application_name not in latest:
            latest[m.application_name] = m
    return list(latest.values())

@router.get("/history/{app_name}")
def get_app_experience_history(app_name: str, tenant_id: str = "tenant-enterprise-01", db: Session = Depends(get_db)):
    return db.query(ExperienceMetric).filter(
        ExperienceMetric.tenant_id == tenant_id,
        ExperienceMetric.application_name == app_name
    ).order_by(ExperienceMetric.timestamp.asc()).limit(30).all()

@router.post("/simulate-spike")
def simulate_experience_spike(req: SimulateDegradationRequest, db: Session = Depends(get_db)):
    dns_ms = 14.0
    tcp_ms = 22.0
    tls_ms = 35.0
    http_ms = req.http_latency_ms
    total_ms = dns_ms + tcp_ms + tls_ms + http_ms
    status_label = "DEGRADED" if total_ms > 400 else "OPTIMAL"

    metric = ExperienceMetric(
        tenant_id=req.tenant_id,
        application_name=req.application_name,
        dns_ms=dns_ms,
        tcp_ms=tcp_ms,
        tls_ms=tls_ms,
        http_ms=http_ms,
        total_ms=total_ms,
        packet_loss_percent=req.packet_loss_percent,
        availability_percent=94.2 if status_label == "DEGRADED" else 99.9,
        status=status_label,
        timestamp=datetime.now(timezone.utc)
    )
    db.add(metric)

    if status_label == "DEGRADED":
        # Create Central Alert & Event for Step 7 of the narrative
        sec_ev = SecurityEvent(
            tenant_id=req.tenant_id,
            event_type="LATENCY_ALERT",
            severity="MEDIUM",
            application=req.application_name,
            reason=f"Digital Experience anomaly: {req.application_name} HTTP TTFB jumped to {http_ms:.1f}ms (threshold 500ms). Status DEGRADED.",
            risk_score=45
        )
        db.add(sec_ev)

        alert = Alert(
            tenant_id=req.tenant_id,
            title=f"Performance Degradation: {req.application_name}",
            description=f"Synthetic probe measured total latency {total_ms:.1f}ms (HTTP response {http_ms:.1f}ms). Network path experiencing packet loss {req.packet_loss_percent}%.",
            severity="MEDIUM",
            status="OPEN",
            source="DEM_SYNTHETIC_PROBES",
            affected_entity=req.application_name
        )
        db.add(alert)

    db.commit()
    db.refresh(metric)
    return {
        "status": "spike_recorded",
        "metric": metric,
        "alert_created": status_label == "DEGRADED"
    }

@router.post("/reset-metrics")
def reset_experience_metrics(tenant_id: str = "tenant-enterprise-01", db: Session = Depends(get_db)):
    apps = ["Git Server", "Finance Application", "HR Application", "Internal Admin API"]
    for a in apps:
        m = ExperienceMetric(
            tenant_id=tenant_id,
            application_name=a,
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
        db.add(m)
    db.commit()
    return {"status": "metrics_reset_to_baseline"}
