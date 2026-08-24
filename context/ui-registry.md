# UI Registry

Living document. Updated after every component is built. Read this before building any new component — match existing patterns exactly before inventing new ones.

---

## How to Use

Before building any component:

1. Check if a similar component already exists here
2. If yes — match its exact classes
3. If no — build it following ui-rules.md and ui-tokens.md, then add it here

After building any component — update this file with the component name, file path, and exact classes used.

---

## Components

### Database Schema

Files: `migrations/20260824182323_feature-04-database-schema.sql`
Last updated: 2026-08-24

**Pattern notes:** Non-visual foundation. User-owned application records share a direct `auth.users` reference and user-scoped RLS. Private resume objects use the `{user_id}/resume.pdf` path convention, enforced by storage RLS for every read and mutation.

### PostHog Instrumentation

Files: `instrumentation-client.ts`, `lib/posthog-client.ts`, `lib/posthog-server.ts`
Last updated: 2026-08-24

**Pattern notes:** Non-visual foundation. Next.js client instrumentation initializes PostHog before hydration; future server captures use a request-scoped client with immediate flushing. No UI pattern introduced.

### Navbar

File: `components/layout/Navbar.tsx`
Last updated: 2026-08-23

| Property | Class |
| --- | --- |
| Background | `bg-surface` |
| Border | `border-b border-border` |
| Border radius | none |
| Text — primary | active `text-accent`; inactive `text-text-dark` |
| Text — secondary | none |
| Spacing | `h-16`, `px-4 sm:px-6 lg:px-8` |
| Hover state | `hover:text-accent`; guest CTA uses `hover:-translate-y-0.5 hover:bg-overlay-dark hover:shadow-button-hover`; authenticated logout uses `hover:bg-surface-secondary` |
| Shadow | `shadow-button` on guest CTA; none on authenticated logout |
| Accent usage | active `border-accent text-accent`; `hover:text-accent` |

**Pattern notes:** Full-width 64px white header. Content aligns to 1440px maximum page width. Desktop navigation is centered. Authenticated routes pass their active item to display a 2px purple bottom border and accent text. Guests see dark primary CTA; authenticated pages use a secondary logout button with inline human-readable error text.

### Hero and CTA

File: `components/homepage/Hero.tsx`, `components/homepage/Features.tsx`
Last updated: 2026-08-23

| Property | Class |
| --- | --- |
| Background | `hero-glow`, `bg-surface-tertiary` |
| Border | `border border-border` |
| Border radius | none |
| Text — primary | `text-text-slate` |
| Text — secondary | `text-text-secondary` |
| Spacing | `px-6 py-20`, `lg:px-16 lg:py-24` |
| Hover state | `hover:-translate-y-0.5 hover:bg-overlay-dark hover:shadow-button-hover`, `hover:-translate-y-0.5 hover:bg-surface hover:shadow-button-hover` |
| Shadow | `shadow-button` on primary and secondary CTA buttons; supplied preview asset otherwise |
| Accent usage | `text-accent` for eyebrow labels |

**Pattern notes:** Marketing panels use shared soft hero glow and square, bordered container. Both CTA variants use `shadow-button` plus hover lift; primary CTA is `bg-overlay` and secondary CTA is a translucent white surface with default border.

### Homepage Feature Panels

File: `components/homepage/HowItWorks.tsx`, `components/homepage/Features.tsx`
Last updated: 2026-08-23

| Property | Class |
| --- | --- |
| Background | `bg-surface`, `bg-surface-tertiary` |
| Border | `border-x border-b border-border` |
| Border radius | none |
| Text — primary | `text-text-slate` |
| Text — secondary | `text-text-secondary` |
| Spacing | `px-8 py-7`, `lg:px-16` |
| Hover state | none |
| Shadow | none |
| Accent usage | `border-l-accent`, `border-l-success` |

**Pattern notes:** Editorial two-column sections use white copy panel plus muted preview panel. Each list row has a top border; one row may carry a 2px semantic accent rail.

### Login Form

File: `components/auth/LoginForm.tsx`
Last updated: 2026-08-24

