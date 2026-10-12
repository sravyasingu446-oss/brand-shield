import { useEffect, useState, type FormEvent } from 'react'
import {
  Activity, AlertTriangle, ArrowDownToLine, ArrowUpRight, Bell, Building2, Check,
  ChevronDown, CircleHelp, Clock3, Command, FileDown, FileSearch, Fingerprint, Globe2,
  LayoutDashboard, LoaderCircle, Plus, Search, ShieldCheck, ShieldEllipsis,
  SlidersHorizontal, Sparkles,
} from 'lucide-react'
import './App.css'

type Finding = { key: string; label: string; detail: string; points: number }
type Scan = { id: string; created_at: string; scan_type: string; company_name: string; website: string; official_profile_url: string; reference_details: string; observed_name: string; observed_website: string; observed_profile_url: string; observed_details: string; data_source: string; risk_score: number; risk_level: 'Low' | 'Medium' | 'High'; status: string; findings: Finding[] }
type Alert = { id: string; scan_id: string; created_at: string; company_name: string; risk_level: string; risk_score: number; details: string; is_read: number }
type Dashboard = { scans: Scan[]; alerts: Alert[]; summary: { total: number; high_risk: number | null; average_risk: number | null } }
type Page = 'overview' | 'scan' | 'history' | 'alerts' | 'reports'
type ScanForm = { companyName: string; website: string; officialProfileUrl: string; referenceDetails: string; observedName: string; observedWebsite: string; observedProfileUrl: string; observedDetails: string }

const emptyDashboard: Dashboard = { scans: [], alerts: [], summary: { total: 0, high_risk: 0, average_risk: 0 } }
const emptyForm: ScanForm = { companyName: '', website: '', officialProfileUrl: '', referenceDetails: '', observedName: '', observedWebsite: '', observedProfileUrl: '', observedDetails: '' }
const navigation: { id: Page; label: string; icon: typeof LayoutDashboard }[] = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'scan', label: 'New identity scan', icon: FileSearch },
  { id: 'history', label: 'Scan history', icon: Clock3 },
  { id: 'alerts', label: 'Threat alerts', icon: Bell },
  { id: 'reports', label: 'Reports', icon: ArrowDownToLine },
]

function dateLabel(value: string) {
  return new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(value))
}
function timeLabel(value: string) {
  return new Intl.DateTimeFormat('en', { hour: 'numeric', minute: '2-digit' }).format(new Date(value))
}
function riskClass(level: string) { return `risk-${level.toLowerCase()}` }

