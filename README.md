# JobPilot

AI-powered job-search workspace for developers. Build a profile, discover relevant Adzuna jobs, receive AI match scores, research companies before applying, and follow activity and analytics from one dashboard.

## What it does

- Authenticates users with InsForge OAuth.
- Stores a developer profile and resume, including AI-assisted resume extraction and PDF generation.
- Searches Adzuna for roles across up to three location alternatives, then scores every result against the saved profile.
- Keeps jobs user-scoped, filterable, sortable, and linked to their original application pages.
- Builds a company dossier from public company pages with Browserbase, Stagehand, and AI synthesis.
- Shows live dashboard stats, recent search/research activity, and PostHog analytics charts with hoverable exact values.

## Stack

- Next.js 16, React, TypeScript, Tailwind CSS
- InsForge for authentication, Postgres, storage, and AI gateway
- Adzuna for job discovery
- Browserbase and Stagehand for public-company research
- PostHog for product events and dashboard analytics
- Recharts for dashboard visualizations

## Run locally

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Environment

Create `.env.local` with configured credentials for services in use. Keep all values server-side unless variable name begins with `NEXT_PUBLIC_`.

```bash
NEXT_PUBLIC_INSFORGE_URL=
NEXT_PUBLIC_INSFORGE_ANON_KEY=
INSFORGE_SERVICE_ROLE_KEY=

ADZUNA_APP_ID=
ADZUNA_APP_KEY=

BROWSERBASE_API_KEY=

NEXT_PUBLIC_POSTHOG_KEY=
NEXT_PUBLIC_POSTHOG_HOST=
POSTHOG_PERSONAL_API_KEY=
POSTHOG_PROJECT_ID=
```

`POSTHOG_PERSONAL_API_KEY` and `POSTHOG_PROJECT_ID` power server-only dashboard aggregates. Browserbase uses `BROWSERBASE_API_KEY`; no Browserbase project ID is required.

## Checks

```bash
npm run typecheck
npm run lint
npm run build
```

## Project structure

```text
app/        Pages and API routes
actions/    UI-triggered server mutations
agent/      Job discovery, matching, and company research
components/ UI components
lib/        Service clients and shared utilities
context/    Product, architecture, and UI documentation
```
