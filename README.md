# EPF Policy Lever Scorecard

Interactive simulation of EPF retirement savings trajectories under Malaysia's **Retirement Income Adequacy (RIA) Framework** (2026).

Built for senior leadership and policymakers to visualise how different policy levers — retirement age, contribution rates, wage growth, crisis withdrawals — impact retirement outcomes against the three-tier RIA thresholds.

## Quick Start (Local)

```bash
# Install dependencies
npm install

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Deploy to Vercel

### Option 1: Vercel CLI

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel
```

### Option 2: Git Integration

1. Push this folder to a GitHub/GitLab repo
2. Go to [vercel.com/new](https://vercel.com/new)
3. Import the repository
4. Vercel auto-detects Next.js — click **Deploy**

That's it. No environment variables needed.

## Key Features

- **5 preset scenarios**: Baseline, Reform, Crisis Shock, B40 Worker, Gig Worker
- **10 adjustable policy levers** with real-time chart updates
- **Comparison mode**: Overlay any preset as a dashed line
- **Auto-generated insights** explaining the tier outcome and gap analysis
- **Crisis withdrawal shock simulator** showing compounded loss from mid-career withdrawals
- **Drawdown phase** modelled against Belanjawanku 2024/2025 (RM2,690/mo, inflation-adjusted)

## Methodology

- Deterministic accumulation-drawdown model
- Contributions: (employee% + employer%) × annual salary
- Returns compound annually at the EPF dividend rate
- Post-retirement drawdown: RM2,690/mo (Belanjawanku single elderly, Klang Valley), inflation-adjusted
- RIA tier thresholds: Basic RM390K, Adequate RM650K, Enhanced RM1.3M

## Data Sources

- EPF RIA Framework (effective January 2026)
- Belanjawanku 2024/2025 expenditure guide
- EPF contribution rates per Employees Provident Fund Act 1991
- Dividend rates from EPF Annual Reports

## Tech Stack

- Next.js 14 (App Router)
- Tailwind CSS
- Pure SVG charts (no chart library dependency)
- Deployed on Vercel

---

*This is an illustrative simulation tool, not financial advice.*
