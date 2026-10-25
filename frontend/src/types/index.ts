// ==========================================
// User & Tenant Types
// ==========================================
export interface Tenant {
  id: string;
  name: string;
  plan: string;
  status: string;
}

export interface User {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  tenantId?: string;
  role?: string;
  userType?: 'MSME' | 'CITIZEN';
  phone?: string;
}

export interface AuthResponse {
  user: User;
  tenant: Tenant;
  token: string;
}

// ==========================================
// Discovery & PII Scanner Types
// ==========================================
export interface DataSource {
  sourceId: string;
  name: string;
  sourceType: string;
  status: string;
  lastScannedAt?: string;
}

export interface ScanFinding {
  findingId: string;
  jobId: string;
  objectName: string;
  fieldName: string;
  piiCategories: string;
  sensitivityLevel: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
}

export interface RemediationFlag {
  flagId: string;
  sourceId: string;
  flagType: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  status: string;
}

// ==========================================
// RoPA Mapping & Graph Types
// ==========================================
export interface DataElement {
  elementId: string;
  piiCategory: string;
  dataSubjects: string;
  volumeEstimate?: string;
}

export interface DataFlow {
  flowId: string;
  flowStage: string;
  systemName: string;
  location: string;
}

export interface RetentionPolicy {
  retentionPolicyId: string;
  activityId?: string;
  retentionPeriodMonths: number;
  triggerEvent: string;
}

export interface ProcessingActivity {
  activityId: string;
  name: string;
  businessFunction: string;
  legalBasis: string;
  purpose?: string | null;
  retentionDays?: number | null;
  sourceId?: string | null;
  source?: DataSource | null;
  status: string;
  createdAt: string;
  dataElements: DataElement[];
  dataFlows: DataFlow[];
  retentionPolicies?: RetentionPolicy[];
}

export interface GraphNode {
  id: string;
  type: string;
  position: { x: number; y: number };
  data: {
    label: string;
    sublabel?: string;
    badge?: string;
    level?: string;
    category?: string;
    system?: string;
  };
}

export interface GraphEdge {
  id: string;
  source: string;
  target: string;
  label?: string;
  animated?: boolean;
}

