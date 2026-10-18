import React, { useEffect, useState } from 'react';
import {
  Shield,
  Users,
  Laptop,
  Layers,
  AlertTriangle,
  Radio,
  FileSearch,
  Lock,
  ArrowUpRight,
  TrendingDown,
  TrendingUp,
  Download
} from 'lucide-react';
import { api } from '../services/api';
import { StatusBadge } from '../components/StatusBadge';
import { SecurityEvent } from '../types';

export const OverviewPage: React.FC = () => {
  const [events, setEvents] = useState<SecurityEvent[]>([]);
  const [apps, setApps] = useState<any[]>([]);
  const [connectors, setConnectors] = useState<any[]>([]);
  const [riskData, setRiskData] = useState<any>(null);
  const [devices, setDevices] = useState<any[]>([]);

  useEffect(() => {
    loadData();
    // Connect to SSE Security Event Stream
    const eventSource = new EventSource('http://localhost:8000/api/v1/events/stream');
    eventSource.onmessage = (e) => {
      try {
        const parsed = JSON.parse(e.data);
        if (parsed.event_type && parsed.event_type !== 'CONNECTED') {
          setEvents((prev) => [parsed, ...prev.slice(0, 19)]);
        }
      } catch (err) {
        // Ping or malformed
      }
    };

    return () => {
      eventSource.close();
    };
  }, []);

  const loadData = async () => {
    try {
      const [evList, appList, connList, riskRes, devList] = await Promise.all([
        api.getEvents(),
        api.getApplications(),
        api.getConnectors(),
        api.getRiskOverview(),
        api.getDevices(),
      ]);
      setEvents(evList.slice(0, 15));
      setApps(appList);
      setConnectors(connList);
      setRiskData(riskRes);
      setDevices(devList);
    } catch (err) {
      console.error('Failed to load overview data:', err);
    }
  };

  const statCards = [
    {
      title: 'Protected Users',
      value: '4 Staff',
      sub: '100% MFA Enforced',
      icon: Users,
      color: '#06b6d4',
      trend: '+12% this mo',
    },
    {
      title: 'Managed Endpoints',
      value: `${devices.length} Devices`,
      sub: '3 Compliant / 1 Rogue',
      icon: Laptop,
      color: '#10b981',
      trend: 'Compliant 75%',
    },
    {
      title: 'Private Applications',
      value: `${apps.length} Apps`,
      sub: 'Zero Exposed Inbound Ports',
      icon: Layers,
      color: '#8b5cf6',
      trend: 'Outbound Brokered',
    },
    {
      title: 'Active App Connectors',
      value: `${connectors.filter((c) => c.status === 'ONLINE').length}/${connectors.length} Online`,
      sub: 'Chennai-DC & US-East-1',
      icon: Radio,
      color: '#f59e0b',
      trend: 'HA Redundant',
    },
  ];

  return (
    <div style={{ padding: '24px', maxWidth: '1400px', margin: '0 auto' }}>
      {/* Metrics Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' }}>
        {statCards.map((c, i) => {
          const Icon = c.icon;
          return (
            <div key={i} className="glass-panel" style={{ padding: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                <span style={{ fontSize: '13px', fontWeight: 600, color: '#94a3b8' }}>{c.title}</span>
                <div
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '8px',
                    backgroundColor: `${c.color}20`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Icon size={18} color={c.color} />
                </div>
              </div>
              <div style={{ fontSize: '24px', fontWeight: 800, color: '#f8fafc', marginBottom: '4px' }}>
                {c.value}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '11px' }}>
                <span style={{ color: '#64748b' }}>{c.sub}</span>
                <span style={{ color: c.color, fontWeight: 600 }}>{c.trend}</span>
              </div>
            </div>
          );
        })}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 420px', gap: '20px' }}>
        {/* Real-time Security Event Pipeline Feed */}
        <div className="glass-panel" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#f8fafc' }}>
                  Real-Time Security Event Pipeline
                </h3>
                <span
                  style={{
                    backgroundColor: 'rgba(16, 185, 129, 0.2)',
                    color: '#34d399',
                    fontSize: '10px',
                    fontWeight: 700,
                    padding: '2px 6px',
                    borderRadius: '4px',
                  }}
                >
                  LIVE SSE
                </span>
              </div>
              <p style={{ fontSize: '12px', color: '#64748b' }}>
                Normalized security events streaming from Gateways, App Connectors, WAF, and Posture Agents.
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '480px', overflowY: 'auto' }}>
            {events.map((ev, i) => (
              <div
                key={ev.id || i}
                style={{
                  padding: '12px 14px',
                  backgroundColor: '#0c111e',
                  borderRadius: '8px',
                  border: '1px solid #1e293b',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <StatusBadge status={ev.severity} size="sm" />
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '13px', fontWeight: 700, color: '#f8fafc' }}>
                        {ev.event_type}
                      </span>
                      {ev.application && (
                        <span style={{ fontSize: '11px', color: '#06b6d4', fontWeight: 500 }}>
                          [{ev.application}]
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px' }}>
                      {ev.reason || 'Telemetry recorded'}
                    </div>
                  </div>
                </div>

                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <div style={{ fontSize: '11px', color: '#64748b' }}>
                    {ev.username || 'System'}
                  </div>
                  <div style={{ fontSize: '10px', color: '#475569' }}>
                    {ev.timestamp ? new Date(ev.timestamp).toLocaleTimeString() : 'Just now'}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Private Applications Status & Risk Summary */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Applications list */}
          <div className="glass-panel" style={{ padding: '20px' }}>
            <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#f8fafc', marginBottom: '14px' }}>
              Protected Private Applications
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {apps.map((a) => (
                <div
                  key={a.id}
                  style={{
                    padding: '10px 12px',
                    backgroundColor: '#0c111e',
                    border: '1px solid #1e293b',
                    borderRadius: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: 600, color: '#f8fafc' }}>{a.name}</div>
                    <div style={{ fontSize: '11px', color: '#64748b' }}>{a.domain}:{a.port}</div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <StatusBadge status={a.sensitivity} size="sm" />
                    <StatusBadge status={a.status} size="sm" />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Compliance Export */}
          <div className="glass-panel" style={{ padding: '20px' }}>
            <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#f8fafc', marginBottom: '8px' }}>
              Compliance & Audit Export
            </h3>
            <p style={{ fontSize: '12px', color: '#64748b', marginBottom: '14px' }}>
              Instant PDF/CSV export for SOC 2 Type II and ISO 27001 audit readiness.
            </p>
            <div style={{ display: 'flex', gap: '8px' }}>
              <a
                href={api.generateReport('executive', 'json')}
                target="_blank"
                rel="noreferrer"
                className="btn-secondary"
                style={{ fontSize: '12px', padding: '6px 12px', textDecoration: 'none' }}
              >
                <Download size={14} /> Executive JSON
              </a>
              <a
                href={api.generateReport('access', 'csv')}
                target="_blank"
                rel="noreferrer"
                className="btn-secondary"
                style={{ fontSize: '12px', padding: '6px 12px', textDecoration: 'none' }}
              >
                <Download size={14} /> Access CSV
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