| Property | Class |
| --- | --- |
| Background | `bg-surface` |
| Border | `border border-border` |
| Border radius | `rounded-xl` |
| Text — primary | `text-text-primary`, `text-accent` |
| Text — secondary | `text-text-secondary`, `text-error` |
| Spacing | `p-6 sm:p-8`, `space-y-2`, `mt-8 space-y-3` |
| Hover state | `hover:bg-surface-secondary`; primary provider action uses `hover:-translate-y-0.5 hover:bg-overlay-dark hover:shadow-button-hover` |
| Shadow | `shadow-card`; primary provider action uses `shadow-button` |
| Accent usage | `text-accent` eyebrow label |

**Pattern notes:** Authentication surface uses established white card treatment. Google remains secondary; GitHub uses the existing dark primary CTA treatment. Disabled provider buttons use opacity and no pointer cursor.

### OAuth Callback

File: `components/auth/OAuthCallback.tsx`
Last updated: 2026-08-24

| Property | Class |
| --- | --- |
| Background | `bg-surface` |
| Border | `border border-border` |
| Border radius | `rounded-xl` |
| Text — primary | `text-text-primary` |
| Text — secondary | `text-text-secondary` |
| Spacing | `p-6 sm:p-8`, `mt-2` |
| Hover state | none |
| Shadow | `shadow-card` |
| Accent usage | none |

**Pattern notes:** Callback status mirrors the login card rather than introducing a separate progress pattern.

### Dashboard Placeholder

File: `app/dashboard/page.tsx`
Last updated: 2026-08-24

| Property | Class |
| --- | --- |
| Background | `bg-background`, `bg-surface` |
| Border | `border border-border` |
| Border radius | `rounded-xl` |
| Text — primary | `text-text-primary`, `text-accent` |
| Text — secondary | `text-text-secondary` |
| Spacing | `p-6 sm:p-8`, `mt-2` |
| Hover state | none |
| Shadow | `shadow-card` |
| Accent usage | `text-accent` eyebrow label |

**Pattern notes:** Minimal authenticated landing card preserves the login surface pattern until Feature 14 supplies dashboard content.

### Profile Form

Files: `app/profile/page.tsx`, `components/profile/ProfileForm.tsx`
Last updated: 2026-08-25

| Property | Class |
| --- | --- |
| Background | `bg-background`, `bg-surface`, `bg-surface-secondary` |
| Border | `border border-border`; attention uses `border-error/25` |
| Border radius | `rounded-2xl` cards, `rounded-xl` nested role/dropzone surfaces, `rounded-md` controls |
| Text — primary | `text-text-primary`, `text-text-dark` |
| Text — secondary | `text-text-secondary`, `text-text-muted` |
| Spacing | `space-y-6`, `p-6 sm:p-10`, `gap-5` field grids |
| Hover state | `hover:bg-surface-secondary`, primary `hover:-translate-y-0.5 hover:bg-accent-dark hover:shadow-button-hover` |
| Shadow | `shadow-card` surfaces, `shadow-button` actions |
| Accent usage | `bg-accent`, `text-accent`, `focus:ring-accent` |

**Pattern notes:** Authenticated forms use a narrow 880px content column inside the standard 1440px page frame. Section cards use the standard white card treatment; grouped repeatable fields sit on `bg-surface-secondary` within one nested rounded layer. Input labels are uppercase `text-xs font-semibold`. Field changes autosave after 800ms of inactivity, while the bottom `Save now` action remains a manual fallback; the inline result message communicates saving/saved/error state. Resume selection uploads immediately, persists the original filename in profile metadata, and exposes an `Open resume` link only after persistence; the link opens a fresh, five-minute signed URL in a new tab. Only the edited field's border flashes the success token for 3.5 seconds after a successful save; during that feedback interval its focus ring uses the same success token, not the default accent. Errors retain their error-token border and focus ring until a successful retry. Zod field failures use the same error-token border plus a `text-error` inline reason linked by `aria-describedby`; a corrected successful retry clears those messages and uses the existing green feedback. Work-experience cards use a token-error `Remove role` action and persist the removal through autosave. Persisted completion state controls the attention banner with a compact error-token SVG track and round-capped fill, and a centered percentage label.

