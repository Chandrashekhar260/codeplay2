import React from 'react';
import {
  ShieldCheck,
  LayoutDashboard,
  FileSearch,
  Network,
  Scale,
  FileCheck2,
  ScrollText,
  Building2,
  UserCheck,
  ExternalLink,
  Cookie,
  LogOut,
} from 'lucide-react';
import type { User } from '../../types';

export type NavTab = 'dashboard' | 'discovery' | 'ropa' | 'governance' | 'consent' | 'cookies' | 'dsr' | 'audit';

interface SidebarProps {
  currentTab: NavTab;
  onTabChange: (tab: NavTab) => void;
  tenantName: string;
  pendingDsrCount?: number;
  onLaunchPortal?: () => void;
  currentUser?: User | null;
  onLogout?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onTabChange,
  tenantName,
  pendingDsrCount = 0,
  onLaunchPortal,
  currentUser,
  onLogout,
}) => {
  const navItems = [
    { id: 'dashboard', label: 'Executive Overview', icon: LayoutDashboard },
    { id: 'discovery', label: 'Data Discovery & Scanner', icon: FileSearch },
    { id: 'ropa', label: 'RoPA & Data Flow Graph', icon: Network },
    { id: 'governance', label: 'Governance & Retention', icon: Scale },
    { id: 'consent', label: 'Consent & Notices', icon: FileCheck2 },
    { id: 'cookies', label: 'Cookie & Web Scanner', icon: Cookie },
    { id: 'dsr', label: 'Data Rights (DSR)', icon: UserCheck, badge: pendingDsrCount },
    { id: 'audit', label: 'Immutable Audit Trail', icon: ScrollText },
  ] as const;

  return (
    <aside className="w-64 bg-[#0f172a] border-r border-slate-800 flex flex-col shrink-0 select-none text-slate-200">
      {/* Brand Header */}
      <div className="h-14 flex items-center px-4 border-b border-slate-800 gap-3">
        <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow-md shadow-blue-600/30 shrink-0">
          <ShieldCheck className="w-5 h-5 text-white" />
        </div>
        <div className="flex flex-col min-w-0">
          <span className="text-sm font-bold text-white tracking-tight leading-tight">DataSentinel</span>
          <span className="text-[11px] text-teal-400 font-medium truncate">DPDP Compliance Engine</span>
        </div>
      </div>

      {/* Workspace Context */}
      <div className="p-3 border-b border-slate-800">
        <div className="bg-slate-800/70 rounded-lg p-2.5 flex items-center gap-2.5 border border-slate-700/60 shadow-xs">
          <Building2 className="w-4 h-4 text-blue-400 shrink-0" />
          <div className="min-w-0 flex-1">
            <p className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Tenant Workspace</p>
            <p className="text-xs font-semibold text-white truncate">{tenantName}</p>
          </div>
        </div>
      </div>

      {/* Navigation List */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        <p className="px-2 pb-2 text-[10px] uppercase font-bold tracking-wider text-slate-400">Compliance Modules</p>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;
          const badgeCount = (item as any).badge;

          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2 text-xs rounded-lg transition-all duration-150 text-left cursor-pointer group ${
                isActive
                  ? 'bg-blue-600 text-white font-semibold shadow-sm shadow-blue-600/30 -translate-y-0.5'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/80 hover:translate-x-0.5'
              }`}
            >
              <Icon className={`w-4 h-4 shrink-0 transition-transform duration-150 ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-blue-400 group-hover:scale-110'}`} />
              <span className="flex-1 truncate">{item.label}</span>
              {badgeCount > 0 && (
                <span className="px-1.5 py-0.5 bg-amber-400 text-slate-950 font-bold text-[10px] tabular-nums rounded-full shadow-xs">
                  {badgeCount}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Citizen Privacy Portal Callout */}
      {onLaunchPortal && (
        <div className="p-3 border-t border-slate-800">
          <button
            onClick={onLaunchPortal}
            className="w-full flex items-center justify-between p-2.5 rounded-lg bg-slate-800/90 hover:bg-slate-700/90 border border-slate-700 hover:border-teal-500/50 text-white text-xs transition-all duration-150 cursor-pointer shadow-sm hover:-translate-y-0.5 group"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-6 h-6 rounded-md bg-teal-500/20 text-teal-400 flex items-center justify-center shrink-0">
                <ShieldCheck className="w-3.5 h-3.5 group-hover:scale-110 transition-transform duration-150" />
              </div>
              <div className="text-left min-w-0">
                <span className="block text-[11px] font-semibold text-white group-hover:text-teal-300 transition-colors truncate">Citizen Privacy Portal</span>
                <span className="text-[10px] text-slate-400 font-normal truncate">Self-Service DPDP Rights</span>
              </div>
            </div>
            <ExternalLink className="w-3.5 h-3.5 text-slate-400 group-hover:text-teal-400 group-hover:translate-x-0.5 transition-all shrink-0" />
          </button>
        </div>
      )}

      {/* Footer User Profile & Logout */}
      <div className="p-3.5 border-t border-slate-800 bg-[#0a0f1d] space-y-2.5">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center text-xs font-bold shrink-0 shadow-xs">
            {currentUser?.firstName ? currentUser.firstName.charAt(0).toUpperCase() : 'A'}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold text-white truncate">
              {currentUser?.firstName
                ? `${currentUser.firstName} ${currentUser.lastName || ''}`.trim()
                : 'Workspace Admin'}
            </p>
            <p className="text-[10px] text-slate-400 truncate">
              {currentUser?.email || 'Logged in user'}
            </p>
          </div>
          <span className="w-2.5 h-2.5 rounded-full bg-teal-400 shadow-xs shadow-teal-400/50 shrink-0" title="Active session" />
        </div>

        {onLogout && (
          <button
            type="button"
            onClick={onLogout}
            className="w-full flex items-center justify-center gap-1.5 py-1.5 px-3 bg-slate-800 hover:bg-red-500/20 text-slate-300 hover:text-red-400 border border-slate-700 hover:border-red-500/40 rounded-lg text-xs font-medium transition-all duration-150 hover:-translate-y-0.5 active:translate-y-0 cursor-pointer"
            title="Log out of current workspace"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign out</span>
          </button>
        )}
      </div>
    </aside>
  );
};
