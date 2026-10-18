import React, { useEffect, useState } from 'react';
import { Gauge, Activity, AlertTriangle, RotateCcw, Flame } from 'lucide-react';
import { api } from '../services/api';
import { StatusBadge } from '../components/StatusBadge';
import { ExperienceMetric } from '../types';

export const ExperiencePage: React.FC = () => {
  const [metrics, setMetrics] = useState<ExperienceMetric[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMetrics();
  }, []);

  const loadMetrics = async () => {
    try {
      const data = await api.getExperienceMetrics();
      setMetrics(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSimulateSpike = async (appName: string) => {
    try {
      await api.simulateExperienceSpike({
        application_name: appName,
        http_latency_ms: 820.0,
        packet_loss_percent: 5.5,
      });
      loadMetrics();
    } catch (err: any) {
      alert(`Spike simulation failed: ${err.message}`);
    }
  };

  const handleResetMetrics = async () => {
    try {
      await api.resetExperienceMetrics();
      loadMetrics();
    } catch (err: any) {
      alert(`Reset failed: ${err.message}`);
    }
  };

  return (
    <div style={{ padding: '24px', maxWidth: '1400px', margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
        <div>
          <h2 style={{ fontSize: '20px', fontWeight: 800, color: '#f8fafc' }}>
            Digital Experience Monitoring (DEM)
          </h2>
          <p style={{ fontSize: '13px', color: '#64748b' }}>
            Section 31 Specification: Synthetic decomposed round-trip telemetry (DNS, TCP, TLS, and HTTP response latencies).
          </p>
        </div>
        <button className="btn-secondary" onClick={handleResetMetrics}>
          <RotateCcw size={14} /> Reset Baseline Metrics
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '20px' }}>
        {metrics.map((m) => (
          <div key={m.id} className="glass-panel" style={{ padding: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
              <div>
                <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#f8fafc' }}>
                  {m.application_name}
                </h3>
                <div style={{ fontSize: '11px', color: '#64748b' }}>
                  Availability: <strong style={{ color: '#10b981' }}>{m.availability_percent}%</strong> | Packet Loss: {m.packet_loss_percent}%
                </div>
              </div>
              <StatusBadge status={m.status} size="sm" />
            </div>

            {/* Total Latency Header */}
            <div
              style={{
                padding: '12px 16px',
                borderRadius: '8px',
                backgroundColor: m.total_ms > 400 ? 'rgba(244, 63, 94, 0.15)' : 'rgba(6, 182, 212, 0.1)',
                border: m.total_ms > 400 ? '1px solid rgba(244, 63, 94, 0.4)' : '1px solid rgba(6, 182, 212, 0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '16px',
              }}
            >
              <span style={{ fontSize: '12px', color: '#cbd5e1' }}>TOTAL ROUND-TRIP LATENCY:</span>
              <span style={{ fontSize: '20px', fontWeight: 800, color: m.total_ms > 400 ? '#f43f5e' : '#38bdf8' }}>
                {m.total_ms.toFixed(1)} ms
              </span>
            </div>

            {/* Decomposed Breakdown Meters */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '18px' }}>
              {[
                { label: 'DNS Resolution', val: m.dns_ms, color: '#06b6d4' },
                { label: 'TCP Handshake', val: m.tcp_ms, color: '#3b82f6' },
                { label: 'TLS Negotiation', val: m.tls_ms, color: '#8b5cf6' },
                { label: 'HTTP Response (TTFB)', val: m.http_ms, color: m.http_ms > 400 ? '#f43f5e' : '#10b981' },
              ].map((sub, i) => (
                <div key={i}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#94a3b8', marginBottom: '3px' }}>
                    <span>{sub.label}</span>
                    <span style={{ fontWeight: 600, color: sub.color }}>{sub.val.toFixed(1)} ms</span>
                  </div>
                  <div style={{ height: '4px', backgroundColor: '#1e293b', borderRadius: '2px', overflow: 'hidden' }}>
                    <div style={{ width: `${Math.min(100, (sub.val / m.total_ms) * 100)}%`, height: '100%', backgroundColor: sub.color }} />
                  </div>
                </div>
              ))}
            </div>

            <div style={{ borderTop: '1px solid #1e293b', paddingTop: '12px' }}>
              <button
                className="btn-danger"
                style={{ width: '100%', justifyContent: 'center', fontSize: '11px' }}
                onClick={() => handleSimulateSpike(m.application_name)}
              >
                <Flame size={13} /> Inject 900ms Latency Spike (Test Degradation Alarm)
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