async function downloadScanPdf(scan: Scan) {
  const { jsPDF } = await import('jspdf')
  const pdf = new jsPDF()
  const pageWidth = pdf.internal.pageSize.getWidth()
  const pageHeight = pdf.internal.pageSize.getHeight()
  const margin = 18
  const contentWidth = pageWidth - margin * 2
  let cursor = 47

  pdf.setFillColor(32, 42, 35)
  pdf.rect(0, 0, pageWidth, 35, 'F')
  pdf.setTextColor(204, 231, 108)
  pdf.setFont('helvetica', 'bold')
  pdf.setFontSize(18)
  pdf.text('I Trust AI', margin, 16)
  pdf.setTextColor(244, 246, 239)
  pdf.setFontSize(9)
  pdf.setFont('helvetica', 'normal')
  pdf.text('COMPANY IDENTITY VERIFICATION REPORT', margin, 25)

  pdf.setTextColor(37, 48, 40)
  pdf.setFont('helvetica', 'bold')
  pdf.setFontSize(17)
  pdf.text('Scan report', margin, cursor)
  cursor += 11

  const riskColors = {
    Low: [76, 155, 107],
    Medium: [212, 156, 44],
    High: [196, 91, 73],
  } as const
  const [red, green, blue] = riskColors[scan.risk_level]
  pdf.setFillColor(red, green, blue)
  pdf.roundedRect(margin, cursor, 44, 22, 2, 2, 'F')
  pdf.setTextColor(255, 255, 255)
  pdf.setFontSize(8)
  pdf.text(`${scan.risk_level.toUpperCase()} RISK`, margin + 4, cursor + 7)
  pdf.setFontSize(14)
  pdf.text(`${scan.risk_score} / 100`, margin + 4, cursor + 16)
  pdf.setTextColor(97, 109, 99)
  pdf.setFont('helvetica', 'normal')
  pdf.setFontSize(9)
  pdf.text(`${dateLabel(scan.created_at)} at ${timeLabel(scan.created_at)}  |  ${scan.status}`, margin + 51, cursor + 9)
  pdf.text(`Source: ${scan.data_source}`, margin + 51, cursor + 16)
  cursor += 32

  function addField(label: string, value: string) {
    const lines = pdf.splitTextToSize(value || 'Not provided', contentWidth)
    const blockHeight = 11 + lines.length * 4.5
    if (cursor + blockHeight > pageHeight - 18) {
      pdf.addPage()
      cursor = 20
    }
    pdf.setTextColor(112, 124, 115)
    pdf.setFont('helvetica', 'bold')
    pdf.setFontSize(8)
    pdf.text(label.toUpperCase(), margin, cursor)
    cursor += 5
    pdf.setTextColor(48, 59, 51)
    pdf.setFont('helvetica', 'normal')
    pdf.setFontSize(9)
    pdf.text(lines, margin, cursor)
    cursor += lines.length * 4.5 + 6
  }

  function addSection(title: string) {
    if (cursor + 15 > pageHeight - 18) {
      pdf.addPage()
      cursor = 20
    }
    pdf.setDrawColor(224, 230, 222)
    pdf.line(margin, cursor, pageWidth - margin, cursor)
    cursor += 8
    pdf.setTextColor(43, 60, 47)
    pdf.setFont('helvetica', 'bold')
    pdf.setFontSize(11)
    pdf.text(title, margin, cursor)
    cursor += 8
  }

  addSection('Official reference')
  addField('Company name', scan.company_name)
  addField('Website', scan.website)
  addField('Official profile URL', scan.official_profile_url)
  addField('Known official profile details', scan.reference_details)

  addSection('Details checked')
  addField('Candidate company name', scan.observed_name)
  addField('Candidate website', scan.observed_website)
  addField('Candidate profile URL', scan.observed_profile_url)
  addField('Candidate profile details', scan.observed_details)

  addSection('Risk findings')
  scan.findings.forEach((finding, index) => {
    const detailLines = pdf.splitTextToSize(finding.detail, contentWidth - 7)
    const blockHeight = 12 + detailLines.length * 4.5
    if (cursor + blockHeight > pageHeight - 18) {
      pdf.addPage()
      cursor = 20
    }
    pdf.setTextColor(48, 59, 51)
    pdf.setFont('helvetica', 'bold')
    pdf.setFontSize(9)
    pdf.text(`${index + 1}. ${finding.label}  (+${finding.points})`, margin, cursor)
    cursor += 5
    pdf.setTextColor(105, 116, 107)
    pdf.setFont('helvetica', 'normal')
    pdf.setFontSize(8)
    pdf.text(detailLines, margin + 4, cursor)
    cursor += detailLines.length * 4.5 + 7
  })

  const pageCount = pdf.getNumberOfPages()
  for (let page = 1; page <= pageCount; page += 1) {
    pdf.setPage(page)
    pdf.setDrawColor(230, 234, 227)
    pdf.line(margin, pageHeight - 12, pageWidth - margin, pageHeight - 12)
    pdf.setTextColor(140, 150, 141)
    pdf.setFont('helvetica', 'normal')
    pdf.setFontSize(7)
    pdf.text(`I Trust AI  |  ${scan.id}`, margin, pageHeight - 7)
    pdf.text(`${page} / ${pageCount}`, pageWidth - margin, pageHeight - 7, { align: 'right' })
  }

  const filename = scan.company_name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'company'
  pdf.save(`${filename}-scan-report.pdf`)
}

