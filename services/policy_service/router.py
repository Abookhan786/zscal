from typing import List, Dict, Any, Optional
from datetime import datetime, timezone
from pydantic import BaseModel
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from database.connection import get_db
from database.models import Policy, PolicyVersion, AuditLog
from services.policy_service.evaluator import evaluate_policies

router = APIRouter(prefix="/api/v1/policies", tags=["Zero Trust Policy Engine"])

class PolicyCreateRequest(BaseModel):
    name: str
    description: Optional[str] = None
    priority: int = 100
    action: str = "ALLOW"
    status: str = "ACTIVE"
    conditions: Dict[str, Any]
    tenant_id: Optional[str] = "tenant-enterprise-01"
    created_by: Optional[str] = "admin@zerotrustx.internal"

class PolicyUpdateRequest(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    priority: Optional[int] = None
    action: Optional[str] = None
    status: Optional[str] = None
    conditions: Optional[Dict[str, Any]] = None
    change_reason: Optional[str] = "Policy criteria updated"

class SimulationRequest(BaseModel):
    user: Dict[str, Any]
    device: Dict[str, Any]
    application: Dict[str, Any]
    risk: Optional[Dict[str, Any]] = {"score": 15}
    tenant_id: Optional[str] = "tenant-enterprise-01"

@router.get("/")
def list_policies(tenant_id: str = "tenant-enterprise-01", db: Session = Depends(get_db)):
    return db.query(Policy).filter(Policy.tenant_id == tenant_id).order_by(Policy.priority.asc()).all()

@router.get("/{policy_id}")
def get_policy(policy_id: str, db: Session = Depends(get_db)):
    p = db.query(Policy).filter(Policy.id == policy_id).first()
    if not p:
        raise HTTPException(status_code=404, detail="Policy not found")
    return p

@router.post("/", status_code=status.HTTP_201_CREATED)
def create_policy(req: PolicyCreateRequest, db: Session = Depends(get_db)):
    policy = Policy(
        tenant_id=req.tenant_id,
        name=req.name,
        description=req.description,
        priority=req.priority,
        action=req.action,
        status=req.status,
        version=1,
        conditions=req.conditions,
        created_by=req.created_by
    )
    db.add(policy)
    db.commit()
    db.refresh(policy)

    # Record version
    pv = PolicyVersion(
        policy_id=policy.id,
        version_number=1,
        definition=req.conditions,
        change_reason="Initial creation",
        author=req.created_by
    )
    db.add(pv)

    # Audit log
    audit = AuditLog(
        tenant_id=req.tenant_id,
        actor=req.created_by,
        action="POLICY_CREATED",
        resource=f"policies/{policy.id}",
        before_state={},
        after_state={"name": policy.name, "priority": policy.priority, "action": policy.action}
    )
    db.add(audit)
    db.commit()

    return policy

@router.put("/{policy_id}")
def update_policy(policy_id: str, req: PolicyUpdateRequest, db: Session = Depends(get_db)):
    policy = db.query(Policy).filter(Policy.id == policy_id).first()
    if not policy:
        raise HTTPException(status_code=404, detail="Policy not found")

    before_state = {
        "name": policy.name,
        "priority": policy.priority,
        "action": policy.action,
        "conditions": policy.conditions,
        "version": policy.version
    }

    if req.name is not None:
        policy.name = req.name
    if req.description is not None:
        policy.description = req.description
    if req.priority is not None:
        policy.priority = req.priority
    if req.action is not None:
        policy.action = req.action
    if req.status is not None:
        policy.status = req.status
    if req.conditions is not None:
        policy.conditions = req.conditions

    policy.version += 1
    policy.updated_at = datetime.now(timezone.utc)

    # Save new version history
    pv = PolicyVersion(
        policy_id=policy.id,
        version_number=policy.version,
        definition=policy.conditions,
        change_reason=req.change_reason,
        author="admin@zerotrustx.internal"
    )
    db.add(pv)

    # Audit log
    audit = AuditLog(
        tenant_id=policy.tenant_id,
        actor="admin@zerotrustx.internal",
        action="POLICY_UPDATED",
        resource=f"policies/{policy.id}",
        before_state=before_state,
        after_state={"name": policy.name, "priority": policy.priority, "action": policy.action, "conditions": policy.conditions}
    )
    db.add(audit)
    db.commit()
    db.refresh(policy)
    return policy

@router.delete("/{policy_id}")
def delete_policy(policy_id: str, db: Session = Depends(get_db)):
    policy = db.query(Policy).filter(Policy.id == policy_id).first()
    if not policy:
        raise HTTPException(status_code=404, detail="Policy not found")
    
    # Audit log
    audit = AuditLog(
        tenant_id=policy.tenant_id,
        actor="admin@zerotrustx.internal",
        action="POLICY_DELETED",
        resource=f"policies/{policy.id}",
        before_state={"name": policy.name}
    )
    db.add(audit)
    db.delete(policy)
    db.commit()
    return {"status": "deleted", "policy_id": policy_id}

@router.get("/{policy_id}/versions")
def get_policy_versions(policy_id: str, db: Session = Depends(get_db)):
    versions = db.query(PolicyVersion).filter(PolicyVersion.policy_id == policy_id).order_by(PolicyVersion.version_number.desc()).all()
    return versions

@router.post("/simulate")
def simulate_policy_decision(req: SimulationRequest, db: Session = Depends(get_db)):
    policies = db.query(Policy).filter(Policy.tenant_id == req.tenant_id).order_by(Policy.priority.asc()).all()
    context = {
        "user": req.user,
        "device": req.device,
        "application": req.application,
        "risk": req.risk or {"score": 15}
    }
    result = evaluate_policies(policies, context)
    return result.to_dict()
