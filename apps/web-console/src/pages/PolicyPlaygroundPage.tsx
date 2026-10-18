import React, { useState } from 'react';
import { Terminal, Play, CheckCircle, XCircle, Shield, AlertTriangle } from 'lucide-react';
import { api } from '../services/api';
import { StatusBadge } from '../components/StatusBadge';

export const PolicyPlaygroundPage: React.FC = () => {
  const [role, setRole] = useState('developer');
  const [department, setDepartment] = useState('Engineering');
  const [appDomain, setAppDomain] = useState('git.internal');
  const [isManaged, setIsManaged] = useState(true);
  const [firewall, setFirewall] = useState(true);
  const [antivirus, setAntivirus] = useState(true);
  const [diskEncrypted, setDiskEncrypted] = useState(true);
  const [riskScore, setRiskScore] = useState(20);
  const [simulationResult, setSimulationResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const runSimulation = async () => {
    setLoading(true);
    try {
      const payload = {
        user: { role, department, username: 'simulated-user' },
        device: {
          managed: isManaged,
          firewall_enabled: firewall,
          antivirus_enabled: antivirus,
          disk_encrypted: diskEncrypted,
          compliance_status: firewall && antivirus && diskEncrypted ? 'COMPLIANT' : 'NON_COMPLIANT',
        },
        application: { domain: appDomain },
        risk: { score: Number(riskScore) },
      };

      const res = await api.simulatePolicy(payload);
      setSimulationResult(res);
    } catch (err: any) {
      alert(`Simulation failed: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '24px', maxWidth: '1400px', margin: '0 auto' }}>
      <div style={{ marginBottom: '20px' }}>
        <h2 style={{ fontSize: '20px', fontWeight: 800, color: '#f8fafc' }}>
          Zero Trust Policy Playground & Simulator
        </h2>
        <p style={{ fontSize: '13px', color: '#64748b' }}>
          Section 14 Specification: Test multidimensional ABAC/RBAC authorization contexts against production policy trees.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '460px 1fr', gap: '24px' }}>
        {/* Simulation Input Controls */}
        <div className="glass-panel" style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#f8fafc', marginBottom: '16px' }}>
            Contextual Access Request Parameters
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div>
              <label style={{ fontSize: '11px', fontWeight: 600, color: '#94a3b8', display: 'block', marginBottom: '4px' }}>
                USER ROLE
              </label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  backgroundColor: '#0a0f1d',
                  border: '1px solid #1e293b',
                  borderRadius: '6px',
                  color: '#f8fafc',
                }}
              >
                <option value="developer">Developer</option>
                <option value="finance">Finance Specialist</option>
                <option value="SECURITY_ADMIN">Security Admin</option>
                <option value="contractor">External Contractor</option>
              </select>
            </div>

            <div>
              <label style={{ fontSize: '11px', fontWeight: 600, color: '#94a3b8', display: 'block', marginBottom: '4px' }}>
                TARGET APPLICATION
              </label>
              <select
                value={appDomain}
                onChange={(e) => setAppDomain(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  backgroundColor: '#0a0f1d',
                  border: '1px solid #1e293b',
                  borderRadius: '6px',
                  color: '#f8fafc',
                }}
              >
                <option value="git.internal">Git Server (git.internal)</option>
                <option value="finance.internal">Finance Portal (finance.internal)</option>
                <option value="hr.internal">HR Application (hr.internal)</option>
                <option value="admin.internal">Cluster Admin API (admin.internal)</option>
              </select>
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                <label style={{ fontSize: '11px', fontWeight: 600, color: '#94a3b8' }}>
                  DYNAMIC RISK SCORE (0 - 100)
                </label>
                <span style={{ fontSize: '12px', fontWeight: 700, color: riskScore > 75 ? '#f43f5e' : '#06b6d4' }}>
                  {riskScore} ({riskScore > 75 ? 'CRITICAL' : riskScore > 50 ? 'HIGH' : 'LOW'})
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={riskScore}
                onChange={(e) => setRiskScore(Number(e.target.value))}
                style={{ width: '100%', accentColor: '#06b6d4' }}
              />
            </div>

            {/* Posture switches */}
            <div style={{ borderTop: '1px solid #1e293b', paddingTop: '12px' }}>
              <div style={{ fontSize: '11px', fontWeight: 700, color: '#64748b', marginBottom: '8px' }}>
                ENDPOINT POSTURE CONTROLS
              </div>

              {[
                { label: 'Managed Enterprise Device', val: isManaged, set: setIsManaged },
                { label: 'Host Firewall Active', val: firewall, set: setFirewall },
                { label: 'Antivirus Engine Active', val: antivirus, set: setAntivirus },
                { label: 'Full Disk Encryption (LUKS/BitLocker)', val: diskEncrypted, set: setDiskEncrypted },
              ].map((sw, idx) => (
                <label
                  key={idx}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '6px 0',
                    fontSize: '12px',
                    color: '#cbd5e1',
                    cursor: 'pointer',
                  }}
                >
                  <span>{sw.label}</span>
                  <input
                    type="checkbox"
                    checked={sw.val}
                    onChange={(e) => sw.set(e.target.checked)}
                    style={{ accentColor: '#06b6d4' }}
                  />
                </label>
              ))}
            </div>

            <button
              className="btn-primary"
              onClick={runSimulation}
              disabled={loading}
              style={{ marginTop: '10px', justifyContent: 'center' }}
            >
              <Play size={16} />
              {loading ? 'Evaluating Policy Tree...' : 'Run Live Policy Simulation'}
            </button>
          </div>
        </div>

        {/* Trace Output */}
        <div className="glass-panel" style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#f8fafc', marginBottom: '16px' }}>
            Deterministic Policy Evaluation Trace
          </h3>

          {simulationResult ? (
            <div>
              {/* Verdict Header */}
              <div
                style={{
                  padding: '16px 20px',
                  borderRadius: '10px',
                  backgroundColor:
                    simulationResult.decision === 'ALLOW'
                      ? 'rgba(16, 185, 129, 0.15)'
                      : 'rgba(244, 63, 94, 0.15)',
                  border:
                    simulationResult.decision === 'ALLOW'
                      ? '1px solid rgba(16, 185, 129, 0.4)'
                      : '1px solid rgba(244, 63, 94, 0.4)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: '20px',
                }}
              >
                <div>
                  <div style={{ fontSize: '11px', fontWeight: 700, color: '#94a3b8' }}>
                    DECISION OUTCOME
                  </div>
                  <div style={{ fontSize: '20px', fontWeight: 800, color: '#f8fafc' }}>
                    {simulationResult.decision}
                  </div>
                  <div style={{ fontSize: '12px', color: '#cbd5e1', marginTop: '2px' }}>
                    Triggered by: <strong>{simulationResult.matched_policy_name}</strong>
                  </div>
                </div>
                <StatusBadge status={simulationResult.decision} size="md" />
              </div>

              {/* Step by step rule tree */}
              <div style={{ fontSize: '12px', fontWeight: 700, color: '#64748b', marginBottom: '8px' }}>
                PRIORITY-ORDERED EVALUATION TREE (FIRST-MATCH PRECEDENCE)
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '420px', overflowY: 'auto' }}>
                {simulationResult.evaluation_trace?.map((trace: any, idx: number) => {
                  const isMatch = trace.matched;
                  return (
                    <div
                      key={idx}
                      style={{
                        padding: '12px 14px',
                        borderRadius: '8px',
                        backgroundColor: isMatch ? 'rgba(6, 182, 212, 0.1)' : '#070a14',
                        border: isMatch ? '1px solid rgba(6, 182, 212, 0.4)' : '1px solid #1e293b',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 600 }}>
                            #{idx + 1} (Priority {trace.priority})
                          </span>
                          <span style={{ fontSize: '13px', fontWeight: 700, color: '#f8fafc' }}>
                            {trace.policy_name}
                          </span>
                        </div>
                        <StatusBadge status={isMatch ? 'MATCH' : 'NO MATCH'} size="sm" />
                      </div>

                      {trace.matched_reasons?.length > 0 && (
                        <div style={{ fontSize: '11px', color: '#38bdf8', marginTop: '4px' }}>
                          Matched conditions: {trace.matched_reasons.join(' AND ')}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div
              style={{
                padding: '60px 20px',
                textAlign: 'center',
                color: '#64748b',
                fontSize: '13px',
                border: '1px dashed #1e293b',
                borderRadius: '8px',
              }}
            >
              Adjust request parameters on the left and click "Run Live Policy Simulation" to see the full decision tree.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