Saved resume status uses the persisted original filename (`Saved resume: {filename}`), with `resume.pdf` only as a legacy-data fallback. Success borders hold green briefly, then fade to the normal border before their feedback class clears; default accent focus returns only after that feedback ends.

The resume card's two actions sit in one centered wrapping row inside the dropzone: `Select Resume` keeps the secondary treatment, and `Extract from Resume` uses the standard accent primary treatment with hover lift. The extract action renders only once a resume is persisted (`resumeUploadState === "saved"`) and both actions disable while a save or an extraction is in flight. Extraction shows its progress in the button label (`Reading resume...`) rather than a separate status line.

Extraction results render in a review panel directly below the dropzone: `rounded-xl border border-accent/30 bg-surface-secondary p-5`, with an uppercase `text-accent` eyebrow, explanatory `text-text-dark` copy, and one accent chip per filled field (`rounded-sm bg-accent/10 px-3 py-1 text-sm font-semibold uppercase tracking-wide text-accent`) — the same chip shape the error-token attention banner uses. When extraction fills nothing the panel shows a single line and no chips. Extraction failures reuse the inline `text-error` message pattern with `role="alert"`. The panel is a review gate, not a result: it states that nothing is saved yet, and it clears as soon as any save starts, so its claim is never stale.

The dropzone itself is now an interactive surface, not decoration: it accepts dropped files, opens the file picker on click, and shows a drag-active state of `border-accent bg-accent/5` in place of the resting `border-border bg-surface-secondary` (or `border-error` when the resume field has an error), with `transition-colors` between them. It carries `cursor-pointer`. The surface ignores any click that lands on a control it wraps — its own two buttons and the `Open resume` link — by bailing when `event.target.closest("a, button")` matches. That single guard replaces per-child `stopPropagation`, so a control added inside the dropzone later cannot accidentally reopen the file picker. Keyboard users are served by those real buttons rather than by making the surface focusable, so no nested interactive roles are introduced.

The `Generate Resume from Profile` action sits in a bottom row of the resume card, separated by `border-t border-border pt-6`, and uses the standard accent primary treatment with hover lift plus `disabled:cursor-not-allowed disabled:opacity-60`. While generating, the label becomes `Generating resume...` and the button disables, matching how `Extract from Resume` reports progress in its own label rather than in a separate status line.

Because generating overwrites the single saved resume, a resume already on file turns the action into an inline confirmation rather than a browser dialog: the primary button is replaced by a centered wrapping row of `Keep current resume` (secondary treatment) and `Replace and generate` (accent primary), with a `text-sm font-medium text-text-dark` line below naming the file that will be replaced. No new pattern is introduced — both buttons reuse the existing resume-card treatments.

Generation results reuse the resume card's existing message patterns: success is a `text-sm font-medium text-success-dark` line naming the generated filename with the same `Open resume` link, and failure is the inline `text-error` message with `role="alert"`. Both clear as soon as any save begins, so neither can describe a profile that has since changed.

### Generated Resume PDF

File: `app/api/resume/generate/ResumeDocument.tsx`
Last updated: 2026-08-25

| Property | Value |
| --- | --- |
| Background | page default (white) |
| Border | none — sections separated by spacing only |
| Border radius | none |
| Text — primary | `#101828` (mirrors `--color-text-primary`) |
| Text — secondary | `#6a7282` (mirrors `--color-text-secondary`), body copy `#364153` (mirrors `--color-text-dark`) |
| Spacing | `padding: 40` page, `marginTop: 16` sections, `marginBottom: 10` roles |
| Hover state | none — static document |
| Shadow | none |
| Accent usage | `#7c5cfc` (mirrors `--color-accent`) on section headings, the headline, and bullet marks |

**Pattern notes:** A PDF renders outside the browser and cannot resolve the CSS variables in `ui-tokens.md`, so this file declares a four-value `palette` object mirroring those tokens by name. It is the only place in the project where hex literals are correct, and it must be updated whenever those four tokens change. Only the CSS properties listed in `library-docs.md` are used — anything else is silently ignored by `@react-pdf/renderer`. Layout is a single column: name, headline, contact line, links, then Summary, Experience, Education, and Skills, each with an uppercase accent heading. One page is guaranteed by content caps in `lib/resume-generation.ts` — 480-character summary, 4 bullets per role, 180 characters per bullet, 18 skills shown — because the renderer cannot report overflow.

