# Progress Tracker

Update this file after every completed feature. Any AI agent reading this should immediately know what is done, what is in progress, and what is next.

---

## Current Status

**Phase:** Phase 3 — Find Jobs Page
**Last completed:** 10 Adzuna Job Discovery
**Next:** 11 Filter + Sort + Pagination

---

## Progress

### Phase 1 — Foundation

- [x] 01 Homepage
- [x] 02 Auth
- [x] 03 PostHog Initialization
- [x] 04 Database Schema

### Phase 2 — Profile Page

- [x] 05 Profile Page — Full UI
- [x] 06 Profile Save Logic
- [x] 07 AI Profile Extraction from Resume
- [x] 08 Resume PDF Generation from Profile

### Phase 3 — Find Jobs Page

- [x] 09 Find Jobs Page — Full UI
- [x] 10 Adzuna Job Discovery
- [ ] 11 Filter + Sort + Pagination

### Phase 4 — Job Details Page

- [ ] 12 Job Details Page — Full UI
- [ ] 13 Company Research Agent

### Phase 5 — Dashboard

- [ ] 14 Dashboard Page — Full UI
- [ ] 15 Stats Bar — Real Data
- [ ] 16 Recent Activity — Real Data
- [ ] 17 Analytics Charts — PostHog Data

---

## Decisions Made During Build

- Homepage CTAs link to `/login` until authentication is implemented in Feature 02.
- Homepage uses supplied public preview assets rather than recreating dashboard, jobs, or agent-log illustrations.
- Auth uses `@insforge/sdk` and its SSR helpers. Next.js 16 `proxy.ts` protects authenticated routes; `middleware.ts` is deprecated.
- A minimal authenticated dashboard destination exists until Feature 14 replaces it with the complete dashboard UI.
- PostHog initializes through Next.js `instrumentation-client.ts`; server captures must create and shut down a client per request. OAuth identifies the authenticated user after the server-side code exchange, and authenticated Navbar instances reset PostHog only after InsForge signs out. Domain events remain limited to the four event names in `code-standards.md` and will be added with their owning flows.
- Database schema lives in `migrations/20260824182323_feature-04-database-schema.sql` and has been applied through the InsForge CLI. `profiles`, `agent_runs`, `jobs`, and `agent_logs` have user-scoped RLS; `agent_runs.status`, `jobs.source`, and `jobs.match_score` have durable database checks. The private `resumes` bucket is path-scoped to `{user_id}/resume.pdf` through four `storage.objects` RLS policies. Tailored job-description fields remain intentionally out of scope.
- Profile UI is in `app/profile/page.tsx` and `components/profile/ProfileForm.tsx`. Tags and up to three roles remain local form state until Save Profile serializes them; extraction and generated-resume actions remain deferred to Features 07–08.
- Profile save logic now authenticates inside `actions/profile.ts`, persists user-scoped profile fields, and pre-fills `/profile` from InsForge. `migrations/20260824191431_add-profile-save-metadata.sql` is applied: it stores resume URL/key plus completion percentage and missing fields. PDF uploads overwrite the fixed private path `{user_id}/resume.pdf`; first-time completion captures the existing `profile_completed` event. Extraction and generated-resume actions remain deferred to Features 07–08.
- Profile field edits autosave after 800ms of inactivity. The manual Save now button remains for an immediate save; selecting a resume remains manual so users explicitly choose when to upload a file.
- A successful save flashes only edited field's border with the success token for 3.5 seconds before it returns to normal; save errors retain that field's error border until a successful retry.
- Work-experience cards can be removed, then persist through the existing autosave flow.
- Profile completion indicator uses a compact, token-error SVG ring with a correctly proportioned track, fill, and percentage label.
- Resume selection uploads immediately through the existing authenticated profile action. The action body limit accommodates the 5 MB PDF rule, and `GET /api/resume` verifies profile ownership before issuing a five-minute signed URL for a new browser tab.
- Resume metadata now preserves the uploaded filename in `profiles.resume_pdf_name`, backfills existing saved resumes as `resume.pdf`, and shows that name after reload instead of the ambiguous `Resume on file.` label.
- Profile saves now use a shared Zod validation module. Empty completion fields remain valid drafts, while invalid supplied values return accessible inline field errors and prevent both the profile write and any resume upload. Resume validation verifies PDF extension or MIME type, signature, and the 5 MB maximum before Storage is touched; profile dates use non-future `MM/YY` input with the current-year pivot.
- Profile save feedback overrides the standard accent focus ring while a field is green or red, so only its current save state is visible. Each invalid field exposes its human-readable reason immediately below the control.
- Resume status now labels the persisted uploaded filename explicitly instead of using generic on-file wording.
- Successful field-save borders now fade out to the normal token before standard focus styling resumes.

