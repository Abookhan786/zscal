import hashlib
from datetime import datetime, timezone, timedelta
from database.connection import SessionLocal, engine, Base
from database.models import (
    Tenant, User, Group, UserGroup, Role, Device, DevicePosture,
    Application, ApplicationSegment, ConnectorGroup, Connector,
    Policy, PolicyCondition, PolicyVersion, SecurityEvent, Alert,
    Incident, IncidentEvidence, AuditLog, ExperienceMetric
)

def hash_pw(password: str) -> str:
    # Deterministic SHA256 salted hash for robust zero-dependency seeding
    salt = "ztx_secure_salt_2026_"
    return hashlib.sha256((salt + password).encode()).hexdigest()

def seed_database():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        # Check if already seeded
        if db.query(Tenant).filter_by(id="tenant-enterprise-01").first():
            return

        tenant = Tenant(
            id="tenant-enterprise-01",
            name="Acme Cyber Defense Corp",
            domain="acme-cyber.internal",
            is_active=True
        )
        db.add(tenant)
        db.commit()

        # Roles
        roles_data = [
            ("SUPER_ADMIN", "Global super administrator with full cluster control", ["*"]),
            ("TENANT_ADMIN", "Administrator of tenant domain and policies", ["manage_policies", "manage_users", "manage_devices"]),
            ("SECURITY_ADMIN", "SOC lead with full security configuration rights", ["manage_policies", "view_incidents", "contain_devices"]),
            ("SECURITY_ANALYST", "SOC tier 1/2 investigator", ["view_incidents", "view_events", "update_incidents"]),
            ("developer", "Engineering developer accessing code and staging environments", ["access_git", "access_internal_tools"]),
            ("finance", "Finance analyst with accounting and payroll system access", ["access_finance", "access_hr"]),
        ]
        for name, desc, perms in roles_data:
            role = Role(
                tenant_id=tenant.id,
                name=name,
                description=desc,
                permissions=perms
            )
            db.add(role)

        # Users
        u_alice = User(
            id="user-alice-01",
            tenant_id=tenant.id,
            username="alice",
            email="alice@acme-cyber.internal",
            full_name="Alice Developer",
            department="Engineering",
            role="developer",
            password_hash=hash_pw("Password123!"),
            mfa_enabled=True,
            totp_secret="JBSWY3DPEHPK3PXP",
            is_active=True,
            base_risk=10,
            current_risk=12,
            last_login_at=datetime.now(timezone.utc)
        )
        u_bob = User(
            id="user-bob-02",
            tenant_id=tenant.id,
            username="bob",
            email="bob@acme-cyber.internal",
            full_name="Bob DevOps",
            department="Infrastructure",
            role="developer",
            password_hash=hash_pw("Password123!"),
            mfa_enabled=True,
            base_risk=15,
            current_risk=18
        )
        u_charlie = User(
            id="user-charlie-03",
            tenant_id=tenant.id,
            username="charlie",
            email="charlie@acme-cyber.internal",
            full_name="Charlie Financials",
            department="Finance",
            role="finance",
            password_hash=hash_pw("Password123!"),
            mfa_enabled=True,
            base_risk=10,
            current_risk=14
        )
        u_admin = User(
            id="user-admin-00",
            tenant_id=tenant.id,
            username="admin",
            email="admin@acme-cyber.internal",
            full_name="Chief SOC Officer",
            department="Security",
            role="SECURITY_ADMIN",
            password_hash=hash_pw("AdminSecure2026!"),
            mfa_enabled=True,
            base_risk=5,
            current_risk=8
        )
        db.add_all([u_alice, u_bob, u_charlie, u_admin])
        db.commit()

        # Groups
        g_dev = Group(id="group-dev", tenant_id=tenant.id, name="Developers", description="Software engineering staff")
        g_sec = Group(id="group-sec", tenant_id=tenant.id, name="Security Team", description="Security and incident responders")
        g_fin = Group(id="group-fin", tenant_id=tenant.id, name="Finance Group", description="Treasury and finance staff")
        db.add_all([g_dev, g_sec, g_fin])
        db.commit()

        db.add_all([
            UserGroup(user_id=u_alice.id, group_id=g_dev.id),
            UserGroup(user_id=u_bob.id, group_id=g_dev.id),
            UserGroup(user_id=u_admin.id, group_id=g_sec.id),
            UserGroup(user_id=u_charlie.id, group_id=g_fin.id)
        ])

        # Devices & Postures
        d_alice = Device(
            id="dev-alice-laptop",
            tenant_id=tenant.id,
            user_id=u_alice.id,
            device_name="Alice-ThinkPad-X1",
            hostname="dev-linux-01.acme.corp",
            os="Linux",
            os_version="Ubuntu 22.04 LTS",
            agent_version="1.2.0",
            is_managed=True,
            compliance_status="COMPLIANT",
            risk_score=12
        )
        d_alice_posture = DevicePosture(
            device_id=d_alice.id,
            tenant_id=tenant.id,
            firewall_enabled=True,
            antivirus_enabled=True,
            disk_encrypted=True,
            screen_lock_enabled=True,
            patches_up_to_date=True,
            certificate_valid=True,
            reported_ip="10.100.4.12",
            raw_details={"agent_uptime_sec": 84200, "tpm_present": True}
        )

        d_bob = Device(
            id="dev-bob-mac",
            tenant_id=tenant.id,
            user_id=u_bob.id,
            device_name="Bob-MacBook-Pro",
            hostname="dev-mac-02.acme.corp",
            os="macOS",
            os_version="Sequoia 15.1",
            agent_version="1.2.0",
            is_managed=True,
            compliance_status="COMPLIANT",
            risk_score=15
        )
        d_bob_posture = DevicePosture(
            device_id=d_bob.id,
            tenant_id=tenant.id,
            firewall_enabled=True,
            antivirus_enabled=True,
            disk_encrypted=True,
            screen_lock_enabled=True,
            patches_up_to_date=True,
            certificate_valid=True,
            reported_ip="10.100.4.88"
        )

        d_charlie = Device(
            id="dev-charlie-pc",
            tenant_id=tenant.id,
            user_id=u_charlie.id,
            device_name="Finance-Workstation-03",
            hostname="fin-win-03.acme.corp",
            os="Windows",
            os_version="Windows 11 Enterprise",
            agent_version="1.2.0",
            is_managed=True,
            compliance_status="COMPLIANT",
            risk_score=10
        )
        d_charlie_posture = DevicePosture(
            device_id=d_charlie.id,
            tenant_id=tenant.id,
            firewall_enabled=True,
            antivirus_enabled=True,
            disk_encrypted=True,
            screen_lock_enabled=True,
            patches_up_to_date=True,
            certificate_valid=True,
            reported_ip="10.100.2.14"
        )

        d_rogue = Device(
            id="dev-untrusted-rogue",
            tenant_id=tenant.id,
            user_id=None,
            device_name="Unmanaged-Personal-Laptop",
            hostname="unknown-endpoint.home",
            os="Windows",
            os_version="Windows 10 Home",
            agent_version="0.9.1-outdated",
            is_managed=False,
            compliance_status="NON_COMPLIANT",
            risk_score=85
        )
        d_rogue_posture = DevicePosture(
            device_id=d_rogue.id,
            tenant_id=tenant.id,
            firewall_enabled=False,
            antivirus_enabled=False,
            disk_encrypted=False,
            screen_lock_enabled=False,
            patches_up_to_date=False,
            certificate_valid=False,
            reported_ip="198.51.100.44"
        )

        db.add_all([d_alice, d_bob, d_charlie, d_rogue])
        db.commit()
        db.add_all([d_alice_posture, d_bob_posture, d_charlie_posture, d_rogue_posture])
        db.commit()

        # Connector Groups & Connectors
        cg_chennai = ConnectorGroup(
            id="cg-chennai-dc",
            tenant_id=tenant.id,
            name="Chennai-DC",
            region="ap-south-1",
            description="Primary data center connector cluster"
        )
        cg_useast = ConnectorGroup(
            id="cg-us-east",
            tenant_id=tenant.id,
            name="US-East-1",
            region="us-east-1",
            description="Secondary disaster recovery connector cluster"
        )
        db.add_all([cg_chennai, cg_useast])
        db.commit()

        c1 = Connector(
            id="conn-chennai-01",
            tenant_id=tenant.id,
            group_id=cg_chennai.id,
            name="Connector-Chennai-Alpha",
            status="ONLINE",
            version="2.4.1",
            ip_address="10.200.1.15",
            region="Chennai-DC",
            cpu_usage=14.2,
            memory_usage=38.4,
            latency_ms=11.2,
            active_sessions=6,
            last_heartbeat_at=datetime.now(timezone.utc)
        )
        c2 = Connector(
            id="conn-chennai-02",
            tenant_id=tenant.id,
            group_id=cg_chennai.id,
            name="Connector-Chennai-Beta",
            status="ONLINE",
            version="2.4.1",
            ip_address="10.200.1.16",
            region="Chennai-DC",
            cpu_usage=18.0,
            memory_usage=41.2,
            latency_ms=12.8,
            active_sessions=4,
            last_heartbeat_at=datetime.now(timezone.utc)
        )
        c3 = Connector(
            id="conn-useast-01",
            tenant_id=tenant.id,
            group_id=cg_useast.id,
            name="Connector-Virginia-01",
            status="ONLINE",
            version="2.4.1",
            ip_address="10.240.2.20",
            region="US-East-1",
            cpu_usage=8.5,
            memory_usage=29.0,
            latency_ms=78.4,
            active_sessions=1,
            last_heartbeat_at=datetime.now(timezone.utc)
        )
        db.add_all([c1, c2, c3])
        db.commit()

        # Applications
        app_git = Application(
            id="app-git-server",
            tenant_id=tenant.id,
            name="Git Server",
            domain="git.internal",
            port=443,
            protocol="HTTPS",
            sensitivity="HIGH",
            status="ONLINE",
            health="HEALTHY",
            connector_group_id=cg_chennai.id,
            description="Core software source code repositories & CI orchestrator"
        )
        app_finance = Application(
            id="app-finance-portal",
            tenant_id=tenant.id,
            name="Finance Application",
            domain="finance.internal",
            port=443,
            protocol="HTTPS",
            sensitivity="CRITICAL",
            status="ONLINE",
            health="HEALTHY",
            connector_group_id=cg_chennai.id,
            description="General ledger, payroll, invoice processing and banking API"
        )
        app_hr = Application(
            id="app-hr-portal",
            tenant_id=tenant.id,
            name="HR Application",
            domain="hr.internal",
            port=443,
            protocol="HTTPS",
            sensitivity="MEDIUM",
            status="ONLINE",
            health="HEALTHY",
            connector_group_id=cg_chennai.id,
            description="Employee directory, leave management, onboarding"
        )
        app_admin = Application(
            id="app-admin-portal",
            tenant_id=tenant.id,
            name="Internal Admin API",
            domain="admin.internal",
            port=8443,
            protocol="HTTPS",
            sensitivity="CRITICAL",
            status="ONLINE",
            health="HEALTHY",
            connector_group_id=cg_chennai.id,
            description="Root cluster controls, database consoles, telemetry sinks"
        )
        db.add_all([app_git, app_finance, app_hr, app_admin])
        db.commit()

        # Zero Trust Policies (Strict priority order)
        policies_data = [
            (
                "pol-high-risk-deny",
                "High Risk Emergency Quarantine",
                10,
                "DENY",
                {
                    "risk": {"minimum": 80}
                },
                "Immediately deny any request originating from an entity with risk score >= 80"
            ),
            (
                "pol-non-compliant-device",
                "Require Compliant Device",
                20,
                "REQUIRE_COMPLIANT_DEVICE",
                {
                    "device": {"managed": False}
                },
                "Block unmanaged or degraded devices from accessing sensitive enterprise apps"
            ),
            (
                "pol-developer-git-access",
                "Developer Git Access",
                100,
                "ALLOW",
                {
                    "user": {"role": "developer"},
                    "device": {"managed": True, "firewall_enabled": True, "antivirus_enabled": True},
                    "application": {"domain": "git.internal"},
                    "risk": {"maximum": 50}
                },
                "Developers with managed compliant devices and low risk can access Git Server"
            ),
            (
                "pol-finance-access",
                "Finance Department Access",
                110,
                "ALLOW",
                {
                    "user": {"role": "finance", "department": "Finance"},
                    "device": {"managed": True, "encrypted": True},
                    "application": {"domain": "finance.internal"},
                    "risk": {"maximum": 30}
                },
                "Finance personnel only can reach the finance.internal portal"
            ),
            (
                "pol-hr-access",
                "Corporate HR Portal Access",
                120,
                "ALLOW",
                {
                    "device": {"managed": True},
                    "application": {"domain": "hr.internal"},
                    "risk": {"maximum": 60}
                },
                "All staff on managed devices can reach the HR portal"
            ),
            (
                "pol-admin-sec-access",
                "Security Operations Root API",
                50,
                "ALLOW",
                {
                    "user": {"role": "SECURITY_ADMIN"},
                    "device": {"managed": True, "compliance_status": "COMPLIANT"},
                    "application": {"domain": "admin.internal"},
                    "risk": {"maximum": 25}
                },
                "Strict access to cluster root administration endpoints"
            ),
            (
                "pol-default-deny",
                "Default Zero Trust Deny All",
                999,
                "DENY",
                {},
                "Implicit Zero Trust deny all baseline"
            )
        ]

        for pid, name, prio, act, conds, desc in policies_data:
            p = Policy(
                id=pid,
                tenant_id=tenant.id,
                name=name,
                description=desc,
                priority=prio,
                action=act,
                status="ACTIVE",
                version=1,
                conditions=conds,
                created_by="system@zerotrustx.internal"
            )
            db.add(p)
            pv = PolicyVersion(
                policy_id=pid,
                version_number=1,
                definition=conds,
                change_reason="Initial ZeroTrustX baseline policy deployment",
                author="system@zerotrustx.internal"
            )
            db.add(pv)
        db.commit()

        # Initial Experience Metrics
        now = datetime.now(timezone.utc)
        metrics_data = [
            ("Git Server", 12.0, 18.0, 24.0, 110.0, 164.0, 0.0, 100.0, "OPTIMAL"),
            ("Finance Application", 14.0, 20.0, 26.0, 140.0, 200.0, 0.0, 100.0, "OPTIMAL"),
            ("HR Application", 11.0, 16.0, 22.0, 95.0, 144.0, 0.0, 100.0, "OPTIMAL"),
            ("Internal Admin API", 15.0, 22.0, 28.0, 160.0, 225.0, 0.0, 100.0, "OPTIMAL")
        ]
        for app_name, dns_m, tcp_m, tls_m, http_m, tot_m, loss, avail, st in metrics_data:
            em = ExperienceMetric(
                tenant_id=tenant.id,
                application_name=app_name,
                dns_ms=dns_m,
                tcp_ms=tcp_m,
                tls_ms=tls_m,
                http_ms=http_m,
                total_ms=tot_m,
                packet_loss_percent=loss,
                availability_percent=avail,
                status=st,
                timestamp=now
            )
            db.add(em)
        db.commit()

        # Seed initial audit and security events
        audit = AuditLog(
            tenant_id=tenant.id,
            actor="admin@acme-cyber.internal",
            action="BOOTSTRAP_COMPLETE",
            resource="platform/core",
            before_state={},
            after_state={"initialized": True, "policies_active": 7},
            source_ip="127.0.0.1"
        )
        db.add(audit)

        event = SecurityEvent(
            tenant_id=tenant.id,
            timestamp=now - timedelta(minutes=5),
            event_type="AUTH_LOGIN",
            severity="INFO",
            user_id=u_alice.id,
            username="alice",
            device_id=d_alice.id,
            source_ip="10.100.4.12",
            application="Control Plane Console",
            reason="Successful MFA TOTP authentication",
            risk_score=12
        )
        db.add(event)
        db.commit()

        print("[ZeroTrustX] Seed data loaded successfully!")
    finally:
        db.close()

if __name__ == "__main__":
    seed_database()
