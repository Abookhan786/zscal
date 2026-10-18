import React, { useEffect, useState } from 'react';
import { Globe, ShieldCheck, ShieldAlert, Search, Filter } from 'lucide-react';
import { api } from '../services/api';
import { StatusBadge } from '../components/StatusBadge';

export const WebSecurityPage: React.FC = () => {
  const [logs, setLogs] = useState<any[]>([]);
  const [dnsLogs, setDnsLogs] = useState<any[]>([]);
  const [urlInput, setUrlInput] = useState('https://malware.test/command');
  const [dnsDomain, setDnsDomain] = useState('c2-botnet.xyz');
  const [inspectionResult, setInspectionResult] = useState<any>(null);
  const [dnsResult, setDnsResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadLogs();
  }, []);

  const loadLogs = async () => {
    try {
      const [wLogs, dLogs] = await Promise.all([
        api.getWebLogs(),
        api.getDnsLogs(),
      ]);
      setLogs(wLogs);
      setDnsLogs(dLogs);
    } catch (err) {
      console.error(err);
    }
  };

  const handleInspectUrl = async () => {
    setLoading(true);
    try {
      const res = await api.inspectUrl({ url: urlInput, username: 'alice' });
      setInspectionResult(res);
      loadLogs();
    } catch (err: any) {
      alert(`Inspection failed: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleInspectDns = async () => {
    try {
      const res = await api.inspectDns({ domain: dnsDomain, username: 'alice' });
      setDnsResult(res);
      loadLogs();
    } catch (err: any) {
      alert(`DNS check failed: ${err.message}`);
    }
  };

  return (
    <div style={{ padding: '24px', maxWidth: '1400px', margin: '0 auto' }}>
      <div style={{ marginBottom: '20px' }}>
        <h2 style={{ fontSize: '20px', fontWeight: 800, color: '#f8fafc' }}>
          Secure Web Gateway & DNS Security (SWG)
        </h2>
        <p style={{ fontSize: '13px', color: '#64748b' }}>
          Section 22-23 Specification: Domain categorization, real-time threat intelligence reputation, and DNS sinkhole protection.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '24px' }}>
        {/* URL Inspection Tool */}
        <div className="glass-panel" style={{ padding: '20px' }}>
          <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#f8fafc', marginBottom: '12px' }}>
            URL Gateway Classifier
          </h3>
          <div style={{ display: 'flex', gap: '10px', marginBottom: '12px' }}>
            <input
              type="text"
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              style={{ flex: 1, padding: '8px 12px', backgroundColor: '#0a0f1d', border: '1px solid #1e293b', borderRadius: '6px', color: '#f8fafc' }}
            />
            <button className="btn-primary" onClick={handleInspectUrl} disabled={loading}>
              <Search size={14} /> Inspect
            </button>
          </div>

          {inspectionResult && (
            <div style={{ backgroundColor: '#070a12', padding: '12px', borderRadius: '8px', border: '1px solid #1e293b' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span style={{ fontSize: '12px', color: '#94a3b8' }}>GATEWAY VERDICT:</span>
                <StatusBadge status={inspectionResult.decision} size="sm" />
              </div>
              <div style={{ fontSize: '12px', color: '#cbd5e1' }}>Category: <strong>{inspectionResult.category}</strong></div>
              <div style={{ fontSize: '12px', color: '#cbd5e1' }}>Reputation Score: <strong>{inspectionResult.reputation_score}/100</strong></div>
            </div>
          )}
        </div>

        {/* DNS Sinkhole Inspector */}
        <div className="glass-panel" style={{ padding: '20px' }}>
          <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#f8fafc', marginBottom: '12px' }}>
            DNS Pre-Resolution Threat Evaluator
          </h3>
          <div style={{ display: 'flex', gap: '10px', marginBottom: '12px' }}>
            <input
              type="text"
              value={dnsDomain}
              onChange={(e) => setDnsDomain(e.target.value)}
              style={{ flex: 1, padding: '8px 12px', backgroundColor: '#0a0f1d', border: '1px solid #1e293b', borderRadius: '6px', color: '#f8fafc' }}
            />
            <button className="btn-secondary" onClick={handleInspectDns}>
              <Globe size={14} /> Resolve DNS
            </button>
          </div>

          {dnsResult && (
            <div style={{ backgroundColor: '#070a12', padding: '12px', borderRadius: '8px', border: '1px solid #1e293b' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span style={{ fontSize: '12px', color: '#94a3b8' }}>DNS RESOLUTION:</span>
                <StatusBadge status={dnsResult.sinkhole ? 'SINKHOLED' : 'ALLOWED'} size="sm" />
              </div>
              <div style={{ fontSize: '12px', color: '#cbd5e1' }}>Resolved IP: <code style={{ color: '#38bdf8' }}>{dnsResult.resolved_ip}</code></div>
              <div style={{ fontSize: '12px', color: '#cbd5e1' }}>Category: {dnsResult.category}</div>
            </div>
          )}
        </div>
      </div>

      {/* Web Gateway Logs */}
      <div className="glass-panel" style={{ padding: '20px' }}>
        <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#f8fafc', marginBottom: '14px' }}>
          Recent Secure Web & DNS Requests
        </h3>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '12px' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #1e293b', color: '#64748b', fontSize: '11px' }}>
              <th style={{ padding: '10px 12px' }}>TIMESTAMP</th>
              <th style={{ padding: '10px 12px' }}>DOMAIN / URL</th>
              <th style={{ padding: '10px 12px' }}>CATEGORY</th>
              <th style={{ padding: '10px 12px' }}>REPUTATION</th>
              <th style={{ padding: '10px 12px' }}>ACTION</th>
              <th style={{ padding: '10px 12px' }}>CLIENT IP</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((l) => (
              <tr key={l.id} style={{ borderBottom: '1px solid #141c2e' }}>
                <td style={{ padding: '10px 12px', color: '#64748b' }}>{new Date(l.timestamp).toLocaleTimeString()}</td>
                <td style={{ padding: '10px 12px', fontWeight: 600, color: '#f8fafc' }}>{l.domain}</td>
                <td style={{ padding: '10px 12px', color: '#94a3b8' }}>{l.category}</td>
                <td style={{ padding: '10px 12px', color: l.reputation_score < 40 ? '#f43f5e' : '#10b981', fontWeight: 700 }}>
                  {l.reputation_score} / 100
                </td>
                <td style={{ padding: '10px 12px' }}><StatusBadge status={l.decision} size="sm" /></td>
                <td style={{ padding: '10px 12px', color: '#64748b' }}>{l.source_ip}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