---

- The project has no OpenAI account. All AI calls go through an OpenAI-compatible gateway, currently llmapi.ai, via `lib/ai.ts` — `createAiClient()` plus the `AI_MODEL` constant. The gateway URL, key, and model are all environment values (`LLM_API_URL`, `LLM_API_KEY`, `LLM_MODEL`), so changing provider is an `.env.local` edit and never a code change. `architecture.md`, `code-standards.md`, `library-docs.md`, `project-overview.md`, and `build-plan.md` no longer reference GPT-4o or `OPENAI_API_KEY`; Features 08, 10, and 13 must read the model from `lib/ai.ts` and never write a literal model name.
- Resume extraction parses the resume already saved in Storage at `{user_id}/resume.pdf` rather than a file re-posted from the browser, so `POST /api/resume/extract` takes no body and re-verifies `profiles.resume_pdf_key` the same way `GET /api/resume` does.
- Extraction fills empty fields only. Skills and industries union case-insensitively, work-experience roles append up to the existing three-role cap and skip duplicates by company plus title, and Job Preferences and `email` are never touched. Re-running extraction is idempotent.
- Extraction never writes to the database. It cancels the pending autosave, populates the form, and shows a review panel; persistence waits for the user's next save. That is a deliberate exception to the autosave behaviour from Feature 06, and it matches the build plan's review step.
- Uncontrolled inputs are repopulated by merging extracted values into a `defaults` state object and bumping a `key` on the form to remount it, rather than converting every field to controlled state. The remount clears the file input, which is harmless because the resume is already persisted and the save action only uploads when a `File` is present.
- Model output is treated as untrusted input. Zod preprocessing in `lib/resume-extraction.ts` coerces nulls and numbers, normalises enum casing, drops dates that are not valid non-future `MM/YY`, drops out-of-range years, and caps lists — so a sloppy response can never produce a value the save validation would reject. `parseExtractedProfile` is separated from the network call so the rules can be exercised without the gateway.
- `pdf-parse` v2 is class-based — `new PDFParse({ data }).getText()`, then `destroy()` in a `finally`. There is no default export, and it is listed in `serverExternalPackages` in `next.config.ts`. Empty or under-200-character text returns the build plan's "Could not extract text from this PDF" message.
- `max_completion_tokens: 4000`, not the `max_tokens: 800` the original library docs specified. Zen's GPT models follow the current OpenAI contract, and reasoning models spend tokens before emitting any JSON. A 400 that rejects `temperature` is retried once without it.
- Verified: pdf-parse against a real generated PDF, 1008 characters with correct text and `MM/YY` dates; 28 assertions over the Zod preprocessing and merge rules, covering messy model output, over-cap lists, duplicate roles, and idempotence; unauthenticated `POST /api/resume/extract` returns 401 inside the success wrapper; production build and lint clean. The temporary verification script was removed because the project has no test harness.
- Verified end to end with a live model call on llmapi.ai (`gpt-5.6-luna`): a generated resume PDF produced all three roles with correct `MM/YY` dates and `current: true` on the present role, plus education, skills, industries, and 15 filled fields, with a re-run filling zero. `workAuthorization` correctly stayed empty because the resume never states it. The gateway accepts `temperature` and `max_completion_tokens`, and one extraction costs about $0.001.
- Provider history: the build was first wired to OpenCode Zen, which was abandoned because the account had no credit and its key began rejecting `/chat/completions` outright. The swap to llmapi.ai touched only `lib/ai.ts` and `.env.local`, which is the point of keeping the gateway behind environment values. Note the host is `api.llmapi.ai`, not `api.llmapi.com` — the `.com` host does not resolve.

