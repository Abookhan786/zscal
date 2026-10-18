import React, { useEffect, useState } from 'react';
import { Terminal, Radio, RefreshCw } from 'lucide-react';
import { api } from '../services/api';
import { StatusBadge } from '../components/StatusBadge';
import { SecurityEvent } from '../types';

export const EventsPage: React.FC = () => {
  const [events, setEvents] = useState<SecurityEvent[]>([]);

  useEffect(() => {
    loadEvents();
    const eventSource = new EventSource('http://localhost:8000/api/v1/events/stream');
    eventSource.onmessage = (e) => {
      try {
        const parsed = JSON.parse(e.data);
        if (parsed.event_type && parsed.event_type !== 'CONNECTED') {
          setEvents((prev) => [parsed, ...prev.slice(0, 49)]);
        }
      } catch (err) {}
    };
    return () => eventSource.close();
  }, []);

  const loadEvents = async () => {
    try {
      const data = await api.getEvents();
      setEvents(data);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div style={{ padding: '24px', maxWidth: '1400px', margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
        <div>
          <h2 style={{ fontSize: '20px', fontWeight: 800, color: '#f8fafc' }}>
            Central Security Event Pipeline
          </h2>
          <p style={{ fontSize: '13px', color: '#64748b' }}>
            Section 27 Specification: Normalized security event stream (Kafka/SSE bus) capturing logins, denials, DLP blocks, and WAF threats.
          </p>
        </div>
        <button className="btn-secondary" onClick={loadEvents}>
          <RefreshCw size={14} /> Refresh Logs
        </button>
      </div>

      <div className="glass-panel" style={{ padding: '20px' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '12px' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #1e293b', color: '#64748b', fontSize: '11px' }}>
              <th style={{ padding: '10px 12px' }}>TIMESTAMP</th>
              <th style={{ padding: '10px 12px' }}>EVENT TYPE</th>
              <th style={{ padding: '10px 12px' }}>SEVERITY</th>
              <th style={{ padding: '10px 12px' }}>SUBJECT</th>
              <th style={{ padding: '10px 12px' }}>APPLICATION</th>
              <th style={{ padding: '10px 12px' }}>DETAILS / REASON</th>
              <th style={{ padding: '10px 12px' }}>SOURCE IP</th>
            </tr>
          </thead>
          <tbody>
            {events.map((e) => (
              <tr key={e.id} style={{ borderBottom: '1px solid #141c2e' }}>
                <td style={{ padding: '10px 12px', color: '#64748b' }}>
                  {new Date(e.timestamp).toLocaleTimeString()}
                </td>
                <td style={{ padding: '10px 12px', fontWeight: 700, color: '#f8fafc' }}>{e.event_type}</td>
                <td style={{ padding: '10px 12px' }}><StatusBadge status={e.severity} size="sm" /></td>
                <td style={{ padding: '10px 12px', color: '#cbd5e1' }}>{e.username || 'System'}</td>
                <td style={{ padding: '10px 12px', color: '#38bdf8' }}>{e.application || '-'}</td>
                <td style={{ padding: '10px 12px', color: '#94a3b8' }}>{e.reason}</td>
                <td style={{ padding: '10px 12px', color: '#64748b' }}>{e.source_ip || '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
