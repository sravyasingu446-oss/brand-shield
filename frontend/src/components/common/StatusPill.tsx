import React from 'react';
import { CaseStatus } from '../../types';
import { Clock, Eye, Ban, CheckCircle, Archive, AlertCircle } from 'lucide-react';

interface StatusPillProps {
  status: CaseStatus | string;
}

export const StatusPill: React.FC<StatusPillProps> = ({ status }) => {
  const normStatus = (status || 'NEW').toUpperCase();

  const getConfig = () => {
    switch (normStatus) {
      case 'NEW':
        return {
          bg: 'bg-shield-cyan/10 border-shield-cyan/30 text-shield-cyan',
          icon: <AlertCircle className="w-3 h-3" />,
          label: 'New'
        };
      case 'IN_REVIEW':
        return {
          bg: 'bg-amber-500/10 border-amber-500/30 text-amber-400',
          icon: <Eye className="w-3 h-3" />,
          label: 'In Review'
        };
      case 'CONFIRMED_IMPERSONATION':
        return {
          bg: 'bg-red-500/10 border-red-500/30 text-red-400',
          icon: <Ban className="w-3 h-3" />,
          label: 'Confirmed Impersonation'
        };
      case 'FALSE_POSITIVE':
        return {
          bg: 'bg-slate-500/10 border-slate-500/30 text-slate-300',
          icon: <Archive className="w-3 h-3" />,
          label: 'False Positive'
        };
      case 'RESOLVED':
        return {
          bg: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400',
          icon: <CheckCircle className="w-3 h-3" />,
          label: 'Resolved'
        };
      case 'CLOSED':
      default:
        return {
          bg: 'bg-slate-700/20 border-slate-700/40 text-slate-400',
          icon: <Clock className="w-3 h-3" />,
          label: 'Closed'
        };
    }
  };

  const config = getConfig();

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border ${config.bg}`}>
      {config.icon}
      <span>{config.label}</span>
    </span>
  );
};
