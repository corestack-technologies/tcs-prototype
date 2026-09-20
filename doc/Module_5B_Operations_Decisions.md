# Module 5B — Reviews, approvals and financial exception decisions

Built on the Module 5A workspace and its existing shared source stores. No Module 5C or Access Management administration is added.

## Inspect locally

Open http://localhost:8443 and enter **Operations · Internal workspace**. Under **Prototype scenarios**, choose **Load shared 5B decision scenarios**. This also loads the 5A foundation when needed and preserves existing cases on repeat loading.

Open a case, choose the appropriate internal persona, and use **Controlled decision → Preview decision → Confirm decision**. Financial decisions require an evidence reference and acknowledgement. Internal comments are retained in the decision record and are not shown in Member/Organization histories.

- Verification Reviewer: KYC and Organization application review.
- Financial Operations Reviewer: settlement-account review, manual contributions, eligible payment allocations, reconciliation links and Revenue Share receipt confirmation.
- Operations Supervisor: elevated lifecycle approvals and authorized reviews.
- Operations Analyst: information requests/recommendations; no financial final approvals.
- An independent recommendation records its initiating actor and requires a different authorized approver. Owner-benefiting manual claims remain unrecognized until independent TCS review.

## Shared source effects

KYC and application decisions update the existing records. KYC/application information responses retain the original submission and return to review. Organization approval preserves the established Owner setup/activation flow.

Account approval retains the old effective account. After approval, the case offers a separate, explicitly labeled **Prototype provider event** for that one request. This simulated confirmation activates the proposed account without rewriting historical snapshots or claiming a real provider response.

Manual acceptance applies only safe eligible principal allocation and keeps the manual/offline source. Rejection retains the claim without satisfying an obligation. Payment linking is constrained by exact Member identity, Organization, active Cycle, obligation, contribution policy and lifecycle ownership. Overpayments, prohibited partial payments, advance and locked optional exceptions remain unresolved rather than receiving invented refunds or reallocations.

Settlement corrections append reconciliation links. Original provider lines, amounts, fees and account snapshots remain unchanged. A monetary variance cannot be forced to balance; it remains open or awaits provider resolution.

Exact Revenue Share confirmation uses the existing trusted internal confirmation service and updates clearance from the same source. Mismatches and unconfirmed receipts remain unresolved.

## Confirmed business boundaries — 14 September 2026

- Approved financial amendments remain **Approved — awaiting required Member consent**, then **Approved — awaiting financial application rule** when the financial application rule remains undefined. No generated obligation, completed Round, payout entitlement or historical snapshot is rewritten.
- Consented name/description amendments can take effect as unambiguous non-financial presentation changes. Activation snapshots and original request terms remain retained.
- Zero-absorption Force Close can execute under Supervisor authority and preserves liabilities, payouts, defaults and disputes.
- Nonzero aggregate-only absorption cannot execute. Exact liability records, Members and allocated amounts are required before such a disposition can be implemented. No automatic spreading or principal waiver is introduced.
- Direct Group termination stays blocked by active/unresolved financial matters.

## Audit and integrity

Every decision appends its reference, case, reviewer, timestamp, reason, internal comments, evidence references, copied before/after values and source effect. Source histories reference the decision without exposing internal comments. Repeated decisions on finalized cases are rejected. Approvals awaiting external action cannot be silently undone. Confirmation revalidates persona and source state against the preview.

## Validation

- 22 Module 5B decision tests pass.
- 10 Module 5A tests and 174 Modules 1–4 regression tests pass (206 total).
- 117 Module 5B decision renders and 55 Module 5A renders pass.
- Relevant lifecycle, payout, reconciliation and revenue render regressions pass.
- Relevant Operations/integration typechecking passes. Full-project typechecking retains the same six unrelated unused-code diagnostics in legacy components.
- Production build passes with a large-bundle warning.
- Localhost root and the decision component return HTTP 200 on port 8443.
- Interactive browser/screenshot validation remains unavailable: the configured browser runtime lists no connected browsers.

All work is local; no commit, push or remote action was performed.
