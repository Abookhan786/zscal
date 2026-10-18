import React, { useState } from 'react';
import {
  Play,
  RotateCcw,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ShieldCheck,
  ShieldAlert,
  Server,
  FileSearch,
  Activity,
  ArrowRight,
  ExternalLink,
} from 'lucide-react';
import { api } from '../services/api';
import { StatusBadge } from '../components/StatusBadge';

interface ScenarioStepData {
  step: number;
  title: string;
  description: string;
  category: string;
  result?: any;
  status: 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED';
}

const INITIAL_STEPS: ScenarioStepData[] = [
  {
    step: 1,
    title: 'MFA Authentication',
    description: "Alice signs in to ZeroTrustX Control Plane with valid credentials and verified TOTP multi-factor code.",
    category: 'Identity & Access',
    status: 'PENDING',
  },
  {
    step: 2,
    title: 'Device Posture Hygiene & Base Risk',
    description: "Alice's managed Ubuntu laptop reports active firewall, antivirus, disk encryption, and compliant patch level (Risk: 12).",
    category: 'Endpoint Trust',
    status: 'PENDING',
  },
  {
    step: 3,
    title: 'Authorized Private Access: Git Server',
    description: "Alice requests git.internal. Policy Engine verifies role 'developer', compliant posture, and low risk. Access is GRANTED via connector broker tunnel.",
    category: 'Private Access (ZPA)',
    status: 'PENDING',
  },
  {
    step: 4,
    title: 'Segmentation Enforced: Finance Portal Access Denied',
    description: "Alice attempts access to finance.internal. Policy Engine blocks access because developer role lacks finance entitlement (Default Deny applied).",
    category: 'App Segmentation',
    status: 'PENDING',
  },
  {
    step: 5,
    title: 'Posture Drift: Firewall Disabled & Revocation',
    description: "Alice's host firewall drops. Posture drifts to NON_COMPLIANT, dynamic risk spikes to 82. Re-attempting Git access is strictly DENIED.",
    category: 'Adaptive Risk',
    status: 'PENDING',
  },
  {
    step: 6,
    title: 'DLP Inspection: Exfiltration Attempt Blocked',
    description: "Outbound upload containing employee salaries and credit cards is intercepted by DLP Engine. Transaction is BLOCKED and Incident opened.",
    category: 'Data Protection (DLP)',
    status: 'PENDING',
  },
  {
    step: 7,
    title: 'Digital Experience Anomaly: Latency Spike',
    description: "Git Server round-trip latency jumps from 150ms to 901ms with packet loss. DEM synthetic probes fire PERFORMANCE DEGRADATION alert.",
    category: 'Experience (DEM)',
    status: 'PENDING',
  },
  {
    step: 8,
    title: 'SOC Analyst Incident Triage & Evidence Timeline',
    description: "SOC analyst reviews correlated Incident view with affected user, quarantined device, redacted DLP evidence, and security event log.",
    category: 'Incident Response',
    status: 'PENDING',
  },
];

