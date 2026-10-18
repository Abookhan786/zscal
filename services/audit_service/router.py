from typing import List, Dict, Any, Optional
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from database.connection import get_db
from database.models import AuditLog

router = APIRouter(prefix="/api/v1/audit", tags=["Audit & Governance"])

@router.get("/logs")
def list_audit_logs(tenant_id: str = "tenant-enterprise-01", limit: int = 100, db: Session = Depends(get_db)):
    return db.query(AuditLog).filter(
        AuditLog.tenant_id == tenant_id
    ).order_by(AuditLog.timestamp.desc()).limit(limit).all()
