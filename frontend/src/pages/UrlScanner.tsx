import React, { useState } from 'react';
import { Brand, InvestigationCase } from '../types';
import { api } from '../services/api';
import { RiskBadge } from '../components/common/RiskBadge';
import { StatusPill } from '../components/common/StatusPill';
import { 
  Globe2, 
  SearchCode, 
  AlertTriangle, 
  CheckCircle, 
  ExternalLink,
  ShieldAlert, 
  Lock,
  Terminal
} from 'lucide-react';

interface UrlScannerProps {
  brands: Brand[];
  cases: InvestigationCase[];
  onSelectCase: (c: InvestigationCase) => void;
  onNewCaseAdded: (newCase: InvestigationCase) => void;
}

export const UrlScanner: React.FC<UrlScannerProps> = ({
  brands,
  cases,
  onSelectCase,
  onNewCaseAdded,
}) => {
  const [selectedBrandId, setSelectedBrandId] = useState<number>(brands[0]?.id || 1);
  const [targetUrl, setTargetUrl] = useState('');
  const [pageTitle, setPageTitle] = useState('');
  const [detectedForms, setDetectedForms] = useState('password, card_number, ssn');

  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const handleScanUrl = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    setIsAnalyzing(true);
    try {
      const forms = detectedForms.split(',').map(s => s.trim()).filter(Boolean);
      const res = await api.analyzeUrl({
        brand_id: selectedBrandId,
        url: targetUrl,
        page_title: pageTitle || undefined,
        detected_forms: forms.length > 0 ? forms : undefined
      });

      const fullCase = await api.getCaseDetail(res.case_id);
      onNewCaseAdded(fullCase);
      setSuccessMsg(`URL scan complete! Assigned ${fullCase.risk_level} Risk (${fullCase.risk_score}/100). Threat Category: ${fullCase.threat_category}. Case ${fullCase.case_number} recorded.`);
      setTargetUrl('');
      setPageTitle('');
    } catch (err: any) {
      setErrorMsg(err.message || 'URL security scan failed.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const urlCases = cases.filter(c => c.target_type === 'PHISHING_URL');

  return (
    <div className="space-y-6">
      {/* Top Banner & Scanner Form */}
      <div className="rounded-2xl border border-slate-800/80 bg-navy-900/90 p-6 shadow-card">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2.5 rounded-xl bg-shield-cyan/10 text-shield-cyan border border-shield-cyan/20">
            <Globe2 className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white tracking-tight">Real-Time Phishing & URL Threat Scanner</h3>
            <p className="text-xs text-slate-400">
              Audit domains against corporate registries for combosquatting, subdomain brand spoofing, high-risk TLDs, and credential harvesting
            </p>
          </div>
        </div>

        {errorMsg && (
          <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="mb-4 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-center gap-2">
            <CheckCircle className="w-4 h-4" />
            <span>{successMsg}</span>
          </div>
        )}

        <form onSubmit={handleScanUrl} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Target Brand Under Threat</label>
              <select
                value={selectedBrandId}
                onChange={(e) => setSelectedBrandId(Number(e.target.value))}
                className="w-full bg-navy-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-shield-cyan"
              >
                {brands.map((b) => (
                  <option key={b.id} value={b.id}>{b.name} ({b.primary_domain})</option>
                ))}
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-slate-400 mb-1">Suspicious URL / Domain Endpoint *</label>
              <input
                type="text"
                placeholder="https://apexbank-auth-verify.xyz/login"
                value={targetUrl}
                onChange={(e) => setTargetUrl(e.target.value)}
                className="w-full bg-navy-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-shield-cyan font-mono"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Page Title (optional)</label>
              <input
                type="text"
                placeholder="e.g. Apex Online Banking Verification"
                value={pageTitle}
                onChange={(e) => setPageTitle(e.target.value)}
                className="w-full bg-navy-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-shield-cyan"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Detected Form Fields (comma-separated)</label>
              <input
                type="text"
                placeholder="password, card_number, ssn"
                value={detectedForms}
                onChange={(e) => setDetectedForms(e.target.value)}
                className="w-full bg-navy-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-shield-cyan font-mono"
              />
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={isAnalyzing}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-shield-cyan to-blue-600 hover:brightness-110 active:scale-95 text-navy-950 text-xs font-bold shadow-glow-cyan disabled:opacity-50 transition-all"
            >
              <SearchCode className="w-4 h-4" />
              <span>{isAnalyzing ? 'Scanning Network Indicators...' : 'Scan URL & Infrastructure'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* Scanned Phishing URLs Table */}
      <div className="rounded-2xl border border-slate-800/80 bg-navy-900/90 p-5 shadow-card">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h4 className="text-sm font-bold text-white tracking-tight">Investigated Phishing Domains & URLs</h4>
            <p className="text-xs text-slate-400">DNS, TLD abuse, and credential interception records</p>
          </div>
          <span className="text-xs font-mono text-slate-400 font-semibold">{urlCases.length} URLs Scanned</span>
        </div>

        <div className="overflow-x-auto rounded-xl border border-slate-800">
          <table className="w-full text-left text-xs">
            <thead className="bg-navy-950 text-slate-400 uppercase text-[10px] border-b border-slate-800">
              <tr>
                <th className="py-2.5 px-3">Case ID</th>
                <th className="py-2.5 px-3">Target URL</th>
                <th className="py-2.5 px-3">Brand Targeted</th>
                <th className="py-2.5 px-3">Threat Category</th>
                <th className="py-2.5 px-3">Risk Rating</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3 text-right">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80 font-normal">
              {urlCases.map((c) => (
                <tr
                  key={c.id}
                  onClick={() => onSelectCase(c)}
                  className="hover:bg-slate-800/40 cursor-pointer transition-colors group"
                >
                  <td className="py-2.5 px-3 font-mono font-semibold text-shield-cyan">{c.case_number}</td>
                  <td className="py-2.5 px-3">
                    <div className="font-semibold text-white font-mono truncate max-w-xs">{c.target_name}</div>
                    <div className="text-[10px] text-slate-400 font-mono truncate">{c.target_identifier}</div>
                  </td>
                  <td className="py-2.5 px-3 text-slate-200">{c.brand_name}</td>
                  <td className="py-2.5 px-3 text-slate-300">{c.threat_category}</td>
                  <td className="py-2.5 px-3">
                    <RiskBadge level={c.risk_level} score={c.risk_score} size="sm" />
                  </td>
                  <td className="py-2.5 px-3">
                    <StatusPill status={c.status} />
                  </td>
                  <td className="py-2.5 px-3 text-right">
                    <button className="px-2.5 py-1 rounded-lg bg-slate-800 group-hover:bg-shield-cyan/20 group-hover:text-shield-cyan text-slate-300 text-xs transition-colors">
                      View File
                    </button>
                  </td>
                </tr>
              ))}
              {urlCases.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400 text-xs">
                    No URL cases analyzed yet. Submit a URL for investigation above.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
