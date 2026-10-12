import React from 'react';
import { DashboardStats, InvestigationCase, Alert } from '../types';
import { StatCard } from '../components/common/StatCard';
import { RiskBadge } from '../components/common/RiskBadge';
import { StatusPill } from '../components/common/StatusPill';
import { 
  ShieldAlert, 
  AlertTriangle, 
  ShieldCheck, 
  Building2, 
  BellRing, 
  Globe2, 
  Share2, 
  Smartphone, 
  Cpu, 
  ArrowRight,
  ExternalLink,
  Activity,
  Layers
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  Tooltip, 
  BarChart, 
  Bar, 
  Cell 
} from 'recharts';

interface OverviewDashboardProps {
  stats: DashboardStats | null;
  recentCases: InvestigationCase[];
  recentAlerts: Alert[];
  onSelectCase: (c: InvestigationCase) => void;
  onOpenQuickScan: () => void;
  onNavigateTo: (page: any) => void;
}

export const OverviewDashboard: React.FC<OverviewDashboardProps> = ({
  stats,
  recentCases,
  recentAlerts,
  onSelectCase,
  onOpenQuickScan,
  onNavigateTo,
}) => {
  if (!stats) {
    return (
      <div className="flex items-center justify-center h-96 text-slate-400 font-mono text-xs">
        <Activity className="w-5 h-5 animate-spin mr-2 text-shield-cyan" />
        Loading BrandShield telemetry...
      </div>
    );
  }

  const categoryColors = ['#FF6B00', '#00D4FF', '#EF4444', '#F59E0B', '#10B981', '#6366F1'];

  return (
    <div className="space-y-6">
      {/* Top Threat Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Investigations"
          value={stats.total_cases}
          subtitle={`${stats.suspicious_urls} URLs, ${stats.suspicious_social_profiles} Profiles`}
          icon={<Layers className="w-5 h-5" />}
          accentColor="blue"
          onClick={() => onNavigateTo('investigations')}
        />
        <StatCard
          title="High-Risk Impersonations"
          value={stats.high_risk_cases}
          subtitle="Score >= 70 (Requires Takedown)"
          icon={<ShieldAlert className="w-5 h-5" />}
          accentColor="red"
          onClick={() => onNavigateTo('investigations')}
        />
        <StatCard
          title="Medium-Risk Suspects"
          value={stats.medium_risk_cases}
          subtitle="Score 40-69 (Under Triage)"
          icon={<AlertTriangle className="w-5 h-5" />}
          accentColor="amber"
          onClick={() => onNavigateTo('investigations')}
        />
        <StatCard
          title="Critical Alerts Active"
          value={stats.open_alerts}
          subtitle="Real-time SecOps notifications"
          icon={<BellRing className="w-5 h-5" />}
          accentColor="orange"
          onClick={() => onNavigateTo('alerts')}
        />
      </div>

      {/* Threat Distribution & Risk Trend Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Trend Area Chart (7 Columns) */}
        <div className="lg:col-span-7 rounded-2xl border border-slate-800/80 bg-navy-900/90 p-5 shadow-card">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-white tracking-tight flex items-center gap-2">
                <Activity className="w-4 h-4 text-shield-cyan" />
                <span>7-Day Threat Activity & Risk Trend</span>
              </h3>
              <p className="text-xs text-slate-400">Automated classification across all monitored vectors</p>
            </div>
            <div className="flex items-center gap-3 text-xs font-mono">
              <span className="flex items-center gap-1 text-red-400">
                <span className="w-2 h-2 rounded-full bg-red-500" /> High
              </span>
              <span className="flex items-center gap-1 text-amber-400">
                <span className="w-2 h-2 rounded-full bg-amber-500" /> Medium
              </span>
              <span className="flex items-center gap-1 text-emerald-400">
                <span className="w-2 h-2 rounded-full bg-emerald-500" /> Low
              </span>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={stats.risk_trend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorHigh" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#EF4444" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#EF4444" stopOpacity={0.0}/>
                  </linearGradient>
                  <linearGradient id="colorMed" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#F59E0B" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#F59E0B" stopOpacity={0.0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="date" stroke="#64748B" fontSize={11} tickLine={false} />
                <YAxis stroke="#64748B" fontSize={11} tickLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0B1120', borderColor: '#334155', borderRadius: '0.75rem', fontSize: '12px' }}
                  itemStyle={{ color: '#F8FAFC' }}
                />
                <Area type="monotone" dataKey="high" stroke="#EF4444" strokeWidth={2} fillOpacity={1} fill="url(#colorHigh)" name="High Risk" />
                <Area type="monotone" dataKey="medium" stroke="#F59E0B" strokeWidth={2} fillOpacity={1} fill="url(#colorMed)" name="Medium Risk" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Threat Distribution Bar Chart (5 Columns) */}
        <div className="lg:col-span-5 rounded-2xl border border-slate-800/80 bg-navy-900/90 p-5 shadow-card">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-white tracking-tight flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-shield-orange" />
                <span>Threat Category Distribution</span>
              </h3>
              <p className="text-xs text-slate-400">Classified digital impersonation methods</p>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.threat_distribution} layout="vertical" margin={{ top: 5, right: 20, left: 20, bottom: 5 }}>
                <XAxis type="number" stroke="#64748B" fontSize={11} tickLine={false} />
                <YAxis dataKey="category" type="category" stroke="#94A3B8" fontSize={10} width={100} tickLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0B1120', borderColor: '#334155', borderRadius: '0.75rem', fontSize: '12px' }}
                  itemStyle={{ color: '#F8FAFC' }}
                  formatter={(val: any) => [`${val} cases`, 'Volume']}
                />
                <Bar dataKey="count" radius={[0, 6, 6, 0]}>
                  {stats.threat_distribution.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={categoryColors[index % categoryColors.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Active Multi-Agent Orchestration Telemetry Grid */}
      <div className="rounded-2xl border border-slate-800/80 bg-navy-900/90 p-5 shadow-card">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-shield-cyan/10 text-shield-cyan border border-shield-cyan/20">
              <Cpu className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white tracking-tight">Multi-Agent Intelligence Network</h3>
              <p className="text-xs text-slate-400">{stats.active_agent_count} specialist agents running deterministic & cognitive heuristics</p>
            </div>
          </div>
          <span className="text-xs font-mono font-bold text-emerald-400 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            All Agents Operational
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {stats.agent_statuses.map((ag, idx) => (
            <div key={idx} className="p-3 rounded-xl border border-slate-800/80 bg-navy-950/70 hover:border-slate-700 transition-all">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-semibold text-white truncate">{ag.name}</span>
                <span className="text-[10px] font-mono text-emerald-400 font-bold bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
                  {ag.status}
                </span>
              </div>
              <div className="text-[11px] text-slate-400 truncate">{ag.checks}</div>
              <div className="mt-2 flex items-center justify-between text-[10px] text-slate-400 font-mono">
                <span>{ag.type}</span>
                <span className="text-shield-cyan">{ag.latency_ms}ms</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Investigations & Alerts Lower Row */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Recent Cases (8 Columns) */}
        <div className="lg:col-span-8 rounded-2xl border border-slate-800/80 bg-navy-900/90 p-5 shadow-card">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-white tracking-tight">Recent Digital Investigations</h3>
              <p className="text-xs text-slate-400">Live triage feed of detected brand risks</p>
            </div>
            <button
              onClick={() => onNavigateTo('investigations')}
              className="text-xs text-shield-cyan hover:underline flex items-center gap-1 font-medium"
            >
              <span>View All ({stats.total_cases})</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-navy-950 text-slate-400 uppercase text-[10px] border-b border-slate-800">
                <tr>
                  <th className="py-2.5 px-3">Case ID</th>
                  <th className="py-2.5 px-3">Protected Brand</th>
                  <th className="py-2.5 px-3">Target Suspicious Asset</th>
                  <th className="py-2.5 px-3">Risk Rating</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80 font-normal">
                {recentCases.slice(0, 6).map((c) => (
                  <tr 
                    key={c.id} 
                    onClick={() => onSelectCase(c)}
                    className="hover:bg-slate-800/40 cursor-pointer transition-colors group"
                  >
                    <td className="py-2.5 px-3 font-mono font-semibold text-shield-cyan">{c.case_number}</td>
                    <td className="py-2.5 px-3 text-white font-medium">{c.brand_name}</td>
                    <td className="py-2.5 px-3 text-slate-300 max-w-xs truncate">
                      <div className="font-medium text-white">{c.target_name}</div>
                      <div className="text-[10px] text-slate-400 font-mono truncate">{c.target_identifier}</div>
                    </td>
                    <td className="py-2.5 px-3">
                      <RiskBadge level={c.risk_level} score={c.risk_score} size="sm" />
                    </td>
                    <td className="py-2.5 px-3">
                      <StatusPill status={c.status} />
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      <button className="px-2 py-1 rounded-lg bg-slate-800 group-hover:bg-shield-orange/20 group-hover:text-shield-orange text-slate-300 text-[11px] font-medium transition-colors">
                        Review
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Live Alerts Stream (4 Columns) */}
        <div className="lg:col-span-4 rounded-2xl border border-slate-800/80 bg-navy-900/90 p-5 shadow-card flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-white tracking-tight">Active Incident Alerts</h3>
              <p className="text-xs text-slate-400">High & Critical incident alerts</p>
            </div>
            <button
              onClick={() => onNavigateTo('alerts')}
              className="text-xs text-shield-cyan hover:underline flex items-center gap-1 font-medium"
            >
              <span>Manage</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-2.5 flex-1 overflow-y-auto">
            {recentAlerts.slice(0, 4).map((a) => (
              <div 
                key={a.id} 
                className="p-3 rounded-xl border border-slate-800 bg-navy-950/70 hover:border-slate-700 transition-colors"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded font-mono ${
                    a.severity === 'CRITICAL' ? 'bg-red-500/20 text-red-400' : 'bg-amber-500/20 text-amber-400'
                  }`}>
                    {a.severity}
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">
                    {new Date(a.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <div className="text-xs font-semibold text-white line-clamp-1">{a.title}</div>
                <p className="text-[11px] text-slate-400 mt-1 line-clamp-2">{a.message}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
