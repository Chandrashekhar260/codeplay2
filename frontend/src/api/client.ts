import axios from 'axios';
import type {
  User,
  Tenant,
  AuthResponse,
  DataSource,
  ScanFinding,
  RemediationFlag,
  ProcessingActivity,
  RopaGraphData,
  DataAsset,
  Purpose,
  ConsentRecord,
  ConsentNotice,
  DsrRequest,
  UserTraversalReport,
  BusinessInfo,
  DsrTrackReport,
  ConsentAnalytics,
  ConsentReceipt,
  CookieScanSummary,
  CookieStats,
  DetectedCookie,
  CookieCategory,
} from '../types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Attach JWT token from localStorage automatically
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('datasentinel_token');
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auto handle 401
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Don't auto-clear if already on login attempt
      if (!error.config.url.includes('/auth/login')) {
        localStorage.removeItem('datasentinel_token');
        window.dispatchEvent(new Event('datasentinel:unauthorized'));
      }
    }
    return Promise.reject(error);
  }
);

export const api = {
  // Auth
  auth: {
    login: async (email: string, password: string, userType?: 'MSME' | 'CITIZEN'): Promise<AuthResponse> => {
      const res = await apiClient.post('/auth/login', { email, password, userType });
      return res.data.data;
    },
    register: async (payload: {
      userType: 'MSME' | 'CITIZEN';
      tenantName?: string;
      email: string;
      password: string;
      firstName: string;
      lastName?: string;
      phone?: string;
    }): Promise<AuthResponse> => {
      const res = await apiClient.post('/auth/register', payload);
      return res.data.data;
    },
    getMe: async (): Promise<{ user: User; tenant: Tenant }> => {
      const res = await apiClient.get('/auth/me');
      return res.data.data;
    },
    getTenant: async () => {
      const res = await apiClient.get('/platform/tenant');
      return res.data.data;
    },
  },

  // Discovery & Scanner
  discovery: {
    uploadFile: async (file: File): Promise<{ source: DataSource; findings: ScanFinding[]; flags: RemediationFlag[] }> => {
      const formData = new FormData();
      formData.append('file', file);
      const res = await apiClient.post('/discovery/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return res.data.data;
    },
    getSources: async (): Promise<DataSource[]> => {
      const res = await apiClient.get('/discovery/sources');
      return res.data.data;
    },
    getFindings: async (sourceId: string): Promise<ScanFinding[]> => {
      const res = await apiClient.get(`/discovery/sources/${sourceId}/findings`);
      return res.data.data.findings;
    },
    getFlags: async (sourceId: string): Promise<RemediationFlag[]> => {
      const res = await apiClient.get(`/discovery/sources/${sourceId}/flags`);
      return res.data.data;
    },
  },

  // RoPA & Graph
  mapping: {
    getActivities: async (): Promise<ProcessingActivity[]> => {
      const res = await apiClient.get('/mapping/activities');
      return res.data.data;
    },
    getGraph: async (): Promise<RopaGraphData> => {
      const res = await apiClient.get('/mapping/graph');
      return res.data.data;
    },
    createActivity: async (data: {
      name: string;
      businessFunction: string;
      legalBasis: string;
      purpose?: string;
      retentionMonths?: number;
      retentionDays?: number;
      triggerEvent?: string;
      sourceId?: string;
    }): Promise<ProcessingActivity> => {
      const res = await apiClient.post('/mapping/activities', data);
      return res.data.data;
    },
    getRetentionRecommendation: async (params: {
      sourceId?: string;
      businessFunction?: string;
      purpose?: string;
      piiCategories?: string[];
    }): Promise<{
      retentionPeriodMonths: number;
      retentionDays: number;
      triggerEvent: string;
      statutoryReference: string;
      matchedRule: string;
      description: string;
      detectedPiiCategories: string[];
    }> => {
      const res = await apiClient.post('/mapping/activities/retention-recommendation', params);
      return res.data.data;
    },
  },

  // Governance
  governance: {
    getAssets: async (): Promise<DataAsset[]> => {
      const res = await apiClient.get('/governance/assets');
      return res.data.data;
    },
    getRules: async (): Promise<any> => {
      const res = await apiClient.get('/governance/rules');
      return res.data.data;
    },
    registerAsset: async (data: {
      name: string;
      type: string;
      owner: string;
      steward?: string;
      businessFunction?: string;
      sourceId?: string;
    }): Promise<any> => {
      const res = await apiClient.post('/governance/assets', data);
      return res.data.data;
    },
  },

  // Consent Ledger
  consent: {
    getPurposes: async (): Promise<Purpose[]> => {
      const res = await apiClient.get('/consent/purposes');
      return res.data.data.purposes;
    },
    createPurpose: async (data: { name: string; legalBasis?: string; description?: string }): Promise<Purpose> => {
      const res = await apiClient.post('/consent/purposes', data);
      return res.data.data;
    },
    getNotices: async (lang: 'en' | 'hi' | 'kn' = 'en'): Promise<ConsentNotice> => {
      const res = await apiClient.get(`/consent/notices?lang=${lang}`);
      return res.data.data;
    },
    recordConsent: async (data: {
      userRef: string;
      purposeId: string;
      channel?: string;
      noticeLanguage?: 'en' | 'hi' | 'kn';
      affirmativeCheck: boolean;
    }): Promise<ConsentRecord> => {
      const res = await apiClient.post('/consent/records', data);
      return res.data.data;
    },
    withdrawConsent: async (data: { userRef: string; purposeId: string; reason?: string }): Promise<ConsentRecord> => {
      const res = await apiClient.post('/consent/records/withdraw', data);
      return res.data.data;
    },
    getUserLedger: async (userRef: string): Promise<ConsentRecord[]> => {
      const res = await apiClient.get(`/consent/records/user/${encodeURIComponent(userRef)}`);
      return res.data.data.records;
    },
    getAllRecords: async (params?: { status?: string; channel?: string; search?: string }): Promise<ConsentRecord[]> => {
      const query = new URLSearchParams();
      if (params?.status) query.append('status', params.status);
      if (params?.channel) query.append('channel', params.channel);
      if (params?.search) query.append('search', params.search);
      const res = await apiClient.get(`/consent/records?${query.toString()}`);
      return res.data.data.records;
    },
    getAnalytics: async (): Promise<ConsentAnalytics> => {
      const res = await apiClient.get('/consent/analytics');
      return res.data.data;
    },
    recordBulk: async (
      records: Array<{
        userRef: string;
        purposeId: string;
        channel?: string;
        noticeLanguage?: string;
      }>
    ): Promise<{ count: number; records: ConsentRecord[] }> => {
      const res = await apiClient.post('/consent/records/bulk', { records });
      return res.data.data;
    },
    getReceipt: async (recordId: string): Promise<ConsentReceipt> => {
      const res = await apiClient.get(`/consent/records/${encodeURIComponent(recordId)}/receipt`);
      return res.data.data;
    },
  },

  // DSR & Data Principal Privacy Portal (DPDP Sec 11 & 12)
  dsr: {
    getBusinesses: async (): Promise<BusinessInfo[]> => {
      const res = await apiClient.get('/dsr/portal/businesses');
      return res.data.data;
    },
    trackRequest: async (requestId: string): Promise<DsrTrackReport> => {
      const res = await apiClient.get(`/dsr/portal/track/${encodeURIComponent(requestId)}`);
      return res.data.data;
    },
    traverseUserGraph: async (
      userRef: string,
      businessWebsite?: string,
      tenantId?: string
    ): Promise<UserTraversalReport> => {
      const res = await apiClient.post('/dsr/portal/traverse', {
        userRef,
        businessWebsite,
        tenantId,
      });
      return res.data.data;
    },
    submitPortalRequest: async (data: {
      requestType: 'ACCESS' | 'CORRECTION' | 'ERASURE' | 'GRIEVANCE';
      userRef: string;
      details: string;
      fieldToCorrect?: string;
      currentValue?: string;
      correctedValue?: string;
      affectedActivityId?: string;
      businessWebsite?: string;
      tenantId?: string;
      isMinorChild?: boolean;
      parentGuardianRef?: string;
      guardianRelationship?: 'FATHER' | 'MOTHER' | 'LEGAL_GUARDIAN' | 'SELF';
    }): Promise<DsrRequest> => {
      const res = await apiClient.post('/dsr/portal/submit', data);
      return res.data.data;
    },
    getRequests: async (): Promise<DsrRequest[]> => {
      const res = await apiClient.get('/dsr/requests');
      return res.data.data;
    },
    getAlerts: async (): Promise<{
      totalPending: number;
      requests: DsrRequest[];
      alertsByActivity: Record<string, any[]>;
    }> => {
      const res = await apiClient.get('/dsr/alerts');
      return res.data.data;
    },
    resolveRequest: async (
      requestId: string,
      data: {
        resolution: 'APPROVE_CORRECTION' | 'APPROVE_ERASURE' | 'RETAIN_TAX_CONFLICT' | 'REJECT';
        resolutionNotes: string;
        correctedValueOverride?: string;
      }
    ): Promise<DsrRequest> => {
      const res = await apiClient.post(`/dsr/requests/${requestId}/resolve`, data);
      return res.data.data;
    },
  },

  // Cookie Governance & CMP Banner (DPDP Act 2023)
  cookies: {
    scan: async (websiteUrl: string): Promise<CookieScanSummary> => {
      const res = await apiClient.post('/cookies/scan', { websiteUrl });
      return res.data.data;
    },
    getInventory: async (): Promise<CookieScanSummary> => {
      const res = await apiClient.get('/cookies/inventory');
      return res.data.data;
    },
    updateCookie: async (
      cookieId: string,
      data: { category?: CookieCategory; purpose?: string }
    ): Promise<DetectedCookie> => {
      const res = await apiClient.patch(`/cookies/${encodeURIComponent(cookieId)}`, data);
      return res.data.data;
    },
    getStats: async (): Promise<CookieStats> => {
      const res = await apiClient.get('/cookies/stats');
      return res.data.data;
    },
    logConsent: async (data: {
      visitorId?: string;
      accepted: CookieCategory[];
      rejected: CookieCategory[];
    }): Promise<any> => {
      const res = await apiClient.post('/cookies/consent', data);
      return res.data.data;
    },
  },
};
