# Prototype Closure Stage 2 — Auth & Onboarding

## Scope and visual direction

Stage 2 establishes a calm TCS blue-and-white entry experience: restrained borders and shadows, clear typography, a community/progress graphic and a focused primary task. All work is local. No commits, pushes, PRs, new dependencies, domain service changes or Stage 3 work.

Modules 1–8B, financial regularization, Stage 1 primitives and lazy route boundaries are preserved. Member dashboard and other product workspaces have not been beautified in this stage.

## Components and behavior

- `src/auth/AuthLayout.tsx`: shared login/registration/contact layout, account setup progress and original SVG hero. `AuthHeroVisual` is the single replacement boundary for a future product-owner-approved local image. Preserve its aspect ratio and decorative accessibility treatment; provide alternative text if a replacement conveys information. No external imagery was fetched.
- `src/auth/auth.css`: scoped layout, cards, grouped demo options, progress and onboarding styling. Existing Stage 1 controls, tokens, Section and Dialog primitives are reused.
- `src/components/Login.tsx`: concise welcome/sign-in form; labeled show/hide password toggle; original login handler and recovery message retained. Demo account access is collapsed by default and opens the shared focus-managed Dialog/mobile sheet. All nine personas remain grouped into Onboarding, Verification and Existing Member. Selecting a persona retains the original openPersona and dashboard navigation behavior. Session and sample-password explanations live in the demo dialog.
- Internal access is a closed native details control retaining Operations, Access Management, Organization, Verification review and Organization review destinations and their original handlers. Authorization is unchanged.
- `src/components/Signup.tsx`: consistent card and progress, About you and Sign-in details fieldsets, autocomplete and telephone/email input hints. Existing validation, prototype acknowledgment, legal notice, registration and OTP navigation remain intact. No finalized legal document was invented.
- `src/clients/ClientContact.tsx`: same entry layout, account progress, per-contact status and existing six-digit single-input OTP. Native paste, numeric keyboard hint and one-time-code autocomplete remain. The unchanged local code is inside a collapsed, explicitly labeled Demo verification helper. Resend/contact-change delivery remains unavailable and is explained honestly. Existing complete/confirm/error/continue/Home actions remain.
- `src/clients/ClientOnboarding.tsx`: concise overview, current step announcement and compact four-step progress. Existing incremental fields, optional bank details, save/leave, validation, restrictions and completion route remain.
- `src/clients/ClientVerification.tsx`: clear purpose, status and preparation summary with existing required documents; history is expandable. Submission, independent review, restrictions, attachments and information-response handlers remain unchanged.
- `src/clients/ClientSubmission.tsx`: matching account progress on the existing submission outcome screen.

## Responsive behavior

360, 390 and 430px: compact TCS logo above the form; decorative hero hidden; form has flexible gutters; demo options stack; shared Dialog provides a mobile sheet. Inputs use the Stage 1 mobile sizing and visible focus. Fieldsets allow shrinking to avoid intrinsic-width overflow.

768px: centered, bounded form with tablet spacing. Registration fields use available columns.

1024 and 1440px: balanced 0.95/1.05 split; hero and form have flexible padding; the decorative visual is capped at 25vh. Login utilities occupy two compact controls instead of an expanded persona grid. Long registration content scrolls naturally without a fixed/clipped form height.

These are implemented CSS behaviors, not measured browser geometry. Screen height and clipping require manual review.

## Validation

- 480 service tests passed (`node --experimental-strip-types --test tests/*.test.mjs`), including Auth/Client and financial regressions.
- 239 Auth/onboarding render and structural checks passed (`node scripts/check-auth-onboarding-render.mjs`). Login, registration, all nine personas on contact/onboarding/verification/submission, collapsed utilities, all persona entries and relevant input semantics are covered. The six target widths are exercised with SSR and CSS contracts; this does not simulate browser layout or user interactions.
- 75 Stage 1 representative responsive and shared primitive checks passed (`node scripts/check-design-foundation-render.mjs`).
- Full TypeScript check passed (`node node_modules/typescript/bin/tsc --noEmit`).
- Production build passed. Bundle boundary check passed; 16 dynamic entry chunks retained, entry approximately 433 KB, total initial JS including shared imports approximately 842 KB. No added dependency.
- Localhost HTTP 200 for `/`, `/signup`, `/otp`, `/onboarding`, `/client-verification`, `/success`. These requests verify Vite's SPA delivery only; application navigation remains in memory. Screen rendering is verified separately above, not inferred from HTTP 200 or claimed as new deep-link support.

## Human visual approval remaining

The in-app browser discovery returned no available browser. No screenshots, interactive browser tests or visual approval are claimed.

Product owner should review the six target widths, plus typical laptop heights: hero/form balance, primary login fit, registration scroll length, keyboard-open input visibility, actual overflow/clipping, demo dialog scrolling and backdrop positioning, keyboard focus return/trapping, OTP paste and error presentation. Approve the TCS direction and final hero image separately. No specific visual defect is confirmed by the structural checks; these items remain unverified until browser/manual review.

Stop after Stage 2. Stage 3 has not started.
