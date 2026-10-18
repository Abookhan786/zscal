import React from 'react';
import {
  Shield,
  Activity,
  Users,
  Laptop,
  KeyRound,
  Layers,
  Radio,
  FileText,
  Globe,
  Lock,
  FileSearch,
  AlertTriangle,
  Gauge,
  Terminal,
  Flame,
  History,
  CheckCircle2,
  Server
} from 'lucide-react';

export type NavItem =
  | 'overview'
  | 'scenario'
  | 'attack_lab'
  | 'policies'
  | 'playground'
  | 'applications'
  | 'connectors'
  | 'devices'
  | 'web_security'
  | 'waf'
  | 'dlp'
  | 'risk'
  | 'incidents'
  | 'experience'
  | 'events'
  | 'users'
  | 'audit';

interface SidebarProps {
  currentTab: NavItem;
  onSelectTab: (tab: NavItem) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentTab, onSelectTab }) => {
  const sections = [
    {
      label: 'VERIFICATION LABS',
      items: [
        { id: 'scenario' as NavItem, label: "Alice's Story (Sec 77)", icon: CheckCircle2, badge: 'Demo' },
        { id: 'attack_lab' as NavItem, label: 'Attack Simulator (Sec 52)', icon: Flame, badge: 'RedTeam' },
      ],
    },
    {
      label: 'CONTROL PLANE & SOC',
      items: [
        { id: 'overview' as NavItem, label: 'Executive SOC Overview', icon: Activity },
        { id: 'events' as NavItem, label: 'Live Event Pipeline', icon: Terminal, pulse: true },
        { id: 'incidents' as NavItem, label: 'Incidents & Evidence', icon: AlertTriangle },
        { id: 'experience' as NavItem, label: 'Digital Experience (DEM)', icon: Gauge },
      ],
    },
    {
      label: 'ZERO TRUST ENGINES',
      items: [
        { id: 'policies' as NavItem, label: 'Policy Engine', icon: KeyRound },
        { id: 'playground' as NavItem, label: 'Policy Playground', icon: Terminal, badge: 'Live' },
        { id: 'risk' as NavItem, label: 'Adaptive Risk Engine', icon: Shield },
        { id: 'dlp' as NavItem, label: 'Data Loss Prevention', icon: FileSearch },
        { id: 'waf' as NavItem, label: 'WAF & API Protection', icon: Lock },
        { id: 'web_security' as NavItem, label: 'Secure Web & DNS', icon: Globe },
      ],
    },
    {
      label: 'ACCESS & INVENTORY',
      items: [
        { id: 'applications' as NavItem, label: 'Private Apps (ZPA)', icon: Layers },
        { id: 'connectors' as NavItem, label: 'App Connectors', icon: Radio },
        { id: 'devices' as NavItem, label: 'Endpoints & Posture', icon: Laptop },
        { id: 'users' as NavItem, label: 'Identity & Roles', icon: Users },
        { id: 'audit' as NavItem, label: 'Audit Logs & Reports', icon: History },
      ],
    },
  ];

  return (
    <aside
      style={{
        width: '270px',
        minWidth: '270px',
        backgroundColor: '#0a0f1d',
        borderRight: '1px solid #1e293b',
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        position: 'sticky',
        top: 0,
        zIndex: 40,
      }}
    >
      {/* Brand Header */}
      <div
        style={{
          padding: '20px 18px',
          borderBottom: '1px solid #1e293b',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
        }}
      >
        <div
          style={{
            width: '38px',
            height: '38px',
            borderRadius: '10px',
            background: 'linear-gradient(135deg, #06b6d4 0%, #3b82f6 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 0 16px rgba(6, 182, 212, 0.4)',
          }}
        >
          <Shield size={22} color="#ffffff" />
        </div>
        <div>
          <div style={{ fontSize: '17px', fontWeight: 800, letterSpacing: '-0.02em', color: '#f8fafc' }}>
            ZeroTrust<span style={{ color: '#06b6d4' }}>X</span>
          </div>
          <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 500 }}>
            Enterprise Security Plane
          </div>
        </div>
      </div>

      {/* Navigation Links */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '14px 10px' }}>
        {sections.map((section, idx) => (
          <div key={idx} style={{ marginBottom: '18px' }}>
            <div
              style={{
                fontSize: '10px',
                fontWeight: 700,
                color: '#64748b',
                letterSpacing: '0.08em',
                padding: '4px 10px 8px 10px',
              }}
            >
              {section.label}
            </div>
            {section.items.map((item) => {
              const active = currentTab === item.id;
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => onSelectTab(item.id)}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    background: active ? 'rgba(6, 182, 212, 0.12)' : 'transparent',
                    border: active ? '1px solid rgba(6, 182, 212, 0.3)' : '1px solid transparent',
                    color: active ? '#38bdf8' : '#94a3b8',
                    fontWeight: active ? 600 : 500,
                    fontSize: '13px',
                    cursor: 'pointer',
                    marginBottom: '2px',
                    transition: 'all 0.15s ease',
                    textAlign: 'left',
                  }}
                  onMouseEnter={(e) => {
                    if (!active) {
                      e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.04)';
                      e.currentTarget.style.color = '#f1f5f9';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!active) {
                      e.currentTarget.style.backgroundColor = 'transparent';
                      e.currentTarget.style.color = '#94a3b8';
                    }
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <Icon size={16} color={active ? '#06b6d4' : '#64748b'} />
                    <span>{item.label}</span>
                  </div>
                  {item.badge && (
                    <span
                      style={{
                        fontSize: '10px',
                        fontWeight: 700,
                        padding: '1px 6px',
                        borderRadius: '4px',
                        backgroundColor: item.badge === 'Demo' ? '#06b6d4' : '#f43f5e',
                        color: '#ffffff',
                      }}
                    >
                      {item.badge}
                    </span>
                  )}
                  {item.pulse && (
                    <span
                      style={{
                        width: '6px',
                        height: '6px',
                        borderRadius: '50%',
                        backgroundColor: '#10b981',
                        boxShadow: '0 0 8px #10b981',
                      }}
                    />
                  )}
                </button>
              );
            })}
          </div>
        ))}
      </div>

      {/* Cluster Footer Info */}
      <div
        style={{
          padding: '14px 16px',
          borderTop: '1px solid #1e293b',
          backgroundColor: '#070b14',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
        }}
      >
        <Server size={18} color="#06b6d4" />
        <div style={{ fontSize: '11px' }}>
          <div style={{ color: '#cbd5e1', fontWeight: 600 }}>Acme Corp Tenant</div>
          <div style={{ color: '#10b981', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#10b981' }} />
            Control Plane 1.0.0
          </div>
        </div>
      </div>
    </aside>
  );
};
