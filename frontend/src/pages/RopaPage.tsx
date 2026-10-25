import React, { useState, useEffect, useMemo } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  Handle,
  Position,
  type Node,
  type Edge,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import {
  Network,
  Table as TableIcon,
  Plus,
  X,
  Database,
  ShieldCheck,
  Clock,
  Sparkles,
} from 'lucide-react';
import type { ProcessingActivity, RopaGraphData, DataSource } from '../types';
import { Badge } from '../components/ui/Badge';
import { api } from '../api/client';

interface RopaPageProps {
  activities: ProcessingActivity[];
  onActivityCreated: () => void;
}

// Custom React Flow Node Component with Left/Right Connection Handles
const CustomNode = ({ data }: { data: any }) => {
  const isActivity = data.type === 'activityNode' || data.level === 'ACTIVITY';
  const isSource = data.type === 'dataSourceNode';
  const isElement = data.type === 'dataElementNode';
  const isSystem = data.type === 'systemNode';
  const isRecipient = data.type === 'recipientNode';

  let borderClass = 'border-slate-300 bg-white text-slate-800';
  let badgeClass = 'bg-slate-100 text-slate-700';

  if (isActivity) {
    borderClass = 'border-blue-500 bg-blue-50/60 text-blue-950 shadow-md ring-1 ring-blue-500/20';
    badgeClass = 'bg-blue-600 text-white';
  } else if (isSource) {
    borderClass = 'border-[#b2d9e3] bg-[#f0f7f9] text-[#0e3d48] shadow-sm';
    badgeClass = 'bg-[#1b6c80] text-white';
  } else if (isElement) {
    borderClass = 'border-amber-400 bg-amber-50/50 text-amber-950 shadow-xs';
    badgeClass = 'bg-amber-600 text-white';
  } else if (isSystem) {
    borderClass = 'border-emerald-400 bg-emerald-50/50 text-emerald-950 shadow-xs';
    badgeClass = 'bg-emerald-600 text-white';
  } else if (isRecipient) {
    borderClass = 'border-rose-400 bg-rose-50/50 text-rose-950 shadow-xs';
    badgeClass = 'bg-rose-600 text-white';
  }

  return (
    <div
      className={`px-3.5 py-2.5 rounded-lg border ${borderClass} min-w-[200px] max-w-[280px] text-xs relative transition-all duration-150 ${
        data.dsrAlert?.hasPending ? '!border-amber-400 !ring-2 !ring-amber-300/80 shadow-md' : ''
      }`}
    >
      {/* Glowing Yellow Star Alert Indicator at Top-Right */}
      {data.dsrAlert?.hasPending && (
        <div className="absolute -top-3 -right-2 z-20 flex items-center gap-1 bg-amber-400 text-amber-950 font-extrabold px-2 py-0.5 rounded-full shadow-md border-2 border-white text-[10px] animate-pulse">
          <span>⭐</span>
          <span className="tracking-tight">
            {data.dsrAlert.primaryType === 'CORRECTION'
              ? 'CORRECTION'
              : data.dsrAlert.primaryType === 'ERASURE'
              ? 'ERASURE'
              : 'DSR ACTION'}
          </span>
        </div>
      )}

      <Handle
        type="target"
        position={Position.Left}
        className="!w-2.5 !h-2.5 !bg-blue-500 !border-2 !border-white !-left-1.5"
      />

      <div className="flex items-center justify-between gap-1 mb-1.5">
        <span className={`text-[9px] px-2 py-0.5 rounded font-bold uppercase tracking-wider ${badgeClass}`}>
          {isActivity
            ? 'ROPA ACTIVITY'
            : isSource
            ? 'DATA SOURCE'
            : isElement
            ? 'PII ELEMENT'
            : isSystem
            ? 'STORAGE / FLOW'
            : isRecipient
            ? 'RECIPIENT'
            : 'NODE'}
        </span>
        {data.legalBasis && (
          <span className="text-[9px] font-mono text-slate-600 bg-slate-100 px-1 py-0.2 rounded">
            {data.legalBasis}
          </span>
        )}
      </div>

      <p className="font-bold text-xs text-slate-900 leading-snug line-clamp-2">{data.label}</p>

      {/* Purpose for Activity Node */}
      {isActivity && data.purpose && (
        <div className="mt-1.5 text-[11px] text-blue-900/90 bg-blue-100/60 p-1.5 rounded border border-blue-200/50">
          <span className="font-semibold block text-[10px] text-blue-800">
            Purpose:
          </span>
          <p className="line-clamp-2 leading-tight">{data.purpose}</p>
        </div>
      )}

      {/* Linked Data Source info */}
      {isActivity && data.sourceName && (
        <div className="mt-1 text-[10px] text-slate-600 flex items-center gap-1 font-medium">
          <Database className="w-3 h-3 text-[#1b6c80] shrink-0" />
          <span className="truncate">Source: {data.sourceName}</span>
        </div>
      )}

      {/* DPDP Retention Schedule */}
      {isActivity && data.retentionMonths && (
        <div className="mt-1.5 pt-1.5 border-t border-blue-200/50 flex items-center justify-between text-[10px]">
          <span className="flex items-center gap-1 text-slate-600 font-medium">
            <Clock className="w-3 h-3 text-amber-600" />
            Retention:
          </span>
          <span className="font-bold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
            {data.retentionMonths} Months
          </span>
        </div>
      )}

      {/* DSR Action Alert Details */}
      {data.dsrAlert?.hasPending && (
        <div className="mt-2 p-1.5 bg-amber-100/90 border border-amber-300 rounded text-[10px] text-amber-950">
          <div className="flex items-center justify-between font-bold text-amber-900">
            <span>⭐ Action Required</span>
            <span className="text-[9px] uppercase tracking-wider bg-amber-200 px-1 py-0.2 rounded font-mono">
              {data.dsrAlert.primaryType}
            </span>
          </div>
          {data.dsrAlert.requests?.[0]?.field && (
            <p className="mt-0.5 text-[9px] text-amber-900 font-medium truncate">
              User requested: <strong>{data.dsrAlert.requests[0].field}</strong> → {data.dsrAlert.requests[0].value}
            </p>
          )}
        </div>
      )}

      {/* Discovered Element details */}
      {isElement && (
        <div className="mt-1 text-[10px] text-slate-500">
          <span>Subjects: {data.dataSubjects || 'Customers / Patients'}</span>
          {data.volume && <p className="text-[9px] text-amber-700 font-medium">{data.volume}</p>}
        </div>
      )}

      {/* Data Source details */}
      {isSource && (
        <div className="mt-1 text-[10px] text-slate-500 flex items-center justify-between">
          <span>Type: {data.sourceType || 'FILE'}</span>
          {data.findingsCount !== undefined && (
            <span className="font-semibold text-[#0e3d48] bg-[#d9edf2] px-1 py-0.2 rounded">
              {data.findingsCount} PII findings
            </span>
          )}
        </div>
      )}

      <Handle
        type="source"
        position={Position.Right}
        className="!w-2.5 !h-2.5 !bg-blue-500 !border-2 !border-white !-right-1.5"
      />
    </div>
  );
};

