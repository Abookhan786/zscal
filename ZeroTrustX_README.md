# ZeroTrustX
## Enterprise-Grade Zero Trust Security, Secure Web Access & Private Application Access Platform

> **Project positioning:** An original, production-oriented security platform inspired by the architectural principles of modern Zero Trust / Security Service Edge platforms. It is **not a clone of Zscaler** and does not use Zscaler proprietary code, infrastructure, APIs, or branding.

### One-line description

**ZeroTrustX** is a full-stack, cloud-native Zero Trust security platform that provides identity-aware private application access, secure web access, device posture evaluation, adaptive risk scoring, policy-based authorization, application protection, DLP, security analytics, digital experience monitoring, centralized administration, auditability, and SOC workflows.

---

# 1. Why This Project Exists

Traditional network security often follows the model:

```text
User -> VPN -> Corporate Network -> Application
```

The problem is that network connectivity can create excessive trust. Once a user is inside the network, the security boundary can become the network itself.

ZeroTrustX follows:

```text
User
  |
Endpoint Agent
  |
Identity + Device + Context
  |
Policy Decision
  |
Risk Evaluation
  |
+-------------------------------+
|                               |
Private Application             Internet / SaaS
Access Gateway                  Secure Web Gateway
|                               |
App Connector                    URL/Security Controls
|                               |
Private Application             Internet
```

The core principle is:

> **Never trust based only on network location. Verify identity, device state, application, context and risk before every sensitive access decision.**

---

# 2. Architectural Inspiration

The architecture is conceptually aligned with modern Zero Trust platforms:

| ZeroTrustX | Architectural concept |
|---|---|
| Zero Trust Control Plane | Central policy and orchestration layer |
| Private Access Gateway | Application-level private access |
| App Connector | Outbound connector into private environments |
| Endpoint Agent | Endpoint identity/context/traffic steering |
| Secure Web Gateway | Internet and SaaS security controls |
| Risk Engine | Adaptive/context-aware access |
| Device Posture Engine | Endpoint trust evaluation |
| Application Protection | WAF/API/WebSocket controls |
| DLP Engine | Sensitive data inspection |
| Experience Monitoring | Endpoint/network/application telemetry |
| Security Analytics | Centralized security events and investigations |
| Admin Console | Central security management plane |

The platform deliberately uses the same **security ideas**, while implementing its own software and architecture.

---

# 3. Major Functional Domains

ZeroTrustX is divided into the following production-style domains:

1. Identity and Access Management
2. Multi-Factor Authentication
3. Device Registration and Posture
4. Zero Trust Policy Engine
5. Risk and Adaptive Access Engine
6. Private Application Access
7. App Connector Infrastructure
8. Secure Web Gateway
9. URL and DNS Security
10. TLS-aware traffic architecture
11. Application Protection / WAF
12. API Security
13. Data Loss Prevention
14. Malware / file inspection abstraction
15. Security Event Pipeline
16. SIEM-style Security Analytics
17. Alerting and Incident Management
18. Digital Experience Monitoring
19. Administrative Control Plane
20. Tenant / Organization Management
21. Configuration Management
22. Audit Logging
23. Reporting
24. Threat Simulation
25. Policy Testing / Policy Playground
26. Health Monitoring
27. Observability
28. Rate Limiting
29. Secrets Management
30. CI/CD and Supply Chain Security
31. Container Security
32. High Availability
33. Disaster Recovery
34. API Documentation
35. Automated Testing

---

# 4. Production Architecture

```text
                           INTERNET
                              |
                     +------------------+
                     | DNS / CDN / WAF  |
                     +--------+---------+
                              |
                       Load Balancer
                              |
                 +------------+------------+
                 |                         |
          API Gateway / BFF          Web Application
                 |                         |
                 +------------+------------+
                              |
                    Zero Trust Control Plane
                              |
       +----------------------+----------------------+
       |                      |                      |
 Identity Service       Policy Service        Risk Engine
       |                      |                      |
       |                Policy Decision              |
       |                      |                      |
       +----------------------+----------------------+
                              |
                +-------------+-------------+
                |                           |
        Private Access Plane         Secure Web Plane
                |                           |
        App Connector Mesh             Web Gateway
                |                           |
        Private Applications          Internet/SaaS
                |
       +--------+--------+
       |        |        |
      HR      Git      Finance
      App     Server    App


                SECURITY DATA PLANE
                         |
        +----------------+----------------+
        |                |                |
     Audit Logs      Security Events   Telemetry
        |                |                |
        +----------------+----------------+
                         |
                    Event Bus
                         |
              +----------+----------+
              |                     |
         Analytics Store       Alert Engine
              |                     |
         SOC Dashboard       Incident System


                OBSERVABILITY PLANE
                         |
          OpenTelemetry Collector
                         |
       +-----------------+----------------+
       |                 |                |
    Prometheus         Loki           Tempo
       |                 |                |
       +-----------------+----------------+
                         |
                      Grafana
```

---

# 5. Repository Structure

