import React, { useEffect, useState } from 'react';
import { AlertTriangle, ShieldAlert, CheckCircle2, User, FileText, ArrowRight } from 'lucide-react';
import { api } from '../services/api';
import { StatusBadge } from '../components/StatusBadge';
import { Incident } from '../types';

export const IncidentsPage: React.FC = () => {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [selectedIncident, setSelectedIncident] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadIncidents();
  }, []);

  const loadIncidents = async () => {
    try {
      const data = await api.getIncidents();
      setIncidents(data);
      if (data.length > 0) {
        loadDetails(data[0].id);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadDetails = async (id: string) => {
    try {
      const res = await api.getIncidentDetails(id);
      setSelectedIncident(res);
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdateStatus = async (id: string, newStatus: string) => {
    try {
      await api.updateIncident(id, { status: newStatus });
      loadIncidents();
      loadDetails(id);
    } catch (err: any) {
      alert(`Update failed: ${err.message}`);
    }
  };

  return (
    <div style={{ padding: '24px', maxWidth: '1400px', margin: '0 auto' }}>
      <div style={{ marginBottom: '20px' }}>
        <h2 style={{ fontSize: '20px', fontWeight: 800, color: '#f8fafc' }}>
          SOC Incident Management & Evidence Timeline
        </h2>
        <p style={{ fontSize: '13px', color: '#64748b' }}>
          Section 29-30 Specification: Correlated multi-signal security incidents with evidence artifacts and analyst containment workflows.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '460px 1fr', gap: '24px' }}>
        {/* Incident List */}
        <div className="glass-panel" style={{ padding: '20px', height: 'fit-content' }}>
          <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#f8fafc', marginBottom: '14px' }}>
            Open Security Incidents ({incidents.length})
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {incidents.map((inc) => (
              <div
                key={inc.id}
                onClick={() => loadDetails(inc.id)}
                style={{
                  padding: '14px',
                  borderRadius: '8px',
                  backgroundColor: selectedIncident?.incident?.id === inc.id ? 'rgba(6, 182, 212, 0.1)' : '#070a14',
                  border: selectedIncident?.incident?.id === inc.id ? '1px solid rgba(6, 182, 212, 0.4)' : '1px solid #1e293b',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <span style={{ fontSize: '12px', fontWeight: 700, color: '#38bdf8', fontFamily: 'JetBrains Mono, monospace' }}>
                    {inc.incident_number}
                  </span>
                  <StatusBadge status={inc.status} size="sm" />
                </div>
                <div style={{ fontSize: '13px', fontWeight: 700, color: '#f8fafc', marginBottom: '4px' }}>
                  {inc.title}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '11px', color: '#64748b' }}>
                  <span>User: <strong style={{ color: '#cbd5e1' }}>{inc.affected_user || 'Unknown'}</strong></span>
                  <StatusBadge status={inc.severity} size="sm" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Selected Incident Details & Evidence */}
        <div className="glass-panel" style={{ padding: '24px' }}>
          {selectedIncident?.incident ? (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                <div>
                  <span style={{ fontSize: '12px', color: '#06b6d4', fontWeight: 700, fontFamily: 'JetBrains Mono, monospace' }}>
                    {selectedIncident.incident.incident_number}
                  </span>
                  <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#f8fafc', marginTop: '2px' }}>
                    {selectedIncident.incident.title}
                  </h3>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    className="btn-secondary"
                    style={{ fontSize: '11px', padding: '6px 12px' }}
                    onClick={() => handleUpdateStatus(selectedIncident.incident.id, 'CONTAINED')}
                  >
                    Mark Contained
                  </button>
                  <button
                    className="btn-primary"
                    style={{ fontSize: '11px', padding: '6px 12px' }}
                    onClick={() => handleUpdateStatus(selectedIncident.incident.id, 'RESOLVED')}
                  >
                    Resolve Incident
                  </button>
                </div>
              </div>

              {/* Overview Details Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', backgroundColor: '#070a14', padding: '14px', borderRadius: '8px', marginBottom: '20px' }}>
                <div>
                  <div style={{ fontSize: '11px', color: '#64748b' }}>AFFECTED ENTITY</div>
                  <div style={{ fontSize: '13px', fontWeight: 600, color: '#f8fafc' }}>
                    {selectedIncident.incident.affected_user || 'System'}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '11px', color: '#64748b' }}>ASSIGNED ANALYST</div>
                  <div style={{ fontSize: '13px', fontWeight: 600, color: '#f8fafc' }}>
                    {selectedIncident.incident.assignee}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '11px', color: '#64748b' }}>SEVERITY LEVEL</div>
                  <StatusBadge status={selectedIncident.incident.severity} size="sm" />
                </div>
              </div>

              <div style={{ marginBottom: '20px' }}>
                <div style={{ fontSize: '12px', fontWeight: 700, color: '#64748b', marginBottom: '6px' }}>
                  INVESTIGATION SUMMARY
                </div>
                <p style={{ fontSize: '13px', color: '#cbd5e1', lineHeight: 1.5 }}>
                  {selectedIncident.incident.summary}
                </p>
              </div>

              {/* Attached Evidence Artifacts */}
              <div>
                <div style={{ fontSize: '12px', fontWeight: 700, color: '#64748b', marginBottom: '10px' }}>
                  FORENSIC EVIDENCE ARTIFACTS ({selectedIncident.evidence?.length || 0})
                </div>

                {selectedIncident.evidence?.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {selectedIncident.evidence.map((ev: any) => (
                      <div key={ev.id} style={{ backgroundColor: '#070a12', border: '1px solid #1e293b', borderRadius: '8px', padding: '12px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                          <span style={{ fontSize: '12px', fontWeight: 700, color: '#38bdf8' }}>
                            {ev.evidence_type}: {ev.description}
                          </span>
                          <span style={{ fontSize: '10px', color: '#64748b' }}>
                            {new Date(ev.collected_at).toLocaleTimeString()}
                          </span>
                        </div>
                        <pre
                          style={{
                            color: '#cbd5e1',
                            fontSize: '11px',
                            fontFamily: 'JetBrains Mono, monospace',
                            whiteSpace: 'pre-wrap',
                          }}
                        >
                          {JSON.stringify(ev.data, null, 2)}
                        </pre>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ color: '#64748b', fontSize: '12px' }}>No attached evidence files.</div>
                )}
              </div>
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '60px 0', color: '#64748b' }}>
              Select an incident from the left to inspect evidence.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