export const ScenarioPage: React.FC = () => {
  const [steps, setSteps] = useState<ScenarioStepData[]>(INITIAL_STEPS);
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(0);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [selectedResult, setSelectedResult] = useState<any>(null);

  const runStep = async (index: number) => {
    const stepNumber = index + 1;
    setSteps((prev) =>
      prev.map((s, i) => (i === index ? { ...s, status: 'RUNNING' } : s))
    );

    try {
      const res = await api.executeScenarioStep(stepNumber);
      setSteps((prev) =>
        prev.map((s, i) =>
          i === index ? { ...s, status: 'COMPLETED', result: res } : s
        )
      );
      setSelectedResult(res);
      setCurrentStepIndex(Math.min(steps.length, index + 1));
    } catch (err: any) {
      setSteps((prev) =>
        prev.map((s, i) =>
          i === index
            ? { ...s, status: 'FAILED', result: { error: err.message } }
            : s
        )
      );
    }
  };

  const runAutoPlay = async () => {
    setIsRunning(true);
    for (let i = 0; i < steps.length; i++) {
      await runStep(i);
      await new Promise((resolve) => setTimeout(resolve, 800));
    }
    setIsRunning(false);
  };

  const handleReset = async () => {
    await api.resetScenario();
    setSteps(INITIAL_STEPS);
    setCurrentStepIndex(0);
    setSelectedResult(null);
  };

  return (
    <div style={{ padding: '24px', maxWidth: '1400px', margin: '0 auto' }}>
      {/* Top Banner */}
      <div
        className="glass-panel"
        style={{
          padding: '24px',
          marginBottom: '24px',
          background: 'linear-gradient(135deg, rgba(6, 182, 212, 0.1) 0%, rgba(15, 23, 42, 0.8) 100%)',
          border: '1px solid rgba(6, 182, 212, 0.3)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
            <span
              style={{
                backgroundColor: '#06b6d4',
                color: '#020617',
                fontSize: '11px',
                fontWeight: 800,
                padding: '2px 8px',
                borderRadius: '4px',
              }}
            >
              SECTION 77 SPECIFICATION
            </span>
            <h2 style={{ fontSize: '20px', fontWeight: 800, color: '#f8fafc' }}>
              Final Demonstration Scenario: Alice's Developer Journey
            </h2>
          </div>
          <p style={{ color: '#94a3b8', fontSize: '13px', maxWidth: '820px', lineHeight: 1.5 }}>
            A complete 8-step security narrative demonstrating continuous identity verification, posture-aware
            policy decisions, zero-exposure application segmentation, dynamic risk adaptation, DLP exfiltration containment,
            and SOC incident triage.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            className="btn-secondary"
            onClick={handleReset}
            disabled={isRunning}
            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <RotateCcw size={15} />
            Reset State
          </button>
          <button
            className="btn-primary"
            onClick={runAutoPlay}
            disabled={isRunning}
            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <Play size={15} />
            {isRunning ? 'Running Simulation...' : 'Auto-Play Story'}
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 420px', gap: '20px' }}>
        {/* Step Cards List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {steps.map((st, idx) => {
            const isCurrent = currentStepIndex === idx;
            const isCompleted = st.status === 'COMPLETED';
            const isRunningStep = st.status === 'RUNNING';

            return (
              <div
                key={st.step}
                className="glass-panel"
                style={{
                  padding: '16px 20px',
                  border: isCurrent
                    ? '1px solid rgba(6, 182, 212, 0.6)'
                    : isCompleted
                    ? '1px solid rgba(16, 185, 129, 0.4)'
                    : '1px solid #1e293b',
                  backgroundColor: isCurrent ? 'rgba(6, 182, 212, 0.05)' : '#0d1322',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  transition: 'all 0.2s ease',
                  cursor: isCompleted ? 'pointer' : 'default',
                }}
                onClick={() => {
                  if (st.result) setSelectedResult(st.result);
                }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px' }}>
                  <div
                    style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '50%',
                      backgroundColor: isCompleted
                        ? '#10b981'
                        : isRunningStep
                        ? '#06b6d4'
                        : '#1e293b',
                      color: isCompleted || isRunningStep ? '#ffffff' : '#64748b',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 700,
                      fontSize: '13px',
                      flexShrink: 0,
                    }}
                  >
                    {isCompleted ? <CheckCircle2 size={18} /> : st.step}
                  </div>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                      <span style={{ fontSize: '14px', fontWeight: 700, color: '#f8fafc' }}>
                        Step {st.step}: {st.title}
                      </span>
                      <span
                        style={{
                          fontSize: '10px',
                          padding: '1px 6px',
                          borderRadius: '4px',
                          backgroundColor: '#1e293b',
                          color: '#94a3b8',
                          fontWeight: 600,
                        }}
                      >
                        {st.category}
                      </span>
                    </div>
                    <div style={{ fontSize: '12px', color: '#94a3b8', lineHeight: 1.4 }}>
                      {st.description}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
                  <StatusBadge status={st.status} size="sm" />
                  <button
                    className="btn-secondary"
                    style={{ padding: '6px 12px', fontSize: '12px' }}
                    onClick={(e) => {
                      e.stopPropagation();
                      runStep(idx);
                    }}
                    disabled={isRunning}
                  >
                    Run Step
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Live Step Inspector / JSON Evidence Viewer */}
        <div className="glass-panel" style={{ padding: '20px', height: 'fit-content' }}>
          <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#f8fafc', marginBottom: '12px' }}>
            Live Security Decision Inspector
          </h3>
          <p style={{ fontSize: '12px', color: '#64748b', marginBottom: '16px' }}>
            Inspect real-time policy evaluation traces, token assertions, DLP matches, and SOC timeline evidence.
          </p>

          {selectedResult ? (
            <div>
              <div
                style={{
                  padding: '12px',
                  borderRadius: '8px',
                  backgroundColor: '#0a0f1d',
                  border: '1px solid #1e293b',
                  marginBottom: '14px',
                }}
              >
                <div style={{ fontSize: '11px', color: '#64748b', marginBottom: '4px' }}>VERDICT</div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '14px', fontWeight: 700, color: '#f8fafc' }}>
                    {selectedResult.title || `Step ${selectedResult.step}`}
                  </span>
                  <StatusBadge
                    status={
                      selectedResult.decision ||
                      selectedResult.action ||
                      selectedResult.status ||
                      'RECORDED'
                    }
                  />
                </div>
              </div>

              <div style={{ fontSize: '11px', color: '#64748b', marginBottom: '6px', fontWeight: 600 }}>
                TELEMETRY & STATE PAYLOAD
              </div>
              <pre
                style={{
                  backgroundColor: '#070a12',
                  border: '1px solid #1e293b',
                  borderRadius: '8px',
                  padding: '12px',
                  color: '#38bdf8',
                  fontSize: '11px',
                  fontFamily: 'JetBrains Mono, monospace',
                  maxHeight: '380px',
                  overflowY: 'auto',
                  whiteSpace: 'pre-wrap',
                }}
              >
                {JSON.stringify(selectedResult, null, 2)}
              </pre>
            </div>
          ) : (
            <div
              style={{
                padding: '40px 20px',
                textAlign: 'center',
                color: '#64748b',
                fontSize: '13px',
                border: '1px dashed #1e293b',
                borderRadius: '8px',
              }}
            >
              Click "Run Step" or "Auto-Play Story" to inspect live security decisions.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
