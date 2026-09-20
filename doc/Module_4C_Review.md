# Module 4C — Settlement, Reconciliation & Payment Exceptions

Implemented locally on the approved Modules 1–4B working tree. The Constitution remains v0.3; the subsequent narrow revenue-share regularization adds its manual payment rail. No Operations workspace, backend, live provider/bank integration, refund rail, commit, push or PR was introduced.

## Review entry

Organization → Reconciliation. Collections links to the same workspace. Use the clearly labelled prototype scenarios to add isolated Groups and deterministic provider events. The Organization settlement-account link reuses Module 2's controlled lifecycle; settlement records retain their original destination snapshot.

The workspace prioritizes cases needing attention, followed by provider settlements, expectations, permitted manual receipts, Organization Fee recognition and TCS receivables. Member Payments retains simple confirmed/review/manual status without settlement batch, fee or variance calculations.

## Shared financial behaviour

- Organization-scoped reconciliation state uses the existing Group payment, allocation, payout and lifecycle records. Settlement batches may match payments from multiple Groups belonging to that Organization.
- Trusted provider references and covered amounts match automatically. Stable provider/reference identity prevents duplicate payments, settlement expectations and settlement values. Conflicting deliveries retain cases instead of overwriting original records.
- Gross contribution recognition is independent of net settlement. Provider fees are Organization operating expenses. Known expected provider fees and net amounts are compared with settlement facts; variance, unmatched references, partial matching and delayed settlement remain visible.
- Unmatched provider money remains recorded and unallocated, with an Operations case. Existing amount mismatch, advance reservation/exit and late optional contribution rules remain intact. No reallocation, refund or supplemental payout is inferred.
- Manual/offline receipt recording is off by default. Only explicitly permitted demo Group policy exposes it. Organization-confirmed receipts remain distinguishable from provider confirmations; review-required, ineligible, wrong-amount and Owner-benefiting receipts remain unallocated for independent review. References, evidence, actor, payment date and reason are preserved.
- Normal pending settlement no longer blocks clearance solely for being pending. This intentionally replaces the former 4A blanket unsettled-payment clearance assertion. Unallocated money/reservations, delayed/exceptional settlement, manual review and existing lifecycle/payout matters remain protected. Batch settlement cases propagate to every affected Group's clearance.
- Organization Fee remains mandatory and unwaivable per Member. TCS receivables use the exact fee/share amounts already recognized by 4B installments, including partial and split payouts. No second Member fee is introduced.
- Configured TCS receivable thresholds progress Due → Overdue → Restricted. Restriction prevents new activation and first financial commencement, while existing Rounds, contributions, payouts and lifecycle actions continue. The regularized manual revenue-share rail requires an Organization-recorded transfer followed by authorized TCS confirmation; there is no Organizer self-clear action.
- Case context links original transactions, settlements, Members, Groups, Cycles, Rounds, obligations, payouts, evidence and lifecycle events where known. Organization users can submit handoff context; internal investigation and money resolution remain for Module 5.

## Configuration and demos

Unconfigured normal records do not silently inherit provider charges or commercial timing thresholds. Explicit prototype policy uses 1.5% expected provider processing cost, a 48-hour normal settlement period, and TCS overdue/restriction thresholds of 72/168 hours from recognition. These are demo values, not newly declared production commercial rules. Manual permission is isolated to designated demo Groups.

The original seventeen scenarios cover pending settlement, reconciled batches/provider costs, variance, unmatched settlement/payment, partial/under/overpayments, advance reservation/exit exception, late optional payment, manual direct-bank receipt/review, duplicate delivery, and TCS Due/Overdue/Restricted.

## Validation

- 136 prior-module regression tests pass, with the one clearance assertion updated to the explicitly approved 4C normal-pending-settlement rule.
- 27 Module 4C tests pass, including multi-Group batches, split settlement of one payment, immutable account/payment snapshots, duplicate safety, manual source/review, late optional cutoff, fee recognition, commercial restrictions and affected-Group clearance.
- 255 render checks pass: 8 rounds, 62 lifecycle, 96 payments, 38 payouts, 51 reconciliation/Member-history checks.
- Relevant Module 4C/integration typecheck passes; six pre-existing diagnostics outside this module remain.
- Production build passes with the existing large-bundle warning. Localhost on port 8443 returns HTTP 200.
- No attached browser was available; interactive browser verification was not performed.

No unresolved Module 4C Constitution question remains. Actual provider/commercial values need future production configuration/validation, as specified by the brief. Operations investigation, approvals and financial resolution remain deliberately out of scope.

## Revenue-share manual-payment regularization

The Constitution previously defined share calculation and controls but lacked the complete manual rail. Sections 11.2, 12.7, new 12.8 and Chapter 27 now specify completion-based due recognition, controlled receiving-account/reference display, Organization transfer recording, separate authorized TCS receipt confirmation, transfer-charge ownership, amount exceptions and audit. Fee protection and the penalty-waiver rule are preserved.

TCS share now becomes due only for completed payout installments, using the original 4B proportional fee/share amounts. Commercial Due/Overdue/Restricted state remains separate from payment Awaiting Confirmation/Exception/Settled state. Recording payment never clears the receivable or its restriction. The prior direct external settlement helper was replaced with a recorded-payment confirmation boundary requiring TCS permission.

The centralized Corestack receiving account is explicitly synthetic (DEMO-TCS-001), with no live bank verification. Unique references and account snapshots are retained per obligation/payment. A changed configuration affects future obligations, not existing history. Four additional demos cover awaiting confirmation, TCS-confirmed settlement, proportional partial payout and amount exception; existing Due/Overdue/Restricted demos are reused.

Validation for the regularization: all 174 domain/regression tests pass, including 11 new revenue-share tests; relevant typecheck and production build pass. Existing unrelated diagnostics and the large-bundle warning remain. No Module 5 Operations work, commits or pushes.