- The resume dropzone's drag-and-drop and click-to-upload were never wired — Feature 05 built the dashed panel and its "Click to upload or drag and drop" copy, but the element had no `onDrop`, `onDragOver`, or `onClick`. Both affordances now work. A dropped file must be assigned onto the hidden file input through a `DataTransfer`, otherwise the form's `resume` field stays empty and the drop silently saves nothing. `onDragOver` must `preventDefault` or the browser navigates to the file, `onDragLeave` ignores moves onto child elements via a `relatedTarget` containment check, and both inner buttons call `stopPropagation` so they do not re-trigger the dropzone click. Dropped files reuse the same `acceptResume` path as picked files, so the existing Zod resume validation still applies, and drops are ignored while a save or extraction is in flight.
- The review panel for extraction is cleared where a save begins — in `saveCurrentValues` and the form's `onSubmit` — not inside the action-state effect. ESLint's `react-hooks/set-state-in-effect` rejects the effect version, and clearing at save time keeps the panel's "nothing is saved yet" claim from ever going stale.
- TypeScript runs in two tiers. `typescript` is pinned to `~6.0.3` and stays the compiler that `next build`, the editor, and ESLint all use; `typescript7` is an alias of `typescript@7` used only by `npm run typecheck:fast`. The pin is `~6.0.3`, not `^6.0.3`, because typescript-eslint peers `<6.1.0` and a 6.1 bump would silently gut the lint tree. `npm run typecheck` (TS 6) is the gate; `typecheck:fast` (TS 7) is the inner loop and runs the same 1025 files roughly 3x quicker.
- TypeScript 7 as the sole compiler was attempted first and reverted. It works for builds — `tsc` is clean and Next 16.3.2 type-checks with it in 0.77s against 4.0s, because `experimental.useTypeScriptCli` already defaults to `true` and `next build` shells out to the local CLI — but TS 7 ships no programmatic API (no `lib/typescript.js`), so npm strips `@typescript-eslint/parser`, `eslint-plugin`, `typescript-estree`, and `type-utils` from the tree and `npm run lint` dies loading `eslint-config-next`. An npm `overrides` block nesting TS 6 under typescript-eslint does not help: npm removes the packages rather than nesting a second TypeScript. Revisit at TS 7.1, when the stable API lands and typescript-eslint can widen its peer range; the move is then a version bump plus deleting the `typescript7` alias and the `typecheck:fast` script.
- The 29 skills in `.agents/skills/` are registered as Claude Code project skills through directory junctions in `.claude/skills/`, so `/architect`, `/imprint`, `/review`, `/recover`, and `/remember` work as slash commands. Junctions rather than copies because `.agents/skills` is the hash-locked source in `skills-lock.json`; both directories are gitignored, so nothing is committed. `tailwind-css` stays invisible by its own frontmatter (`user-invocable: false` plus `disable-model-invocation: true`) and is a reference bundle, not a skill to invoke.

## Notes

_Add notes here as the build progresses — workarounds, patterns, anything that differs from the context files._

### Feature 08 — Resume PDF Generation from Profile

Decisions settled in an `/architect` session and carried into the implementation.

