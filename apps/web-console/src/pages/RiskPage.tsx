import React, { useEffect, useState } from 'react';
import { Shield, ShieldAlert, Users, Laptop } from 'lucide-react';
import { api } from '../services/api';
import { StatusBadge } from '../components/StatusBadge';

export const RiskPage: React.FC = () => {
  const [riskData, setRiskData] = useState<any>(null);

  useEffect(() => {
    loadRisk();
  }, []);

  const loadRisk = async () => {
    try {
      const res = await api.getRiskOverview();
      setRiskData(res);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div style={{ padding: '24px', maxWidth: '1400px', margin: '0 auto' }}>
      <div style={{ marginBottom: '20px' }}>
        <h2 style={{ fontSize: '20px', fontWeight: 800, color: '#f8fafc' }}>
          Adaptive Risk Engine & Scoring Bands
        </h2>
        <p style={{ fontSize: '13px', color: '#64748b' }}>
          Section 16-17 Specification: Continuous context-aware risk calculation (0-30: LOW, 31-60: MEDIUM, 61-80: HIGH, 81-100: CRITICAL).
        </p>
      </div>

      {riskData && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' }}>
          <div className="glass-panel" style={{ padding: '20px' }}>
            <span style={{ fontSize: '12px', color: '#94a3b8' }}>CRITICAL ENTITIES (80+)</span>
            <div style={{ fontSize: '24px', fontWeight: 800, color: '#f43f5e', marginTop: '4px' }}>
              {riskData.summary?.critical_entities}
            </div>
          </div>
          <div className="glass-panel" style={{ padding: '20px' }}>
            <span style={{ fontSize: '12px', color: '#94a3b8' }}>HIGH RISK ENTITIES (60-80)</span>
            <div style={{ fontSize: '24px', fontWeight: 800, color: '#f59e0b', marginTop: '4px' }}>
              {riskData.summary?.high_risk_entities}
            </div>
          </div>
          <div className="glass-panel" style={{ padding: '20px' }}>
            <span style={{ fontSize: '12px', color: '#94a3b8' }}>AVG USER RISK</span>
            <div style={{ fontSize: '24px', fontWeight: 800, color: '#06b6d4', marginTop: '4px' }}>
              {riskData.summary?.average_user_risk?.toFixed(1)} / 100
            </div>
          </div>
          <div className="glass-panel" style={{ padding: '20px' }}>
            <span style={{ fontSize: '12px', color: '#94a3b8' }}>AVG ENDPOINT RISK</span>
            <div style={{ fontSize: '24px', fontWeight: 800, color: '#10b981', marginTop: '4px' }}>
              {riskData.summary?.average_device_risk?.toFixed(1)} / 100
            </div>
          </div>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
        {/* User Risk Matrix */}
        <div className="glass-panel" style={{ padding: '20px' }}>
          <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#f8fafc', marginBottom: '14px' }}>
            User Identity Risk Distribution
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {riskData?.users?.map((u: any) => (
              <div
                key={u.id}
                style={{
                  padding: '12px',
                  backgroundColor: '#0c111e',
                  border: '1px solid #1e293b',
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 700, color: '#f8fafc' }}>{u.name}</div>
                  <div style={{ fontSize: '11px', color: '#64748b' }}>Role: {u.role} | {u.department}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span style={{ fontSize: '15px', fontWeight: 800, color: u.risk > 70 ? '#f43f5e' : u.risk > 40 ? '#f59e0b' : '#10b981' }}>
                    {u.risk}
                  </span>
                  <div style={{ fontSize: '10px', color: '#64748b' }}>
                    {u.risk > 75 ? 'CRITICAL' : u.risk > 50 ? 'HIGH' : 'LOW'}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Device Risk Matrix */}
        <div className="glass-panel" style={{ padding: '20px' }}>
          <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#f8fafc', marginBottom: '14px' }}>
            Endpoint Risk & Posture Compliance
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {riskData?.devices?.map((d: any) => (
              <div
                key={d.id}
                style={{
                  padding: '12px',
                  backgroundColor: '#0c111e',
                  border: '1px solid #1e293b',
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 700, color: '#f8fafc' }}>{d.name}</div>
                  <div style={{ fontSize: '11px', color: '#64748b' }}>OS: {d.os}</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <StatusBadge status={d.compliance} size="sm" />
                  <span style={{ fontSize: '15px', fontWeight: 800, color: d.risk > 70 ? '#f43f5e' : '#10b981' }}>
                    {d.risk}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
