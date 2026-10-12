import express from 'express'
import { mkdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { DatabaseSync } from 'node:sqlite'

const root = dirname(dirname(fileURLToPath(import.meta.url)))
const dataDirectory = join(root, 'server', 'data')
mkdirSync(dataDirectory, { recursive: true })

const database = new DatabaseSync(join(dataDirectory, 'brandshield.sqlite'))
database.exec(`
  PRAGMA journal_mode = WAL;
  CREATE TABLE IF NOT EXISTS scans (
    id TEXT PRIMARY KEY,
    created_at TEXT NOT NULL,
    scan_type TEXT NOT NULL,
    company_name TEXT NOT NULL,
    website TEXT NOT NULL,
    official_profile_url TEXT,
    reference_details TEXT,
    observed_name TEXT NOT NULL,
    observed_website TEXT NOT NULL,
    observed_profile_url TEXT,
    observed_details TEXT,
    data_source TEXT NOT NULL,
    risk_score INTEGER NOT NULL,
    risk_level TEXT NOT NULL,
    status TEXT NOT NULL,
    findings TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS alerts (
    id TEXT PRIMARY KEY,
    scan_id TEXT NOT NULL UNIQUE REFERENCES scans(id),
    created_at TEXT NOT NULL,
    company_name TEXT NOT NULL,
    risk_level TEXT NOT NULL,
    risk_score INTEGER NOT NULL,
    details TEXT NOT NULL,
    is_read INTEGER NOT NULL DEFAULT 0
  );
`)

const app = express()
app.use(express.json({ limit: '256kb' }))

function text(value, maxLength = 4000) {
  return typeof value === 'string' ? value.trim().slice(0, maxLength) : ''
}

function normalized(value) {
  return value.toLowerCase().replace(/[^a-z0-9]/g, '')
}

function hostname(value) {
  try {
    return new URL(value.startsWith('http') ? value : `https://${value}`)
      .hostname.toLowerCase().replace(/^www\./, '')
  } catch {
    return ''
  }
}

function urlIdentity(value) {
  try {
    const url = new URL(value)
    return `${url.hostname.toLowerCase().replace(/^www\./, '')}${url.pathname.replace(/\/$/, '')}`
  } catch {
    return ''
  }
}

function wordSimilarity(left, right) {
  const words = (value) => new Set(value.toLowerCase().match(/[a-z0-9]{3,}/g) ?? [])
  const leftWords = words(left)
  const rightWords = words(right)
  if (!leftWords.size || !rightWords.size) return 1
  const union = new Set([...leftWords, ...rightWords])
  const shared = [...leftWords].filter((word) => rightWords.has(word)).length
  return shared / union.size
}

function evaluate(input) {
  let score = 0
  const findings = []
  const nameMatch = normalized(input.companyName) === normalized(input.observedName)
  if (!nameMatch) {
    const similarity = wordSimilarity(input.companyName, input.observedName)
    const points = similarity >= 0.5 ? 14 : 30
    score += points
    findings.push({
      key: 'company-name',
      label: 'Company name differs',
      detail: `Reference: “${input.companyName}”; candidate: “${input.observedName}”.`,
      points,
    })
  } else {
    findings.push({ key: 'company-name', label: 'Company name matches', detail: 'The names match after basic punctuation normalization.', points: 0 })
  }

  const expectedHost = hostname(input.website)
  const candidateHost = hostname(input.observedWebsite)
  const websiteMatch = Boolean(expectedHost && candidateHost && expectedHost === candidateHost)
  if (!websiteMatch) {
    score += 30
    findings.push({
      key: 'website',
      label: 'Website domain differs',
      detail: `Reference domain: ${expectedHost || 'invalid URL'}; candidate domain: ${candidateHost || 'invalid URL'}.`,
      points: 30,
    })
  } else {
    findings.push({ key: 'website', label: 'Website domain matches', detail: `Both entries use ${expectedHost}.`, points: 0 })
  }

  if (input.officialProfileUrl && input.observedProfileUrl) {
    const profileMatch = urlIdentity(input.officialProfileUrl) === urlIdentity(input.observedProfileUrl)
    if (!profileMatch) {
      score += 18
      findings.push({ key: 'profile-url', label: 'Official profile URL differs', detail: 'The supplied reference profile and candidate profile do not match.', points: 18 })
    } else {
      findings.push({ key: 'profile-url', label: 'Official profile URL matches', detail: 'The supplied profile URLs match.', points: 0 })
    }
  }

  if (input.referenceDetails && input.observedDetails) {
    const similarity = wordSimilarity(input.referenceDetails, input.observedDetails)
    if (similarity < 0.35) {
      score += 22
      findings.push({ key: 'profile-details', label: 'Profile details differ significantly', detail: 'The supplied profile descriptions have low keyword overlap.', points: 22 })
    } else if (similarity < 0.6) {
      score += 10
      findings.push({ key: 'profile-details', label: 'Profile details partly match', detail: 'Some supplied profile keywords are missing from the candidate details.', points: 10 })
    } else {
      findings.push({ key: 'profile-details', label: 'Profile details broadly match', detail: 'The supplied profile descriptions share key terms.', points: 0 })
    }
  }

  score = Math.min(score, 100)
  const riskLevel = score >= 60 ? 'High' : score >= 30 ? 'Medium' : 'Low'
  return { score, riskLevel, findings }
}

function mapScan(row) {
  return { ...row, findings: JSON.parse(row.findings) }
}

function getDashboard() {
  const scans = database.prepare('SELECT * FROM scans ORDER BY created_at DESC LIMIT 100').all().map(mapScan)
  const alerts = database.prepare('SELECT * FROM alerts ORDER BY created_at DESC LIMIT 30').all()
  const summary = database.prepare(`
    SELECT COUNT(*) AS total,
      SUM(CASE WHEN risk_level = 'High' THEN 1 ELSE 0 END) AS high_risk,
      ROUND(AVG(risk_score)) AS average_risk
    FROM scans
  `).get()
  return { scans, alerts, summary }
}

app.get('/api/dashboard', (_request, response) => response.json(getDashboard()))

app.post('/api/scans', (request, response) => {
  const input = {
    companyName: text(request.body?.companyName, 160),
    website: text(request.body?.website, 500),
    officialProfileUrl: text(request.body?.officialProfileUrl, 500),
    referenceDetails: text(request.body?.referenceDetails),
    observedName: text(request.body?.observedName, 160),
    observedWebsite: text(request.body?.observedWebsite, 500),
    observedProfileUrl: text(request.body?.observedProfileUrl, 500),
    observedDetails: text(request.body?.observedDetails),
    dataSource: request.body?.dataSource === 'approved-api' ? 'Approved API' : 'User-provided',
  }

  if (!input.companyName || !input.observedName || !hostname(input.website) || !hostname(input.observedWebsite)) {
    return response.status(400).json({ error: 'Add both company names and valid website URLs before scanning.' })
  }

  const { score, riskLevel, findings } = evaluate(input)
  const id = crypto.randomUUID()
  const createdAt = new Date().toISOString()
  const status = 'Completed'
  const insertScan = database.prepare(`
    INSERT INTO scans (
      id, created_at, scan_type, company_name, website, official_profile_url,
      reference_details, observed_name, observed_website, observed_profile_url,
      observed_details, data_source, risk_score, risk_level, status, findings
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `)

  insertScan.run(
    id, createdAt, 'Company identity', input.companyName, input.website, input.officialProfileUrl,
    input.referenceDetails, input.observedName, input.observedWebsite, input.observedProfileUrl,
    input.observedDetails, input.dataSource, score, riskLevel, status, JSON.stringify(findings),
  )

  if (riskLevel === 'High') {
    database.prepare(`
      INSERT INTO alerts (id, scan_id, created_at, company_name, risk_level, risk_score, details)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(crypto.randomUUID(), id, createdAt, input.companyName, riskLevel, score, findings.filter((item) => item.points > 0).map((item) => item.label).join('; '))
  }

  return response.status(201).json({ scan: mapScan(database.prepare('SELECT * FROM scans WHERE id = ?').get(id)), dashboard: getDashboard() })
})

app.patch('/api/alerts/:id/read', (request, response) => {
  const result = database.prepare('UPDATE alerts SET is_read = 1 WHERE id = ?').run(request.params.id)
  if (!result.changes) return response.status(404).json({ error: 'Alert not found.' })
  return response.json({ alerts: database.prepare('SELECT * FROM alerts ORDER BY created_at DESC LIMIT 30').all() })
})

app.get('/api/reports/scans.csv', (_request, response) => {
  const scans = database.prepare('SELECT * FROM scans ORDER BY created_at DESC').all()
  const columns = ['created_at', 'scan_type', 'company_name', 'website', 'risk_score', 'risk_level', 'status', 'data_source']
  const escape = (value) => `"${String(value ?? '').replaceAll('"', '""')}"`
  const csv = [columns.join(','), ...scans.map((scan) => columns.map((column) => escape(scan[column])).join(','))].join('\n')
  response.setHeader('Content-Type', 'text/csv; charset=utf-8')
  response.setHeader('Content-Disposition', 'attachment; filename="itrustai-scan-history.csv"')
  return response.send(csv)
})

const port = Number(process.env.PORT || 8787)
app.listen(port, () => console.log(`I Trust AI API running on http://localhost:${port}`))