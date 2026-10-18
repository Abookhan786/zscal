import React, { useEffect, useState } from 'react';
import { Users, KeyRound, Shield, CheckCircle2, Lock } from 'lucide-react';
import { api } from '../services/api';
import { StatusBadge } from '../components/StatusBadge';
import { User } from '../types';

export const UsersPage: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [groups, setGroups] = useState<any[]>([]);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      const [uList, gList] = await Promise.all([
        api.getUsers(),
        api.getGroups(),
      ]);
      setUsers(uList);
      setGroups(gList);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div style={{ padding: '24px', maxWidth: '1400px', margin: '0 auto' }}>
      <div style={{ marginBottom: '20px' }}>
        <h2 style={{ fontSize: '20px', fontWeight: 800, color: '#f8fafc' }}>
          Identity & Access Directory
        </h2>
        <p style={{ fontSize: '13px', color: '#64748b' }}>
          Section 9-10 Specification: Enterprise identity store, TOTP MFA status, department groups, and dynamic user risk.
        </p>
      </div>

      <div className="glass-panel" style={{ padding: '20px' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '12px' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #1e293b', color: '#64748b', fontSize: '11px' }}>
              <th style={{ padding: '10px 12px' }}>USERNAME</th>
              <th style={{ padding: '10px 12px' }}>EMAIL</th>
              <th style={{ padding: '10px 12px' }}>DEPARTMENT</th>
              <th style={{ padding: '10px 12px' }}>ASSIGNED ROLE</th>
              <th style={{ padding: '10px 12px' }}>MFA STATUS</th>
              <th style={{ padding: '10px 12px' }}>CURRENT RISK</th>
              <th style={{ padding: '10px 12px' }}>ACCOUNT STATE</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} style={{ borderBottom: '1px solid #141c2e' }}>
                <td style={{ padding: '10px 12px', fontWeight: 700, color: '#f8fafc' }}>{u.username}</td>
                <td style={{ padding: '10px 12px', color: '#38bdf8' }}>{u.email}</td>
                <td style={{ padding: '10px 12px', color: '#cbd5e1' }}>{u.department}</td>
                <td style={{ padding: '10px 12px', fontWeight: 600 }}>{u.role}</td>
                <td style={{ padding: '10px 12px' }}>
                  <StatusBadge status={u.mfa_enabled ? 'MFA_ACTIVE' : 'MFA_DISABLED'} size="sm" />
                </td>
                <td style={{ padding: '10px 12px', fontWeight: 700, color: u.current_risk > 70 ? '#f43f5e' : '#10b981' }}>
                  {u.current_risk} / 100
                </td>
                <td style={{ padding: '10px 12px' }}>
                  <StatusBadge status={u.is_locked ? 'LOCKED' : 'ACTIVE'} size="sm" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
