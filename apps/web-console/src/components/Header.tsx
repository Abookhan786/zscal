import React from 'react';
import { Radio, ShieldAlert, User, Bell } from 'lucide-react';

interface HeaderProps {
  title: string;
  subtitle: string;
  onRunDemo?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ title, subtitle, onRunDemo }) => {
  return (
    <header
      style={{
        height: '68px',
        borderBottom: '1px solid #1e293b',
        backgroundColor: '#0a0f1d',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 28px',
        position: 'sticky',
        top: 0,
        zIndex: 30,
      }}
    >
      <div>
        <h1 style={{ fontSize: '18px', fontWeight: 700, color: '#f8fafc', letterSpacing: '-0.01em' }}>
          {title}
        </h1>
        <p style={{ fontSize: '12px', color: '#64748b' }}>{subtitle}</p>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
        {/* Real-time SSE indicator */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            backgroundColor: 'rgba(16, 185, 129, 0.1)',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            borderRadius: '9999px',
            padding: '5px 12px',
            fontSize: '11px',
            fontWeight: 600,
            color: '#34d399',
          }}
        >
          <span
            style={{
              width: '7px',
              height: '7px',
              borderRadius: '50%',
              backgroundColor: '#10b981',
              boxShadow: '0 0 10px #10b981',
            }}
          />
          <Radio size={13} />
          SSE STREAM ACTIVE
        </div>

        {/* Global Threat Level */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            backgroundColor: 'rgba(6, 182, 212, 0.1)',
            border: '1px solid rgba(6, 182, 212, 0.3)',
            borderRadius: '9999px',
            padding: '5px 12px',
            fontSize: '11px',
            fontWeight: 600,
            color: '#38bdf8',
          }}
        >
          <ShieldAlert size={13} />
          POSTURE: ENFORCED
        </div>

        {/* User context badge */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            backgroundColor: '#131b2e',
            border: '1px solid #1e293b',
            padding: '4px 10px',
            borderRadius: '8px',
            fontSize: '12px',
          }}
        >
          <div
            style={{
              width: '26px',
              height: '26px',
              borderRadius: '50%',
              backgroundColor: '#0284c7',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff',
              fontWeight: 700,
              fontSize: '12px',
            }}
          >
            A
          </div>
          <div>
            <div style={{ color: '#f8fafc', fontWeight: 600, fontSize: '12px' }}>alice</div>
            <div style={{ color: '#64748b', fontSize: '10px' }}>developer</div>
          </div>
        </div>
      </div>
    </header>
  );
};
