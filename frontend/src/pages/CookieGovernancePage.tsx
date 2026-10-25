import React, { useState, useEffect } from 'react';
import {
  Cookie,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Globe,
  Copy,
  Check,
  Edit2,
  Lock,
  X,
} from 'lucide-react';
import type { CookieScanSummary, CookieStats, DetectedCookie, CookieCategory } from '../types';
import { api } from '../api/client';

export const CookieGovernancePage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'inventory' | 'simulator' | 'embed' | 'telemetry'>('inventory');

  // Scanner State
  const [targetUrl, setTargetUrl] = useState('https://aarogyadiagnostics.in');
  const [scanning, setScanning] = useState(false);
  const [scanResult, setScanResult] = useState<CookieScanSummary | null>(null);
  const [stats, setStats] = useState<CookieStats | null>(null);
  const [scanError, setScanError] = useState<string | null>(null);

  // Edit Cookie State
  const [editingCookie, setEditingCookie] = useState<DetectedCookie | null>(null);
  const [editCategory, setEditCategory] = useState<CookieCategory>('ANALYTICS');
  const [editPurpose, setEditPurpose] = useState('');
  const [savingEdit, setSavingEdit] = useState(false);

  // Banner Simulator State
  const [bannerPreferences, setBannerPreferences] = useState({
    NECESSARY: true, // Always locked
    ANALYTICS: true,
    MARKETING: false,
    FUNCTIONAL: true,
  });
  const [bannerLoggedResult, setBannerLoggedResult] = useState<any | null>(null);
  const [loggingBanner, setLoggingBanner] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  // Category Filter
  const [categoryFilter, setCategoryFilter] = useState<'ALL' | CookieCategory>('ALL');

  // Load Inventory & Stats on mount
  const loadData = async () => {
    try {
      const [inv, st] = await Promise.all([
        api.cookies.getInventory().catch(() => null),
        api.cookies.getStats().catch(() => null),
      ]);
      if (inv) setScanResult(inv);
      if (st) setStats(st);
    } catch (err) {
      console.error('Failed to load cookie inventory:', err);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Run Automated Scanner
  const handleScan = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!targetUrl.trim()) return;

    setScanning(true);
    setScanError(null);
    try {
      const result = await api.cookies.scan(targetUrl.trim());
      setScanResult(result);
      const updatedStats = await api.cookies.getStats().catch(() => null);
      if (updatedStats) setStats(updatedStats);
    } catch (err: any) {
      setScanError(err.response?.data?.error?.message || 'Failed to scan website for cookies.');
    } finally {
      setScanning(false);
    }
  };

  // Save Cookie Edit
  const handleSaveEdit = async () => {
    if (!editingCookie) return;
    setSavingEdit(true);
    try {
      const updated = await api.cookies.updateCookie(editingCookie.id, {
        category: editCategory,
        purpose: editPurpose,
      });

      // Update in local state
      if (scanResult) {
        setScanResult({
          ...scanResult,
          detectedCookies: scanResult.detectedCookies.map((c) =>
            c.id === updated.id ? updated : c
          ),
        });
      }
      setEditingCookie(null);
    } catch (err: any) {
      alert(err.response?.data?.error?.message || 'Failed to update cookie categorization.');
    } finally {
      setSavingEdit(false);
    }
  };

  // Simulator Accept All
  const handleAcceptAll = async () => {
    setLoggingBanner(true);
    try {
      const res = await api.cookies.logConsent({
        accepted: ['NECESSARY', 'ANALYTICS', 'MARKETING', 'FUNCTIONAL'],
        rejected: [],
      });
      setBannerLoggedResult({
        choice: 'Accept All',
        proof: res.sha256Proof,
        timestamp: res.timestamp,
        accepted: ['NECESSARY', 'ANALYTICS', 'MARKETING', 'FUNCTIONAL'],
      });
      const st = await api.cookies.getStats().catch(() => null);
      if (st) setStats(st);
    } finally {
      setLoggingBanner(false);
    }
  };

  // Simulator Reject Non-Essential
  const handleRejectNonEssential = async () => {
    setLoggingBanner(true);
    try {
      const res = await api.cookies.logConsent({
        accepted: ['NECESSARY'],
        rejected: ['ANALYTICS', 'MARKETING', 'FUNCTIONAL'],
      });
      setBannerLoggedResult({
        choice: 'Reject Non-Essential (Essential Only)',
        proof: res.sha256Proof,
        timestamp: res.timestamp,
        accepted: ['NECESSARY'],
      });
      const st = await api.cookies.getStats().catch(() => null);
      if (st) setStats(st);
    } finally {
      setLoggingBanner(false);
    }
  };

  // Simulator Save Custom Preferences
  const handleSaveCustomPreferences = async () => {
    setLoggingBanner(true);
    try {
      const accepted: CookieCategory[] = ['NECESSARY'];
      const rejected: CookieCategory[] = [];

      if (bannerPreferences.ANALYTICS) accepted.push('ANALYTICS');
      else rejected.push('ANALYTICS');

      if (bannerPreferences.MARKETING) accepted.push('MARKETING');
      else rejected.push('MARKETING');

      if (bannerPreferences.FUNCTIONAL) accepted.push('FUNCTIONAL');
      else rejected.push('FUNCTIONAL');

      const res = await api.cookies.logConsent({ accepted, rejected });
      setBannerLoggedResult({
        choice: 'Custom Preferences',
        proof: res.sha256Proof,
        timestamp: res.timestamp,
        accepted,
      });
      const st = await api.cookies.getStats().catch(() => null);
      if (st) setStats(st);
    } finally {
      setLoggingBanner(false);
    }
  };

  const copyEmbedSnippet = () => {
    const snippet = `<!-- PrivacyLedger DPDP Cookie Consent Banner -->\n<script\n  src="https://cdn.privacyledger.in/v1/cookie-banner.js"\n  data-tenant="sample-tenant-aarogya-clinic"\n  data-lang="en"\n  async\n></script>`;
    navigator.clipboard.writeText(snippet);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const filteredCookies =
    scanResult?.detectedCookies.filter((c) =>
      categoryFilter === 'ALL' ? true : c.category === categoryFilter
    ) || [];

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-sm font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <span>Website Cookie Governance & CMP Scanner</span>
            <span className="text-[10px] bg-amber-50 text-amber-800 font-semibold px-2 py-0.5 rounded border border-amber-200">
              DPDP Act 2023 Sec 6 Mandate
            </span>
          </h1>
          <p className="text-xs text-slate-500">
            Automated crawler discovery, tracker inventory categorization, affirmative opt-in CMP banner, and visitor consent telemetry.
          </p>
        </div>

        {/* Tab Controls */}
        <div className="flex items-center gap-1.5 bg-slate-100/80 p-1.5 rounded-xl border border-slate-200/60">
          <button
            onClick={() => setActiveTab('inventory')}
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
              activeTab === 'inventory' ? 'btn-primary shadow-xs' : 'text-slate-600 hover:text-royal-700 hover:bg-white/80'
            }`}
          >
            Cookie Inventory
          </button>
          <button
            onClick={() => setActiveTab('simulator')}
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
              activeTab === 'simulator' ? 'btn-primary shadow-xs' : 'text-slate-600 hover:text-royal-700 hover:bg-white/80'
            }`}
          >
            Live Banner Simulator
          </button>
          <button
            onClick={() => setActiveTab('embed')}
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
              activeTab === 'embed' ? 'btn-primary shadow-xs' : 'text-slate-600 hover:text-royal-700 hover:bg-white/80'
            }`}
          >
            1-Click Embed Snippet
          </button>
          <button
            onClick={() => setActiveTab('telemetry')}
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
              activeTab === 'telemetry' ? 'btn-primary shadow-xs' : 'text-slate-600 hover:text-royal-700 hover:bg-white/80'
            }`}
          >
            Visitor Telemetry Logs
          </button>
        </div>
      </div>

      {/* Automated Scanner Bar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <span className="text-[10px] text-royal-600 font-bold uppercase tracking-wider">
              Automated Website Cookie Crawler
            </span>
            <h3 className="text-sm font-bold text-slate-900 mt-0.5">
              Scan any business website for cookies, third-party trackers & ad pixels
            </h3>
          </div>
          {scanResult && (
            <div className="text-[11px] text-slate-500 font-mono">
              Last Scanned: {new Date(scanResult.scannedAt).toLocaleTimeString()}
            </div>
          )}
        </div>

        <form onSubmit={handleScan} className="flex flex-col sm:flex-row gap-2.5">
          <div className="relative flex-1">
            <Globe className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              required
              placeholder="e.g. https://aarogyadiagnostics.in or company.com"
              value={targetUrl}
              onChange={(e) => setTargetUrl(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-royal-500 font-medium"
            />
          </div>
          <button
            type="submit"
            disabled={scanning}
            className="btn-primary px-5 py-2.5 rounded-xl text-xs font-bold shadow-sm flex items-center justify-center gap-2 cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${scanning ? 'animate-spin' : ''}`} />
            <span>{scanning ? 'Inspecting Headers & Scripts...' : 'Run Automated Cookie Scan'}</span>
          </button>
        </form>

        {/* Quick test website chips */}
        <div className="flex flex-wrap items-center gap-2 text-xs pt-1">
          <span className="text-[11px] text-slate-500">Quick Test Websites:</span>
          {['https://aarogyadiagnostics.in', 'https://apollo247.com', 'https://practo.com'].map(
            (demoUrl) => (
              <button
                key={demoUrl}
                type="button"
                onClick={() => setTargetUrl(demoUrl)}
                className="px-2 py-0.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-[11px] font-mono transition-colors"
              >
                {demoUrl.replace('https://', '')}
              </button>
            )
          )}
        </div>

        {scanError && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded text-xs text-rose-800 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{scanError}</span>
          </div>
        )}
      </div>

      {/* Summary KPI Cards */}
      {scanResult && (
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
          <div className="bg-white border border-slate-200 rounded-lg p-3.5 shadow-xs">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
              Total Detected Trackers
            </span>
            <div className="text-xl font-bold text-slate-900 mt-1 flex items-center gap-2">
              <span>{scanResult.totalCookies}</span>
              <span className="text-xs font-semibold px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
                Grade {scanResult.complianceRating}
              </span>
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5 truncate">{scanResult.scannedUrl}</div>
          </div>

          <div className="bg-white border border-slate-200 rounded-lg p-3.5 shadow-xs">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
              Strictly Necessary
            </span>
            <div className="text-xl font-bold text-slate-900 mt-1">
              {scanResult.byCategory.NECESSARY}
            </div>
            <div className="text-[11px] text-emerald-600 font-medium mt-0.5 flex items-center gap-1">
              <Check className="w-3.5 h-3.5" />
              <span>Exempt from Consent (Sec 4)</span>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-lg p-3.5 shadow-xs">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
              Analytics & Telemetry
            </span>
            <div className="text-xl font-bold text-blue-600 mt-1">
              {scanResult.byCategory.ANALYTICS}
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5">Opt-in Banner Required</div>
          </div>

          <div className="bg-white border border-slate-200 rounded-lg p-3.5 shadow-xs">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
              Marketing & Pixels
            </span>
            <div className="text-xl font-bold text-rose-600 mt-1">
              {scanResult.byCategory.MARKETING}
            </div>
            <div className="text-[11px] text-rose-600 font-medium mt-0.5 flex items-center gap-1">
              <AlertCircle className="w-3.5 h-3.5" />
              <span>Explicit Consent Mandatory</span>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 1: COOKIE INVENTORY TABLE                            */}
      {/* ======================================================== */}
      {activeTab === 'inventory' && scanResult && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3 rounded-lg border border-slate-200">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-700">Filter Category:</span>
              {(['ALL', 'NECESSARY', 'ANALYTICS', 'MARKETING', 'FUNCTIONAL'] as const).map(
                (cat) => (
                  <button
                    key={cat}
                    onClick={() => setCategoryFilter(cat)}
                    className={`px-2.5 py-1 text-xs font-medium rounded transition-colors ${
                      categoryFilter === cat
                        ? 'bg-slate-900 text-white font-bold'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {cat}
                  </button>
                )
              )}
            </div>

            <span className="text-xs text-slate-500 font-mono">
              Showing {filteredCookies.length} of {scanResult.totalCookies} cookies
            </span>
          </div>

          {/* Table */}
          <div className="bg-white border border-slate-200 rounded-lg shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 text-[11px] font-semibold uppercase tracking-wider">
                    <th className="py-3 px-4">Cookie Name</th>
                    <th className="py-3 px-4">Provider / Source</th>
                    <th className="py-3 px-4">Category</th>
                    <th className="py-3 px-4">Expiry</th>
                    <th className="py-3 px-4">Purpose & DPDP Legal Basis</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {filteredCookies.map((cookie) => (
                    <tr key={cookie.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-slate-900">
                        {cookie.name}
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-semibold text-slate-800">{cookie.provider}</span>
                        <div className="text-[10px] text-slate-400 font-mono">{cookie.domain}</div>
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            cookie.category === 'NECESSARY'
                              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                              : cookie.category === 'ANALYTICS'
                              ? 'bg-blue-50 text-blue-800 border border-blue-200'
                              : cookie.category === 'MARKETING'
                              ? 'bg-rose-50 text-rose-800 border border-rose-200'
                              : 'bg-[#f0f7f9] text-[#0e3d48] border border-[#b2d9e3]'
                          }`}
                        >
                          {cookie.category}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-mono text-[11px] text-slate-600">
                        {cookie.expiry}
                      </td>
                      <td className="py-3 px-4 max-w-md">
                        <div className="text-slate-800 leading-snug">{cookie.purpose}</div>
                        <div className="text-[10px] text-blue-600 font-mono mt-0.5">
                          {cookie.legalBasis}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => {
                            setEditingCookie(cookie);
                            setEditCategory(cookie.category);
                            setEditPurpose(cookie.purpose);
                          }}
                          className="btn-secondary px-2.5 py-1 text-[11px] font-semibold rounded-md inline-flex items-center gap-1 cursor-pointer shadow-2xs"
                        >
                          <Edit2 className="w-3 h-3" />
                          <span>Classify</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 2: LIVE CMP BANNER SIMULATOR                         */}
      {/* ======================================================== */}
      {activeTab === 'simulator' && (
        <div className="space-y-6">
          <div className="bg-slate-900 text-white rounded-xl p-5 shadow-lg space-y-2">
            <span className="text-[10px] bg-blue-500/30 text-blue-300 border border-blue-400/30 px-2 py-0.5 rounded font-bold uppercase tracking-wider">
              Live CMP Banner Sandbox
            </span>
            <h3 className="text-sm font-bold">
              Simulate How Visitors Experience Cookie Consent on Your Website
            </h3>
            <p className="text-xs text-slate-300 max-w-2xl">
              This interactive widget demonstrates what patients see when visiting your website. Click any button to record live cryptographic consent receipts into the compliance ledger.
            </p>
          </div>

          {/* Interactive Floating Banner Mockup */}
          <div className="bg-slate-100 p-8 rounded-xl border border-slate-300 flex items-center justify-center">
            <div className="bg-white border border-slate-300 rounded-xl max-w-xl w-full p-6 shadow-2xl space-y-5">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-lg bg-blue-600 flex items-center justify-center text-white shrink-0 shadow-xs">
                  <Cookie className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900">
                    We Value Your Privacy & Personal Data
                  </h4>
                  <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                    Under the <strong>Digital Personal Data Protection (DPDP) Act, 2023</strong>, this website uses cookies for security, analytics, and functional preferences. Non-essential cookies require your explicit consent.
                  </p>
                </div>
              </div>

              {/* Preference Toggles */}
              <div className="space-y-2.5 pt-2 border-t border-slate-200 text-xs">
                {/* Strictly Necessary */}
                <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded border border-slate-200">
                  <div>
                    <span className="font-bold text-slate-900 block">Strictly Necessary</span>
                    <span className="text-[11px] text-slate-500">Security, session auth, CSRF, and payment protection</span>
                  </div>
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded flex items-center gap-1">
                    <Lock className="w-3 h-3" />
                    <span>Always Active</span>
                  </span>
                </div>

                {/* Performance & Analytics */}
                <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded border border-slate-200">
                  <div>
                    <span className="font-bold text-slate-900 block">Analytics & Telemetry</span>
                    <span className="text-[11px] text-slate-500">Google Analytics (GA4) traffic and usability reports</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={bannerPreferences.ANALYTICS}
                    onChange={(e) =>
                      setBannerPreferences({ ...bannerPreferences, ANALYTICS: e.target.checked })
                    }
                    className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                  />
                </div>

                {/* Marketing & Pixels */}
                <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded border border-slate-200">
                  <div>
                    <span className="font-bold text-slate-900 block">Marketing & Social Pixels</span>
                    <span className="text-[11px] text-slate-500">Meta/Facebook pixel and targeted conversion tracking</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={bannerPreferences.MARKETING}
                    onChange={(e) =>
                      setBannerPreferences({ ...bannerPreferences, MARKETING: e.target.checked })
                    }
                    className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Banner Action Buttons */}
              <div className="flex flex-col sm:flex-row items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={handleRejectNonEssential}
                  disabled={loggingBanner}
                  className="btn-cancel w-full sm:w-auto px-4 py-2 rounded-xl text-xs font-semibold cursor-pointer"
                >
                  Reject Non-Essential
                </button>
                <button
                  type="button"
                  onClick={handleSaveCustomPreferences}
                  disabled={loggingBanner}
                  className="btn-secondary w-full sm:w-auto px-4 py-2 rounded-xl text-xs font-semibold cursor-pointer shadow-xs"
                >
                  Save Preferences
                </button>
                <button
                  type="button"
                  onClick={handleAcceptAll}
                  disabled={loggingBanner}
                  className="btn-primary w-full sm:w-auto px-5 py-2 rounded-xl text-xs font-bold cursor-pointer shadow-sm"
                >
                  Accept All
                </button>
              </div>
            </div>
          </div>

          {/* Logged Receipt Confirmation */}
          {bannerLoggedResult && (
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg space-y-2 text-xs text-emerald-900">
              <div className="flex items-center gap-2 font-bold text-sm text-emerald-800">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Statutory Consent Event Recorded Live: {bannerLoggedResult.choice}</span>
              </div>
              <div className="bg-white p-3 rounded border border-emerald-200 font-mono text-[11px] space-y-1">
                <div>Accepted Categories: <span className="font-bold">{bannerLoggedResult.accepted.join(', ')}</span></div>
                <div>Timestamp: {new Date(bannerLoggedResult.timestamp).toLocaleString()}</div>
                <div className="truncate text-slate-500 text-[10px]">SHA-256 Audit Proof: {bannerLoggedResult.proof}</div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 3: 1-CLICK EMBED SNIPPET                             */}
      {/* ======================================================== */}
      {activeTab === 'embed' && (
        <div className="space-y-6">
          <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-xs space-y-4 max-w-3xl">
            <div>
              <span className="text-[10px] text-blue-600 font-bold uppercase tracking-wider">
                Webmaster Integration
              </span>
              <h3 className="text-base font-bold text-slate-900 mt-0.5">
                Install Cookie Banner in 1-Line of Code
              </h3>
              <p className="text-xs text-slate-500">
                Copy and paste this script tag into the <code className="bg-slate-100 px-1 py-0.5 rounded text-slate-800 font-mono">&lt;head&gt;</code> of your website. It automatically enforces Section 6 affirmative consent before firing third-party trackers.
              </p>
            </div>

            <div className="relative">
              <pre className="bg-slate-900 text-slate-200 p-4 rounded-lg font-mono text-xs overflow-x-auto">
{`<!-- PrivacyLedger DPDP Cookie Consent Banner -->
<script
  src="https://cdn.privacyledger.in/v1/cookie-banner.js"
  data-tenant="sample-tenant-aarogya-clinic"
  data-lang="en"
  async
></script>`}
              </pre>
              <button
                onClick={copyEmbedSnippet}
                className="absolute top-3 right-3 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded text-xs font-semibold flex items-center gap-1.5 border border-slate-700 transition-colors"
              >
                {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedCode ? 'Copied!' : 'Copy Code'}</span>
              </button>
            </div>

            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg space-y-2 text-xs text-blue-900">
              <h4 className="font-bold flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-blue-600" />
                <span>Zero-Trust Auto-Blocking</span>
              </h4>
              <p className="text-[11px] leading-relaxed text-blue-800">
                Our lightweight script automatically halts Google Tag Manager and Facebook Pixel from firing until the visitor affirmatively clicks <strong>"Accept All"</strong> or enables <strong>Analytics/Marketing</strong>.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 4: VISITOR TELEMETRY & LOGS                          */}
      {/* ======================================================== */}
      {activeTab === 'telemetry' && stats && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="bg-white border border-slate-200 rounded-lg p-3.5 shadow-xs">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
                Total Visitors Shown Banner
              </span>
              <div className="text-xl font-bold text-slate-900 mt-1">{stats.totalVisitorImpressions}</div>
              <div className="text-[11px] text-slate-500 mt-0.5">Live CMP impressions</div>
            </div>

            <div className="bg-white border border-slate-200 rounded-lg p-3.5 shadow-xs">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
                Visitor Opt-In Rate
              </span>
              <div className="text-xl font-bold text-emerald-600 mt-1">{stats.optInRate}%</div>
              <div className="text-[11px] text-slate-500 mt-0.5">{stats.totalVisitorImpressions - stats.allRejectedCount} accepted at least one category</div>
            </div>

            <div className="bg-white border border-slate-200 rounded-lg p-3.5 shadow-xs">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
                Marketing Pixels Accepted
              </span>
              <div className="text-xl font-bold text-blue-600 mt-1">{stats.marketingRate}%</div>
              <div className="text-[11px] text-slate-500 mt-0.5">{stats.marketingAcceptedCount} visitors consented to advertising</div>
            </div>
          </div>

          {/* Recent Visitor Logs */}
          <div className="bg-white border border-slate-200 rounded-lg shadow-xs overflow-hidden">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between">
              <h3 className="text-xs font-semibold text-slate-900">
                Recent Visitor Cookie Choice Audit Ledger
              </h3>
              <span className="text-[10px] text-slate-400 font-mono">Tamper-Evident SHA-256 Proofs</span>
            </div>

            <div className="divide-y divide-slate-100 text-xs">
              {stats.recentLogs.map((log) => (
                <div key={log.logId} className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-slate-900">{log.visitorId}</span>
                      <span className="text-[10px] bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded border border-emerald-200 font-semibold">
                        Accepted: {log.accepted.join(', ')}
                      </span>
                      {log.rejected.length > 0 && (
                        <span className="text-[10px] bg-rose-50 text-rose-700 px-2 py-0.5 rounded border border-rose-200 font-semibold">
                          Rejected: {log.rejected.join(', ')}
                        </span>
                      )}
                    </div>
                    <div className="text-[10px] text-slate-400 font-mono">
                      Proof: {log.sha256Proof.slice(0, 32)}...
                    </div>
                  </div>

                  <span className="text-[11px] text-slate-500 font-mono">
                    {new Date(log.timestamp).toLocaleTimeString()}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Edit Cookie Modal */}
      {editingCookie && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white border border-slate-200 rounded-xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className="text-sm font-bold text-slate-900">
                Classify Cookie: <span className="font-mono text-blue-600">{editingCookie.name}</span>
              </h3>
              <button onClick={() => setEditingCookie(null)} className="text-slate-400 hover:text-slate-700">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Category *</label>
                <select
                  value={editCategory}
                  onChange={(e) => setEditCategory(e.target.value as CookieCategory)}
                  className="w-full bg-white border border-slate-300 rounded px-3 py-2 text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500 font-medium"
                >
                  <option value="NECESSARY">Strictly Necessary (Exempt from Opt-in)</option>
                  <option value="ANALYTICS">Performance & Analytics</option>
                  <option value="MARKETING">Marketing & Social Pixels</option>
                  <option value="FUNCTIONAL">Functional & Preferences</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Specified Purpose *</label>
                <textarea
                  rows={3}
                  value={editPurpose}
                  onChange={(e) => setEditPurpose(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded p-2.5 text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setEditingCookie(null)}
                className="btn-cancel px-3.5 py-1.5 rounded-lg text-xs font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveEdit}
                disabled={savingEdit}
                className="btn-primary px-4 py-1.5 rounded-lg text-xs font-bold shadow-xs cursor-pointer"
              >
                {savingEdit ? 'Saving...' : 'Save Classification'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
