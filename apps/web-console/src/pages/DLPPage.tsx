import React, { useEffect, useState } from 'react';
import { FileSearch, ShieldCheck, ShieldAlert, Eye, Lock } from 'lucide-react';
import { api } from '../services/api';
import { StatusBadge } from '../components/StatusBadge';
import { DLPEvent } from '../types';

export const DLPPage: React.FC = () => {
  const [events, setEvents] = useState<DLPEvent[]>([]);
  const [testContent, setTestContent] = useState(
    'Staff Record:\nEmployee: EMP-88124, Salary: $165,000\nCorporate Card: 4532-0192-8841-1027\nKey: AKIAIOSFODNN7EXAMPLE'
  );
  const [policyAction, setPolicyAction] = useState('REDACT');
  const [scanResult, setScanResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadEvents();
  }, []);

  const loadEvents = async () => {
    try {
      const data = await api.getDlpEvents();
      setEvents(data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleScan = async () => {
    setLoading(true);
    try {
      const res = await api.scanDlp({
        content: testContent,
        file_name: 'test_sample.txt',
        username: 'alice',
        policy_action: policyAction,
      });
      setScanResult(res);
      loadEvents();
    } catch (err: any) {
      alert(`Scan failed: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '24px', maxWidth: '1400px', margin: '0 auto' }}>
      <div style={{ marginBottom: '20px' }}>
        <h2 style={{ fontSize: '20px', fontWeight: 800, color: '#f8fafc' }}>
          Data Loss Prevention (DLP) Engine
        </h2>
        <p style={{ fontSize: '13px', color: '#64748b' }}>
          Section 26 Specification: Real-time content inspection, Luhn card verification, secret key detection, and automatic redaction.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '24px' }}>
        {/* Test Scanner Workbench */}
        <div className="glass-panel" style={{ padding: '20px' }}>
          <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#f8fafc', marginBottom: '12px' }}>
            Interactive DLP Payload Scanner
          </h3>
          <textarea
            value={testContent}
            onChange={(e) => setTestContent(e.target.value)}
            rows={6}
            style={{
              width: '100%',
              backgroundColor: '#070a12',
              border: '1px solid #1e293b',
              borderRadius: '8px',
              padding: '12px',
              color: '#f8fafc',
              fontSize: '12px',
              fontFamily: 'JetBrains Mono, monospace',
              marginBottom: '14px',
            }}
          />

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '12px', color: '#94a3b8' }}>Enforcement:</span>
              <select
                value={policyAction}
                onChange={(e) => setPolicyAction(e.target.value)}
                style={{
                  padding: '6px 10px',
                  backgroundColor: '#0a0f1d',
                  border: '1px solid #1e293b',
                  borderRadius: '6px',
                  color: '#f8fafc',
                  fontSize: '12px',
                }}
              >
                <option value="REDACT">REDACT & FORWARD</option>
                <option value="BLOCK">BLOCK & ALERT</option>
                <option value="WARN">WARN</option>
                <option value="LOG">AUDIT LOG ONLY</option>
              </select>
            </div>
            <button className="btn-primary" onClick={handleScan} disabled={loading}>
              <FileSearch size={14} /> {loading ? 'Inspecting...' : 'Scan Payload'}
            </button>
          </div>
        </div>

        {/* Scan Result & Redaction Preview */}
        <div className="glass-panel" style={{ padding: '20px' }}>
          <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#f8fafc', marginBottom: '12px' }}>
            Inspection & Redaction Result
          </h3>
          {scanResult ? (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                <span style={{ fontSize: '12px', color: '#94a3b8' }}>ACTION ENFORCED:</span>
                <StatusBadge status={scanResult.action} size="sm" />
              </div>

              {scanResult.findings?.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '14px' }}>
                  {scanResult.findings.map((f: any, i: number) => (
                    <span
                      key={i}
                      style={{
                        backgroundColor: 'rgba(244, 63, 94, 0.15)',
                        border: '1px solid rgba(244, 63, 94, 0.4)',
                        color: '#fb7185',
                        fontSize: '11px',
                        padding: '3px 8px',
                        borderRadius: '4px',
                        fontWeight: 600,
                      }}
                    >
                      {f.type} ({f.count} matches)
                    </span>
                  ))}
                </div>
              )}

              {scanResult.redacted_content && (
                <div>
                  <div style={{ fontSize: '11px', color: '#64748b', marginBottom: '4px', fontWeight: 600 }}>
                    SAFELY REDACTED STREAM
                  </div>
                  <pre
                    style={{
                      backgroundColor: '#070a12',
                      border: '1px solid #1e293b',
                      borderRadius: '8px',
                      padding: '12px',
                      color: '#10b981',
                      fontSize: '11px',
                      fontFamily: 'JetBrains Mono, monospace',
                      whiteSpace: 'pre-wrap',
                    }}
                  >
                    {scanResult.redacted_content}
                  </pre>
                </div>
              )}
            </div>
          ) : (
            <div style={{ padding: '40px 0', textAlign: 'center', color: '#64748b', fontSize: '12px' }}>
              Click "Scan Payload" to inspect patterns and preview automated redaction.
            </div>
          )}
        </div>
      </div>

      {/* DLP Incident Events Log */}
      <div className="glass-panel" style={{ padding: '20px' }}>
        <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#f8fafc', marginBottom: '14px' }}>
          Recent DLP Violation Events
        </h3>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '12px' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #1e293b', color: '#64748b', fontSize: '11px' }}>
              <th style={{ padding: '10px 12px' }}>TIMESTAMP</th>
              <th style={{ padding: '10px 12px' }}>USER</th>
              <th style={{ padding: '10px 12px' }}>FILE / DESTINATION</th>
              <th style={{ padding: '10px 12px' }}>SENSITIVITY TYPE</th>
              <th style={{ padding: '10px 12px' }}>ACTION</th>
              <th style={{ padding: '10px 12px' }}>SEVERITY</th>
            </tr>
          </thead>
          <tbody>
            {events.map((e) => (
              <tr key={e.id} style={{ borderBottom: '1px solid #141c2e' }}>
                <td style={{ padding: '10px 12px', color: '#64748b' }}>
                  {new Date(e.timestamp).toLocaleTimeString()}
                </td>
                <td style={{ padding: '10px 12px', fontWeight: 600, color: '#f8fafc' }}>{e.username}</td>
                <td style={{ padding: '10px 12px', color: '#38bdf8' }}>{e.file_name}</td>
                <td style={{ padding: '10px 12px', fontWeight: 600 }}>{e.sensitivity_type}</td>
                <td style={{ padding: '10px 12px' }}><StatusBadge status={e.action} size="sm" /></td>
                <td style={{ padding: '10px 12px' }}><StatusBadge status={e.severity} size="sm" /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
