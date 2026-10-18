import React, { useState } from 'react';
import { Sidebar, NavItem } from './components/Sidebar';
import { Header } from './components/Header';
import { OverviewPage } from './pages/OverviewPage';
import { ScenarioPage } from './pages/ScenarioPage';
import { AttackLabPage } from './pages/AttackLabPage';
import { PoliciesPage } from './pages/PoliciesPage';
import { PolicyPlaygroundPage } from './pages/PolicyPlaygroundPage';
import { ApplicationsPage } from './pages/ApplicationsPage';
import { ConnectorsPage } from './pages/ConnectorsPage';
import { DevicesPage } from './pages/DevicesPage';
import { WebSecurityPage } from './pages/WebSecurityPage';
import { WAFPage } from './pages/WAFPage';
import { DLPPage } from './pages/DLPPage';
import { RiskPage } from './pages/RiskPage';
import { IncidentsPage } from './pages/IncidentsPage';
import { ExperiencePage } from './pages/ExperiencePage';
import { EventsPage } from './pages/EventsPage';
import { UsersPage } from './pages/UsersPage';
import { AuditPage } from './pages/AuditPage';

const VIEW_METADATA: Record<NavItem, { title: string; subtitle: string }> = {
  overview: {
    title: 'Executive SOC & Zero Trust Overview',
    subtitle: 'Central command plane aggregating endpoint trust, threat intelligence, and private access telemetry.',
  },
  scenario: {
    title: "Alice's End-to-End Verification Scenario",
    subtitle: 'Interactive 8-step walkthrough matching Section 77 of the ZeroTrustX specification.',
  },
  attack_lab: {
    title: 'Adversary Simulation Lab',
    subtitle: 'Section 52: Controlled red-team test harness verifying automated defensive mitigations.',
  },
  policies: {
    title: 'Zero Trust Authorization Policies',
    subtitle: 'Manage priority-ordered ABAC/RBAC policy rules with explicit deny precedence.',
  },
  playground: {
    title: 'Policy Playground & Rule Simulator',
    subtitle: 'Test contextual attributes against live policy trees and inspect deterministic evaluation traces.',
  },
  applications: {
    title: 'Private Application Segments (ZPA)',
    subtitle: 'Zero-exposure enterprise microservices accessible exclusively through authorized connector broker tunnels.',
  },
  connectors: {
    title: 'App Connector Mesh & Failover',
    subtitle: 'Outbound mTLS broker nodes ensuring high availability across Chennai-DC and US-East-1.',
  },
  devices: {
    title: 'Device Posture & Endpoint Trust',
    subtitle: 'Continuous health monitoring of host firewalls, disk encryption, antivirus, and patch compliance.',
  },
  web_security: {
    title: 'Secure Web Gateway & DNS Security',
    subtitle: 'URL filtering, domain reputation scoring, and DNS sinkhole threat protection.',
  },
  waf: {
    title: 'Application Protection & WAF',
    subtitle: 'OWASP Core Rule Set-aligned inspection for SQLi, XSS, Path Traversal, and API abuse.',
  },
  dlp: {
    title: 'Data Loss Prevention (DLP)',
    subtitle: 'Continuous inspection for payment cards (Luhn validated), credentials, and corporate secrets.',
  },
  risk: {
    title: 'Adaptive Risk Engine',
    subtitle: 'Dynamic scoring (0-100) combining login anomalies, posture drift, and threat signals.',
  },
  incidents: {
    title: 'SOC Incident Management & Evidence',
    subtitle: 'Correlated multi-signal security incidents, forensic evidence artifacts, and containment triage.',
  },
  experience: {
    title: 'Digital Experience Monitoring (DEM)',
    subtitle: 'Decomposed synthetic latency tracking across DNS, TCP, TLS, and HTTP response paths.',
  },
  events: {
    title: 'Security Event Pipeline',
    subtitle: 'Real-time SSE event bus streaming logins, denials, DLP detections, and WAF blocks.',
  },
  users: {
    title: 'Identity Store & User Directory',
    subtitle: 'Enterprise user directory, MFA TOTP states, department roles, and account lockout status.',
  },
  audit: {
    title: 'Audit Logs & Governance Exports',
    subtitle: 'Append-only administrative actions and one-click JSON/CSV regulatory reports.',
  },
};

export const App: React.FC = () => {
  const [currentTab, setCurrentTab] = useState<NavItem>('overview');

  const meta = VIEW_METADATA[currentTab] || {
    title: 'ZeroTrustX Platform',
    subtitle: 'Enterprise Zero Trust Security Plane',
  };

  const renderContent = () => {
    switch (currentTab) {
      case 'overview':
        return <OverviewPage />;
      case 'scenario':
        return <ScenarioPage />;
      case 'attack_lab':
        return <AttackLabPage />;
      case 'policies':
        return <PoliciesPage />;
      case 'playground':
        return <PolicyPlaygroundPage />;
      case 'applications':
        return <ApplicationsPage />;
      case 'connectors':
        return <ConnectorsPage />;
      case 'devices':
        return <DevicesPage />;
      case 'web_security':
        return <WebSecurityPage />;
      case 'waf':
        return <WAFPage />;
      case 'dlp':
        return <DLPPage />;
      case 'risk':
        return <RiskPage />;
      case 'incidents':
        return <IncidentsPage />;
      case 'experience':
        return <ExperiencePage />;
      case 'events':
        return <EventsPage />;
      case 'users':
        return <UsersPage />;
      case 'audit':
        return <AuditPage />;
      default:
        return <OverviewPage />;
    }
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#070a12' }}>
      <Sidebar currentTab={currentTab} onSelectTab={setCurrentTab} />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <Header
          title={meta.title}
          subtitle={meta.subtitle}
          onRunDemo={() => setCurrentTab('scenario')}
        />
        <main style={{ flex: 1, overflowY: 'auto' }}>
          {renderContent()}
        </main>
      </div>
    </div>
  );
};

export default App;
