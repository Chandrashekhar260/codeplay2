import React, { useState, useEffect } from 'react';
import {
  ArrowRight,
  ShieldCheck,
  FileSearch,
  Network,
  FileCheck2,
  Baby,
} from 'lucide-react';
import type { NavTab } from '../components/layout/Sidebar';
import { api } from '../api/client';

interface OverviewPageProps {
  onNavigate: (tab: NavTab) => void;
  stats: {
    sourcesCount: number;
    findingsCount: number;
    assetsCount: number;
    consentsCount: number;
    flagsCount: number;
  };
}

export const OverviewPage: React.FC<OverviewPageProps> = ({ onNavigate, stats }) => {
  const [penalties, setPenalties] = useState<Array<{ key: string; section: string; maximum: string; basis: string }>>([]);
  const [loadingRules, setLoadingRules] = useState<boolean>(true);

  // Fetch real statutory rules & penalties directly from backend API
  useEffect(() => {
    async function loadStatutoryRules() {
      try {
        const rules = await api.governance.getRules();
        if (rules?.penaltyReferences) {
          const list = Object.entries(rules.penaltyReferences).map(([key, val]: [string, any]) => ({
            key,
            section: val.section,
            maximum: val.maximum,
            basis: val.basis,
          }));
          setPenalties(list);
        }
      } catch (err) {
        console.error('Failed to load statutory penalty rules:', err);
      } finally {
        setLoadingRules(false);
      }
    }
    loadStatutoryRules();
  }, []);

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Title & Primary Action Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2.5">
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">
              Compliance Overview
            </h2>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-blue-50 text-royal-700 border border-blue-200">
              <ShieldCheck className="w-3.5 h-3.5 text-royal-600" />
              DPDP Act 2023 Live
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Digital Personal Data Protection Act, 2023 posture and active statutory register metrics.
          </p>
        </div>

        <button
          onClick={() => onNavigate('discovery')}
          className="btn-primary px-4 py-2 text-xs font-semibold rounded-xl shadow-sm hover:shadow flex items-center gap-2 cursor-pointer self-start sm:self-auto group"
        >
          <span>Scan new data source</span>
          <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform duration-150" />
        </button>
      </div>

      {/* DPDP Section 9 Children's Personal Data Protection Banner */}
      <div className="bg-gradient-to-r from-teal-50/90 to-blue-50/70 border border-teal-200/80 rounded-2xl p-4.5 flex flex-col md:flex-row md:items-center justify-between gap-4 card-interactive shadow-xs">
        <div className="flex items-start gap-3.5">
          <div className="w-9 h-9 rounded-xl bg-teal-600 flex items-center justify-center text-white shrink-0 shadow-sm">
            <Baby className="w-4.5 h-4.5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xs font-bold text-teal-950 tracking-tight">
                DPDP Act Section 9 — Children's Personal Data Protection Safeguards
              </h3>
              <span className="px-2.5 py-0.5 text-[10px] font-bold bg-white text-teal-800 border border-teal-300 rounded-full shadow-2xs">
                Statutory Active
              </span>
            </div>
            <p className="text-xs text-teal-900/90 mt-1 max-w-2xl leading-relaxed">
              Verifiable parental/guardian consent verification active. Behavioral tracking, user profiling, and targeted advertising directed at minor individuals are strictly prohibited with penalties up to ₹200 Crores under Section 33.
            </p>
          </div>
        </div>
        <button
          onClick={() => onNavigate('dsr')}
          className="btn-secondary px-3.5 py-2 text-xs font-semibold rounded-xl shrink-0 self-start md:self-center cursor-pointer shadow-2xs"
        >
          View Section 9 Minor DSRs
        </button>
      </div>

      {/* Primary KPI Container — Interactive Card Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Discovered Sources */}
        <div
          onClick={() => onNavigate('discovery')}
          className="bg-white border border-slate-200/90 hover:border-royal-500 rounded-2xl p-4.5 cursor-pointer card-interactive shadow-xs group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Discovered Sources</span>
            <FileSearch className="w-4 h-4 text-slate-400 group-hover:text-royal-600 transition-colors" />
          </div>
          <div className="text-3xl font-extrabold text-slate-900 tabular-nums mt-2">{stats.sourcesCount}</div>
          <p className="text-[11px] text-slate-500 mt-1">Spreadsheets & databases indexed</p>
        </div>

        {/* Extracted PII Fields */}
        <div
          onClick={() => onNavigate('discovery')}
          className="bg-white border border-slate-200/90 hover:border-rose-500 rounded-2xl p-4.5 cursor-pointer card-interactive shadow-xs group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Identified PII Fields</span>
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 shadow-xs" />
          </div>
          <div className="text-3xl font-extrabold text-rose-600 tabular-nums mt-2">{stats.findingsCount}</div>
          <p className="text-[11px] text-slate-500 mt-1">Verified via Verhoeff checksum</p>
        </div>

        {/* Governed Assets */}
        <div
          onClick={() => onNavigate('governance')}
          className="bg-white border border-slate-200/90 hover:border-teal-500 rounded-2xl p-4.5 cursor-pointer card-interactive shadow-xs group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Governed Data Assets</span>
            <Network className="w-4 h-4 text-slate-400 group-hover:text-teal-600 transition-colors" />
          </div>
          <div className="text-3xl font-extrabold text-slate-900 tabular-nums mt-2">{stats.assetsCount}</div>
          <p className="text-[11px] text-slate-500 mt-1">Scheduled statutory retention</p>
        </div>

        {/* Active Consents */}
        <div
          onClick={() => onNavigate('consent')}
          className="bg-white border border-slate-200/90 hover:border-emerald-500 rounded-2xl p-4.5 cursor-pointer card-interactive shadow-xs group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Active Consents</span>
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-xs" />
          </div>
          <div className="text-3xl font-extrabold text-emerald-600 tabular-nums mt-2">{stats.consentsCount}</div>
          <p className="text-[11px] text-slate-500 mt-1">Section 6 affirmative consents</p>
        </div>
      </div>

      {/* Statutory Maximum Penalty Reference Matrix */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
        <div className="px-5 py-3.5 border-b border-slate-200 flex items-center justify-between bg-slate-50/70">
          <div>
            <h3 className="text-xs font-bold text-slate-900">
              Statutory Penalty Liability Matrix (DPDP Act, 2023 Section 33)
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Statutory maximum liability caps determined by the Data Protection Board of India.
            </p>
          </div>
          <span className="text-[11px] font-bold px-3 py-1 bg-white text-slate-700 rounded-lg border border-slate-200 shadow-2xs">
            Schedule Reference
          </span>
        </div>

        <div className="overflow-x-auto">
          {loadingRules ? (
            <div className="p-8 text-center text-xs text-slate-500 font-medium">Loading statutory rules...</div>
          ) : (
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/90 border-b border-slate-200 text-slate-600 font-semibold text-[11px]">
                <tr>
                  <th className="py-3 px-5">Contravention Area</th>
                  <th className="py-3 px-5">Statutory Section</th>
                  <th className="py-3 px-5 text-right">Maximum Liability</th>
                  <th className="py-3 px-5">Legal Basis</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {penalties.map((item) => (
                  <tr key={item.key} className="hover:bg-blue-50/40 transition-colors">
                    <td className="py-3 px-5 font-semibold text-slate-900">
                      {item.key.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase())}
                    </td>
                    <td className="py-3 px-5 text-slate-600 font-medium">{item.section}</td>
                    <td className="py-3 px-5 font-bold text-rose-600 tabular-nums text-right">
                      {item.maximum}
                    </td>
                    <td className="py-3 px-5 text-slate-600">{item.basis}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Workflow Navigation Panels */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div
          onClick={() => onNavigate('discovery')}
          className="bg-white border border-slate-200 hover:border-royal-500 rounded-2xl p-5 card-interactive shadow-xs cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-blue-50 text-royal-600 flex items-center justify-center font-bold">
                <FileSearch className="w-4 h-4" />
              </div>
              <h4 className="text-xs font-bold text-slate-900">1. Data Discovery & Scanner</h4>
            </div>
            <ArrowRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 group-hover:text-royal-600 transition-all" />
          </div>
          <p className="text-xs text-slate-500 mt-2.5 leading-relaxed">
            Upload MSME files to detect Indian Aadhaar via Verhoeff checksum, PAN numbers, and Section 9 pediatric minor data.
          </p>
        </div>

        <div
          onClick={() => onNavigate('ropa')}
          className="bg-white border border-slate-200 hover:border-royal-500 rounded-2xl p-5 card-interactive shadow-xs cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-blue-50 text-royal-600 flex items-center justify-center font-bold">
                <Network className="w-4 h-4" />
              </div>
              <h4 className="text-xs font-bold text-slate-900">2. RoPA & Data Flow Graph</h4>
            </div>
            <ArrowRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 group-hover:text-royal-600 transition-all" />
          </div>
          <p className="text-xs text-slate-500 mt-2.5 leading-relaxed">
            Interactive node-edge graph mapping processing pipelines from collection to third-party recipients.
          </p>
        </div>

        <div
          onClick={() => onNavigate('consent')}
          className="bg-white border border-slate-200 hover:border-royal-500 rounded-2xl p-5 card-interactive shadow-xs cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-blue-50 text-royal-600 flex items-center justify-center font-bold">
                <FileCheck2 className="w-4 h-4" />
              </div>
              <h4 className="text-xs font-bold text-slate-900">3. Consent & Scheduled Notices</h4>
            </div>
            <ArrowRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 group-hover:text-royal-600 transition-all" />
          </div>
          <p className="text-xs text-slate-500 mt-2.5 leading-relaxed">
            Publish Section 5 notices in English, Hindi, and Kannada with affirmative logging.
          </p>
        </div>
      </div>
    </div>
  );
};

