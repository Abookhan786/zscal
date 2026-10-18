export interface User {
  id: string;
  username: string;
  email: string;
  full_name: string;
  department: string;
  role: string;
  mfa_enabled: boolean;
  is_active: boolean;
  is_locked: boolean;
  current_risk: number;
  last_login_at?: string;
}

export interface DevicePosture {
  firewall_enabled: boolean;
  antivirus_enabled: boolean;
  disk_encrypted: boolean;
  screen_lock_enabled: boolean;
  patches_up_to_date: boolean;
  certificate_valid: boolean;
  reported_ip: string;
}

export interface Device {
  id: string;
  device_name: string;
  hostname: string;
  os: string;
  os_version: string;
  agent_version: string;
  is_managed: boolean;
  compliance_status: 'COMPLIANT' | 'DEGRADED' | 'NON_COMPLIANT' | 'UNKNOWN';
  risk_score: number;
  last_seen_at?: string;
  posture?: DevicePosture;
}

export interface Application {
  id: string;
  name: string;
  domain: string;
  port: number;
  protocol: string;
  sensitivity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  status: string;
  health: string;
  connector_group_id?: string;
  description?: string;
}

export interface Connector {
  id: string;
  name: string;
  region: string;
  status: 'ONLINE' | 'DEGRADED' | 'OFFLINE' | 'ENROLLING' | 'QUARANTINED';
  version: string;
  ip_address: string;
  cpu_usage: number;
  memory_usage: number;
  latency_ms: number;
  active_sessions: number;
  last_heartbeat_at?: string;
}

export interface Policy {
  id: string;
  name: string;
  description?: string;
  priority: number;
  action: 'ALLOW' | 'DENY' | 'STEP_UP_MFA' | 'REQUIRE_COMPLIANT_DEVICE' | 'READ_ONLY';
  status: 'ACTIVE' | 'TESTING' | 'DRAFT' | 'DEPRECATED';
  version: number;
  conditions: Record<string, any>;
  created_by?: string;
  created_at?: string;
}

export interface SecurityEvent {
  id: string;
  timestamp: string;
  event_type: string;
  severity: 'INFO' | 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  username?: string;
  device_id?: string;
  application?: string;
  reason?: string;
  risk_score?: number;
  source_ip?: string;
}

export interface Alert {
  id: string;
  title: string;
  description?: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  status: 'OPEN' | 'ACKNOWLEDGED' | 'RESOLVED' | 'DISMISSED';
  source: string;
  affected_entity?: string;
  created_at: string;
}

export interface Incident {
  id: string;
  incident_number: string;
  title: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  status: 'OPEN' | 'INVESTIGATING' | 'CONTAINED' | 'RESOLVED' | 'CLOSED';
  assignee: string;
  affected_user?: string;
  affected_device?: string;
  affected_application?: string;
  summary?: string;
  remediation_notes?: string;
  created_at: string;
  updated_at?: string;
}

export interface IncidentEvidence {
  id: string;
  evidence_type: string;
  description: string;
  data: Record<string, any>;
  collected_at: string;
}

export interface ExperienceMetric {
  id: string;
  application_name: string;
  dns_ms: number;
  tcp_ms: number;
  tls_ms: number;
  http_ms: number;
  total_ms: number;
  packet_loss_percent: number;
  availability_percent: number;
  status: 'OPTIMAL' | 'DEGRADED' | 'OUTAGE';
  timestamp: string;
}

export interface AccessDecision {
  id: string;
  timestamp: string;
  username: string;
  device_id: string;
  application: string;
  decision: string;
  matched_policy: string;
  risk_score: number;
  reason: string;
}

export interface WAFEvent {
  id: string;
  timestamp: string;
  application: string;
  attack_type: string;
  severity: string;
  action: string;
  matched_payload?: string;
  source_ip: string;
  rule_id?: string;
}

export interface DLPEvent {
  id: string;
  timestamp: string;
  username: string;
  file_name: string;
  sensitivity_type: string;
  action: string;
  severity: string;
  match_count: number;
  redacted_preview?: string;
  destination?: string;
}
