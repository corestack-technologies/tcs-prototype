# Prototype Closure Stage 5 — Internal TCS Workspaces

## Scope

Presentation-only continuation of Stages 1–4. Internal Operations, Access/Security, Reports, Settings, Scheduled Processes and Diagnostics use the established TCS tokens and components. No services, financial calculations, permission checks, maker/checker rules, session semantics, process execution/retry, Business Date logic or immutable audit data were changed. No new infrastructure indicators, business functionality, routes, dependencies or personas. No commits, pushes or PRs. Stage 6 has not started.

## Shared presentation and navigation

`src/internal/internal.css` scopes content styling to `#internal-main` and the shared internal header. This avoids applying an admin theme to Member or Organization workspaces. Existing cards, controls, amount labels and responsive layouts receive consistent spacing, borders and typography.

`src/internal/Presentation.tsx` adds `InternalFacts` for labeled status/amount cards and `AuditValue` for readable audit values. Audit rendering retains every field, false and zero values, arrays and nested records; nested objects are expandable rather than raw JSON dumps. Stored values and authority semantics are untouched.

`src/access/InternalNavigation.tsx` keeps the existing permission-aware destinations and responsive navigation. Prototype persona selection is a compact native disclosure; the current user/role summary remains visible. No inaccessible module was added to any user's navigation.

## Operations

Routes: `/operations` and existing review/case aliases. Existing source-backed overview metrics and attention states are retained. Case lists keep the Stage 1 desktop table/mobile stacked-record pattern, with all context and next actions available. Case detail retains summary, business/financial context, evidence, decisions and triage; timeline/history is now expandable so the active task is more prominent.

KYC, application, contribution, payout, breach, default/recovery, dispute and appeal review panels share internal styling. Their source facts, review authority, deadlines, original decisions, appeal records and financial consequences are unchanged. No new process-failure dashboard counter or notification was invented.

## Access and Security

Routes: `/access-management`, `/access-management/security`. Section navigation gains accessible current-page markers; Security view navigation does likewise. Existing domain-grouped permissions, effective access, lifecycle states, roles and privileged previews remain. Access audit now presents before/after records in structured columns with expandable nested data, replacing raw JSON.

Sessions, events and locked accounts retain their existing responsive cards and role-gated actions. Prototype simulation warnings remain explicit. Self-escalation, last-admin protections, revocation, locks and audit history are untouched. No production security capability is implied.

## Internal Reports

Route: `/reports/internal`. Catalogue categories, available definitions and source drill-down remain permission filtered. Internal report filters/sorting move into a compact disclosure; totals, results, drill-down, print and CSV remain accessible. Member and Organization reports retain inline filters through the same shared wrapper. Internal summary cards use the existing TCS blue emphasis. No calculations or export authorization changed.

## Settings

Route: `/settings`. Platform/Runtime Controls, Environment/Business Date and History sections retain exact permission visibility and gain clear selected-state navigation.

Runtime controls are individual configuration cards preserving descriptions, scope, environments, allowed/current values and last-change information. Controlled edit areas visually group proposed value, required reason and preview action.

Business Date shows effective date, actual time, mode, environment, last actor and last timestamp as labeled cards. Date selection, advance and reset continue through the existing preview/reason/confirmation flow. Warnings and the distinction between changing time and executing processes remain. No automatic processing, rollback or history rewriting is added.

Configuration history retains before/after values; reason and audit context are expandable and read-only. Existing empty history behavior is preserved.

## Scheduled Processes and Diagnostics

Routes: `/operations/scheduled-processes`, `/settings/diagnostics`.

Process evaluation steps are expandable. Run detail uses the shared status badge and labeled evaluated/changed/no-op/failed totals. Run IDs, actors, dates, step results, failures, linked retries and immutable originals remain available. Preview and execution authority are unchanged, as are eligible-count caveats and catch-up warnings.

Diagnostics is separated into environment/business-time cards, lifecycle-processing attention and prototype/source-readiness sections. Actual/effective time, mode, latest success, failed/partial attention, pending rounds, protected history and persistence warnings all come from the original diagnostics result. No provider health, CPU, database, uptime or infrastructure monitoring was invented.

## Responsiveness and accessibility

Structural coverage at 360, 390, 430, 768, 1024 and 1440px. Facts stack on phones and expand to multi-column desktop layouts. Navigation/actions wrap, controls have width safeguards, amounts wrap, and existing operational cards retain every field. Current-section markers, native disclosures, visible labels, shared focus styling, touch targets and shared focus-managed confirmation dialogs remain available.

## Validation

- 480 service tests passed, including Operations, financial review, Access/Security, reports, Settings, Scheduled Processes and permission regressions.
- 381 new internal route/persona and responsive structural checks passed (`scripts/check-internal-experience-render.mjs`): seven routes, nine representative internal personas, six widths; structured audit values and CSS contracts.
- 2,488 existing render checks passed: Operations 53, decisions 113, interventions 187, Access 24, Security 27, reports 334, internal reports 36, Settings 9, processes 25, foundation 75, Member 706, Organization 660, Auth/onboarding 239.
- Total: 2,869 render/structural checks. Settings checks were also rerun after its final action-container change.
- Full TypeScript check passed after final implementation.
- Production build and bundle checks passed. Entry approximately 432 KB; initial JavaScript including shared imports approximately 841 KB. All 16 dynamic entry chunks retained.
- HTTP 200 for all seven internal paths listed above. These requests verify SPA delivery; permission-aware screen rendering is verified separately. No new deep-link behavior claimed.

## Remaining visual-only review

Browser discovery returned no available interactive browser. No screenshots, browser geometry/interaction testing or human visual approval claimed. Real-device review should check long permission lists, nested audit density, report-filter discoverability, phone keyboards, case cards, large amounts, dialog focus and actual overflow/clipping. SSR width/CSS contracts do not measure those behaviors.

No product ambiguity was resolved by inventing a rule. Stop after Stage 5; no whole-app QA/freeze work or Stage 6 started.
