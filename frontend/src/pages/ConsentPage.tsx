import React, { useState, useEffect } from 'react';
import {
  Globe2,
  Search,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  FileText,
  Upload,
  RefreshCw,
  X,
  Eye,
  MessageSquare,
  Laptop,
  Check,
  Copy,
} from 'lucide-react';
import type { Purpose, ConsentRecord, ConsentNotice, ConsentAnalytics, ConsentReceipt } from '../types';
import { Badge } from '../components/ui/Badge';
import { api } from '../api/client';

interface ConsentPageProps {
  purposes: Purpose[];
  onConsentRecorded: () => void;
}

export const ConsentPage: React.FC<ConsentPageProps> = ({ purposes, onConsentRecorded }) => {
  const [activeTab, setActiveTab] = useState<'ledger' | 'record' | 'notices'>('ledger');
  const [recordMode, setRecordMode] = useState<'single' | 'bulk'>('single');

  // Analytics & KPIs
  const [analytics, setAnalytics] = useState<ConsentAnalytics | null>(null);
  const [, setLoadingAnalytics] = useState(false);

  // Global Ledger State
  const [allRecords, setAllRecords] = useState<ConsentRecord[]>([]);
  const [loadingLedger, setLoadingLedger] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'GIVEN' | 'WITHDRAWN'>('ALL');
  const [channelFilter, setChannelFilter] = useState<string>('ALL');

  // Receipt Modal State
  const [selectedReceipt, setSelectedReceipt] = useState<ConsentReceipt | null>(null);
  const [, setLoadingReceipt] = useState(false);

  // Notices State
  const [selectedLanguage, setSelectedLanguage] = useState<'en' | 'hi' | 'kn'>('en');
  const [notice, setNotice] = useState<ConsentNotice | null>(null);
  const [loadingNotice, setLoadingNotice] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  // Single Record Form State
  const [formUserRef, setFormUserRef] = useState('');
  const [formPurposeId, setFormPurposeId] = useState('');
  const [formChannel, setFormChannel] = useState('WHATSAPP_YES');
  const [formLanguage, setFormLanguage] = useState<'en' | 'hi' | 'kn'>('kn');
  const [formAffirmative, setFormAffirmative] = useState(false);
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);

  // Bulk Import State
  const [bulkCsvText, setBulkCsvText] = useState(
    `patient1@aarogya.in,WHATSAPP_YES,en\n+919845012345,IN_PERSON_AFFIRMATIVE,kn\nramesh.kumar@aarogyadiagnostics.in,WEB_PORTAL,hi`
  );
  const [bulkPurposeId, setBulkPurposeId] = useState('');
  const [bulkSubmitting, setBulkSubmitting] = useState(false);
  const [bulkResult, setBulkResult] = useState<string | null>(null);
  const [bulkError, setBulkError] = useState<string | null>(null);

  // Load Analytics
  const loadAnalytics = async () => {
    try {
      setLoadingAnalytics(true);
      const data = await api.consent.getAnalytics();
      setAnalytics(data);
    } catch (err) {
      console.error('Failed to load consent analytics:', err);
    } finally {
      setLoadingAnalytics(false);
    }
  };

  // Load All Consent Records
  const loadRecords = async () => {
    try {
      setLoadingLedger(true);
      const records = await api.consent.getAllRecords({
        status: statusFilter,
        channel: channelFilter,
        search: searchQuery,
      });
      setAllRecords(records);
    } catch (err) {
      console.error('Failed to load consent records:', err);
    } finally {
      setLoadingLedger(false);
    }
  };

  // Load Notices
  const loadNotice = async (lang: 'en' | 'hi' | 'kn') => {
    try {
      setLoadingNotice(true);
      const data = await api.consent.getNotices(lang);
      setNotice(data);
    } catch (err) {
      console.error('Failed to load statutory notice:', err);
    } finally {
      setLoadingNotice(false);
    }
  };

  useEffect(() => {
    loadAnalytics();
    loadRecords();
    loadNotice(selectedLanguage);
  }, []);

  useEffect(() => {
    loadRecords();
  }, [statusFilter, channelFilter]);

  useEffect(() => {
    loadNotice(selectedLanguage);
  }, [selectedLanguage]);

  // Handle Search submit
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    loadRecords();
  };

  // Handle Withdrawal (DPDP Section 6(4))
  const handleWithdraw = async (record: ConsentRecord) => {
    if (!window.confirm(`Withdraw statutory consent for ${record.userRef}?`)) return;
    try {
      await api.consent.withdrawConsent({
        userRef: record.userRef,
        purposeId: record.purposeId,
        reason: 'Customer initiated withdrawal via consent dashboard',
      });
      loadRecords();
      loadAnalytics();
      onConsentRecorded();
    } catch (err: any) {
      alert(err.response?.data?.error?.message || 'Failed to withdraw consent.');
    }
  };

  // Handle View Receipt
  const handleViewReceipt = async (recordId: string) => {
    try {
      setLoadingReceipt(true);
      const receipt = await api.consent.getReceipt(recordId);
      setSelectedReceipt(receipt);
    } catch (err: any) {
      alert(err.response?.data?.error?.message || 'Failed to fetch statutory receipt.');
    } finally {
      setLoadingReceipt(false);
    }
  };

  // Handle Single Consent Submission
  const handleRecordConsent = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormSubmitting(true);
    setFormError(null);
    setFormSuccess(null);

    if (!formAffirmative) {
      setFormError('DPDP Act Section 6 Violation: Consent requires affirmative action. Checkbox must be explicitly checked.');
      setFormSubmitting(false);
      return;
    }

    try {
      const targetPurposeId = formPurposeId || purposes[0]?.purposeId;
      const result = await api.consent.recordConsent({
        userRef: formUserRef.trim(),
        purposeId: targetPurposeId,
        channel: formChannel,
        noticeLanguage: formLanguage,
        affirmativeCheck: true,
      });

      setFormSuccess(`Affirmative consent recorded for ${result.userRef}.`);
      setFormUserRef('');
      setFormAffirmative(false);
      loadRecords();
      loadAnalytics();
      onConsentRecorded();
    } catch (err: any) {
      setFormError(err.response?.data?.error?.message || 'Failed to record consent.');
    } finally {
      setFormSubmitting(false);
    }
  };

  // Handle Bulk CSV Submission
  const handleBulkSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBulkSubmitting(true);
    setBulkError(null);
    setBulkResult(null);

    const targetPurposeId = bulkPurposeId || purposes[0]?.purposeId;
    if (!targetPurposeId) {
      setBulkError('Please select a processing purpose for the batch.');
      setBulkSubmitting(false);
      return;
    }

    const lines = bulkCsvText.trim().split('\n');
    const batchRecords = lines
      .map((line) => {
        const parts = line.split(',').map((p) => p.trim());
        if (!parts[0]) return null;
        return {
          userRef: parts[0],
          purposeId: targetPurposeId,
          channel: parts[1] || 'IN_PERSON_AFFIRMATIVE',
          noticeLanguage: parts[2] || 'en',
        };
      })
      .filter(Boolean) as any[];

    if (batchRecords.length === 0) {
      setBulkError('No valid rows found in CSV text.');
      setBulkSubmitting(false);
      return;
    }

    try {
      const res = await api.consent.recordBulk(batchRecords);
      setBulkResult(`Successfully imported ${res.count} consent records into the statutory ledger!`);
      loadRecords();
      loadAnalytics();
      onConsentRecorded();
    } catch (err: any) {
      setBulkError(err.response?.data?.error?.message || 'Failed to process bulk import.');
    } finally {
      setBulkSubmitting(false);
    }
  };

  const copyPublicLink = () => {
    const url = `${window.location.origin}#dsr`;
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Top Header & Analytics KPIs */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-sm font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <span>DPDP Consent Ledger & Affirmative Governance</span>
              <span className="text-[10px] bg-emerald-50 text-emerald-700 font-semibold px-2 py-0.5 rounded border border-emerald-200">
                DPDP Act 2023 Sec 5 & 6
              </span>
            </h1>
            <p className="text-xs text-slate-500">
              Enterprise consent capture, multilingual statutory notices, immediate Section 6(4) withdrawal, and tamper-evident receipts.
            </p>
          </div>

          {/* Tab Navigation */}
          <div className="flex items-center gap-1.5 bg-slate-100/80 p-1.5 rounded-xl border border-slate-200/60">
            <button
              onClick={() => setActiveTab('ledger')}
              className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                activeTab === 'ledger'
                  ? 'btn-primary shadow-xs'
                  : 'text-slate-600 hover:text-royal-700 hover:bg-white/80'
              }`}
            >
              Enterprise Ledger
            </button>
            <button
              onClick={() => setActiveTab('record')}
              className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                activeTab === 'record'
                  ? 'btn-primary shadow-xs'
                  : 'text-slate-600 hover:text-royal-700 hover:bg-white/80'
              }`}
            >
              Capture & Bulk Import
            </button>
            <button
              onClick={() => setActiveTab('notices')}
              className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                activeTab === 'notices'
                  ? 'btn-primary shadow-xs'
                  : 'text-slate-600 hover:text-royal-700 hover:bg-white/80'
              }`}
            >
              Multilingual Notices & Widget
            </button>
          </div>
        </div>

        {/* Analytics KPI Cards */}
        {analytics && (
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <div className="bg-white border border-slate-200 hover:border-[#1b6c80] rounded-xl p-4 shadow-xs interactive-lift">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
                Total Consents Recorded
              </span>
              <div className="text-xl font-bold text-slate-900 mt-1">{analytics.total}</div>
              <div className="text-[11px] text-slate-500 mt-0.5">Across all registered purposes</div>
            </div>

            <div className="bg-white border border-slate-200 hover:border-[#1e7b4f] rounded-xl p-4 shadow-xs interactive-lift">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
                Active Compliance Posture
              </span>
              <div className="text-xl font-bold text-[#1e7b4f] mt-1 flex items-center gap-1.5">
                <span>{analytics.activeRate}%</span>
                <span className="text-xs font-semibold text-slate-600">({analytics.active} Active)</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-1.5 mt-2 overflow-hidden">
                <div
                  className="bg-[#1e7b4f] h-1.5 rounded-full"
                  style={{ width: `${analytics.activeRate}%` }}
                />
              </div>
            </div>

            <div className="bg-white border border-slate-200 hover:border-[#92400e] rounded-xl p-4 shadow-xs interactive-lift">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
                Section 6(4) Withdrawals
              </span>
              <div className="text-xl font-bold text-[#92400e] mt-1">{analytics.withdrawn}</div>
              <div className="text-[11px] text-slate-500 mt-0.5">Promptly honored and isolated</div>
            </div>

            <div className="bg-white border border-slate-200 hover:border-[#1b6c80] rounded-xl p-4 shadow-xs interactive-lift">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
                Top Capture Channel
              </span>
              <div className="text-sm font-bold text-[#1b6c80] mt-1 truncate">
                {Object.keys(analytics.channels)[0]?.replace('_', ' ') || 'WhatsApp & Web'}
              </div>
              <div className="text-[10px] text-slate-500 mt-1 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-[#1e7b4f]" />
                <span>Affirmative Proof Logged</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ======================================================== */}
      {/* TAB 1: GLOBAL ENTERPRISE CONSENT LEDGER                  */}
      {/* ======================================================== */}
      {activeTab === 'ledger' && (
        <div className="space-y-4">
          {/* Search & Filter Toolbar */}
          <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <form onSubmit={handleSearch} className="flex items-center gap-2 flex-1 max-w-md">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Search by customer phone or email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded pl-9 pr-3 py-1.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <button
                type="submit"
                className="btn-primary px-3.5 py-1.5 rounded-lg text-xs font-semibold cursor-pointer shadow-xs"
              >
                Search
              </button>
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    setTimeout(loadRecords, 10);
                  }}
                  className="btn-cancel px-2.5 py-1.5 text-xs font-semibold rounded-lg cursor-pointer"
                >
                  Clear
                </button>
              )}
            </form>

            <div className="flex items-center gap-2">
              {/* Status Filter */}
              <div className="flex items-center gap-1 text-xs">
                <span className="text-slate-500 text-[11px] font-medium">Status:</span>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as any)}
                  className="bg-white border border-slate-300 rounded px-2 py-1 text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500 font-medium"
                >
                  <option value="ALL">All Statuses</option>
                  <option value="GIVEN">Active (GIVEN)</option>
                  <option value="WITHDRAWN">Withdrawn</option>
                </select>
              </div>

              {/* Channel Filter */}
              <div className="flex items-center gap-1 text-xs">
                <span className="text-slate-500 text-[11px] font-medium">Channel:</span>
                <select
                  value={channelFilter}
                  onChange={(e) => setChannelFilter(e.target.value)}
                  className="bg-white border border-slate-300 rounded px-2 py-1 text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500 font-medium"
                >
                  <option value="ALL">All Channels</option>
                  <option value="WHATSAPP_YES">WhatsApp Affirmative</option>
                  <option value="WEB_PORTAL">Web Portal</option>
                  <option value="IN_PERSON_AFFIRMATIVE">In-Person Slip</option>
                  <option value="SMS_OTP">SMS OTP</option>
                </select>
              </div>

              <button
                onClick={() => {
                  loadRecords();
                  loadAnalytics();
                }}
                className="p-1.5 text-slate-600 hover:text-slate-900 border border-slate-300 rounded hover:bg-slate-50 transition-colors"
                title="Refresh Ledger"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loadingLedger ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>

          {/* Table Container */}
          <div className="bg-white border border-slate-200 rounded-lg shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 text-[11px] font-semibold uppercase tracking-wider">
                    <th className="py-3 px-4">Data Principal (User Ref)</th>
                    <th className="py-3 px-4">Specified Purpose</th>
                    <th className="py-3 px-4">Channel</th>
                    <th className="py-3 px-4">Notice Lang</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Captured At</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {loadingLedger ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-xs text-slate-400">
                        <RefreshCw className="w-4 h-4 animate-spin mx-auto mb-1 text-blue-600" />
                        Loading Enterprise Consent Ledger...
                      </td>
                    </tr>
                  ) : allRecords.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-xs text-slate-500">
                        No consent records found matching the current search filters.
                      </td>
                    </tr>
                  ) : (
                    allRecords.map((record) => (
                      <tr key={record.recordId} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3 px-4 font-mono font-medium text-slate-900">
                          {record.userRef}
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-semibold text-slate-800">{record.purposeName}</div>
                          <div className="text-[10px] text-slate-400 font-mono">{record.legalBasis}</div>
                        </td>
                        <td className="py-3 px-4">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-700 border border-slate-200">
                            {record.channel.includes('WHATSAPP') ? (
                              <MessageSquare className="w-3 h-3 text-emerald-600" />
                            ) : record.channel.includes('WEB') ? (
                              <Laptop className="w-3 h-3 text-blue-600" />
                            ) : (
                              <FileText className="w-3 h-3 text-slate-500" />
                            )}
                            <span>{record.channel.replace(/_/g, ' ')}</span>
                          </span>
                        </td>
                        <td className="py-3 px-4 font-mono text-[11px] uppercase text-slate-600">
                          {record.noticeLanguage}
                        </td>
                        <td className="py-3 px-4">
                          <Badge
                            variant={record.status === 'GIVEN' ? 'success' : 'neutral'}
                            label={record.status === 'GIVEN' ? 'ACTIVE (GIVEN)' : 'WITHDRAWN'}
                          />
                        </td>
                        <td className="py-3 px-4 text-slate-500 font-mono text-[11px]">
                          {new Date(record.capturedAt).toLocaleString()}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => handleViewReceipt(record.recordId)}
                              className="btn-secondary px-2.5 py-1 text-[11px] font-semibold rounded-md flex items-center gap-1 cursor-pointer shadow-2xs"
                              title="View Statutory Consent Receipt"
                            >
                              <Eye className="w-3 h-3" />
                              <span>Receipt</span>
                            </button>

                            {record.status === 'GIVEN' && (
                              <button
                                onClick={() => handleWithdraw(record)}
                                className="btn-danger px-2.5 py-1 text-[11px] font-semibold rounded-md cursor-pointer shadow-2xs"
                                title="Withdraw consent under DPDP Section 6(4)"
                              >
                                Withdraw
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            <div className="bg-slate-50 px-4 py-2 border-t border-slate-200 text-[11px] text-slate-500 flex items-center justify-between">
              <span>Showing {allRecords.length} records</span>
              <span className="font-mono text-[10px]">Tamper-Evident DPDP Ledger</span>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 2: CAPTURE NEW CONSENT & BULK IMPORT                 */}
      {/* ======================================================== */}
      {activeTab === 'record' && (
        <div className="space-y-6">
          {/* Sub-mode switcher */}
          <div className="flex items-center gap-2 border-b border-slate-200 pb-3">
            <button
              onClick={() => setRecordMode('single')}
              className={`px-4 py-2 text-xs font-semibold rounded-xl transition-all cursor-pointer ${
                recordMode === 'single'
                  ? 'btn-primary shadow-xs'
                  : 'btn-secondary shadow-2xs'
              }`}
            >
              Single Consent Registration
            </button>
            <button
              onClick={() => setRecordMode('bulk')}
              className={`px-4 py-2 text-xs font-semibold rounded-xl transition-all cursor-pointer ${
                recordMode === 'bulk'
                  ? 'btn-primary shadow-xs'
                  : 'btn-secondary shadow-2xs'
              }`}
            >
              Bulk CSV / Batch Importer
            </button>
          </div>

          {/* Mode 1: Single Consent Registration */}
          {recordMode === 'single' && (
            <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-xs max-w-2xl space-y-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Register Affirmative Consent Event (Section 6)
                </h3>
                <p className="text-xs text-slate-500">
                  Record unambiguous consent collected through clinic desk, online form, or WhatsApp opt-in.
                </p>
              </div>

              {formSuccess && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded text-xs text-emerald-800 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{formSuccess}</span>
                </div>
              )}

              {formError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded text-xs text-rose-800 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              <form onSubmit={handleRecordConsent} className="space-y-4 text-xs">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Data Principal Identifier (Phone or Email) *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. +91 9845012345 or citizen@srujana.in"
                    value={formUserRef}
                    onChange={(e) => setFormUserRef(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded px-3 py-2 text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Specified Processing Purpose *
                  </label>
                  <select
                    value={formPurposeId}
                    onChange={(e) => setFormPurposeId(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded px-3 py-2 text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500 font-medium"
                  >
                    {purposes.map((p) => (
                      <option key={p.purposeId} value={p.purposeId}>
                        {p.name} ({p.legalBasis})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Collection Channel *
                    </label>
                    <select
                      value={formChannel}
                      onChange={(e) => setFormChannel(e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded px-3 py-2 text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    >
                      <option value="WHATSAPP_YES">WhatsApp Opt-in (Reply 'YES')</option>
                      <option value="WEB_PORTAL">Web Consent Widget</option>
                      <option value="IN_PERSON_AFFIRMATIVE">Physical Registration Slip</option>
                      <option value="SMS_OTP">SMS OTP Verification</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Notice Language Rendered *
                    </label>
                    <select
                      value={formLanguage}
                      onChange={(e) => setFormLanguage(e.target.value as any)}
                      className="w-full bg-white border border-slate-300 rounded px-3 py-2 text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    >
                      <option value="en">English (Schedule 8)</option>
                      <option value="hi">हिन्दी (Hindi)</option>
                      <option value="kn">ಕನ್ನಡ (Kannada)</option>
                    </select>
                  </div>
                </div>

                {/* Section 6 Affirmative Check */}
                <div className="p-3 bg-blue-50/70 border border-blue-200 rounded space-y-2">
                  <label className="flex items-start gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formAffirmative}
                      onChange={(e) => setFormAffirmative(e.target.checked)}
                      className="mt-0.5 rounded text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-blue-900 leading-snug">
                      <strong>Section 6 Affirmative Action Verification:</strong> I certify that the data principal has made an affirmative, unambiguous opt-in after receiving the Section 5 notice.
                    </span>
                  </label>
                </div>

                <button
                  type="submit"
                  disabled={formSubmitting}
                  className="btn-primary px-5 py-2.5 rounded-xl text-xs font-semibold shadow-sm cursor-pointer"
                >
                  {formSubmitting ? 'Recording into Ledger...' : 'Commit Consent Record'}
                </button>
              </form>
            </div>
          )}

          {/* Mode 2: Bulk CSV / Batch Importer */}
          {recordMode === 'bulk' && (
            <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-xs max-w-3xl space-y-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Bulk CSV & Batch Consent Importer
                </h3>
                <p className="text-xs text-slate-500">
                  Import hundreds of customer consent records at once. Format: <code className="bg-slate-100 px-1 py-0.5 rounded text-slate-800 font-mono">userRef,channel,language</code>
                </p>
              </div>

              {bulkResult && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded text-xs text-emerald-800 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{bulkResult}</span>
                </div>
              )}

              {bulkError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded text-xs text-rose-800 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{bulkError}</span>
                </div>
              )}

              <form onSubmit={handleBulkSubmit} className="space-y-4 text-xs">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Assign Purpose for this Batch *
                  </label>
                  <select
                    value={bulkPurposeId}
                    onChange={(e) => setBulkPurposeId(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded px-3 py-2 text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500 font-medium"
                  >
                    {purposes.map((p) => (
                      <option key={p.purposeId} value={p.purposeId}>
                        {p.name} ({p.legalBasis})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1 flex items-center justify-between">
                    <span>CSV Rows (userRef, channel, language) *</span>
                    <span className="text-[10px] text-slate-400 font-normal">One record per line</span>
                  </label>
                  <textarea
                    rows={6}
                    required
                    value={bulkCsvText}
                    onChange={(e) => setBulkCsvText(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded p-3 font-mono text-[11px] text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    placeholder="patient@aarogya.in,WHATSAPP_YES,en&#10;+919845012345,IN_PERSON_AFFIRMATIVE,kn"
                  />
                </div>

                <div className="flex items-center justify-between pt-2">
                  <span className="text-[11px] text-slate-500">
                    Ready to parse {bulkCsvText.trim().split('\n').filter(Boolean).length} rows
                  </span>

                  <button
                    type="submit"
                    disabled={bulkSubmitting}
                    className="btn-primary px-5 py-2.5 rounded-xl text-xs font-semibold shadow-sm flex items-center gap-2 cursor-pointer"
                  >
                    <Upload className="w-4 h-4" />
                    <span>{bulkSubmitting ? 'Importing Batch...' : 'Import Batch into DPDP Ledger'}</span>
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 3: MULTILINGUAL NOTICES & SHAREABLE LINK WIDGET     */}
      {/* ======================================================== */}
      {activeTab === 'notices' && (
        <div className="space-y-6">
          {/* Shareable Public Consent Widget Link Card */}
          <div className="bg-[#1b6c80] rounded-lg p-5 text-white border border-[#155666] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <span className="text-[10px] bg-white/10 text-white border border-white/20 px-2 py-0.5 rounded font-medium tracking-wide">
                Direct citizen opt-in
              </span>
              <h3 className="text-base font-bold text-white">
                Shareable Customer Privacy & Rights Portal Link
              </h3>
              <p className="text-xs text-blue-200 max-w-xl">
                Send this link to patients via SMS, WhatsApp, or embed it on your website so users can view Section 5 notices and submit requests.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={copyPublicLink}
                className="btn-secondary px-4 py-2 rounded-xl text-xs font-semibold cursor-pointer shadow-sm flex items-center gap-2"
              >
                {copiedLink ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                <span>{copiedLink ? 'Copied Link!' : 'Copy Portal URL'}</span>
              </button>
            </div>
          </div>

          {/* Language Selector */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
              <Globe2 className="w-3.5 h-3.5 text-royal-600" />
              Notice Language (Eighth Schedule):
            </span>
            {(['en', 'hi', 'kn'] as const).map((lang) => (
              <button
                key={lang}
                onClick={() => setSelectedLanguage(lang)}
                className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                  selectedLanguage === lang
                    ? 'btn-primary shadow-xs'
                    : 'btn-secondary shadow-2xs'
                }`}
              >
                {lang === 'en' ? 'English (EN)' : lang === 'hi' ? 'हिन्दी (Hindi)' : 'ಕನ್ನಡ (Kannada)'}
              </button>
            ))}
          </div>

          {/* Notice Card */}
          {loadingNotice || !notice ? (
            <div className="p-8 text-center text-xs text-slate-500 bg-white border border-slate-200 rounded-lg">
              <RefreshCw className="w-4 h-4 animate-spin mx-auto mb-2 text-blue-600" />
              Loading statutory notice template...
            </div>
          ) : (
            <div className="bg-white border border-slate-200 rounded-lg p-6 space-y-5 shadow-xs">
              <div className="border-b border-slate-200 pb-3 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded">
                    DPDP Act Section 5 Compliant Notice
                  </span>
                  <h3 className="text-base font-bold text-slate-900 mt-2">{notice.headline}</h3>
                </div>
                <div className="text-xs font-mono text-slate-400">
                  Lang: {notice.language.toUpperCase()}
                </div>
              </div>

              <div className="space-y-4 text-xs">
                <div>
                  <h4 className="font-semibold text-slate-900 uppercase text-[11px] mb-1">
                    Personal Data Collected:
                  </h4>
                  <ul className="list-disc list-inside space-y-1 text-slate-700 pl-1">
                    {notice.dataCollected.map((item, i) => (
                      <li key={i}>{item}</li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h4 className="font-semibold text-slate-900 uppercase text-[11px] mb-1">
                    Specified Processing Purpose:
                  </h4>
                  <p className="text-slate-700 leading-relaxed bg-slate-50 p-3 rounded border border-slate-200 font-medium">
                    {notice.specifiedPurpose}
                  </p>
                </div>

                <div>
                  <h4 className="font-semibold text-slate-900 uppercase text-[11px] mb-1">
                    Data Principal Statutory Rights:
                  </h4>
                  <p className="text-slate-700 leading-relaxed">{notice.rightsNotice}</p>
                </div>

                <div>
                  <h4 className="font-semibold text-slate-900 uppercase text-[11px] mb-1">
                    Consent Withdrawal (Section 6(4)):
                  </h4>
                  <p className="text-slate-700 leading-relaxed">{notice.withdrawalInstructions}</p>
                </div>

                <div className="bg-blue-50/60 border border-blue-200 p-3 rounded flex items-center justify-between text-xs text-blue-900">
                  <div>
                    <span className="font-bold">Grievance Redressal Officer: </span>
                    <span>{notice.grievanceRedressal.officerTitle} ({notice.grievanceRedressal.email})</span>
                  </div>
                  <span className="text-[11px] font-mono text-blue-700">
                    Turnaround: {notice.grievanceRedressal.turnaroundDays} days
                  </span>
                </div>

                <div className="pt-2 border-t border-slate-100 flex items-start gap-2 bg-slate-50 p-3 rounded">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span className="text-[11px] text-slate-600 leading-snug">
                    <strong>Statutory Verification:</strong> This notice is formulated deterministically under Section 5 of the Digital Personal Data Protection Act, 2023 and adheres to the Eighth Schedule multilingual transparency mandate.
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ======================================================== */}
      {/* VERIFIABLE STATUTORY CONSENT RECEIPT MODAL               */}
      {/* ======================================================== */}
      {selectedReceipt && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white border border-slate-200 rounded-xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Verifiable DPDP Consent Receipt
                  </h3>
                  <span className="text-[10px] font-mono text-slate-500">
                    {selectedReceipt.receiptId}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setSelectedReceipt(null)}
                className="text-slate-400 hover:text-slate-700 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3 rounded-lg border border-slate-200">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-semibold block">
                    Data Principal
                  </span>
                  <span className="font-mono font-bold text-slate-900">
                    {selectedReceipt.dataPrincipal}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-semibold block">
                    Data Fiduciary
                  </span>
                  <span className="font-bold text-slate-900 truncate block">
                    {selectedReceipt.organization}
                  </span>
                </div>
              </div>

              <div>
                <span className="text-[10px] text-slate-400 uppercase font-semibold block">
                  Specified Purpose & Legal Basis
                </span>
                <div className="font-semibold text-slate-900 mt-0.5">
                  {selectedReceipt.purpose}
                </div>
                <div className="text-[10px] font-mono text-blue-600">
                  {selectedReceipt.legalBasis}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-semibold block">
                    Status
                  </span>
                  <Badge
                    variant={selectedReceipt.status === 'GIVEN' ? 'success' : 'neutral'}
                    label={selectedReceipt.status}
                  />
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-semibold block">
                    Channel & Language
                  </span>
                  <span className="text-slate-800 font-medium">
                    {selectedReceipt.channel.replace(/_/g, ' ')} ({selectedReceipt.noticeLanguage.toUpperCase()})
                  </span>
                </div>
              </div>

              <div>
                <span className="text-[10px] text-slate-400 uppercase font-semibold block">
                  Timestamp Logged
                </span>
                <span className="font-mono text-slate-700">
                  {new Date(selectedReceipt.capturedAt).toLocaleString()}
                </span>
              </div>

              {/* Cryptographic Proof */}
              <div className="bg-slate-900 text-slate-200 p-3 rounded-lg font-mono text-[10px] space-y-1">
                <span className="text-slate-400 block uppercase font-bold tracking-wider">
                  Tamper-Evident SHA-256 Receipt Proof:
                </span>
                <div className="text-emerald-400 break-all select-all">
                  {selectedReceipt.sha256Proof}
                </div>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-200 flex items-center justify-between">
              <span className="text-[10px] text-slate-400">
                DPDP Act 2023 Statutory Compliance
              </span>
              <button
                onClick={() => setSelectedReceipt(null)}
                className="btn-cancel px-4 py-2 text-xs font-semibold rounded-lg cursor-pointer"
              >
                Close Receipt
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