function App() {
  const [page, setPage] = useState<Page>('overview')
  const [dashboard, setDashboard] = useState(emptyDashboard)
  const [form, setForm] = useState(emptyForm)
  const [loading, setLoading] = useState(true)
  const [scanning, setScanning] = useState(false)
  const [error, setError] = useState('')
  const [query, setQuery] = useState('')
  const [lastResult, setLastResult] = useState<Scan | null>(null)

  async function loadDashboard() {
    try {
      const response = await fetch('/api/dashboard')
      if (!response.ok) throw new Error('Could not load dashboard data.')
      setDashboard(await response.json() as Dashboard)
      setError('')
    } catch {
      setError('The local scan service is unavailable. Start the app with npm run dev.')
    } finally {
      setLoading(false)
    }
  }
  useEffect(() => {
    let active = true
    fetch('/api/dashboard')
      .then((response) => {
        if (!response.ok) throw new Error('Could not load dashboard data.')
        return response.json() as Promise<Dashboard>
      })
      .then((payload) => {
        if (active) setDashboard(payload)
      })
      .catch(() => {
        if (active) setError('The local scan service is unavailable. Start the app with npm run dev.')
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => { active = false }
  }, [])

  async function submitScan(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setScanning(true)
    setError('')
    setLastResult(null)
    try {
      const response = await fetch('/api/scans', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...form, dataSource: 'user-provided' }) })
      const payload = await response.json()
      if (!response.ok) throw new Error(payload.error || 'Scan could not be completed.')
      setLastResult(payload.scan as Scan)
      setDashboard(payload.dashboard as Dashboard)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Scan could not be completed.')
    } finally { setScanning(false) }
  }
  async function markAlertRead(alert: Alert) {
    if (alert.is_read) return
    await fetch(`/api/alerts/${alert.id}/read`, { method: 'PATCH' })
    await loadDashboard()
  }

  const filteredScans = dashboard.scans.filter((scan) => `${scan.company_name} ${scan.website} ${scan.risk_level}`.toLowerCase().includes(query.toLowerCase()))
  const unreadAlerts = dashboard.alerts.filter((alert) => !alert.is_read).length
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <a className="brand" href="#overview" onClick={() => setPage('overview')}><span className="brand-mark"><ShieldCheck size={20} strokeWidth={2.2} /></span><span className="brand-copy"><strong>I Trust AI</strong><small>BRAND INTEGRITY</small></span></a>
        <div className="workspace-switcher"><span className="workspace-icon"><Building2 size={16} /></span><span><strong>Trust operations</strong><small>Workspace</small></span><ChevronDown size={15} /></div>
        <p className="nav-label">WORKSPACE</p>
        <nav className="side-nav" aria-label="Main navigation">{navigation.map(({ id, label, icon: Icon }) => <button key={id} className={`nav-link ${page === id ? 'active' : ''}`} onClick={() => setPage(id)}><Icon size={17} strokeWidth={1.8} /><span>{label}</span>{id === 'alerts' && unreadAlerts > 0 && <span className="nav-count">{unreadAlerts}</span>}</button>)}</nav>
        <div className="sidebar-bottom"><div className="api-status"><span className="status-dot" /><span><strong>Local database</strong><small>Connected and ready</small></span></div><button className="nav-link help-link" onClick={() => setPage('scan')}><CircleHelp size={17} /><span>How scans work</span></button><div className="account-row"><span className="avatar">IT</span><span><strong>Trust analyst</strong><small>Local workspace</small></span><SlidersHorizontal size={16} /></div></div>
      </aside>

      <main className="main-area">
        <header className="topbar"><div className="breadcrumb"><span>Workspace</span><span className="crumb-slash">/</span><strong>{navigation.find((item) => item.id === page)?.label}</strong></div><div className="topbar-actions"><div className="environment-pill"><span className="status-dot" /> LOCAL ENVIRONMENT</div><button className="icon-button" aria-label="Open threat alerts" title="Threat alerts" onClick={() => setPage('alerts')}><Bell size={18} />{unreadAlerts > 0 && <i />}</button><span className="top-avatar">IT</span></div></header>
        <div className="page-content">
          {error && <div className="error-banner" role="alert"><AlertTriangle size={17} />{error}</div>}
          {page === 'overview' && <Overview dashboard={dashboard} loading={loading} onNavigate={setPage} />}
          {page === 'scan' && <ScanPage form={form} setForm={setForm} scanning={scanning} lastResult={lastResult} onSubmit={submitScan} />}
          {page === 'history' && <HistoryPage scans={filteredScans} query={query} setQuery={setQuery} />}
          {page === 'alerts' && <AlertsPage alerts={dashboard.alerts} onMarkRead={markAlertRead} />}
          {page === 'reports' && <ReportsPage dashboard={dashboard} />}
          <footer className="page-footer"><span><Command size={13} /> I Trust AI</span><span>Identity signals, clearly sourced.</span><span>v0.1 · Local preview</span></footer>
        </div>
      </main>
    </div>
  )
}

