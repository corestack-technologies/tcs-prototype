# Module 5C — Disputes, Appeals, Defaults and Controlled Intervention

Implemented on the existing shared Operations case, source review, preview/execute and audit foundation. No Module 6, account administration, commit, push or external money execution.

## Disputes and evidence

Payout disputes retain the original installment, Organization transfer, beneficiary bank snapshot, Member statement and original confirmation state. Separate resolution records establish full, partial or zero evidenced receipt. Outstanding payout uses evidenced receipt instead of assuming a disputed transfer was received. An upheld claim retains Organization responsibility. A completed payout established by Operations is labelled `completed-operations-evidence`, never `Member Confirmed`.

Initial decisions open one appeal. The existing financial reviewer and Supervisor can investigate; appeal review must use a different authorized reviewer. The original decision is retained. Configured appeal expiry finalizes normal processing; Supervisor-only exceptional reopening records its reason, evidence and previous finalization, without resetting the consumed appeal.

Prototype evidence and appeal windows are configurable (default 72 and 168 hours). Requests preserve the addressed party, requested information, deadline, missed deadline, responses and supporting references. Member/Organization payout views allow the identified party to submit evidence or one appeal. Operations can record attributed party submissions with evidence. Internal comments are never included in public status/history.

## Financial rules confirmed by the user

Final evidenced payout outcomes establish proportional Organization Fee and TCS Revenue Share recognition. Integer kobo arithmetic uses the existing proportional rounding convention and cumulative installment fee/share calculation. Pending appeals do not create new evidenced recognition. The original recorded installment fee/share values and existing receivables remain intact.

When prior recognition differs from the final outcome, a separate `Fee / Revenue Share Adjustment Required` source case records previous recognition, evidenced recognition and signed differences. Each final decision is idempotently linked to its recognition and adjustment requirement. Later exceptional outcomes retain earlier requirements and identify the previous related adjustment. No refund, credit or external payment is executed. A later remedial Organization transfer uses the remaining evidenced payout balance and corresponding fee basis.

Recovery applies to principal first, then penalty. Existing aggregate recovered totals are preserved; principal/penalty allocations and outstanding balances are derived. Excess recovery is an exception, never a negative balance. Valid separately recorded penalty-waiver evidence can clear remaining penalty; it cannot waive principal. This module adds no discretionary waiver action or recovery payment rail.

Normal Recovery resolution remains: outstanding cleared, Organization review, Organization resolves, applicable active restriction released. The release records the Owner actor/time and preserves default history, payout facts and Cycle completion date. Other unresolved restrictions remain independent.

## Restrictions, breach and legal boundaries

Supervisor interventions record target, source case, reason, authority, start time, scope, review state and release history. They block new activity while preserving existing contributions, payouts, recovery, disputes and essential account actions. Organization restrictions are independent of existing revenue-share commercial restrictions. Other Organizations receive only the Member eligibility result, not debt/evidence/internal notes.

Existing Organization payout breaches and Exit Settlement breaches retain original liabilities. Exact evidenced Exit Settlement confirmation is additive and resolves only its linked settlement. Unresolved source liabilities prevent release. Escalation supports Supervisor, external bank/provider, Legal/Compliance and Member Protection without claiming an external integration.

The Owner incapacity sample preserves ownership and active arrangements pending externally validated legal procedure. No ownership transfer, position reassignment, next-of-kin payment, debt erasure or legally final succession outcome is implemented.

## Inspection and validation

Load shared Operations scenarios, then **Load shared 5C dispute and intervention scenarios**. Samples cover evidence pending, upheld claims, accepted evidence, final partial receipt/adjustment review, one appeal pending/final, exceptional reopening, default, partial and resolved Recovery, completed-with-recovery, Member suspension, Organization breach/restriction, Exit Settlement breach and Owner incapacity escalation. Loading is idempotent; sources remain shared with Member/Owner views.

Commands: `npm run test:operations:interventions`, `npm run test:operations:interventions:render`, existing Modules 1–5B tests/render scripts, `npm run typecheck:operations`, `npm run typecheck`, `npm run build`.

Full-project typecheck retains six pre-existing TS6133 unused-variable diagnostics in OrgApplicationQueue, OwnerPayouts, CommunityDetail, DiscoverCommunities, GroupTimeline and JoinRequestSubmitted. The scoped Operations/integration typecheck is clean. Build retains the existing large-chunk warning. Localhost is reachable; the in-app browser tool returned no available browser, so interactive visual QA could not be performed.
