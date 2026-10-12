import React from 'react';
import { PageId } from './Sidebar';
import { Brand } from '../../types';
import { BellRing, Plus, ShieldCheck, Filter, Sparkles } from 'lucide-react';

interface HeaderProps {
  currentPage: PageId;
  brands: Brand[];
  selectedBrandId?: number;
  onSelectBrand: (brandId?: number) => void;
  onOpenQuickScan: () => void;
  unreadAlertsCount: number;
  onOpenAlerts: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentPage,
  brands,
  selectedBrandId,
  onSelectBrand,
  onOpenQuickScan,
  unreadAlertsCount,
  onOpenAlerts,
}) => {
  const pageTitles: Record<PageId, { title: string; subtitle: string }> = {
    dashboard: { title: 'Overview Dashboard', subtitle: 'Live telemetry, threat distribution, and risk scoring statistics' },
    brands: { title: 'Brand Profiles', subtitle: 'Manage protected corporate assets, domains, handles, and official apps' },
    social: { title: 'Social Media Monitoring', subtitle: 'Audit suspicious public accounts, impersonator handles, and pretexting' },
    mobile: { title: 'Mobile App Monitoring', subtitle: 'Inspect unauthorized APK listings, package typosquatting, and permission abuse' },
    urls: { title: 'URL Scanner', subtitle: 'Analyze phishing indicators, combosquatting, and credential harvesting forms' },
    investigations: { title: 'Investigation Center', subtitle: 'Comprehensive triage cases, IOC evidence ledger, and human review' },
    alerts: { title: 'Security Incident Alerts', subtitle: 'High-severity impersonation alerts and incident triage dispatch' },
    reports: { title: 'Investigation Reports', subtitle: 'Executive incident briefings and cryptographically sealed PDF exports' },
    settings: { title: 'System Settings', subtitle: 'Gemini AI multi-agent orchestration, risk thresholds, and synthetic demo data' },
  };

  const currentInfo = pageTitles[currentPage] || { title: 'BrandShield AI', subtitle: 'Digital Risk Protection' };

  return (
    <header className="h-16 border-b border-slate-800 bg-navy-900/90 backdrop-blur sticky top-0 z-20 px-8 flex items-center justify-between">
      {/* Title & Subtitle */}
      <div>
        <h1 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
          <span>{currentInfo.title}</span>
        </h1>
        <p className="text-xs text-slate-400 hidden sm:block">{currentInfo.subtitle}</p>
      </div>

      {/* Header Actions */}
      <div className="flex items-center gap-3">
        {/* Brand Filter Dropdown */}
        <div className="flex items-center gap-1.5 bg-navy-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-300">
          <Filter className="w-3.5 h-3.5 text-shield-cyan" />
          <span className="text-slate-400 font-medium">Brand:</span>
          <select
            value={selectedBrandId || ''}
            onChange={(e) => onSelectBrand(e.target.value ? Number(e.target.value) : undefined)}
            className="bg-transparent text-white font-medium focus:outline-none cursor-pointer text-xs"
          >
            <option value="" className="bg-navy-900 text-slate-200">All Registered Brands</option>
            {brands.map((b) => (
              <option key={b.id} value={b.id} className="bg-navy-900 text-slate-200">
                {b.name}
              </option>
            ))}
          </select>
        </div>

        {/* Alerts Bell */}
        <button
          onClick={onOpenAlerts}
          className="relative p-2 rounded-xl border border-slate-800 bg-navy-950 text-slate-300 hover:text-white hover:border-slate-700 transition-colors"
          title="View Incident Alerts"
        >
          <BellRing className="w-4 h-4" />
          {unreadAlertsCount > 0 && (
            <span className="absolute -top-1 -right-1 flex h-4 min-w-[16px] px-1 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white shadow-glow-danger font-mono">
              {unreadAlertsCount}
            </span>
          )}
        </button>

        {/* Quick Launch Investigation */}
        <button
          onClick={onOpenQuickScan}
          className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-shield-orange to-amber-600 text-white text-xs font-semibold shadow-glow-orange hover:brightness-110 active:scale-95 transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>New Investigation</span>
        </button>
      </div>
    </header>
  );
};
