import { 
  Brand, 
  BrandAsset, 
  InvestigationCase, 
  Alert, 
  ReportItem, 
  DashboardStats, 
  SystemSettings 
} from '../types';

const API_BASE = (import.meta as any).env?.VITE_API_BASE_URL || 'http://localhost:8000/api/v1';

async function request<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const url = `${API_BASE}${endpoint}`;
  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(options?.headers || {}),
      },
    });

    if (!response.ok) {
      let errorMsg = `HTTP ${response.status}: ${response.statusText}`;
      try {
        const errorJson = await response.json();
        if (errorJson.detail) {
          errorMsg = typeof errorJson.detail === 'string' ? errorJson.detail : JSON.stringify(errorJson.detail);
        }
      } catch {
        // use default errorMsg
      }
      throw new Error(errorMsg);
    }

    return await response.json();
  } catch (err: any) {
    console.error(`API Error [${endpoint}]:`, err);
    throw err;
  }
}

export const api = {
  // --- Dashboard & Stats ---
  getDashboardStats: () => request<DashboardStats>('/stats/dashboard'),

  // --- Brands & Assets ---
  getBrands: () => request<Brand[]>('/brands/'),
  getBrand: (id: number) => request<Brand>(`/brands/${id}`),
  createBrand: (data: Partial<Brand> & { initial_assets?: any[] }) => 
    request<Brand>('/brands/', { method: 'POST', body: JSON.stringify(data) }),
  addBrandAsset: (brandId: number, data: Partial<BrandAsset>) =>
    request<BrandAsset>(`/brands/${brandId}/assets`, { method: 'POST', body: JSON.stringify(data) }),
  deleteBrandAsset: (brandId: number, assetId: number) =>
    request<{ message: string }>(`/brands/${brandId}/assets/${assetId}`, { method: 'DELETE' }),
  deleteBrand: (brandId: number) =>
    request<{ message: string }>(`/brands/${brandId}`, { method: 'DELETE' }),

  // --- Cases & Investigations ---
  getCases: (params?: {
    brand_id?: number;
    risk_level?: string;
    target_type?: string;
    status?: string;
    search?: string;
    sort_by?: string;
    sort_order?: string;
    skip?: number;
    limit?: number;
  }) => {
    const query = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([k, v]) => {
        if (v !== undefined && v !== null && v !== '') {
          query.append(k, String(v));
        }
      });
    }
    const qStr = query.toString();
    return request<{ items: InvestigationCase[]; total: number; skip: number; limit: number }>(
      `/cases/${qStr ? `?${qStr}` : ''}`
    );
  },
  getCaseDetail: (caseId: number) => request<InvestigationCase>(`/cases/${caseId}`),
  updateCaseReview: (caseId: number, data: { reviewer_name: string; status: string; review_notes: string; action_taken?: string }) =>
    request<InvestigationCase>(`/cases/${caseId}/review`, { method: 'PUT', body: JSON.stringify(data) }),

  // --- Multi-Agent Analysis Scanners ---
  analyzeSocial: (data: {
    brand_id: number;
    platform: string;
    profile_url: string;
    handle: string;
    display_name: string;
    bio?: string;
    follower_count?: number;
    is_verified?: boolean;
    avatar_url?: string;
    recent_posts?: string[];
  }) => request<any>('/analyze/social', { method: 'POST', body: JSON.stringify(data) }),

  analyzeMobileApp: (data: {
    brand_id: number;
    app_store: string;
    app_name: string;
    package_name: string;
    developer_name: string;
    listing_url?: string;
    download_count_range?: string;
    rating?: number;
    permissions?: string[];
    privacy_policy_url?: string;
    app_icon_url?: string;
  }) => request<any>('/analyze/mobile-app', { method: 'POST', body: JSON.stringify(data) }),

  analyzeUrl: (data: {
    brand_id: number;
    url: string;
    page_title?: string;
    detected_forms?: string[];
    meta_description?: string;
  }) => request<any>('/analyze/url', { method: 'POST', body: JSON.stringify(data) }),

  analyzeCompanyPage: (data: {
    brand_id: number;
    platform: string;
    page_name: string;
    page_url: string;
    contact_email?: string;
    recruiter_name?: string;
    job_titles?: string[];
    description_text?: string;
  }) => request<any>('/analyze/company-page', { method: 'POST', body: JSON.stringify(data) }),

  // --- Alerts ---
  getAlerts: (params?: { brand_id?: number; severity?: string; is_read?: boolean; limit?: number }) => {
    const query = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([k, v]) => {
        if (v !== undefined && v !== null) query.append(k, String(v));
      });
    }
    const qStr = query.toString();
    return request<Alert[]>(`/alerts/${qStr ? `?${qStr}` : ''}`);
  },
  markAlertRead: (alertId: number) =>
    request<{ message: string }>(`/alerts/${alertId}/read`, { method: 'PUT' }),
  dismissAlert: (alertId: number) =>
    request<{ message: string }>(`/alerts/${alertId}/dismiss`, { method: 'PUT' }),
  markAllAlertsRead: () =>
    request<{ message: string }>('/alerts/mark-all-read', { method: 'POST' }),

  // --- Reports ---
  getReports: (brandId?: number) => {
    const q = brandId ? `?brand_id=${brandId}` : '';
    return request<ReportItem[]>(`/reports/${q}`);
  },
  getReportDetail: (reportId: number) => request<ReportItem>(`/reports/${reportId}`),
  getPdfDownloadUrl: (reportId: number) => `${API_BASE}/reports/${reportId}/pdf`,
  getPdfDownloadUrlByCaseId: (caseId: number) => `${API_BASE}/reports/case/${caseId}/pdf`,

  // --- Settings & Integrations ---
  getSettings: () => request<SystemSettings>('/settings/'),
  seedDemoData: () => request<any>('/settings/seed-demo-data', { method: 'POST' }),
  testOpenAI: () => request<{ status: string; message: string; model?: string; missing_variable?: string }>('/settings/test-openai'),
  testSerpAPI: () => request<{ status: string; message: string; missing_variable?: string }>('/settings/test-serpapi'),
  testGemini: () => request<{ status: string; message: string; model?: string; missing_variable?: string }>('/settings/test-gemini'),
  searchThreatsWeb: (brand_name: string, search_type: string = 'all') =>
    request<{ success: boolean; query?: string; error?: string; results: any[] }>('/analyze/web-search', {
      method: 'POST',
      body: JSON.stringify({ brand_name, search_type }),
    }),
};
