import React from 'react';
import { RiskLevel } from '../../types';
import { ShieldAlert, AlertTriangle, ShieldCheck } from 'lucide-react';

interface RiskBadgeProps {
  level: RiskLevel | string;
  score?: number;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
}

export const RiskBadge: React.FC<RiskBadgeProps> = ({ 
  level, 
  score, 
  size = 'md',
  showIcon = true 
}) => {
  const normLevel = (level || 'LOW').toUpperCase();

  const getStyle = () => {
    switch (normLevel) {
      case 'HIGH':
        return {
          bg: 'bg-red-500/10 border-red-500/30 text-red-400',
          dot: 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.6)]',
          icon: <ShieldAlert className={size === 'sm' ? 'w-3 h-3' : 'w-4 h-4'} />,
          label: 'High Risk'
        };
      case 'MEDIUM':
        return {
          bg: 'bg-amber-500/10 border-amber-500/30 text-amber-400',
          dot: 'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.6)]',
          icon: <AlertTriangle className={size === 'sm' ? 'w-3 h-3' : 'w-4 h-4'} />,
          label: 'Medium Risk'
        };
      case 'LOW':
      default:
        return {
          bg: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400',
          dot: 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]',
          icon: <ShieldCheck className={size === 'sm' ? 'w-3 h-3' : 'w-4 h-4'} />,
          label: 'Low Risk'
        };
    }
  };

  const style = getStyle();
  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5 gap-1.5',
    md: 'text-xs font-medium px-2.5 py-1 gap-2',
    lg: 'text-sm font-semibold px-3 py-1.5 gap-2.5',
  }[size];

  return (
    <span className={`inline-flex items-center rounded-full border ${style.bg} ${sizeClasses}`}>
      {showIcon && style.icon}
      <span>{style.label}</span>
      {score !== undefined && (
        <span className="font-mono px-1.5 py-0.2 rounded bg-navy-950/60 text-[11px] font-bold border border-current/20">
          {score}/100
        </span>
      )}
    </span>
  );
};
