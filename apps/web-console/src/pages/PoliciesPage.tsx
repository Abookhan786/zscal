import React, { useEffect, useState } from 'react';
import { KeyRound, Plus, Trash2, Shield, AlertCircle } from 'lucide-react';
import { api } from '../services/api';
import { StatusBadge } from '../components/StatusBadge';
import { Policy } from '../types';

export const PoliciesPage: React.FC = () => {
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [newPolicyName, setNewPolicyName] = useState('');
  const [newPriority, setNewPriority] = useState(150);
  const [newAction, setNewAction] = useState<'ALLOW' | 'DENY' | 'STEP_UP_MFA'>('ALLOW');
  const [newRole, setNewRole] = useState('developer');
  const [newApp, setNewApp] = useState('git.internal');

  useEffect(() => {
    loadPolicies();
  }, []);

  const loadPolicies = async () => {
    try {
      const data = await api.getPolicies();
      setPolicies(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    try {
      await api.createPolicy({
        name: newPolicyName,
        priority: Number(newPriority),
        action: newAction,
        conditions: {
          user: { role: newRole },
          application: { domain: newApp },
          device: { managed: true },
        },
      });
      setShowModal(false);
      setNewPolicyName('');
      loadPolicies();
    } catch (err: any) {
      alert(`Error creating policy: ${err.message}`);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this Zero Trust policy?')) {
      await api.deletePolicy(id);
      loadPolicies();
    }
  };

  return (
    <div style={{ padding: '24px', maxWidth: '1400px', margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
        <div>
          <h2 style={{ fontSize: '20px', fontWeight: 800, color: '#f8fafc' }}>
            Zero Trust Policy Engine
          </h2>
          <p style={{ fontSize: '13px', color: '#64748b' }}>
            Section 11-13 Specification: Strict priority ordering with first-match evaluation and explicit deny precedence.
          </p>
        </div>
        <button className="btn-primary" onClick={() => setShowModal(true)}>
          <Plus size={16} /> Create Policy Rule
        </button>
      </div>

      <div className="glass-panel" style={{ padding: '20px', overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #1e293b', color: '#64748b', fontSize: '11px', fontWeight: 700 }}>
              <th style={{ padding: '12px 14px' }}>PRIORITY</th>
              <th style={{ padding: '12px 14px' }}>POLICY NAME</th>
              <th style={{ padding: '12px 14px' }}>ACTION</th>
              <th style={{ padding: '12px 14px' }}>STATUS</th>
              <th style={{ padding: '12px 14px' }}>CONDITIONS SUMMARY</th>
              <th style={{ padding: '12px 14px' }}>VERSION</th>
              <th style={{ padding: '12px 14px', textAlign: 'right' }}>ACTIONS</th>
            </tr>
          </thead>
          <tbody>
            {policies.map((p) => (
              <tr
                key={p.id}
                style={{
                  borderBottom: '1px solid #141c2e',
                  color: '#cbd5e1',
                  transition: 'background-color 0.15s ease',
                }}
              >
                <td style={{ padding: '12px 14px', fontWeight: 700, color: '#06b6d4' }}>
                  #{p.priority}
                </td>
                <td style={{ padding: '12px 14px', fontWeight: 600, color: '#f8fafc' }}>
                  <div>{p.name}</div>
                  <div style={{ fontSize: '11px', color: '#64748b' }}>{p.description}</div>
                </td>
                <td style={{ padding: '12px 14px' }}>
                  <StatusBadge status={p.action} size="sm" />
                </td>
                <td style={{ padding: '12px 14px' }}>
                  <StatusBadge status={p.status} size="sm" />
                </td>
                <td style={{ padding: '12px 14px', fontSize: '12px', color: '#94a3b8' }}>
                  <code style={{ backgroundColor: '#070a12', padding: '2px 6px', borderRadius: '4px' }}>
                    {JSON.stringify(p.conditions || {})}
                  </code>
                </td>
                <td style={{ padding: '12px 14px', color: '#64748b' }}>
                  v{p.version}
                </td>
                <td style={{ padding: '12px 14px', textAlign: 'right' }}>
                  <button
                    onClick={() => handleDelete(p.id)}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: '#f43f5e',
                      cursor: 'pointer',
                      padding: '4px',
                    }}
                  >
                    <Trash2 size={16} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* New Policy Modal */}
      {showModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 50,
          }}
        >
          <div className="glass-panel" style={{ padding: '24px', width: '480px', backgroundColor: '#0d1322' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#f8fafc', marginBottom: '16px' }}>
              Create Zero Trust Rule
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '20px' }}>
              <div>
                <label style={{ fontSize: '11px', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>NAME</label>
                <input
                  type="text"
                  value={newPolicyName}
                  onChange={(e) => setNewPolicyName(e.target.value)}
                  placeholder="e.g. Staging Kubernetes Access"
                  style={{ width: '100%', padding: '8px 12px', backgroundColor: '#0a0f1d', border: '1px solid #1e293b', borderRadius: '6px', color: '#f8fafc' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ fontSize: '11px', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>PRIORITY</label>
                  <input
                    type="number"
                    value={newPriority}
                    onChange={(e) => setNewPriority(Number(e.target.value))}
                    style={{ width: '100%', padding: '8px 12px', backgroundColor: '#0a0f1d', border: '1px solid #1e293b', borderRadius: '6px', color: '#f8fafc' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '11px', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>ACTION</label>
                  <select
                    value={newAction}
                    onChange={(e: any) => setNewAction(e.target.value)}
                    style={{ width: '100%', padding: '8px 12px', backgroundColor: '#0a0f1d', border: '1px solid #1e293b', borderRadius: '6px', color: '#f8fafc' }}
                  >
                    <option value="ALLOW">ALLOW</option>
                    <option value="DENY">DENY</option>
                    <option value="STEP_UP_MFA">STEP_UP_MFA</option>
                  </select>
                </div>
              </div>

              <div>
                <label style={{ fontSize: '11px', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>REQUIRED ROLE</label>
                <input
                  type="text"
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value)}
                  style={{ width: '100%', padding: '8px 12px', backgroundColor: '#0a0f1d', border: '1px solid #1e293b', borderRadius: '6px', color: '#f8fafc' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '11px', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>APPLICATION DOMAIN</label>
                <input
                  type="text"
                  value={newApp}
                  onChange={(e) => setNewApp(e.target.value)}
                  style={{ width: '100%', padding: '8px 12px', backgroundColor: '#0a0f1d', border: '1px solid #1e293b', borderRadius: '6px', color: '#f8fafc' }}
                />
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button className="btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
              <button className="btn-primary" onClick={handleCreate}>Save Policy</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
