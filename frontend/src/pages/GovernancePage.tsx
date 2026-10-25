import React, { useState, useEffect } from 'react';
import { Search } from 'lucide-react';
import type { DataAsset } from '../types';
import { Badge } from '../components/ui/Badge';
import { api } from '../api/client';

interface GovernancePageProps {
  assets: DataAsset[];
}

export const GovernancePage: React.FC<GovernancePageProps> = ({ assets }) => {
  const [rulesCatalog, setRulesCatalog] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'assets' | 'policies' | 'retention'>('assets');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    async function loadRules() {
      try {
        const rules = await api.governance.getRules();
        setRulesCatalog(rules);
      } catch (err) {
        console.error('Failed to load rules catalog:', err);
      }
    }
    loadRules();
  }, []);

  const filteredAssets = assets.filter((a) =>
    a.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    a.owner.toLowerCase().includes(searchQuery.toLowerCase()) ||
    a.classification.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header & Section Navigation */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-slate-900">
            Governance & Statutory Rules Engine
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Automated security classification & tax retention rules grounded in Indian statutory law (Zero LLM Hallucination).
          </p>
        </div>

        <div className="flex items-center gap-1.5 bg-slate-100/80 p-1.5 rounded-xl border border-slate-200/60">
          <button
            onClick={() => setActiveTab('assets')}
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
              activeTab === 'assets'
                ? 'btn-primary shadow-xs'
                : 'text-slate-600 hover:text-royal-700 hover:bg-white/80'
            }`}
          >
            Governed Assets ({assets.length})
          </button>
          <button
            onClick={() => setActiveTab('policies')}
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
              activeTab === 'policies'
                ? 'btn-primary shadow-xs'
                : 'text-slate-600 hover:text-royal-700 hover:bg-white/80'
            }`}
          >
            Classification Policies
          </button>
          <button
            onClick={() => setActiveTab('retention')}
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
              activeTab === 'retention'
                ? 'btn-primary shadow-xs'
                : 'text-slate-600 hover:text-royal-700 hover:bg-white/80'
            }`}
          >
            Statutory Retention Schedules
          </button>
        </div>
      </div>

      {activeTab === 'assets' && (
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
          <div className="p-4 border-b border-slate-200 bg-slate-50/70 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <span className="text-xs font-bold text-slate-900">
              Governed Data Asset Inventory
            </span>
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
              <input
                type="text"
                placeholder="Search assets, owners, classifications..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 pr-3 py-1.5 text-xs border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 w-64"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase font-semibold text-[10px]">
                <tr>
                  <th className="py-2.5 px-4">Asset Name</th>
                  <th className="py-2.5 px-4">Type</th>
                  <th className="py-2.5 px-4">Classification</th>
                  <th className="py-2.5 px-4">Owner & Steward</th>
                  <th className="py-2.5 px-4">Retention Period</th>
                  <th className="py-2.5 px-4">Legal Grounding</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-normal">
                {filteredAssets.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-400">
                      No governed data assets registered yet.
                    </td>
                  </tr>
                ) : (
                  filteredAssets.map((asset) => (
                    <tr key={asset.assetId} className="hover:bg-slate-50/80">
                      <td className="py-3 px-4 font-semibold text-slate-900">{asset.name}</td>
                      <td className="py-3 px-4 font-mono text-[11px] text-slate-600">{asset.type}</td>
                      <td className="py-3 px-4">
                        <Badge classification={asset.classification} />
                      </td>
                      <td className="py-3 px-4 text-slate-700">
                        <p className="font-medium text-slate-900">{asset.owner}</p>
                        {asset.steward && <p className="text-[11px] text-slate-500">Steward: {asset.steward}</p>}
                      </td>
                      <td className="py-3 px-4 tabular-nums">
                        {asset.retentionDays ? (
                          <span className="font-semibold text-slate-900">
                            {asset.retentionDays.toLocaleString()} days ({Math.round(asset.retentionDays / 30)} mos)
                          </span>
                        ) : (
                          <span className="text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded text-[11px] font-medium">
                            Clinical Legal Review
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-slate-500 text-[11px]">
                        {asset.classification === 'RESTRICTED'
                          ? 'DPDP Sec 8(5) & Aadhaar Act'
                          : 'CGST Act Section 36 (Tax Invoicing)'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'policies' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {rulesCatalog?.classificationRules &&
            Object.entries(rulesCatalog.classificationRules).map(([key, rule]: [string, any]) => (
              <div key={key} className="bg-white border border-slate-200 hover:border-royal-500 rounded-2xl p-5 space-y-3 card-interactive shadow-xs">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-slate-900">{key}</span>
                  <Badge classification={rule.classification} />
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">{rule.reason}</p>
                <div className="pt-2.5 border-t border-slate-100 space-y-1.5">
                  <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Statutory Controls</p>
                  <ul className="text-xs text-slate-700 list-disc list-inside space-y-1">
                    {rule.controls?.map((c: string, idx: number) => (
                      <li key={idx} className="truncate">{c}</li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
        </div>
      )}

      {activeTab === 'retention' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {rulesCatalog?.retentionRules &&
            Object.entries(rulesCatalog.retentionRules).map(([key, rule]: [string, any]) => (
              <div key={key} className="bg-white border border-slate-200 hover:border-royal-500 rounded-2xl p-5 space-y-3 card-interactive shadow-xs">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-slate-900">{key}</span>
                  <span className="text-xs font-bold text-royal-700 bg-blue-50 border border-blue-200 px-3 py-1 rounded-lg">
                    {rule.retentionMonths ? `${rule.retentionMonths} Months` : 'RECORD SPECIFIC'}
                  </span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">{rule.description}</p>
                <div className="pt-2.5 border-t border-slate-100 space-y-1.5">
                  <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Statutory Mandate</p>
                  <p className="text-xs font-semibold text-slate-800">{rule.statutoryLaw?.join(', ')}</p>
                  <p className="text-[11px] text-slate-500">Trigger: {rule.triggerEvent}</p>
                </div>
              </div>
            ))}
        </div>
      )}
    </div>
  );
};
