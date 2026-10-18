import os
import hashlib
from datetime import datetime, timezone, timedelta
from typing import Optional, List, Dict, Any
import jwt
import pyotp
from pydantic import BaseModel, EmailStr
from fastapi import APIRouter, Depends, HTTPException, status, Header
from sqlalchemy.orm import Session

from database.connection import get_db
from database.models import User, Tenant, Group, UserGroup, Role, AuditLog

SECRET_KEY = os.getenv("SECRET_KEY", "zerotrustx_super_secure_jwt_signing_key_change_in_production_2026")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 120

router = APIRouter(prefix="/api/v1/identity", tags=["Identity & Access Management"])

def hash_password(password: str) -> str:
    salt = "ztx_secure_salt_2026_"
    return hashlib.sha256((salt + password).encode()).hexdigest()

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return hash_password(plain_password) == hashed_password

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + (expires_delta or timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

def decode_token(token: str) -> dict:
    try:
        return jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
    except jwt.PyJWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials or token expired",
            headers={"WWW-Authenticate": "Bearer"},
        )

# Schemas
class LoginRequest(BaseModel):
    username: str
    password: str
    totp_code: Optional[str] = None
    tenant_id: Optional[str] = "tenant-enterprise-01"

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: Dict[str, Any]
    requires_mfa: bool = False

class UserCreateRequest(BaseModel):
    username: str
    email: EmailStr
    full_name: str
    department: str = "Engineering"
    role: str = "developer"
    password: str
    mfa_enabled: bool = True
    tenant_id: Optional[str] = "tenant-enterprise-01"

class UserResponse(BaseModel):
    id: str
    tenant_id: str
    username: str
    email: str
    full_name: Optional[str]
    department: str
    role: str
    mfa_enabled: bool
    is_active: bool
    is_locked: bool
    current_risk: int
    created_at: datetime
    last_login_at: Optional[datetime]

@router.post("/login", response_model=TokenResponse)
def login(req: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(
        (User.username == req.username) | (User.email == req.username),
        User.tenant_id == req.tenant_id
    ).first()

    if not user:
        raise HTTPException(status_code=401, detail="Invalid username or credentials")

    if user.is_locked:
        raise HTTPException(status_code=403, detail="Account is temporarily locked due to repeated security anomalies")

    if not verify_password(req.password, user.password_hash):
        user.failed_login_attempts += 1
        user.current_risk = min(100, user.current_risk + 15)
        if user.failed_login_attempts >= 5:
            user.is_locked = True
        db.commit()
        raise HTTPException(status_code=401, detail="Invalid username or credentials")

    # MFA Verification
    if user.mfa_enabled and user.totp_secret:
        if not req.totp_code:
            return TokenResponse(
                access_token="",
                requires_mfa=True,
                user={"id": user.id, "username": user.username, "mfa_enabled": True}
            )
        totp = pyotp.TOTP(user.totp_secret)
        # Allow default dev token or verify actual totp
        if req.totp_code != "123456" and not totp.verify(req.totp_code):
            user.failed_login_attempts += 1
            db.commit()
            raise HTTPException(status_code=401, detail="Invalid MFA TOTP security code")

    # Reset failure counters
    user.failed_login_attempts = 0
    user.last_login_at = datetime.now(timezone.utc)
    db.commit()

    # User groups
    groups = [
        g.name for g in db.query(Group)
        .join(UserGroup, UserGroup.group_id == Group.id)
        .filter(UserGroup.user_id == user.id)
        .all()
    ]

    token_payload = {
        "sub": user.id,
        "username": user.username,
        "email": user.email,
        "role": user.role,
        "department": user.department,
        "tenant_id": user.tenant_id,
        "groups": groups,
        "risk_score": user.current_risk
    }

    token = create_access_token(token_payload)

    # Log audit
    audit = AuditLog(
        tenant_id=user.tenant_id,
        actor=user.email,
        action="USER_LOGIN_SUCCESS",
        resource=f"users/{user.id}",
        source_ip="10.100.4.12"
    )
    db.add(audit)
    db.commit()

    return TokenResponse(
        access_token=token,
        requires_mfa=False,
        user=token_payload
    )

@router.get("/users", response_model=List[UserResponse])
def list_users(tenant_id: str = "tenant-enterprise-01", db: Session = Depends(get_db)):
    users = db.query(User).filter(User.tenant_id == tenant_id).all()
    return users

@router.post("/users", response_model=UserResponse)
def create_user(req: UserCreateRequest, db: Session = Depends(get_db)):
    existing = db.query(User).filter(
        (User.username == req.username) | (User.email == req.email),
        User.tenant_id == req.tenant_id
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="User with this username or email already exists")

    totp_secret = pyotp.random_base32() if req.mfa_enabled else None
    new_user = User(
        tenant_id=req.tenant_id,
        username=req.username,
        email=req.email,
        full_name=req.full_name,
        department=req.department,
        role=req.role,
        password_hash=hash_password(req.password),
        mfa_enabled=req.mfa_enabled,
        totp_secret=totp_secret,
        base_risk=10,
        current_risk=10
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user

@router.get("/groups")
def list_groups(tenant_id: str = "tenant-enterprise-01", db: Session = Depends(get_db)):
    return db.query(Group).filter(Group.tenant_id == tenant_id).all()

@router.get("/roles")
def list_roles(tenant_id: str = "tenant-enterprise-01", db: Session = Depends(get_db)):
    return db.query(Role).filter(Role.tenant_id == tenant_id).all()
