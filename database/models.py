import uuid
from datetime import datetime, timezone
from sqlalchemy import (
    Column, String, Integer, Boolean, Float, Text, DateTime, ForeignKey, JSON
)
from sqlalchemy.orm import relationship
from database.connection import Base

def gen_uuid():
    return str(uuid.uuid4())

def utc_now():
    return datetime.now(timezone.utc)

class Tenant(Base):
    __tablename__ = "tenants"

    id = Column(String(64), primary_key=True, default=gen_uuid)
    name = Column(String(128), nullable=False)
    domain = Column(String(128), unique=True, nullable=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=utc_now)
    updated_at = Column(DateTime, default=utc_now, onupdate=utc_now)

class User(Base):
    __tablename__ = "users"

    id = Column(String(64), primary_key=True, default=gen_uuid)
    tenant_id = Column(String(64), ForeignKey("tenants.id"), nullable=False, index=True)
    username = Column(String(64), nullable=False)
    email = Column(String(128), nullable=False, index=True)
    full_name = Column(String(128), nullable=True)
    department = Column(String(64), default="Engineering")
    role = Column(String(64), default="developer")  # SUPER_ADMIN, TENANT_ADMIN, SECURITY_ADMIN, SECURITY_ANALYST, developer, etc.
    password_hash = Column(String(256), nullable=False)
    mfa_enabled = Column(Boolean, default=True)
    totp_secret = Column(String(64), nullable=True)
    is_active = Column(Boolean, default=True)
    is_locked = Column(Boolean, default=False)
    failed_login_attempts = Column(Integer, default=0)
    base_risk = Column(Integer, default=10)
    current_risk = Column(Integer, default=15)
    created_at = Column(DateTime, default=utc_now)
    last_login_at = Column(DateTime, nullable=True)

class Group(Base):
    __tablename__ = "groups"

    id = Column(String(64), primary_key=True, default=gen_uuid)
    tenant_id = Column(String(64), ForeignKey("tenants.id"), nullable=False, index=True)
    name = Column(String(64), nullable=False)
    description = Column(String(256), nullable=True)
    created_at = Column(DateTime, default=utc_now)

class UserGroup(Base):
    __tablename__ = "user_groups"

    id = Column(String(64), primary_key=True, default=gen_uuid)
    user_id = Column(String(64), ForeignKey("users.id"), nullable=False)
    group_id = Column(String(64), ForeignKey("groups.id"), nullable=False)

class Role(Base):
    __tablename__ = "roles"

    id = Column(String(64), primary_key=True, default=gen_uuid)
    tenant_id = Column(String(64), ForeignKey("tenants.id"), nullable=False)
    name = Column(String(64), nullable=False)
    description = Column(String(256), nullable=True)
    permissions = Column(JSON, default=list)

class Device(Base):
    __tablename__ = "devices"

    id = Column(String(64), primary_key=True, default=gen_uuid)
    tenant_id = Column(String(64), ForeignKey("tenants.id"), nullable=False, index=True)
    user_id = Column(String(64), ForeignKey("users.id"), nullable=True)
    device_name = Column(String(128), nullable=False)
    hostname = Column(String(128), nullable=True)
    os = Column(String(64), default="Linux")  # Linux, Windows, macOS
    os_version = Column(String(64), default="22.04 LTS")
    agent_version = Column(String(32), default="1.2.0")
    is_managed = Column(Boolean, default=True)
    compliance_status = Column(String(32), default="COMPLIANT") # COMPLIANT, DEGRADED, NON_COMPLIANT, UNKNOWN
    risk_score = Column(Integer, default=10)
    last_seen_at = Column(DateTime, default=utc_now)
    created_at = Column(DateTime, default=utc_now)

class DevicePosture(Base):
    __tablename__ = "device_postures"

    id = Column(String(64), primary_key=True, default=gen_uuid)
    device_id = Column(String(64), ForeignKey("devices.id"), nullable=False, unique=True)
    tenant_id = Column(String(64), ForeignKey("tenants.id"), nullable=False)
    firewall_enabled = Column(Boolean, default=True)
    antivirus_enabled = Column(Boolean, default=True)
    disk_encrypted = Column(Boolean, default=True)
    screen_lock_enabled = Column(Boolean, default=True)
    patches_up_to_date = Column(Boolean, default=True)
    certificate_valid = Column(Boolean, default=True)
    reported_ip = Column(String(64), default="10.100.4.12")
    raw_details = Column(JSON, default=dict)
    updated_at = Column(DateTime, default=utc_now, onupdate=utc_now)