```text
zerotrustx/
│
├── README.md
├── LICENSE
├── SECURITY.md
├── CONTRIBUTING.md
├── CODE_OF_CONDUCT.md
├── CHANGELOG.md
├── Makefile
├── .gitignore
├── .env.example
│
├── apps/
│   │
│   ├── web-console/
│   │   ├── src/
│   │   │   ├── app/
│   │   │   ├── components/
│   │   │   ├── layouts/
│   │   │   ├── pages/
│   │   │   ├── features/
│   │   │   │   ├── dashboard/
│   │   │   │   ├── users/
│   │   │   │   ├── devices/
│   │   │   │   ├── applications/
│   │   │   │   ├── policies/
│   │   │   │   ├── connectors/
│   │   │   │   ├── web-security/
│   │   │   │   ├── dlp/
│   │   │   │   ├── alerts/
│   │   │   │   ├── incidents/
│   │   │   │   ├── analytics/
│   │   │   │   ├── experience/
│   │   │   │   └── reports/
│   │   │   ├── hooks/
│   │   │   ├── services/
│   │   │   ├── stores/
│   │   │   ├── types/
│   │   │   └── utils/
│   │   ├── public/
│   │   ├── tests/
│   │   ├── Dockerfile
│   │   └── package.json
│   │
│   └── endpoint-agent/
│       ├── src/
│       ├── installer/
│       ├── config/
│       ├── tests/
│       └── Dockerfile
│
├── services/
│   │
│   ├── api-gateway/
│   │   ├── app/
│   │   ├── tests/
│   │   └── Dockerfile
│   │
│   ├── identity-service/
│   │   ├── app/
│   │   │   ├── api/
│   │   │   ├── models/
│   │   │   ├── schemas/
│   │   │   ├── repositories/
│   │   │   ├── services/
│   │   │   ├── security/
│   │   │   └── main.py
│   │   └── tests/
│   │
│   ├── policy-service/
│   │   ├── engine/
│   │   ├── compiler/
│   │   ├── evaluator/
│   │   ├── simulator/
│   │   ├── schemas/
│   │   ├── api/
│   │   └── tests/
│   │
│   ├── risk-service/
│   │   ├── signals/
│   │   ├── scoring/
│   │   ├── adaptive-access/
│   │   ├── models/
│   │   ├── api/
│   │   └── tests/
│   │
│   ├── posture-service/
│   │   ├── collectors/
│   │   ├── validators/
│   │   ├── profiles/
│   │   ├── compliance/
│   │   └── tests/
│   │
│   ├── private-access-service/
│   │   ├── application-discovery/
│   │   ├── application-segments/
│   │   ├── session-manager/
│   │   ├── connector-selector/
│   │   ├── tunnel-manager/
│   │   ├── health-checker/
│   │   └── tests/
│   │
│   ├── connector-controller/
│   │   ├── enrollment/
│   │   ├── heartbeat/
│   │   ├── health/
│   │   ├── assignments/
│   │   ├── certificates/
│   │   └── tests/
│   │
│   ├── app-connector/
│   │   ├── connector/
│   │   ├── tunnel/
│   │   ├── routing/
│   │   ├── health/
│   │   ├── discovery/
│   │   └── tests/
│   │
│   ├── secure-web-gateway/
│   │   ├── proxy/
│   │   ├── url-filter/
│   │   ├── dns-security/
│   │   ├── category-engine/
│   │   ├── ssl/
│   │   ├── malware/
│   │   └── tests/
│   │
│   ├── app-protection-service/
│   │   ├── waf/
│   │   ├── rules/
│   │   ├── signatures/
│   │   ├── websocket/
│   │   ├── api-security/
│   │   └── tests/
│   │
│   ├── dlp-service/
│   │   ├── detectors/
│   │   ├── classifiers/
│   │   ├── policies/
│   │   ├── scanners/
│   │   ├── redaction/
│   │   └── tests/
│   │
│   ├── event-service/
│   │   ├── ingestion/
│   │   ├── normalization/
│   │   ├── enrichment/
│   │   ├── correlation/
│   │   └── tests/
│   │
│   ├── alert-service/
│   │   ├── rules/
│   │   ├── notifications/
│   │   ├── escalation/
│   │   └── tests/
│   │
│   ├── incident-service/
│   │   ├── incidents/
│   │   ├── evidence/
│   │   ├── timeline/
│   │   ├── assignment/
│   │   └── tests/
│   │
│   ├── experience-service/
│   │   ├── probes/
│   │   ├── dns/
│   │   ├── tcp/
│   │   ├── http/
│   │   ├── latency/
│   │   ├── availability/
│   │   └── tests/
│   │
│   ├── reporting-service/
│   │   ├── reports/
│   │   ├── exports/
│   │   ├── scheduled/
│   │   └── tests/
│   │
│   └── notification-service/
│       ├── email/
│       ├── webhook/
│       ├── slack/
│       └── tests/
│
├── private-apps/
│   ├── hr-portal/
│   ├── finance-portal/
│   ├── developer-portal/
│   ├── admin-portal/
│   └── internal-api/
│
├── infrastructure/
│   │
│   ├── docker/
│   │   ├── docker-compose.dev.yml
│   │   ├── docker-compose.test.yml
│   │   └── docker-compose.prod.yml
│   │
│   ├── kubernetes/
│   │   ├── namespaces/
│   │   ├── deployments/
│   │   ├── services/
│   │   ├── ingress/
│   │   ├── configmaps/
│   │   ├── secrets/
│   │   ├── network-policies/
│   │   ├── autoscaling/
│   │   └── policies/
│   │
│   ├── helm/
│   │   └── zerotrustx/
│   │
│   ├── terraform/
│   │   ├── aws/
│   │   ├── networking/
│   │   ├── databases/
│   │   ├── kubernetes/
│   │   └── observability/
│   │
│   └── ansible/
│
├── database/
│   ├── migrations/
│   ├── seeds/
│   ├── schemas/
│   └── policies/
│
├── security/
│   ├── threat-model/
│   ├── threat-detection/
│   ├── yara/
│   ├── sigma/
│   ├── waf-rules/
│   ├── dlp-patterns/
│   └── compliance/
│
├── observability/
│   ├── prometheus/
│   ├── grafana/
│   ├── loki/
│   ├── tempo/
│   ├── otel/
│   └── alerts/
│
├── messaging/
│   ├── kafka/
│   ├── schemas/
│   └── consumers/
│
├── scripts/
│   ├── bootstrap/
│   ├── migrations/
│   ├── security/
│   └── load-testing/
│
├── docs/
│   ├── architecture/
│   ├── api/
│   ├── security/
│   ├── deployment/
│   ├── operations/
│   ├── threat-model/
│   ├── runbooks/
│   └── interview/
│
└── .github/
    └── workflows/
        ├── ci.yml
        ├── security.yml
        ├── dependency-scan.yml
        ├── container-scan.yml
        └── deploy.yml
```

---

# 6. Technology Stack

## Frontend

- React
- TypeScript
- Vite
- Tailwind CSS
- shadcn/ui
- React Router
- TanStack Query
- Zustand
- React Hook Form
- Zod
- Recharts
- Monaco Editor for Policy Playground
- WebSocket / Server-Sent Events for live security events

### Frontend responsibilities

- Security dashboard
- User administration
- Device administration
- Application inventory
- Policy management
- Policy simulator
- Connector health
- Access logs
- DLP incidents
- WAF events
- Threat alerts
- Incident response
- Experience monitoring
- Reports
- Tenant administration
- Audit history

---

# 7. Backend Stack

## Core

- Python
- FastAPI
- Pydantic
- SQLAlchemy
- Alembic
- PostgreSQL
- Redis

## API

- REST
- WebSocket
- Server-Sent Events
- OpenAPI
- OAuth 2.0 / OIDC
- JWT
- RBAC
- ABAC

## Background Processing

