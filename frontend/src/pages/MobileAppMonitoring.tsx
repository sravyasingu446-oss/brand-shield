import React, { useState } from 'react';
import { Brand, InvestigationCase } from '../types';
import { api } from '../services/api';
import { RiskBadge } from '../components/common/RiskBadge';
import { StatusPill } from '../components/common/StatusPill';
import { 
  Smartphone, 
  SearchCode, 
  AlertTriangle, 
  CheckCircle, 
  ShieldAlert, 
  Lock,
  Layers
} from 'lucide-react';

interface MobileAppMonitoringProps {
  brands: Brand[];
  cases: InvestigationCase[];
  onSelectCase: (c: InvestigationCase) => void;
  onNewCaseAdded: (newCase: InvestigationCase) => void;
}

export const MobileAppMonitoring: React.FC<MobileAppMonitoringProps> = ({
  brands,
  cases,
  onSelectCase,
  onNewCaseAdded,
}) => {
  const [selectedBrandId, setSelectedBrandId] = useState<number>(brands[0]?.id || 1);
  const [appName, setAppName] = useState('');
  const [packageName, setPackageName] = useState('');
  const [developerName, setDeveloperName] = useState('');
  const [appStore, setAppStore] = useState('GOOGLE_PLAY');
  const [permissions, setPermissions] = useState('READ_SMS, RECEIVE_SMS, SYSTEM_ALERT_WINDOW');
  const [privacyPolicyUrl, setPrivacyPolicyUrl] = useState('');

  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const handleScanMobileApp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    setIsAnalyzing(true);
    try {
      const perms = permissions.split(',').map(s => s.trim()).filter(Boolean);
      const res = await api.analyzeMobileApp({
        brand_id: selectedBrandId,
        app_store: appStore,
        app_name: appName,
        package_name: packageName,
        developer_name: developerName,
        permissions: perms,
        privacy_policy_url: privacyPolicyUrl || undefined,
        listing_url: `https://play.google.com/store/apps/details?id=${packageName}`
      });

      const fullCase = await api.getCaseDetail(res.case_id);
      onNewCaseAdded(fullCase);
      setSuccessMsg(`Mobile app investigation complete! Classified as ${fullCase.risk_level} Risk (${fullCase.risk_score}/100). Case file ${fullCase.case_number} generated.`);
      setAppName('');
      setPackageName('');
      setDeveloperName('');
    } catch (err: any) {
      setErrorMsg(err.message || 'Mobile app audit failed.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const mobileCases = cases.filter(c => c.target_type === 'MOBILE_APP');

  return (
    <div className="space-y-6">
      {/* Top Banner & Audit Form */}
      <div className="rounded-2xl border border-slate-800/80 bg-navy-900/90 p-6 shadow-card">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <Smartphone className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white tracking-tight">Mobile Application Compliance & Risk Auditor</h3>
            <p className="text-xs text-slate-400">
              Detect rogue banking APKs, trojanized store listings, dangerous SMS permissions, and publisher impersonation
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

        <form onSubmit={handleScanMobileApp} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Target Brand</label>
              <select
                value={selectedBrandId}
                onChange={(e) => setSelectedBrandId(Number(e.target.value))}
                className="w-full bg-navy-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-shield-orange"
              >
                {brands.map((b) => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Store / Channel</label>
              <select
                value={appStore}
                onChange={(e) => setAppStore(e.target.value)}
                className="w-full bg-navy-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-shield-orange"
              >
                <option value="GOOGLE_PLAY">Google Play Store</option>
                <option value="THIRD_PARTY_APK">Third-Party APK Aggregator (APKPure, Aptoide)</option>
                <option value="APPLE_APP_STORE">Apple App Store</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Application Title *</label>
              <input
                type="text"
                placeholder="e.g. Apex Fast Mobile Banking"
                value={appName}
                onChange={(e) => setAppName(e.target.value)}
                className="w-full bg-navy-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-shield-orange"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Package Identifier *</label>
              <input
                type="text"
                placeholder="e.g. com.apex.banking.quick.pay"
                value={packageName}
                onChange={(e) => setPackageName(e.target.value)}
                className="w-full bg-navy-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-shield-orange font-mono"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Publisher / Developer Entity *</label>
              <input
                type="text"
                placeholder="e.g. Apex Mobile Development LLC"
                value={developerName}
                onChange={(e) => setDeveloperName(e.target.value)}
                className="w-full bg-navy-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-shield-orange"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Requested Permissions (comma-separated)</label>
              <input
                type="text"
                placeholder="READ_SMS, RECEIVE_SMS, SYSTEM_ALERT_WINDOW"
                value={permissions}
                onChange={(e) => setPermissions(e.target.value)}
                className="w-full bg-navy-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-shield-orange font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Privacy Policy URL</label>
              <input
                type="url"
                placeholder="https://..."
                value={privacyPolicyUrl}
                onChange={(e) => setPrivacyPolicyUrl(e.target.value)}
                className="w-full bg-navy-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-shield-orange font-mono"
              />
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={isAnalyzing}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-shield-orange hover:bg-shield-orange/90 text-white text-xs font-semibold shadow-glow-orange disabled:opacity-50 transition-all"
            >
              <SearchCode className="w-4 h-4" />
              <span>{isAnalyzing ? 'Auditing Application Listing...' : 'Audit Mobile App Package'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* Mobile App Cases Table */}
      <div className="rounded-2xl border border-slate-800/80 bg-navy-900/90 p-5 shadow-card">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h4 className="text-sm font-bold text-white tracking-tight">Mobile Application Compliance Ledger</h4>
            <p className="text-xs text-slate-400">Audited APKs compared against official registered application packages</p>
          </div>
          <span className="text-xs font-mono text-slate-400 font-semibold">{mobileCases.length} Cases Logged</span>
        </div>

        <div className="overflow-x-auto rounded-xl border border-slate-800">
          <table className="w-full text-left text-xs">
            <thead className="bg-navy-950 text-slate-400 uppercase text-[10px] border-b border-slate-800">
              <tr>
                <th className="py-2.5 px-3">Case ID</th>
                <th className="py-2.5 px-3">Application Title</th>
                <th className="py-2.5 px-3">Package Identifier</th>
                <th className="py-2.5 px-3">Target Brand</th>
                <th className="py-2.5 px-3">Risk Rating</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3 text-right">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80 font-normal">
              {mobileCases.map((c) => (
                <tr
                  key={c.id}
                  onClick={() => onSelectCase(c)}
                  className="hover:bg-slate-800/40 cursor-pointer transition-colors group"
                >
                  <td className="py-2.5 px-3 font-mono font-semibold text-shield-cyan">{c.case_number}</td>
                  <td className="py-2.5 px-3 font-semibold text-white">{c.target_name}</td>
                  <td className="py-2.5 px-3 font-mono text-slate-300 select-all">{c.target_identifier}</td>
                  <td className="py-2.5 px-3 text-slate-200">{c.brand_name}</td>
                  <td className="py-2.5 px-3">
                    <RiskBadge level={c.risk_level} score={c.risk_score} size="sm" />
                  </td>
                  <td className="py-2.5 px-3">
                    <StatusPill status={c.status} />
                  </td>
                  <td className="py-2.5 px-3 text-right">
                    <button className="px-2.5 py-1 rounded-lg bg-slate-800 group-hover:bg-shield-orange/20 group-hover:text-shield-orange text-slate-300 text-xs transition-colors">
                      View File
                    </button>
                  </td>
                </tr>
              ))}
              {mobileCases.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400 text-xs">
                    No mobile application cases analyzed yet. Use the auditor form above.
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