function Overview({ dashboard, loading, onNavigate }: { dashboard: Dashboard; loading: boolean; onNavigate: (page: Page) => void }) {
  const highRisk = dashboard.summary.high_risk ?? 0
  return <>
    <div className="page-heading overview-heading"><div><p className="eyebrow"><span className="eyebrow-line" /> MONITORING OVERVIEW</p><h1>Good morning, analyst.</h1><p className="heading-subtitle">A clear view of the company identities you are monitoring.</p></div><button className="primary-button" onClick={() => onNavigate('scan')}><Plus size={17} /> New identity scan</button></div>
    <section className="stats-grid" aria-label="Scan summary">
      <article className="stat-card"><div className="stat-top"><span>Total scans</span><span className="stat-icon mint"><Activity size={17} /></span></div><strong>{loading ? '—' : dashboard.summary.total}</strong><small>Saved to scan history</small></article>
      <article className="stat-card"><div className="stat-top"><span>High-risk findings</span><span className="stat-icon coral"><AlertTriangle size={17} /></span></div><strong>{loading ? '—' : highRisk}</strong><small>Alerts created automatically</small></article>
      <article className="stat-card"><div className="stat-top"><span>Average risk score</span><span className="stat-icon yellow"><Fingerprint size={17} /></span></div><strong>{loading ? '—' : `${dashboard.summary.average_risk ?? 0}`}<em> / 100</em></strong><small>Across completed scans</small></article>
      <article className="stat-card"><div className="stat-top"><span>Open alerts</span><span className="stat-icon lilac"><Bell size={17} /></span></div><strong>{loading ? '—' : dashboard.alerts.filter((alert) => !alert.is_read).length}</strong><small>Unread high-risk signals</small></article>
    </section>
    <div className="dashboard-grid">
      <section className="panel scan-panel"><div className="section-heading"><div><p className="eyebrow">RECENT ACTIVITY</p><h2>Latest scans</h2></div><button className="text-button" onClick={() => onNavigate('history')}>View history <ArrowUpRight size={15} /></button></div>{dashboard.scans.length ? <ScanTable scans={dashboard.scans.slice(0, 5)} /> : <EmptyState icon={<FileSearch size={20} />} title="No scans yet" detail="Start with an official reference and the details you want to verify." action="Run first scan" onClick={() => onNavigate('scan')} />}</section>
      <section className="panel alerts-panel"><div className="section-heading"><div><p className="eyebrow">NEEDS ATTENTION</p><h2>Threat alerts <span className="heading-count">{dashboard.alerts.length}</span></h2></div><button className="icon-button subtle" aria-label="View all alerts" onClick={() => onNavigate('alerts')}><ArrowUpRight size={17} /></button></div>{dashboard.alerts.length ? <div className="alert-list">{dashboard.alerts.slice(0, 4).map((alert) => <AlertRow key={alert.id} alert={alert} compact />)}</div> : <div className="clear-state"><span><ShieldEllipsis size={21} /></span><strong>All clear for now</strong><small>High-risk identity mismatches will appear here.</small></div>}<div className="alert-footnote"><span className="status-dot" /> High risk alerts are created automatically</div></section>
    </div>
    <section className="signal-strip"><div className="signal-icon"><Sparkles size={17} /></div><div><strong>Signal sources stay transparent</strong><p>Profile and company details are compared only when provided by you or passed through an approved API.</p></div><span className="source-tag">USER-PROVIDED DATA</span></section>
  </>
}

