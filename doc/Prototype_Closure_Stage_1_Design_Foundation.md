# Prototype Closure Stage 1 - Design Foundation

Stage 1 only. No new product functionality, financial/lifecycle changes, backend work, hero imagery or Stage 2 redesign. Work remains local; no commit, push, PR or remote changes.

## Shared design system

The existing TCS blue, Inter typography, white surfaces, restrained borders and card identity are retained. `src/design/foundation.tsx` adds shared page headers, responsive navigation, dialogs/drawers, status badges, keyboard-accessible scroll regions, empty states, loading skeletons and a workspace error boundary. Existing Button, Field, Input, Select, Textarea and Card components remain the base primitives rather than being replaced.

`src/index.css` now defines consistent container gutters, content width, title scaling, action wrapping, navigation behavior, focus rings, control sizing and dialog constraints. Secondary text tokens have stronger contrast. Existing reduced-motion support also applies to the new loading skeleton. Reports use the shared header and empty/status patterns. This provides reusable presentation for later Settings and other route-specific beautification without rebuilding those routes.

## Responsive strategy

One application uses existing Tailwind breakpoints plus the shared CSS foundation:

- Phone gutters: 16px; responsive vertical spacing and fluid titles.
- Compact Member/internal navigation below 768px; wrapped full navigation above it.
- Owner sidebar retains its 1024px desktop breakpoint, with a shared mobile drawer.
- Report values and summaries use one column at the narrowest width, two from 390px, and progressively wider grids. Filters retain their existing single-column-to-four-column layout, with exports and drill-down actions available at all sizes.
- Operations case queues become labeled stacked records below 640px, preserving every column and case action. Desktop remains a table with explicit row/cell roles and column headers.
- Wide penalty detail uses a bounded, labeled, focusable scroll region; it does not force page-wide scrolling.
- Dialogs fit within the dynamic viewport, scroll internally, and use a bottom-sheet presentation on phones. Drawers have bounded widths and full-height scrolling.
- No global horizontal clipping is used to disguise overflow.

## Navigation and accessibility

Member and internal menus share a compact toggle with expanded/control state and active-page semantics. Destinations are retained; internal visibility still uses the original permission predicates. Active internal user/account context stays outside the collapsible navigation. Owner and legacy Member shell navigation share the dialog/drawer interaction foundation.

Skip links now reach internal workspace main content. Dialogs announce their name and modal state, take focus without auto-selecting a destructive action, contain Tab/Shift+Tab focus, close on Escape/cancel, prevent background scrolling and restore focus to the initiating control when it still exists. Existing domain confirmation handlers and revalidation are unchanged.

Shared buttons and mobile icon controls have comfortable 44px targets. Form controls use readable phone sizing; existing visible labels, descriptions and error associations remain connected. Keyboard focus is visible beyond shared components, including native summary and scroll controls. Status text remains visible independently of color.

Interactive focus, screen-reader behavior and real touch use still require browser/human review; structural tests do not substitute for those checks.

## Display formatting

`src/design/format.ts` contains display-only date and NGN formatting. Date-only Business Dates keep their calendar day; actual timestamps display a timezone and retain exact values in semantic time attributes/tooltips. Normal report, payment, payout, configuration, lifecycle and reconciliation surfaces now use readable dates. Exact audit/source details and technical security records remain available where appropriate. Inputs, stored timestamps, CSV exports and BusinessClock calculations are unchanged.

Money displays use the naira symbol, grouping, up to two kobo decimal places, consistent negative values and normalized zero. Reports adopt this formatter; the existing financial/domain money calculations are untouched. Existing status labels are preserved while the shared badge selects a consistent visual treatment, including a neutral treatment for inactive/cancelled states.

## Loading and error handling

Large route chunks load behind a real Suspense fallback with an announced loading state and reduced-motion-aware skeleton. No artificial delay is added. A failed workspace has a friendly error surface with a return-home action that preserves the session. Reload is explicit and warns that the prototype is memory-only. Stack traces and loader exception dumps are not shown in the error UI.

## Typecheck cleanup and dead UI review

All six known TS6133 diagnostics were resolved without suppression:

