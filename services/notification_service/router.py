from typing import List, Dict, Any, Optional
from datetime import datetime, timezone
from pydantic import BaseModel
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from database.connection import get_db
from database.models import Notification

router = APIRouter(prefix="/api/v1/notifications", tags=["Notification Engine"])

class SendNotificationRequest(BaseModel):
    channel: str = "SLACK"  # SLACK, WEBHOOK, EMAIL
    target: str = "#soc-incident-channel"
    title: str
    message: str
    tenant_id: Optional[str] = "tenant-enterprise-01"

@router.get("/")
def list_notifications(tenant_id: str = "tenant-enterprise-01", db: Session = Depends(get_db)):
    return db.query(Notification).filter(Notification.tenant_id == tenant_id).order_by(Notification.sent_at.desc()).all()

@router.post("/send")
def send_notification(req: SendNotificationRequest, db: Session = Depends(get_db)):
    notif = Notification(
        tenant_id=req.tenant_id,
        channel=req.channel,
        target=req.target,
        title=req.title,
        message=req.message,
        status="DELIVERED"
    )
    db.add(notif)
    db.commit()
    db.refresh(notif)
    return {
        "status": "delivered",
        "channel": req.channel,
        "notification_id": notif.id
    }
