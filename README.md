# ZeroTrustX
## Enterprise-Grade Zero Trust Security, Secure Web Access & Private Application Access Platform

ZeroTrustX is a full-stack, cloud-native Zero Trust security platform that provides identity-aware private application access, secure web access, device posture evaluation, adaptive risk scoring, policy-based authorization, application protection (WAF), DLP, security analytics, digital experience monitoring, centralized administration, auditability, and SOC workflows.

> **Architectural Note:** An original, production-oriented security platform inspired by the architectural principles of modern Zero Trust / Security Service Edge platforms. It is not affiliated with, sponsored by, or endorsed by any vendor.

---

### Quick Start

#### Option 1: Native Local Development (Fastest)

1. **Install Backend Dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

2. **Start the ZeroTrustX Control Plane & Services Gateway:**
   ```bash
   python main.py
   ```
   *The API Gateway and all security engines will start at `http://localhost:8000` with interactive Swagger docs at `http://localhost:8000/docs`.*

3. **Start the Web Management Console:**
   ```bash
   cd apps/web-console
   npm install
   npm run dev
   ```
   *The dashboard will start at `http://localhost:5173`.*

4. **Run the Endpoint Agent (Optional simulation):**
   ```bash
   cd apps/endpoint-agent
   python -m src.agent
   ```

#### Option 2: Docker Compose

```bash
docker compose -f infrastructure/docker/docker-compose.dev.yml up --build
```

---

### Platform Highlights

- **Identity & Posture-Aware Access:** Continuous verification of user identity, MFA, and device health (encryption, firewall, antivirus).
- **Dual Policy Engine:** RBAC & ABAC evaluation with priority ordering, explicit deny precedence, dry-run simulation, and live rule playground.
- **Adaptive Risk Engine:** Context-aware real-time risk scoring evaluating login anomalies, posture drift, threat intel, and DLP triggers.
- **Private Access & App Connectors:** Zero-exposure private application access via reverse outbound tunnels.
- **App Protection & WAF:** OWASP Core Rule Set-inspired detection for SQLi, XSS, Path Traversal, and API abuse.
- **Enterprise DLP Engine:** High-performance detection & redaction for PII, PCI-DSS, cloud credentials, and private keys.
- **Digital Experience Monitoring (DEM):** Synthetic probes measuring DNS, TCP, TLS, and HTTP response latencies.
- **SOC & Incident Management:** Correlation pipeline transforming multi-source alerts into actionable incidents with evidence timelines.
- **Scenario Simulator:** Step-by-step walkthrough of Alice's developer journey matching the project verification narrative.

For detailed architecture, design decisions, and interview preparation, see `ZeroTrustX_README.md` and the `docs/` folder.
