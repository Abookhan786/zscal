const API_BASE = 'http://localhost:8000';

export async function fetchApi<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = endpoint.startsWith('http') ? endpoint : `${API_BASE}${endpoint}`;
  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (!res.ok) {
    let errDetail = 'Request failed';
    try {
      const errJson = await res.json();
      errDetail = typeof errJson.detail === 'string' ? errJson.detail : JSON.stringify(errJson.detail || errJson);
    } catch {
      errDetail = `HTTP ${res.status} ${res.statusText}`;
    }
    throw new Error(errDetail);
  }

  return res.json();
}

// Control Plane APIs
export const api = {
  // Identity
  getUsers: () => fetchApi<any[]>('/api/v1/identity/users'),
  getGroups: () => fetchApi<any[]>('/api/v1/identity/groups'),
  getRoles: () => fetchApi<any[]>('/api/v1/identity/roles'),

  // Devices & Posture
  getDevices: () => fetchApi<any[]>('/api/v1/posture/devices'),
  reportPosture: (data: any) => fetchApi<any>('/api/v1/posture/report', { method: 'POST', body: JSON.stringify(data) }),

  // Policies
  getPolicies: () => fetchApi<any[]>('/api/v1/policies/'),
  createPolicy: (data: any) => fetchApi<any>('/api/v1/policies/', { method: 'POST', body: JSON.stringify(data) }),
  deletePolicy: (id: string) => fetchApi<any>(`/api/v1/policies/${id}`, { method: 'DELETE' }),
  simulatePolicy: (data: any) => fetchApi<any>('/api/v1/policies/simulate', { method: 'POST', body: JSON.stringify(data) }),

  // Private Access
  getApplications: () => fetchApi<any[]>('/api/v1/access/applications'),
  getActiveSessions: () => fetchApi<any[]>('/api/v1/access/sessions'),
  getAccessLogs: () => fetchApi<any[]>('/api/v1/access/logs'),
  requestAccess: (data: any) => fetchApi<any>('/api/v1/access/request', { method: 'POST', body: JSON.stringify(data) }),

  // Connectors
  getConnectors: () => fetchApi<any[]>('/api/v1/connectors/'),
  getConnectorGroups: () => fetchApi<any[]>('/api/v1/connectors/groups'),
  simulateConnectorFailure: (id: string) => fetchApi<any>(`/api/v1/connectors/${id}/simulate-failure`, { method: 'POST' }),

  // Web & DNS Security
  inspectUrl: (data: any) => fetchApi<any>('/api/v1/web-security/inspect-url', { method: 'POST', body: JSON.stringify(data) }),
  inspectDns: (data: any) => fetchApi<any>('/api/v1/web-security/dns-query', { method: 'POST', body: JSON.stringify(data) }),
  getWebLogs: () => fetchApi<any[]>('/api/v1/web-security/logs'),
  getDnsLogs: () => fetchApi<any[]>('/api/v1/web-security/dns-logs'),

  // WAF
  inspectWaf: (data: any) => fetchApi<any>('/api/v1/waf/inspect', { method: 'POST', body: JSON.stringify(data) }),
  getWafEvents: () => fetchApi<any[]>('/api/v1/waf/events'),
  getWafRules: () => fetchApi<any[]>('/api/v1/waf/rules'),

  // DLP
  scanDlp: (data: any) => fetchApi<any>('/api/v1/dlp/scan', { method: 'POST', body: JSON.stringify(data) }),
  getDlpEvents: () => fetchApi<any[]>('/api/v1/dlp/events'),
  getDlpRules: () => fetchApi<any[]>('/api/v1/dlp/rules'),

  // Risk
  getRiskOverview: () => fetchApi<any>('/api/v1/risk/scores'),
  evaluateRisk: (data: any) => fetchApi<any>('/api/v1/risk/evaluate', { method: 'POST', body: JSON.stringify(data) }),

  // Events & SIEM
  getEvents: () => fetchApi<any[]>('/api/v1/events/'),

  // Alerts & Incidents
  getAlerts: () => fetchApi<any[]>('/api/v1/alerts/'),
  getIncidents: () => fetchApi<any[]>('/api/v1/incidents/'),
  getIncidentDetails: (id: string) => fetchApi<any>(`/api/v1/incidents/${id}`),
  updateIncident: (id: string, data: any) => fetchApi<any>(`/api/v1/incidents/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),

  // DEM
  getExperienceMetrics: () => fetchApi<any[]>('/api/v1/experience/metrics'),
  simulateExperienceSpike: (data: any) => fetchApi<any>('/api/v1/experience/simulate-spike', { method: 'POST', body: JSON.stringify(data) }),
  resetExperienceMetrics: () => fetchApi<any>('/api/v1/experience/reset-metrics', { method: 'POST' }),

  // Reports & Audits
  getAuditLogs: () => fetchApi<any[]>('/api/v1/audit/logs'),
  getReports: () => fetchApi<any[]>('/api/v1/reports/'),
  generateReport: (type: string, format = 'json') => `${API_BASE}/api/v1/reports/generate/${type}?format=${format}`,

  // Demonstration Scenario (Section 77)
  executeScenarioStep: (stepNumber: number) => fetchApi<any>(`/api/v1/scenario/step/${stepNumber}`, { method: 'POST' }),
  resetScenario: () => fetchApi<any>('/api/v1/scenario/reset', { method: 'POST' }),

  // System Health
  getHealth: () => fetchApi<any>('/health')
};
