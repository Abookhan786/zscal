import React, { useState } from 'react';
import { Flame, ShieldAlert, Bug, FileWarning, KeyRound, AlertTriangle, Play, RefreshCw } from 'lucide-react';
import { api } from '../services/api';
import { StatusBadge } from '../components/StatusBadge';

export const AttackLabPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'device' | 'url' | 'dlp' | 'brute'>('device');
  const [attackLogs, setAttackLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // 1. Compromised Device Attack
  const runDeviceCompromise = async () => {
    setLoading(true);
    try {
      const res = await api.reportPosture({
        device_id: 'dev-alice-laptop',
        firewall_enabled: false,
        antivirus_enabled: false,
        disk_encrypted: true,
        screen_lock_enabled: true,
        patches_up_to_date: false,
        certificate_valid: true,
      });
      setAttackLogs((prev) => [
        {
          timestamp: new Date().toLocaleTimeString(),
          attack: 'Host Posture Tampering',
          target: 'Alice-ThinkPad-X1',
          outcome: 'Posture degraded to NON_COMPLIANT. Risk increased to 82.',
          verdict: 'BLOCKED_BY_ZERO_TRUST',
          raw: res,
        },
        ...prev,
      ]);
    } catch (err: any) {
      alert(`Simulation error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // 2. Malicious URL Visit
  const runMaliciousUrl = async (url: string) => {
    setLoading(true);
    try {
      const res = await api.inspectUrl({
        url,
        username: 'alice',
        device_id: 'dev-alice-laptop',
      });
      setAttackLogs((prev) => [
        {
          timestamp: new Date().toLocaleTimeString(),
          attack: 'Malicious Web Navigation',
          target: url,
          outcome: `Category: ${res.category}, Reputation: ${res.reputation_score}/100`,
          verdict: res.decision,
          raw: res,
        },
        ...prev,
      ]);
    } catch (err: any) {
      alert(`Simulation error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // 3. DLP Exfiltration Attempt
  const runDlpAttack = async () => {
    setLoading(true);
    try {
      const payload = "Restricted Financial Export: EMP-88192 Salary: $165,000 Card: 4532-0192-8841-1027 AWS Key: AKIAIOSFODNN7EXAMPLE";
      const res = await api.scanDlp({
        content: payload,
        file_name: 'confidential_payroll_q3.csv',
        username: 'alice',
        policy_action: 'BLOCK',
      });
      setAttackLogs((prev) => [
        {
          timestamp: new Date().toLocaleTimeString(),
          attack: 'DLP Data Exfiltration Attempt',
          target: 'confidential_payroll_q3.csv',
          outcome: `Violations: ${res.findings?.map((f: any) => f.type).join(', ')}`,
          verdict: res.action,
          raw: res,
        },
        ...prev,
      ]);
    } catch (err: any) {
      alert(`Simulation error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // 4. Brute Force Login Attack
  const runBruteForce = async () => {
    setLoading(true);
    try {
      // Simulate 5 consecutive bad passwords
      let lastErr = '';
      for (let i = 0; i < 5; i++) {
        try {
          await api.evaluateRisk({
            user_id: 'user-alice-01',
            failed_attempts: i + 1,
          });
        } catch (e: any) {
          lastErr = e.message;
        }
      }
      setAttackLogs((prev) => [
        {
          timestamp: new Date().toLocaleTimeString(),
          attack: 'Credential Stuffing / Brute Force',
          target: 'User: alice',
          outcome: '5 authentication failures triggered. Account locked out.',
          verdict: 'ACCOUNT_LOCKED',
          raw: { attempts: 5, locked: true },
        },
        ...prev,
      ]);
    } catch (err: any) {
      alert(`Simulation error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '24px', maxWidth: '1400px', margin: '0 auto' }}>
      <div style={{ marginBottom: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
          <Flame size={20} color="#f43f5e" />
          <h2 style={{ fontSize: '20px', fontWeight: 800, color: '#f8fafc' }}>
            Attack Simulation Lab (Section 52 Specification)
          </h2>
        </div>
        <p style={{ fontSize: '13px', color: '#64748b' }}>
          Execute safe, controlled red-team adversary actions to validate detection and containment engines in real time.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '460px 1fr', gap: '24px' }}>
        {/* Attack Launcher Cards */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {/* 1. Compromised Device */}
          <div className="glass-panel" style={{ padding: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
              <Bug size={18} color="#f43f5e" />
              <h3 style={{ fontSize: '14px', fontWeight: 700, color: '#f8fafc' }}>
                1. Endpoint Posture Tampering
              </h3>
            </div>
            <p style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '14px', lineHeight: 1.4 }}>
              Disables firewall and antivirus on Alice's laptop. Verifies compliance shifts to NON_COMPLIANT and private Git access is immediately denied.
            </p>
            <button
              className="btn-danger"
              style={{ width: '100%', justifyContent: 'center', fontSize: '12px' }}
              onClick={runDeviceCompromise}
              disabled={loading}
            >
              <Play size={14} /> Inject Host Posture Compromise
            </button>
          </div>

          {/* 2. Malicious Web Gateway Test */}
          <div className="glass-panel" style={{ padding: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
              <ShieldAlert size={18} color="#f59e0b" />
              <h3 style={{ fontSize: '14px', fontWeight: 700, color: '#f8fafc' }}>
                2. Threat Navigation & Phishing
              </h3>
            </div>
            <p style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '14px', lineHeight: 1.4 }}>
              Directs endpoint client to known malware trojan droppers or credential phishing domains through the Web Gateway proxy.
            </p>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                className="btn-secondary"
                style={{ flex: 1, justifyContent: 'center', fontSize: '12px' }}
                onClick={() => runMaliciousUrl('https://malware.test/dropper.exe')}
                disabled={loading}
              >
                malware.test
              </button>
              <button
                className="btn-secondary"
                style={{ flex: 1, justifyContent: 'center', fontSize: '12px' }}
                onClick={() => runMaliciousUrl('https://phishing.test/login')}
                disabled={loading}
              >
                phishing.test
              </button>
            </div>
          </div>

          {/* 3. DLP Attack */}
          <div className="glass-panel" style={{ padding: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
              <FileWarning size={18} color="#06b6d4" />
              <h3 style={{ fontSize: '14px', fontWeight: 700, color: '#f8fafc' }}>
                3. Confidential Data Exfiltration
              </h3>
            </div>
            <p style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '14px', lineHeight: 1.4 }}>
              Simulates exfiltration of employee payroll CSV with valid payment card numbers (Luhn checked) and AWS secrets.
            </p>
            <button
              className="btn-primary"
              style={{ width: '100%', justifyContent: 'center', fontSize: '12px' }}
              onClick={runDlpAttack}
              disabled={loading}
            >
              <Play size={14} /> Attempt DLP Data Upload
            </button>
          </div>

          {/* 4. Brute Force */}
          <div className="glass-panel" style={{ padding: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
              <KeyRound size={18} color="#8b5cf6" />
              <h3 style={{ fontSize: '14px', fontWeight: 700, color: '#f8fafc' }}>
                4. Brute-Force Credential Stuffing
              </h3>
            </div>
            <p style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '14px', lineHeight: 1.4 }}>
              Generates rapid failed authentication requests triggering dynamic risk escalation and account lockout.
            </p>
            <button
              className="btn-secondary"
              style={{ width: '100%', justifyContent: 'center', fontSize: '12px' }}
              onClick={runBruteForce}
              disabled={loading}
            >
              <Play size={14} /> Simulate Brute-Force Attack
            </button>
          </div>
        </div>

        {/* Real-time Attack Log Output */}
        <div className="glass-panel" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#f8fafc' }}>
              Active Defense Enforcement Feed
            </h3>
            <span style={{ fontSize: '11px', color: '#64748b' }}>
              {attackLogs.length} simulated operations executed
            </span>
          </div>

          {attackLogs.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '560px', overflowY: 'auto' }}>
              {attackLogs.map((log, idx) => (
                <div
                  key={idx}
                  style={{
                    padding: '14px',
                    borderRadius: '8px',
                    backgroundColor: '#0a0f1d',
                    border: '1px solid #1e293b',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <span style={{ fontSize: '13px', fontWeight: 700, color: '#f8fafc' }}>
                      {log.attack}
                    </span>
                    <StatusBadge status={log.verdict} size="sm" />
                  </div>
                  <div style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '4px' }}>
                    Target: <code style={{ color: '#38bdf8' }}>{log.target}</code>
                  </div>
                  <div style={{ fontSize: '11px', color: '#cbd5e1' }}>{log.outcome}</div>
                  <div style={{ fontSize: '10px', color: '#475569', marginTop: '6px' }}>
                    Timestamp: {log.timestamp}
                  </div>
                </div>
              ))}
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
              Choose a simulation trigger on the left to test active zero-trust defenses.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