class ApplicationGroup(Base):
    __tablename__ = "application_groups"

    id = Column(String(64), primary_key=True, default=gen_uuid)
    tenant_id = Column(String(64), ForeignKey("tenants.id"), nullable=False)
    name = Column(String(128), nullable=False)
    description = Column(String(256), nullable=True)

class Application(Base):
    __tablename__ = "applications"

    id = Column(String(64), primary_key=True, default=gen_uuid)
    tenant_id = Column(String(64), ForeignKey("tenants.id"), nullable=False, index=True)
    name = Column(String(128), nullable=False)
    domain = Column(String(128), nullable=False)  # git.internal, finance.internal, hr.internal, admin.internal
    port = Column(Integer, default=443)
    protocol = Column(String(16), default="HTTPS")
    sensitivity = Column(String(32), default="HIGH")  # LOW, MEDIUM, HIGH, CRITICAL
    status = Column(String(32), default="ONLINE")
    health = Column(String(32), default="HEALTHY")
    connector_group_id = Column(String(64), nullable=True)
    target_backend_url = Column(String(256), nullable=True)  # Internal URL simulated
    description = Column(String(256), nullable=True)
    created_at = Column(DateTime, default=utc_now)

class ApplicationSegment(Base):
    __tablename__ = "application_segments"

    id = Column(String(64), primary_key=True, default=gen_uuid)
    tenant_id = Column(String(64), ForeignKey("tenants.id"), nullable=False)
    name = Column(String(128), nullable=False)
    application_ids = Column(JSON, default=list)
    tcp_ports = Column(JSON, default=list)
    udp_ports = Column(JSON, default=list)
    segment_description = Column(String(256), nullable=True)

class ConnectorGroup(Base):
    __tablename__ = "connector_groups"

    id = Column(String(64), primary_key=True, default=gen_uuid)
    tenant_id = Column(String(64), ForeignKey("tenants.id"), nullable=False)
    name = Column(String(128), nullable=False)  # Chennai-DC, US-East-1, EU-Central
    region = Column(String(64), default="ap-south-1")
    description = Column(String(256), nullable=True)

class Connector(Base):
    __tablename__ = "connectors"

    id = Column(String(64), primary_key=True, default=gen_uuid)
    tenant_id = Column(String(64), ForeignKey("tenants.id"), nullable=False, index=True)
    group_id = Column(String(64), ForeignKey("connector_groups.id"), nullable=True)
    name = Column(String(128), nullable=False)
    status = Column(String(32), default="ONLINE")  # ENROLLING, ONLINE, DEGRADED, OFFLINE, QUARANTINED, DISABLED
    version = Column(String(32), default="2.4.1")
    ip_address = Column(String(64), default="10.200.1.15")
    region = Column(String(64), default="Chennai-DC")
    cpu_usage = Column(Float, default=18.4)
    memory_usage = Column(Float, default=42.1)
    latency_ms = Column(Float, default=12.5)
    active_sessions = Column(Integer, default=4)
    certificate_expiry = Column(DateTime, nullable=True)
    last_heartbeat_at = Column(DateTime, default=utc_now)
    enrollment_token = Column(String(128), nullable=True)
    created_at = Column(DateTime, default=utc_now)

class Policy(Base):
    __tablename__ = "policies"

    id = Column(String(64), primary_key=True, default=gen_uuid)
    tenant_id = Column(String(64), ForeignKey("tenants.id"), nullable=False, index=True)
    name = Column(String(128), nullable=False)
    description = Column(String(256), nullable=True)
    priority = Column(Integer, default=100)  # Lower number = higher priority
    action = Column(String(32), default="ALLOW")  # ALLOW, DENY, STEP_UP_MFA, REQUIRE_COMPLIANT_DEVICE, READ_ONLY
    status = Column(String(32), default="ACTIVE") # DRAFT, TESTING, APPROVED, ACTIVE, DEPRECATED
    version = Column(Integer, default=1)
    conditions = Column(JSON, default=dict)  # structured criteria for user, role, device, app, risk
    created_by = Column(String(128), default="admin@zerotrustx.internal")
    created_at = Column(DateTime, default=utc_now)
    updated_at = Column(DateTime, default=utc_now, onupdate=utc_now)

