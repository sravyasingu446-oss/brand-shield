export type RiskLevel = 'HIGH' | 'MEDIUM' | 'LOW';

export type CaseStatus = 
  | 'NEW' 
  | 'IN_REVIEW' 
  | 'CONFIRMED_IMPERSONATION' 
  | 'FALSE_POSITIVE' 
  | 'RESOLVED' 
  | 'CLOSED';

export type TargetType = 
  | 'SOCIAL_PROFILE' 
  | 'MOBILE_APP' 
  | 'PHISHING_URL' 
  | 'FAKE_PAGE';

export type AlertSeverity = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';

export interface BrandAsset {
  id: number;
  brand_id: number;
  asset_type: 'DOMAIN' | 'SOCIAL_HANDLE' | 'MOBILE_APP' | 'TRADEMARK';
  platform: string;
  value: string;
  is_verified: boolean;
  notes?: string;
  created_at: string;
}

export interface Brand {
  id: number;
  name: string;
  organization_name: string;
  industry: string;
  description?: string;
  primary_domain: string;
  logo_url?: string;
  contact_email: string;
  trademark_names?: string;
  created_at: string;
  updated_at: string;
  assets: BrandAsset[];
}

export interface ExplainabilityFactor {
  factor_name: string;
  category: string;
  weight: number;
  score_contribution: number;
  description: string;
  risk_direction: 'POSITIVE' | 'MITIGATING';
}

export interface ExplainabilityReport {
  final_score: number;
  risk_level: RiskLevel;
  confidence: number;
  factors: ExplainabilityFactor[];
  summary_rationale: string;
  mitigations_present: string[];
}

export interface EvidenceItem {
  id: number;
  case_id: number;
  evidence_type: string;
  title: string;
  description: string;
  value: string;
  severity: AlertSeverity | 'INFO';
  sha256_hash?: string;
  created_at: string;
}

export interface InvestigationCase {
  id: number;
  case_number: string;
  brand_id: number;
  brand_name: string;
  target_type: TargetType;
  target_name: string;
  target_url?: string;
  target_identifier: string;
  risk_score: number;
  risk_level: RiskLevel;
  status: CaseStatus;
  threat_category: string;
  summary: string;
  reviewer_name?: string;
  review_notes?: string;
  reviewed_at?: string;
  action_taken?: string;
  created_at: string;
  updated_at: string;
  explainability?: ExplainabilityReport;
  agent_telemetry?: any[];
  evidence?: EvidenceItem[];
}

export interface Alert {
  id: number;
  case_id?: number;
  brand_id: number;
  brand_name: string;
  case_number?: string;
  title: string;
  message: string;
  severity: AlertSeverity;
  is_read: boolean;
  is_dismissed: boolean;
  created_at: string;
}

export interface ReportItem {
  id: number;
  report_number: string;
  case_id: number;
  case_number?: string;
  brand_name: string;
  risk_level: RiskLevel;
  risk_score: number;
  title: string;
  executive_summary: string;
  generated_by: string;
  created_at: string;
  methodology?: string;
  threat_indicators?: any[];
  remediation_playbook?: any[];
}

export interface AgentStatus {
  name: string;
  status: 'ONLINE' | 'ACTIVE' | 'IDLE';
  type: string;
  latency_ms: number;
  checks: string;
}

export interface DashboardStats {
  total_cases: number;
  high_risk_cases: number;
  medium_risk_cases: number;
  low_risk_cases: number;
  suspicious_social_profiles: number;
  suspicious_mobile_apps: number;
  suspicious_urls: number;
  fake_company_pages: number;
  open_alerts: number;
  monitored_brands: number;
  threat_distribution: { category: string; count: number; percentage: number }[];
  risk_trend: { date: string; high: number; medium: number; low: number }[];
  active_agent_count: number;
  agent_statuses: AgentStatus[];
  last_synced_at?: string;
  data_source?: string;
  is_live?: boolean;
}

export interface SystemSettings {
  project_name: string;
  version: string;
  gemini_api_configured: boolean;
  gemini_model: string;
  openai_api_configured?: boolean;
  openai_model?: string;
  serpapi_api_configured?: boolean;
  analysis_engine: string;
  high_risk_threshold: number;
  medium_risk_threshold: number;
  default_reviewer: string;
  database_type: string;
}
