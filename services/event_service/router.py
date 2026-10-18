import asyncio
import json
from typing import List, Dict, Any, Optional
from datetime import datetime, timezone
import uuid
from pydantic import BaseModel
from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

from database.connection import get_db, SessionLocal
from database.models import SecurityEvent, Alert, Incident, IncidentEvidence

router = APIRouter(prefix="/api/v1/events", tags=["Security Event Pipeline & SIEM"])

# In-memory pub/sub subscribers for live SSE events
SUBSCRIBERS = set()

async def broadcast_event(event_dict: dict):
    for queue in list(SUBSCRIBERS):
        try:
            await queue.put(event_dict)
        except Exception:
            pass

class IngestEventRequest(BaseModel):
    event_type: str
    severity: str = "INFO"
    user_id: Optional[str] = None
    username: Optional[str] = None
    device_id: Optional[str] = None
    source_ip: Optional[str] = "10.100.4.12"
    application: Optional[str] = None
    reason: Optional[str] = None
    risk_score: Optional[int] = 0
    raw_payload: Optional[Dict[str, Any]] = None
    tenant_id: Optional[str] = "tenant-enterprise-01"

@router.get("/")
def list_events(tenant_id: str = "tenant-enterprise-01", limit: int = 100, db: Session = Depends(get_db)):
    events = db.query(SecurityEvent).filter(
        SecurityEvent.tenant_id == tenant_id
    ).order_by(SecurityEvent.timestamp.desc()).limit(limit).all()
    return events

@router.post("/ingest")
async def ingest_event(req: IngestEventRequest, db: Session = Depends(get_db)):
    ev = SecurityEvent(
        tenant_id=req.tenant_id,
        event_type=req.event_type,
        severity=req.severity,
        user_id=req.user_id,
        username=req.username,
        device_id=req.device_id,
        source_ip=req.source_ip,
        application=req.application,
        reason=req.reason,
        risk_score=req.risk_score,
        raw_payload=req.raw_payload or {}
    )
    db.add(ev)
    db.commit()
    db.refresh(ev)

    # Correlate threat signals
    ev_dict = {
        "id": ev.id,
        "event_type": ev.event_type,
        "severity": ev.severity,
        "username": ev.username,
        "application": ev.application,
        "reason": ev.reason,
        "risk_score": ev.risk_score,
        "source_ip": ev.source_ip,
        "timestamp": ev.timestamp.isoformat()
    }
    await broadcast_event(ev_dict)

    # Check threat correlation rules
    if req.event_type in ["ACCESS_DENIED", "DLP_DETECTION", "WAF_BLOCK"] and req.risk_score and req.risk_score >= 80:
        alert = Alert(
            tenant_id=req.tenant_id,
            title=f"Critical Threat Correlated: {req.event_type} on {req.application or 'Private Network'}",
            description=f"Correlated anomaly: Entity {req.username or req.source_ip} triggered {req.reason} with elevated risk {req.risk_score}.",
            severity="CRITICAL",
            status="OPEN",
            source="THREAT_CORRELATION_ENGINE",
            affected_entity=req.username or req.source_ip,
            correlated_event_count=3
        )
        db.add(alert)
        db.commit()

    return {"status": "ingested", "event_id": ev.id}

@router.get("/stream")
async def stream_events(request: Request):
    queue = asyncio.Queue()
    SUBSCRIBERS.add(queue)

    async def event_generator():
        try:
            # Yield initial connection heartbeat
            yield f"data: {json.dumps({'event_type': 'CONNECTED', 'message': 'ZeroTrustX Security Event Bus Stream Connected'})}\n\n"
            while True:
                if await request.is_disconnected():
                    break
                try:
                    event = await asyncio.wait_for(queue.get(), timeout=15.0)
                    yield f"data: {json.dumps(event)}\n\n"
                except asyncio.TimeoutError:
                    # Keepalive ping
                    yield f": keepalive {datetime.now(timezone.utc).isoformat()}\n\n"
        finally:
            SUBSCRIBERS.discard(queue)

    return StreamingResponse(event_generator(), media_type="text/event-stream")