class PolicyCondition(Base):
    __tablename__ = "policy_conditions"

    id = Column(String(64), primary_key=True, default=gen_uuid)
    policy_id = Column(String(64), ForeignKey("policies.id"), nullable=False)
    field = Column(String(64), nullable=False)  # role, device.managed, risk.max, app.name
    operator = Column(String(32), default="EQUALS")  # EQUALS, NOT_EQUALS, IN, LESS_THAN, GREATER_THAN
    value = Column(String(128), nullable=False)

class PolicyVersion(Base):
    __tablename__ = "policy_versions"

    id = Column(String(64), primary_key=True, default=gen_uuid)
    policy_id = Column(String(64), ForeignKey("policies.id"), nullable=False)
    version_number = Column(Integer, nullable=False)
    definition = Column(JSON, nullable=False)
    change_reason = Column(String(256), nullable=True)
    author = Column(String(128), nullable=False)
    created_at = Column(DateTime, default=utc_now)

class AccessSession(Base):
    __tablename__ = "access_sessions"

    id = Column(String(64), primary_key=True, default=gen_uuid)
    tenant_id = Column(String(64), ForeignKey("tenants.id"), nullable=False)
    user_id = Column(String(64), ForeignKey("users.id"), nullable=False)
    device_id = Column(String(64), ForeignKey("devices.id"), nullable=False)
    application_id = Column(String(64), ForeignKey("applications.id"), nullable=False)
    connector_id = Column(String(64), ForeignKey("connectors.id"), nullable=True)
    status = Column(String(32), default="ACTIVE")  # ACTIVE, TERMINATED, EXPIRED, REVOKED
    source_ip = Column(String(64), default="10.100.4.12")
    risk_score_at_access = Column(Integer, default=12)
    policy_id = Column(String(64), nullable=True)
    bytes_transferred = Column(Integer, default=0)
    created_at = Column(DateTime, default=utc_now)
    expires_at = Column(DateTime, nullable=True)

class AccessDecision(Base):
    __tablename__ = "access_decisions"

    id = Column(String(64), primary_key=True, default=gen_uuid)
    tenant_id = Column(String(64), ForeignKey("tenants.id"), nullable=False)
    user_id = Column(String(64), nullable=False)
    username = Column(String(64), nullable=False)
    device_id = Column(String(64), nullable=False)
    application = Column(String(128), nullable=False)
    decision = Column(String(32), nullable=False)  # ALLOW, DENY, STEP_UP_MFA, etc.
    matched_policy = Column(String(128), nullable=True)
    risk_score = Column(Integer, default=0)
    reason = Column(Text, nullable=True)
    details = Column(JSON, default=dict)
    timestamp = Column(DateTime, default=utc_now)

class WebRequest(Base):
    __tablename__ = "web_requests"

    id = Column(String(64), primary_key=True, default=gen_uuid)
    tenant_id = Column(String(64), ForeignKey("tenants.id"), nullable=False)
    user_id = Column(String(64), nullable=True)
    url = Column(String(512), nullable=False)
    domain = Column(String(128), nullable=False)
    category = Column(String(64), default="General")
    decision = Column(String(32), default="ALLOW")  # ALLOW, BLOCK, WARN
    reputation_score = Column(Integer, default=95)
    threat_type = Column(String(64), nullable=True)
    source_ip = Column(String(64), default="127.0.0.1")
    timestamp = Column(DateTime, default=utc_now)

class DNSRequest(Base):
    __tablename__ = "dns_requests"

    id = Column(String(64), primary_key=True, default=gen_uuid)
    tenant_id = Column(String(64), ForeignKey("tenants.id"), nullable=False)
    domain = Column(String(128), nullable=False)
    record_type = Column(String(16), default="A")
    category = Column(String(64), default="Clean")
    decision = Column(String(32), default="ALLOW")
    resolved_ip = Column(String(64), nullable=True)
    user = Column(String(64), nullable=True)
    timestamp = Column(DateTime, default=utc_now)

