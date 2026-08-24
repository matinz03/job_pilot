# Progress Tracker

Update this file after every completed feature. Any AI agent reading this should immediately know what is done, what is in progress, and what is next.

---

## Current Status

**Phase:** Phase 2 — Profile Page
**Last completed:** 07 AI Profile Extraction from Resume
**Next:** 08 Resume PDF Generation from Profile

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
- [ ] 08 Resume PDF Generation from Profile

### Phase 3 — Find Jobs Page

- [ ] 09 Find Jobs Page — Full UI
- [ ] 10 Adzuna Job Discovery
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

- The project has no OpenAI account. All AI calls go through the OpenCode Zen gateway, which is OpenAI-compatible, via `lib/ai.ts` — `createAiClient()` plus the `AI_MODEL` constant, default `gpt-5.6-luna`, overridable from `.env.local`. `OpenCode_API_Key` was renamed to `OPENCODE_API_KEY`. `architecture.md`, `code-standards.md`, `library-docs.md`, `project-overview.md`, and `build-plan.md` no longer reference GPT-4o or `OPENAI_API_KEY`; Features 08, 10, and 13 must read the model from `lib/ai.ts` and never write a literal model name.
- Resume extraction parses the resume already saved in Storage at `{user_id}/resume.pdf` rather than a file re-posted from the browser, so `POST /api/resume/extract` takes no body and re-verifies `profiles.resume_pdf_key` the same way `GET /api/resume` does.
- Extraction fills empty fields only. Skills and industries union case-insensitively, work-experience roles append up to the existing three-role cap and skip duplicates by company plus title, and Job Preferences and `email` are never touched. Re-running extraction is idempotent.
- Extraction never writes to the database. It cancels the pending autosave, populates the form, and shows a review panel; persistence waits for the user's next save. That is a deliberate exception to the autosave behaviour from Feature 06, and it matches the build plan's review step.
- Uncontrolled inputs are repopulated by merging extracted values into a `defaults` state object and bumping a `key` on the form to remount it, rather than converting every field to controlled state. The remount clears the file input, which is harmless because the resume is already persisted and the save action only uploads when a `File` is present.
- Model output is treated as untrusted input. Zod preprocessing in `lib/resume-extraction.ts` coerces nulls and numbers, normalises enum casing, drops dates that are not valid non-future `MM/YY`, drops out-of-range years, and caps lists — so a sloppy response can never produce a value the save validation would reject. `parseExtractedProfile` is separated from the network call so the rules can be exercised without the gateway.
- `pdf-parse` v2 is class-based — `new PDFParse({ data }).getText()`, then `destroy()` in a `finally`. There is no default export, and it is listed in `serverExternalPackages` in `next.config.ts`. Empty or under-200-character text returns the build plan's "Could not extract text from this PDF" message.
- `max_completion_tokens: 4000`, not the `max_tokens: 800` the original library docs specified. Zen's GPT models follow the current OpenAI contract, and reasoning models spend tokens before emitting any JSON. A 400 that rejects `temperature` is retried once without it.
- Verified: pdf-parse against a real generated PDF, 1008 characters with correct text and `MM/YY` dates; 28 assertions over the Zod preprocessing and merge rules, covering messy model output, over-cap lists, duplicate roles, and idempotence; unauthenticated `POST /api/resume/extract` returns 401 inside the success wrapper; production build and lint clean. The temporary verification script was removed because the project has no test harness.
- Not verified end to end: the live model call. The OpenCode Zen key returns `AuthError: Invalid API key` on `/chat/completions` while `/models` still returns 200, and the workspace balance is $0. Free Zen models answered correctly earlier in the same session, so the integration shape is proven, but the Zen account needs attention before extraction works in the running app.

- The resume dropzone's drag-and-drop and click-to-upload were never wired — Feature 05 built the dashed panel and its "Click to upload or drag and drop" copy, but the element had no `onDrop`, `onDragOver`, or `onClick`. Both affordances now work. A dropped file must be assigned onto the hidden file input through a `DataTransfer`, otherwise the form's `resume` field stays empty and the drop silently saves nothing. `onDragOver` must `preventDefault` or the browser navigates to the file, `onDragLeave` ignores moves onto child elements via a `relatedTarget` containment check, and both inner buttons call `stopPropagation` so they do not re-trigger the dropzone click. Dropped files reuse the same `acceptResume` path as picked files, so the existing Zod resume validation still applies, and drops are ignored while a save or extraction is in flight.
- The review panel for extraction is cleared where a save begins — in `saveCurrentValues` and the form's `onSubmit` — not inside the action-state effect. ESLint's `react-hooks/set-state-in-effect` rejects the effect version, and clearing at save time keeps the panel's "nothing is saved yet" claim from ever going stale.
- TypeScript stays on 5.9.3 for now. A migration was trialled out-of-tree: TS 6.0.3 and 7.0.2 both type-check this repo with zero errors, and 7.0.2 runs it in 0.81s against 4.88s for 5.9.3. The codebase has no TS enums, namespaces, decorators, or triple-slash references, and Next 16.3.2 already supports TS 7 for builds because `experimental.useTypeScriptCli` defaults to `true`, so `next build` shells out to the local `tsc` CLI instead of the JS API. The single blocker is ESLint: TS 7 ships no programmatic API (no `lib/typescript.js`), and `eslint-config-next` depends on `typescript-eslint`, whose family peers `>=4.8.4 <6.1.0`. `npm install typescript@7` does not error — it silently removes the `@typescript-eslint/*` tree, so lint breaks later rather than at install. Planned path: `typescript@6.0.3` now (dry-run confirms ESLint survives), TS 7 alongside as a non-blocking fast checker invoked as `node node_modules/typescript7/lib/tsc.js` to avoid bin collisions, then a full move at TS 7.1 when the stable API lands. Not started.
- The 29 skills in `.agents/skills/` are registered as Claude Code project skills through directory junctions in `.claude/skills/`, so `/architect`, `/imprint`, `/review`, `/recover`, and `/remember` work as slash commands. Junctions rather than copies because `.agents/skills` is the hash-locked source in `skills-lock.json`; both directories are gitignored, so nothing is committed. `tailwind-css` stays invisible by its own frontmatter (`user-invocable: false` plus `disable-model-invocation: true`) and is a reference bundle, not a skill to invoke.

## Notes

_Add notes here as the build progresses — workarounds, patterns, anything that differs from the context files._
