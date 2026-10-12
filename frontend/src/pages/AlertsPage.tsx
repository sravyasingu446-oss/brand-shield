import React, { useState } from 'react';
import { Alert, InvestigationCase } from '../types';
import { api } from '../services/api';
import { 
  BellRing, 
  CheckCheck, 
  Eye, 
  Trash2, 
  AlertTriangle, 
  ShieldAlert, 
  Filter,
  CheckCircle,
  ExternalLink
} from 'lucide-react';

interface AlertsPageProps {
  alerts: Alert[];
  onSelectCaseById: (caseId: number) => void;
  onRefreshAlerts: () => void;
}

export const AlertsPage: React.FC<AlertsPageProps> = ({
  alerts,
  onSelectCaseById,
  onRefreshAlerts,
}) => {
  const [severityFilter, setSeverityFilter] = useState<string>('ALL');
  const [unreadOnly, setUnreadOnly] = useState(false);

  const handleMarkRead = async (alertId: number) => {
    try {
      await api.markAlertRead(alertId);
      onRefreshAlerts();
    } catch (err: any) {
      alert(err.message || 'Failed to mark read.');
    }
  };

  const handleDismiss = async (alertId: number) => {
    try {
      await api.dismissAlert(alertId);
      onRefreshAlerts();
    } catch (err: any) {
      alert(err.message || 'Failed to dismiss.');
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await api.markAllAlertsRead();
      onRefreshAlerts();
    } catch (err: any) {
      alert(err.message || 'Failed to mark all read.');
    }
  };

  const filteredAlerts = alerts.filter((a) => {
    if (severityFilter !== 'ALL' && a.severity !== severityFilter) return false;
    if (unreadOnly && a.is_read) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Action Header */}
      <div className="rounded-2xl border border-slate-800/80 bg-navy-900/90 p-5 shadow-card flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
            <BellRing className="w-5 h-5 text-shield-orange" />
            <span>Real-Time Security Incident Alerts</span>
          </h3>
          <p className="text-xs text-slate-400">
            Automated alerts dispatched when suspicious assets exceed risk thresholds
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleMarkAllRead}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-800 bg-navy-950 hover:bg-slate-800 text-slate-200 text-xs font-semibold transition-colors"
          >
            <CheckCheck className="w-4 h-4 text-emerald-400" />
            <span>Mark All Read</span>
          </button>
        </div>
      </div>

      {/* Filter Chips Bar */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs text-slate-400 mr-2 flex items-center gap-1">
          <Filter className="w-3.5 h-3.5" />
          Filter:
        </span>
        {['ALL', 'CRITICAL', 'HIGH', 'MEDIUM', 'LOW'].map((sev) => (
          <button
            key={sev}
            onClick={() => setSeverityFilter(sev)}
            className={`px-3 py-1 rounded-xl text-xs font-medium transition-all ${
              severityFilter === sev
                ? 'bg-shield-orange text-white font-semibold shadow-glow-orange/20'
                : 'bg-navy-900 border border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            {sev}
          </button>
        ))}

        <div className="ml-auto flex items-center">
          <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
            <input
              type="checkbox"
              checked={unreadOnly}
              onChange={(e) => setUnreadOnly(e.target.checked)}
              className="rounded border-slate-800 bg-navy-950 text-shield-orange focus:ring-0"
            />
            <span>Unread alerts only</span>
          </label>
        </div>
      </div>

      {/* Alerts Feed */}
      <div className="space-y-3">
        {filteredAlerts.map((a) => {
          const isCritical = a.severity === 'CRITICAL';
          const isHigh = a.severity === 'HIGH';
          return (
            <div
              key={a.id}
              className={`p-4 rounded-2xl border transition-all ${
                !a.is_read
                  ? isCritical 
                    ? 'border-red-500/40 bg-red-950/20 shadow-glow-danger/10'
                    : isHigh
                    ? 'border-amber-500/40 bg-amber-950/20 shadow-glow-orange/10'
                    : 'border-slate-700 bg-navy-850/80'
                  : 'border-slate-800/80 bg-navy-900/60 opacity-80'
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full ${
                      isCritical ? 'bg-red-500/20 text-red-400 border border-red-500/40' :
                      isHigh ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40' :
                      'bg-slate-700/30 text-slate-300'
                    }`}>
                      {a.severity}
                    </span>
                    <span className="text-xs font-mono text-shield-cyan">{a.brand_name}</span>
                    {a.case_number && (
                      <span className="text-xs font-mono text-slate-400 font-semibold">{a.case_number}</span>
                    )}
                    {!a.is_read && (
                      <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
                    )}
                  </div>
                  <h4 className="text-sm font-bold text-white tracking-tight">{a.title}</h4>
                  <p className="text-xs text-slate-300 max-w-3xl">{a.message}</p>
                </div>

                {/* Alert Actions */}
                <div className="flex items-center gap-2 shrink-0 pt-2 sm:pt-0">
                  {a.case_id && (
                    <button
                      onClick={() => onSelectCaseById(a.case_id!)}
                      className="px-3 py-1.5 rounded-xl bg-shield-orange/20 border border-shield-orange/40 hover:bg-shield-orange/30 text-shield-orange text-xs font-semibold transition-colors flex items-center gap-1"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Investigate</span>
                    </button>
                  )}
                  {!a.is_read && (
                    <button
                      onClick={() => handleMarkRead(a.id)}
                      className="px-2.5 py-1.5 rounded-xl border border-slate-800 bg-navy-950 hover:bg-slate-800 text-slate-300 text-xs transition-colors"
                      title="Mark as read"
                    >
                      <CheckCircle className="w-3.5 h-3.5" />
                    </button>
                  )}
                  <button
                    onClick={() => handleDismiss(a.id)}
                    className="p-1.5 rounded-xl border border-slate-800 bg-navy-950 hover:border-red-500/40 text-slate-400 hover:text-red-400 transition-colors"
                    title="Dismiss alert"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}

        {filteredAlerts.length === 0 && (
          <div className="rounded-2xl border border-slate-800 bg-navy-900/60 p-12 text-center text-slate-400 text-xs">
            No incident alerts match your active filter.
          </div>
        )}
      </div>
    </div>
  );
};
