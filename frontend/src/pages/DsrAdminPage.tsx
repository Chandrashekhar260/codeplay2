import React, { useState, useEffect } from 'react';
import {
  UserCheck,
  CheckCircle2,
  AlertTriangle,
  Edit3,
  Trash2,
  Database,
  Sparkles,
  ExternalLink,
  ChevronRight,
} from 'lucide-react';
import { api } from '../api/client';
import type { DsrRequest, UserTraversalReport } from '../types';

interface DsrAdminPageProps {
  requests?: DsrRequest[];
  onDsrResolved?: () => void;
  onLaunchPortal?: () => void;
}

export const DsrAdminPage: React.FC<DsrAdminPageProps> = ({
  requests: initialRequests,
  onDsrResolved,
  onLaunchPortal,
}) => {
  const [requests, setRequests] = useState<DsrRequest[]>(initialRequests || []);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState<'PENDING' | 'RESOLVED' | 'ALL'>('PENDING');

  // Selected Request to show its affected nodes
  const [selectedReq, setSelectedReq] = useState<DsrRequest | null>(null);

  // User Traversal Report for the selected request
  const [userReport, setUserReport] = useState<UserTraversalReport | null>(null);
  const [loadingReport, setLoadingReport] = useState(false);

  // Resolution Form State
  const [correctedValueOverride, setCorrectedValueOverride] = useState('');
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [resolving, setResolving] = useState(false);
  const [actionSuccessMessage, setActionSuccessMessage] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const data = await api.dsr.getRequests();
      setRequests(data);
    } catch (err) {
      console.error('Failed to load DSR requests:', err);
    } finally {
      setLoading(false);
    }
  };

  // Sync when initialRequests changes from App.tsx
  useEffect(() => {
    if (initialRequests && initialRequests.length > 0) {
      setRequests(initialRequests);
    } else {
      fetchRequests();
    }
  }, [initialRequests]);

  // When requests change, select the first pending request if none selected
  useEffect(() => {
    const pendingList = requests.filter(
      (r) => r.status === 'SUBMITTED' || r.status === 'IN_REVIEW'
    );
    if (!selectedReq && pendingList.length > 0) {
      handleSelectRequest(pendingList[0]);
    } else if (selectedReq) {
      // Refresh current selected if it exists
      const updated = requests.find((r) => r.requestId === selectedReq.requestId);
      if (updated) setSelectedReq(updated);
    }
  }, [requests]);

  // Handle clicking a request to traverse its affected nodes
  const handleSelectRequest = async (req: DsrRequest) => {
    setSelectedReq(req);
    setActionSuccessMessage(null);
    setActionError(null);
    setCorrectedValueOverride(req.correctedValue || '');
    setResolutionNotes(
      req.requestType === 'CORRECTION'
        ? `Verified citizen OTP and updated ${req.fieldToCorrect || 'records'} across clinic database`
        : 'Statutory request verified and processed in compliance with DPDP Act Section 12'
    );

    setLoadingReport(true);
    try {
      const report = await api.dsr.traverseUserGraph(req.userRef);
      setUserReport(report);
    } catch (err) {
      console.error('Failed to traverse user graph for DSR:', err);
    } finally {
      setLoadingReport(false);
    }
  };

  // Execute and Apply Resolution to Database
  const handleExecuteResolution = async (
    resolution: 'APPROVE_CORRECTION' | 'APPROVE_ERASURE' | 'RETAIN_TAX_CONFLICT' | 'REJECT'
  ) => {
    if (!selectedReq) return;

    setResolving(true);
    setActionError(null);
    setActionSuccessMessage(null);
    try {
      await api.dsr.resolveRequest(selectedReq.requestId, {
        resolution,
        resolutionNotes: resolutionNotes.trim(),
        correctedValueOverride:
          resolution === 'APPROVE_CORRECTION' ? correctedValueOverride.trim() : undefined,
      });

      const message =
        resolution === 'APPROVE_CORRECTION'
          ? `Successfully updated database for ${selectedReq.userRef}. RoPA status updated.`
          : resolution === 'APPROVE_ERASURE'
          ? `Personal data erased/withdrawn for ${selectedReq.userRef}. RoPA status updated.`
          : `Request marked as ${resolution}`;

      setActionSuccessMessage(message);

      // Refresh requests
      await fetchRequests();
      if (onDsrResolved) onDsrResolved();

      // Reset selection
      setSelectedReq(null);
      setUserReport(null);
    } catch (err: any) {
      setActionError(err.response?.data?.error?.message || 'Failed to execute resolution');
    } finally {
      setResolving(false);
    }
  };

  // Filter requests: Default is PENDING so "if resolved no need to show"!
  const pendingRequests = requests.filter(
    (r) => r.status === 'SUBMITTED' || r.status === 'IN_REVIEW'
  );
  const resolvedRequests = requests.filter(
    (r) => r.status === 'COMPLETED' || r.status === 'RETAINED_TAX_CONFLICT'
  );

  const displayedRequests =
    filter === 'PENDING'
      ? pendingRequests
      : filter === 'RESOLVED'
      ? resolvedRequests
      : requests;

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Top Banner Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white border border-slate-200 rounded-lg p-4 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              Data Subject Rights (DSR) & Citizen Requests
            </h2>
            <span className="text-[10px] bg-blue-100 text-blue-800 font-bold px-2 py-0.5 rounded-full border border-blue-200">
              DPDP Act Sec 11 & 12
            </span>
            {pendingRequests.length > 0 && (
              <span className="text-[10px] bg-amber-400 text-slate-950 font-extrabold px-2 py-0.5 rounded-full animate-pulse flex items-center gap-1">
                <span>⭐</span>
                <span>{pendingRequests.length} Pending Action</span>
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Click on any request to view its <strong>affected RoPA nodes and data sources</strong>. Approving updates the database and clears the yellow star alert flags.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {onLaunchPortal && (
            <button
              onClick={onLaunchPortal}
              className="btn-secondary px-4 py-2 rounded-xl text-xs font-semibold cursor-pointer shadow-sm flex items-center gap-2 group"
            >
              <ExternalLink className="w-3.5 h-3.5 text-royal-600 group-hover:scale-110 transition-transform duration-150" />
              <span>Launch Citizen Privacy Portal</span>
            </button>
          )}

          {/* Filter Pills */}
          <div className="flex items-center gap-1.5 bg-slate-100/80 p-1.5 rounded-xl border border-slate-200/60 text-xs">
            <button
              onClick={() => setFilter('PENDING')}
              className={`px-3.5 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
                filter === 'PENDING'
                  ? 'btn-primary shadow-xs'
                  : 'text-slate-600 hover:text-royal-700 hover:bg-white/80'
              }`}
            >
              Pending Action ({pendingRequests.length})
            </button>
            <button
              onClick={() => setFilter('RESOLVED')}
              className={`px-3.5 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
                filter === 'RESOLVED'
                  ? 'btn-primary shadow-xs'
                  : 'text-slate-600 hover:text-royal-700 hover:bg-white/80'
              }`}
            >
              Resolved History ({resolvedRequests.length})
            </button>
            <button
              onClick={() => setFilter('ALL')}
              className={`px-3.5 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
                filter === 'ALL'
                  ? 'btn-primary shadow-xs'
                  : 'text-slate-600 hover:text-royal-700 hover:bg-white/80'
              }`}
            >
              All ({requests.length})
            </button>
          </div>
        </div>
      </div>

      {actionSuccessMessage && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-300 rounded-lg text-xs text-emerald-800 font-medium flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{actionSuccessMessage}</span>
        </div>
      )}

      {actionError && (
        <div className="p-3.5 bg-rose-50 border border-rose-300 rounded-lg text-xs text-rose-800 font-medium flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{actionError}</span>
        </div>
      )}

      {/* 2-Column Split: Left = Request Selector; Right = Affected Lineage Nodes & Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Request List */}
        <div className="lg:col-span-5 space-y-3">
          <div className="flex items-center justify-between text-xs text-slate-700 font-semibold px-1">
            <span>Incoming citizen requests</span>
            <span className="text-[11px] font-normal text-slate-500">
              {displayedRequests.length} shown
            </span>
          </div>

          {loading ? (
            <div className="p-8 text-center text-xs text-slate-400 bg-white rounded-lg border border-slate-200">
              Loading statutory requests...
            </div>
          ) : displayedRequests.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400 bg-white rounded-lg border border-slate-200 space-y-2">
              <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto" />
              <p className="font-semibold text-slate-700">No pending requests!</p>
              <p className="text-[11px] text-slate-500">
                All citizen requests have been resolved and RoPA yellow star alerts are clear.
              </p>
            </div>
          ) : (
            displayedRequests.map((req) => {
              const isSelected = selectedReq?.requestId === req.requestId;
              const isPending = req.status === 'SUBMITTED' || req.status === 'IN_REVIEW';

              return (
                <div
                  key={req.requestId}
                  onClick={() => handleSelectRequest(req)}
                  className={`p-4 rounded-lg border cursor-pointer transition-all duration-150 relative ${
                    isSelected
                      ? 'bg-blue-50/60 border-blue-500 shadow-md ring-1 ring-blue-500/30'
                      : 'bg-white border-slate-200 hover:border-blue-300 hover:bg-slate-50/80 shadow-xs'
                  }`}
                >
                  {/* Yellow Star Indicator for pending action */}
                  {isPending && (
                    <div className="absolute top-3 right-3 flex items-center gap-1 bg-amber-400 text-slate-950 font-extrabold px-2 py-0.5 rounded-full text-[10px] shadow-xs animate-pulse">
                      <span>⭐</span>
                      <span>{req.requestType}</span>
                    </div>
                  )}

                  <div className="space-y-1.5 pr-20">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-xs text-slate-900">{req.userRef}</span>
                      <span
                        className={`text-[9px] font-bold px-1.5 py-0.2 rounded font-mono ${
                          req.status === 'COMPLETED'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {req.status}
                      </span>
                      {req.details?.includes('§9') && (
                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-sky-50 border border-sky-200 text-sky-800">
                          DPDP §9 Minor Child
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-slate-700 leading-relaxed font-medium">
                      {req.details}
                    </p>

                    {/* Correction Value Preview */}
                    {req.fieldToCorrect && req.correctedValue && (
                      <div className="text-[11px] bg-amber-100/70 p-1.5 rounded border border-amber-200/80 text-amber-950 font-medium">
                        <span className="font-bold">{req.fieldToCorrect}:</span>{' '}
                        <span className="line-through text-slate-500 mr-1">
                          {req.currentValue || 'N/A'}
                        </span>
                        <span className="font-bold text-amber-900">→ {req.correctedValue}</span>
                      </div>
                    )}

                    <div className="flex items-center justify-between pt-1 text-[10px] text-slate-400">
                      <span>Filed: {new Date(req.createdAt).toLocaleDateString()}</span>
                      <span className="text-blue-600 font-semibold flex items-center gap-0.5">
                        Inspect Nodes <ChevronRight className="w-3 h-3" />
                      </span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Right Column: Affected Nodes & Resolution */}
        <div className="lg:col-span-7 space-y-4">
          <div className="text-xs text-slate-700 font-semibold px-1">
            Affected lineage nodes and resolution
          </div>

          {!selectedReq ? (
            <div className="bg-white border border-slate-200 rounded-lg p-12 text-center text-xs text-slate-400 space-y-2">
              <UserCheck className="w-8 h-8 text-slate-300 mx-auto" />
              <p className="font-semibold text-slate-700">Select a request on the left</p>
              <p className="text-slate-500 max-w-sm mx-auto">
                Click any incoming citizen request to view the exact data sources, PII categories, and RoPA activities affected by this user's data.
              </p>
            </div>
          ) : (
            <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-xs space-y-5">
              {/* Selected Request Header */}
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-slate-900">
                      {selectedReq.userRef}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${
                        selectedReq.requestType === 'CORRECTION'
                          ? 'bg-amber-100 text-amber-900 border border-amber-300'
                          : selectedReq.requestType === 'ERASURE'
                          ? 'bg-rose-100 text-rose-900 border border-rose-300'
                          : 'bg-blue-100 text-blue-900 border border-blue-300'
                      }`}
                    >
                      {selectedReq.requestType} REQUEST
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    "{selectedReq.details}"
                  </p>
                </div>

                <div className="text-right">
                  <span className="text-[10px] text-slate-400 block">Current Status</span>
                  <span
                    className={`text-[11px] font-bold px-2 py-0.5 rounded font-mono ${
                      selectedReq.status === 'COMPLETED'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-amber-100 text-amber-900 font-bold'
                    }`}
                  >
                    {selectedReq.status}
                  </span>
                </div>
              </div>

              {/* Visual Affected Nodes Pipeline */}
              <div className="space-y-3">
                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">
                  Traversed Lineage Path for {selectedReq.userRef}
                </span>

                {loadingReport ? (
                  <div className="p-6 text-center text-xs text-slate-400 bg-slate-50 rounded border border-slate-200">
                    Traversing RoPA knowledge graph for user records...
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {/* Node 1: Affected Data Source */}
                    <div className="p-3 rounded-lg border border-[#b2d9e3] bg-[#f0f7f9] flex items-start gap-3 text-xs relative">
                      <div className="w-8 h-8 rounded bg-[#1b6c80] text-white flex items-center justify-center shrink-0">
                        <Database className="w-4 h-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-medium text-[#0e3d48] bg-[#d9edf2] px-1.5 py-0.2 rounded">
                            Target data source
                          </span>
                          <span className="text-[10px] text-[#1b6c80] font-medium">
                            Holds citizen record
                          </span>
                        </div>
                        <p className="font-bold text-slate-900 text-xs mt-0.5">
                          {userReport?.dataSources?.[0]?.name ||
                            selectedReq.activity?.source?.name ||
                            'sample_clinic.csv'}
                        </p>
                        <p className="text-[11px] text-slate-500">
                          Repository file storing personal contact and health history.
                        </p>
                      </div>
                    </div>

                    {/* Arrow down */}
                    <div className="flex justify-center -my-1">
                      <div className="w-0.5 h-3 bg-blue-300" />
                    </div>

                    {/* Node 2: Affected PII Elements */}
                    <div className="p-3 rounded-lg border border-amber-300 bg-amber-50/50 flex items-start gap-3 text-xs">
                      <div className="w-8 h-8 rounded bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-xs">
                        <Edit3 className="w-4 h-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between">
                          <span className="text-[9px] font-bold uppercase tracking-wider text-amber-800 bg-amber-200 px-1.5 py-0.2 rounded">
                            Targeted Data Elements
                          </span>
                          {selectedReq.fieldToCorrect && (
                            <span className="text-[10px] text-amber-900 font-extrabold bg-amber-200 px-1.5 py-0.2 rounded flex items-center gap-1">
                              <span>⭐</span>
                              <span>Target: {selectedReq.fieldToCorrect}</span>
                            </span>
                          )}
                        </div>
                        <div className="flex flex-wrap gap-1.5 mt-1.5">
                          {userReport?.personalDataSummary?.piiCategoriesHeld &&
                          userReport.personalDataSummary.piiCategoriesHeld.length > 0 ? (
                            userReport.personalDataSummary.piiCategoriesHeld.map((cat, i) => (
                              <span
                                key={i}
                                className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                                  cat.toLowerCase().includes('phone') ||
                                  cat.toLowerCase().includes('contact')
                                    ? 'bg-amber-400 text-slate-950 font-bold border border-amber-500 shadow-xs'
                                    : 'bg-white border border-amber-200 text-amber-900'
                                }`}
                              >
                                {cat}
                              </span>
                            ))
                          ) : (
                            <span className="text-slate-500 text-[11px]">
                              FULL_NAME, PHONE_NUMBER, HEALTH_DATA
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Arrow down */}
                    <div className="flex justify-center -my-1">
                      <div className="w-0.5 h-3 bg-blue-300" />
                    </div>

                    {/* Node 3: Affected RoPA Activity Node */}
                    <div className="p-3.5 rounded-lg border-2 border-blue-500 bg-blue-50/60 text-xs shadow-sm relative">
                      {/* Top-Right Yellow Star Flag */}
                      {selectedReq.status !== 'COMPLETED' && (
                        <div className="absolute -top-3 -right-2 flex items-center gap-1 bg-amber-400 text-slate-950 font-extrabold px-2 py-0.5 rounded-full text-[10px] shadow-md border border-white animate-pulse">
                          <span>⭐</span>
                          <span>AFFECTED BY DSR</span>
                        </div>
                      )}

                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[9px] font-bold uppercase tracking-wider text-white bg-blue-600 px-1.5 py-0.2 rounded">
                          RoPA Processing Activity
                        </span>
                        <span className="text-[10px] font-mono text-slate-600 bg-white px-1.5 py-0.2 rounded border border-slate-200">
                          {selectedReq.activity?.legalBasis || 'DPDP Sec 6 Consent'}
                        </span>
                      </div>

                      <p className="font-bold text-xs text-slate-900 mt-1">
                        {selectedReq.activity?.name ||
                          userReport?.processingActivities?.[0]?.name ||
                          'Patient Consultation & Blood Report Dispatch'}
                      </p>

                      <p className="text-[11px] text-blue-900 mt-0.5">
                        <strong>Purpose:</strong>{' '}
                        {selectedReq.activity?.purpose ||
                          userReport?.processingActivities?.[0]?.purpose ||
                          'Diagnostic pathology analysis, patient report generation, and SMS alerts'}
                      </p>

                      <div className="mt-2 pt-2 border-t border-blue-200 flex items-center justify-between text-[10px]">
                        <span className="text-slate-600 font-medium">
                          DPDP Retention Schedule:
                        </span>
                        <span className="font-bold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                          36 Months (NMC Regulations)
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Action Resolution Form */}
              {selectedReq.status !== 'COMPLETED' ? (
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg space-y-3 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900 flex items-center gap-1.5 text-xs">
                      <Sparkles className="w-4 h-4 text-blue-600" />
                      Execute DPO Action & Apply to Database
                    </span>
                    <span className="text-[10px] text-slate-500">
                      Clears RoPA Yellow Star ⭐ Flag
                    </span>
                  </div>

                  {selectedReq.requestType === 'CORRECTION' && (
                    <div className="space-y-2">
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-slate-600 font-semibold mb-1">
                            Current Value
                          </label>
                          <input
                            type="text"
                            disabled
                            value={selectedReq.currentValue || '+91 9845012345'}
                            className="w-full bg-slate-100 border border-slate-300 rounded px-2.5 py-1.5 text-slate-600 line-through font-mono text-xs"
                          />
                        </div>
                        <div>
                          <label className="block text-slate-900 font-bold mb-1">
                            New Corrected Value to Apply *
                          </label>
                          <input
                            type="text"
                            value={correctedValueOverride}
                            onChange={(e) => setCorrectedValueOverride(e.target.value)}
                            className="w-full bg-white border border-blue-400 rounded px-2.5 py-1.5 text-slate-900 font-bold focus:ring-1 focus:ring-blue-500 font-mono text-xs shadow-xs"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-slate-700 font-semibold mb-1">
                          Audit Resolution Notes *
                        </label>
                        <input
                          type="text"
                          value={resolutionNotes}
                          onChange={(e) => setResolutionNotes(e.target.value)}
                          className="w-full bg-white border border-slate-300 rounded px-2.5 py-1.5 text-xs text-slate-800"
                        />
                      </div>

                      <div className="pt-2 flex justify-end">
                        <button
                          type="button"
                          disabled={resolving || !correctedValueOverride.trim()}
                          onClick={() => handleExecuteResolution('APPROVE_CORRECTION')}
                          className="btn-primary px-4 py-2 rounded-xl text-xs font-bold shadow-sm flex items-center gap-2 cursor-pointer"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                          <span>
                            {resolving
                              ? 'Applying...'
                              : 'Approve & Apply Correction to Database'}
                          </span>
                        </button>
                      </div>
                    </div>
                  )}

                  {selectedReq.requestType === 'ERASURE' && (
                    <div className="space-y-3">
                      <p className="text-[11px] text-slate-600">
                        Evaluating statutory exemption: If the data is covered under 7-year Tax audit (Income Tax Act) or Clinical Establishment Act, it will be retained under statutory lock. Otherwise, it will be immediately erased.
                      </p>

                      <div className="flex flex-wrap items-center justify-end gap-2 pt-1">
                        <button
                          type="button"
                          disabled={resolving}
                          onClick={() => handleExecuteResolution('RETAIN_TAX_CONFLICT')}
                          className="btn-warning px-3.5 py-2 text-xs font-bold rounded-xl cursor-pointer shadow-xs"
                        >
                          Apply Statutory Tax/Clinical Lock
                        </button>
                        <button
                          type="button"
                          disabled={resolving}
                          onClick={() => handleExecuteResolution('APPROVE_ERASURE')}
                          className="btn-danger px-4 py-2 rounded-xl text-xs font-bold shadow-sm flex items-center gap-2 cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                          <span>
                            {resolving ? 'Erasing...' : 'Approve Erasure & Withdraw Records'}
                          </span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-800 text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>
                    This request has been resolved and applied to the database. RoPA yellow star alerts are clear.
                  </span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
