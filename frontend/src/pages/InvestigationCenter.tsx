import React, { useState } from 'react';
import { InvestigationCase, Brand, RiskLevel, TargetType, CaseStatus } from '../types';
import { RiskBadge } from '../components/common/RiskBadge';
import { StatusPill } from '../components/common/StatusPill';
import { 
  SearchCode, 
  Filter, 
  Search, 
  ExternalLink, 
  ArrowUpDown, 
  Layers, 
  ChevronLeft, 
  ChevronRight,
  ShieldAlert,
  FileSpreadsheet
} from 'lucide-react';

interface InvestigationCenterProps {
  cases: InvestigationCase[];
  brands: Brand[];
  onSelectCase: (c: InvestigationCase) => void;
  onRefreshCases: () => void;
}

export const InvestigationCenter: React.FC<InvestigationCenterProps> = ({
  cases,
  brands,
  onSelectCase,
  onRefreshCases,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [brandFilter, setBrandFilter] = useState<string>('ALL');
  const [riskFilter, setRiskFilter] = useState<string>('ALL');
  const [typeFilter, setTypeFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [sortField, setSortField] = useState<'created_at' | 'risk_score' | 'case_number'>('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  // Filter cases client-side
  const filteredCases = cases.filter((c) => {
    // Search
    if (searchTerm.trim()) {
      const s = searchTerm.toLowerCase();
      const match = 
        c.case_number.toLowerCase().includes(s) ||
        c.target_name.toLowerCase().includes(s) ||
        c.target_identifier.toLowerCase().includes(s) ||
        c.brand_name.toLowerCase().includes(s) ||
        c.threat_category.toLowerCase().includes(s);
      if (!match) return false;
    }

    // Brand
    if (brandFilter !== 'ALL' && String(c.brand_id) !== brandFilter) {
      return false;
    }

    // Risk
    if (riskFilter !== 'ALL' && c.risk_level !== riskFilter) {
      return false;
    }

    // Type
    if (typeFilter !== 'ALL' && c.target_type !== typeFilter) {
      return false;
    }

    // Status
    if (statusFilter !== 'ALL' && c.status !== statusFilter) {
      return false;
    }

    return true;
  });

  // Sort cases
  const sortedCases = [...filteredCases].sort((a, b) => {
    if (sortField === 'risk_score') {
      return sortOrder === 'asc' ? a.risk_score - b.risk_score : b.risk_score - a.risk_score;
    }
    if (sortField === 'case_number') {
      return sortOrder === 'asc' ? a.case_number.localeCompare(b.case_number) : b.case_number.localeCompare(a.case_number);
    }
    // created_at
    const dateA = new Date(a.created_at).getTime();
    const dateB = new Date(b.created_at).getTime();
    return sortOrder === 'asc' ? dateA - dateB : dateB - dateA;
  });

  // Pagination
  const totalPages = Math.ceil(sortedCases.length / pageSize) || 1;
  const paginatedCases = sortedCases.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const toggleSort = (field: 'created_at' | 'risk_score' | 'case_number') => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  return (
    <div className="space-y-6">
      {/* Filters & Search Control Card */}
      <div className="rounded-2xl border border-slate-800/80 bg-navy-900/90 p-5 shadow-card space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-bold text-white tracking-tight">Investigation Case Management</h3>
            <p className="text-xs text-slate-400">
              SOC analyst workbench for triaging, evaluating evidence, and recording human verdicts
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-slate-400">
              Showing <b className="text-white">{filteredCases.length}</b> of {cases.length} cases
            </span>
          </div>
        </div>

        {/* Filter Controls Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 pt-2">
          {/* Search Box */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search case, target, brand..."
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
              className="w-full bg-navy-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-shield-orange"
            />
          </div>

          {/* Brand Filter */}
          <div>
            <select
              value={brandFilter}
              onChange={(e) => { setBrandFilter(e.target.value); setCurrentPage(1); }}
              className="w-full bg-navy-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-shield-orange"
            >
              <option value="ALL">All Brands</option>
              {brands.map((b) => (
                <option key={b.id} value={String(b.id)}>{b.name}</option>
              ))}
            </select>
          </div>

          {/* Risk Level Filter */}
          <div>
            <select
              value={riskFilter}
              onChange={(e) => { setRiskFilter(e.target.value); setCurrentPage(1); }}
              className="w-full bg-navy-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-shield-orange"
            >
              <option value="ALL">All Risk Levels</option>
              <option value="HIGH">High Risk (&ge; 70)</option>
              <option value="MEDIUM">Medium Risk (40-69)</option>
              <option value="LOW">Low Risk (0-39)</option>
            </select>
          </div>

          {/* Target Type Filter */}
          <div>
            <select
              value={typeFilter}
              onChange={(e) => { setTypeFilter(e.target.value); setCurrentPage(1); }}
              className="w-full bg-navy-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-shield-orange"
            >
              <option value="ALL">All Target Types</option>
              <option value="PHISHING_URL">Phishing URLs</option>
              <option value="SOCIAL_PROFILE">Social Profiles</option>
              <option value="MOBILE_APP">Mobile Apps</option>
              <option value="FAKE_PAGE">Fake Company Pages</option>
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
              className="w-full bg-navy-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-shield-orange"
            >
              <option value="ALL">All Statuses</option>
              <option value="NEW">NEW</option>
              <option value="IN_REVIEW">IN_REVIEW</option>
              <option value="CONFIRMED_IMPERSONATION">CONFIRMED_IMPERSONATION</option>
              <option value="FALSE_POSITIVE">FALSE_POSITIVE</option>
              <option value="RESOLVED">RESOLVED</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Cases Table */}
      <div className="rounded-2xl border border-slate-800/80 bg-navy-900/90 shadow-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-navy-950 text-slate-400 uppercase text-[10px] border-b border-slate-800">
              <tr>
                <th 
                  onClick={() => toggleSort('case_number')}
                  className="py-3 px-4 cursor-pointer hover:text-white transition-colors"
                >
                  <div className="flex items-center gap-1">
                    <span>Case Number</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th className="py-3 px-4">Type</th>
                <th className="py-3 px-4">Suspicious Target</th>
                <th className="py-3 px-4">Protected Brand</th>
                <th className="py-3 px-4">Threat Category</th>
                <th 
                  onClick={() => toggleSort('risk_score')}
                  className="py-3 px-4 cursor-pointer hover:text-white transition-colors"
                >
                  <div className="flex items-center gap-1">
                    <span>Risk Score</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th className="py-3 px-4">Status</th>
                <th 
                  onClick={() => toggleSort('created_at')}
                  className="py-3 px-4 cursor-pointer hover:text-white transition-colors"
                >
                  <div className="flex items-center gap-1">
                    <span>Date Captured</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80 font-normal">
              {paginatedCases.map((c) => (
                <tr
                  key={c.id}
                  onClick={() => onSelectCase(c)}
                  className="hover:bg-slate-800/40 cursor-pointer transition-colors group"
                >
                  <td className="py-3 px-4 font-mono font-bold text-shield-cyan whitespace-nowrap">
                    {c.case_number}
                  </td>
                  <td className="py-3 px-4">
                    <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-semibold border border-slate-700 whitespace-nowrap">
                      {c.target_type.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="py-3 px-4 max-w-xs">
                    <div className="font-semibold text-white truncate">{c.target_name}</div>
                    <div className="text-[10px] text-slate-400 font-mono truncate">{c.target_identifier}</div>
                  </td>
                  <td className="py-3 px-4 text-slate-200 font-medium whitespace-nowrap">{c.brand_name}</td>
                  <td className="py-3 px-4 text-slate-300 truncate max-w-[180px]">{c.threat_category}</td>
                  <td className="py-3 px-4 whitespace-nowrap">
                    <RiskBadge level={c.risk_level} score={c.risk_score} size="sm" />
                  </td>
                  <td className="py-3 px-4 whitespace-nowrap">
                    <StatusPill status={c.status} />
                  </td>
                  <td className="py-3 px-4 text-slate-400 font-mono text-[11px] whitespace-nowrap">
                    {new Date(c.created_at).toLocaleDateString()}
                  </td>
                  <td className="py-3 px-4 text-right whitespace-nowrap">
                    <button className="px-2.5 py-1 rounded-lg bg-slate-800 group-hover:bg-shield-orange/20 group-hover:text-shield-orange text-slate-300 text-xs transition-colors">
                      Open File
                    </button>
                  </td>
                </tr>
              ))}
              {paginatedCases.length === 0 && (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400 text-xs">
                    No investigation cases match the selected filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        <div className="p-4 border-t border-slate-800 bg-navy-950/60 flex items-center justify-between text-xs text-slate-400">
          <div>
            Page <span className="text-white font-bold">{currentPage}</span> of {totalPages}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-1.5 rounded-lg border border-slate-800 hover:bg-slate-800 text-slate-300 disabled:opacity-40 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="p-1.5 rounded-lg border border-slate-800 hover:bg-slate-800 text-slate-300 disabled:opacity-40 transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
