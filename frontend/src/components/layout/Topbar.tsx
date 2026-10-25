import React from 'react';
import { Database, RefreshCw, CheckCircle2, LogOut } from 'lucide-react';
import type { NavTab } from './Sidebar';
import type { User } from '../../types';

interface TopbarProps {
  currentTab: NavTab;
  onRefresh: () => void;
  isRefreshing?: boolean;
  currentUser?: User | null;
  onLogout?: () => void;
}

const tabTitles: Record<NavTab, { title: string; subtitle: string }> = {
  dashboard: {
    title: 'Executive compliance overview',
    subtitle: 'High-level metrics, statutory penalty exposure, and active DPDP posture.',
  },
  discovery: {
    title: 'Data discovery and file scanner',
    subtitle: 'Inspect spreadsheets and extract PII via Verhoeff checksum algorithm.',
  },
  ropa: {
    title: 'Record of Processing Activities (RoPA)',
    subtitle: 'Interactive data relationship graph and Section 8 processing inventory.',
  },
  governance: {
    title: 'Statutory governance and retention matrix',
    subtitle: 'Deterministic DPDP Act & CGST Section 36 retention rules.',
  },
  consent: {
    title: 'Consent ledger and multilingual notices',
    subtitle: 'Affirmative consent collection and Section 5 scheduled language notices.',
  },
  dsr: {
    title: 'Data subject requests (DSR)',
    subtitle: 'Manage and fulfil citizen rights requests under DPDP Act Section 11–13.',
  },
  cookies: {
    title: 'Website cookie and tracker governance',
    subtitle: 'Automated crawler discovery, tracker categorization, and Section 6 banner.',
  },
  audit: {
    title: 'Append-only audit trail',
    subtitle: 'Tamper-evident system ledger of every classification, scan, and consent event.',
  },
};

export const Topbar: React.FC<TopbarProps> = ({
  currentTab,
  onRefresh,
  isRefreshing,
  currentUser,
  onLogout,
}) => {
  const meta = tabTitles[currentTab];

  return (
    <header className="h-14 bg-white border-b border-slate-200 px-6 flex items-center justify-between shrink-0 shadow-2xs">
      <div className="flex items-center gap-3">
        <h1 className="text-sm font-bold text-slate-900 tracking-tight">{meta.title}</h1>
        <span className="hidden lg:inline text-xs text-slate-500">• {meta.subtitle}</span>
      </div>

      <div className="flex items-center gap-3">
        {/* Backend / Cloud Database Connectivity Indicator */}
        <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold bg-teal-50 text-teal-800 border border-teal-200 rounded-lg shadow-2xs">
          <Database className="w-3.5 h-3.5 text-teal-600" />
          <span>PostgreSQL Active (Neon)</span>
          <CheckCircle2 className="w-3.5 h-3.5 text-teal-600 ml-0.5" />
        </div>

        {/* Refresh Action: Secondary Button (Light-blue background with dark-blue text) */}
        <button
          onClick={onRefresh}
          disabled={isRefreshing}
          className="btn-secondary text-xs py-1.5 px-3"
          title="Refresh live data from backend"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-blue-600' : 'text-blue-600'}`} />
          <span>Refresh</span>
        </button>

        {/* User Context & Sign Out: Neutral cancel/destructive button */}
        {onLogout && (
          <button
            onClick={onLogout}
            className="btn-cancel text-xs py-1.5 px-3 hover:text-red-600 hover:bg-red-50 hover:border-red-200"
            title={currentUser?.email ? `Sign out (${currentUser.email})` : 'Sign out'}
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Sign out</span>
          </button>
        )}
      </div>
    </header>
  );
};
