import React, { useState, useEffect, useCallback } from 'react';
import { Sidebar, PageId } from './components/common/Sidebar';
import { Header } from './components/common/Header';
import { OverviewDashboard } from './pages/OverviewDashboard';
import { BrandProfiles } from './pages/BrandProfiles';
import { SocialMediaMonitoring } from './pages/SocialMediaMonitoring';
import { MobileAppMonitoring } from './pages/MobileAppMonitoring';
import { UrlScanner } from './pages/UrlScanner';
import { InvestigationCenter } from './pages/InvestigationCenter';
import { AlertsPage } from './pages/AlertsPage';
import { ReportsPage } from './pages/ReportsPage';
import { SettingsPage } from './pages/SettingsPage';
import { CaseDetailModal } from './components/investigation/CaseDetailModal';
import { QuickScanModal } from './components/common/QuickScanModal';
import { Brand, InvestigationCase, Alert, DashboardStats } from './types';
import { api } from './services/api';
import { AlertTriangle, RefreshCw } from 'lucide-react';

export function App() {
  const [currentPage, setCurrentPage] = useState<PageId>('dashboard');
  const [brands, setBrands] = useState<Brand[]>([]);
  const [cases, setCases] = useState<InvestigationCase[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [selectedBrandId, setSelectedBrandId] = useState<number | undefined>(undefined);

  // Modals state
  const [selectedCase, setSelectedCase] = useState<InvestigationCase | null>(null);
  const [isCaseModalOpen, setIsCaseModalOpen] = useState(false);
  const [isQuickScanOpen, setIsQuickScanOpen] = useState(false);

  // Connection & loading state
  const [isLoading, setIsLoading] = useState(true);
  const [connectionError, setConnectionError] = useState<string | null>(null);

  const loadAllData = useCallback(async () => {
    setIsLoading(true);
    setConnectionError(null);
    try {
      const [brandsData, casesRes, alertsData, statsData] = await Promise.all([
        api.getBrands(),
        api.getCases({ limit: 100 }),
        api.getAlerts({ limit: 100 }),
        api.getDashboardStats()
      ]);
      setBrands(brandsData);
      setCases(casesRes.items);
      setAlerts(alertsData);
      setStats(statsData);
    } catch (err: any) {
      console.error('Connection error:', err);
      setConnectionError(err.message || 'Cannot connect to FastAPI backend at http://localhost:8000.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAllData();
  }, [loadAllData]);

  // Case Click Handler
  const handleSelectCase = async (c: InvestigationCase) => {
    try {
      const detail = await api.getCaseDetail(c.id);
      setSelectedCase(detail);
      setIsCaseModalOpen(true);
    } catch (err) {
      setSelectedCase(c);
      setIsCaseModalOpen(true);
    }
  };

  const handleSelectCaseById = async (caseId: number) => {
    try {
      const detail = await api.getCaseDetail(caseId);
      setSelectedCase(detail);
      setIsCaseModalOpen(true);
    } catch (err) {
      console.error('Failed to open case by ID:', err);
    }
  };

  const handleCaseUpdated = (updated: InvestigationCase) => {
    setCases(prev => prev.map(c => c.id === updated.id ? updated : c));
    setSelectedCase(updated);
    // Refresh stats & alerts
    api.getDashboardStats().then(setStats).catch(console.error);
    api.getAlerts().then(setAlerts).catch(console.error);
  };

  const handleNewCaseAdded = (newCase: InvestigationCase) => {
    setCases(prev => [newCase, ...prev]);
    setSelectedCase(newCase);
    setIsCaseModalOpen(true);
    // Refresh stats & alerts
    api.getDashboardStats().then(setStats).catch(console.error);
    api.getAlerts().then(setAlerts).catch(console.error);
  };

  // Filter cases if brand is globally selected
  const visibleCases = selectedBrandId 
    ? cases.filter(c => c.brand_id === selectedBrandId)
    : cases;

  const unreadAlertsCount = alerts.filter(a => !a.is_read && !a.is_dismissed).length;

  return (
    <div className="min-h-screen bg-navy-950 text-slate-100 flex">
      {/* Sidebar Navigation */}
      <Sidebar
        currentPage={currentPage}
        onSelectPage={setCurrentPage}
        unreadAlertsCount={unreadAlertsCount}
        activeAgentsCount={stats?.active_agent_count || 13}
      />

      {/* Main App Canvas */}
      <div className="flex-1 ml-64 flex flex-col min-w-0">
        <Header
          currentPage={currentPage}
          brands={brands}
          selectedBrandId={selectedBrandId}
          onSelectBrand={setSelectedBrandId}
          onOpenQuickScan={() => setIsQuickScanOpen(true)}
          unreadAlertsCount={unreadAlertsCount}
          onOpenAlerts={() => setCurrentPage('alerts')}
        />

        <main className="flex-1 p-8 overflow-y-auto">
          {connectionError && (
            <div className="mb-6 p-4 rounded-2xl bg-red-950/40 border border-red-500/40 text-red-200 text-xs flex items-center justify-between shadow-glow-danger/20">
              <div className="flex items-center gap-3">
                <AlertTriangle className="w-5 h-5 text-red-400 shrink-0" />
                <div>
                  <div className="font-bold text-white">Backend Connection Offline</div>
                  <div className="text-slate-300 mt-0.5">
                    {connectionError}. Start the backend via <code>uvicorn app.main:app --port 8000</code>.
                  </div>
                </div>
              </div>
              <button
                onClick={loadAllData}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-semibold transition-colors shrink-0"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Retry Connection</span>
              </button>
            </div>
          )}

          {/* Dynamic Page Rendering */}
          {currentPage === 'dashboard' && (
            <OverviewDashboard
              stats={stats}
              recentCases={visibleCases}
              recentAlerts={alerts}
              onSelectCase={handleSelectCase}
              onOpenQuickScan={() => setIsQuickScanOpen(true)}
              onNavigateTo={setCurrentPage}
            />
          )}

          {currentPage === 'brands' && (
            <BrandProfiles
              brands={brands}
              onBrandUpdated={loadAllData}
            />
          )}

          {currentPage === 'social' && (
            <SocialMediaMonitoring
              brands={brands}
              cases={visibleCases}
              onSelectCase={handleSelectCase}
              onNewCaseAdded={handleNewCaseAdded}
            />
          )}

          {currentPage === 'mobile' && (
            <MobileAppMonitoring
              brands={brands}
              cases={visibleCases}
              onSelectCase={handleSelectCase}
              onNewCaseAdded={handleNewCaseAdded}
            />
          )}

          {currentPage === 'urls' && (
            <UrlScanner
              brands={brands}
              cases={visibleCases}
              onSelectCase={handleSelectCase}
              onNewCaseAdded={handleNewCaseAdded}
            />
          )}

          {currentPage === 'investigations' && (
            <InvestigationCenter
              cases={visibleCases}
              brands={brands}
              onSelectCase={handleSelectCase}
              onRefreshCases={loadAllData}
            />
          )}

          {currentPage === 'alerts' && (
            <AlertsPage
              alerts={alerts}
              onSelectCaseById={handleSelectCaseById}
              onRefreshAlerts={() => api.getAlerts().then(setAlerts)}
            />
          )}

          {currentPage === 'reports' && (
            <ReportsPage
              brands={brands}
            />
          )}

          {currentPage === 'settings' && (
            <SettingsPage
              onRefreshAllData={loadAllData}
            />
          )}
        </main>
      </div>

      {/* Case Detail Modal */}
      <CaseDetailModal
        caseData={selectedCase}
        isOpen={isCaseModalOpen}
        onClose={() => setIsCaseModalOpen(false)}
        onCaseUpdated={handleCaseUpdated}
      />

      {/* Quick Launch Investigation Modal */}
      <QuickScanModal
        isOpen={isQuickScanOpen}
        onClose={() => setIsQuickScanOpen(false)}
        brands={brands}
        onInvestigationComplete={handleNewCaseAdded}
      />
    </div>
  );
}

export default App;
