# Final Financial Rule Regularization

Implemented locally on the existing Modules 1-8B working tree. No final hardening, UI redesign, commit, push or PR.

## Approved policy and retained terms

- `src/penalties/policy.ts` defines the approved prototype maximum: **10 basis points/day (0.10%)**. This is a daily-rate ceiling, not an accumulated-penalty cap, and requires policy review before production.
- Group configuration accepts integer **0-10 bps/day**. Zero disables accrual. Suitable Group setup seeds use **5 bps/day (0.05%)**. New blank drafts start at zero for deliberate configuration.
- Rate changes are material for Member acceptance; the activated rate and ceiling are retained in the activation snapshot. Active terms cannot be silently edited.
- Old one-time/default-charge fields are retained only for legacy fixture compatibility and are not used as daily monetary rates. Older manually satisfied demo obligations and aggregate Recovery examples are not silently converted into dated financial facts.

## Accrual and time

`accruePenalties` records one immutable monetary source per required position component and eligible local calendar date. It starts at grace expiry, uses the original outstanding required principal for that date, and rounds half-up to integer kobo using BigInt arithmetic. Half positions and multiple holdings follow their generated principal components; optional recipient components are excluded.

Dated recognized contribution allocations and dated Recovery receipts reduce future principal bases. Posted days are never recalculated. Principal clearance stops accrual even if penalties remain. Cycle end stops new daily growth; existing debt remains. Business timestamps are separate from actual ledger/audit timestamps. Provider confirmation facts remain unchanged; environment-bound contribution allocations also retain their effective BusinessClock timestamp. Source history guards include new financial business timestamps.

## Waiver, default and Recovery

The existing Owner workspace exposes an audited penalty reduction with amount, actor, reason and actual timestamp. Original charges remain visible. Reductions cannot exceed unpaid penalty or waive principal. Owner self-benefit remains subject to independent review, not self-approval.

`evaluatePostPayoutDefaults` requires recognized payout receipt, unpaid required principal and seven full local calendar days after grace expiry. It excludes penalty-only balances, optional skipped contributions, unconfirmed payout transfers and unresolved payment exceptions. It appends a historical default event and links generated required obligations and daily charges into the existing Recovery case model. Same-date evaluation does not duplicate cases; later resolved cases and default events remain retained. Later generated debt continues to be owed, with disjoint new case scope if an earlier case was resolved.

Recovery remains principal first, oldest due first, then penalty oldest due first. Dated receipts cannot be reallocated to later-generated debt. Targeted reductions preserve the original day being waived. Excess remains a Recovery Payment Exception. Existing review, restriction removal and eligibility privacy remain in place. No new payment rail or synthetic Recovery receipt was introduced.

## Scheduled processing and visibility

Execution order is Round/obligation generation, penalty accrual, payout lifecycle, Post-Payout Default, financial reconciliation. Services own the rules; the scheduler orchestrates them. Daily catch-up preserves source dates and component/day identities. Partial failures retain completed work; linked retries remain safe. Scenario-clock isolation is unchanged.

Existing Member, Organization and internal reports distinguish principal, accrued penalty, waived penalty, Recovery applied, outstanding penalty and historical default. Linked Recovery penalty rows are not counted twice. A minimal daily ledger appears in active and historical Cycle views. Applicable penalty balances also feed payout readiness and lifecycle clearance. Organization Fee, TCS Revenue Share and Exit Settlement rules remain intact.

Constitution v0.3 Chapter 13 and section 15.3 were updated in place. The existing Module 8B note now records the two executable domain steps and removes the obsolete undefined-rule limitation.

## Validation

- **476 service tests passed:** all prior 430 tests plus 46 focused financial regularization tests.
- **1,192 render checks passed:** prior route/report/role scenarios plus 10 ledger/disclosure checks.
- Scoped typecheck: no diagnostics in Modules 1-8B and financial regularization scope.
- Full typecheck: the same six pre-existing unused-symbol diagnostics remain: OrgApplicationQueue `Badge`, OwnerPayouts `empty`, CommunityDetail `communityId`, DiscoverCommunities `Button`, GroupTimeline `isPast`, JoinRequestSubmitted `communityId`.
- Production build succeeds; the existing chunk-size advisory remains (main JavaScript about 1.09 MB, approximately 284 KB gzip).
- HTTP 200: localhost:8443 root, Scheduled Processes, Diagnostics and all three report entry points. Render checks cover authorization; HTTP 200 alone is only a route-serving check.
- No connected interactive browser was available; validation uses service tests, server renders, typecheck, build and HTTP checks.

## Remaining boundaries

The approved numeric ceiling needs review before production. Existing aggregate-only Recovery examples and manually satisfied legacy obligations lack dated receipt history; new positive-rate catch-up fails visibly if such data is presented rather than inventing dates. Existing Recovery payment ingestion and independent self-benefit exception review are not expanded into new rails/workflows in this task. The prototype remains in-memory as documented in Modules 8A/8B.