- Celery or Dramatiq
- Redis/RabbitMQ
- Kafka for high-volume security events

---

# 8. Data Platform

## Primary Database

PostgreSQL stores:

- tenants
- users
- roles
- groups
- devices
- applications
- application segments
- policies
- policy versions
- connectors
- sessions
- alerts
- incidents
- audit records
- configurations

## Redis

Used for:

- sessions
- rate limits
- short-lived authorization decisions
- distributed locks
- connector heartbeat state
- caching

## Kafka

Used for:

```text
Endpoint Events
       |
Web Gateway Events
       |
Access Events
       |
DLP Events
       |
WAF Events
       |
Experience Telemetry
       |
       v
     Kafka
       |
+------+------+------+
|             |      |
Analytics   Alert   SIEM
```

Kafka allows security events to be processed asynchronously without making every request wait for analytics.

---

# 9. Authentication and Identity

ZeroTrustX supports:

- Local authentication
- OIDC
- OAuth 2.0
- SAML-compatible federation architecture
- MFA
- TOTP
- Recovery codes
- Session management
- Device binding
- Refresh-token rotation
- Account lockout
- Login anomaly detection

Recommended identity provider for development:

- Keycloak

Production can integrate with:

- Microsoft Entra ID
- Okta
- Google Workspace
- Any standards-compliant OIDC/SAML provider

---

# 10. Identity Model

```text
Tenant
 |
 +-- Users
 |    |
 |    +-- Groups
 |    +-- Roles
 |    +-- Identity Attributes
 |
 +-- Devices
 |
 +-- Applications
 |
 +-- Policies
 |
 +-- Connectors
 |
 +-- Security Events
```

Example:

```text
User:
    Alice
    Department: Engineering
    Role: Developer
    Groups: Developers, Employees

Device:
    Managed: true
    Encryption: true
    Firewall: true
    Antivirus: true
    OS: Linux
    Risk: 15

Application:
    Git Server
    Sensitivity: High

Policy:
    Developer + Managed Device + Risk < 50
    -> ALLOW
```

---

# 11. Zero Trust Policy Engine

This is the core of the project.

The engine evaluates:

```text
Identity
+ Role
+ Group
+ Device
+ Device Posture
+ Application
+ Location
+ Network
+ Time
+ Risk
+ Threat Signals
+ Authentication Strength
+ Tenant Policy
------------------------------
        POLICY DECISION
```

Possible decisions:

- ALLOW
- DENY
- STEP_UP_MFA
- REQUIRE_COMPLIANT_DEVICE
- REQUIRE_TRUSTED_NETWORK
- READ_ONLY
- QUARANTINE
- REDIRECT

---

# 12. Policy Example

```yaml
name: Developer Git Access

priority: 100

when:
  user:
    role: developer

  device:
    managed: true
    encrypted: true
    firewall_enabled: true

  application:
    name: git-server

  risk:
    maximum: 50

then:
  action: ALLOW
```

Another:

```yaml
name: High Risk Device

when:
  risk:
    minimum: 80

then:
  action: DENY
```

---

# 13. Policy Evaluation

Policies use:

- priority
- specificity
- AND/OR condition groups
- first-match evaluation
- explicit deny precedence
- policy versioning
- dry-run mode
- simulation
- audit trail

Every decision produces:

```json
{
  "decision": "DENY",
  "policy": "High Risk Device",
  "risk_score": 87,
  "matched_conditions": [
    "device.firewall=false",
    "device.risk>80"
  ],
  "reason": "Device does not satisfy security posture"
}
```

---

# 14. Policy Playground

The administrator can test:

```text
User: Alice
Device: DEV-LINUX-01
Application: Git
Location: Chennai
Risk: 34
Managed: YES
Firewall: YES
```

The engine displays:

```text
Policy #1 -> MATCH
Policy #2 -> NO MATCH
Policy #3 -> NO MATCH

FINAL DECISION
ALLOW

Reason:
Developer + managed device + risk below threshold
```

This demonstrates that the policy engine is actually functional rather than decorative.

---

# 15. Device Posture Engine

The endpoint agent periodically reports:

- OS
- OS version
- hostname
- device ID
- managed status
- firewall state
- antivirus state
- disk encryption
- screen lock
- patch status
- agent version
- certificate status
- last seen
- network state

Example posture:

```json
{
  "managed": true,
  "firewall": true,
  "antivirus": true,
  "encrypted": true,
  "patched": true
}
```

Posture profiles:

```text
COMPLIANT
DEGRADED
NON_COMPLIANT
UNKNOWN
```

---

# 16. Risk Engine

Risk is calculated dynamically.

Signals can include:

- failed login attempts
- impossible travel
- new device
- unmanaged device
- disabled firewall
- disabled antivirus
- unusual access time
- suspicious URL
- high-volume downloads
- DLP violation
- repeated policy violations
- threat intelligence match
- abnormal application behavior

Example:

```text
Base Risk                     10
Unknown Device               +20
Untrusted Network             +15
Firewall Disabled             +20
Repeated Login Failure        +15
Suspicious Request            +20
--------------------------------
Final Risk                    100
```

Risk bands:

```text
0-30    LOW
31-60   MEDIUM
61-80   HIGH
81-100  CRITICAL
```

---

# 17. Adaptive Access

The same user can receive different decisions depending on context.

Example:

```text
Alice + Managed Laptop + Office
        |
        v
      Risk 12
        |
      ALLOW


Alice + Unknown Laptop + Public Wi-Fi
        |
        v
      Risk 72
        |
   STEP-UP MFA


Alice + Compromised Device
        |
        v
      Risk 94
        |
      DENY
```

This is a major Zero Trust capability.

---

# 18. Private Application Access

Private applications run in an isolated network.

Example:

```text
private-network
|
+-- hr-app
+-- finance-app
+-- git-app
+-- admin-app
+-- internal-api
```

These applications are not exposed directly to the public Internet.

Access flow:

```text
User
 |
Endpoint Agent
 |
Zero Trust Gateway
 |
Identity Verification
 |
Policy Engine
 |
Risk Engine
 |
Connector Selection
 |
App Connector
 |
Private Application
```

---

# 19. Application Segmentation

Applications are defined independently.

Example:

```text
Application Segment:
    Name: Finance

    Destination:
        finance.internal

    Ports:
        443

    Sensitivity:
        CRITICAL
```

A user does not receive access to the entire private network.

They receive access only to the authorized application.

---

# 20. App Connector

