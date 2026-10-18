import React, { useEffect, useState } from 'react';
import { Layers, Radio, Lock, ShieldCheck, Play, ArrowRight, ExternalLink } from 'lucide-react';
import { api } from '../services/api';
import { StatusBadge } from '../components/StatusBadge';
import { Application } from '../types';

export const ApplicationsPage: React.FC = () => {
  const [apps, setApps] = useState<Application[]>([]);
  const [sessions, setSessions] = useState<any[]>([]);
  const [testResult, setTestResult] = useState<any>(null);
  const [testingApp, setTestingApp] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [appList, sessList] = await Promise.all([
        api.getApplications(),
        api.getActiveSessions(),
      ]);
      setApps(appList);
      setSessions(sessList);
    } catch (err) {
      console.error(err);
    }
  };

  const handleTestAccess = async (domain: string) => {
    setTestingApp(domain);
    try {
      const res = await api.requestAccess({
        username: 'alice',
        device_id: 'dev-alice-laptop',
        application_domain: domain,
      });
      setTestResult(res);
      loadData();
    } catch (err: any) {
      setTestResult({ error: err.message });
    } finally {
      setTestingApp(null);
    }
  };

  return (
    <div style={{ padding: '24px', maxWidth: '1400px', margin: '0 auto' }}>
      <div style={{ marginBottom: '20px' }}>
        <h2 style={{ fontSize: '20px', fontWeight: 800, color: '#f8fafc' }}>
          Private Application Access Plane (ZPA)
        </h2>
        <p style={{ fontSize: '13px', color: '#64748b' }}>
          Section 18-19 Specification: Zero-exposure private microservices reachable only through authenticated outbound connector broker tunnels.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 400px', gap: '24px' }}>
        {/* Apps Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', height: 'fit-content' }}>
          {apps.map((app) => (
            <div key={app.id} className="glass-panel" style={{ padding: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                <span style={{ fontSize: '15px', fontWeight: 700, color: '#f8fafc' }}>
                  {app.name}
                </span>
                <StatusBadge status={app.sensitivity} size="sm" />
              </div>

              <div style={{ fontSize: '12px', color: '#06b6d4', fontFamily: 'JetBrains Mono, monospace', marginBottom: '8px' }}>
                {app.domain}:{app.port} ({app.protocol})
              </div>

              <p style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '16px', minHeight: '34px' }}>
                {app.description || 'Internal enterprise microservice.'}
              </p>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid #1e293b', paddingTop: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: '#64748b' }}>
                  <Radio size={14} color="#10b981" />
                  Connector Mesh: Chennai-DC
                </div>
                <button
                  className="btn-secondary"
                  style={{ fontSize: '11px', padding: '5px 10px' }}
                  onClick={() => handleTestAccess(app.domain)}
                  disabled={testingApp === app.domain}
                >
                  <Play size={12} /> {testingApp === app.domain ? 'Brokering...' : 'Test Brokered Tunnel'}
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Live Tunnel & Active Sessions Sidebar */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Brokered Access Test Result */}
          <div className="glass-panel" style={{ padding: '20px' }}>
            <h3 style={{ fontSize: '14px', fontWeight: 700, color: '#f8fafc', marginBottom: '12px' }}>
              Micro-Tunnel Session Response
            </h3>
            {testResult ? (
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                  <span style={{ fontSize: '12px', color: '#94a3b8' }}>STATUS</span>
                  <StatusBadge status={testResult.status || 'DENIED'} size="sm" />
                </div>
                <pre
                  style={{
                    backgroundColor: '#070a12',
                    border: '1px solid #1e293b',
                    borderRadius: '8px',
                    padding: '12px',
                    color: testResult.error ? '#f43f5e' : '#38bdf8',
                    fontSize: '11px',
                    fontFamily: 'JetBrains Mono, monospace',
                    maxHeight: '260px',
                    overflowY: 'auto',
                    whiteSpace: 'pre-wrap',
                  }}
                >
                  {JSON.stringify(testResult, null, 2)}
                </pre>
              </div>
            ) : (
              <div style={{ fontSize: '12px', color: '#64748b', textAlign: 'center', padding: '30px 0' }}>
                Click "Test Brokered Tunnel" on any application card to simulate zero-exposure micro-tunnel establishment.
              </div>
            )}
          </div>

          {/* Active Sessions List */}
          <div className="glass-panel" style={{ padding: '20px' }}>
            <h3 style={{ fontSize: '14px', fontWeight: 700, color: '#f8fafc', marginBottom: '12px' }}>
              Active Authorized Sessions ({sessions.length})
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '220px', overflowY: 'auto' }}>
              {sessions.map((s) => (
                <div
                  key={s.id}
                  style={{
                    padding: '8px 10px',
                    backgroundColor: '#0c111e',
                    border: '1px solid #1e293b',
                    borderRadius: '6px',
                    fontSize: '11px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <div>
                    <div style={{ color: '#f8fafc', fontWeight: 600 }}>{s.id}</div>
                    <div style={{ color: '#64748b' }}>Client: {s.source_ip}</div>
                  </div>
                  <StatusBadge status={s.status} size="sm" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