- `@react-pdf/renderer` 4.8.1 is installed and listed in `serverExternalPackages` in `next.config.ts` beside `pdf-parse` — it ships font and layout binaries the server bundler must not trace.
- The generated PDF overwrites the single path `{user_id}/resume.pdf`. That keeps the four path-scoped storage RLS policies from Feature 04 untouched — a separate `generated-resume.pdf` path would need a migration, new profile columns, and two-resume UI, which is larger than this feature. Because overwriting destroys a resume the user uploaded, the client confirms the replacement first when `resume_pdf_key` is set.
- The button saves before it generates. It runs the existing `saveProfile` action, waits for success, then POSTs to `/api/resume/generate`; field errors abort generation. Reading the DB directly would silently ignore unsaved extraction results, which Feature 07 deliberately leaves unpersisted.
- Minimum bar to generate: a full name, plus either one complete work-experience role or a non-empty skills list. Below that the route returns a message naming what to fill in. Requiring `is_complete` would block users missing only resume-irrelevant fields such as Remote Preference.
- The model writes prose only — `{ summary, roles: [{ company, title, bullets }] }` and nothing else. Name, contact, dates, education, and skills are read from the `profiles` row and written into the PDF verbatim, so a fabricated company name or shifted date is structurally impossible in a document the user sends to employers.
- One page is enforced by caps in the Zod schema (bullets per role, characters per bullet, summary length) plus a skills cap in the renderer. `@react-pdf/renderer` cannot report overflow, so a render-measure-retry loop would be guesswork.
- No new PostHog event. `code-standards.md` fixes the project at four event names and resume generation is not one of them.
- The route stayed `app/api/resume/generate/route.ts` as `architecture.md` specifies. JSX lives in a colocated `ResumeDocument.tsx` that exports `renderResumePdf(content)`, so the route never holds JSX and never needs `createElement`. Gateway handling follows Feature 07: `response_format: json_object`, `max_completion_tokens: 4000`, `temperature: 0.4`, and one retry without `temperature` on a 400 that rejects it.
- The saved file is named `{full-name}-resume.pdf` in `resume_pdf_name`, so the existing `Saved resume: {filename}` label distinguishes a generated resume from an uploaded one. `Extract from Resume` then points at the generated PDF, which is harmless — extraction fills empty fields only and is idempotent.
- No design exists for the PDF; `context/designs` has nothing for it. Layout is a conventional single column: header, summary, experience, education, skills. A PDF cannot read the CSS variables in `ui-tokens.md`, so `ResumeDocument.tsx` holds a small `palette` object mirroring four token values by name. That is the one place in the project where a hex literal is correct.
- Sequencing save-then-generate is done by wrapping the server action rather than by reacting to `actionState` in an effect. `useActionState` is given a client function that awaits `saveProfile`, then — only when the submitted `FormData` carries `intent: "generate"` — awaits the generation fetch. The click handler sets that marker on a `FormData` it builds itself, so a native form submit is still an ordinary save. This keeps `isPending` true across both steps and avoids the `react-hooks/set-state-in-effect` problem Feature 07 hit.
- The confirmation is an inline two-button row inside the resume card, not a browser `confirm()`. It reuses the existing secondary and accent primary treatments, so no new UI pattern is introduced.
- The generated-resume status message clears wherever a save begins, for the same reason the extraction review panel does: its "from your saved profile" claim goes stale the moment the profile changes.
- Storage `upload(path, file)` takes a `File | Blob` and uses PUT semantics that replace the object in place, so the buffer is wrapped in a `Blob` and no `upsert` flag exists or is needed.
- An `app/api/_name` folder is a private folder in the App Router and is not routed. A temporary verification route had to be named without the underscore prefix to be reachable.
- Verified: 30 assertions through a temporary route inside the running dev server, covering the readiness bar, messy and malformed model output against the Zod caps, fact-verbatim merging, bullet fallback to `responsibilities`, and file-name slugging. Real `renderToBuffer` output is a valid single-page PDF, and the worst case the caps allow — 3 roles x 4 max-length bullets, max summary, 18 skills — still renders one page. A live call to llmapi.ai (`gpt-5.6-luna`) produced a grounded summary, present tense on the current role and past tense on the prior one, invented nothing, and rendered in one page at 2,889 bytes. The temporary route was removed; the project has no test harness. `npm run typecheck`, `npm run lint`, and `npm run build` are clean.

### Feature 09 — Find Jobs Page, Full UI

- `app/find-jobs/page.tsx` holds the mock data and composes four UI-only components in `components/find-jobs/`: `SearchControls`, `JobFilters`, `JobsTable`, `JobsPagination`. `types/index.ts` was created for the shared `JobListItem` type. A fifth file, `components/find-jobs/icons.tsx`, holds the four inline SVGs, because the search icon is needed by two components and duplicating it would be worse than one extra file in the folder.
- Built to `context/designs/find-jobs.png`, which `ui-rules.md` names as the source of truth for visual decisions. **Three places where the design and the written specs disagreed. All three were put to the user and settled in favour of the shipped page; the losing documents have been corrected, so none of these is still open:**
  - **No SOURCE column.** `build-plan.md` listed `SOURCE (Search/URL badge)` between Salary and Date Found; the design has five columns and no badge. Settled: five columns, and `build-plan.md` Feature 09 has been corrected. Feature 10 only discovers through Adzuna search, so the badge would read the same on every row. `jobs.source` and `JobListItem.source` still carry `search` / `url`, so the column is a markup change if a URL-add flow is ever built.
  - **Match-score bands differ.** `ui-rules.md` said 80–100 green, 60–79 blue, below 60 orange. The design shows 88% and 85% blue and 72% orange — green from 90, blue from 80, orange below. Settled: the design bands stand and `ui-rules.md` has been rewritten to them, along with the 6px height and 96px width the page actually uses. The bands are deliberately **not** reconciled to Feature 11's High Match filter (`>= 70`): colour says how strong a match is, the filter says whether it is worth the user's time. `ui-rules.md` now records that so it is not "fixed" later.
  - **Page padding.** The design's gutter is roughly 56px; `ui-rules.md` says 32px and every other page already uses 32px. Settled: 32px everywhere, unchanged. `ui-rules.md` now notes that the design exports use a wider gutter as a rendering artefact, so this does not get re-opened against `dashboard.png` or `job-details.png`.