App Connectors provide the bridge between the Zero Trust control plane and private applications.

Responsibilities:

- secure enrollment
- heartbeat
- certificate management
- health reporting
- application discovery
- connection brokering
- outbound tunnel establishment
- routing
- failover
- load balancing
- connector group membership

Connector states:

```text
ENROLLING
ONLINE
DEGRADED
OFFLINE
QUARANTINED
DISABLED
```

---

# 21. Connector High Availability

Example:

```text
Connector Group: Chennai-DC

Connector A ----+
Connector B ----+---- Private Apps
Connector C ----+
```

If Connector A fails:

```text
Connector A -> OFFLINE

Traffic
   |
   +----> Connector B
   |
   +----> Connector C
```

Selection can consider:

- health
- latency
- region
- application reachability
- current load

---

# 22. Secure Web Gateway

The Web Gateway controls Internet/SaaS traffic.

Features:

- domain filtering
- URL filtering
- category filtering
- allowlists
- blocklists
- DNS security
- suspicious-domain detection
- HTTP policy enforcement
- request logging
- user attribution
- device attribution
- bandwidth controls
- safe-search policy
- file download controls

Example:

```text
github.com              -> ALLOW
stackoverflow.com       -> ALLOW
malware.test            -> BLOCK
phishing.test           -> BLOCK
unknown-risk.test       -> STEP-UP
```

---

# 23. DNS Security

DNS requests are evaluated before connection.

```text
User
 |
DNS Request
 |
DNS Security Engine
 |
+----------------------+
|                      |
Known Safe          Threat
|                      |
ALLOW                 BLOCK
```

The DNS module stores:

- domain
- category
- reputation
- user
- device
- decision
- timestamp

---

# 24. Application Protection / WAF

The App Protection layer protects internal web applications.

Controls:

- SQL injection detection
- XSS detection
- path traversal
- command injection
- suspicious headers
- malformed requests
- rate abuse
- API abuse
- WebSocket validation
- custom rules

OWASP-aligned controls are used as the foundation.

Example:

```text
GET /search?q=<script>alert(1)</script>

        |
        v

WAF

        |
        v

BLOCK
```

---

# 25. API Security

API protection includes:

- schema validation
- authentication validation
- authorization
- rate limiting
- API key controls
- JWT validation
- abnormal request detection
- endpoint inventory
- request logging

---

# 26. DLP Engine

The DLP engine detects sensitive information.

Detection patterns:

- email addresses
- phone numbers
- credit-card-like values
- API keys
- cloud credentials
- private keys
- employee IDs
- national identifiers
- custom organizational patterns

Example:

```text
employee_database.csv
        |
        v
DLP Scanner
        |
        v
Sensitive records detected
        |
        v
BLOCK
        |
        v
Security Event
        |
        v
SOC Alert
```

DLP actions:

- ALLOW
- BLOCK
- QUARANTINE
- REDACT
- WARN
- LOG

---

# 27. Security Event Pipeline

Every important security action generates an event.

Event types:

```text
AUTH_LOGIN
AUTH_FAILURE
ACCESS_ALLOWED
ACCESS_DENIED
DEVICE_POSTURE_CHANGE
RISK_CHANGE
POLICY_MATCH
POLICY_VIOLATION
DLP_DETECTION
WAF_BLOCK
MALICIOUS_DOMAIN
CONNECTOR_FAILURE
APP_DOWN
LATENCY_ALERT
ADMIN_ACTION
```

Normalized event:

```json
{
  "event_id": "uuid",
  "tenant_id": "uuid",
  "timestamp": "ISO-8601",
  "user_id": "uuid",
  "device_id": "uuid",
  "source_ip": "redacted",
  "application": "finance",
  "event_type": "ACCESS_DENIED",
  "severity": "HIGH",
  "reason": "Device posture failed",
  "risk_score": 82
}
```

---

# 28. SOC Dashboard

The dashboard contains:

### Executive view

- total users
- active devices
- protected applications
- blocked threats
- DLP incidents
- high-risk users
- high-risk devices
- connector health

### Security view

- events per minute
- blocked requests
- policy violations
- WAF attacks
- suspicious domains
- DLP events
- authentication anomalies

### Infrastructure view

- connector health
- application availability
- latency
- error rate
- request volume

---

# 29. Incident Management

When an important alert occurs:

```text
Security Event
      |
Detection Rule
      |
Alert
      |
Incident
      |
Analyst Assignment
      |
Investigation
      |
Containment
      |
Resolution
```

Incident fields:

- title
- severity
- status
- assignee
- affected user
- affected device
- affected application
- evidence
- timeline
- analyst notes
- remediation
- resolution

Statuses:

```text
OPEN
INVESTIGATING
CONTAINED
RESOLVED
CLOSED
FALSE_POSITIVE
```

---

# 30. Threat Correlation

The event service correlates multiple events.

Example:

```text
10 failed logins
       +
new device
       +
unusual location
       +
DLP attempt
       =
HIGH CONFIDENCE ACCOUNT COMPROMISE
```

The alert engine creates a single correlated incident rather than hundreds of unrelated alerts.

---

# 31. Digital Experience Monitoring

Experience monitoring measures:

- DNS latency
- TCP connection time
- TLS handshake time
- HTTP response time
- application availability
- packet loss
- endpoint health
- connector latency

Example:

```text
Git Server

DNS       12 ms
TCP       18 ms
TLS       31 ms
HTTP     820 ms
Total    881 ms
```

If latency increases:

```text
Normal:      150 ms
Current:     900 ms
Threshold:   500 ms

        |
        v

Performance Alert
```

---

# 32. Endpoint Agent

The endpoint agent is responsible for:

- device registration
- authentication
- posture collection
- policy retrieval
- secure traffic steering
- heartbeat
- telemetry
- certificate management
- local security state reporting

It should run as a separate process/service rather than being embedded into the web dashboard.

Development versions can run in a containerized simulation mode.

Production versions should use OS-native installers and services.

---

# 33. Certificate Architecture

Use certificates for service-to-service trust.

```text
Root CA
 |
 +-- Control Plane Certificate
 |
 +-- Connector Certificate
 |
 +-- Endpoint Certificate
 |
 +-- Internal Service Certificates
```

Use short-lived certificates where possible.

Recommended tools:

- HashiCorp Vault
- cert-manager
- Kubernetes Secrets
- cloud KMS

Never commit private keys to Git.

---

# 34. Secrets Management

