from typing import List, Optional
from pydantic import BaseModel
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from database.connection import get_db
from database.models import Tenant

router = APIRouter(prefix="/api/v1/tenants", tags=["Multi-Tenant Management"])

class TenantCreateRequest(BaseModel):
    name: str
    domain: str

@router.get("/")
def list_tenants(db: Session = Depends(get_db)):
    return db.query(Tenant).all()

@router.post("/")
def create_tenant(req: TenantCreateRequest, db: Session = Depends(get_db)):
    existing = db.query(Tenant).filter(Tenant.domain == req.domain).first()
    if existing:
        raise HTTPException(status_code=400, detail="Tenant with this domain already exists")
    t = Tenant(name=req.name, domain=req.domain, is_active=True)
    db.add(t)
    db.commit()
    db.refresh(t)
    return t