- OrgApplicationQueue: unused Badge import.
- DiscoverCommunities: unused Button import.
- CommunityDetail and JoinRequestSubmitted: unused destructured communityId parameters; their public prop shape remains compatible.
- OwnerPayouts: unused destructured empty parameter; legacy caller shape remains compatible.
- GroupTimeline: unused isPast local.

No full screens were deleted. Reference searches found earlier UI candidates such as OrgApplicationQueue/Detail, OwnerPayouts and OwnerCollectionHistory outside the current routed workspaces; those older artifacts were retained rather than expanding this task into aggressive deletion. App route aliases and current demo scenarios continue to work. Meaningful removals in this pass are the six unused symbols, not business screens.

## Bundle and route splitting

`src/design/lazyRoute.ts` and the App boundary defer large Operations, Access, Reports, Settings, Scheduled Processes, Diagnostics, payment/payout, lifecycle, active Cycle, Group management, setup and application/onboarding workspaces. Shared Member/Organization/provider state stays mounted. Permissions remain enforced by the original workspace/service guards. SSR resolves the same components eagerly so authorization and route-render regressions continue to inspect real content rather than a loading placeholder.

Vite now emits a build manifest. `scripts/check-closure-bundle.mjs` checks the initial dependency graph and verifies that major workspace entry chunks are not eagerly imported by the public entry. There are **16 dynamic entry chunks**.

Before this pass, the main JavaScript bundle was about **1,093 KB / 284 KB gzip**. After splitting, the main entry is about **439 KB / 114 KB gzip** using Vite's estimate. Total initial JavaScript **including shared imports** is about **845 KB** (about **240 KB gzip** using the dependency-check script's compression estimate). The distinction matters: the shared prototype providers, demo data and domain/report services still load initially. No major provider or state architecture rewrite was attempted. The previous >500 KB chunk advisory is gone.

## Validation and limitations

- **480 service/domain/display tests passed**: 476 existing tests plus four display-format tests.
- **1,267 render/structural checks passed**: 1,192 existing checks plus 75 new design-foundation checks. A full render run passed; the final display/error-boundary adjustments also passed the affected suites.
- **Full TypeScript check clean**, with no suppressions.
- **Production build passed**, without the previous chunk-size advisory.
- **Bundle dependency checks passed** for the deferred workspace entries.
- Representative structural renders cover Auth, Member home, Organization dashboard, Thrift contribution view, Payments, Operations, Access Management, Reports and Settings at **360, 390, 430, 768, 1024 and 1440px**. The test checks rendered content, accessibility contracts and responsive CSS rules; it does not calculate browser geometry.
- Localhost HTTP 200 checks passed for `/`, `/operations`, `/operations/scheduled-processes`, `/access-management`, `/access-management/security`, `/reports/member`, `/reports/organization`, `/reports/internal`, `/settings` and `/settings/diagnostics`. HTTP route serving is not an authorization test; render/service tests cover authorization.
- Browser runtime setup and discovery returned no available browser. No interactive visual QA, screenshots, overflow measurements or real-device accessibility sign-off are claimed.

Commands: `npm run test:design-foundation`, `npm run test:responsive`, `npm run typecheck`, `npm run build`, and `npm run test:bundle`; all domain tests and all `scripts/check-*-render.mjs` checks were also run.

## Human review and later stages

Review real phone/tablet/laptop/desktop layouts for long Organization names, large financial amounts, menu resize behavior, keyboard/dialog focus, screen-reader table reading and retained technical audit detail. Confirm visual contrast in the complete rendered pages and verify that dense penalty tables are comfortable to inspect on touch devices.

Existing module-specific copy, legacy color literals, dense detail panels and bespoke form/action groups still need the planned route-by-route visual pass. Auth/Onboarding hero imagery and the Stage 2 visual benchmark are intentionally untouched. The shared foundation is ready for that work; Stage 2 has not begun.

## Stage 6 chronology clarification

This document records the Stage 1 completion snapshot. Its statements that later visual stages had not started describe that time; Stages 2?5 are now complete. Current scope and validation are recorded in the Stage 6 QA report.