function ScanPage({ form, setForm, scanning, lastResult, onSubmit }: { form: ScanForm; setForm: (form: ScanForm) => void; scanning: boolean; lastResult: Scan | null; onSubmit: (event: FormEvent<HTMLFormElement>) => void }) {
  function update(field: keyof ScanForm, value: string) { setForm({ ...form, [field]: value }) }
  return <>
    <div className="page-heading"><div><p className="eyebrow"><span className="eyebrow-line" /> IDENTITY VERIFICATION</p><h1>New identity scan</h1><p className="heading-subtitle">Compare candidate company signals against details you trust.</p></div></div>
    <div className="scan-layout">
      <form className="panel scan-form" onSubmit={onSubmit}>
        <div className="form-section-heading"><span className="step-index">01</span><div><h2>Official reference</h2><p>Enter the company identity you consider authoritative.</p></div></div>
        <div className="form-grid">
          <label className="field"><span>Company name <b>*</b></span><input required value={form.companyName} onChange={(event) => update('companyName', event.target.value)} placeholder="e.g. Northstar Analytics" /></label>
          <label className="field"><span>Official website <b>*</b></span><div className="input-with-icon"><Globe2 size={15} /><input required type="url" value={form.website} onChange={(event) => update('website', event.target.value)} placeholder="https://northstar.example" /></div></label>
          <label className="field span-two"><span>Official profile URL <small>Optional, user-provided</small></span><input type="url" value={form.officialProfileUrl} onChange={(event) => update('officialProfileUrl', event.target.value)} placeholder="Paste an official company profile URL" /></label>
          <label className="field span-two"><span>Known official profile details <small>Optional</small></span><textarea value={form.referenceDetails} onChange={(event) => update('referenceDetails', event.target.value)} placeholder="Add a short description, industry, location, or other known facts" rows={3} /></label>
        </div>
        <div className="form-divider" />
        <div className="form-section-heading"><span className="step-index">02</span><div><h2>Details to verify</h2><p>Paste the candidate details. Nothing is fetched automatically.</p></div></div>
        <div className="form-grid">
          <label className="field"><span>Candidate company name <b>*</b></span><input required value={form.observedName} onChange={(event) => update('observedName', event.target.value)} placeholder="Company name to check" /></label>
          <label className="field"><span>Candidate website <b>*</b></span><div className="input-with-icon"><Globe2 size={15} /><input required type="url" value={form.observedWebsite} onChange={(event) => update('observedWebsite', event.target.value)} placeholder="https://website-to-check.example" /></div></label>
          <label className="field span-two"><span>Candidate profile URL <small>Optional, user-provided</small></span><input type="url" value={form.observedProfileUrl} onChange={(event) => update('observedProfileUrl', event.target.value)} placeholder="Paste a profile URL to compare" /></label>
          <label className="field span-two"><span>Candidate profile details <small>Optional</small></span><textarea value={form.observedDetails} onChange={(event) => update('observedDetails', event.target.value)} placeholder="Paste the details you want checked against the reference" rows={3} /></label>
        </div>
        <div className="form-actions"><span><ShieldCheck size={15} /> Data source: user-provided</span><button className="primary-button" type="submit" disabled={scanning}>{scanning ? <LoaderCircle className="spin" size={16} /> : <Search size={16} />}{scanning ? 'Analyzing signals' : 'Run identity scan'}</button></div>
      </form>
      <aside className="scan-aside"><div className="method-card"><div className="method-title"><span className="method-icon"><Fingerprint size={18} /></span><strong>What gets compared</strong></div><ul><li><Check size={14} /> Company name similarity</li><li><Check size={14} /> Website domain match</li><li><Check size={14} /> Profile URL, when provided</li><li><Check size={14} /> Profile detail similarity</li></ul><div className="method-note"><ShieldCheck size={15} /><span>LinkedIn access is not assumed. Use details you provide or connect an approved API.</span></div></div>
        <div className="method-card scoring-card"><p className="eyebrow">RISK SCORE</p><div className="score-key"><span><i className="key-dot low" /> Low</span><b>0–29</b></div><div className="score-key"><span><i className="key-dot medium" /> Medium</span><b>30–59</b></div><div className="score-key"><span><i className="key-dot high" /> High</span><b>60–100</b></div><p className="score-caption">A high-risk result creates a dashboard alert. Email notifications are not enabled.</p></div>
      </aside>
    </div>
    {lastResult && <ScanResult scan={lastResult} />}
  </>
}

