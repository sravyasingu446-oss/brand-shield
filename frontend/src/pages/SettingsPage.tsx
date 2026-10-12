import React, { useState, useEffect } from 'react';
import { SystemSettings } from '../types';
import { api } from '../services/api';
import { 
  Sliders, 
  Cpu, 
  ShieldCheck, 
  Database, 
  RefreshCw, 
  CheckCircle, 
  AlertTriangle,
  Info,
  Terminal,
  Layers
} from 'lucide-react';

interface SettingsPageProps {
  onRefreshAllData: () => void;
}

export const SettingsPage: React.FC<SettingsPageProps> = ({ onRefreshAllData }) => {
  const [settings, setSettings] = useState<SystemSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSeeding, setIsSeeding] = useState(false);
  const [seedMessage, setSeedMessage] = useState('');

  const loadSettings = async () => {
    setIsLoading(true);
    try {
      const data = await api.getSettings();
      setSettings(data);
    } catch (err: any) {
      console.error('Failed to load settings:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadSettings();
  }, []);

  const handleReSeed = async () => {
    if (!confirm('Re-seed demo database? This will refresh demo brands, cases, and alerts.')) return;
    setIsSeeding(true);
    setSeedMessage('');
    try {
      const res = await api.seedDemoData();
      setSeedMessage(res.message || 'Demo data successfully re-seeded.');
      onRefreshAllData();
      setTimeout(() => setSeedMessage(''), 4000);
    } catch (err: any) {
      alert(err.message || 'Failed to seed demo data.');
    } finally {
      setIsSeeding(false);
    }
  };

  const [testResults, setTestResults] = useState<{ [key: string]: { status: string; message: string; missing_variable?: string } }>({});
  const [testingKey, setTestingKey] = useState<string | null>(null);

  const testProvider = async (provider: 'openai' | 'serpapi' | 'gemini') => {
    setTestingKey(provider);
    try {
      let res;
      if (provider === 'openai') res = await api.testOpenAI();
      else if (provider === 'serpapi') res = await api.testSerpAPI();
      else res = await api.testGemini();
      setTestResults(prev => ({ ...prev, [provider]: res }));
    } catch (err: any) {
      setTestResults(prev => ({
        ...prev,
        [provider]: {
          status: 'error',
          message: err.message || `Failed to test ${provider.toUpperCase()}`
        }
      }));
    } finally {
      setTestingKey(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="rounded-2xl border border-slate-800/80 bg-navy-900/90 p-5 shadow-card">
        <h3 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
          <Sliders className="w-5 h-5 text-shield-orange" />
          <span>System Architecture & Configuration</span>
        </h3>
        <p className="text-xs text-slate-400">
          Orchestration parameters, AI model integration status, and demonstration data controls
        </p>
      </div>

      {seedMessage && (
        <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-center gap-2">
          <CheckCircle className="w-4 h-4 shrink-0" />
          <span>{seedMessage}</span>
        </div>
      )}

      {/* API Integrations Status & Live Verification */}
      <div className="rounded-2xl border border-slate-800/80 bg-navy-900/90 p-6 shadow-card space-y-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white">External API Keys & Provider Health</h4>
              <p className="text-xs text-slate-400">Loaded automatically from project root <code>.env</code> file</p>
            </div>
          </div>
          <button
            onClick={loadSettings}
            disabled={isLoading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-navy-950 border border-slate-800 text-slate-300 hover:text-white text-xs hover:border-slate-700 transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Refresh Status</span>
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* OpenAI Key */}
          <div className="p-4 rounded-xl bg-navy-950/70 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-xs text-white">OpenAI API</span>
              <span className={`text-[10px] font-mono px-2 py-0.5 rounded font-semibold ${
                settings?.openai_api_configured
                  ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                  : 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
              }`}>
                {settings?.openai_api_configured ? 'CONFIGURED' : 'NOT CONFIGURED'}
              </span>
            </div>
            <div className="text-[11px] text-slate-400 space-y-1">
              <div>Env Var: <code className="text-slate-300 font-mono">OPENAI_API_KEY</code></div>
              <div>Model: <code className="text-shield-cyan font-mono">{settings?.openai_model || 'gpt-4o-mini'}</code></div>
            </div>
            <button
              onClick={() => testProvider('openai')}
              disabled={testingKey === 'openai'}
              className="w-full flex items-center justify-center gap-1.5 py-1.5 rounded-lg bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/30 text-purple-300 text-xs font-medium transition disabled:opacity-50"
            >
              {testingKey === 'openai' ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Terminal className="w-3.5 h-3.5" />
              )}
              <span>{testingKey === 'openai' ? 'Testing Connection...' : 'Test OpenAI Connection'}</span>
            </button>
            {testResults['openai'] && (
              <div className={`p-2.5 rounded-lg text-[11px] leading-tight border ${
                testResults['openai'].status === 'connected'
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                  : 'bg-amber-500/10 border-amber-500/30 text-amber-300'
              }`}>
                <div className="font-semibold mb-0.5">
                  {testResults['openai'].status === 'connected' ? '✓ Connected' : '⚠ Action Required'}
                </div>
                <div>{testResults['openai'].message}</div>
              </div>
            )}
          </div>

          {/* SerpAPI Key */}
          <div className="p-4 rounded-xl bg-navy-950/70 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-xs text-white">SerpAPI Engine</span>
              <span className={`text-[10px] font-mono px-2 py-0.5 rounded font-semibold ${
                settings?.serpapi_api_configured
                  ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                  : 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
              }`}>
                {settings?.serpapi_api_configured ? 'CONFIGURED' : 'NOT CONFIGURED'}
              </span>
            </div>
            <div className="text-[11px] text-slate-400 space-y-1">
              <div>Env Var: <code className="text-slate-300 font-mono">SERPAPI_API_KEY</code></div>
              <div>Engine: <span className="text-slate-300">Google Organic Search</span></div>
            </div>
            <button
              onClick={() => testProvider('serpapi')}
              disabled={testingKey === 'serpapi'}
              className="w-full flex items-center justify-center gap-1.5 py-1.5 rounded-lg bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/30 text-blue-300 text-xs font-medium transition disabled:opacity-50"
            >
              {testingKey === 'serpapi' ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Terminal className="w-3.5 h-3.5" />
              )}
              <span>{testingKey === 'serpapi' ? 'Testing Connection...' : 'Test SerpAPI Connection'}</span>
            </button>
            {testResults['serpapi'] && (
              <div className={`p-2.5 rounded-lg text-[11px] leading-tight border ${
                testResults['serpapi'].status === 'connected'
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                  : 'bg-amber-500/10 border-amber-500/30 text-amber-300'
              }`}>
                <div className="font-semibold mb-0.5">
                  {testResults['serpapi'].status === 'connected' ? '✓ Connected' : '⚠ Action Required'}
                </div>
                <div>{testResults['serpapi'].message}</div>
              </div>
            )}
          </div>

          {/* Gemini AI Key */}
          <div className="p-4 rounded-xl bg-navy-950/70 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-xs text-white">Google Gemini</span>
              <span className={`text-[10px] font-mono px-2 py-0.5 rounded font-semibold ${
                settings?.gemini_api_configured
                  ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                  : 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
              }`}>
                {settings?.gemini_api_configured ? 'CONFIGURED' : 'NOT CONFIGURED'}
              </span>
            </div>
            <div className="text-[11px] text-slate-400 space-y-1">
              <div>Env Var: <code className="text-slate-300 font-mono">GEMINI_API_KEY</code></div>
              <div>Model: <code className="text-shield-cyan font-mono">{settings?.gemini_model || 'gemini-1.5-flash'}</code></div>
            </div>
            <button
              onClick={() => testProvider('gemini')}
              disabled={testingKey === 'gemini'}
              className="w-full flex items-center justify-center gap-1.5 py-1.5 rounded-lg bg-shield-cyan/20 hover:bg-shield-cyan/30 border border-shield-cyan/30 text-shield-cyan text-xs font-medium transition disabled:opacity-50"
            >
              {testingKey === 'gemini' ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Terminal className="w-3.5 h-3.5" />
              )}
              <span>{testingKey === 'gemini' ? 'Testing Connection...' : 'Test Gemini Connection'}</span>
            </button>
            {testResults['gemini'] && (
              <div className={`p-2.5 rounded-lg text-[11px] leading-tight border ${
                testResults['gemini'].status === 'connected'
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                  : 'bg-amber-500/10 border-amber-500/30 text-amber-300'
              }`}>
                <div className="font-semibold mb-0.5">
                  {testResults['gemini'].status === 'connected' ? '✓ Connected' : '⚠ Action Required'}
                </div>
                <div>{testResults['gemini'].message}</div>
              </div>
            )}
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-navy-950 border border-slate-800 text-[11px] text-slate-400 leading-relaxed flex items-start gap-2.5">
          <Info className="w-4 h-4 text-shield-orange shrink-0 mt-0.5" />
          <div>
            <strong className="text-slate-200">Where to configure keys:</strong> Add your real keys directly to the <code className="text-shield-orange bg-navy-900 px-1 py-0.5 rounded font-mono">.env</code> file located in the project root directory. Keys are loaded securely by the backend and never exposed to the frontend browser. If no external keys are provided, the platform automatically runs on its built-in rule-based cyber heuristic engine without errors.
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Active Analysis Engine Overview */}
        <div className="rounded-2xl border border-slate-800/80 bg-navy-900/90 p-6 shadow-card space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-shield-cyan/10 text-shield-cyan border border-shield-cyan/20">
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white">Active Analysis Engine</h4>
              <p className="text-xs text-slate-400">Dynamic Multi-Agent Orchestration Mode</p>
            </div>
          </div>

          <div className="space-y-2.5 pt-2">
            <div className="flex items-center justify-between p-3 rounded-xl bg-navy-950 border border-slate-800 text-xs">
              <span className="text-slate-400">Engine Mode:</span>
              <span className="text-shield-cyan font-mono text-[11px] font-semibold">
                {settings?.analysis_engine || 'Rule-based Heuristic Engine'}
              </span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-navy-950 border border-slate-800 text-xs">
              <span className="text-slate-400">Database Engine:</span>
              <span className="font-mono text-white font-semibold">
                {settings?.database_type || 'SQLite Persistent Storage'}
              </span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-navy-950 border border-slate-800 text-xs">
              <span className="text-slate-400">Platform Version:</span>
              <span className="font-mono text-slate-300">
                v{settings?.version || '1.0.0'}
              </span>
            </div>
          </div>

          <div className="p-3 rounded-xl border border-slate-800 bg-navy-950/60 text-[11px] text-slate-400 leading-relaxed">
            <Info className="w-3.5 h-3.5 inline text-shield-cyan mr-1" />
            BrandShield AI features dual-engine resiliency: If an LLM or Search API key is supplied via the backend <code>.env</code>, 
            it automatically enriches investigations with semantic reasoning and live search. When no API keys are present, all 13 specialized agents 
            run independently on high-precision deterministic regex, phonetic, and orthographic algorithms.
          </div>
        </div>

        {/* Risk Thresholds & SOC Governance */}
        <div className="rounded-2xl border border-slate-800/80 bg-navy-900/90 p-6 shadow-card space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-shield-orange/10 text-shield-orange border border-shield-orange/20">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white">Triage Thresholds & Policy</h4>
              <p className="text-xs text-slate-400">Explainable risk bounds and SOC defaults</p>
            </div>
          </div>

          <div className="space-y-2.5 pt-2">
            <div className="flex items-center justify-between p-3 rounded-xl bg-navy-950 border border-slate-800 text-xs">
              <span className="text-slate-400">High Risk Threshold:</span>
              <span className="font-mono text-red-400 font-bold bg-red-500/10 px-2 py-0.5 rounded border border-red-500/20">
                Score &gt;= {settings?.high_risk_threshold || 70}
              </span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-navy-950 border border-slate-800 text-xs">
              <span className="text-slate-400">Medium Risk Threshold:</span>
              <span className="font-mono text-amber-400 font-bold bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                Score {settings?.medium_risk_threshold || 40} - {(settings?.high_risk_threshold || 70) - 1}
              </span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-navy-950 border border-slate-800 text-xs">
              <span className="text-slate-400">Low Risk Threshold:</span>
              <span className="font-mono text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                Score 0 - {(settings?.medium_risk_threshold || 40) - 1}
              </span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-navy-950 border border-slate-800 text-xs">
              <span className="text-slate-400">Default Analyst:</span>
              <span className="font-mono text-slate-200">
                {settings?.default_reviewer || 'SecOps Analyst (Tier 2)'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Synthetic Demonstration Data Generator */}
      <div className="rounded-2xl border border-slate-800/80 bg-navy-900/90 p-6 shadow-card space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white">Demonstration & Evaluation Data</h4>
              <p className="text-xs text-slate-400">
                Populate realistic multi-brand simulation (Apex Bank, CloudPulse, CyberGuard, SwiftPay)
              </p>
            </div>
          </div>

          <button
            onClick={handleReSeed}
            disabled={isSeeding}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-shield-orange to-amber-600 hover:brightness-110 active:scale-95 text-white text-xs font-semibold shadow-glow-orange disabled:opacity-50 transition-all shrink-0"
          >
            <RefreshCw className={`w-4 h-4 ${isSeeding ? 'animate-spin' : ''}`} />
            <span>{isSeeding ? 'Seeding Demo Data...' : 'Reset & Re-Seed Demo Data'}</span>
          </button>
        </div>

        <p className="text-xs text-slate-400 leading-relaxed">
          The synthetic data generator populates four diverse corporate brands with verified asset profiles, 
          12 comprehensive investigation cases spanning phishing portals, Twitter support impersonators, rogue banking APKs, 
          and fraudulent LinkedIn recruitment pages, complete with cryptographic SHA256 hashes, incident alerts, and PDF-exportable reports.
        </p>
      </div>
    </div>
  );
};
