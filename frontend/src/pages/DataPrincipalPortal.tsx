import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Search,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  FileText,
  Clock,
  Database,
  Lock,
  ArrowRight,
  ExternalLink,
  Sparkles,
  Building2,
  Check,
  Hash,
  LogOut,
  ChevronDown,
  ChevronRight,
  User as UserIcon,
  Mail,
  Phone,
  Heart,
  CreditCard,
  Link2,
  ShieldAlert,
  Baby,
} from 'lucide-react';
import { api } from '../api/client';
import type { UserTraversalReport, DsrRequest, BusinessInfo, DsrTrackReport, User } from '../types';

interface DataPrincipalPortalProps {
  onBackToAdmin?: () => void;
  currentUser?: User | null;
  onLogout?: () => void;
}

export const DataPrincipalPortal: React.FC<DataPrincipalPortalProps> = ({
  onBackToAdmin,
  currentUser,
  onLogout,
}) => {
  // Top-level mode: 'inspect' | 'track'
  const [portalMode, setPortalMode] = useState<'inspect' | 'track'>('inspect');

  // Business / Website directory
  const [businesses, setBusinesses] = useState<BusinessInfo[]>([]);
  const [selectedWebsite, setSelectedWebsite] = useState('aarogyadiagnostics.in');
  const [selectedTenantId, setSelectedTenantId] = useState('');
  const [isCustomWebsite, setIsCustomWebsite] = useState(false);
  const [customWebsiteInput, setCustomWebsiteInput] = useState('');

  // User inspection state - default to patient@gmail.com as shown in the mockup
  const [userRef, setUserRef] = useState(currentUser?.email || 'patient@gmail.com');
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState<UserTraversalReport | null>(null);
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Active Tab for exercising rights
  const [activeTab, setActiveTab] = useState<
    'correction' | 'erasure' | 'access' | 'section9_vpc' | 'section9_tracking'
  >('correction');

  // DPDP Section 9 Children's Data Protection State
  const [isMinorMode, setIsMinorMode] = useState(false);
  const [minorName, setMinorName] = useState('Aarav Sharma (Student/Minor)');
  const [minorAge, setMinorAge] = useState('14');
  const [guardianName, setGuardianName] = useState('Sunita Sharma');
  const [guardianContact, setGuardianContact] = useState('+91 9845012345');
  const [guardianRelation, setGuardianRelation] = useState<'FATHER' | 'MOTHER' | 'LEGAL_GUARDIAN'>('MOTHER');
  const [section9TrackingDetails, setSection9TrackingDetails] = useState(
    'Formal directive under DPDP Act Section 9(3): Immediately halt behavioral profiling, telemetry tracking, and targeted advertisements associated with this minor.'
  );

  // Correction Form State
  const [fieldToCorrect, setFieldToCorrect] = useState('Phone Number');
  const [currentValue, setCurrentValue] = useState('+91 9845012345');
  const [correctedValue, setCorrectedValue] = useState('+91 9876543210');
  const [correctionDetails, setCorrectionDetails] = useState('My phone number is wrong. Please update it.');

  // Erasure Form State
  const [erasureDetails, setErasureDetails] = useState(
    'Delete my personal records that are no longer required to be retained under DPDP Act Section 12.'
  );

  // Submitting DSR Request
  const [submittingDsr, setSubmittingDsr] = useState(false);
  const [dsrSuccess, setDsrSuccess] = useState<DsrRequest | null>(null);

  // Tracking Request State
  const [trackRequestId, setTrackRequestId] = useState('');
  const [trackLoading, setTrackLoading] = useState(false);
  const [trackError, setTrackError] = useState<string | null>(null);
  const [trackedReport, setTrackedReport] = useState<DsrTrackReport | null>(null);

  // Display User Name
  const displayName = currentUser?.firstName
    ? `${currentUser.firstName} ${currentUser.lastName || ''}`.trim()
    : 'Yugant';

  // Load registered businesses/tenants on mount
  useEffect(() => {
    async function loadBusinesses() {
      try {
        const list = await api.dsr.getBusinesses();
        if (list.length > 0) {
          setBusinesses(list);
          setSelectedTenantId(list[0].tenantId);
          setSelectedWebsite(list[0].website || 'aarogyadiagnostics.in');
        } else {
          setBusinesses([
            {
              tenantId: 'sample-tenant-aarogya-clinic',
              name: 'Aarogya Diagnostic Center & Polyclinic (Sample Data)',
              website: 'aarogyadiagnostics.in',
            },
          ]);
        }
      } catch {
        setBusinesses([
          {
            tenantId: 'sample-tenant-aarogya-clinic',
            name: 'Aarogya Diagnostic Center & Polyclinic (Sample Data)',
            website: 'aarogyadiagnostics.in',
          },
        ]);
      }
    }
    loadBusinesses();
  }, []);

  // Run Graph Traversal for User against selected Business Website
  const handleInspectData = async (e?: React.FormEvent, overrideRef?: string) => {
    if (e) e.preventDefault();
    const queryTarget = (overrideRef !== undefined ? overrideRef : userRef).trim();
    if (!queryTarget) return;

    setLoading(true);
    setError(null);
    setDsrSuccess(null);
    try {
      const activeWebsite = isCustomWebsite ? customWebsiteInput.trim() : selectedWebsite;
      const data = await api.dsr.traverseUserGraph(queryTarget, activeWebsite, selectedTenantId || undefined);
      setReport(data);
      setSearched(true);
    } catch {
      // Create rich fallback matching verified data overview for prototype preview
      setReport({
        userRef: queryTarget,
        personalDataSummary: {
          piiCategoriesHeld: [
            'Patient identity',
            'Full name',
            'Email',
            'Phone number',
            'Health data',
            'PAN',
            'Aadhaar',
          ],
          activeConsentsCount: 4,
          consents: [],
        },
        dataSources: [
          { sourceId: 'src-1', name: 'sample_clinic.csv', type: 'CSV' },
          { sourceId: 'src-2', name: 'finance.csv', type: 'CSV' },
        ],
        processingActivities: [
          {
            activityId: 'act-1',
            name: 'Patient Consultation & Pathology Diagnostics',
            businessFunction: 'Clinical Operations',
            purpose: 'Patient health assessment, diagnostic testing, and appointment booking',
            legalBasis: 'CONSENT',
            retentionMonths: 36,
            retentionTrigger: 'Service Termination',
            sourceName: 'sample_clinic.csv',
            dataElements: ['Patient Name', 'Phone', 'Aadhaar', 'Lab Diagnostic'],
          },
          {
            activityId: 'act-2',
            name: 'Statutory GST Billing & Financial Records',
            businessFunction: 'Accounting & Tax',
            purpose: 'Statutory tax preservation under Section 36 of CGST Act',
            legalBasis: 'STATUTORY_OBLIGATION',
            retentionMonths: 72,
            retentionTrigger: 'Invoice Date',
            sourceName: 'finance.csv',
            dataElements: ['PAN', 'Billing Name', 'Tax Invoice'],
          },
        ],
        storageSystems: [
          { systemName: 'AWS Mumbai PostgreSQL', stage: 'Active Storage', location: 'India' },
        ],
        thirdPartyRecipients: [
          { name: 'Karix Mobile SMS Gateway', type: 'TELECOM_PROCESSOR', country: 'India' },
          { name: 'AWS Mumbai (ap-south-1)', type: 'CLOUD_STORAGE', country: 'India' },
        ],
        dsrHistory: [],
      } as any);
      setSearched(true);
    } finally {
      setLoading(false);
    }
  };

  // Submit Correction Request to selected Business
  const handleSubmitCorrection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userRef.trim() || !correctedValue.trim()) return;

    setSubmittingDsr(true);
    setError(null);
    try {
      const activeWebsite = isCustomWebsite ? customWebsiteInput.trim() : selectedWebsite;
      const res = await api.dsr.submitPortalRequest({
        requestType: 'CORRECTION',
        userRef: userRef.trim(),
        details: isMinorMode
          ? `[DPDP §9 Minor Correction by Lawful Guardian: ${guardianName} (${guardianRelation}, Contact: ${guardianContact}) for Minor: ${minorName} (Age: ${minorAge})] ${correctionDetails.trim()}`
          : correctionDetails.trim(),
        fieldToCorrect,
        currentValue: currentValue.trim() || undefined,
        correctedValue: correctedValue.trim(),
        affectedActivityId: report?.processingActivities?.[0]?.activityId,
        businessWebsite: activeWebsite,
        tenantId: selectedTenantId || undefined,
        isMinorChild: isMinorMode,
        parentGuardianRef: isMinorMode ? `${guardianName.trim()} (${guardianContact.trim()})` : undefined,
        guardianRelationship: isMinorMode ? guardianRelation : undefined,
      });

      setDsrSuccess(res);
      handleInspectData();
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to submit correction request');
    } finally {
      setSubmittingDsr(false);
    }
  };

  // Submit Erasure Request to selected Business
  const handleSubmitErasure = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userRef.trim()) return;

    setSubmittingDsr(true);
    setError(null);
    try {
      const activeWebsite = isCustomWebsite ? customWebsiteInput.trim() : selectedWebsite;
      const res = await api.dsr.submitPortalRequest({
        requestType: 'ERASURE',
        userRef: userRef.trim(),
        details: isMinorMode
          ? `[DPDP §9 Parental Consent Revocation & Immediate Erasure] Lawful Guardian: ${guardianName} (${guardianRelation}, Contact: ${guardianContact}) revokes consent for Minor: ${minorName} (Age: ${minorAge}). Grounds: ${erasureDetails.trim()}`
          : erasureDetails.trim(),
        affectedActivityId: report?.processingActivities?.[0]?.activityId,
        businessWebsite: activeWebsite,
        tenantId: selectedTenantId || undefined,
        isMinorChild: isMinorMode,
        parentGuardianRef: isMinorMode ? `${guardianName.trim()} (${guardianContact.trim()})` : undefined,
        guardianRelationship: isMinorMode ? guardianRelation : undefined,
      });

      setDsrSuccess(res);
      handleInspectData();
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to submit erasure request');
    } finally {
      setSubmittingDsr(false);
    }
  };

  // Submit Section 9(3) Directive Prohibiting Tracking and Targeted Profiling
  const handleSubmitSection9TrackingBan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userRef.trim()) return;

    setSubmittingDsr(true);
    setError(null);
    try {
      const activeWebsite = isCustomWebsite ? customWebsiteInput.trim() : selectedWebsite;
      const res = await api.dsr.submitPortalRequest({
        requestType: 'GRIEVANCE',
        userRef: userRef.trim(),
        details: `[DPDP §9(3) STATUTORY PROHIBITION OF BEHAVIORAL TRACKING & PROFILING] Lawful Guardian: ${guardianName} (${guardianRelation}, Contact: ${guardianContact}) for Minor: ${minorName} (Age: ${minorAge}). Directive: ${section9TrackingDetails.trim()}`,
        affectedActivityId: report?.processingActivities?.[0]?.activityId,
        businessWebsite: activeWebsite,
        tenantId: selectedTenantId || undefined,
        isMinorChild: true,
        parentGuardianRef: `${guardianName.trim()} (${guardianContact.trim()})`,
        guardianRelationship: guardianRelation,
      });

      setDsrSuccess(res);
      handleInspectData();
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to submit Section 9 tracking prohibition');
    } finally {
      setSubmittingDsr(false);
    }
  };

  // Track live status of a statutory request
  const handleTrackRequest = async (idToTrack?: string) => {
    const targetId = (idToTrack || trackRequestId).trim();
    if (!targetId) return;

    setTrackLoading(true);
    setTrackError(null);
    try {
      const data = await api.dsr.trackRequest(targetId);
      setTrackedReport(data);
      setTrackRequestId(targetId);
      setPortalMode('track');
    } catch (err: any) {
      setTrackError(err.response?.data?.error?.message || 'Could not find a statutory request with that ID or Proof hash.');
      setTrackedReport(null);
    } finally {
      setTrackLoading(false);
    }
  };

  // Helper for rendering category icon
  const getCategoryIcon = (category: string) => {
    const lower = category.toLowerCase();
    if (lower.includes('patient') || lower.includes('identity')) return <UserIcon className="w-3.5 h-3.5 text-[#0284c7]" />;
    if (lower.includes('name')) return <UserIcon className="w-3.5 h-3.5 text-[#0284c7]" />;
    if (lower.includes('email')) return <Mail className="w-3.5 h-3.5 text-[#0284c7]" />;
    if (lower.includes('phone') || lower.includes('mobile')) return <Phone className="w-3.5 h-3.5 text-[#0284c7]" />;
    if (lower.includes('health')) return <Heart className="w-3.5 h-3.5 text-rose-500" />;
    if (lower.includes('pan')) return <CreditCard className="w-3.5 h-3.5 text-[#0284c7]" />;
    if (lower.includes('aadhaar')) return <CreditCard className="w-3.5 h-3.5 text-[#0284c7]" />;
    return <CheckCircle2 className="w-3.5 h-3.5 text-[#0284c7]" />;
  };

  return (
    <div className="min-h-screen bg-[#f8faff] text-[#0f172a] flex flex-col font-sans">
      {/* ======================================================== */}
      {/* TOP HEADER                                               */}
      {/* ======================================================== */}
      <header className="bg-white border-b border-slate-200/80 px-6 py-3 flex items-center justify-between sticky top-0 z-30 shadow-xs">
        {/* Brand & Statutory Notice */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[#1a73e8] flex items-center justify-center text-white shrink-0 shadow-xs">
            <ShieldCheck className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm font-bold text-slate-900 tracking-tight">
                Data Principal Privacy Rights Portal
              </h1>
              <span className="text-[11px] bg-[#e0f2fe] text-[#0284c7] font-medium px-2 py-0.5 rounded-full border border-[#bae6fd]">
                DPDP Act 2023 · Sections 11 & 12
              </span>
            </div>
            <p className="text-[11px] text-slate-500">
              Manage your personal data rights
            </p>
          </div>
        </div>

        {/* Actions & User Controls */}
        <div className="flex items-center gap-4">
          {/* Cyber crime complaint hyperlink button */}
          <a
            href="https://share.google/XFDOGvcIO28Zu99Gp"
            target="_blank"
            rel="noopener noreferrer"
            className="group relative inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 hover:text-rose-800 border border-rose-200 hover:border-rose-300 rounded-lg shadow-2xs hover:shadow-xs hover:-translate-y-0.5 active:translate-y-0 active:scale-95 transition-all duration-150 cursor-pointer"
            title="File a statutory Cyber Crime Complaint on the National Portal"
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
            </span>
            <ShieldAlert className="w-3.5 h-3.5 text-rose-600 group-hover:scale-110 transition-transform" />
            <span>Cyber crime complaint</span>
            <ExternalLink className="w-3 h-3 text-rose-500 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
          </a>

          {/* DPO Workspace Return link if MSME Admin */}
          {onBackToAdmin && (
            <button
              onClick={onBackToAdmin}
              className="hidden md:inline-flex items-center gap-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 px-2.5 py-1 border border-slate-200 hover:border-slate-300 rounded-lg bg-slate-50 hover:bg-slate-100 transition-all duration-150 cursor-pointer"
            >
              <span>DPO Workspace</span>
              <ExternalLink className="w-3 h-3" />
            </button>
          )}

          {/* User Profile */}
          <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
            <div className="w-7 h-7 rounded-full bg-[#e0f2fe] text-[#0284c7] flex items-center justify-center font-bold text-xs shrink-0">
              <UserIcon className="w-4 h-4 text-[#0284c7]" />
            </div>
            <div className="flex items-center gap-1 cursor-pointer hover:text-slate-900 transition-colors">
              <span className="text-xs font-semibold text-slate-800">{displayName}</span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </div>
          </div>

          {/* Sign Out Action */}
          {onLogout && (
            <button
              onClick={onLogout}
              className="inline-flex items-center gap-1 text-xs font-semibold text-[#ef4444] hover:text-[#dc2626] hover:scale-105 active:scale-95 transition-all duration-150 cursor-pointer"
              title="Sign out of portal"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out</span>
            </button>
          )}
        </div>
      </header>

      {/* ======================================================== */}
      {/* MAIN PORTAL BODY                                         */}
      {/* ======================================================== */}
      <main className="flex-1 max-w-5xl w-full mx-auto p-6 space-y-6">
        {/* Navigation Tabs (Exercise vs Track) */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setPortalMode('inspect')}
            className={`btn-${portalMode === 'inspect' ? 'primary' : 'secondary'} py-2.5 px-4 text-xs font-semibold`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Exercise Privacy Rights</span>
          </button>

          <button
            onClick={() => setPortalMode('track')}
            className={`btn-${portalMode === 'track' ? 'primary' : 'secondary'} py-2.5 px-4 text-xs font-semibold`}
          >
            <Clock className="w-4 h-4" />
            <span>Track Request Status</span>
            {dsrSuccess && (
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse ml-1" />
            )}
          </button>
        </div>

        {/* Hero Headline & Instructions */}
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
            Find your data and exercise your rights
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Choose a business and enter the email or phone number you used with them.
          </p>
        </div>

        {/* 3-Step Breadcrumb Stepper */}
        <div className="flex items-center gap-3 py-1">
          {/* Step 1 */}
          <div className="flex items-center gap-2">
            <span className="w-5 h-5 rounded-full bg-[#1a73e8] text-white text-[11px] font-bold flex items-center justify-center">
              1
            </span>
            <span className="text-xs font-semibold text-[#1a73e8]">
              Identify your data
            </span>
          </div>

          <div className="flex-1 max-w-[120px] h-[1px] bg-slate-200" />

          {/* Step 2 */}
          <div className="flex items-center gap-2">
            <span className={`w-5 h-5 rounded-full text-[11px] font-medium flex items-center justify-center ${
              searched || report ? 'bg-[#1a73e8] text-white font-bold' : 'bg-slate-200 text-slate-600'
            }`}>
              2
            </span>
            <span className={`text-xs ${searched || report ? 'font-semibold text-slate-900' : 'text-slate-500'}`}>
              Review findings
            </span>
          </div>

          <div className="flex-1 max-w-[120px] h-[1px] bg-slate-200" />

          {/* Step 3 */}
          <div className="flex items-center gap-2">
            <span className={`w-5 h-5 rounded-full text-[11px] font-medium flex items-center justify-center ${
              dsrSuccess ? 'bg-[#1a73e8] text-white font-bold' : 'bg-slate-200 text-slate-600'
            }`}>
              3
            </span>
            <span className={`text-xs ${dsrSuccess ? 'font-semibold text-slate-900' : 'text-slate-500'}`}>
              Choose a right
            </span>
          </div>
        </div>

        {/* ======================================================== */}
        {/* TAB 1: IDENTIFY DATA & SUBMIT REQUESTS                  */}
        {/* ======================================================== */}
        {portalMode === 'inspect' && (
          <div className="space-y-6">
            {/* Card: 1. Identify your data */}
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100 flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-[#e0f2fe] text-[#0284c7] flex items-center justify-center">
                    <UserIcon className="w-3.5 h-3.5 text-[#0284c7]" />
                  </div>
                  <h3 className="text-sm font-bold text-slate-900">
                    1. Identify your data
                  </h3>
                </div>

                {/* Representation Selector: Self vs Minor Child (§9) */}
                <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg">
                  <button
                    type="button"
                    onClick={() => {
                      setIsMinorMode(false);
                      setActiveTab('correction');
                      setUserRef('patient@gmail.com');
                    }}
                    className={`py-1 px-2.5 rounded-md text-xs font-semibold transition-colors flex items-center gap-1.5 ${
                      !isMinorMode
                        ? 'bg-white text-slate-900 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <UserIcon className="w-3 h-3 text-slate-600" />
                    <span>Myself (Adult Principal)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsMinorMode(true);
                      setActiveTab('section9_vpc');
                      setUserRef('pediatric.patient.8492@aarogya.in');
                    }}
                    className={`py-1 px-2.5 rounded-md text-xs font-semibold transition-colors flex items-center gap-1.5 ${
                      isMinorMode
                        ? 'bg-white text-[#1b6c80] shadow-xs ring-1 ring-[#1b6c80]/40'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <Baby className="w-3 h-3 text-[#1b6c80]" />
                    <span>Minor Child (DPDP §9)</span>
                  </button>
                </div>
              </div>

              {/* DPDP Section 9 Statutory Awareness Banner */}
              {isMinorMode && (
                <div className="p-4 bg-[#f0f7f9] border border-[#d2e5e9] rounded-xl space-y-3">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-2">
                      <ShieldAlert className="w-4 h-4 text-[#1b6c80] shrink-0" />
                      <span className="text-xs font-bold text-[#13424d]">
                        DPDP Act 2023 §9 — Mandatory Protections for Children's Personal Data
                      </span>
                    </div>
                    <span className="px-2 py-0.5 text-[10px] font-bold bg-[#d2e5e9] text-[#13424d] rounded-full">
                      Statutory Fine up to ₹200 Crore (§33)
                    </span>
                  </div>

                  <p className="text-[11px] text-[#1b6c80] leading-relaxed">
                    Under Section 9 of the Digital Personal Data Protection Act, a Data Fiduciary operates under heightened statutory duties when processing personal data of anyone under 18 years of age.
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5 pt-1 text-xs">
                    <div className="bg-white/90 p-2.5 rounded-lg border border-[#d2e5e9] space-y-1">
                      <div className="font-bold text-[#13424d] text-[11px] flex items-center gap-1">
                        <Check className="w-3 h-3 text-[#1b6c80]" />
                        <span>1. Verifiable Parental Consent (§9(1))</span>
                      </div>
                      <p className="text-[10px] text-slate-600 leading-normal">
                        A fiduciary cannot collect or process minor personal data without prior verifiable consent from the parent or lawful guardian.
                      </p>
                    </div>

                    <div className="bg-white/90 p-2.5 rounded-lg border border-[#d2e5e9] space-y-1">
                      <div className="font-bold text-[#13424d] text-[11px] flex items-center gap-1">
                        <Check className="w-3 h-3 text-[#1b6c80]" />
                        <span>2. Ban on Tracking & Ads (§9(3))</span>
                      </div>
                      <p className="text-[10px] text-slate-600 leading-normal">
                        Absolute statutory prohibition on behavioral tracking, profiling, and targeted advertising directed at children.
                      </p>
                    </div>

                    <div className="bg-white/90 p-2.5 rounded-lg border border-[#d2e5e9] space-y-1">
                      <div className="font-bold text-[#13424d] text-[11px] flex items-center gap-1">
                        <Check className="w-3 h-3 text-[#1b6c80]" />
                        <span>3. Zero Detrimental Processing (§9(2))</span>
                      </div>
                      <p className="text-[10px] text-slate-600 leading-normal">
                        Any processing likely to cause harm or adverse impact to a child's psychological, educational, or physical health is forbidden.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <form onSubmit={handleInspectData} className="space-y-4">
                {/* Row 1: Business selector on left, Fiduciary website on right */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                  <div className="md:col-span-7">
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      Business or website
                    </label>
                    <div className="relative">
                      <Building2 className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
                      <select
                        value={isCustomWebsite ? 'custom' : selectedWebsite}
                        onChange={(e) => {
                          if (e.target.value === 'custom') {
                            setIsCustomWebsite(true);
                          } else {
                            setIsCustomWebsite(false);
                            setSelectedWebsite(e.target.value);
                            const b = businesses.find((x) => x.website === e.target.value);
                            if (b) setSelectedTenantId(b.tenantId);
                          }
                        }}
                        className="w-full bg-white border border-slate-200 rounded-lg pl-9 pr-8 py-2.5 text-xs text-slate-900 font-medium focus:outline-none focus:ring-1 focus:ring-blue-500"
                      >
                        {businesses.map((biz) => (
                          <option key={biz.tenantId} value={biz.website}>
                            {biz.name}
                          </option>
                        ))}
                        <option value="custom">Enter custom business website or domain...</option>
                      </select>
                    </div>
                  </div>

                  <div className="md:col-span-5">
                    <div className="flex items-center gap-2 mb-1.5">
                      <label className="text-xs font-semibold text-slate-700">
                        Data Fiduciary website
                      </label>
                      <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold text-[#15803d] bg-[#dcfce7] border border-[#bbf7d0] px-1.5 py-0.2 rounded-full">
                        <Check className="w-2.5 h-2.5" />
                        Verified
                      </span>
                    </div>

                    {isCustomWebsite ? (
                      <input
                        type="text"
                        required
                        placeholder="e.g. clinic.in, company.com"
                        value={customWebsiteInput}
                        onChange={(e) => setCustomWebsiteInput(e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono"
                      />
                    ) : (
                      <div className="w-full bg-[#f0fdf4] border border-[#bbf7d0] rounded-lg px-3 py-2 text-xs text-[#15803d] font-mono flex items-center gap-2">
                        <Link2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span className="truncate">{selectedWebsite}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Minor Child & Guardian Details (When isMinorMode is active) */}
                {isMinorMode && (
                  <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg space-y-3 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-800">
                        Parent / Lawful Guardian Statutory Verification (§9(1))
                      </span>
                      <span className="text-[11px] text-slate-500">
                        Verifiable relationship proof
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                          Minor Child Name
                        </label>
                        <input
                          type="text"
                          required
                          value={minorName}
                          onChange={(e) => setMinorName(e.target.value)}
                          className="w-full bg-white border border-slate-200 rounded-md px-2.5 py-1.5 text-xs text-slate-900 font-medium focus:ring-1 focus:ring-[#1b6c80] focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                          Minor Age (&lt;18)
                        </label>
                        <input
                          type="number"
                          max={17}
                          min={1}
                          required
                          value={minorAge}
                          onChange={(e) => setMinorAge(e.target.value)}
                          className="w-full bg-white border border-slate-200 rounded-md px-2.5 py-1.5 text-xs text-slate-900 font-medium focus:ring-1 focus:ring-[#1b6c80] focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                          Guardian Legal Relationship
                        </label>
                        <select
                          value={guardianRelation}
                          onChange={(e) =>
                            setGuardianRelation(e.target.value as 'FATHER' | 'MOTHER' | 'LEGAL_GUARDIAN')
                          }
                          className="w-full bg-white border border-slate-200 rounded-md px-2.5 py-1.5 text-xs text-slate-900 font-medium focus:ring-1 focus:ring-[#1b6c80] focus:outline-none"
                        >
                          <option value="MOTHER">Mother</option>
                          <option value="FATHER">Father</option>
                          <option value="LEGAL_GUARDIAN">Court-Appointed Legal Guardian</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                          Parent / Guardian Full Name
                        </label>
                        <input
                          type="text"
                          required
                          value={guardianName}
                          onChange={(e) => setGuardianName(e.target.value)}
                          className="w-full bg-white border border-slate-200 rounded-md px-2.5 py-1.5 text-xs text-slate-900 font-medium focus:ring-1 focus:ring-[#1b6c80] focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                          Guardian Verification Contact (Phone / Email)
                        </label>
                        <input
                          type="text"
                          required
                          value={guardianContact}
                          onChange={(e) => setGuardianContact(e.target.value)}
                          className="w-full bg-white border border-slate-200 rounded-md px-2.5 py-1.5 text-xs text-slate-900 font-medium focus:ring-1 focus:ring-[#1b6c80] focus:outline-none"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Row 2: Email or phone identifier input + Find my data button */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    {isMinorMode
                      ? "Minor's email, student roll number, or pediatric patient ID"
                      : 'Your email address or phone number'}
                  </label>
                  <div className="flex flex-col sm:flex-row gap-3">
                    <div className="relative flex-1">
                      {isMinorMode ? (
                        <Baby className="w-4 h-4 text-[#1b6c80] absolute left-3 top-3" />
                      ) : (
                        <UserIcon className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                      )}
                      <input
                        type="text"
                        required
                        placeholder={
                          isMinorMode
                            ? 'pediatric.patient.8492@aarogya.in or student.aarav@school.edu'
                            : 'patient@gmail.com'
                        }
                        value={userRef}
                        onChange={(e) => setUserRef(e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-lg pl-9 pr-3 py-2.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500 font-medium"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={loading}
                      className="btn-primary px-6 py-2.5 text-xs font-semibold"
                    >
                      <Sparkles className="w-4 h-4 text-white group-hover:rotate-12 transition-transform duration-200" />
                      <span>{loading ? 'Finding records...' : isMinorMode ? 'Find Child Records' : 'Find my data'}</span>
                    </button>
                  </div>
                </div>
              </form>

              {/* Row 3: Preset clickable chips */}
              <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
                <span className="text-slate-500">
                  {isMinorMode ? 'Sample minor identifiers:' : 'Try a sample identifier:'}
                </span>
                {(isMinorMode
                  ? [
                      { label: 'pediatric.patient.8492@aarogya.in', icon: Baby },
                      { label: 'student.aarav@delhischool.edu', icon: Mail },
                      { label: 'minor.child.rohit@aarogya.in', icon: Baby },
                    ]
                  : [
                      { label: 'patient@aarogya.in', icon: Mail },
                      { label: '+91 9845012345', icon: Phone },
                      { label: 'ramesh.kumar@aarogyadiagnostics.in', icon: Mail },
                    ]
                ).map((sample) => {
                  const Icon = sample.icon;
                  return (
                    <button
                      key={sample.label}
                      type="button"
                      onClick={() => {
                        setUserRef(sample.label);
                        handleInspectData(undefined, sample.label);
                      }}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-slate-50 hover:bg-blue-50 hover:border-royal-500 text-slate-700 hover:text-royal-700 border border-slate-200 rounded-full text-[11px] font-medium transition-all duration-150 shadow-2xs hover:shadow-xs hover:-translate-y-0.5 active:scale-95 cursor-pointer"
                    >
                      <Icon className="w-3 h-3 text-slate-400" />
                      <span>{sample.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Error banner if any */}
            {error && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg flex items-center gap-2 text-xs text-rose-700">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>{error}</span>
              </div>
            )}

            {/* Success toast if DSR submitted */}
            {dsrSuccess && (
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl space-y-2 text-emerald-900 text-xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 font-bold text-sm text-emerald-800">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                    <span>Statutory {dsrSuccess.requestType} Request Filed Successfully</span>
                  </div>
                  <button
                    onClick={() => handleTrackRequest(dsrSuccess.requestId)}
                    className="btn-success px-3 py-1 rounded-md text-xs flex items-center gap-1.5 cursor-pointer"
                  >
                    <span>Track Live Status</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
                <p className="text-slate-600 text-xs">
                  Your request is securely recorded with SHA-256 tamper-evident integrity proof. The Data Fiduciary has 30 days to resolve under DPDP Act Section 12.
                </p>
                <div className="bg-white p-2.5 rounded border border-emerald-200 font-mono text-[11px] space-y-0.5">
                  <div>Request ID: <span className="font-bold text-slate-900">{dsrSuccess.requestId}</span></div>
                  <div>Status: <span className="text-emerald-700 font-bold">{dsrSuccess.status}</span></div>
                  {dsrSuccess.sha256Proof && (
                    <div className="truncate text-slate-500 text-[10px]">
                      SHA-256 Proof: {dsrSuccess.sha256Proof}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ======================================================== */}
            {/* 2. FINDINGS: DATA OVERVIEW & DATA SOURCES CARDS          */}
            {/* ======================================================== */}
            {(report || searched) && (
              <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-start">
                {/* Left Card: Your data overview (8 cols) */}
                <div className="md:col-span-8 bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
                  <div>
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-[#1a73e8]" />
                        <h4 className="text-sm font-bold text-slate-900">
                          Your data overview
                        </h4>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-[#15803d] bg-[#dcfce7] border border-[#bbf7d0] px-2 py-0.5 rounded-full">
                          <Check className="w-2.5 h-2.5" />
                          Sample data
                        </span>
                        <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-[#15803d] bg-[#dcfce7] border border-[#bbf7d0] px-2 py-0.5 rounded-full">
                          <Check className="w-2.5 h-2.5" />
                          Verified match
                        </span>
                      </div>
                    </div>
                    <p className="text-xs text-slate-500 mt-1">
                      We found personal data linked to this identifier.
                    </p>
                  </div>

                  {/* Pills Container */}
                  <div className="flex flex-wrap gap-2 pt-1">
                    {(report?.personalDataSummary.piiCategoriesHeld && report.personalDataSummary.piiCategoriesHeld.length > 0
                      ? report.personalDataSummary.piiCategoriesHeld
                      : [
                          'Patient identity',
                          'Full name',
                          'Email',
                          'Phone number',
                          'Health data',
                          'PAN',
                          'Aadhaar',
                        ]
                    ).map((cat, i) => (
                      <span
                        key={i}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#f0f7ff] text-[#0369a1] border border-[#bae6fd] rounded-lg text-xs font-medium"
                      >
                        {getCategoryIcon(cat)}
                        <span>{cat}</span>
                      </span>
                    ))}
                  </div>

                  {/* Informational disclaimer */}
                  <div className="bg-[#f0f9ff] border border-[#bae6fd] rounded-lg p-2.5 text-xs text-[#0369a1] flex items-center gap-2">
                    <Lock className="w-3.5 h-3.5 text-[#0369a1] shrink-0" />
                    <span>
                      Your search is for this prototype's sample records. Only share identifiers with services you trust.
                    </span>
                  </div>
                </div>

                {/* Right Card: Data sources found (4 cols) */}
                <div className="md:col-span-4 bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-3">
                  <div className="flex items-center gap-2 pb-1 border-b border-slate-100">
                    <Database className="w-4 h-4 text-[#1a73e8]" />
                    <h4 className="text-sm font-bold text-slate-900">
                      Data sources found
                    </h4>
                  </div>

                  <div className="space-y-2">
                    {(report?.dataSources && report.dataSources.length > 0
                      ? report.dataSources
                      : [
                          { sourceId: '1', name: 'sample_clinic.csv', type: 'CSV' },
                          { sourceId: '2', name: 'finance.csv', type: 'CSV' },
                        ]
                    ).map((src) => (
                      <div
                        key={src.sourceId}
                        className="flex items-center justify-between p-2.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 transition-colors"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-7 h-7 rounded bg-[#10b981] text-white flex items-center justify-center text-[9px] font-bold shrink-0">
                            CSV
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-semibold text-slate-800 truncate">
                              {src.name}
                            </p>
                            <p className="text-[10px] text-slate-400">
                              {src.name === 'finance.csv' ? '8 KB' : '12 KB'}
                            </p>
                          </div>
                        </div>
                        <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* ======================================================== */}
            {/* STEP 3: EXERCISE STATUTORY DPDP RIGHTS FORMS             */}
            {/* ======================================================== */}
            {(report || searched) && (
              <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">
                      3. Exercise your statutory DPDP rights
                    </h4>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Submit an affirmative legal request directly to the Data Protection Officer of {selectedWebsite}.
                    </p>
                  </div>

                  {/* Rights Sub-Tabs */}
                  <div className="flex items-center gap-1.5 bg-slate-100/80 p-1.5 rounded-xl border border-slate-200/60 flex-wrap">
                    {isMinorMode ? (
                      <>
                        <button
                          type="button"
                          onClick={() => setActiveTab('section9_vpc')}
                          className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                            activeTab === 'section9_vpc'
                              ? 'btn-teal shadow-xs'
                              : 'text-slate-600 hover:text-teal-800 hover:bg-white/80'
                          }`}
                        >
                          Parental Revocation & Erasure (§9(1))
                        </button>
                        <button
                          type="button"
                          onClick={() => setActiveTab('section9_tracking')}
                          className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                            activeTab === 'section9_tracking'
                              ? 'btn-teal shadow-xs'
                              : 'text-slate-600 hover:text-teal-800 hover:bg-white/80'
                          }`}
                        >
                          Prohibit Tracking & Ads (§9(3))
                        </button>
                        <button
                          type="button"
                          onClick={() => setActiveTab('correction')}
                          className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                            activeTab === 'correction'
                              ? 'btn-teal shadow-xs'
                              : 'text-slate-600 hover:text-teal-800 hover:bg-white/80'
                          }`}
                        >
                          Correct Minor Records (§12)
                        </button>
                        <button
                          type="button"
                          onClick={() => setActiveTab('access')}
                          className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                            activeTab === 'access'
                              ? 'btn-teal shadow-xs'
                              : 'text-slate-600 hover:text-teal-800 hover:bg-white/80'
                          }`}
                        >
                          Access Summary (§11)
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          type="button"
                          onClick={() => setActiveTab('correction')}
                          className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                            activeTab === 'correction'
                              ? 'btn-primary shadow-xs'
                              : 'text-slate-600 hover:text-royal-700 hover:bg-white/80'
                          }`}
                        >
                          Correction (Sec 12)
                        </button>
                        <button
                          type="button"
                          onClick={() => setActiveTab('erasure')}
                          className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                            activeTab === 'erasure'
                              ? 'btn-primary shadow-xs'
                              : 'text-slate-600 hover:text-royal-700 hover:bg-white/80'
                          }`}
                        >
                          Erasure (Sec 12)
                        </button>
                        <button
                          type="button"
                          onClick={() => setActiveTab('access')}
                          className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                            activeTab === 'access'
                              ? 'btn-primary shadow-xs'
                              : 'text-slate-600 hover:text-royal-700 hover:bg-white/80'
                          }`}
                        >
                          Access & Summary (Sec 11)
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {/* Form: Section 9(1) Parental Consent Revocation & Erasure */}
                {isMinorMode && activeTab === 'section9_vpc' && (
                  <form onSubmit={handleSubmitErasure} className="space-y-4 text-xs">
                    <div className="p-3.5 bg-[#f0f7f9] border border-[#d2e5e9] rounded-lg text-[#13424d] text-xs leading-relaxed space-y-1">
                      <div className="font-bold flex items-center gap-1.5 text-[#1b6c80]">
                        <ShieldAlert className="w-4 h-4 text-[#1b6c80] shrink-0" />
                        <span>DPDP Act Section 9(1) — Statutory Parental Consent Revocation</span>
                      </div>
                      <p className="text-[11px] text-[#1b6c80]/90">
                        As the lawful guardian of <strong>{minorName}</strong>, you have the absolute legal right to revoke previously granted processing consent and demand complete erasure of your child’s diagnostic, student, or telemetry records across <strong>{selectedWebsite}</strong> and all downstream third-party processors.
                      </p>
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">
                        Reason / specific deletion instructions
                      </label>
                      <textarea
                        rows={3}
                        required
                        value={erasureDetails}
                        onChange={(e) => setErasureDetails(e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-lg p-2.5 text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#1b6c80] font-medium"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={submittingDsr}
                      className="btn-teal px-5 py-2.5 rounded-lg text-xs font-semibold flex items-center gap-2 cursor-pointer shadow-sm"
                    >
                      <Baby className="w-3.5 h-3.5" />
                      <span>{submittingDsr ? 'Submitting to DPO...' : 'Submit Statutory Parental Revocation & Erasure'}</span>
                    </button>
                  </form>
                )}

                {/* Form: Section 9(3) Directive Prohibiting Tracking and Targeted Profiling */}
                {isMinorMode && activeTab === 'section9_tracking' && (
                  <form onSubmit={handleSubmitSection9TrackingBan} className="space-y-4 text-xs">
                    <div className="p-3.5 bg-rose-50/70 border border-rose-200 rounded-lg text-rose-950 text-xs leading-relaxed space-y-1">
                      <div className="font-bold flex items-center gap-1.5 text-rose-900">
                        <AlertTriangle className="w-4 h-4 text-rose-700 shrink-0" />
                        <span>DPDP Act Section 9(3) — Statutory Prohibition of Tracking & Profiling</span>
                      </div>
                      <p className="text-[11px] text-rose-900/90">
                        Section 9(3) strictly bans Data Fiduciaries from undertaking behavioral tracking, monitoring of child activities, or targeted advertising directed at children. Fiduciaries face statutory penalties of up to <strong>₹200 Crore</strong> for violations.
                      </p>
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">
                        Statutory Directive to Data Protection Officer
                      </label>
                      <textarea
                        rows={3}
                        required
                        value={section9TrackingDetails}
                        onChange={(e) => setSection9TrackingDetails(e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-lg p-2.5 text-slate-800 focus:outline-none focus:ring-1 focus:ring-rose-500 font-medium"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={submittingDsr}
                      className="btn-danger px-5 py-2.5 rounded-lg text-xs font-semibold flex items-center gap-2 cursor-pointer shadow-sm"
                    >
                      <ShieldAlert className="w-3.5 h-3.5" />
                      <span>{submittingDsr ? 'Serving Directive...' : 'Serve Section 9(3) Tracking Prohibition Directive'}</span>
                    </button>
                  </form>
                )}

                {/* Form 1: Correction */}
                {activeTab === 'correction' && (
                  <form onSubmit={handleSubmitCorrection} className="space-y-4 text-xs">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="block font-semibold text-slate-700 mb-1">
                          Field to correct
                        </label>
                        <select
                          value={fieldToCorrect}
                          onChange={(e) => setFieldToCorrect(e.target.value)}
                          className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-900 font-medium focus:outline-none focus:ring-1 focus:ring-blue-500"
                        >
                          <option value="Phone Number">Phone Number</option>
                          <option value="Email Address">Email Address</option>
                          <option value="Full Name">Full Name</option>
                          <option value="Mailing Address">Mailing Address</option>
                          {isMinorMode && <option value="School / Student ID">School / Student ID</option>}
                          {isMinorMode && <option value="Date of Birth">Date of Birth</option>}
                        </select>
                      </div>

                      <div>
                        <label className="block font-semibold text-slate-700 mb-1">
                          Current value on record
                        </label>
                        <input
                          type="text"
                          value={currentValue}
                          onChange={(e) => setCurrentValue(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-700 font-medium"
                        />
                      </div>

                      <div>
                        <label className="block font-semibold text-slate-700 mb-1">
                          Correct updated value *
                        </label>
                        <input
                          type="text"
                          required
                          value={correctedValue}
                          onChange={(e) => setCorrectedValue(e.target.value)}
                          className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-900 font-semibold focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">
                        Reason / statutory explanation
                      </label>
                      <input
                        type="text"
                        value={correctionDetails}
                        onChange={(e) => setCorrectionDetails(e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-800"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={submittingDsr}
                      className={`btn-primary px-5 py-2.5 rounded-lg text-xs font-semibold flex items-center gap-2 cursor-pointer shadow-sm ${
                        isMinorMode ? 'bg-teal-700 hover:bg-teal-800' : ''
                      }`}
                    >
                      <span>
                        {submittingDsr
                          ? 'Submitting to DPO...'
                          : isMinorMode
                          ? 'Submit Minor Record Correction Request'
                          : 'Submit Statutory Correction Request'}
                      </span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </form>
                )}

                {/* Form 2: Erasure (Adult mode) */}
                {!isMinorMode && activeTab === 'erasure' && (
                  <form onSubmit={handleSubmitErasure} className="space-y-4 text-xs">
                    <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-900 text-xs leading-relaxed">
                      <strong>Statutory Note on Section 12 Erasure:</strong> Personal data that must be retained under statutory legal obligations (such as Section 36 of the CGST Act 2017 for 72 months) cannot be deleted until statutory preservation periods expire.
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">
                        Reason for erasure request
                      </label>
                      <textarea
                        rows={2}
                        value={erasureDetails}
                        onChange={(e) => setErasureDetails(e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-lg p-2.5 text-slate-800"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={submittingDsr}
                      className="btn-danger px-5 py-2.5 rounded-lg text-xs font-semibold flex items-center gap-2 cursor-pointer shadow-sm"
                    >
                      <span>{submittingDsr ? 'Submitting to DPO...' : 'Submit Formal Erasure Request'}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </form>
                )}

                {/* Form 3: Access & Summary */}
                {activeTab === 'access' && (
                  <div className="space-y-3 text-xs">
                    <p className="text-slate-600">
                      Under <strong>DPDP Act Section 11</strong>, you are entitled to a summary of all processing activities, third-party disclosures, and categories of data retained by <strong>{selectedWebsite}</strong>.
                    </p>
                    <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg font-mono text-[11px] text-slate-700 space-y-1">
                      <div>Principal ID: {userRef}</div>
                      {isMinorMode && (
                        <div>
                          Minor Representation: {minorName} (Age: {minorAge}, Guardian: {guardianName} - {guardianRelation})
                        </div>
                      )}
                      <div>Target Fiduciary: {selectedWebsite}</div>
                      <div>Discovered Entities: {report?.personalDataSummary.piiCategoriesHeld.length || 7} personal data categories</div>
                      <div>Verified Retention Schedule: Active</div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 2: TRACK STATUS                                      */}
        {/* ======================================================== */}
        {portalMode === 'track' && (
          <div className="space-y-6">
            <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-4">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Track your filed request status & DPO resolution
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Enter your statutory Request ID or SHA-256 Proof Hash to inspect real-time progress.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <Hash className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    required
                    placeholder="Enter Statutory Request ID (e.g. c032649b-...)"
                    value={trackRequestId}
                    onChange={(e) => setTrackRequestId(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-lg pl-9 pr-3 py-2.5 text-xs text-slate-900 font-mono focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => handleTrackRequest()}
                  disabled={trackLoading || !trackRequestId.trim()}
                  className="btn-primary px-6 py-2.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 shadow-sm cursor-pointer"
                >
                  <Search className="w-4 h-4" />
                  <span>{trackLoading ? 'Searching...' : 'Track status'}</span>
                </button>
              </div>

              {trackError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-700">
                  {trackError}
                </div>
              )}
            </div>

            {/* Display tracked request details if found */}
            {trackedReport && (
              <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">
                      Request #{trackedReport.requestId}
                    </h4>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Fiduciary: {trackedReport.businessInfo.name} ({trackedReport.businessInfo.website})
                    </p>
                  </div>
                  <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                    trackedReport.status === 'COMPLETED'
                      ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                      : trackedReport.status === 'RETAINED_TAX_CONFLICT'
                      ? 'bg-amber-50 text-amber-800 border border-amber-200'
                      : 'bg-blue-50 text-blue-800 border border-blue-200'
                  }`}>
                    {trackedReport.status}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-1">
                    <span className="text-slate-500 font-semibold">Request Type</span>
                    <p className="font-bold text-slate-900">{trackedReport.requestType}</p>
                    <p className="text-slate-600">{trackedReport.details}</p>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-1">
                    <span className="text-slate-500 font-semibold">Statutory Integrity Proof</span>
                    <p className="font-mono text-[10px] text-slate-700 truncate">{trackedReport.sha256Proof || 'Verified'}</p>
                    <span className="text-emerald-700 font-semibold flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Immutable DPDP Audit Trail
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
};
