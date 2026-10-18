# ZeroTrustX: 30 Architectural & Interview Design Answers

This document provides exhaustive, production-grade answers to all 30 architectural questions defined in Section 74 of the ZeroTrustX specification.

---

### 1. Why is Zero Trust different from VPN?
Traditional VPNs authenticate a user at the perimeter and grant them an IP address on the internal corporate network (Layer 3/4 network extension). Once inside, the security boundary is effectively dissolved, enabling unrestricted lateral movement to any reachable internal IP or subnet.
In contrast, **ZeroTrustX implements Application-Level Segmentation (Layer 7)**. Users are never connected to the network; they are connected strictly to specific, authorized applications through identity, posture, and policy-brokered micro-tunnels. Even if an attacker compromises a user's credential, they cannot scan or access any internal asset not explicitly granted by an active policy rule.

### 2. Why should private applications not be publicly reachable?
Exposing internal applications directly to the public Internet with open inbound ports exposes them to:
- Port scans and automated reconnaissance (e.g., Shodan, Censys).
- Zero-day vulnerabilities in web servers or software frameworks before patches can be applied.
- Direct Distributed Denial of Service (DDoS) and brute-force credential stuffing.
By hiding private applications behind an outbound-only broker mesh, the applications become completely invisible ("dark") to the public Internet, removing external attack surfaces.

### 3. How does an App Connector work?
An App Connector is a lightweight software daemon deployed in close network proximity to internal private applications (e.g., in a private AWS VPC subnet or on-premise datacenter).
- It initiates and maintains a persistent, encrypted outbound mTLS tunnel to the ZeroTrustX Control / Access Plane.
- When an authorized client makes an application request, the Control Plane brokers the session to the Connector over this existing outbound tunnel.
- The Connector then initiates a local TCP/HTTP connection to the private target application and relays the encrypted payload back to the broker.

### 4. Why use outbound connections?
Outbound-only connections eliminate the need to open any inbound firewall ports or configure static public IPs and NAT port-forwarding on internal firewalls. Corporate firewalls naturally permit stateful outbound traffic over port 443. This prevents inbound scanning and simplifies enterprise deployments across multicloud and hybrid environments without violating network security baselines.

### 5. How does policy evaluation work?
The ZeroTrustX Policy Engine evaluates access requests using a **deterministic priority-ordered evaluation algorithm**:
1. Incoming context is assembled: Subject identity (Role, Department, Groups), Endpoint state (Managed, Posture, Compliance), Target application (Sensitivity, Domain), and Real-time context (Dynamic risk score, Geolocation, Network).
2. Policies are sorted in ascending priority order (priority 10 evaluated before priority 100).
3. First-match evaluation is applied: the first policy whose criteria completely match determines the action (`ALLOW`, `DENY`, `STEP_UP_MFA`).
4. Strict precedence: Emergency quarantine or high-risk deny rules (low priority numbers) execute first. If no explicit rule matches, an implicit **Default Zero Trust Deny All** applies.

### 6. How does RBAC differ from ABAC?
- **Role-Based Access Control (RBAC):** Access decisions are determined purely by assigned roles (e.g., "Developer" can access Git). RBAC is static and cannot evaluate real-time environmental context.
- **Attribute-Based Access Control (ABAC):** Access decisions evaluate multidimensional attributes of the subject, resource, action, and environment (e.g., "Developer" can access Git ONLY IF "device is managed", "firewall is active", "disk is encrypted", and "current risk score is below 50").
ZeroTrustX combines RBAC within an ABAC engine to achieve context-aware dynamic authorization.

### 7. Why is device posture important?
Valid credentials can be stolen via phishing, infostealers, or session hijacking. If an attacker uses legitimate credentials from an unmanaged, jailbroken, or malware-infected endpoint, standard authentication succeeds.
Evaluating device posture (firewall state, active antivirus, full-disk encryption, OS patch levels, valid device mTLS certificates) ensures that the endpoint processing enterprise data meets enterprise hygiene standards, stopping credential reuse from unmanaged or compromised machines.