- The navbar in the design carries an icon beside each item. The built navbar has none. Left alone deliberately: it is shared across every page and belongs to Feature 01, not to this feature's scope.
- Row density and column proportions were measured against the design and matched: 65px rows, a 32px company icon tile, and column widths of 22/29/17/18/14 percent.
- Verified in a browser at 1440px through a temporary unauthenticated copy of the page, since `/find-jobs` is behind auth. Computed styles confirmed against `ui-tokens.md`: 16px card radius on `#FFFFFF` with `#E7EAF3` borders, 12px/500/`#6A7282` uppercase headers, a 6px `#E7EAF3` track, and fills of `#10B981`, `#61A8FF`, `#FF8904`. The temporary page was removed. The Browser pane could not composite, so no screenshot comparison was possible — the check was computed styles and geometry, not pixels. `typecheck`, `lint`, and `build` are clean.
- All controls are inert by design. Search, filter, sort, and pagination are wired in Features 10 and 11.

### Feature 10 — Adzuna Job Discovery

**Two environment problems, both found during this feature and both now fixed by the user:**

- **The Adzuna credentials in `.env.local` were rejected** — a bare request with no `category` or `where` still returned `401 AUTH_FAIL`, so it was the key pair, not the request shape. The `ADZUNA_APP_ID` was 9 characters where Adzuna issues 8. The corrected pair returns 200. If this recurs, test the credentials directly against `https://api.adzuna.com/v1/api/jobs/gb/search/1` before suspecting the client.
- **PostHog had never fired an event.** `lib/posthog-client.ts` and `lib/posthog-server.ts` both read `NEXT_PUBLIC_POSTHOG_KEY`, matching `build-plan.md` Feature 03, but `.env.local` defined `NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN`, so both factories returned `null` and every capture silently no-opped — including `profile_completed` from Feature 06. The variable has been renamed; the code was already correct. Events before this date do not exist, so Feature 17's charts start from here.

**Decisions:**

- **One model call per job, run in parallel.** A malformed response costs one job rather than the run, which is what `code-standards.md` asks for. The failed job is logged to `agent_logs` at `warning` and skipped, because `jobs.match_score` is `NOT NULL` and there is no honest value to store. Roughly $0.01 per ten-job search.
- **Duplicates are skipped in code, not by a constraint.** Results already saved for this user under the same company and title are dropped before scoring, so re-running a search costs nothing and does not fill the table with copies. No migration; the run message reports how many were already there.
- **The jobs table now reads from the database.** `app/find-jobs/page.tsx` queries the user's jobs ordered by `found_at`, and the mock array is gone. Feature 11 adds filter, sort and real pagination on top — until then the footer reports a single page.
- **A "strong match" is `match_score >= 70`**, the same threshold Feature 11 calls High Match. Note this is deliberately not the bar-colour banding, which is 90/80 — see the Feature 09 entry.
- Searching requires a profile with a current title or at least one skill, since scoring against nothing is meaningless. The route returns a 422 naming what to add.
- `agent_runs` is written before the search and closed as `completed` or `failed` in a `finally`-style catch, so a crashed run never sits at `running`.
- Model output is untrusted, as in Features 07 and 08: `match_score` is clamped to 0–100 and rounded before it reaches the database check constraint, the reason is capped at 600 characters, and both skill lists dedupe case-insensitively and cap at 12.
- Country is detected from the trailing comma-separated segment of the location first, then anywhere in the string, then falls back to `us`.

**Files:** `lib/adzuna.ts` (API client, country detection, salary formatting), `agent/matcher.ts` (AI scoring), `agent/adzuna.ts` (orchestration), `agent/types.ts`, `app/api/agent/find/route.ts`, `lib/utils.ts` (`formatRelativeTime`). `components/find-jobs/SearchControls.tsx` became a client component.

**Verified in two passes, both through temporary routes in the dev server, both since removed.** First, 32 assertions offline: country detection across aliases, codes and fallbacks, salary formatting, relative time, and the Zod hardening of match output including score clamping at both ends, reason capping, case-insensitive skill dedupe and non-array rejection. Then, once the credentials were fixed, 12 assertions against the live path: a real Adzuna search for "Frontend Engineer" in London returned five postings, all with title, company and redirect URL, and all five scored in 11.8 seconds through the same parallel shape the agent uses. Scores came back differentiated — 86, 82, 78, 78, 72 — with matched and missing skills grounded in each posting, correctly reading domain gaps like crypto trading and construction as missing rather than inventing them. `typecheck`, `lint` and `build` are clean.

**Still unverified: the database writes and the browser flow** — `runJobDiscovery` needs a signed-in session for RLS to permit the `jobs`, `agent_runs` and `agent_logs` writes, so the run lifecycle, the duplicate skip, the PostHog captures and the search button itself have not been exercised. Everything either side of those writes is proven. One logged-in search settles it.