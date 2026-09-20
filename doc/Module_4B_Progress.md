# Module 4B — Payouts & Recipient Confirmation

Module 4B is complete in the local working tree. Prior Modules 1–4A are preserved. No Module 4C implementation, commit, push or PR was made.

## Final rules

- A flat Organization Fee applies once per full Position and is apportioned by beneficiary share. An indivisible kobo is rounded half-up for the first share; the last beneficiary receives the remaining fee so the total is exact.
- Each beneficiary's actual payout base is their scheduled entitlement less only their own unconfirmed optional component. Another beneficiary's optional payment is never redistributed to them.
- Members explicitly select contribute or skip. Decision changes remain in history. Optional amounts never become required debt, late, defaulted or penalized, and skipping never blocks payout readiness.
- The first recorded external transfer/installment freezes that beneficiary's choice, confirmed optional amount and payout calculation. Instruction preparation alone does not freeze them. A contribute choice without confirmed payment counts as not contributed at execution.
- After execution, new optional payment attempts are closed. Later provider confirmations against existing optional instructions remain confirmed PAYMENT EXCEPTIONS, unallocated for future resolution; they never increase collection or payout. Duplicate provider confirmations remain idempotent.
- Each half beneficiary has an independent cutoff, bank instruction, transfer, confirmation and dispute state. Both beneficiaries must resolve before the shared Round resolves.

## Implemented journey

Readiness from shared contributions and applicable case restrictions → immutable validated beneficiary bank instruction → separate SPV, entitlement, actual collection, Organization Fee and net → Organization records external transfer → Member confirms or disputes, or the configured confirmation window elapses with its own reason → completed, outstanding or exception.

Bank changes invalidate unused instructions; previous snapshots and actual transfers remain in history. Partial transfers retain the outstanding balance, evidence, reason, authorizer and completion plan. Fee recognition is cumulative and proportional, with no duplicate fee across installments. TCS share is attributed from the Organization Fee without an extra Member charge or settlement workflow.

Timeout completion is distinct from Member confirmation and retains the separate dispute window. Disputes and configurable Organization payout breaches create retained cases and clearance blockers. Shared Round/Cycle lifecycle facts are updated without rewriting completed Cycle history. This prototype records manual external bank transfers; it does not execute bank/provider payouts or hold money.

## UX and demos

Member → Payouts; Organization → Payouts. Linked Payments/Collections use the same underlying records. The Organization's Member preview is read-only. Member choice and cutoff history are visible in Payments/Collections and Payouts.

Sixteen demo scenarios cover ready, awaiting confirmation, confirmed, timeout, dispute-window closed, disputed, partial, final installment, optional contribution made, breach, stale bank, overpayment, underpayment, split flat fee, independent split responses, and late optional payment exception. Split demo terms are configured before acceptance; existing demo defaults are unchanged.

## Verification

- 136 tests passed: 114 Modules 1–4A regression tests and 22 payout tests.
- 204 render checks passed: 8 active-cycle, 62 lifecycle, 96 payment/receipt, 38 payout Member/Organization checks.
- Module 4B typecheck passed. Six existing diagnostics outside this module remain.
- Production build passed with the existing large-bundle warning.
- Localhost availability checked separately. No attached browser was available for interactive verification.

No unresolved Module 4B business-rule or Constitution question remains. Payment exception resolution, reconciliation and other Module 4C work remain out of scope.
