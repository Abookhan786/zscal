import React, { useEffect, useState } from 'react';
import { Radio, AlertOctagon, CheckCircle2, Cpu, Activity, ShieldCheck, Flame } from 'lucide-react';
import { api } from '../services/api';
import { StatusBadge } from '../components/StatusBadge';
import { Connector } from '../types';

export const ConnectorsPage: React.FC = () => {
  const [connectors, setConnectors] = useState<Connector[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadConnectors();
  }, []);

  const loadConnectors = async () => {
    try {
      const data = await api.getConnectors();
      setConnectors(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSimulateFailure = async (id: string) => {
    try {
      await api.simulateConnectorFailure(id);
      loadConnectors();
    } catch (err: any) {
      alert(`Error simulating failure: ${err.message}`);
    }
  };

  return (
    <div style={{ padding: '24px', maxWidth: '1400px', margin: '0 auto' }}>
      <div style={{ marginBottom: '20px' }}>
        <h2 style={{ fontSize: '20px', fontWeight: 800, color: '#f8fafc' }}>
          App Connector Mesh & High Availability
        </h2>
        <p style={{ fontSize: '13px', color: '#64748b' }}>
          Section 20-21 Specification: Outbound-only brokers connecting internal private infrastructure to the Zero Trust Control Plane with automatic failover.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '18px' }}>
        {connectors.map((conn) => (
          <div key={conn.id} className="glass-panel" style={{ padding: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Radio size={18} color="#06b6d4" />
                <span style={{ fontSize: '15px', fontWeight: 700, color: '#f8fafc' }}>
                  {conn.name}
                </span>
              </div>
              <StatusBadge status={conn.status} size="sm" />
            </div>

            <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '16px' }}>
              Region: <strong style={{ color: '#cbd5e1' }}>{conn.region}</strong> | IP: {conn.ip_address} | v{conn.version}
            </div>

            {/* Health Metrics Meters */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '18px' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#94a3b8', marginBottom: '3px' }}>
                  <span>CPU UTILIZATION</span>
                  <span style={{ fontWeight: 600 }}>{conn.cpu_usage.toFixed(1)}%</span>
                </div>
                <div style={{ height: '5px', backgroundColor: '#1e293b', borderRadius: '3px', overflow: 'hidden' }}>
                  <div style={{ width: `${Math.min(100, conn.cpu_usage)}%`, height: '100%', backgroundColor: conn.cpu_usage > 70 ? '#f43f5e' : '#06b6d4' }} />
                </div>
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#94a3b8', marginBottom: '3px' }}>
                  <span>MEMORY ALLOCATION</span>
                  <span style={{ fontWeight: 600 }}>{conn.memory_usage.toFixed(1)}%</span>
                </div>
                <div style={{ height: '5px', backgroundColor: '#1e293b', borderRadius: '3px', overflow: 'hidden' }}>
                  <div style={{ width: `${Math.min(100, conn.memory_usage)}%`, height: '100%', backgroundColor: '#10b981' }} />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#cbd5e1', paddingTop: '6px' }}>
                <span>Broker Latency:</span>
                <span style={{ fontWeight: 700, color: '#38bdf8' }}>{conn.latency_ms.toFixed(1)} ms</span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#cbd5e1' }}>
                <span>Active Micro-Tunnels:</span>
                <span style={{ fontWeight: 700, color: '#f8fafc' }}>{conn.active_sessions} sessions</span>
              </div>
            </div>

            <div style={{ borderTop: '1px solid #1e293b', paddingTop: '14px' }}>
              {conn.status === 'ONLINE' ? (
                <button
                  className="btn-danger"
                  style={{ width: '100%', justifyContent: 'center', fontSize: '11px', padding: '6px 12px' }}
                  onClick={() => handleSimulateFailure(conn.id)}
                >
                  <Flame size={13} /> Simulate Node Failure (Test Failover)
                </button>
              ) : (
                <div style={{ textAlign: 'center', color: '#f43f5e', fontSize: '12px', fontWeight: 600 }}>
                  Node offline. Traffic rerouted to secondary cluster node.
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
