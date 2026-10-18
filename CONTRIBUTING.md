# Contributing to ZeroTrustX

Thank you for your interest in contributing to ZeroTrustX!

## Development Guidelines

1. **Architecture Separation:**
   - Always maintain strict separation between the **Control Plane** (Policy, Identity, Risk, Admin), the **Data Plane** (Gateways, App Connectors, WAF, DLP), and the **Observability Plane** (Telemetry, Events, DEM).
2. **Coding Standards:**
   - Backend: Python 3.11+, typed with Pydantic schemas, asynchronous FastAPI endpoints, SQLAlchemy ORM with multi-tenancy `tenant_id` guarantees.
   - Frontend: React 18+, TypeScript, Tailwind CSS, clean modular component architecture.
3. **Security Standards:**
   - Never trust client-supplied tenant IDs, roles, risk scores, or posture evaluations. All trust parameters must be validated server-side.
   - Every sensitive administrative action must be appended to the immutable audit log.
4. **Testing:**
   - Unit tests for all policy rules, DLP detectors, and risk scoring calculators.
   - Integration tests verifying multi-service request flows.
   - Run tests with `pytest` and `npm test`.

## Submission Process

1. Fork the repository and create your feature branch: `git checkout -b feature/my-feature`
2. Commit your changes following conventional commits: `git commit -m "feat(waf): add rate abuse detector"`
3. Push to the branch: `git push origin feature/my-feature`
4. Submit a Pull Request with a clear description and testing evidence.
