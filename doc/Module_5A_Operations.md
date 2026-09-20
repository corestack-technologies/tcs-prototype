# Module 5A — Operations foundation

Open http://localhost:8443, choose **Operations · Internal workspace**, then **Enter Operations demo**. Expand **Prototype scenarios** and select **Load shared Operations scenarios**. The loader is idempotent. It creates records through existing Module 1–4 source services and places them in the same session stores used by the product workspaces.

## Implementation

- `src/operations/sources.ts` projects live source records. Case type, source module, source status and internal case status are distinct. Tenant-scoped source identities prevent duplicate cases. Reconciliation handoffs are reused for financial cases; a revenue receivable is represented once even when it also has a mismatch handoff.
- `src/operations/model.ts` defines source linkage, context, financial fields, evidence, timeline, priority, internal personas, triage validation and filtering.
- `OperationsProvider` retains assignment and internal history across navigation/persona changes in memory. Source facts remain in their original providers. Reloading the prototype resets the session, consistent with previous modules.
- Overview, My Queue, All Cases, Reviews, Financial Exceptions, Disputes / Escalations and History / Resolved are views of one queue. Legacy internal review routes enter Operations.
- Case details expose relevant evidence, financial breakdown, policy context, source status, timeline, assignment and internal-only notes/request states. Source screens reuse PaymentReceipt, PayoutCard, LifecycleHistory and RevenuePanel where applicable, without mutation callbacks.
- Internal persona entry is explicitly a prototype session boundary, not production authentication or Module 6 permission management. Member and Organization screens do not display Operations notes or cross-tenant queues.
- Ordinary successful payments and non-escalated exit settlements do not create Operations work merely because money is pending. The demo's existing future reference clocks are retained and labeled; no immutable SLA is introduced.
- No financial correction, approval/rejection, refund, receipt confirmation, Force Close execution, recovery movement or dispute resolution is implemented in this batch.

## Review sequence

1. Load the shared scenarios twice; the queue remains unchanged.
2. Open Amount Mismatch, Settlement Variance, Payout Dispute and Revenue Share Awaiting Confirmation; inspect money flow, evidence and source links.
3. Assign a case to yourself, switch to My Queue, then reassign it to the Financial Operations Reviewer. Switch personas to inspect the destination queue.
4. Add an internal note, then use a separate note to request information or escalate. Source financial/product status remains unchanged.
5. Filter by Organization, module, priority, status, type, assignment or age; search by the displayed case reference.
6. Inspect KYC, Organization application, Force Close, amendment, recovery and exit breach cases.
7. Open History / Resolved; final source outcomes are retained and triage controls are absent.
8. Exit Operations and open the verified Member's active Organization scenario. The loaded Groups and financial records are in that same source workspace.

## Validation

- 10 Module 5A service/state tests.
- 174 Modules 1–4 regression tests.
- 55 Operations queue/detail/source/overview/internal-entry render checks.
- 38 payout, 63 reconciliation and 7 revenue-share regression render checks.
- Module 5A relevant typecheck is clean; the full-project typecheck has six pre-existing unused-code diagnostics in legacy components.
- Production build passes, with the existing single-bundle size warning.
- Localhost responds on port 8443.
- Interactive browser and screenshot QA could not be completed: the browser runtime reports no connected browsers. Automated render checks are not a substitute for that visual review.

No Constitution decision is required for the implemented 5A triage boundary. Sensitive decision workflows remain for Modules 5B/5C.