function ScanResult({ scan }: { scan: Scan }) {
  return <section className="panel result-panel"><div className="section-heading"><div><p className="eyebrow">SCAN COMPLETE</p><h2>Identity comparison</h2></div><div className="result-actions"><button className="pdf-button" onClick={() => { void downloadScanPdf(scan) }}><FileDown size={14} /> Download PDF</button><span className={`risk-badge ${riskClass(scan.risk_level)}`}>{scan.risk_level} risk</span></div></div><div className="result-summary"><div className={`score-ring ${riskClass(scan.risk_level)}`}><strong>{scan.risk_score}</strong><small>/ 100</small></div><div><strong>{scan.company_name}</strong><p>{scan.findings.filter((finding) => finding.points > 0).length ? 'Differences were found in the supplied company signals.' : 'The supplied company signals are broadly consistent.'}</p><small>Saved to scan history · {scan.data_source}</small></div></div><div className="finding-list">{scan.findings.map((finding) => <div className="finding-row" key={finding.key}><span className={finding.points ? 'finding-mark warning' : 'finding-mark'}>{finding.points ? <AlertTriangle size={15} /> : <Check size={15} />}</span><div><strong>{finding.label}</strong><small>{finding.detail}</small></div><b>{finding.points ? `+${finding.points}` : '—'}</b></div>)}</div></section>
}

function HistoryPage({ scans, query, setQuery }: { scans: Scan[]; query: string; setQuery: (query: string) => void }) {
  return <><div className="page-heading"><div><p className="eyebrow"><span className="eyebrow-line" /> AUDIT TRAIL</p><h1>Scan history</h1><p className="heading-subtitle">Every completed comparison, saved with its score and status.</p></div><a className="secondary-button" href="/api/reports/scans.csv"><ArrowDownToLine size={16} /> Export CSV</a></div><section className="panel history-panel"><div className="table-toolbar"><span>{scans.length} saved scans</span><label className="search-field"><Search size={15} /><input aria-label="Search scans" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search company or risk" /></label></div>{scans.length ? <ScanTable scans={scans} expanded /> : <EmptyState icon={<FileSearch size={20} />} title="No matching scans" detail={query ? 'Try a different company name or risk level.' : 'Completed scans will be stored here.'} />}</section></>
}

function ScanTable({ scans, expanded = false }: { scans: Scan[]; expanded?: boolean }) {
  return <div className="table-scroll"><table><thead><tr><th>COMPANY</th><th>SCAN TYPE</th><th>DATE</th><th>RISK SCORE</th><th>STATUS</th>{expanded && <th>REPORT</th>}</tr></thead><tbody>{scans.map((scan) => <tr key={scan.id}><td><div className="company-cell"><span className="company-logo">{scan.company_name.slice(0, 1).toUpperCase()}</span><span><strong>{scan.company_name}</strong><small>{scan.website}</small></span></div></td><td><span className="scan-type"><Fingerprint size={14} />{scan.scan_type}</span></td><td><span className="date-cell">{dateLabel(scan.created_at)}{expanded && <small>{timeLabel(scan.created_at)}</small>}</span></td><td><span className={`score-cell ${riskClass(scan.risk_level)}`}><i />{scan.risk_score}<small>/100</small><em>{scan.risk_level}</em></span></td><td><span className="status-chip"><Check size={12} />{scan.status}</span></td>{expanded && <td><button className="pdf-icon-button" aria-label={`Download PDF report for ${scan.company_name}`} title="Download PDF report" onClick={() => { void downloadScanPdf(scan) }}><FileDown size={15} /></button></td>}</tr>)}</tbody></table></div>
}

