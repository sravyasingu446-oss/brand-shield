Brand Shield 🛡️

Digital Risk Protection Platform

Problem Statement

Fake social media profiles, impersonating brand pages, scam accounts, and suspicious mobile applications can damage an organization's reputation and mislead customers. Brand Shield helps organizations identify, monitor, and manage these digital risks.

Objectives

- Identify fake or suspicious social media profiles.
- Detect potentially fake company and brand pages.
- Monitor suspicious mobile applications.
- Calculate risk scores for reported profiles.
- Generate alerts and reports for organizations.

Key Features

1. Brand Profile Verification
2. Fake Account Detection
3. Social Media Monitoring
4. Suspicious App Monitoring
5. Risk Score Dashboard
6. Evidence Management and Reports

Technology Stack

- Frontend: React.js
- Backend: Node.js and Express.js
- Database: MongoDB
- Programming Language: JavaScript

Project Architecture

User → React Frontend → Express Backend → MongoDB Database → Risk Analysis → Dashboard and Alerts

Expected Outcome

A web platform that helps organizations monitor suspicious digital identities, review potential impersonation cases, and manage digital risks.

Project Type

Hackathon Project – Digital Risk Protection

## Implemented MVP

- Compare company name, website domain, and optional official/candidate profile URLs and descriptions.
- Show a risk score with individual mismatch reasons. This is transparent heuristic scoring, not a trained AI model.
- Store completed scans and findings in SQLite; retrieve scan history and high-risk alerts for the dashboard.
- Download individual scan results as PDF and export the full scan history as CSV.
- Accept user-provided details. LinkedIn is not scraped or assumed to be automatically accessible. An approved API can submit data with `dataSource: "approved-api"`.
- High-risk results create in-dashboard alerts. Email notifications are not implemented.

## Run locally

Requirements: Node.js 24 or later.

```sh
npm install
npm run dev
```

Open the Vite URL printed in the terminal (usually `http://localhost:5173`). The API runs on port `8787`. Scan data persists in `server/data/brandshield.sqlite`.

Risk score bands: Low 0-29, Medium 30-59, High 60-100. The report contains the scan date, source, reference and candidate details, risk score, status, and findings.

## Implemented technology

- Frontend: React, TypeScript, and Vite
- API: Node.js and Express
- Database: SQLite