### 8. How is risk calculated?
ZeroTrustX calculates risk dynamically using a weighted signal pipeline:
- **Base Risk:** 10 points.
- **Device Drift Signals:** Unmanaged BYOD (+25), disabled firewall (+20), disabled antivirus (+20), unencrypted disk (+15), invalid device cert (+25).
- **Behavioral Signals:** Repeated failed login attempts (+10 per attempt), impossible travel / geolocation anomalies (+25), suspicious URL visits (+20).
- **Data Risk Signals:** DLP exfiltration violation (+40), WAF attack trigger (+35).
Scores are clamped between 0 and 100 and mapped to risk bands: `LOW` (0-30), `MEDIUM` (31-60), `HIGH` (61-80), `CRITICAL` (81-100).

### 9. How do you prevent lateral movement?
1. Micro-segmentation down to individual application domains (`git.internal`, `finance.internal`) rather than IP subnets.
2. The user client never receives an internal IP or direct TCP socket to adjacent services.
3. Every private transaction is isolated inside a brokered micro-tunnel terminated at the connector. Even if a developer endpoint is compromised, the attacker cannot reach the Finance or HR systems because the policy engine strictly denies cross-segment brokering.

### 10. How does DLP work?
The DLP engine inspects data in transit (HTTP uploads, file attachments, API payloads). It applies multi-stage inspection:
- Regular expressions for structured formats (US SSNs, AWS Access Keys, RSA private keys).
- Mathematical algorithmic validation (Luhn checksum for credit cards) to eliminate false positives.
- Policy enforcement: Depending on configuration, it triggers `BLOCK` (drop transaction and open SOC incident), `REDACT` (mask sensitive digits with XXXX), `WARN`, or `LOG`.

### 11. How does WAF work?
The Web Application Firewall (WAF) inspects HTTP requests before they reach backend application logic. It tokenizes and analyzes URI paths, query parameters, headers, and request bodies against OWASP Core Rule Set patterns:
- SQL Injection (statement chaining, boolean tautologies, `UNION SELECT`).
- Cross-Site Scripting (`<script>`, inline handlers, DOM manipulation).
- Directory Traversal (`../`, `/etc/passwd`).
- Command Injection (`|`, `;`, `&&` chained shell binaries).
Matches trigger an immediate 403 Forbidden, log a `WAF_BLOCK` security event, and elevate the client's real-time risk score.

### 12. How do you secure service-to-service communication?
1. Mutual TLS (mTLS) with short-lived X.509 certificates issued by an internal CA.
2. Encrypted TLS 1.3 in transit with forward secrecy.
3. Service identities attested via Kubernetes ServiceAccounts and SPIFFE/SPIRE IDs.
4. Network Policies restricting pod-to-pod communication across namespaces.

### 13. How do you isolate tenants?
1. Every database table includes an indexed `tenant_id` column.
2. In the API layer, tenant context is extracted exclusively from cryptographic JWT claims validated on the server, never from client-controlled request bodies or headers.
3. Database queries enforce tenant scoping at the repository level.
4. Redis caches and event queues use namespaced keys (`tenant:{id}:*`).

### 14. How do you handle connector failure?
Connectors are organized into redundant **Connector Groups** (e.g., `Chennai-DC`, `US-East-1`).
- Connectors emit periodic heartbeats every 10 seconds.
- The Controller tracks connector latency, CPU, and liveness. If heartbeats stop for > 30 seconds or an administrator injects a failure, the status changes to `OFFLINE`.
- The Private Access Gateway's load-balancing algorithm immediately fails over active and pending sessions to alternative healthy online nodes in the group without service disruption.

### 15. How do you scale event ingestion?
1. Asynchronous event ingestion via Kafka topics partitioned by `tenant_id`.
2. Dedicated consumer worker pools handle normalization, enrichment, and threat correlation independently from the synchronous API request path.
3. Real-time dashboard streaming uses non-blocking async Server-Sent Events (SSE) or WebSockets.

### 16. Why Kafka?
Security platforms generate massive volumes of telemetry (DNS lookups, access attempts, proxy requests, posture updates). Putting every log in synchronous HTTP requests would cause intolerable latency. Kafka provides high-throughput, partitioned, durable append-only streaming, allowing multiple decoupled consumers (SIEM, Alerting, Telemetry, Long-term cold storage) to process events at their own pace without dropping records.

### 17. Why Redis?
Zero Trust authorization decisions require ultra-low latency (<10ms). Redis provides in-memory data structures for:
- Fast session validation and token blocklists.
- Sliding-window rate limiting per IP and user.
- Real-time connector heartbeat tracking and distributed locking.
- Caching compiled policy decision trees.