export interface RopaGraphData {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

// ==========================================
// Governance & Classification Types
// ==========================================
export type Classification = 'RESTRICTED' | 'CONFIDENTIAL' | 'INTERNAL' | 'PUBLIC';

export interface DataAsset {
  assetId: string;
  name: string;
  type: string;
  classification: Classification;
  owner: string;
  steward?: string;
  retentionDays?: number | null;
  createdAt: string;
}

export interface ClassificationRule {
  classification: Classification;
  reason: string;
  legalReferences: string[];
  controls: string[];
}

export interface RetentionRule {
  retentionMonths: number | null;
  statutoryLaw: string[];
  triggerEvent: string;
  description: string;
  requiresLegalReview: boolean;
}

// ==========================================
// Consent Ledger & Multilingual Notices
// ==========================================
export interface Purpose {
  purposeId: string;
  name: string;
  legalBasis: string;
  version: string;
  description?: string;
  consentCount: number;
  createdAt: string;
}

export interface ConsentRecord {
  recordId: string;
  userRef: string;
  purposeId: string;
  purposeName: string;
  legalBasis: string;
  status: 'GIVEN' | 'WITHDRAWN' | 'EXPIRED';
  channel: string;
  noticeLanguage: 'en' | 'hi' | 'kn';
  capturedAt: string;
  withdrawnAt?: string | null;
}

export interface ConsentNotice {
  language: 'en' | 'hi' | 'kn';
  languageName: string;
  headline: string;
  dataCollected: string[];
  specifiedPurpose: string;
  rightsNotice: string;
  withdrawalInstructions: string;
  grievanceRedressal: {
    officerTitle: string;
    email: string;
    turnaroundDays: number;
  };
  affirmativeStatement: string;
}

export interface ConsentAnalytics {
  total: number;
  active: number;
  withdrawn: number;
  activeRate: number;
  channels: Record<string, number>;
  languages: Record<string, number>;
  purposes: Array<{
    purposeId: string;
    name: string;
    count: number;
    active: number;
  }>;
}

export interface ConsentReceipt {
  receiptId: string;
  recordId: string;
  dataPrincipal: string;
  organization: string;
  purpose: string;
  legalBasis: string;
  status: string;
  channel: string;
  noticeLanguage: string;
  capturedAt: string;
  withdrawnAt?: string | null;
  statutoryMandate: string;
  sha256Proof: string;
}

// ==========================================
// Audit Event Type
// ==========================================
export interface AuditEvent {
  eventId: string;
  action: string;
  resourceType: string;
  resourceId?: string;
  diffJson?: string;
  ipAddress?: string;
  createdAt: string;
}

// ==========================================
// DSR & Data Principal Rights (DPDP Sec 11 & 12)
// ==========================================
export type DsrRequestType = 'ACCESS' | 'CORRECTION' | 'ERASURE' | 'GRIEVANCE';
export type DsrStatus = 'SUBMITTED' | 'IN_REVIEW' | 'RETAINED_TAX_CONFLICT' | 'COMPLETED' | 'REJECTED';

export interface DsrRequest {
  requestId: string;
  requestType: DsrRequestType;
  status: DsrStatus;
  userRef: string;
  details: string;
  fieldToCorrect?: string | null;
  currentValue?: string | null;
  correctedValue?: string | null;
  affectedActivityId?: string | null;
  activity?: ProcessingActivity | null;
  resolutionNotes?: string | null;
  taxRetentionLock: boolean;
  sha256Proof?: string | null;
  dueDate?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface BusinessInfo {
  tenantId: string;
  name: string;
  website: string;
}

export interface DsrTrackReport {
  requestId: string;
  requestType: DsrRequestType;
  status: DsrStatus;
  userRef: string;
  details: string;
  fieldToCorrect?: string | null;
  currentValue?: string | null;
  correctedValue?: string | null;
  taxRetentionLock: boolean;
  resolutionNotes?: string | null;
  sha256Proof?: string | null;
  dueDate?: string | null;
  daysRemaining?: number | null;
  createdAt: string;
  updatedAt: string;
  businessInfo: BusinessInfo;
  affectedActivity?: {
    name: string;
    businessFunction: string;
    sourceName?: string;
  } | null;
}

export interface UserTraversalReport {
  userRef: string;
  businessInfo?: BusinessInfo;
  personalDataSummary: {
    piiCategoriesHeld: string[];
    activeConsentsCount: number;
    consents: Array<{
      recordId: string;
      purposeName: string;
      status: string;
      channel: string;
      capturedAt: string;
    }>;
  };
  dataSources: Array<{
    sourceId: string;
    name: string;
    type: string;
  }>;
  processingActivities: Array<{
    activityId: string;
    name: string;
    businessFunction: string;
    purpose: string;
    legalBasis: string;
    retentionMonths: number;
    retentionTrigger: string;
    sourceName: string;
    dataElements: string[];
  }>;
  storageSystems: Array<{
    systemName: string;
    stage: string;
    location: string;
  }>;
  thirdPartyRecipients: Array<{
    name: string;
    type: string;
    country: string;
  }>;
  dsrHistory: DsrRequest[];
}

// ==========================================
// Cookie Consent & Website Scanner Types
// ==========================================
export type CookieCategory = 'NECESSARY' | 'ANALYTICS' | 'MARKETING' | 'FUNCTIONAL';

export interface DetectedCookie {
  id: string;
  name: string;
  category: CookieCategory;
  provider: string;
  domain: string;
  expiry: string;
  expiryDays: number;
  purpose: string;
  legalBasis: string;
  secure: boolean;
  httpOnly: boolean;
  scriptSource?: string;
}

export interface CookieScanSummary {
  scannedUrl: string;
  scannedAt: string;
  totalCookies: number;
  byCategory: {
    NECESSARY: number;
    ANALYTICS: number;
    MARKETING: number;
    FUNCTIONAL: number;
  };
  highRiskCount: number;
  complianceRating: 'A' | 'B' | 'C' | 'D';
  dpdpNoticeRequired: boolean;
  detectedCookies: DetectedCookie[];
}

export interface CookieStats {
  totalVisitorImpressions: number;
  optInRate: number;
  marketingRate: number;
  analyticsAcceptedCount: number;
  marketingAcceptedCount: number;
  allRejectedCount: number;
  recentLogs: Array<{
    logId: string;
    visitorId: string;
    accepted: CookieCategory[];
    rejected: CookieCategory[];
    timestamp: string;
    sha256Proof: string;
    userAgent?: string;
  }>;
}


