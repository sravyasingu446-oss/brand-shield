import React, { useState } from 'react';
import { Brand, InvestigationCase } from '../../types';
import { Modal } from './Modal';
import { api } from '../../services/api';
import { 
  Globe2, 
  Share2, 
  Smartphone, 
  Building2, 
  Cpu, 
  CheckCircle, 
  AlertTriangle,
  ArrowRight,
  ShieldCheck,
  SearchCode
} from 'lucide-react';

interface QuickScanModalProps {
  isOpen: boolean;
  onClose: () => void;
  brands: Brand[];
  onInvestigationComplete: (newCase: InvestigationCase) => void;
}

export const QuickScanModal: React.FC<QuickScanModalProps> = ({
  isOpen,
  onClose,
  brands,
  onInvestigationComplete,
}) => {
  const [scanType, setScanType] = useState<'url' | 'social' | 'mobile' | 'company'>('url');
  const [selectedBrandId, setSelectedBrandId] = useState<number>(brands[0]?.id || 1);

  // URL Scan Form
  const [targetUrl, setTargetUrl] = useState('');
  const [pageTitle, setPageTitle] = useState('');
  const [detectedForms, setDetectedForms] = useState('password, otp_code');

  // Social Scan Form
  const [socialPlatform, setSocialPlatform] = useState('TWITTER');
  const [socialHandle, setSocialHandle] = useState('');
  const [socialDisplayName, setSocialDisplayName] = useState('');
  const [socialBio, setSocialBio] = useState('');
  const [socialFollowers, setSocialFollowers] = useState<number>(45);

  // Mobile App Scan Form
  const [appName, setAppName] = useState('');
  const [packageName, setPackageName] = useState('');
  const [developerName, setDeveloperName] = useState('');
  const [appStore, setAppStore] = useState('GOOGLE_PLAY');
  const [permissions, setPermissions] = useState('READ_SMS, RECEIVE_SMS, SYSTEM_ALERT_WINDOW');

  // Company Page Scan Form
  const [companyPlatform, setCompanyPlatform] = useState('LINKEDIN');
  const [pageName, setPageName] = useState('');
  const [pageUrl, setPageUrl] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [recruiterName, setRecruiterName] = useState('');

  // Execution state
  const [isScanning, setIsScanning] = useState(false);
  const [agentStep, setAgentStep] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState('');

  const handleRunInvestigation = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setIsScanning(true);

    try {
      setAgentStep('1/5: Querying Brand Profile Agent for verified registry...');
      await new Promise(r => setTimeout(r, 400));

      setAgentStep('2/5: Disagreeing with specialist intelligence agents...');
      await new Promise(r => setTimeout(r, 450));

      setAgentStep('3/5: Checking evidence sufficiency and running recursive IOC audits...');
      await new Promise(r => setTimeout(r, 450));

      setAgentStep('4/5: Synthesizing explainable risk score (0-100)...');
      let resultCase: any = null;

      if (scanType === 'url') {
        const forms = detectedForms.split(',').map(s => s.trim()).filter(Boolean);
        resultCase = await api.analyzeUrl({
          brand_id: selectedBrandId,
          url: targetUrl,
          page_title: pageTitle || undefined,
          detected_forms: forms.length > 0 ? forms : undefined
        });
      } else if (scanType === 'social') {
        resultCase = await api.analyzeSocial({
          brand_id: selectedBrandId,
          platform: socialPlatform,
          profile_url: `https://${socialPlatform.toLowerCase()}.com/${socialHandle.replace('@', '')}`,
          handle: socialHandle.startsWith('@') ? socialHandle : `@${socialHandle}`,
          display_name: socialDisplayName,
          bio: socialBio || undefined,
          follower_count: socialFollowers,
          is_verified: false,
          recent_posts: ['Urgent: Account security update required. Click link below to avoid suspension.']
        });
      } else if (scanType === 'mobile') {
        const perms = permissions.split(',').map(s => s.trim()).filter(Boolean);
        resultCase = await api.analyzeMobileApp({
          brand_id: selectedBrandId,
          app_store: appStore,
          app_name: appName,
          package_name: packageName,
          developer_name: developerName,
          permissions: perms,
          listing_url: `https://play.google.com/store/apps/details?id=${packageName}`
        });
      } else if (scanType === 'company') {
        resultCase = await api.analyzeCompanyPage({
          brand_id: selectedBrandId,
          platform: companyPlatform,
          page_name: pageName,
          page_url: pageUrl,
          contact_email: contactEmail || undefined,
          recruiter_name: recruiterName || undefined,
          job_titles: ['Remote Data Analyst ($60/hr)', 'Customer Support Executive']
        });
      }

      setAgentStep('5/5: Investigation case, evidence items, and report sealed.');
      await new Promise(r => setTimeout(r, 300));

      // Fetch the full case detail to pass back
      const fullCase = await api.getCaseDetail(resultCase.case_id);
      onInvestigationComplete(fullCase);
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Investigation pipeline failed.');
    } finally {
      setIsScanning(false);
      setAgentStep('');
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Launch Multi-Agent Investigation"
      subtitle="Analyze a suspicious digital target against protected brand registry"
      maxWidth="2xl"
    >
      <form onSubmit={handleRunInvestigation} className="space-y-4">
        {/* Brand Selector */}
        <div>
          <label className="block text-xs font-semibold uppercase text-slate-300 mb-1.5">
            Protected Brand Under Threat
          </label>
          <select
            value={selectedBrandId}
            onChange={(e) => setSelectedBrandId(Number(e.target.value))}
            className="w-full bg-navy-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-shield-orange"
            required
          >
            {brands.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name} ({b.primary_domain})
              </option>
            ))}
          </select>
        </div>

        {/* Target Type Selector Tabs */}
        <div>
          <label className="block text-xs font-semibold uppercase text-slate-300 mb-1.5">
            Suspicious Target Type
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <button
              type="button"
              onClick={() => setScanType('url')}
              className={`p-2.5 rounded-xl border text-xs font-medium flex items-center justify-center gap-2 transition-all ${
                scanType === 'url'
                  ? 'border-shield-orange bg-shield-orange/15 text-white font-semibold shadow-glow-orange/20'
                  : 'border-slate-800 bg-navy-950 text-slate-400 hover:text-slate-200'
              }`}
            >
              <Globe2 className="w-4 h-4 text-shield-cyan" />
              <span>Phishing URL</span>
            </button>
            <button
              type="button"
              onClick={() => setScanType('social')}
              className={`p-2.5 rounded-xl border text-xs font-medium flex items-center justify-center gap-2 transition-all ${
                scanType === 'social'
                  ? 'border-shield-orange bg-shield-orange/15 text-white font-semibold shadow-glow-orange/20'
                  : 'border-slate-800 bg-navy-950 text-slate-400 hover:text-slate-200'
              }`}
            >
              <Share2 className="w-4 h-4 text-shield-orange" />
              <span>Social Profile</span>
            </button>
            <button
              type="button"
              onClick={() => setScanType('mobile')}
              className={`p-2.5 rounded-xl border text-xs font-medium flex items-center justify-center gap-2 transition-all ${
                scanType === 'mobile'
                  ? 'border-shield-orange bg-shield-orange/15 text-white font-semibold shadow-glow-orange/20'
                  : 'border-slate-800 bg-navy-950 text-slate-400 hover:text-slate-200'
              }`}
            >
              <Smartphone className="w-4 h-4 text-emerald-400" />
              <span>Mobile App</span>
            </button>
            <button
              type="button"
              onClick={() => setScanType('company')}
              className={`p-2.5 rounded-xl border text-xs font-medium flex items-center justify-center gap-2 transition-all ${
                scanType === 'company'
                  ? 'border-shield-orange bg-shield-orange/15 text-white font-semibold shadow-glow-orange/20'
                  : 'border-slate-800 bg-navy-950 text-slate-400 hover:text-slate-200'
              }`}
            >
              <Building2 className="w-4 h-4 text-blue-400" />
              <span>Fake Page</span>
            </button>
          </div>
        </div>

        {/* Dynamic Fields: URL Scanner */}
        {scanType === 'url' && (
          <div className="space-y-3 p-3.5 rounded-xl border border-slate-800 bg-navy-950/60">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Target Suspicious URL *</label>
              <input
                type="text"
                placeholder="https://apexbank-auth-verify.xyz/login"
                value={targetUrl}
                onChange={(e) => setTargetUrl(e.target.value)}
                className="w-full bg-navy-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-shield-orange font-mono"
                required
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Page Title (optional)</label>
                <input
                  type="text"
                  placeholder="Apex Online Banking Sign In"
                  value={pageTitle}
                  onChange={(e) => setPageTitle(e.target.value)}
                  className="w-full bg-navy-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-shield-orange"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Detected Inputs (comma-separated)</label>
                <input
                  type="text"
                  placeholder="password, card_number, ssn"
                  value={detectedForms}
                  onChange={(e) => setDetectedForms(e.target.value)}
                  className="w-full bg-navy-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-shield-orange font-mono"
                />
              </div>
            </div>
          </div>
        )}

        {/* Dynamic Fields: Social Profile */}
        {scanType === 'social' && (
          <div className="space-y-3 p-3.5 rounded-xl border border-slate-800 bg-navy-950/60">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Platform</label>
                <select
                  value={socialPlatform}
                  onChange={(e) => setSocialPlatform(e.target.value)}
                  className="w-full bg-navy-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-shield-orange"
                >
                  <option value="TWITTER">Twitter / X</option>
                  <option value="LINKEDIN">LinkedIn</option>
                  <option value="INSTAGRAM">Instagram</option>
                  <option value="TELEGRAM">Telegram</option>
                  <option value="FACEBOOK">Facebook</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Handle *</label>
                <input
                  type="text"
                  placeholder="@apexbank_helpdesk"
                  value={socialHandle}
                  onChange={(e) => setSocialHandle(e.target.value)}
                  className="w-full bg-navy-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-shield-orange font-mono"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Display Name *</label>
                <input
                  type="text"
                  placeholder="Apex Bank Official Care"
                  value={socialDisplayName}
                  onChange={(e) => setSocialDisplayName(e.target.value)}
                  className="w-full bg-navy-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-shield-orange"
                  required
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Bio / Profile Description</label>
              <textarea
                rows={2}
                placeholder="Official 24/7 customer care desk. For urgent help contact WhatsApp: https://wa.me/..."
                value={socialBio}
                onChange={(e) => setSocialBio(e.target.value)}
                className="w-full bg-navy-900 border border-slate-800 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-shield-orange"
              />
            </div>
          </div>
        )}

        {/* Dynamic Fields: Mobile App */}
        {scanType === 'mobile' && (
          <div className="space-y-3 p-3.5 rounded-xl border border-slate-800 bg-navy-950/60">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">App Title *</label>
                <input
                  type="text"
                  placeholder="Apex Fast Mobile Banking"
                  value={appName}
                  onChange={(e) => setAppName(e.target.value)}
                  className="w-full bg-navy-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-shield-orange"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Package Name *</label>
                <input
                  type="text"
                  placeholder="com.apex.banking.quick.pay"
                  value={packageName}
                  onChange={(e) => setPackageName(e.target.value)}
                  className="w-full bg-navy-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-shield-orange font-mono"
                  required
                />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Developer / Publisher *</label>
                <input
                  type="text"
                  placeholder="Apex Mobile Development LLC"
                  value={developerName}
                  onChange={(e) => setDeveloperName(e.target.value)}
                  className="w-full bg-navy-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-shield-orange"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Distribution Store</label>
                <select
                  value={appStore}
                  onChange={(e) => setAppStore(e.target.value)}
                  className="w-full bg-navy-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-shield-orange"
                >
                  <option value="GOOGLE_PLAY">Google Play Store</option>
                  <option value="THIRD_PARTY_APK">Third-Party APK Aggregator</option>
                  <option value="APPLE_APP_STORE">Apple App Store</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Permissions Requested</label>
              <input
                type="text"
                placeholder="READ_SMS, RECEIVE_SMS, SYSTEM_ALERT_WINDOW"
                value={permissions}
                onChange={(e) => setPermissions(e.target.value)}
                className="w-full bg-navy-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-shield-orange font-mono"
              />
            </div>
          </div>
        )}

        {/* Dynamic Fields: Company Page */}
        {scanType === 'company' && (
          <div className="space-y-3 p-3.5 rounded-xl border border-slate-800 bg-navy-950/60">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Page Name *</label>
                <input
                  type="text"
                  placeholder="Apex Global Bank Careers & Talent"
                  value={pageName}
                  onChange={(e) => setPageName(e.target.value)}
                  className="w-full bg-navy-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-shield-orange"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Company Page URL *</label>
                <input
                  type="text"
                  placeholder="https://linkedin.com/company/apex-bank-hiring-now"
                  value={pageUrl}
                  onChange={(e) => setPageUrl(e.target.value)}
                  className="w-full bg-navy-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-shield-orange font-mono"
                  required
                />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Contact Email Listed</label>
                <input
                  type="email"
                  placeholder="apexbank.talent@gmail.com"
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                  className="w-full bg-navy-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-shield-orange font-mono"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Claimed Recruiter Name</label>
                <input
                  type="text"
                  placeholder="David Sterling (Head of Remote Hiring)"
                  value={recruiterName}
                  onChange={(e) => setRecruiterName(e.target.value)}
                  className="w-full bg-navy-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-shield-orange"
                />
              </div>
            </div>
          </div>
        )}

        {/* Live Multi-Agent Execution Progress */}
        {isScanning && (
          <div className="p-4 rounded-xl border border-shield-cyan/30 bg-shield-cyan/5 text-xs text-shield-cyan space-y-2">
            <div className="flex items-center gap-2 font-mono font-semibold">
              <Cpu className="w-4 h-4 animate-spin text-shield-cyan" />
              <span>Multi-Agent Threat Intelligence Pipeline Active...</span>
            </div>
            <p className="text-[11px] text-slate-300 font-mono pl-6">{agentStep}</p>
          </div>
        )}

        {errorMsg && (
          <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Footer Actions */}
        <div className="flex justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            disabled={isScanning}
            className="px-4 py-2 rounded-xl border border-slate-800 hover:bg-slate-800 text-xs text-slate-300 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isScanning}
            className="flex items-center gap-2 px-5 py-2 rounded-xl bg-gradient-to-r from-shield-orange to-amber-600 hover:brightness-110 active:scale-95 text-white text-xs font-semibold shadow-glow-orange transition-all disabled:opacity-50"
          >
            <SearchCode className="w-4 h-4" />
            <span>{isScanning ? 'Running Investigation...' : 'Execute Multi-Agent Audit'}</span>
          </button>
        </div>
      </form>
    </Modal>
  );
};
