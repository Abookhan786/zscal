import React from 'react';

interface StatusBadgeProps {
  status: string;
  size?: 'sm' | 'md';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'md' }) => {
  const norm = (status || '').toUpperCase();

  let bg = 'rgba(100, 116, 139, 0.2)';
  let border = '#334155';
  let text = '#94a3b8';

  if (['COMPLIANT', 'ONLINE', 'ALLOW', 'HEALTHY', 'OPTIMAL', 'RESOLVED', 'ACTIVE', 'SUCCESS'].includes(norm)) {
    bg = 'rgba(16, 185, 129, 0.15)';
    border = 'rgba(16, 185, 129, 0.4)';
    text = '#34d399';
  } else if (['NON_COMPLIANT', 'BLOCK', 'CRITICAL', 'OUTAGE', 'OFFLINE', 'DENY', 'LOCKED'].includes(norm)) {
    bg = 'rgba(244, 63, 94, 0.15)';
    border = 'rgba(244, 63, 94, 0.4)';
    text = '#fb7185';
  } else if (['DEGRADED', 'MEDIUM', 'WARN', 'HIGH', 'STEP_UP_MFA', 'INVESTIGATING', 'OPEN'].includes(norm)) {
    bg = 'rgba(245, 158, 11, 0.15)';
    border = 'rgba(245, 158, 11, 0.4)';
    text = '#fbbf24';
  } else if (['INFO', 'LOW', 'CONTAINED'].includes(norm)) {
    bg = 'rgba(6, 182, 212, 0.15)';
    border = 'rgba(6, 182, 212, 0.4)';
    text = '#38bdf8';
  }

  const padding = size === 'sm' ? '2px 8px' : '4px 10px';
  const fontSize = size === 'sm' ? '11px' : '12px';

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '5px',
        background: bg,
        border: `1px solid ${border}`,
        color: text,
        padding,
        borderRadius: '9999px',
        fontSize,
        fontWeight: 600,
        letterSpacing: '0.03em',
        textTransform: 'uppercase',
      }}
    >
      <span
        style={{
          width: '6px',
          height: '6px',
          borderRadius: '50%',
          backgroundColor: text,
        }}
      />
      {status}
    </span>
  );
};