Development:

```text
.env
```

Production:

```text
Vault / Cloud Secret Manager / Kubernetes External Secrets
```

Secrets include:

- database passwords
- JWT signing keys
- OAuth secrets
- connector enrollment tokens
- Kafka credentials
- encryption keys

---

# 35. Multi-Tenancy

The platform should support:

```text
Platform
 |
 +-- Tenant A
 |    +-- Users
 |    +-- Devices
 |    +-- Apps
 |    +-- Policies
 |
 +-- Tenant B
 |    +-- Users
 |    +-- Devices
 |    +-- Apps
 |    +-- Policies
```

Every security-sensitive database entity contains:

```text
tenant_id
```

Tenant isolation is enforced at:

1. API layer
2. service layer
3. repository layer
4. database layer
5. cache layer
6. event layer

---

# 36. RBAC

Platform roles:

```text
SUPER_ADMIN
TENANT_ADMIN
SECURITY_ADMIN
SECURITY_ANALYST
NETWORK_ADMIN
HELPDESK
AUDITOR
READ_ONLY
```

Example:

```text
Security Analyst:
    View events
    Investigate incidents
    Cannot modify tenant identity configuration

Tenant Admin:
    Manage users
    Manage devices
    Manage policies

Auditor:
    Read audit records
    Export reports
    Cannot change configuration
```

---

# 37. Audit Logging

Every administrative action is recorded.

Example:

```json
{
  "actor": "admin@example.com",
  "action": "POLICY_UPDATED",
  "resource": "policy/123",
  "before": "...",
  "after": "...",
  "ip": "...",
  "timestamp": "..."
}
```

Audit logs should be append-only from the application perspective.

---

# 38. Observability

Use:

- OpenTelemetry
- Prometheus
- Grafana
- Loki
- Tempo

Metrics:

```text
http_requests_total
http_request_duration_seconds
policy_decisions_total
policy_decision_latency
connector_online
connector_offline
risk_score_distribution
dlp_blocks_total
waf_blocks_total
gateway_errors_total
application_latency
```

Tracing:

```text
Client Request
    |
API Gateway
    |
Policy Service
    |
Risk Service
    |
Connector Controller
    |
App Connector
    |
Private Application
```

Every request receives a correlation ID.

---

# 39. Security Engineering

The project includes:

- input validation
- output encoding
- secure headers
- CSRF protection where applicable
- CORS restrictions
- rate limiting
- brute-force protection
- token rotation
- secure cookies where applicable
- password hashing
- MFA
- certificate validation
- service authentication
- network segmentation
- least privilege
- container hardening
- dependency scanning
- secret scanning
- image scanning

---

# 40. Threat Modeling

Threat modeling follows:

- STRIDE
- attack-surface analysis
- trust-boundary analysis
- abuse cases
- privilege escalation analysis
- lateral movement analysis
- credential theft analysis
- data exfiltration analysis

Example:

```text
Internet
   |
   X
Private App

Internet cannot directly reach
the private application.

Authorized access:
User -> Gateway -> Connector -> App
```

---

# 41. Security Testing

Testing layers:

### Unit

- policy evaluation
- risk scoring
- DLP patterns
- URL classification

### Integration

- authentication
- API authorization
- database
- connector registration

### End-to-end

```text
Login
 -> Device registration
 -> Policy evaluation
 -> Private app
 -> Audit event
```

### Security testing

- OWASP API testing
- authentication abuse
- authorization bypass
- IDOR testing
- rate-limit testing
- injection testing
- SSRF testing
- JWT attacks
- session attacks

### Load testing

Use:

- k6
- Locust

---

# 42. CI/CD

GitHub Actions pipeline:

```text
Push
 |
Lint
 |
Unit Tests
 |
Integration Tests
 |
SAST
 |
Dependency Scan
 |
Secret Scan
 |
Container Build
 |
Container Scan
 |
SBOM
 |
Artifact Registry
 |
Deploy Staging
 |
Smoke Tests
 |
Production Approval
 |
Deploy Production
```

Recommended tools:

- Ruff
- MyPy
- ESLint
- Prettier
- Bandit
- Semgrep
- Trivy
- Gitleaks
- Syft
- OWASP ZAP
- Dependabot/Renovate

---

# 43. Container Architecture

Every major component has its own container.

Example:

```text
docker-compose
|
+-- frontend
+-- api-gateway
+-- identity-service
+-- policy-service
+-- risk-service
+-- private-access
+-- app-connector
+-- web-gateway
+-- dlp-service
+-- event-service
+-- alert-service
+-- postgres
+-- redis
+-- kafka
+-- prometheus
+-- grafana
+-- loki
+-- tempo
```

Production deployment moves these workloads to Kubernetes.

---

# 44. Kubernetes

Production Kubernetes architecture:

```text
Kubernetes Cluster
|
+-- gateway namespace
+-- identity namespace
+-- security namespace
+-- private-access namespace
+-- observability namespace
+-- data namespace
```

Use:

- Deployments
- Services
- Ingress
- NetworkPolicies
- HorizontalPodAutoscaler
- PodDisruptionBudgets
- ConfigMaps
- Secrets
- ServiceAccounts
- RBAC

---

# 45. Network Segmentation

Example:

```text
Public
  |
Ingress
  |
Gateway Network
  |
Application Network
  |
Private Application Network

Data Network
  |
PostgreSQL
Kafka
Redis
```

Databases should never be directly reachable from the public Internet.

---

# 46. Database Model

Core entities:

```text
tenants
users
groups
roles
permissions
user_groups
devices
device_posture
applications
application_segments
application_groups
connectors
connector_groups
policies
policy_conditions
policy_versions
access_sessions
access_decisions
web_requests
dns_requests
waf_events
dlp_events
risk_events
risk_scores
security_events
alerts
incidents
incident_evidence
audit_logs
notifications
experience_metrics
reports
```

---

# 47. Example Access Session

```text
session_id
tenant_id
user_id
device_id
application_id
connector_id
source_network
authentication_method
risk_score
policy_id
created_at
expires_at
status
```

---

# 48. API Design

Example API groups:

```text
/api/v1/auth/*
/api/v1/users/*
/api/v1/groups/*
/api/v1/devices/*
/api/v1/posture/*
/api/v1/applications/*
/api/v1/policies/*
/api/v1/policies/simulate
/api/v1/connectors/*
/api/v1/access/*
/api/v1/web-security/*
/api/v1/dlp/*
/api/v1/waf/*
/api/v1/risk/*
/api/v1/events/*
/api/v1/alerts/*
/api/v1/incidents/*
/api/v1/experience/*
/api/v1/reports/*
/api/v1/audit/*
```

