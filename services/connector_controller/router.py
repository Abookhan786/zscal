from typing import List, Dict, Any, Optional
from datetime import datetime, timezone
import uuid
from pydantic import BaseModel
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from database.connection import get_db
from database.models import Connector, ConnectorGroup, SecurityEvent

router = APIRouter(prefix="/api/v1/connectors", tags=["App Connector Controller"])

class ConnectorHeartbeatRequest(BaseModel):
    connector_id: str
    cpu_usage: float
    memory_usage: float
    latency_ms: float
    active_sessions: int
    status: Optional[str] = "ONLINE"

class ConnectorEnrollmentRequest(BaseModel):
    name: str
    region: str = "Chennai-DC"
    group_id: Optional[str] = None
    tenant_id: Optional[str] = "tenant-enterprise-01"

@router.get("/")
def list_connectors(tenant_id: str = "tenant-enterprise-01", db: Session = Depends(get_db)):
    return db.query(Connector).filter(Connector.tenant_id == tenant_id).all()

@router.get("/groups")
def list_connector_groups(tenant_id: str = "tenant-enterprise-01", db: Session = Depends(get_db)):
    return db.query(ConnectorGroup).filter(ConnectorGroup.tenant_id == tenant_id).all()

@router.post("/enroll")
def enroll_connector(req: ConnectorEnrollmentRequest, db: Session = Depends(get_db)):
    token = f"ztx-enroll-{uuid.uuid4().hex[:16]}"
    conn = Connector(
        tenant_id=req.tenant_id,
        name=req.name,
        region=req.region,
        group_id=req.group_id,
        status="ONLINE",
        enrollment_token=token,
        ip_address=f"10.200.1.{len(db.query(Connector).all()) + 10}"
    )
    db.add(conn)
    db.commit()
    db.refresh(conn)
    return {
        "status": "enrolled",
        "connector": conn,
        "mTLS_certificate": f"-----BEGIN CERTIFICATE-----\nMIIDXTCCAkWgAwIBAgIU{uuid.uuid4().hex}...\n-----END CERTIFICATE-----"
    }

@router.post("/heartbeat")
def connector_heartbeat(req: ConnectorHeartbeatRequest, db: Session = Depends(get_db)):
    conn = db.query(Connector).filter(Connector.id == req.connector_id).first()
    if not conn:
        raise HTTPException(status_code=404, detail="Connector not found")

    old_status = conn.status
    conn.cpu_usage = req.cpu_usage
    conn.memory_usage = req.memory_usage
    conn.latency_ms = req.latency_ms
    conn.active_sessions = req.active_sessions
    conn.status = req.status or "ONLINE"
    conn.last_heartbeat_at = datetime.now(timezone.utc)

    if old_status == "ONLINE" and conn.status == "OFFLINE":
        event = SecurityEvent(
            tenant_id=conn.tenant_id,
            event_type="CONNECTOR_FAILURE",
            severity="HIGH",
            reason=f"App Connector {conn.name} missed heartbeats or went OFFLINE. Triggering failover to healthy cluster node.",
            source_ip=conn.ip_address
        )
        db.add(event)

    db.commit()
    return {"status": "heartbeat_acknowledged", "connector_status": conn.status}

@router.post("/{connector_id}/simulate-failure")
def simulate_connector_failure(connector_id: str, db: Session = Depends(get_db)):
    conn = db.query(Connector).filter(Connector.id == connector_id).first()
    if not conn:
        raise HTTPException(status_code=404, detail="Connector not found")

    conn.status = "OFFLINE"
    event = SecurityEvent(
        tenant_id=conn.tenant_id,
        event_type="CONNECTOR_FAILURE",
        severity="HIGH",
        reason=f"Manual fault injection: Connector {conn.name} is OFFLINE. Failover rerouting active.",
        source_ip=conn.ip_address
    )
    db.add(event)
    db.commit()
    return {"status": "connector_offline", "connector": conn}