function AlertsPage({ alerts, onMarkRead }: { alerts: Alert[]; onMarkRead: (alert: Alert) => void }) {
  return <><div className="page-heading"><div><p className="eyebrow"><span className="eyebrow-line" /> RISK MONITORING</p><h1>Threat alerts</h1><p className="heading-subtitle">High-risk identity results and the differences that triggered them.</p></div><span className="alert-summary"><AlertTriangle size={16} /> {alerts.length} total alerts</span></div><section className="panel full-alert-panel">{alerts.length ? <div className="full-alert-list">{alerts.map((alert) => <AlertRow key={alert.id} alert={alert} onMarkRead={onMarkRead} />)}</div> : <EmptyState icon={<ShieldEllipsis size={20} />} title="No high-risk alerts" detail="An alert is created automatically when a scan reaches high risk." />}</section><p className="email-note"><Bell size={15} /> Email notifications are planned for a later release. Alerts currently appear in this dashboard only.</p></>
}

function AlertRow({ alert, compact = false, onMarkRead }: { alert: Alert; compact?: boolean; onMarkRead?: (alert: Alert) => void }) {
  return <article className={`alert-row ${!alert.is_read ? 'unread' : ''} ${compact ? 'compact' : ''}`}><span className="alert-icon"><AlertTriangle size={17} /></span><div className="alert-main"><div className="alert-title-row"><strong>{alert.company_name}</strong><span className={`risk-badge ${riskClass(alert.risk_level)}`}>{alert.risk_level} risk · {alert.risk_score}</span></div><p>{alert.details}</p><small>{dateLabel(alert.created_at)} at {timeLabel(alert.created_at)}</small></div>{!compact && !alert.is_read && <button className="mark-read" onClick={() => onMarkRead?.(alert)}>Mark read</button>}</article>
}

function ReportsPage({ dashboard }: { dashboard: Dashboard }) {
  const average = dashboard.summary.average_risk ?? 0
  return <><div className="page-heading"><div><p className="eyebrow"><span className="eyebrow-line" /> REPORTING</p><h1>Reports</h1><p className="heading-subtitle">Export an audit-friendly record of completed identity scans.</p></div><a className="primary-button" href="/api/reports/scans.csv"><ArrowDownToLine size={16} /> Download CSV</a></div><div className="report-summary"><section className="panel report-intro"><span className="report-icon"><ArrowDownToLine size={18} /></span><div><h2>Scan history export</h2><p>Download scan date, type, company, website, risk score, risk level, status, and data source as a CSV file.</p><a href="/api/reports/scans.csv" className="inline-link">Download scan report <ArrowUpRight size={14} /></a></div></section><section className="panel report-metrics"><p className="eyebrow">CURRENT DATASET</p><div><span>Saved scans</span><strong>{dashboard.summary.total}</strong></div><div><span>Average risk score</span><strong>{average}<small> / 100</small></strong></div><div><span>High-risk alerts</span><strong>{dashboard.alerts.length}</strong></div></section></div><section className="report-note"><CircleHelp size={16} /><p>Reports contain only information entered for scans. No social profile data is collected automatically.</p></section></>
}

function EmptyState({ icon, title, detail, action, onClick }: { icon: React.ReactNode; title: string; detail: string; action?: string; onClick?: () => void }) {
  return <div className="empty-state"><span>{icon}</span><strong>{title}</strong><p>{detail}</p>{action && <button className="text-button" onClick={onClick}>{action} <ArrowUpRight size={14} /></button>}</div>
}

export default App
