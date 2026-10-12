import React, { useState } from 'react';
import { InvestigationCase, CaseStatus } from '../../types';
import { Modal } from '../common/Modal';
import { RiskBadge } from '../common/RiskBadge';
import { StatusPill } from '../common/StatusPill';
import { api } from '../../services/api';
import { 
  ShieldAlert, 
  ExternalLink, 
  Clock, 
  FileText, 
  Download, 
  CheckCircle, 
  UserCheck, 
  Database,
  Hash,
  AlertTriangle,
  ArrowUpRight,
  Sparkles
} from 'lucide-react';

interface CaseDetailModalProps {
  caseData: InvestigationCase | null;
  isOpen: boolean;
  onClose: () => void;
  onCaseUpdated: (updated: InvestigationCase) => void;
}

export const CaseDetailModal: React.FC<CaseDetailModalProps> = ({
  caseData,
  isOpen,
  onClose,
  onCaseUpdated,
}) => {
  if (!caseData) return null;

  const [activeTab, setActiveTab] = useState<'explainability' | 'evidence' | 'telemetry' | 'review'>('explainability');
  
  // Human Review Form State
  const [reviewerName, setReviewerName] = useState(caseData.reviewer_name || 'SecOps Analyst (Tier 2)');
  const [reviewStatus, setReviewStatus] = useState<CaseStatus>(caseData.status);
  const [reviewNotes, setReviewNotes] = useState(caseData.review_notes || '');
  const [actionTaken, setActionTaken] = useState(caseData.action_taken || 'Takedown Requested');
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSaveReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewNotes.trim()) {
      setErrorMsg('Analyst review notes are required for auditing.');
      return;
    }
    setErrorMsg('');
    setIsSaving(true);
    try {
      const updated = await api.updateCaseReview(caseData.id, {
        reviewer_name: reviewerName,
        status: reviewStatus,
        review_notes: reviewNotes,
        action_taken: actionTaken
      });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
      onCaseUpdated(updated);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to update case review.');
    } finally {
      setIsSaving(false);
    }
  };

  const explainability = caseData.explainability;
  const evidenceList = caseData.evidence || [];
  const telemetryList = caseData.agent_telemetry || [];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`${caseData.case_number} • Investigation Case File`}
      subtitle={`Brand: ${caseData.brand_name} • Registered: ${new Date(caseData.created_at).toLocaleString()}`}
      maxWidth="3xl"
    >
      {/* Target Banner */}
      <div className="rounded-xl border border-slate-800 bg-navy-950 p-4 mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            <span className="text-xs uppercase font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-semibold border border-slate-700">
              {caseData.target_type.replace('_', ' ')}
            </span>
            <RiskBadge level={caseData.risk_level} score={caseData.risk_score} />
            <StatusPill status={caseData.status} />
          </div>
          <h4 className="text-base font-bold text-white flex items-center gap-2">
            <span>{caseData.target_name}</span>
            {caseData.target_url && (
              <a
                href={caseData.target_url}
                target="_blank"
                rel="noreferrer"
                className="text-shield-cyan hover:underline text-xs inline-flex items-center gap-0.5 font-mono"
              >
                <span>{caseData.target_identifier}</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            )}
          </h4>
          <p className="text-xs text-slate-400 mt-1">{caseData.summary}</p>
        </div>

        {/* PDF Download Trigger */}
        <div className="shrink-0 flex items-center gap-2">
          <a
            href={api.getPdfDownloadUrlByCaseId(caseData.id)}
            target="_blank"
            rel="noreferrer"
            download
            className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors shadow-sm"
          >
            <Download className="w-3.5 h-3.5 text-shield-orange" />
            <span>Export PDF Report</span>
          </a>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-800 mb-6 gap-2">
        <button
          onClick={() => setActiveTab('explainability')}
          className={`pb-3 px-3 text-xs font-semibold transition-colors border-b-2 flex items-center gap-1.5 ${
            activeTab === 'explainability'
              ? 'border-shield-orange text-shield-orange'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Explainability & Scoring ({caseData.risk_score}/100)</span>
        </button>
        <button
          onClick={() => setActiveTab('evidence')}
          className={`pb-3 px-3 text-xs font-semibold transition-colors border-b-2 flex items-center gap-1.5 ${
            activeTab === 'evidence'
              ? 'border-shield-cyan text-shield-cyan'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Database className="w-3.5 h-3.5" />
          <span>Cryptographic Evidence ({evidenceList.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('telemetry')}
          className={`pb-3 px-3 text-xs font-semibold transition-colors border-b-2 flex items-center gap-1.5 ${
            activeTab === 'telemetry'
              ? 'border-shield-blue text-shield-blue'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Clock className="w-3.5 h-3.5" />
          <span>Agent Telemetry</span>
        </button>
        <button
          onClick={() => setActiveTab('review')}
          className={`pb-3 px-3 text-xs font-semibold transition-colors border-b-2 flex items-center gap-1.5 ${
            activeTab === 'review'
              ? 'border-emerald-500 text-emerald-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <UserCheck className="w-3.5 h-3.5" />
          <span>Human Review & Verdict</span>
        </button>
      </div>

      {/* TAB 1: EXPLAINABILITY */}
      {activeTab === 'explainability' && (
        <div className="space-y-4">
          {explainability ? (
            <>
              <div className="p-4 rounded-xl border border-slate-800 bg-navy-950/80">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Scoring Rationale</span>
                <p className="mt-1 text-sm text-slate-200">{explainability.summary_rationale}</p>
              </div>

              <div>
                <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2 block">
                  Contributing Risk Factors Breakdown
                </span>
                <div className="overflow-hidden rounded-xl border border-slate-800">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-navy-950 text-slate-400 uppercase text-[10px] border-b border-slate-800">
                      <tr>
                        <th className="py-2.5 px-3">Factor / Agent</th>
                        <th className="py-2.5 px-3">Direction</th>
                        <th className="py-2.5 px-3">Impact</th>
                        <th className="py-2.5 px-3">Technical Detail</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/80 font-normal">
                      {explainability.factors.map((f, i) => (
                        <tr key={i} className="hover:bg-slate-900/40">
                          <td className="py-2.5 px-3 font-medium text-white">
                            <div>{f.factor_name}</div>
                            <div className="text-[10px] text-slate-400">{f.category}</div>
                          </td>
                          <td className="py-2.5 px-3">
                            {f.risk_direction === 'POSITIVE' ? (
                              <span className="text-red-400 font-semibold flex items-center gap-1">
                                <ArrowUpRight className="w-3 h-3" /> Risk Vector
                              </span>
                            ) : (
                              <span className="text-emerald-400 font-semibold flex items-center gap-1">
                                <CheckCircle className="w-3 h-3" /> Mitigating
                              </span>
                            )}
                          </td>
                          <td className="py-2.5 px-3 font-mono font-bold">
                            <span className={f.score_contribution > 0 ? 'text-red-400' : 'text-emerald-400'}>
                              {f.score_contribution > 0 ? `+${f.score_contribution}` : f.score_contribution} pts
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-slate-300 max-w-xs">{f.description}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          ) : (
            <p className="text-xs text-slate-400">No factor breakdown recorded for this case.</p>
          )}
        </div>
      )}

      {/* TAB 2: EVIDENCE LEDGER */}
      {activeTab === 'evidence' && (
        <div className="space-y-4">
          <p className="text-xs text-slate-400">
            Cryptographic proof and indicators of compromise (IOCs) captured during the multi-agent investigation.
          </p>
          <div className="space-y-2.5">
            {evidenceList.map((ev) => (
              <div key={ev.id} className="p-3.5 rounded-xl border border-slate-800 bg-navy-950/70 hover:border-slate-700 transition-colors">
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                      {ev.evidence_type}
                    </span>
                    <span className="text-xs font-semibold text-white">{ev.title}</span>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    ev.severity === 'CRITICAL' ? 'bg-red-500/20 text-red-400 border border-red-500/30' :
                    ev.severity === 'HIGH' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' :
                    'bg-slate-700/30 text-slate-300'
                  }`}>
                    {ev.severity}
                  </span>
                </div>
                <p className="text-xs text-slate-300">{ev.description}</p>
                {ev.sha256_hash && (
                  <div className="mt-2 pt-2 border-t border-slate-800/80 flex items-center gap-1.5 text-[11px] font-mono text-slate-400">
                    <Hash className="w-3 h-3 text-shield-cyan" />
                    <span>SHA256:</span>
                    <span className="text-slate-300 truncate select-all">{ev.sha256_hash}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: AGENT TELEMETRY */}
      {activeTab === 'telemetry' && (
        <div className="space-y-3">
          <p className="text-xs text-slate-400">
            Execution logs and findings returned by specialist intelligence agents for this investigation.
          </p>
          <div className="space-y-2">
            {telemetryList.map((ag: any, idx: number) => (
              <div key={idx} className="p-3 rounded-xl border border-slate-800 bg-navy-950 flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-white">{ag.agent_name || ag.name}</span>
                    <RiskBadge level={ag.risk_level || 'LOW'} size="sm" />
                  </div>
                  <p className="text-xs text-slate-400 mt-1">{ag.summary}</p>
                  {ag.indicators_found && ag.indicators_found.length > 0 && (
                    <ul className="mt-2 space-y-1">
                      {ag.indicators_found.map((ind: string, j: number) => (
                        <li key={j} className="text-[11px] text-red-300 flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
                          <span>{ind}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
                {ag.execution_time_ms && (
                  <span className="text-[10px] font-mono text-slate-400">{ag.execution_time_ms}ms</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: HUMAN REVIEW WORKFLOW */}
      {activeTab === 'review' && (
        <form onSubmit={handleSaveReview} className="space-y-4">
          <div className="p-3.5 rounded-xl border border-slate-800 bg-navy-950/60 mb-2">
            <h5 className="text-xs font-semibold text-slate-300 flex items-center gap-1.5 mb-1">
              <UserCheck className="w-4 h-4 text-emerald-400" />
              <span>Human Analyst Triage Workflow</span>
            </h5>
            <p className="text-xs text-slate-400">
              Rule 11/12 Policy: BrandShield AI never takes automatic punitive action. A qualified security analyst 
              must review evidence, specify human justification, and determine resolution verdict.
            </p>
          </div>

          {errorMsg && (
            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              <span>{errorMsg}</span>
            </div>
          )}

          {saveSuccess && (
            <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-center gap-2">
              <CheckCircle className="w-4 h-4" />
              <span>Case review updated and saved to audit ledger!</span>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Reviewing Analyst</label>
              <input
                type="text"
                value={reviewerName}
                onChange={(e) => setReviewerName(e.target.value)}
                className="w-full bg-navy-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-shield-orange"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Case Status / Verdict</label>
              <select
                value={reviewStatus}
                onChange={(e) => setReviewStatus(e.target.value as CaseStatus)}
                className="w-full bg-navy-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-shield-orange"
              >
                <option value="NEW">NEW</option>
                <option value="IN_REVIEW">IN_REVIEW</option>
                <option value="CONFIRMED_IMPERSONATION">CONFIRMED_IMPERSONATION</option>
                <option value="FALSE_POSITIVE">FALSE_POSITIVE</option>
                <option value="RESOLVED">RESOLVED</option>
                <option value="CLOSED">CLOSED</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">Recommended Remediation Action</label>
            <select
              value={actionTaken}
              onChange={(e) => setActionTaken(e.target.value)}
              className="w-full bg-navy-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-shield-orange"
            >
              <option value="Takedown Requested">Takedown Requested (DMCA / Abuse Form)</option>
              <option value="Domain Cease & Desist Sent">Domain Cease & Desist Sent to Registrar</option>
              <option value="Social Impersonation Ticket Filed">Social Impersonation Ticket Filed to Platform</option>
              <option value="DNS Threat Feed Blocklisted">DNS Threat Feed Blocklisted (Quad9/SafeBrowsing)</option>
              <option value="Marked Benign / Official Partner">Marked Benign / Official Partner</option>
              <option value="No Action / Monitoring">No Action / Passive Monitoring</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">Analyst Justification & Investigation Notes</label>
            <textarea
              rows={3}
              value={reviewNotes}
              onChange={(e) => setReviewNotes(e.target.value)}
              placeholder="State rationale for verdict (e.g. verified WHOIS discrepancy, contacted customer, confirmed rogue APK)..."
              className="w-full bg-navy-950 border border-slate-800 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-shield-orange"
              required
            />
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={isSaving}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-sm transition-all disabled:opacity-50"
            >
              {isSaving ? 'Saving Audit Record...' : 'Confirm & Save Review Verdict'}
            </button>
          </div>
        </form>
      )}
    </Modal>
  );
};
