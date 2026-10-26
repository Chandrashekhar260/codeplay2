import React, { useState } from 'react';
import {
  UploadCloud,
  FileSpreadsheet,
  AlertTriangle,
  CheckCircle2,
} from 'lucide-react';
import type { DataSource, ScanFinding, RemediationFlag } from '../types';
import { Badge } from '../components/ui/Badge';
import { api } from '../api/client';

interface DiscoveryPageProps {
  sources: DataSource[];
  onFileUploaded: () => void;
}

export const DiscoveryPage: React.FC<DiscoveryPageProps> = ({ sources, onFileUploaded }) => {
  const [selectedSourceId, setSelectedSourceId] = useState<string>(sources[0]?.sourceId || '');
  const [findings, setFindings] = useState<ScanFinding[]>([]);
  const [flags, setFlags] = useState<RemediationFlag[]>([]);
  const [loadingDetails, setLoadingDetails] = useState<boolean>(false);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);

  // Load findings and flags when a source is selected
  const handleSelectSource = async (sourceId: string) => {
    setSelectedSourceId(sourceId);
    setLoadingDetails(true);
    try {
      const [fData, flData] = await Promise.all([
        api.discovery.getFindings(sourceId),
        api.discovery.getFlags(sourceId),
      ]);
      setFindings(fData);
      setFlags(flData);
    } catch (err: any) {
      console.error('Failed to load findings:', err);
    } finally {
      setLoadingDetails(false);
    }
  };

  // Auto-load first source if available and none selected
  React.useEffect(() => {
    if (sources.length > 0 && !selectedSourceId) {
      handleSelectSource(sources[0].sourceId);
    } else if (selectedSourceId) {
      handleSelectSource(selectedSourceId);
    }
  }, [sources.length]);

  // Handle File Upload
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setUploadError(null);
    setUploadSuccess(null);

    try {
      const result = await api.discovery.uploadFile(file);
      setUploadSuccess(
        `Successfully scanned "${file.name}": Detected ${result.findings.length} PII fields & ${result.flags.length} risk flags.`
      );
      onFileUploaded();
      if (result.source?.sourceId) {
        handleSelectSource(result.source.sourceId);
      }
    } catch (err: any) {
      setUploadError(err.response?.data?.error?.message || 'Upload and scanning failed.');
    } finally {
      setIsUploading(false);
    }
  };

  const selectedSource = sources.find((s) => s.sourceId === selectedSourceId);

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Upload Dropzone */}
      <div className="bg-white border border-dashed border-slate-300 rounded-lg p-6 text-center hover:border-blue-400 transition-colors">
        <div className="max-w-md mx-auto space-y-3">
          <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto">
            <UploadCloud className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-900">Upload MSME Spreadsheet, PDF, or Ledger</h3>
            <p className="text-xs text-slate-500 mt-1">
              Supports <span className="font-mono font-medium">.xlsx</span>, <span className="font-mono font-medium">.xls</span>, <span className="font-mono font-medium">.csv</span>, and <span className="font-mono font-medium">.pdf</span> documents.
              Automatically runs the Python Verhoeff Aadhaar checksum and PAN regex scanner.
            </p>
          </div>

          <label className="inline-block">
            <input
              type="file"
              accept=".csv,.xlsx,.xls,.pdf,.txt"
              onChange={handleFileUpload}
              disabled={isUploading}
              className="hidden"
            />
            <span className="btn-primary px-5 py-2.5 text-xs font-bold rounded-xl cursor-pointer shadow-sm hover:shadow inline-flex items-center gap-2">
              <UploadCloud className="w-4 h-4" />
              <span>{isUploading ? 'Scanning File via Python Engine...' : 'Select File to Scan'}</span>
            </span>
          </label>

          {uploadSuccess && (
            <p className="text-xs text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-left flex items-center gap-2 font-medium">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
              <span>{uploadSuccess}</span>
            </p>
          )}

          {uploadError && (
            <p className="text-xs text-rose-800 bg-rose-50 border border-rose-200 rounded-xl p-3 text-left flex items-center gap-2 font-medium">
              <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{uploadError}</span>
            </p>
          )}
        </div>
      </div>

      {/* Main Content Split: Sources on Left, Findings on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Source List */}
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
          <div className="p-4 border-b border-slate-200 bg-slate-50/70 flex items-center justify-between">
            <span className="text-xs font-bold text-slate-900">
              Discovered Sources ({sources.length})
            </span>
          </div>

          <div className="divide-y divide-slate-100 max-h-[500px] overflow-y-auto">
            {sources.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-500 font-medium">No data sources uploaded yet.</div>
            ) : (
              sources.map((src) => {
                const isSelected = src.sourceId === selectedSourceId;
                return (
                  <button
                    key={src.sourceId}
                    onClick={() => handleSelectSource(src.sourceId)}
                    className={`w-full text-left p-4 transition-all duration-150 flex items-start gap-3 cursor-pointer ${
                      isSelected
                        ? 'bg-blue-50/80 border-l-4 border-royal-600 text-royal-950 font-semibold'
                        : 'hover:bg-slate-50 hover:translate-x-0.5 text-slate-700'
                    }`}
                  >
                    <FileSpreadsheet className={`w-4 h-4 shrink-0 mt-0.5 ${isSelected ? 'text-royal-600' : 'text-slate-400'}`} />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold truncate">{src.name}</p>
                      <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-1">
                        <span className="font-mono text-[10px] font-medium">{src.sourceType}</span>
                        <span>•</span>
                        <Badge status={src.status} size="sm" />
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Findings and Flags View */}
        <div className="lg:col-span-2 space-y-6">
          {selectedSource ? (
            <>
              {/* Findings Table */}
              <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
                <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/70">
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">
                      Discovered PII Fields — {selectedSource.name}
                    </h4>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Identified personal data columns with mathematical checksums & regex validation.
                    </p>
                  </div>
                  <span className="text-xs font-bold px-2.5 py-1 bg-blue-50 text-royal-700 border border-blue-200 rounded-lg tabular-nums">
                    {findings.length} fields
                  </span>
                </div>

                {loadingDetails ? (
                  <div className="p-8 text-center text-xs text-slate-500 font-medium animate-pulse">Loading scan findings...</div>
                ) : findings.length === 0 ? (
                  <div className="p-8 text-center text-xs text-slate-500 font-medium">No personal data detected in this source.</div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50/90 border-b border-slate-200 text-slate-600 uppercase font-semibold text-[10px]">
                        <tr>
                          <th className="py-3 px-4">Column Name</th>
                          <th className="py-3 px-4">PII Category</th>
                          <th className="py-3 px-4">Sensitivity Level</th>
                          <th className="py-3 px-4">Validation Method</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-normal">
                        {findings.map((finding) => (
                          <tr key={finding.findingId} className="hover:bg-blue-50/40 transition-colors">
                            <td className="py-3 px-4 font-mono font-medium text-slate-900">{finding.fieldName}</td>
                            <td className="py-3 px-4">
                              <span className="px-2.5 py-1 bg-slate-100 text-slate-800 rounded-md font-semibold text-[11px] border border-slate-200/60">
                                {finding.piiCategories}
                              </span>
                            </td>
                            <td className="py-3 px-4">
                              <Badge severity={finding.sensitivityLevel} size="sm" />
                            </td>
                            <td className="py-3 px-4 text-slate-500 text-[11px]">
                              {finding.piiCategories === 'AADHAAR'
                                ? 'Verhoeff Algorithm Checksum'
                                : finding.piiCategories === 'PAN'
                                ? 'Income Tax PAN Pattern'
                                : finding.piiCategories === 'HEALTH_DATA'
                                ? 'Clinical Health Keyword Dictionary'
                                : 'Format Regex Validation'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Remediation Flags */}
              <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
                <div className="p-4 border-b border-slate-200 bg-slate-50/70 flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-900">
                    Remediation Risk Flags ({flags.length})
                  </h4>
                  <span className="text-[11px] text-slate-500">Mandatory DPDP Section 8 Safeguards</span>
                </div>

                <div className="p-4 space-y-3">
                  {flags.length === 0 ? (
                    <div className="text-xs text-slate-500">No active risk flags for this source.</div>
                  ) : (
                      flags.map((flag) => {
                        const isSection9 = flag.flagType === 'SECTION_9_CHILD_DATA_SAFEGUARD';
                        return (
                          <div
                            key={flag.flagId}
                            className={`flex items-start gap-3 p-3 border rounded text-xs ${
                              isSection9
                                ? 'bg-amber-50/70 border-amber-300'
                                : 'bg-rose-50/50 border-rose-200'
                            }`}
                          >
                            <AlertTriangle
                              className={`w-4 h-4 shrink-0 mt-0.5 ${
                                isSection9 ? 'text-amber-600' : 'text-rose-600'
                              }`}
                            />
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span
                                  className={`font-bold ${
                                    isSection9 ? 'text-amber-950' : 'text-rose-900'
                                  }`}
                                >
                                  {flag.flagType}
                                </span>
                                <Badge severity={flag.severity} size="sm" />
                                {isSection9 && (
                                  <span className="px-1.5 py-0.5 text-[9px] font-bold bg-amber-200/80 text-amber-950 rounded">
                                    DPDP §9 Fine up to ₹200 Cr
                                  </span>
                                )}
                              </div>
                              <p className="text-slate-700 text-[11px] mt-1">
                                {isSection9
                                  ? 'Section 9 Children Personal Data detected. Verifiable Parental Consent (VPC) mandatory prior to processing. Absolute statutory prohibition on behavioral tracking, profiling, or targeted advertising directed at children.'
                                  : flag.flagType === 'UNENCRYPTED_CRITICAL_PII'
                                  ? 'Aadhaar or Medical diagnostic data found in plaintext spreadsheet. Must be encrypted at rest.'
                                  : flag.flagType === 'UNPROTECTED_CONTACT_IDENTIFIER'
                                  ? 'Customer contact coordinates exposed without masking or role-based access restrictions.'
                                  : 'Personal data present requiring governance and access controls.'}
                              </p>
                            </div>
                            <span
                              className={`px-2 py-0.5 text-[10px] font-semibold bg-white border rounded ${
                                isSection9
                                  ? 'border-amber-300 text-amber-800'
                                  : 'border-rose-300 text-rose-700'
                              }`}
                            >
                              {flag.status}
                            </span>
                          </div>
                        );
                      })
                  )}
                </div>
              </div>
            </>
          ) : (
            <div className="p-12 text-center text-xs text-slate-400 bg-white border border-slate-200 rounded">
              Select or upload a source to view discovered PII and remediation risk flags.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
