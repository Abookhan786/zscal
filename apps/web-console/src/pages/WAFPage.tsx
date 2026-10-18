import React, { useEffect, useState } from 'react';
import { Lock, ShieldAlert, Play, CheckCircle2, AlertOctagon } from 'lucide-react';
import { api } from '../services/api';
import { StatusBadge } from '../components/StatusBadge';
import { WAFEvent } from '../types';

export const WAFPage: React.FC = () => {
  const [events, setEvents] = useState<WAFEvent[]>([]);
  const [path, setPath] = useState('/api/v1/search');
  const [payload, setPayload] = useState("q=1' UNION SELECT username, password_hash FROM users--");
  const [testResult, setTestResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadEvents();
  }, []);

  const loadEvents = async () => {
    try {
      const data = await api.getWafEvents();
      setEvents(data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleTestWaf = async () => {
    setLoading(true);
    try {
      const res = await api.inspectWaf({
        application: 'Git Server',
        path,
        body: payload,
      });
      setTestResult(res);
      loadEvents();
    } catch (err: any) {
      alert(`WAF test failed: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '24px', maxWidth: '1400px', margin: '0 auto' }}>
      <div style={{ marginBottom: '20px' }}>
        <h2 style={{ fontSize: '20px', fontWeight: 800, color: '#f8fafc' }}>
          Application Protection & WAF (OWASP Aligned)
        </h2>
        <p style={{ fontSize: '13px', color: '#64748b' }}>
          Section 24-25 Specification: Layer-7 deep packet inspection for SQL Injection, Cross-Site Scripting, and Command Injection.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '24px' }}>
        {/* Interactive WAF Test Workbench */}
        <div className="glass-panel" style={{ padding: '20px' }}>
          <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#f8fafc', marginBottom: '14px' }}>
            Interactive HTTP WAF Test Harness
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div>
              <label style={{ fontSize: '11px', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>
                REQUEST PATH
              </label>
              <input
                type="text"
                value={path}
                onChange={(e) => setPath(e.target.value)}
                style={{ width: '100%', padding: '8px 12px', backgroundColor: '#0a0f1d', border: '1px solid #1e293b', borderRadius: '6px', color: '#f8fafc' }}
              />
            </div>

            <div>
              <label style={{ fontSize: '11px', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>
                PAYLOAD (BODY / QUERY PARAMS)
              </label>
              <textarea
                value={payload}
                onChange={(e) => setPayload(e.target.value)}
                rows={4}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  backgroundColor: '#0a0f1d',
                  border: '1px solid #1e293b',
                  borderRadius: '6px',
                  color: '#f8fafc',
                  fontFamily: 'JetBrains Mono, monospace',
                  fontSize: '12px',
                }}
              />
            </div>

            {/* Attack Preset Buttons */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              <button
                className="btn-secondary"
                style={{ fontSize: '11px', padding: '4px 8px' }}
                onClick={() => setPayload("q=1' OR '1'='1'--")}
              >
                SQLi Preset
              </button>
              <button
                className="btn-secondary"
                style={{ fontSize: '11px', padding: '4px 8px' }}
                onClick={() => setPayload("<script>alert(document.cookie)</script>")}
              >
                XSS Preset
              </button>
              <button
                className="btn-secondary"
                style={{ fontSize: '11px', padding: '4px 8px' }}
                onClick={() => setPayload("path=../../../../etc/passwd")}
              >
                Traversal Preset
              </button>
              <button
                className="btn-secondary"
                style={{ fontSize: '11px', padding: '4px 8px' }}
                onClick={() => setPayload("cmd=; whoami && id")}
              >
                Command Preset
              </button>
            </div>

            <button className="btn-primary" onClick={handleTestWaf} disabled={loading} style={{ marginTop: '8px', justifyContent: 'center' }}>
              <Lock size={14} /> {loading ? 'Inspecting...' : 'Test WAF Filter'}
            </button>
          </div>
        </div>

        {/* WAF Decision Inspector */}
        <div className="glass-panel" style={{ padding: '20px' }}>
          <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#f8fafc', marginBottom: '14px' }}>
            Filter Decision & Threat Signature
          </h3>
          {testResult ? (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                <span style={{ fontSize: '12px', color: '#94a3b8' }}>VERDICT</span>
                <StatusBadge status={testResult.action} size="sm" />
              </div>
              <pre
                style={{
                  backgroundColor: '#070a12',
                  border: '1px solid #1e293b',
                  borderRadius: '8px',
                  padding: '12px',
                  color: testResult.blocked ? '#f43f5e' : '#10b981',
                  fontSize: '11px',
                  fontFamily: 'JetBrains Mono, monospace',
                  whiteSpace: 'pre-wrap',
                }}
              >
                {JSON.stringify(testResult, null, 2)}
              </pre>
            </div>
          ) : (
            <div style={{ padding: '40px 0', textAlign: 'center', color: '#64748b', fontSize: '12px' }}>
              Click "Test WAF Filter" to evaluate signature matches and automated 403 containment.
            </div>
          )}
        </div>
      </div>

      {/* WAF Block Log */}
      <div className="glass-panel" style={{ padding: '20px' }}>
        <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#f8fafc', marginBottom: '14px' }}>
          Recent Mitigated WAF Attacks
        </h3>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '12px' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #1e293b', color: '#64748b', fontSize: '11px' }}>
              <th style={{ padding: '10px 12px' }}>TIMESTAMP</th>
              <th style={{ padding: '10px 12px' }}>APPLICATION</th>
              <th style={{ padding: '10px 12px' }}>ATTACK TYPE</th>
              <th style={{ padding: '10px 12px' }}>SIGNATURE ID</th>
              <th style={{ padding: '10px 12px' }}>ACTION</th>
              <th style={{ padding: '10px 12px' }}>SOURCE IP</th>
            </tr>
          </thead>
          <tbody>
            {events.map((e) => (
              <tr key={e.id} style={{ borderBottom: '1px solid #141c2e' }}>
                <td style={{ padding: '10px 12px', color: '#64748b' }}>
                  {new Date(e.timestamp).toLocaleTimeString()}
                </td>
                <td style={{ padding: '10px 12px', fontWeight: 600, color: '#f8fafc' }}>{e.application}</td>
                <td style={{ padding: '10px 12px', color: '#fb7185', fontWeight: 600 }}>{e.attack_type}</td>
                <td style={{ padding: '10px 12px', fontFamily: 'JetBrains Mono, monospace' }}>{e.rule_id}</td>
                <td style={{ padding: '10px 12px' }}><StatusBadge status={e.action} size="sm" /></td>
                <td style={{ padding: '10px 12px', color: '#94a3b8' }}>{e.source_ip}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
