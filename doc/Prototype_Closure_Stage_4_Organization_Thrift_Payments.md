# Prototype Closure Stage 4 — Organization, Thrift & Payments

## Scope and direction

Organization-only presentation pass continuing the current tree and Stage 1–3 TCS tokens and components. Calm white surfaces, blue emphasis, bounded content, clear amount labels and progressive disclosure. No Internal TCS beautification. Auth and Member layouts were not redesigned. No domain service, calculation, permission, lifecycle transition, Business Date or Scheduled Process changes. No dependencies, commits, pushes or PRs.

## Routes and shared components

- `src/organizations/owner.css`: scoped Organization layout, cards, typography, financial number treatment, attention cards, exception sections and mobile records. Imported by OwnerShell and the Organization application/status entry screens. Organization styles do not apply to Internal or Member shells.
- `OwnerProgress`: a presentation-only six-stage trail matching the existing flow: Setup, Recruitment & commitments, Positions, Rules, Readiness, Activation. It does not bypass navigation gates. The setup wizard retains its six internal form steps and validation; current internal step receives an accessibility marker.
- Application and review (`org-application`, `org-review`): scoped cards, flexible form layout and consistent typography; existing submitted record, evidence, review states and response controls retained. Activation/Profile (`org-activation`, `owner-profile`) inherit the same Owner shell treatment; settlement-bank controls and one-owner safeguards unchanged.
- Dashboard (`owner-dashboard`): compact Organization identity; attention links show current activated/draft Cycle counts, unresolved Recovery counts and payout records to review. Collection and revenue-report entry points remain explicit. These counts are computed only from existing Group records. Historical sample totals remain separately labeled and are not presented as live ledger amounts. The recovery link opens Groups so the Owner can choose the relevant Group, rather than assuming the selected Group contains the case.
- Groups (`owner-groups`): existing state/capacity/commitment/readiness cards receive the common styling. Prototype scenario and fee-configuration tools are collapsed so they no longer dominate routine work. All tools and permission checks remain available.
- Setup/recruitment/commitments/Positions (`owner-group-setup`, `owner-group-recruit`, `owner-group-positions`): shared progress, cards, readable mobile controls and responsive amount grids. Existing full/half labels, exact shares, assignment capacity and commitment checks retained; no commitment is represented as a payment.
- Rules/readiness (`owner-group-rules`, `owner-group-readiness`): common progress and financial layout; terms, fee basis, penalty guidance, blockers, consent and activation handler preserved.
- Activation record (`owner-group-activated`): replaced the dark animated celebration with a calm Owner workspace record. Cycle, contribution, frequency, Positions, Members, fee, start and financial commencement state are summarized. Positions/rules/history remain expandable. Existing Group/Dashboard/Active Cycle actions and cancellation boundary remain. Explicitly explains that activation does not financially commence a Cycle before scheduled opening/obligation generation.
- Active Cycles/Rounds (`owner-cycles`): Owner-scoped responsive financial cards and typography; existing current/prior/upcoming navigation, obligation states, source dates and accepted-rule disclosure remain unchanged.
- Collections/payments (`owner-collection`, existing collection/history aliases): clear Owner header; existing source-specific payment, advance, allocation, manual, mismatch, exception and reconciliation semantics retained. Reconciliation (`owner-reconciliation`) inherits the same scoped record treatment.
- Payouts (`owner-payouts`): manual sequence clearly states review instruction/bank, transfer from Organization bank, record evidence, await Member confirmation, review completion/dispute. TCS is explicitly described as recording rather than transferring funds. Entitlement, fees, net, transferred, receipt, outstanding, partial plans and dispute/breach presentation keep existing sources and calculations.
- Default/recovery (`owner-lifecycle`, daily penalty panel): responsive ledger records and a reduction summary showing original accrued, already waived and outstanding values. This appears before the existing audited action. All self-benefit/review and principal-first Recovery safeguards remain in services and existing actions.
- Exit/settlement, rollover and amendments (`owner-lifecycle`): common Owner financial styling; existing recognized contributions, replacement, regularization, settlement responsibility, review, consent and effective-state limitations remain intact.
- Force Close/termination: existing exceptional controls grouped in a closed, bordered exception disclosure, separate from daily actions. Reasons, evidence, proposed absorption, confirmation and review behavior unchanged.
- Organization reports (`owner-reports`): Owner-scoped summary emphasis and readable figures; existing compact filters, responsive record layouts, source drill-down and financial/revenue distinctions retained. No report or revenue calculations changed.

Other Owner screens, including Join Requests and settings, inherit the OwnerShell presentation. No new screens, data fixtures or unsupported financial notifications were added.

## Financial and responsive treatment

Stage 1 tokens, buttons, focus, dialogs and formatting are reused. Dashboard sample amounts use the shared NGN formatter, converting major units only at the display boundary. Existing financial-domain amounts and calculations are untouched.

At 360/390/430px, Owner grids stack, amount text wraps, action rows remain available and controls stay within their container. The penalty ledger uses labeled stacked records with semantic table roles and column headers. At 768/1024/1440px, existing multi-column forms and summary/detail layouts use available space; the attention area expands to four columns on wide screens. The existing focus-managed mobile navigation drawer is preserved. No workflow was hidden solely because of viewport width.

## Validation

- 480 service tests passed: full suite including Organization, Groups, lifecycle, financial regularization, payments, payouts, recovery and reports.
- 660 new Organization render/structural checks passed (`scripts/check-owner-experience-render.mjs`): 13 screens across all eight Group setup scenarios at six widths, additional application/review/approval/restriction/suspension states, and targeted attention/progress/disclosure/CSS checks.
- 1,631 existing render/structural checks passed: foundation 75, Member experience 706, Auth/onboarding 239, Rounds 8, financial regularization 10, lifecycle 62, payments 96, payouts 38, reconciliation 63, reports 334.
- Total render/structural checks: 2,291. These are SSR/CSS contracts, not measured browser geometry or interaction tests.
- Full TypeScript check passed.
- Production build passed. Main entry approximately 431 KB; total initial JavaScript including shared imports approximately 841 KB. Bundle check passed with all 16 dynamic entry chunks retained.
- Localhost HTTP 200 for `/` and `/reports/organization`. An initial request stalled; bounded curl checks and the original request subsequently returned 200. HTTP tests confirm SPA delivery, not authenticated screen access. Screen/provider checks are separate above; in-memory routing is unchanged.

## Remaining visual-only review

Interactive browser discovery returned no available browser. No screenshots or human visual approval claimed. Real-device review should cover dense Position assignments, long Member/Organization names, large NGN amounts, payment/recovery detail density, mobile keyboard-open forms, drawer focus, actual clipping/overflow, and the setup trail at narrow widths. Controlled detail scrolling remains where existing column relationships require it. No confirmed visual defect was inferred from SSR checks.

Stop after Stage 4. Stage 5/Internal TCS beautification has not started.
