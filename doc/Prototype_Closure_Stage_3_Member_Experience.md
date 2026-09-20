# Prototype Closure Stage 3 — Member Experience

## Scope

Member-only visual and usability pass, continuing the current tree and Stage 1/2 direction. No domain services, financial calculations, eligibility checks, permissions, lifecycle transitions, Auth redesign or new routes were introduced. No dependencies added. Organization/Internal beautification has not begun. Changes remain local; no commit, push or PR.

## Routes and components

- Dashboard (`dashboard`, `dashboard-new`): shared PageHeader, compact account status, a current-commitments action and prominent existing contribution due/optional information. Introductory setup callouts use restrained white cards instead of an authenticated marketing hero. Existing sample activity remains explicitly sample activity; no fabricated aggregate debt or live obligation total was introduced.
- Profile (`client-profile`): separate personal and contact sections, formatted birth date, identity/account summary, verification and participation links, expandable account history. Existing edit, bank and closure rules and handlers remain intact.
- Verification (`client-verification`): retains Stage 2 status and document experience, with the Member shell's shared typography/card treatment. No additional reviewer data is exposed.
- Requestable/discovery and detail (`discover`, `community-detail`): Member styling, responsive filter layout, accessible search/sort/filter controls, native availability checkbox, labeled stacked payout-history table on phones. Existing availability and request actions remain.
- Join request states (`join-request`, `join-submitted`, `pending-approval`): inherit the scoped Member layout, typography and comfortable text/touch presentation. All represented pending/approved/declined and submission actions remain. No additional states or dates were invented.
- Memberships (`my-groups`): shared header, status badges, contribution-per-full-Position and planned start summaries, current participation separated from past Cycles. Completed-with-recovery stays in the current overview. Historical participation in an earlier Cycle is identified. Empty state points to the existing discovery route.
- Group detail, participant/Position and payout-order views (`group-detail`, `member-lifecycle`, existing detail tabs): scoped Member financial styling, compact amount layouts and responsive records. Existing progressive rule tabs, privacy filtering, histories and action availability remain. No new participant information added.
- Contributions/obligations/payments (`member-payments`, existing payment aliases): clear Member header and amount layout; underlying status and allocation presentation preserved. Required, satisfied, outstanding principal, penalty, optional choice, manual confirmation, provider confirmation, advance reservation and exception meanings remain distinct.
- Payouts/Payout Board (`member-payouts`, `payout-position`, existing Position tab): concise header and scoped responsive financial layout. Entitlement, fees, net amount, transferred amount, evidenced receipt, outstanding and disputes remain separate. No receipt inferred from transfer or elapsed confirmation windows.
- Recovery/default (`member-lifecycle`, penalty panel): preserves existing balances and history. Member-facing label is Post-Payout Default; daily ledger becomes labeled stacked records on mobile. Owner panel retains its existing appearance/code label. Restriction messaging and continued access to existing financial responsibilities remain unchanged.
- Reports (`member-reports`): Member-scoped summary emphasis, readable amounts and existing responsive record cards, filters and source drill-down retained. Report calculations and export behavior unchanged.

Main changes: `src/clients/member.css`, ClientShell, ClientHome, ClientProfile, MemberActivityPanel; legacy Member AppShell, DiscoverCommunities and CommunityDetail; MemberGroups in ActiveCycleWorkspace; Member wrappers in PaymentWorkspace, PayoutWorkspace and LifecycleWorkspace; semantic/mobile table attributes in PenaltyLedgerPanel. Shared Owner/Internal wrappers do not receive the Member class. Stage 2 Auth files were not edited.

## Responsive and accessibility patterns

Six target widths: 360, 390, 430, 768, 1024 and 1440px. Flexible Member navigation, bounded desktop content, two-column overview cards where space permits, wrapped action rows, phone-sized financial blocks, readable labels, min-width safeguards and no fixed-height legacy shell clipping. Discovery filters remain available on phones. Penalty/history tables retain semantic headers and labeled mobile records, not hidden information.

Existing focus styling and shared buttons remain. Search and sort have explicit accessible names; selection filters expose pressed state; availability uses a keyboard-operable native checkbox. Date and sample NGN presentation use Stage 1 formatters (sample major-unit amounts converted to minor units only for display). Existing financial model formatting and values are preserved.

## Existing data boundary

The legacy discovery, community and join-request screens contain pre-existing sample fixtures; they are not a newly connected request pipeline into the shared financial Group model. This pass preserves those routes, fixtures and behaviors rather than inventing a second data world or changing product rules. Organization names, Position requests or live totals absent from a source were not fabricated. Connecting these legacy flows is outside this visual stage.

## Validation

- 480 service tests passed: all tests, including Client, financial regularization, payment, payout, lifecycle and Member report regressions.
- 706 new Member screen/persona and responsive structural checks passed (`scripts/check-member-experience-render.mjs`). All nine personas across 13 screens at six target widths; plus targeted profile, dashboard, discovery and CSS assertions.
- 854 existing render checks passed: foundation 75, Auth/onboarding 239, financial regularization 10, lifecycle 62, payments 96, payouts 38, reports 334. Includes default/recovery fixtures, financial privacy, authority and Member/Organization regressions. The Member default-label assertion was updated to the readable presentation; financial assertions unchanged.
- Total render/structural checks: 1,560. These are SSR/CSS contracts, not real browser geometry or interaction tests.
- Full TypeScript check passed.
- Production build passed. Main entry approximately 434 KB; initial JS including shared imports approximately 843 KB. Bundle check passed; all 16 dynamic entry chunks retained.
- Localhost HTTP 200: `/` and `/reports/member`. HTTP checks verify SPA delivery, not authenticated route rendering. Individual screens were rendered separately through their existing providers; navigation remains in memory.

## Remaining visual-only review

Browser discovery returned no available interactive browser. No screenshot or human visual approval is claimed. Review on devices for financial-block density, very long labels/NGN amounts, keyboard-open forms, collapsed navigation, table reading order, dialog focus, laptop spacing and actual overflow. Discovery's mobile filter height and long recovery/report histories may benefit from further visual tuning after deployment. These are unverified visual refinements, not confirmed test failures.

Stage 3 ends here. Organization/Internal beautification has not started.
