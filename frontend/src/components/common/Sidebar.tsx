import React from 'react';
import { 
  LayoutDashboard, 
  Building2, 
  Share2, 
  Smartphone, 
  Globe2, 
  SearchCode, 
  BellRing, 
  FileText, 
  Sliders, 
  ShieldAlert,
  Cpu,
  Radio
} from 'lucide-react';

export type PageId = 
  | 'dashboard' 
  | 'brands' 
  | 'social' 
  | 'mobile' 
  | 'urls' 
  | 'investigations' 
  | 'alerts' 
  | 'reports' 
  | 'settings';

interface SidebarProps {
  currentPage: PageId;
  onSelectPage: (page: PageId) => void;
  unreadAlertsCount?: number;
  activeAgentsCount?: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentPage,
  onSelectPage,
  unreadAlertsCount = 0,
  activeAgentsCount = 13,
}) => {
  const navItems: { id: PageId; label: string; icon: React.ReactNode; badge?: number }[] = [
    { id: 'dashboard', label: 'Overview Dashboard', icon: <LayoutDashboard className="w-4 h-4" /> },
    { id: 'brands', label: 'Brand Profiles', icon: <Building2 className="w-4 h-4" /> },
    { id: 'social', label: 'Social Media Monitoring', icon: <Share2 className="w-4 h-4" /> },
    { id: 'mobile', label: 'Mobile App Monitoring', icon: <Smartphone className="w-4 h-4" /> },
    { id: 'urls', label: 'URL Scanner', icon: <Globe2 className="w-4 h-4" /> },
    { id: 'investigations', label: 'Investigation Center', icon: <SearchCode className="w-4 h-4" /> },
    { id: 'alerts', label: 'Alerts', icon: <BellRing className="w-4 h-4" />, badge: unreadAlertsCount },
    { id: 'reports', label: 'Reports', icon: <FileText className="w-4 h-4" /> },
    { id: 'settings', label: 'Settings', icon: <Sliders className="w-4 h-4" /> },
  ];

  return (
    <aside className="fixed left-0 top-0 bottom-0 w-64 border-r border-slate-800 bg-navy-950 flex flex-col z-30">
      {/* Brand Header */}
      <div className="h-16 flex items-center px-6 border-b border-slate-800/80 gap-3 bg-navy-950">
        <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-shield-orange to-red-600 shadow-glow-orange text-white">
          <ShieldAlert className="w-6 h-6" />
        </div>
        <div>
          <div className="font-bold text-base tracking-tight text-white flex items-center gap-1.5">
            <span>BrandShield</span>
            <span className="text-shield-cyan text-xs font-mono font-bold px-1 py-0.5 rounded bg-shield-cyan/10 border border-shield-cyan/30">AI</span>
          </div>
          <p className="text-[10px] uppercase font-mono tracking-wider text-slate-400">Digital Risk Protection</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        <div className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
          Core Platform
        </div>
        {navItems.map((item) => {
          const isActive = currentPage === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSelectPage(item.id)}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all duration-200 group ${
                isActive
                  ? 'bg-shield-orange/10 text-white font-semibold border border-shield-orange/30 shadow-glow-orange/20'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
              }`}
            >
              <div className="flex items-center gap-3">
                <span className={`transition-colors ${isActive ? 'text-shield-orange' : 'text-slate-400 group-hover:text-slate-300'}`}>
                  {item.icon}
                </span>
                <span>{item.label}</span>
              </div>
              {item.badge !== undefined && item.badge > 0 && (
                <span className="px-2 py-0.5 text-[10px] font-mono font-bold rounded-full bg-red-500/20 text-red-400 border border-red-500/30 animate-pulse">
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Agent Telemetry System Widget */}
      <div className="p-4 border-t border-slate-800/80 bg-navy-900/40">
        <div className="p-3 rounded-xl border border-slate-800/80 bg-navy-950/70">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium text-slate-300 flex items-center gap-1.5">
              <Cpu className="w-3.5 h-3.5 text-shield-cyan" />
              <span>Multi-Agent Core</span>
            </span>
            <span className="flex items-center gap-1 text-[10px] text-emerald-400 font-mono font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
              LIVE
            </span>
          </div>
          <div className="mt-2 flex items-center justify-between text-[11px] text-slate-400">
            <span>Specialist Agents:</span>
            <span className="font-mono font-bold text-white">{activeAgentsCount} Active</span>
          </div>
          <div className="mt-1 flex items-center justify-between text-[11px] text-slate-400">
            <span>Architecture:</span>
            <span className="font-mono text-shield-cyan text-[10px]">Modular Pipeline</span>
          </div>
        </div>
      </div>
    </aside>
  );
};
