# Changelog

All notable changes to the ZeroTrustX project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2026-10-06

### Added
- **Full-Stack Zero Trust Control Plane:**
  - Multi-tenant architecture with automatic database scoping and audit tracking.
  - Identity & Access Management with RBAC, ABAC, TOTP MFA, and session tokens.
  - Zero Trust Policy Engine with priority ordering, first-match rules, and dry-run policy simulator.
  - Device Posture Engine evaluating disk encryption, firewall, antivirus, and compliance profiles.
  - Adaptive Risk Engine dynamically computing threat scores across context signals.
- **Private Application Access (ZPA Alternative):**
  - Application segments registry for internal microservices (Git, HR, Finance, Admin API).
  - Outbound App Connector Controller with health heartbeats, certificates, and automatic failover.
  - Mock isolated private applications accessible exclusively through authorized connector broker tunnels.
- **Secure Web Gateway & DNS Security:**
  - URL filtering, category inspection, reputation scoring, and DNS query interceptor.
- **Application Protection & WAF:**
  - Core security filters for SQL Injection, Cross-Site Scripting (XSS), Path Traversal, and Command Injection.
- **Data Loss Prevention (DLP):**
  - High-precision detectors for Credit Cards (Luhn), SSN, Cloud API Keys, and sensitive employee data with automatic redaction and blocking.
- **Security Analytics & Incident Response:**
  - Centralized security event pipeline with real-time SSE streaming.
  - Threat correlation rules grouping repeated login failures and DLP triggers into high-confidence incidents.
  - Full SOC dashboard with analyst timeline and evidence repository.
- **Digital Experience Monitoring (DEM):**
  - Telemetry probes for DNS, TCP, TLS, and HTTP latency tracking and anomaly alerts.
- **Modern Web Console:**
  - Complete React 18 / TypeScript / Vite / Tailwind SPA featuring 25+ administrative screens, Monaco-powered Policy Playground, Attack Simulation Lab, and Alice's Interactive Demo Scenario.