const nodeTypes = {
  dataSourceNode: CustomNode,
  activityNode: CustomNode,
  dataElementNode: CustomNode,
  systemNode: CustomNode,
  recipientNode: CustomNode,
  default: CustomNode,
};

export const RopaPage: React.FC<RopaPageProps> = ({ activities, onActivityCreated }) => {
  const [activeView, setActiveView] = useState<'graph' | 'table'>('graph');
  const [graphData, setGraphData] = useState<RopaGraphData | null>(null);
  const [loadingGraph, setLoadingGraph] = useState<boolean>(true);

  // Available Data Sources for linking
  const [dataSources, setDataSources] = useState<DataSource[]>([]);

  // Modal State for Registering Activity
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [actName, setActName] = useState('');
  const [bizFunc, setBizFunc] = useState('Diagnostic Lab Testing');
  const [purpose, setPurpose] = useState('Patient Consultation & Diagnostic Lab Report Dispatch');
  const [sourceId, setSourceId] = useState<string>('');
  const [legalBasis, setLegalBasis] = useState<
    'CONSENT' | 'STATUTORY_OBLIGATION' | 'LEGITIMATE_USE' | 'CONTRACTUAL'
  >('CONSENT');
  const [customRetentionMonths, setCustomRetentionMonths] = useState<number | ''>('');
  const [submitting, setSubmitting] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

  // DPDP Retention Recommendation State
  const [recommendation, setRecommendation] = useState<{
    retentionPeriodMonths: number;
    triggerEvent: string;
    statutoryReference: string;
    description: string;
    detectedPiiCategories?: string[];
  } | null>(null);
  const [loadingRecommendation, setLoadingRecommendation] = useState(false);

  // Load Data Sources for dropdown
  useEffect(() => {
    api.discovery
      .getSources()
      .then((sources) => {
        setDataSources(sources);
        if (sources.length > 0 && !sourceId) {
          setSourceId(sources[0].sourceId);
        }
      })
      .catch((err) => console.error('Failed to load data sources:', err));
  }, []);

  // Recalculate DPDP retention whenever sourceId, bizFunc, or purpose changes
  useEffect(() => {
    if (!isModalOpen) return;

    const timer = setTimeout(() => {
      setLoadingRecommendation(true);
      api.mapping
        .getRetentionRecommendation({
          sourceId: sourceId || undefined,
          businessFunction: bizFunc,
          purpose,
        })
        .then((res) => {
          setRecommendation(res);
          if (customRetentionMonths === '') {
            setCustomRetentionMonths(res.retentionPeriodMonths);
          }
        })
        .catch((err) => {
          console.error('Failed to compute retention recommendation:', err);
        })
        .finally(() => {
          setLoadingRecommendation(false);
        });
    }, 300);

    return () => clearTimeout(timer);
  }, [sourceId, bizFunc, purpose, isModalOpen]);

  // Load Graph Data from GET /api/v1/mapping/graph
  const fetchGraph = async () => {
    setLoadingGraph(true);
    try {
      const data = await api.mapping.getGraph();
      setGraphData(data);
    } catch (err) {
      console.error('Failed to load RoPA graph:', err);
    } finally {
      setLoadingGraph(false);
    }
  };

  useEffect(() => {
    fetchGraph();
  }, [activities.length]);

  const handleCreateActivity = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!actName.trim()) return;
    setSubmitting(true);
    setModalError(null);
    try {
      await api.mapping.createActivity({
        name: actName.trim(),
        businessFunction: bizFunc.trim(),
        purpose: purpose.trim(),
        legalBasis,
        sourceId: sourceId || undefined,
        retentionMonths:
          typeof customRetentionMonths === 'number'
            ? customRetentionMonths
            : recommendation?.retentionPeriodMonths,
        triggerEvent: recommendation?.triggerEvent,
      });

      setActName('');
      setPurpose('Patient Consultation & Diagnostic Lab Report Dispatch');
      setIsModalOpen(false);
      onActivityCreated();
      fetchGraph();
    } catch (err: any) {
      setModalError(err.response?.data?.error?.message || 'Failed to register activity');
    } finally {
      setSubmitting(false);
    }
  };

  // Transform graph data for React Flow
  const flowNodes: Node[] = useMemo(() => {
    if (!graphData) return [];
    return graphData.nodes.map((n) => ({
      id: n.id,
      type: n.type || 'default',
      position: n.position || { x: 100, y: 100 },
      data: {
        ...n.data,
        type: n.type,
      },
    }));
  }, [graphData]);

  const flowEdges: Edge[] = useMemo(() => {
    if (!graphData) return [];
    return graphData.edges.map((e) => ({
      id: e.id,
      source: e.source,
      target: e.target,
      label: e.label,
      animated: e.animated ?? true,
      style: (e as any).style || { stroke: '#64748b', strokeWidth: 1.5 },
    }));
  }, [graphData]);

  const [nodes, setNodes, onNodesChange] = useNodesState(flowNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(flowEdges);

  useEffect(() => {
    setNodes(flowNodes);
    setEdges(flowEdges);
  }, [flowNodes, flowEdges]);

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* View Switcher Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white border border-slate-200 rounded-lg p-4 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              Record of Processing Activities (RoPA) & Data Lineage
            </h2>
            <span className="text-[10px] bg-blue-100 text-blue-800 font-bold px-2 py-0.5 rounded-full border border-blue-200">
              DPDP Act 2023 Sec 8
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Structured register answering what personal data you hold, which data source it comes from, what purpose it is used for, and statutory retention schedule.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Register Button */}
          <button
            onClick={() => {
              setIsModalOpen(true);
              if (recommendation) {
                setCustomRetentionMonths(recommendation.retentionPeriodMonths);
              }
            }}
            className="btn-primary px-4 py-2 rounded-xl text-xs font-bold shadow-sm flex items-center gap-2 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Register Processing Activity</span>
          </button>

          {/* View Toggle */}
          <div className="flex items-center gap-1.5 bg-slate-100/80 p-1.5 rounded-xl border border-slate-200/60">
            <button
              onClick={() => setActiveView('graph')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                activeView === 'graph'
                  ? 'btn-primary shadow-xs'
                  : 'text-slate-600 hover:text-royal-700 hover:bg-white/80'
              }`}
            >
              <Network className="w-3.5 h-3.5 text-current" />
              <span>Relationship Graph</span>
            </button>
            <button
              onClick={() => setActiveView('table')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                activeView === 'table'
                  ? 'btn-primary shadow-xs'
                  : 'text-slate-600 hover:text-royal-700 hover:bg-white/80'
              }`}
            >
              <TableIcon className="w-3.5 h-3.5 text-current" />
              <span>RoPA Register ({activities.length})</span>
            </button>
          </div>
        </div>
      </div>

      {/* Modal Dialog for Registering RoPA Activity */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white border border-slate-200 rounded-xl max-w-lg w-full p-6 shadow-2xl space-y-4 my-8">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-blue-600" />
                <h3 className="text-sm font-bold text-slate-900">
                  Register RoPA Processing Activity
                </h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {modalError && (
              <div className="p-2.5 bg-rose-50 border border-rose-200 rounded text-xs text-rose-700">
                {modalError}
              </div>
            )}

            <form onSubmit={handleCreateActivity} className="space-y-3.5 text-xs">
              {/* Activity Name */}
              <div>
                <label className="block font-semibold text-slate-800 mb-1">
                  Processing Activity Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Patient Consultation & Lab Report Dispatch"
                  value={actName}
                  onChange={(e) => setActName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 font-medium"
                />
              </div>

              {/* Purpose */}
              <div>
                <label className="block font-semibold text-slate-800 mb-1">
                  Specific Processing Purpose *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Diagnostic pathology analysis, patient report generation, and SMS alerts"
                  value={purpose}
                  onChange={(e) => setPurpose(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 font-medium"
                />
                <p className="text-[11px] text-slate-500 mt-0.5">
                  DPDP Act Sec 8(7) requires erasing personal data once this specific purpose is fulfilled.
                </p>
              </div>

              {/* Link Data Source */}
              <div>
                <label className="block font-semibold text-slate-800 mb-1 flex items-center justify-between">
                  <span>Linked Data Source</span>
                  <span className="text-[10px] text-blue-600 font-normal">
                    Auto-imports scanned PII categories
                  </span>
                </label>
                <select
                  value={sourceId}
                  onChange={(e) => {
                    setSourceId(e.target.value);
                  }}
                  className="w-full px-3 py-2 border border-slate-300 rounded focus:outline-none bg-white font-medium text-slate-800"
                >
                  <option value="">-- No Source Linked (Manual Elements) --</option>
                  {dataSources.map((src) => (
                    <option key={src.sourceId} value={src.sourceId}>
                      {src.name} ({src.sourceType})
                    </option>
                  ))}
                </select>
              </div>

              {/* Business Function & Legal Basis */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-800 mb-1">
                    Business Function
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Diagnostic Operations"
                    value={bizFunc}
                    onChange={(e) => setBizFunc(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 font-medium"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-800 mb-1">
                    Statutory Legal Basis
                  </label>
                  <select
                    value={legalBasis}
                    onChange={(e) => setLegalBasis(e.target.value as any)}
                    className="w-full px-3 py-2 border border-slate-300 rounded focus:outline-none bg-white font-medium"
                  >
                    <option value="CONSENT">DPDP Act Sec 6 (Affirmative Consent)</option>
                    <option value="STATUTORY_OBLIGATION">Statutory Obligation (Tax / CGST / NMC)</option>
                    <option value="LEGITIMATE_USE">Sec 7 Legitimate Use (Medical Emergency)</option>
                    <option value="CONTRACTUAL">Contractual Obligation</option>
                  </select>
                </div>
              </div>

              {/* DPDP Retention Recommendation Card */}
              <div className="p-3 bg-[#fffbeb] border border-[#fde68a] rounded-md space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-amber-900 font-bold text-xs">
                    <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                    <span>DPDP Act Statutory Retention Schedule</span>
                  </div>
                  {loadingRecommendation && (
                    <span className="text-[10px] text-amber-600 animate-pulse font-medium">
                      Computing...
                    </span>
                  )}
                </div>

                {recommendation && (
                  <div className="space-y-1.5 text-[11px] text-amber-950">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-600 font-medium">Recommended Duration:</span>
                      <span className="font-bold text-amber-900 bg-amber-100 px-2 py-0.5 rounded text-xs border border-amber-300">
                        {recommendation.retentionPeriodMonths} Months (
                        {Math.round(recommendation.retentionPeriodMonths / 12)} Years)
                      </span>
                    </div>

                    <div className="text-[10px] text-slate-600">
                      <span className="font-semibold text-slate-700">Trigger: </span>
                      <code className="bg-white/80 px-1 py-0.2 rounded border border-amber-200 font-mono text-[9px]">
                        {recommendation.triggerEvent}
                      </code>
                    </div>

                    <div className="text-[10px] text-slate-600">
                      <span className="font-semibold text-slate-700">Statutory Citation: </span>
                      <span>{recommendation.statutoryReference}</span>
                    </div>

                    {recommendation.detectedPiiCategories &&
                      recommendation.detectedPiiCategories.length > 0 && (
                        <div className="flex flex-wrap items-center gap-1 pt-1">
                          <span className="text-[9px] text-slate-500 font-semibold uppercase">
                            Detected PII:
                          </span>
                          {recommendation.detectedPiiCategories.map((c, i) => (
                            <span
                              key={i}
                              className="text-[9px] bg-white border border-amber-200 text-amber-800 px-1.5 py-0.2 rounded font-medium"
                            >
                              {c}
                            </span>
                          ))}
                        </div>
                      )}
                  </div>
                )}

                {/* Duration Override */}
                <div className="pt-2 border-t border-amber-200/60 flex items-center justify-between gap-3">
                  <label className="text-[11px] font-semibold text-slate-700">
                    Retention Period (Months):
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="120"
                    value={customRetentionMonths}
                    onChange={(e) =>
                      setCustomRetentionMonths(
                        e.target.value === '' ? '' : parseInt(e.target.value, 10)
                      )
                    }
                    className="w-24 px-2.5 py-1 border border-amber-300 rounded bg-white text-right font-bold text-xs focus:ring-1 focus:ring-amber-500"
                  />
                </div>
              </div>

              {/* Buttons */}
              <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="btn-cancel px-3.5 py-2 rounded-xl text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="btn-primary px-4 py-2 rounded-xl text-xs font-bold shadow-sm cursor-pointer"
                >
                  {submitting ? 'Registering...' : 'Save to RoPA Ledger'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {activeView === 'graph' ? (
        /* React Flow Graph View */
        <div className="bg-white border border-slate-200 rounded-lg overflow-hidden shadow-xs">
          <div className="p-3 border-b border-slate-200 bg-slate-50/70 flex flex-wrap items-center justify-between gap-2 text-xs">
            <span className="font-semibold text-slate-700 flex items-center gap-1.5">
              <Network className="w-4 h-4 text-blue-600" />
              Interactive Data Lineage & Flow Architecture
            </span>
            <div className="flex items-center gap-3 text-[11px] text-slate-600">
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded bg-[#1b6c80]" /> Data Source
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded bg-amber-500" /> Discovered PII Element
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded bg-blue-600" /> Processing Activity
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded bg-emerald-500" /> Storage Flow
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded bg-rose-500" /> 3rd Party Recipient
              </span>
            </div>
          </div>

          <div className="h-[620px] w-full bg-slate-50/40 relative">
            {loadingGraph ? (
              <div className="absolute inset-0 flex items-center justify-center text-xs text-slate-500 bg-white/60">
                Generating RoPA relationship graph from live database...
              </div>
            ) : nodes.length === 0 ? (
              <div className="absolute inset-0 flex items-center justify-center text-xs text-slate-500">
                No processing activities created yet. Click "Register Processing Activity" to populate the graph.
              </div>
            ) : (
              <ReactFlow
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                nodeTypes={nodeTypes}
                fitView
                fitViewOptions={{ padding: 0.2 }}
                minZoom={0.2}
                maxZoom={1.5}
              >
                <Background color="#cbd5e1" gap={16} size={1} />
                <Controls className="bg-white border border-slate-200 rounded shadow-xs" />
                <MiniMap
                  nodeColor={(node) => {
                    if (node.type === 'dataSourceNode') return '#1b6c80';
                    if (node.type === 'activityNode') return '#3b82f6';
                    if (node.type === 'dataElementNode') return '#f59e0b';
                    if (node.type === 'recipientNode') return '#f43f5e';
                    return '#94a3b8';
                  }}
                  className="bg-white border border-slate-200 rounded"
                />
              </ReactFlow>
            )}
          </div>
        </div>
      ) : (
        /* RoPA Table View */
        <div className="bg-white border border-slate-200 rounded-lg overflow-hidden shadow-xs">
          <div className="p-3.5 border-b border-slate-200 bg-slate-50/70 flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-900">
              Statutory Record of Processing Activities Register
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase font-semibold text-[10px]">
                <tr>
                  <th className="py-2.5 px-4">Activity Name</th>
                  <th className="py-2.5 px-4">Processing Purpose</th>
                  <th className="py-2.5 px-4">Linked Data Source</th>
                  <th className="py-2.5 px-4">Legal Basis</th>
                  <th className="py-2.5 px-4">Discovered Data Elements</th>
                  <th className="py-2.5 px-4">DPDP Retention Schedule</th>
                  <th className="py-2.5 px-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-normal">
                {activities.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-400">
                      No activities registered yet. Click "Register Processing Activity" above to create one.
                    </td>
                  </tr>
                ) : (
                  activities.map((act) => {
                    const retentionPolicy = act.retentionPolicies?.[0];
                    const retentionMonths =
                      retentionPolicy?.retentionPeriodMonths ||
                      (act.retentionDays ? Math.round(act.retentionDays / 30) : null);

                    return (
                      <tr key={act.activityId} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3 px-4 font-semibold text-slate-900 max-w-xs">
                          {act.name}
                          <div className="text-[10px] text-slate-500 font-normal mt-0.5">
                            {act.businessFunction}
                          </div>
                        </td>

                        <td className="py-3 px-4 text-slate-700 max-w-xs leading-relaxed">
                          {act.purpose || (
                            <span className="text-slate-400 italic">General Business Purpose</span>
                          )}
                        </td>

                        <td className="py-3 px-4">
                          {act.source ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-[#f0f7f9] border border-[#b2d9e3] text-[#0e3d48] font-medium text-[11px]">
                              <Database className="w-3 h-3 text-[#1b6c80]" />
                              {act.source.name}
                            </span>
                          ) : (
                            <span className="text-slate-400 italic text-[11px]">Unlinked</span>
                          )}
                        </td>

                        <td className="py-3 px-4">
                          <span className="px-2 py-0.5 font-mono text-[11px] bg-slate-100 text-slate-800 rounded font-medium">
                            {act.legalBasis}
                          </span>
                        </td>

                        <td className="py-3 px-4">
                          <div className="flex flex-wrap gap-1 max-w-sm">
                            {act.dataElements && act.dataElements.length > 0 ? (
                              act.dataElements.map((elem) => (
                                <span
                                  key={elem.elementId}
                                  className="px-1.5 py-0.5 bg-blue-50 border border-blue-200 text-blue-800 rounded text-[10px] font-medium"
                                >
                                  {elem.piiCategory}
                                </span>
                              ))
                            ) : (
                              <span className="text-slate-400 italic text-[11px]">
                                No elements mapped
                              </span>
                            )}
                          </div>
                        </td>

                        <td className="py-3 px-4">
                          {retentionMonths ? (
                            <div>
                              <span className="font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 text-[11px]">
                                {retentionMonths} Months
                              </span>
                              {retentionPolicy?.triggerEvent && (
                                <div className="text-[9px] text-slate-500 mt-0.5 font-mono">
                                  {retentionPolicy.triggerEvent}
                                </div>
                              )}
                            </div>
                          ) : (
                            <span className="text-slate-400 italic text-[11px]">Standard (24 mo)</span>
                          )}
                        </td>

                        <td className="py-3 px-4">
                          <Badge status={act.status} size="sm" />
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
