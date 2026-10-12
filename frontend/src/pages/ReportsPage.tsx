import React, { useState, useEffect } from 'react';
import { ReportItem, Brand } from '../types';
import { api } from '../services/api';
import { Modal } from '../components/common/Modal';
import { RiskBadge } from '../components/common/RiskBadge';
import { 
  FileText, 
  Download, 
  Eye, 
  ShieldCheck, 
  Activity, 
  ExternalLink,
  BookOpen,
  Calendar,
  Layers
} from 'lucide-react';

interface ReportsPageProps {
  brands: Brand[];
}

export const ReportsPage: React.FC<ReportsPageProps> = ({ brands }) => {
  const [reports, setReports] = useState<ReportItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedBrandFilter, setSelectedBrandFilter] = useState<string>('ALL');

  // Preview Modal
  const [previewReport, setPreviewReport] = useState<ReportItem | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  const loadReports = async () => {
    setIsLoading(true);
    try {
      const data = await api.getReports();
      setReports(data);
    } catch (err: any) {
      console.error('Failed to load reports:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadReports();
  }, []);

  const handleOpenPreview = async (reportId: number) => {
    try {
      const detail = await api.getReportDetail(reportId);
      setPreviewReport(detail);
      setIsPreviewOpen(true);
    } catch (err: any) {
      alert(err.message || 'Failed to load report detail.');
    }
  };

  const filteredReports = reports.filter((r) => {
    if (selectedBrandFilter !== 'ALL' && r.brand_name !== selectedBrandFilter) {
      return false;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="rounded-2xl border border-slate-800/80 bg-navy-900/90 p-5 shadow-card flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
            <FileText className="w-5 h-5 text-shield-cyan" />
            <span>Investigation & Takedown Reports Archive</span>
          </h3>
          <p className="text-xs text-slate-400">
            Official incident reports sealed with cryptographic IOC hashes for legal notice and hosting provider takedowns
          </p>
        </div>

        <div className="flex items-center gap-3">
          <select
            value={selectedBrandFilter}
            onChange={(e) => setSelectedBrandFilter(e.target.value)}
            className="bg-navy-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-shield-cyan"
          >
            <option value="ALL">All Brands</option>
            {brands.map((b) => (
              <option key={b.id} value={b.name}>{b.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Reports Table */}
      <div className="rounded-2xl border border-slate-800/80 bg-navy-900/90 shadow-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-navy-950 text-slate-400 uppercase text-[10px] border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Report Number</th>
                <th className="py-3 px-4">Case Reference</th>
                <th className="py-3 px-4">Protected Brand</th>
                <th className="py-3 px-4">Risk Level</th>
                <th className="py-3 px-4">Executive Briefing Summary</th>
                <th className="py-3 px-4">Sealed Date</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80 font-normal">
              {filteredReports.map((r) => (
                <tr key={r.id} className="hover:bg-slate-800/30 transition-colors">
                  <td className="py-3 px-4 font-mono font-bold text-shield-orange whitespace-nowrap">
                    {r.report_number}
                  </td>
                  <td className="py-3 px-4 font-mono text-shield-cyan whitespace-nowrap">
                    {r.case_number || `Case #${r.case_id}`}
                  </td>
                  <td className="py-3 px-4 text-white font-medium whitespace-nowrap">
                    {r.brand_name}
                  </td>
                  <td className="py-3 px-4 whitespace-nowrap">
                    <RiskBadge level={r.risk_level} score={r.risk_score} size="sm" />
                  </td>
                  <td className="py-3 px-4 text-slate-300 max-w-md line-clamp-1">
                    {r.executive_summary}
                  </td>
                  <td className="py-3 px-4 text-slate-400 font-mono text-[11px] whitespace-nowrap">
                    {new Date(r.created_at).toLocaleDateString()}
                  </td>
                  <td className="py-3 px-4 text-right whitespace-nowrap">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => handleOpenPreview(r.id)}
                        className="px-2.5 py-1.5 rounded-lg border border-slate-800 bg-navy-950 hover:bg-slate-800 text-slate-200 text-xs font-medium transition-colors flex items-center gap-1"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Preview</span>
                      </button>
                      <a
                        href={api.getPdfDownloadUrl(r.id)}
                        target="_blank"
                        rel="noreferrer"
                        download
                        className="px-2.5 py-1.5 rounded-lg bg-shield-orange/20 border border-shield-orange/40 hover:bg-shield-orange/30 text-shield-orange text-xs font-semibold transition-colors flex items-center gap-1"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>PDF</span>
                      </a>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredReports.length === 0 && !isLoading && (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400 text-xs">
                    No reports generated yet. Reports are compiled automatically upon case investigation.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* PREVIEW REPORT MODAL */}
      {previewReport && (
        <Modal
          isOpen={isPreviewOpen}
          onClose={() => setIsPreviewOpen(false)}
          title={previewReport.title}
          subtitle={`Report: ${previewReport.report_number} • Brand: ${previewReport.brand_name}`}
          maxWidth="3xl"
        >
          <div className="space-y-5 text-xs text-slate-300">
            {/* Executive Summary */}
            <div className="p-4 rounded-xl border border-slate-800 bg-navy-950">
              <h5 className="font-bold text-white text-xs uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <BookOpen className="w-4 h-4 text-shield-cyan" />
                <span>Executive Summary</span>
              </h5>
              <p className="leading-relaxed text-slate-200">{previewReport.executive_summary}</p>
            </div>

            {/* Methodology */}
            <div>
              <h5 className="font-bold text-white text-xs uppercase tracking-wider mb-2">
                Investigation Methodology & Multi-Agent Architecture
              </h5>
              <p className="text-slate-400 leading-relaxed">{previewReport.methodology}</p>
            </div>

            {/* Threat Indicators */}
            {previewReport.threat_indicators && previewReport.threat_indicators.length > 0 && (
              <div>
                <h5 className="font-bold text-white text-xs uppercase tracking-wider mb-2">
                  Key Indicators of Compromise (IOCs)
                </h5>
                <div className="space-y-2">
                  {previewReport.threat_indicators.map((ind: any, i: number) => (
                    <div key={i} className="p-3 rounded-lg border border-slate-800 bg-navy-950 flex items-center justify-between">
                      <div>
                        <div className="font-semibold text-white">{ind.title}</div>
                        <div className="text-[11px] text-slate-400">{ind.detail}</div>
                      </div>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                        {ind.severity}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Remediation Playbook */}
            {previewReport.remediation_playbook && previewReport.remediation_playbook.length > 0 && (
              <div>
                <h5 className="font-bold text-white text-xs uppercase tracking-wider mb-2">
                  Recommended Remediation Playbook
                </h5>
                <div className="space-y-2">
                  {previewReport.remediation_playbook.map((step: any, i: number) => (
                    <div key={i} className="p-3 rounded-lg border border-slate-800 bg-navy-950">
                      <div className="font-semibold text-shield-orange">Step {step.step}: {step.action}</div>
                      <div className="text-[11px] text-slate-300 mt-0.5">{step.detail}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Modal Actions */}
            <div className="flex justify-between items-center pt-4 border-t border-slate-800">
              <span className="text-[11px] text-slate-400 font-mono">
                Sealed by {previewReport.generated_by}
              </span>
              <a
                href={api.getPdfDownloadUrl(previewReport.id)}
                target="_blank"
                rel="noreferrer"
                download
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-shield-orange hover:bg-shield-orange/90 text-white text-xs font-semibold shadow-glow-orange transition-colors"
              >
                <Download className="w-4 h-4" />
                <span>Download Official PDF</span>
              </a>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
