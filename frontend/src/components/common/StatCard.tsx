import React from 'react';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
  trend?: {
    value: string;
    isPositive?: boolean;
  };
  accentColor?: 'orange' | 'cyan' | 'red' | 'amber' | 'emerald' | 'blue';
  onClick?: () => void;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  icon,
  trend,
  accentColor = 'cyan',
  onClick
}) => {
  const colorMap = {
    orange: 'text-shield-orange border-shield-orange/20 bg-shield-orange/5 group-hover:border-shield-orange/40',
    cyan: 'text-shield-cyan border-shield-cyan/20 bg-shield-cyan/5 group-hover:border-shield-cyan/40',
    red: 'text-red-400 border-red-500/20 bg-red-500/5 group-hover:border-red-500/40',
    amber: 'text-amber-400 border-amber-500/20 bg-amber-500/5 group-hover:border-amber-500/40',
    emerald: 'text-emerald-400 border-emerald-500/20 bg-emerald-500/5 group-hover:border-emerald-500/40',
    blue: 'text-blue-400 border-blue-500/20 bg-blue-500/5 group-hover:border-blue-500/40',
  };

  return (
    <div 
      onClick={onClick}
      className={`group relative overflow-hidden rounded-xl border border-slate-800/80 bg-navy-900/90 p-5 shadow-card transition-all duration-300 hover:border-slate-700 hover:bg-navy-850 ${
        onClick ? 'cursor-pointer' : ''
      }`}
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium uppercase tracking-wider text-slate-400">{title}</span>
        <div className={`rounded-lg border p-2.5 transition-colors ${colorMap[accentColor]}`}>
          {icon}
        </div>
      </div>

      <div className="mt-4 flex items-baseline justify-between">
        <div className="text-2xl font-bold tracking-tight text-white font-mono">{value}</div>
        {trend && (
          <div className={`text-xs font-medium ${trend.isPositive ? 'text-red-400' : 'text-emerald-400'}`}>
            {trend.value}
          </div>
        )}
      </div>

      {subtitle && (
        <p className="mt-1 text-xs text-slate-400 truncate">{subtitle}</p>
      )}

      {/* Subtle top glow line */}
      <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-current to-transparent opacity-0 transition-opacity group-hover:opacity-40" />
    </div>
  );
};
