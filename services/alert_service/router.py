from typing import List, Dict, Any, Optional
from datetime import datetime, timezone
import uuid
from pydantic import BaseModel
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from database.connection import get_db
from database.models import Alert

router = APIRouter(prefix="/api/v1/alerts", tags=["Security Alert Engine"])

class AlertUpdateRequest(BaseModel):
    status: str  # OPEN, ACKNOWLEDGED, RESOLVED, DISMISSED

@router.get("/")
def list_alerts(tenant_id: str = "tenant-enterprise-01", db: Session = Depends(get_db)):
    return db.query(Alert).filter(Alert.tenant_id == tenant_id).order_by(Alert.created_at.desc()).all()

@router.patch("/{alert_id}")
def update_alert(alert_id: str, req: AlertUpdateRequest, db: Session = Depends(get_db)):
    alert = db.query(Alert).filter(Alert.id == alert_id).first()
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")
    alert.status = req.status
    db.commit()
    db.refresh(alert)
    return alert
