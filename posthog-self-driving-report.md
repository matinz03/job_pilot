# PostHog Self-driving Setup Report — JobPilot

**Date:** 2026-08-24  
**Project:** job_pilot (ID: 250712)  
**Inbox:** https://eu.posthog.com/project/250712/inbox

## Summary

PostHog Self-driving is now configured for JobPilot. Session Replay, Error Tracking, and Support were already enabled; all native signal sources are wired; the GitHub integration was already connected; the scout troop is tuned to five active scouts; and two Replay Vision monitors are watching the job search flow and rage-click sessions, both sending findings to the inbox. Findings will start appearing in the [Self-driving inbox](https://eu.posthog.com/project/250712/inbox) within approximately 30 minutes.

---

## AI Data Processing

**Status:** Approved — organization-level AI data processing consent was confirmed before this run started.

---

## GitHub

**Status:** Already connected (integrated 2026-08-24T09:49:50Z).  
Self-driving uses this connection to research findings against the repository and open draft PRs for fixable issues.

---

## Products Enabled

| Product | Status | Notes |
|---|---|---|
| Session Replay | Already enabled | `posthog.init` has no `disable_session_recording` override — clean |
| Error Tracking | Already enabled | `posthog.init` has `capture_exceptions: true` — clean |
| Support (Conversations) | Already enabled | Idle until an inbound channel is connected — see Follow-ups |

---

## Signal Sources

| source_product | source_type | Action | Notes |
|---|---|---|---|
| `signals_scout` | `cross_source_issue` | On by default | No config row needed; scout findings reach the inbox automatically |
| `health_checks` | `health_issue` | Already enabled | ID: `01a0332e-a0bc-73ea-87c2-ac77bbbd32af` |
| `error_tracking` | `issue_created` | Already enabled | ID: `01a0332e-a678-7c86-9be6-f001dedfae67` |
| `error_tracking` | `issue_reopened` | Already enabled | ID: `01a0332e-ace0-7c00-8d5e-0a9b4467fa33` |
| `error_tracking` | `issue_spiking` | Already enabled | ID: `01a0332e-aed7-75b7-bee5-10967d3f328c` |
| `session_replay` | `session_analysis_cluster` | Already enabled | ID: `01a0332e-b19c-7bfb-953d-ad8b969c99a0` |
| `conversations` | `ticket` | Already enabled | ID: `01a0332e-b5c7-7a6d-8546-af4f49c0d126` |
| `replay_vision` | _(no row)_ | Self-authorizing | `emits_signals: true` on each scanner is the per-source config — no row created |

---

## Connected Tools

No external tool integrations were selected — skipped (not used).

---

## Scout Troop

**Run budget:** 100 runs/day (97 remaining today). Early-access default.  
**Banner:** *"Scouts are in early access. Each project gets up to 100 scout runs a day. Contact team-self-driving@posthog.com if you need more."*  
**Troop ceiling:** 10 enabled scouts.

### Enabled (5)

| Scout | What it watches |
|---|---|
| `signals-scout-general` | Cross-product correlations and surfaces no specialist covers |
| `signals-scout-health-checks` | PostHog setup health — missing events, proxy gaps, stale SDKs |
| `signals-scout-observability-gaps` | Events with high volume but no insight, dashboard, or alert coverage |
| `signals-scout-product-analytics` | Funnel, retention, and lifecycle regressions in saved flows |
| `signals-scout-web-analytics` | Web traffic channel health, attribution breakage, landing-page issues |

### Disabled (22)

| Scout | Reason disabled |
|---|---|
| `signals-scout-error-tracking` | Covered by the native `error_tracking` signal source — intentional, not a gap |
| `signals-scout-session-replay` | Covered by the native `session_replay` signal source — intentional, not a gap |
| `signals-scout-feature-flags` | No active feature flags (0 configured) — enable if flags are added |
| `signals-scout-experiments` | No running experiments (0 configured) — enable if A/B tests are started |
| `signals-scout-surveys` | No active surveys (0 configured) — enable if surveys are launched |
| `signals-scout-revenue-analytics` | No payment SDK; subscriptions are explicitly out of scope for this project |
| `signals-scout-ai-observability` | No `$ai_*` events instrumented yet — enable once LLM observability is added |
| `signals-scout-logs` | PostHog logs product not in use |
| `signals-scout-csp-violations` | No CSP reporting configured |
| `signals-scout-customer-analytics` | No B2B group analytics; single-user product |
| `signals-scout-data-pipelines` | No CDP destinations or batch exports beyond GeoIP transformation |
| `signals-scout-anomaly-detection` | Disabled (no project-specific anomaly surfaces stand out above `general`) |
| `signals-scout-replay-vision` | Disabled — scanners were just created; this scout reads trends across accumulated observations and there are none yet. Enable once recordings accumulate |
| `signals-scout-apm` | No OpenTelemetry/APM tracing configured |
| `signals-scout-conversations` | Conversations product enabled but no inbound channel connected yet |
| `signals-scout-data-warehouse` | No external warehouse sources connected |
| `signals-scout-inbox-validation` | No resolved reports yet on a fresh setup |
| `signals-scout-insight-alerts` | No configured alerts |
| `signals-scout-mcp-tool-calls` | No `$mcp_tool_call` telemetry |
| `signals-scout-skills-store` | Skill-hygiene scout; not needed yet |
| `signals-scout-tasks` | No PostHog Tasks configured |
| `signals-scout-web-vitals` | No `$web_vitals` events confirmed; enable if Core Web Vitals are instrumented |

---

## Custom Scouts

**Decision:** None — user declined all proposals after reviewing the gap analysis.

**Surfaces analyzed:**

| Surface | Filter applied | Outcome |
|---|---|---|
| Job search pipeline (job_search_started → job_found ratio) | Proposed — watchable, discriminator clear, uncovered by product-analytics (needs saved funnels) | Declined by user |
| Sign-in flow health (sign_in_completed count) | Proposed — watchable, auth outage would block all users | Declined by user |
| Company research reliability (company_researched) | Ruled out — no "research attempted" event; can't distinguish failure from "nobody clicked" | Not proposed |
| AI/LLM cost and latency (GPT-4o) | Ruled out — no `$ai_*` events instrumented yet | Not proposed |
| Profile completion funnel | Ruled out — single-event funnel, discriminator too weak | Not proposed |

**Noise escape hatch:** If a scout becomes noisy later, set `emit: false` on its config in PostHog to switch it to dry-run without disabling it entirely.

---

## Replay Vision Scanners

Replay Vision scanners are LLMs that watch individual session recordings on a schedule and push findings directly to the Self-driving inbox. Findings arrive at half weight — a report is promoted only when two independent signals corroborate the same issue. The scanners are the only part of this setup that spend Replay Vision credits (5 credits per observation at the `gemini-3-flash-preview` tier).

The project has no session recordings yet. Both scanners are armed and will begin scanning the day recordings arrive — no second setup needed.

**Credit spend:** The in-product sizing skill (`creating-replay-vision-scanners`) was not available on this deploy — spend was not verified. The briefs use bounded sampling defaults (0.5 and 1.0 of matching sessions) and are deliberately small, so projected spend should be a small fraction of the monthly budget.

### Breakage monitor — "Job search breakage"

| Field | Value |
|---|---|
| ID | `01a0334d-ceb2-7f7a-bd77-266e04bb64aa` |
| Scanner type | `monitor` |
| Watches | Sessions on any URL containing `/find-jobs` (covers `/find-jobs` search results and `/find-jobs/[id]` job details) |
| Why this flow | This is where users complete the core job search, review match scores, trigger company research, and click Apply — the highest-value pages in the app |
| Sampling rate | 50% of matching sessions |
| `emits_signals` | `true` — findings go to the inbox |
| Status | **Created** |

Watch-for (product-specific failures): job list blank after a search, company research dossier failing to appear, Apply Now button doing nothing, match scores or descriptions missing from job details, Find Jobs button unresponsive.

### Frustration monitor — "Job hunter frustration"

| Field | Value |
|---|---|
| ID | `01a0334d-f405-7ad2-b113-7e180451c580` |
| Scanner type | `monitor` |
| Watches | All sessions containing a `$rageclick` event (no URL filter — owns the *what they did* axis) |
| Sampling rate | 100% of matching sessions |
| `emits_signals` | `true` — findings go to the inbox |
| Status | **Created** |

Stuck moments (product-specific): hammering Find Jobs with no results, repeatedly clicking Research Company while dossier fails, retrying resume upload after silent errors, clicking Apply Now multiple times when link doesn't open.

---

## Follow-ups

- [ ] **Connect a Conversations inbound channel** — Conversations (Support) is enabled but tickets only arrive once an email, inbox, or Slack channel is connected. Set it up in PostHog → Settings → Conversations.
- [ ] **Add an AI observability channel** — JobPilot makes heavy GPT-4o calls (job matching, resume parsing, company research synthesis). Instrumenting them with `$ai_generation` events and enabling `signals-scout-ai-observability` would give visibility into cost, latency, and quality regressions. See [PostHog AI observability docs](https://posthog.com/docs/ai-engineering).
- [ ] **Save a job search funnel in PostHog** — Once `job_search_started` → `job_found` events are confirmed flowing, save a funnel insight so `signals-scout-product-analytics` can watch its conversion rate automatically.
- [ ] **Enable `signals-scout-replay-vision`** — Once session recordings accumulate (at least a few weeks), enable this scout to detect trends across scanner observations (scoring shifts, recurring themes).
- [ ] **Verify `$web_vitals` capture** — If Core Web Vitals are being captured, enable `signals-scout-web-vitals` for per-page LCP/INP/CLS monitoring.
- [ ] **Enable custom job-search-pipeline scout** — If you want proactive alerting on job_search_started → job_found conversion drops, re-run this setup to add the custom scout (declined this run).
- [ ] **Verify Replay Vision credit spend** — The `creating-replay-vision-scanners` sizing skill was unavailable on this deploy. Once recordings arrive, check the scanners' `credits_this_month` values in the [Replay Vision settings](https://eu.posthog.com/project/250712/replay-vision) and set `credit_limit` on each scanner if needed.

---

## What Happens Next

- The scout coordinator picks up fresh configs within ~30 minutes and the first scans run
- Each enabled scout runs once per day, drawing from the 100-run daily budget
- Replay Vision scanners sweep matching recordings every 5 minutes once recordings exist
- Findings cluster into reports in the inbox; immediately-actionable ones can start coding tasks automatically
- Visit the inbox: https://eu.posthog.com/project/250712/inbox