class WAFEvent(Base):
    __tablename__ = "waf_events"

    id = Column(String(64), primary_key=True, default=gen_uuid)
    tenant_id = Column(String(64), ForeignKey("tenants.id"), nullable=False)
    application = Column(String(128), nullable=False)
    attack_type = Column(String(64), nullable=False)  # SQL_INJECTION, XSS, PATH_TRAVERSAL, COMMAND_INJECTION
    severity = Column(String(32), default="HIGH")
    action = Column(String(32), default="BLOCK")
    matched_payload = Column(Text, nullable=True)
    source_ip = Column(String(64), default="192.168.1.100")
    rule_id = Column(String(64), nullable=True)
    timestamp = Column(DateTime, default=utc_now)

class DLPEvent(Base):
    __tablename__ = "dlp_events"

    id = Column(String(64), primary_key=True, default=gen_uuid)
    tenant_id = Column(String(64), ForeignKey("tenants.id"), nullable=False)
    user_id = Column(String(64), nullable=True)
    username = Column(String(64), default="alice")
    file_name = Column(String(256), nullable=True)
    sensitivity_type = Column(String(64), nullable=False)  # CREDIT_CARD, SSN, API_KEY, PRIVATE_KEY, EMPLOYEE_DATA
    action = Column(String(32), default="BLOCK")  # ALLOW, BLOCK, REDACT, QUARANTINE, WARN
    severity = Column(String(32), default="HIGH")
    match_count = Column(Integer, default=1)
    redacted_preview = Column(Text, nullable=True)
    destination = Column(String(256), nullable=True)
    timestamp = Column(DateTime, default=utc_now)

class RiskEvent(Base):
    __tablename__ = "risk_events"

    id = Column(String(64), primary_key=True, default=gen_uuid)
    tenant_id = Column(String(64), ForeignKey("tenants.id"), nullable=False)
    entity_type = Column(String(32), default="USER")  # USER, DEVICE
    entity_id = Column(String(64), nullable=False)
    signal_name = Column(String(128), nullable=False)
    delta = Column(Integer, default=0)
    score_after = Column(Integer, default=0)
    details = Column(JSON, default=dict)
    timestamp = Column(DateTime, default=utc_now)

class RiskScore(Base):
    __tablename__ = "risk_scores"

    id = Column(String(64), primary_key=True, default=gen_uuid)
    tenant_id = Column(String(64), ForeignKey("tenants.id"), nullable=False)
    entity_type = Column(String(32), default="USER")
    entity_id = Column(String(64), nullable=False)
    score = Column(Integer, default=10)
    band = Column(String(32), default="LOW")  # LOW, MEDIUM, HIGH, CRITICAL
    factors = Column(JSON, default=list)
    updated_at = Column(DateTime, default=utc_now, onupdate=utc_now)

class SecurityEvent(Base):
    __tablename__ = "security_events"

    id = Column(String(64), primary_key=True, default=gen_uuid)
    tenant_id = Column(String(64), ForeignKey("tenants.id"), nullable=False, index=True)
    timestamp = Column(DateTime, default=utc_now, index=True)
    event_type = Column(String(64), nullable=False)  # AUTH_LOGIN, ACCESS_DENIED, DLP_DETECTION, WAF_BLOCK, etc.
    severity = Column(String(32), default="INFO")   # INFO, LOW, MEDIUM, HIGH, CRITICAL
    user_id = Column(String(64), nullable=True)
    username = Column(String(64), nullable=True)
    device_id = Column(String(64), nullable=True)
    source_ip = Column(String(64), default="10.100.4.12")
    application = Column(String(128), nullable=True)
    reason = Column(String(256), nullable=True)
    risk_score = Column(Integer, default=0)
    raw_payload = Column(JSON, default=dict)

class Alert(Base):
    __tablename__ = "alerts"

    id = Column(String(64), primary_key=True, default=gen_uuid)
    tenant_id = Column(String(64), ForeignKey("tenants.id"), nullable=False, index=True)
    title = Column(String(256), nullable=False)
    description = Column(Text, nullable=True)
    severity = Column(String(32), default="HIGH")  # LOW, MEDIUM, HIGH, CRITICAL
    status = Column(String(32), default="OPEN")    # OPEN, ACKNOWLEDGED, RESOLVED, DISMISSED
    source = Column(String(64), default="CORRELATION_ENGINE")
    affected_entity = Column(String(128), nullable=True)
    correlated_event_count = Column(Integer, default=1)
    created_at = Column(DateTime, default=utc_now)