### Find Jobs Page

Files: `app/find-jobs/page.tsx`, `components/find-jobs/SearchControls.tsx`, `components/find-jobs/JobFilters.tsx`, `components/find-jobs/JobsTable.tsx`, `components/find-jobs/JobsPagination.tsx`, `components/find-jobs/icons.tsx`
Last updated: 2026-08-25

| Property | Class |
| --- | --- |
| Background | `bg-background`, `bg-surface`, `bg-surface-secondary` |
| Border | `border border-border` |
| Border radius | `rounded-2xl` cards, `rounded-lg` inputs, buttons, page controls and the company tile, `rounded-full` score bars |
| Text — primary | `text-text-primary` |
| Text — secondary | `text-text-secondary`, `text-text-muted` |
| Spacing | `space-y-6` between cards, `p-6` search card, `p-4` filter card, `px-6 py-4` table cells |
| Hover state | rows `hover:bg-surface-secondary`; primary `hover:-translate-y-0.5 hover:bg-accent-dark hover:shadow-button-hover`; secondary `hover:bg-surface-secondary` |
| Shadow | `shadow-card` cards, `shadow-button` primary action |
| Accent usage | `bg-accent` primary action, `bg-accent-muted border-accent text-accent` current page |

**Pattern notes:** Three stacked cards inside the standard 1440px frame at 32px gutters — search controls, filter bar, then one card holding the table and its pagination footer. `SearchControls` is the page's only client component; the table reads real jobs from the database on the server. Card and form treatments match the profile page; inputs here use `rounded-lg` and a 12px vertical rhythm because the design shows a larger search field than the profile form's `rounded-md` controls.

The search card pairs two labelled inputs with the accent primary action on the same baseline, the first input carrying an inset leading search icon. During a search both inputs and the button disable, and the button label becomes `Finding jobs...` — the same in-button progress pattern the profile card uses for extraction and generation. Its result banner is `bg-success-lightest` with `text-success-dark` and a leading `text-success-alt` sparkle — the first use of the success surface as a full-width inline banner rather than a message line. Search failures use the matching error surface, `bg-error/5` with `text-error` and `role="alert"`, at the same size and position, so success and failure occupy the same slot.

The filter bar is one borderless full-width input with an inset search icon, separated from two secondary dropdown buttons by `sm:border-l sm:border-border`. The dropdowns are the standard secondary button treatment plus a trailing chevron. Both are inert until Feature 11.

The jobs table uses no alternating row colours: white rows separated by `border-b border-border`, `last:border-b-0`, and `hover:bg-surface-secondary`. Headers are `text-xs font-medium uppercase tracking-wide text-text-secondary`. Column widths are fixed at 22/29/17/18/14 percent and rows are 65px, both measured from the design. The company cell pairs a 32px `rounded-lg border border-border bg-surface-secondary` icon tile with the company name as a link to the job details route.

The match score bar is a 6px `bg-border` track, `w-24`, `rounded-full`, with the fill width set from the score and its colour banded **as the design shows: `bg-success` from 90, `bg-info` from 80, `bg-warning` below**. `ui-rules.md` has been reconciled to these bands. They are deliberately not Feature 11's High Match threshold (`>= 70`) — colour says how strong the match is, the filter says whether it is worth the user's time.

Pagination sits inside the table card above a `border-t border-border`: a results count with `font-semibold text-text-primary` numerals on the left, and page controls on the right. All page controls share `min-w-10 rounded-lg border px-3.5 py-2 text-sm font-medium`; the current page is `border-accent bg-accent-muted text-accent`, the gap is a borderless `...`, and Previous/Next disable to `text-text-muted` with no hover.

Empty state: the table renders a centered `text-sm text-text-muted` line at `px-6 py-16` when there are no jobs, and the pagination footer is not rendered at all — an empty table shows no "Showing 0 to 0" row.