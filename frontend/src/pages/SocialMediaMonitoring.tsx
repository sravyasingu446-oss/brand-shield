import React, { useState } from 'react';
import { Brand, InvestigationCase } from '../types';
import { api } from '../services/api';
import { RiskBadge } from '../components/common/RiskBadge';
import { StatusPill } from '../components/common/StatusPill';
import { 
  Share2, 
  SearchCode, 
  AlertTriangle, 
  CheckCircle, 
  ExternalLink,
  ShieldAlert,
  Users,
  BadgeCheck,
  Cpu
} from 'lucide-react';

interface SocialMediaMonitoringProps {
  brands: Brand[];
  cases: InvestigationCase[];
  onSelectCase: (c: InvestigationCase) => void;
  onNewCaseAdded: (newCase: InvestigationCase) => void;
}

export const SocialMediaMonitoring: React.FC<SocialMediaMonitoringProps> = ({
  brands,
  cases,
  onSelectCase,
  onNewCaseAdded,
}) => {
  const [selectedBrandId, setSelectedBrandId] = useState<number>(brands[0]?.id || 1);
  const [platform, setPlatform] = useState('TWITTER');
  const [handle, setHandle] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const [followerCount, setFollowerCount] = useState<number>(65);
  const [isVerified, setIsVerified] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState('');

  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const handleScanSocial = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    setIsAnalyzing(true);
    try {
      const cleanHandle = handle.startsWith('@') ? handle : `@${handle}`;
      const res = await api.analyzeSocial({
        brand_id: selectedBrandId,
        platform,
        profile_url: `https://${platform.toLowerCase()}.com/${cleanHandle.replace('@', '')}`,
        handle: cleanHandle,
        display_name: displayName,
        bio: bio || undefined,
        follower_count: followerCount,
        is_verified: isVerified,
        avatar_url: avatarUrl || undefined,
        recent_posts: ['Urgent: Account security update required. Click link below to avoid suspension.']
      });

      const fullCase = await api.getCaseDetail(res.case_id);
      onNewCaseAdded(fullCase);
      setSuccessMsg(`Investigation complete! Assigned ${fullCase.risk_level} Risk (${fullCase.risk_score}/100). Case file ${fullCase.case_number} created.`);
      setHandle('');
      setDisplayName('');
      setBio('');
    } catch (err: any) {
      setErrorMsg(err.message || 'Social media analysis failed.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const socialCases = cases.filter(c => c.target_type === 'SOCIAL_PROFILE');

  return (
    <div className="space-y-6">
      {/* Top Banner & Scanner Form Card */}
      <div className="rounded-2xl border border-slate-800/80 bg-navy-900/90 p-6 shadow-card">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2.5 rounded-xl bg-shield-orange/10 text-shield-orange border border-shield-orange/20">
            <Share2 className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white tracking-tight">Social Media Impersonation Scanner</h3>
            <p className="text-xs text-slate-400">
              Audit public profiles against protected brand registries for username typosquatting, authority mimicry, and social engineering
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

        <form onSubmit={handleScanSocial} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Protected Brand Registry</label>
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
              <label className="block text-xs font-medium text-slate-400 mb-1">Platform</label>
              <select
                value={platform}
                onChange={(e) => setPlatform(e.target.value)}
                className="w-full bg-navy-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-shield-orange"
              >
                <option value="TWITTER">Twitter / X</option>
                <option value="LINKEDIN">LinkedIn</option>
                <option value="INSTAGRAM">Instagram</option>
                <option value="TELEGRAM">Telegram</option>
                <option value="FACEBOOK">Facebook</option>
                <option value="YOUTUBE">YouTube</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Suspicious Handle *</label>
              <input
                type="text"
                placeholder="@apexbank_support"
                value={handle}
                onChange={(e) => setHandle(e.target.value)}
                className="w-full bg-navy-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-shield-orange font-mono"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Profile Display Name *</label>
              <input
                type="text"
                placeholder="Apex Bank Official Helpdesk"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="w-full bg-navy-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-shield-orange"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Follower Count</label>
              <input
                type="number"
                value={followerCount}
                onChange={(e) => setFollowerCount(Number(e.target.value))}
                className="w-full bg-navy-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-shield-orange font-mono"
              />
            </div>
            <div className="flex items-center pt-6">
              <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isVerified}
                  onChange={(e) => setIsVerified(e.target.checked)}
                  className="rounded border-slate-800 bg-navy-950 text-shield-orange focus:ring-0"
                />
                <BadgeCheck className="w-4 h-4 text-shield-cyan" />
                <span>Account has verified badge</span>
              </label>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">Bio / About Text</label>
            <textarea
              rows={2}
              placeholder="Official 24/7 customer escalations channel for Apex Bank. DM directly or click link for resolution: https://wa.me/..."
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              className="w-full bg-navy-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-shield-orange"
            />
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={isAnalyzing}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-shield-orange hover:bg-shield-orange/90 text-white text-xs font-semibold shadow-glow-orange disabled:opacity-50 transition-all"
            >
              <SearchCode className="w-4 h-4" />
              <span>{isAnalyzing ? 'Auditing Social Profile...' : 'Execute Profile Investigation'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* Social Impersonation Cases List */}
      <div className="rounded-2xl border border-slate-800/80 bg-navy-900/90 p-5 shadow-card">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h4 className="text-sm font-bold text-white tracking-tight">Social Profile Impersonation Cases</h4>
            <p className="text-xs text-slate-400">Cases flagged by Social Media Agent & Impersonation Agent</p>
          </div>
          <span className="text-xs font-mono text-slate-400 font-semibold">
            {socialCases.length} Cases Documented
          </span>
        </div>

        <div className="overflow-x-auto rounded-xl border border-slate-800">
          <table className="w-full text-left text-xs">
            <thead className="bg-navy-950 text-slate-400 uppercase text-[10px] border-b border-slate-800">
              <tr>
                <th className="py-2.5 px-3">Case ID</th>
                <th className="py-2.5 px-3">Target Handle</th>
                <th className="py-2.5 px-3">Protected Brand</th>
                <th className="py-2.5 px-3">Threat Category</th>
                <th className="py-2.5 px-3">Risk Rating</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3 text-right">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80 font-normal">
              {socialCases.map((c) => (
                <tr
                  key={c.id}
                  onClick={() => onSelectCase(c)}
                  className="hover:bg-slate-800/40 cursor-pointer transition-colors group"
                >
                  <td className="py-2.5 px-3 font-mono font-semibold text-shield-cyan">{c.case_number}</td>
                  <td className="py-2.5 px-3">
                    <div className="font-semibold text-white">{c.target_name}</div>
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
                    <button className="px-2.5 py-1 rounded-lg bg-slate-800 group-hover:bg-shield-orange/20 group-hover:text-shield-orange text-slate-300 text-xs transition-colors">
                      View File
                    </button>
                  </td>
                </tr>
              ))}
              {socialCases.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400 text-xs">
                    No social media cases analyzed yet. Use the scanner above to investigate an account.
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