---

# 49. API Security Model

Every API request passes through:

```text
Authentication
      |
Authorization
      |
Tenant Context
      |
Rate Limit
      |
Input Validation
      |
Business Logic
      |
Audit
```

Never trust:

- user-supplied tenant IDs
- user-supplied roles
- client-side permissions
- client-supplied risk scores
- client-supplied device posture

These values must be validated server-side.

---

# 50. Real-Time Security Events

The UI receives real-time events:

```text
WebSocket / SSE

SECURITY_EVENT
ALERT_CREATED
DEVICE_STATUS_CHANGED
CONNECTOR_STATUS_CHANGED
INCIDENT_UPDATED
POLICY_CHANGED
```

Dashboard example:

```text
[HIGH] DLP violation detected
User: Alice
Device: DEV-01
File: employee.csv
Action: BLOCKED
Risk: 78
```

---

# 51. Reporting

Reports:

- access report
- denied access report
- DLP report
- WAF report
- user risk report
- device compliance report
- connector health report
- application availability
- incident report
- audit report

Formats:

- PDF
- CSV
- JSON

---

# 52. Attack Simulation Lab

The platform includes a controlled simulation environment.

Simulations:

### Compromised Device

```text
Firewall -> OFF
Antivirus -> OFF
Risk -> +50
```

Expected:

```text
Device becomes NON_COMPLIANT
        |
Risk increases
        |
Private access blocked
        |
Alert generated
```

### Malicious URL

```text
User -> malicious.test
        |
Web Gateway
        |
BLOCK
        |
Security Event
```

### DLP Attack

```text
Upload secret-data.csv
        |
DLP
        |
Sensitive data detected
        |
BLOCK
        |
Incident
```

### Brute Force

```text
20 failed logins
        |
Detection rule
        |
Account risk increased
        |
Temporary lock / MFA
```

All simulations operate only against the project's own lab environment.

---

# 53. Policy Versioning

Policies are never overwritten blindly.

```text
Policy v1
   |
Policy v2
   |
Policy v3
```

Every version stores:

- author
- timestamp
- changes
- reason
- approval
- status

Lifecycle:

```text
DRAFT
  |
TESTING
  |
APPROVED
  |
ACTIVE
  |
DEPRECATED
```

---

# 54. Change Management

Security configuration changes require:

```text
Create Change
     |
Validate
     |
Policy Simulation
     |
Review
     |
Approve
     |
Deploy
     |
Audit
```

For sensitive environments, implement two-person approval.

---

# 55. Admin Dashboard Pages

```text
Overview
Users
Groups
Devices
Device Posture
Applications
Application Segments
Connectors
Connector Groups
Policies
Policy Playground
Access Logs
Web Security
DNS Security
WAF
DLP
Risk
Alerts
Incidents
Threats
Experience
Reports
Audit Logs
Integrations
Settings
Tenant Management
System Health
```

---

# 56. Application Dashboard

For each private application:

```text
Application Name
Status
Health
Users
Requests
Denied Requests
Latency
Connector
Connector Group
Risk Distribution
Top Users
Top Devices
Recent Events
```

---

# 57. Connector Dashboard

```text
Connector Name
Region
Version
Status
CPU
Memory
Latency
Active Sessions
Applications
Last Heartbeat
Certificate Expiry
Errors
```

---

# 58. Risk Dashboard

```text
Critical Users
High Risk Users
High Risk Devices
Risk Trend
Risk Sources
Authentication Anomalies
DLP-related Risk
Policy Violations
```

---

# 59. Integrations

Architecture should support adapters for:

### Identity

- Keycloak
- Microsoft Entra ID
- Okta

### SIEM

- Splunk
- Elastic
- Microsoft Sentinel

### Notifications

- Email
- Slack
- Teams
- Webhooks

### Cloud

- AWS
- Azure
- GCP

### Endpoint

- MDM
- EDR

Integrations must use interfaces/adapters so the core system is not hard-coded to a vendor.

---

# 60. Configuration Strategy

Use:

```text
Application configuration
Environment variables
Secrets manager
Database configuration
Tenant configuration
Policy configuration
```

Configuration hierarchy:

```text
Global
  |
Tenant
  |
Application
  |
User/Group
  |
Device
  |
Request
```

The most specific applicable security policy wins according to the policy evaluation algorithm.

---

# 61. High Availability

Production design goals:

```text
No single API instance
No single connector
No single database node
No single event consumer
```

Use:

- multiple API replicas
- connector groups
- PostgreSQL HA
- Redis HA where required
- Kafka replication
- Kubernetes scheduling
- health checks
- readiness probes
- liveness probes

---

# 62. Disaster Recovery

Define:

- database backups
- point-in-time recovery
- configuration backups
- object storage backups
- recovery procedures
- restore tests

Target examples:

```text
RPO: 15 minutes
RTO: 60 minutes
```

These values are project targets and should be validated through actual recovery tests.

---

# 63. Data Protection

Sensitive data should be:

- encrypted in transit
- encrypted at rest
- minimized
- access controlled
- redacted in logs
- retained only as required

Never log:

- passwords
- raw tokens
- private keys
- full authentication secrets
- unnecessary personal data

---

# 64. Privacy-by-Design

Telemetry should collect only what is necessary.

Examples:

```text
Instead of:
Full request body

Prefer:
Request metadata + classification result
```

DLP logs should store evidence carefully and support redaction.

---

# 65. Performance Goals

Initial engineering targets:

```text
Policy decision p95      < 50 ms
API p95                  < 200 ms
Redis lookup             < 10 ms
Database query p95       < 100 ms
Event ingestion          > 5,000 events/sec
Dashboard event latency  < 2 sec
```

These are engineering targets, not guaranteed production benchmarks.

---

# 66. Security Architecture Principle

The most important architectural separation is:

```text
CONTROL PLANE

Identity
Policy
Configuration
Risk
Analytics
Administration


DATA PLANE

User traffic
Private application traffic
Web traffic
Connector traffic


OBSERVABILITY PLANE

Logs
Metrics
Traces
Security Events
```

This separation makes the design easier to scale and secure.

---

# 67. Core Request Flow

Example: Git access

