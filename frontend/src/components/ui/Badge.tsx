import React from 'react';
import { ShieldAlert, Lock, Building2, Globe, AlertTriangle, AlertCircle, Info } from 'lucide-react';
import type { Classification } from '../../types';

interface BadgeProps {
  classification?: Classification;
  severity?: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  status?: string;
  variant?: 'success' | 'warning' | 'danger' | 'neutral' | string;
  label?: React.ReactNode;
  size?: 'sm' | 'md';
  children?: React.ReactNode;
}

export const Badge: React.FC<BadgeProps> = ({
  classification,
  severity,
  status,
  variant,
  label,
  size = 'md',
  children,
}) => {
  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs';

  if (classification) {
    switch (classification) {
      case 'RESTRICTED':
        return (
          <span className={`inline-flex items-center gap-1.5 font-semibold text-rose-800 bg-rose-50 border border-rose-200 rounded ${sizeClasses}`}>
            <ShieldAlert className="w-3.5 h-3.5 text-rose-700" />
            RESTRICTED
          </span>
        );
      case 'CONFIDENTIAL':
        return (
          <span className={`inline-flex items-center gap-1.5 font-semibold text-amber-800 bg-amber-50 border border-amber-200 rounded ${sizeClasses}`}>
            <Lock className="w-3.5 h-3.5 text-amber-700" />
            CONFIDENTIAL
          </span>
        );
      case 'INTERNAL':
        return (
          <span className={`inline-flex items-center gap-1.5 font-medium text-slate-700 bg-slate-100 border border-slate-300 rounded ${sizeClasses}`}>
            <Building2 className="w-3.5 h-3.5 text-slate-600" />
            INTERNAL
          </span>
        );
      case 'PUBLIC':
        return (
          <span className={`inline-flex items-center gap-1.5 font-medium text-emerald-800 bg-emerald-50 border border-emerald-200 rounded ${sizeClasses}`}>
            <Globe className="w-3.5 h-3.5 text-emerald-600" />
            PUBLIC
          </span>
        );
    }
  }

  if (severity) {
    switch (severity) {
      case 'CRITICAL':
        return (
          <span className={`inline-flex items-center gap-1 font-semibold text-rose-700 bg-rose-50 border border-rose-200 rounded ${sizeClasses}`}>
            <AlertCircle className="w-3 h-3 text-rose-600" />
            CRITICAL
          </span>
        );
      case 'HIGH':
        return (
          <span className={`inline-flex items-center gap-1 font-medium text-orange-800 bg-orange-50 border border-orange-200 rounded ${sizeClasses}`}>
            <AlertTriangle className="w-3 h-3 text-orange-600" />
            HIGH
          </span>
        );
      case 'MEDIUM':
        return (
          <span className={`inline-flex items-center gap-1 font-medium text-amber-800 bg-amber-50 border border-amber-200 rounded ${sizeClasses}`}>
            <AlertTriangle className="w-3 h-3 text-amber-600" />
            MEDIUM
          </span>
        );
      case 'LOW':
        return (
          <span className={`inline-flex items-center gap-1 font-medium text-slate-700 bg-slate-50 border border-slate-200 rounded ${sizeClasses}`}>
            <Info className="w-3 h-3 text-slate-500" />
            LOW
          </span>
        );
    }
  }

  if (status || variant) {
    const isSuccess = variant === 'success' || (status ? ['GIVEN', 'ACTIVE', 'RESOLVED', 'VERIFIED'].includes(status) : false);
    const isWarning = variant === 'warning' || (status ? ['WITHDRAWN', 'QUEUED', 'OPEN', 'IN_REVIEW'].includes(status) : false);
    const isDanger = variant === 'danger';
    const colorClasses = isSuccess
      ? 'text-emerald-700 bg-emerald-50 border-emerald-200'
      : isWarning
      ? 'text-amber-800 bg-amber-50 border-amber-200'
      : isDanger
      ? 'text-rose-700 bg-rose-50 border-rose-200'
      : 'text-slate-700 bg-slate-100 border-slate-200';

    return (
      <span className={`inline-flex items-center font-medium border rounded ${colorClasses} ${sizeClasses}`}>
        {children ?? label ?? status}
      </span>
    );
  }

  return (
    <span className={`inline-flex items-center font-medium bg-slate-100 text-slate-800 border border-slate-200 rounded ${sizeClasses}`}>
      {children ?? label}
    </span>
  );
};
