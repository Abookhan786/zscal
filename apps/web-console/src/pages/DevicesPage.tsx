import React, { useEffect, useState } from 'react';
import { Laptop, Shield, ShieldAlert, Check, X, RefreshCw } from 'lucide-react';
import { api } from '../services/api';
import { StatusBadge } from '../components/StatusBadge';
import { Device } from '../types';

export const DevicesPage: React.FC = () => {
  const [devices, setDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDevices();
  }, []);

  const loadDevices = async () => {
    try {
      const data = await api.getDevices();
      setDevices(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const toggleFirewall = async (dev: Device) => {
    const currentFw = dev.posture?.firewall_enabled ?? true;
    try {
      await api.reportPosture({
        device_id: dev.id,
        firewall_enabled: !currentFw,
        antivirus_enabled: dev.posture?.antivirus_enabled ?? true,
        disk_encrypted: dev.posture?.disk_encrypted ?? true,
        screen_lock_enabled: dev.posture?.screen_lock_enabled ?? true,
        patches_up_to_date: dev.posture?.patches_up_to_date ?? true,
        certificate_valid: true,
      });
      loadDevices();
    } catch (err: any) {
      alert(`Error updating posture: ${err.message}`);
    }
  };

  return (
    <div style={{ padding: '24px', maxWidth: '1400px', margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
        <div>
          <h2 style={{ fontSize: '20px', fontWeight: 800, color: '#f8fafc' }}>
            Device Inventory & Posture Engine
          </h2>
          <p style={{ fontSize: '13px', color: '#64748b' }}>
            Section 15 Specification: Continuous endpoint health evaluation (Disk encryption, Host firewall, Antivirus, OS patch hygiene).
          </p>
        </div>
        <button className="btn-secondary" onClick={loadDevices}>
          <RefreshCw size={14} /> Refresh Endpoints
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '18px' }}>
        {devices.map((d) => (
          <div key={d.id} className="glass-panel" style={{ padding: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Laptop size={20} color="#06b6d4" />
                <div>
                  <div style={{ fontSize: '15px', fontWeight: 700, color: '#f8fafc' }}>
                    {d.device_name}
                  </div>
                  <div style={{ fontSize: '11px', color: '#64748b' }}>
                    {d.hostname} ({d.os} {d.os_version})
                  </div>
                </div>
              </div>
              <StatusBadge status={d.compliance_status} size="sm" />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', backgroundColor: '#070a14', borderRadius: '8px', marginBottom: '16px' }}>
              <span style={{ fontSize: '12px', color: '#94a3b8' }}>Endpoint Risk Score:</span>
              <span style={{ fontSize: '14px', fontWeight: 800, color: d.risk_score > 75 ? '#f43f5e' : '#10b981' }}>
                {d.risk_score} / 100
              </span>
            </div>

            {/* Posture Checks Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '12px', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                {d.posture?.firewall_enabled ? <Check size={14} color="#10b981" /> : <X size={14} color="#f43f5e" />}
                <span style={{ color: d.posture?.firewall_enabled ? '#cbd5e1' : '#f43f5e' }}>Firewall Enabled</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                {d.posture?.antivirus_enabled ? <Check size={14} color="#10b981" /> : <X size={14} color="#f43f5e" />}
                <span style={{ color: d.posture?.antivirus_enabled ? '#cbd5e1' : '#f43f5e' }}>Antivirus Active</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                {d.posture?.disk_encrypted ? <Check size={14} color="#10b981" /> : <X size={14} color="#f43f5e" />}
                <span style={{ color: d.posture?.disk_encrypted ? '#cbd5e1' : '#f43f5e' }}>Disk Encrypted</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                {d.posture?.patches_up_to_date ? <Check size={14} color="#10b981" /> : <X size={14} color="#f43f5e" />}
                <span style={{ color: d.posture?.patches_up_to_date ? '#cbd5e1' : '#f43f5e' }}>OS Patches Current</span>
              </div>
            </div>

            <div style={{ borderTop: '1px solid #1e293b', paddingTop: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '11px', color: '#64748b' }}>Agent: v{d.agent_version}</span>
              <button
                className="btn-secondary"
                style={{ fontSize: '11px', padding: '4px 10px' }}
                onClick={() => toggleFirewall(d)}
              >
                Toggle Firewall ({d.posture?.firewall_enabled ? 'Disable' : 'Enable'})
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