### 18. How do you prevent authorization bypass?
- Centralized policy enforcement point (PEP) that wraps all access gateways.
- All authorization decisions are computed server-side from attested identity claims; never trust client-supplied headers like `X-User-Role` or `X-Tenant-Id`.
- Automated regression test suites asserting that unauthorized role/app combinations strictly fail closed.

### 19. How do you protect JWTs?
- Signed with asymmetric algorithms (RS256/ES256) or strong 256-bit secret keys.
- Short expiration times (e.g., 60-120 minutes) paired with rotating refresh tokens stored in HTTP-only, Secure, SameSite cookies.
- Cryptographic audience (`aud`) and issuer (`iss`) claim validation.
- Centralized token revocation blocklists in Redis for immediate session termination.

### 20. How do you design High Availability (HA)?
- Horizontal scaling: Multiple stateless replicas of the Control Plane API Gateway behind an Application Load Balancer.
- Connector Groups: N+1 redundancy across availability zones.
- Multi-AZ PostgreSQL with automated failover and read replicas.
- Distributed Redis clustering and multi-broker Kafka partitions.

### 21. How do you perform disaster recovery?
- Continuous WAL-based Point-In-Time Recovery (PITR) for PostgreSQL with an RPO target of 15 minutes.
- Automated daily database snapshots replicated to geographically distant S3 buckets.
- Infrastructure defined 100% as code (Terraform & Helm), enabling complete cluster recreation in a secondary region within an RTO target of 60 minutes.

### 22. How do you detect compromised devices?
- Continuous endpoint telemetry rather than one-time login checks.
- Sudden posture drift: Firewall or antivirus disabled after session establishment.
- Impossible travel (login from New York followed 10 minutes later by access from London).
- Abnormal high-volume data exfiltration or repeated access attempts against unauthorized resources triggering correlation rules.

### 23. How do you investigate a security incident?
1. The SOC analyst reviews the Incident Overview (Severity, Title, Summary, Affected User, and Device).
2. Inspect the chronological Security Event Timeline to identify the root trigger.
3. Review attached Evidence Artifacts (redacted DLP text snippet, WAF request payload, posture diff).
4. Execute Containment: Quarantining the device, forcing token revocation, or locking the user.
5. Record Analyst Notes and transition status from `INVESTIGATING` to `CONTAINED` and `RESOLVED`.

### 24. How do you prevent policy misconfiguration?
- Policy Versioning: Every change creates an immutable `PolicyVersion` snapshot with author attribution and change rationale.
- Dry-run Simulation: The Policy Simulator allows administrators to test rules against mock users and devices before deployment.
- Strict Syntax Compilation: Conditions are validated against schemas to prevent syntax errors.

### 25. How do you test security policies?
- Automated unit test suites covering positive and negative access matrix paths.
- The interactive **Policy Playground** in the management console, evaluating live context against active rules and displaying step-by-step match/no-match trace trees.

### 26. How do you monitor application experience?
Through synthetic Digital Experience Monitoring (DEM) probes:
- Decomposed latency metrics: DNS lookup time, TCP connection handshake, TLS negotiation, and HTTP time-to-first-byte (TTFB).
- Continuous tracking of packet loss and availability percentages.
- Automated anomaly detection triggering `LATENCY_ALERT` notifications when TTFB exceeds baseline thresholds.

### 27. How do you protect the control plane?
- Control plane APIs are protected by strict rate-limiting, WAF filtering, and mutual authentication.
- Administrative endpoints require MFA and `SECURITY_ADMIN` or `SUPER_ADMIN` role validation.
- All control plane actions generate immutable append-only `AuditLog` records.

### 28. How do you secure Kubernetes?
- Namespaced network isolation with default-deny Kubernetes NetworkPolicies.
- Running containers as non-root with read-only root filesystems and dropped Linux capabilities.
- RBAC with least privilege for ServiceAccounts.
- Automated vulnerability scanning of container images in the CI pipeline using Trivy.

### 29. How do you manage secrets?
- Secrets are never checked into Git.
- In production, secrets are managed through HashiCorp Vault, AWS Secrets Manager, or Kubernetes Secrets injected as environment variables at runtime.
- Periodic secret rotation for database passwords and JWT signing keys.

### 30. How do you prevent sensitive information from entering logs?
- Structured logging with built-in redaction middleware.
- Passwords, raw JWT tokens, API keys, and credit card numbers are masked or omitted prior to logging.
- DLP inspection of exported reports to verify data minimization.
