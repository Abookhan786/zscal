import React, { useEffect, useState } from 'react';
import { History, Download, FileText, CheckCircle2 } from 'lucide-react';
import { api } from '../services/api';

export const AuditPage: React.FC = () => {
  const [logs, setLogs] = useState<any[]>([]);

  useEffect(() => {
    loadAudit();
  }, []);

  const loadAudit = async () => {
    try {
      const data = await api.getAuditLogs();
      setLogs(data);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div style={{ padding: '24px', maxWidth: '1400px', margin: '0 auto' }}>
      <div style={{ marginBottom: '20px' }}>
        <h2 style={{ fontSize: '20px', fontWeight: 800, color: '#f8fafc' }}>
          Audit Trail & Compliance Reports
        </h2>
        <p style={{ fontSize: '13px', color: '#64748b' }}>
          Section 37 & 51 Specification: Append-only administrative governance logs and one-click regulatory export packages.
        </p>
      </div>

      {/* Reports Export Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' }}>
        {[
          { title: 'Executive Posture', type: 'executive', format: 'json', desc: 'Summary of protected entities, blocked attacks, and zero trust rate.' },
          { title: 'Access Audit Log', type: 'access', format: 'csv', desc: 'Detailed CSV table of every private application access decision.' },
          { title: 'DLP Violations', type: 'dlp', format: 'csv', desc: 'Exfiltration attempts, sensitive data types, and containment actions.' },
          { title: 'WAF Mitigations', type: 'waf', format: 'csv', desc: 'OWASP injection attempts, client IPs, and matched signatures.' },
        ].map((rep, idx) => (
          <div key={idx} className="glass-panel" style={{ padding: '18px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <FileText size={16} color="#06b6d4" />
              <span style={{ fontSize: '14px', fontWeight: 700, color: '#f8fafc' }}>{rep.title}</span>
            </div>
            <p style={{ fontSize: '11px', color: '#94a3b8', marginBottom: '14px', minHeight: '32px' }}>
              {rep.desc}
            </p>
            <a
              href={api.generateReport(rep.type, rep.format)}
              target="_blank"
              rel="noreferrer"
              className="btn-secondary"
              style={{ width: '100%', justifyContent: 'center', fontSize: '11px', textDecoration: 'none' }}
            >
              <Download size={13} /> Export {rep.format.toUpperCase()}
            </a>
          </div>
        ))}
      </div>

      {/* Audit Logs Table */}
      <div className="glass-panel" style={{ padding: '20px' }}>
        <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#f8fafc', marginBottom: '14px' }}>
          Immutable Administrative Audit Trail
        </h3>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '12px' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #1e293b', color: '#64748b', fontSize: '11px' }}>
              <th style={{ padding: '10px 12px' }}>TIMESTAMP</th>
              <th style={{ padding: '10px 12px' }}>ACTOR</th>
              <th style={{ padding: '10px 12px' }}>ACTION</th>
              <th style={{ padding: '10px 12px' }}>RESOURCE</th>
              <th style={{ padding: '10px 12px' }}>SOURCE IP</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((l) => (
              <tr key={l.id} style={{ borderBottom: '1px solid #141c2e' }}>
                <td style={{ padding: '10px 12px', color: '#64748b' }}>
                  {new Date(l.timestamp).toLocaleTimeString()}
                </td>
                <td style={{ padding: '10px 12px', fontWeight: 600, color: '#f8fafc' }}>{l.actor}</td>
                <td style={{ padding: '10px 12px', color: '#38bdf8', fontWeight: 700 }}>{l.action}</td>
                <td style={{ padding: '10px 12px', color: '#cbd5e1' }}>{l.resource}</td>
                <td style={{ padding: '10px 12px', color: '#64748b' }}>{l.source_ip}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