class Incident(Base):
    __tablename__ = "incidents"

    id = Column(String(64), primary_key=True, default=gen_uuid)
    tenant_id = Column(String(64), ForeignKey("tenants.id"), nullable=False, index=True)
    incident_number = Column(String(32), unique=True, nullable=False)
    title = Column(String(256), nullable=False)
    severity = Column(String(32), default="HIGH")  # LOW, MEDIUM, HIGH, CRITICAL
    status = Column(String(32), default="OPEN")    # OPEN, INVESTIGATING, CONTAINED, RESOLVED, CLOSED, FALSE_POSITIVE
    assignee = Column(String(128), default="Security Analyst")
    affected_user = Column(String(128), nullable=True)
    affected_device = Column(String(128), nullable=True)
    affected_application = Column(String(128), nullable=True)
    summary = Column(Text, nullable=True)
    remediation_notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=utc_now)
    updated_at = Column(DateTime, default=utc_now, onupdate=utc_now)

class IncidentEvidence(Base):
    __tablename__ = "incident_evidence"

    id = Column(String(64), primary_key=True, default=gen_uuid)
    incident_id = Column(String(64), ForeignKey("incidents.id"), nullable=False)
    evidence_type = Column(String(64), nullable=False)  # LOG, DLP_SNIPPET, PACKET_DUMP, POSTURE_DIFF
    description = Column(String(256), nullable=True)
    data = Column(JSON, default=dict)
    collected_at = Column(DateTime, default=utc_now)

class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(String(64), primary_key=True, default=gen_uuid)
    tenant_id = Column(String(64), ForeignKey("tenants.id"), nullable=False, index=True)
    actor = Column(String(128), nullable=False)  # admin@zerotrustx.internal
    action = Column(String(64), nullable=False) # POLICY_UPDATED, USER_LOCKED, CONNECTOR_ENROLLED, etc.
    resource = Column(String(128), nullable=False)
    before_state = Column(JSON, nullable=True)
    after_state = Column(JSON, nullable=True)
    source_ip = Column(String(64), default="127.0.0.1")
    timestamp = Column(DateTime, default=utc_now)

class Notification(Base):
    __tablename__ = "notifications"

    id = Column(String(64), primary_key=True, default=gen_uuid)
    tenant_id = Column(String(64), ForeignKey("tenants.id"), nullable=False)
    channel = Column(String(32), default="SLACK")  # EMAIL, SLACK, WEBHOOK
    target = Column(String(256), nullable=False)
    title = Column(String(256), nullable=False)
    message = Column(Text, nullable=False)
    status = Column(String(32), default="DELIVERED")
    sent_at = Column(DateTime, default=utc_now)

class ExperienceMetric(Base):
    __tablename__ = "experience_metrics"

    id = Column(String(64), primary_key=True, default=gen_uuid)
    tenant_id = Column(String(64), ForeignKey("tenants.id"), nullable=False)
    application_name = Column(String(128), nullable=False)
    dns_ms = Column(Float, default=12.0)
    tcp_ms = Column(Float, default=18.0)
    tls_ms = Column(Float, default=24.0)
    http_ms = Column(Float, default=120.0)
    total_ms = Column(Float, default=174.0)
    packet_loss_percent = Column(Float, default=0.0)
    availability_percent = Column(Float, default=99.98)
    status = Column(String(32), default="OPTIMAL")  # OPTIMAL, DEGRADED, OUTAGE
    timestamp = Column(DateTime, default=utc_now)

class Report(Base):
    __tablename__ = "reports"

    id = Column(String(64), primary_key=True, default=gen_uuid)
    tenant_id = Column(String(64), ForeignKey("tenants.id"), nullable=False)
    title = Column(String(256), nullable=False)
    report_type = Column(String(64), nullable=False) # EXECUTIVE, ACCESS, DLP, WAF, POSTURE, AUDIT
    format = Column(String(16), default="JSON")       # JSON, CSV, PDF
    summary_data = Column(JSON, default=dict)
    generated_by = Column(String(128), default="admin@zerotrustx.internal")
    created_at = Column(DateTime, default=utc_now)