```text
1. User opens git.internal

2. Endpoint Agent detects private application

3. Request reaches ZeroTrustX Access Plane

4. Identity is verified

5. Device identity is verified

6. Device posture is loaded

7. Risk score is calculated

8. Policy engine evaluates request

9. Authorized connector is selected

10. Secure application session is created

11. Git application receives request

12. Access event is generated

13. Metrics and traces are recorded

14. SOC dashboard receives event
```

---

# 68. Denied Request Flow

```text
User
 |
Request
 |
Identity
 |
Device Posture
 |
Risk = 91
 |
Policy
 |
DENY
 |
Access Log
 |
Security Event
 |
Alert
 |
Dashboard
```

---

# 69. Why This Is More Than a Dashboard

The UI is only the control surface.

The actual security decisions happen in backend services:

```text
Policy Engine
Risk Engine
Posture Engine
Access Gateway
Connector
DLP
WAF
Event Pipeline
```

The dashboard visualizes real decisions and real telemetry generated by those services.

---

# 70. Development Environments

## Local

```text
Docker Compose
PostgreSQL
Redis
Kafka
Backend
Frontend
Private Apps
Connector
Observability
```

## Staging

```text
Kubernetes
Managed PostgreSQL
Managed Redis
Kafka
Ingress
TLS
Observability
CI/CD
```

## Production

```text
Kubernetes
Multi-zone deployment
HA database
HA event streaming
External secrets
Managed certificates
Monitoring
Alerting
Backups
DR
```

---

# 71. Recommended Cloud Architecture

AWS reference deployment:

```text
Route 53
   |
CloudFront / WAF
   |
ALB
   |
EKS
 |
 +-- Control Plane
 +-- Security Services
 +-- Access Services
 +-- Observability
 |
RDS PostgreSQL
ElastiCache Redis
MSK Kafka
S3
Secrets Manager
KMS
CloudWatch
```

Private applications live in private subnets.

Connectors have only the network access required to reach their assigned applications.

---

# 72. Infrastructure as Code

Terraform provisions:

- VPC
- subnets
- security groups
- EKS
- RDS
- Redis
- Kafka
- IAM
- KMS
- S3
- load balancers
- monitoring

No production infrastructure should depend on manually clicking through a cloud console.

---

# 73. Documentation

The repository must contain:

```text
docs/
|
+-- architecture.md
+-- threat-model.md
+-- security-model.md
+-- policy-engine.md
+-- private-access.md
+-- connector-architecture.md
+-- dlp.md
+-- waf.md
+-- observability.md
+-- deployment.md
+-- disaster-recovery.md
+-- incident-response.md
+-- api.md
+-- database.md
+-- operations.md
+-- runbooks/
```

---

# 74. Interview-Level Design Questions This Project Should Answer

You should be able to explain:

1. Why is Zero Trust different from VPN?
2. Why should private applications not be publicly reachable?
3. How does an App Connector work?
4. Why use outbound connections?
5. How does policy evaluation work?
6. How does RBAC differ from ABAC?
7. Why is device posture important?
8. How is risk calculated?
9. How do you prevent lateral movement?
10. How does DLP work?
11. How does WAF work?
12. How do you secure service-to-service communication?
13. How do you isolate tenants?
14. How do you handle connector failure?
15. How do you scale event ingestion?
16. Why Kafka?
17. Why Redis?
18. How do you prevent authorization bypass?
19. How do you protect JWTs?
20. How do you design HA?
21. How do you perform disaster recovery?
22. How do you detect compromised devices?
23. How do you investigate a security incident?
24. How do you prevent policy misconfiguration?
25. How do you test security policies?
26. How do you monitor application experience?
27. How do you protect the control plane?
28. How do you secure Kubernetes?
29. How do you manage secrets?
30. How do you prevent sensitive information from entering logs?

---

# 75. Project Quality Bar

The project should NOT be considered complete merely because:

```text
Frontend works
+
Backend works
+
Login works
```

A production-oriented completion criterion is:

```text
Security
+
Correctness
+
Observability
+
Scalability
+
Availability
+
Testing
+
Documentation
+
Deployment
+
Auditability
+
Operational readiness
```

---

# 76. Definition of Done

A module is complete only when it has:

- implementation
- database model where required
- API
- authentication
- authorization
- validation
- logging
- metrics
- tests
- error handling
- documentation
- Docker support
- security review
- frontend integration
- audit trail where appropriate

---

# 77. Final Demonstration Scenario

The final demonstration should tell a security story rather than simply showing screens.

### Scenario

Alice is a developer.

Her company protects:

```text
Git Server
Finance Application
HR Application
Internal Admin API
```

### Step 1

Alice signs in using MFA.

```text
Authentication -> SUCCESS
```

### Step 2

Her managed laptop reports:

```text
Firewall       ON
Antivirus      ON
Encryption     ON
Patch Status   COMPLIANT
```

Risk:

```text
12
```

### Step 3

Alice requests Git.

```text
Policy -> MATCH
Risk -> LOW
Device -> COMPLIANT

ACCESS -> ALLOW
```

### Step 4

Alice tries Finance.

```text
Developer role
+
Finance application

ACCESS -> DENY
```

### Step 5

Her firewall becomes disabled.

```text
Posture -> NON_COMPLIANT
Risk -> 82
```

Git access:

```text
ACCESS -> DENY
```

### Step 6

Alice attempts to upload sensitive employee data.

```text
DLP -> MATCH
ACTION -> BLOCK
ALERT -> HIGH
INCIDENT -> CREATED
```

### Step 7

Git server latency increases.

```text
HTTP latency:
150 ms -> 900 ms
```

Experience Monitoring:

```text
PERFORMANCE DEGRADATION
```

### Step 8

SOC analyst opens the incident.

They can see:

```text
User
Device
Risk
Policy
Application
DLP Event
Access Attempts
Timeline
Evidence
```

This creates a complete security narrative:

```text
Identity
   ↓
Device
   ↓
Context
   ↓
Risk
   ↓
Policy
   ↓
Application Access
   ↓
Security Inspection
   ↓
Telemetry
   ↓
Detection
   ↓
Incident Response
```

---

# 78. Recommended Implementation Order

Do NOT attempt to build everything simultaneously.

## Phase 1 — Foundation

- repository
- Docker
- PostgreSQL
- Redis
- FastAPI
- React
- authentication
- migrations
- CI

## Phase 2 — Identity

- users
- groups
- roles
- permissions
- MFA
- sessions
- audit logs

## Phase 3 — Device Trust

