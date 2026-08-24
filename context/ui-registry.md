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
Last updated: 2026-08-24

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

**Pattern notes:** Authenticated forms use a narrow 880px content column inside the standard 1440px page frame. Section cards use the standard white card treatment; grouped repeatable fields sit on `bg-surface-secondary` within one nested rounded layer. Input labels are uppercase `text-xs font-semibold`, and local-only controls preserve semantic button behavior until persistent profile actions are added.