- device registration
- endpoint agent
- posture
- compliance profiles

## Phase 4 — Policy Engine

- policy model
- conditions
- evaluator
- priority
- decision explanations
- simulator
- versioning

## Phase 5 — Private Access

- application registry
- application segments
- connector enrollment
- connector heartbeat
- connector selection
- access sessions

## Phase 6 — Security Gateway

- URL filtering
- DNS security
- secure web gateway
- request logging

## Phase 7 — Protection

- WAF
- API security
- DLP
- file inspection

## Phase 8 — Risk

- risk signals
- scoring
- adaptive access
- anomaly detection

## Phase 9 — SOC

- event pipeline
- Kafka
- correlation
- alerts
- incidents
- investigation timeline

## Phase 10 — Experience

- probes
- latency
- availability
- application health
- experience dashboard

## Phase 11 — Production Engineering

- Kubernetes
- Terraform
- secrets
- TLS
- HA
- autoscaling
- backups
- DR

## Phase 12 — Security Validation

- SAST
- DAST
- dependency scanning
- container scanning
- threat modeling
- penetration testing
- load testing

---

# 79. Recommended Final Stack

```text
Frontend
React
TypeScript
Vite
Tailwind
shadcn/ui
TanStack Query
Zustand
Recharts
Monaco

Backend
Python
FastAPI
Pydantic
SQLAlchemy
Alembic

Identity
Keycloak
OAuth2
OIDC
JWT
MFA

Data
PostgreSQL
Redis
Kafka

Security
OPA or custom policy engine
RBAC
ABAC
DLP
WAF
Risk Engine
Device Posture
Audit Logging

Networking
Nginx / Envoy
TLS
mTLS
HTTP/2
WebSockets

Observability
OpenTelemetry
Prometheus
Grafana
Loki
Tempo

Infrastructure
Docker
Kubernetes
Helm
Terraform

Cloud
AWS / Azure / GCP

CI/CD
GitHub Actions

Security Tooling
Trivy
Semgrep
Gitleaks
Bandit
OWASP ZAP
Syft
k6
```

---

# 80. Project Positioning for Resume

## Project

**ZeroTrustX — Enterprise Zero Trust Security & Private Application Access Platform**

### Resume description

> Designed and developed a cloud-native Zero Trust security platform implementing identity-aware application access, device posture verification, adaptive risk-based authorization, private application connectivity, secure web access, WAF/API protection, DLP, centralized security event processing and digital experience monitoring.

### Strong technical bullets

- Architected a full-stack Zero Trust platform using React, TypeScript, FastAPI, PostgreSQL, Redis, Kafka and Docker with separation of control, data and observability planes.
- Implemented policy-based private application access using RBAC/ABAC, device posture, risk scoring, application segmentation and connector-based traffic brokering.
- Built security services for URL/DNS filtering, DLP, WAF/API protection, adaptive access, audit logging and SOC-style incident management.
- Implemented real-time security telemetry, event correlation, alerting and digital experience monitoring using Kafka, OpenTelemetry, Prometheus and Grafana.
- Designed production deployment architecture using Kubernetes, Terraform, TLS/mTLS, secret management, health checks, autoscaling and CI/CD security gates.

---

# 81. How to Describe the Project in a Zscaler Interview

Use this wording:

> "I built an original Zero Trust security platform inspired by the architectural principles used in modern cloud-delivered security platforms. My focus was not on cloning a vendor product, but on understanding how identity, device posture, policy, risk and application-level access can work together. I separated the system into control, data and observability planes. The platform has a private application access layer with connectors, a secure web gateway, a policy engine, adaptive risk engine, DLP, application protection, centralized event processing and a SOC dashboard. I also designed the system for multi-tenancy, high availability, observability and Kubernetes deployment."

Then explain one request end-to-end.

---

# 82. Important Engineering Rule

Do not claim that this project is:

- Zscaler
- ZPA
- ZIA
- ZDX
- a replacement for Zscaler
- an implementation of Zscaler proprietary technology

Instead say:

> **"ZeroTrustX is an original implementation inspired by publicly documented Zero Trust architectural principles."**

That makes the project technically credible and ethically defensible.

---

# 83. Long-Term Extension Roadmap

Future versions can add:

- ML-based anomaly detection
- UEBA
- threat intelligence feeds
- sandbox integration
- malware analysis lab
- CASB-style SaaS controls
- browser isolation research module
- cloud workload protection
- Kubernetes workload identity
- service mesh integration
- eBPF telemetry
- confidential computing research
- post-quantum TLS experimentation

These should be added only after the core Zero Trust platform is stable.

---

# 84. Success Criteria

ZeroTrustX is successful when an evaluator can independently verify:

```text
A user cannot access a private application
without satisfying policy.

A compromised device loses access.

A user can access one authorized application
without gaining network-wide access.

Sensitive data can be detected and blocked.

Malicious web destinations can be blocked.

Security events appear in real time.

Alerts become incidents.

Administrators can investigate why
a request was allowed or denied.

Connector failure does not immediately
destroy application availability.

All security decisions are auditable.

The system can be deployed reproducibly.

The system can be tested automatically.
```

---

# 85. Final Vision

```text
                    ZERO TRUST EXCHANGE CONCEPT
                              |
       +----------------------+----------------------+
       |                      |                      |
    IDENTITY              DEVICE                 CONTEXT
       |                      |                      |
       +----------------------+----------------------+
                              |
                         RISK ENGINE
                              |
                       POLICY ENGINE
                              |
       +----------------------+----------------------+
       |                                             |
 PRIVATE APPLICATIONS                         INTERNET / SaaS
       |                                             |
 APP CONNECTOR                                WEB GATEWAY
       |                                             |
 APPLICATION PROTECTION                       DNS / URL SECURITY
       |                                             |
       +----------------------+----------------------+
                              |
                       SECURITY EVENTS
                              |
                  +-----------+-----------+
                  |                       |
               SOC/SIEM             EXPERIENCE
                  |                       |
              INCIDENTS               TELEMETRY
```

The final product should feel like a **security platform**, not a college CRUD application.

---

## License

Choose an appropriate open-source license if the repository will be public. Do not include third-party proprietary code or vendor-confidential material.

---

## Disclaimer

This project is an independent educational and engineering project. It is not affiliated with, sponsored by, or endorsed by Zscaler. Vendor names and architectural concepts mentioned in documentation are used only to explain publicly documented security concepts and design inspiration.
