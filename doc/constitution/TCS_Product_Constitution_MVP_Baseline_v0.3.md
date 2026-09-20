# TCS Product Constitution

**MVP Baseline v0.3**  
**Product:** Thrift Core System (TCS)  
**Company:** Corestack Technologies Ltd.  
**Primary Market:** Nigeria

> This document defines the foundational business meaning, operating model, actors, product boundaries, financial principles, governance rules, lifecycle rules and core operating controls of TCS.
>
> It is intended to guide product design, prototype refinement, API design, database design, implementation, testing, reporting, integrations and future AI-assisted development.
>
> Where implementation, prototype behaviour, backend capability or technical design conflicts with this Constitution, the conflict must be identified and resolved deliberately. Implementation must not silently redefine the product.

---

# Part I — Constitutional Rules

## Chapter 1 — What Is TCS?

### 1.1 Product Definition

Thrift Core System (TCS) is a digital platform that enables verified individuals and approved Organizations to create, manage and participate in structured thrift schemes commonly known as Ajo, Esusu or contribution schemes.

TCS digitizes and coordinates:

- member onboarding and verification;
- Organization onboarding and approval;
- thrift group creation;
- recruitment and membership;
- payout positions;
- contribution obligations;
- provider-based contribution payments;
- settlement visibility and reconciliation;
- payout coordination;
- penalties;
- exits, defaults and recovery;
- disputes and appeals;
- reporting;
- internal operations;
- configuration;
- access management;
- audit and control.

TCS is intended to replace the weak record keeping, reconciliation and visibility associated with informal tools such as WhatsApp, spreadsheets, notebooks, screenshots, manual reminders and verbal agreements.

### 1.2 What TCS Is Not

TCS is not:

- a bank;
- a digital wallet;
- a licensed deposit-taking institution;
- a savings institution;
- an investment platform;
- the legal owner of thrift funds.

TCS does not take custody of customer thrift funds as part of its intended operating model.

### 1.3 Core Philosophy

> **Digitize the coordination of thrift, not the ownership of money.**

---

## Chapter 2 — Actors and Business Ownership

### 2.1 Member

A Member is a verified platform-level individual who may:

- join eligible thrift Groups;
- participate across multiple Organizations;
- hold multiple concurrent thrift commitments subject to eligibility and risk controls;
- make contribution payments;
- receive payouts;
- view their obligations and history;
- raise disputes;
- participate in recovery where required.

A Member is not owned by any single Organization.

### 2.2 Organization

An Organization is the primary business tenant on TCS.

An approved Organization may:

- create and operate multiple Groups;
- recruit Members;
- define permitted Group and Cycle rules;
- coordinate contributions and payouts;
- charge approved Organization fees;
- manage permitted exceptions;
- view Organization-level reporting.

The Organization remains responsible for its Groups and for funds settled to it.

### 2.3 Organization Owner

For MVP, an Organization has one Organization Owner.

Additional Organization staff accounts, delegated roles and maker-checker structures may be introduced later.

### 2.4 Organization Ownership Transfer

Normal Organization ownership transfer is **not supported in MVP**.

If an Owner dies, becomes incapacitated, becomes unreachable or a succession issue arises:

- no automatic transfer occurs;
- the Organization may be placed under controlled TCS review;
- no new Groups or Cycles should be started until the case is resolved;
- existing records and active arrangements must be protected;
- succession, replacement, closure or other legal treatment must follow an externally validated legal/compliance procedure.

### 2.5 Owner Participation in Own Group

An Organization Owner may participate in their own Group as a normal Member participant and is subject to the same obligations, payout rules, penalties and default rules.

An Owner must not self-approve an exception that directly benefits them. Such cases require TCS internal review/approval.

### 2.6 TCS Internal User

Authorized Corestack/TCS personnel may perform verification, Organization review, dispute management, payment/payout exception review, access administration, configuration, monitoring, reporting and controlled intervention according to permissions.

### 2.7 Payment Service Provider

TCS uses approved licensed payment providers for supported contribution processing and settlement. The business domain must remain provider-independent.

---

## Chapter 3 — Multi-Tenancy and Data Boundaries

### 3.1 Tenant Model

Corestack Technologies operates the TCS platform. Each approved Organization is a separate business tenant.

### 3.2 Tenant Isolation

An Organization must not obtain unauthorized visibility into another Organization's Groups, payments, payouts, financial records, configuration, reports, disputes or operational data.

### 3.3 Shared Member Identity

A Member may participate in Groups operated by multiple Organizations. Membership records belong to the relevant Group, Cycle and Organization.

### 3.4 Internal Oversight

Authorized TCS internal users may access Organization information only where legitimately required and such access must be permission-controlled and auditable.

---

## Chapter 4 — Group, Cycle and Round Model

### 4.1 Group

A **Group** is the thrift arrangement itself. Every Group belongs to one approved Organization and may exist across multiple Cycles.

### 4.2 Cycle

A **Cycle** is one complete rotation from the first payout position to the final payout position.

A completed Cycle remains historically intact even when the Group continues into another Cycle.

### 4.3 Round / Contribution Period

A **Round** is one collection-and-payout interval inside a Cycle.

For a 10-position monthly Group, one Cycle contains 10 Rounds: Round 1 pays Position 1, through Round 10 paying Position 10.

### 4.4 Position

A full Position represents **1.0 equivalent position**.

A half Position represents **0.5 equivalent position**.

MVP supports halves only as split Positions. Quarter Positions are not part of MVP.

### 4.5 Multiple Positions

Group policy may support one Position only, multiple Positions up to a configured maximum, or unrestricted multiple Positions within available capacity.

### 4.6 Payout Order

Payout order must be finalized before Cycle activation. Material changes after activation require a controlled Cycle Amendment.

### 4.7 Public and Private Groups

Organizations may create public/discoverable, private or invite-only Groups.

---

## Chapter 5 — Group Setup, Recruitment and Activation

### 5.1 Core Setup Flow

**Group Setup → Recruitment → Commitments → Positions → Rules → Readiness → Activation**

### 5.2 Readiness

Before activation, required checks may include sufficient participation, Position allocation, Member acceptance, finalized payout order, rule acknowledgement, financial configuration and applicable payment/account readiness.

### 5.3 Flexible Draft Management

Before activation, the Organization may add, remove, re-add or replace Members; increase/reduce draft Position capacity; and rearrange Positions.

TCS should recalculate the draft readiness state automatically.

### 5.4 No Simple Removal After Activation

Once a Cycle is active, a Member must not simply be deleted or removed as if they never participated. Departure must use an approved lifecycle such as Early Exit, Replacement, Post-Payout Default, Force Close or another controlled exception.

---

## Chapter 6 — Cancellation and Active-Cycle Protection

### 6.1 Cancellation Before Financial Commencement

A draft or activated Cycle may be normally cancelled where:

- no contribution obligation has been generated;
- no contribution/payment has been received or allocated;
- no payout or other financial posting has occurred.

The record remains visible as **CANCELLED**.

### 6.2 Financial Point of No Return

Once the first financial obligation has been created, normal cancellation is no longer permitted. The Cycle must then proceed through approved lifecycle actions.

### 6.3 Historical Preservation

Cancellation never means deletion of business history.

---

## Chapter 7 — Contribution and Obligation Model

### 7.1 Obligation

A contribution obligation is an amount a Member is required to contribute for a specific Group, Cycle and Round. Obligation, payment, settlement and payout are separate concepts.

### 7.2 Supported Frequencies

Initial supported frequencies are Daily, Weekly, Biweekly and Monthly.

### 7.3 Monthly Operating Default

- opens: **20th of the month**
- due: **last calendar day at 11:59:59 PM**
- grace: **1st and 2nd**
- late/penalty begins: **3rd at 12:00 AM**
- payout target: **3rd or earlier where ready**

### 7.4 Daily Operating Default

- due: **11:59:59 PM on the assigned day**
- no grace by default
- late may begin: **12:00 AM the following day**
- payout target: approximately **12:00 PM the following day or earlier where ready**

### 7.5 Weekly Operating Default

- contribution week: **Sunday to Saturday**
- due: **Saturday at 11:59:59 PM**
- grace: **Sunday**
- penalty may begin: **Monday at 12:00 AM**
- payout target: **Monday or earlier where ready**

### 7.6 Biweekly Operating Default

- period: two consecutive contribution weeks
- due: **second Saturday at 11:59:59 PM**
- grace: **Sunday and Monday**
- penalty may begin: **Tuesday at 12:00 AM**
- payout target: **Tuesday or earlier where ready**

### 7.7 Early Payout

Where all required obligations and readiness conditions are satisfied early, the Organization may proceed with payout early.

### 7.8 Advance Payments

Advance payment may be permitted and should normally allocate to the earliest eligible unpaid obligation unless explicit selection is allowed.

### 7.9 Partial Contributions

Where partial contribution is permitted, the amount received is recorded and the obligation remains outstanding until fully satisfied.

---

## Chapter 8 — Recipient Contribution in Own Payout Round

### 8.1 Optional Recipient Contribution

A Member's own contribution in the Round in which they are the payout recipient is optional.

If they do not contribute:

- they are not late;
- they are not defaulting;
- no penalty arises from the skipped optional contribution.

If they contribute, the payment is accepted normally.

### 8.2 Scheduled Payout Value

The **Scheduled Payout Value** is based on the agreed Position structure and contribution amount, not merely the actual collected pot after the recipient's optional own-round contribution decision.

Example: 10 full Positions × ₦100,000 = **₦1,000,000 Scheduled Payout Value**. If the recipient skips their own ₦100,000 contribution, the collected pot may be ₦900,000 but Scheduled Payout Value remains ₦1,000,000.

---

## Chapter 9 — Payment and Settlement Model

### 9.1 Normal Flow

**Obligation → Pay → Licensed Payment Provider → Confirmation → Allocation → Settlement/Reconciliation**

Ordinary successful contributions do not require Organization approval.

### 9.2 Payment Attempt

One obligation may have multiple attempts where earlier attempts fail, expire, are abandoned or remain pending.

### 9.3 Provider Confirmation

TCS should use trusted provider webhooks/callbacks, transaction verification and background requery/status checks.

### 9.4 Payment Timeliness

Timeliness is based on provider-confirmed successful-payment time, not settlement time, webhook arrival time or Organization review time.

### 9.5 Settlement

Payment confirmation and provider settlement are separate events. Settlement delay does not automatically make a Member late.

### 9.6 Wrong Amount

Money actually received with an incorrect amount should enter an exception state such as **AMOUNT_MISMATCH / PAYMENT_EXCEPTION**, not be falsely marked as a technical failure.

### 9.7 Manual Contributions

Manual/offline contribution recording is an exception:

- disabled by default;
- enabled only for approved cases;
- clearly marked **MANUAL/OFFLINE**;
- auditable;
- distinguishable from provider-confirmed payments.

### 9.8 Payment Channel Independence

TCS remains payment-channel independent. Provider checkout, bank transfer, provider virtual/Dedicated Virtual Accounts and other approved rails may be supported.

### 9.9 Settlement Account Change

Changing an Organization settlement account requires controlled validation, authorization, provider update where required and audit history.

---

## Chapter 10 — MVP Payout Model

### 10.1 Manual Organization-Controlled Payout

**Payout Ready  
→ Organization Reviews  
→ TCS Shows Validated Beneficiary Bank Details and Amount  
→ Organization Transfers from its Bank  
→ Organization Records Transfer Reference/Evidence  
→ AWAITING RECIPIENT CONFIRMATION  
→ Recipient Confirms, Disputes, or Confirmation Window Expires  
→ Payout Completed / Disputed**

TCS coordinates and records payout but does not hold the payout funds.

### 10.2 Payout Evidence

The Organization records beneficiary, amount, date/time, transfer/bank reference and supporting evidence where required.

### 10.3 Beneficiary Confirmation

The Organization must not confirm receipt on the beneficiary's behalf.

### 10.4 Auto-Completion

After a configurable confirmation window, where no dispute exists, TCS may mark the payout **COMPLETED — CONFIRMATION WINDOW ELAPSED**.

TCS must not falsely record that the Member manually confirmed.

### 10.5 Dispute Window

A Member may still dispute an auto-completed payout within a separate configurable dispute window. After that window expires, the payout is final unless TCS authorizes exceptional reopening.

### 10.6 Organization Liquidity

An Organization may use its own liquidity to execute payout before provider settlement and assumes the corresponding liquidity risk.

### 10.7 Future Provider-Assisted Payout

Provider-assisted payout may be introduced later where legally, commercially and technically supported. It is not an MVP requirement.

---

## Chapter 11 — Partial Payout

### 11.1 Controlled Exception

Partial payout is allowed only as a controlled exception and must record amount paid, outstanding balance, reason, evidence, authorizer and completion plan.

The payout remains **PARTIALLY PAID / OUTSTANDING** until resolved.

### 11.2 Fee Treatment

Organization fee is apportioned proportionally across partial payout installments.

TCS revenue share follows the Organization fee actually charged/collected on each installment.

Only the corresponding recognized TCS share becomes due when that payout installment is completed. Later completed installments make their corresponding shares due; cumulative share must not exceed the total applicable to the full payout. The full share is not charged again for each installment.

---

## Chapter 12 — Organization Fee and TCS Commercial Model

### 12.1 Mandatory Organization Fee

Every activated Group must have an Organization fee greater than zero under the normal commercial model.

The fee may be flat or percentage-based within TCS/GCT boundaries and must be disclosed before Member commitment.

### 12.2 Fee Timing

Organization fee is applied at payout, not deducted from every contribution payment.

### 12.3 Fee Basis

Organization fee is calculated from **Scheduled Payout Value**, not the actual collected pot after the recipient's optional own-round contribution decision.

### 12.4 Organization Fee Protection

Once a Member has committed to an activated Cycle, the agreed Organization Fee is not subject to individual Organizer reduction or waiver in MVP.

The mandatory Organization Fee remains governed by the Group/Cycle terms disclosed before Member commitment. The Organization has no normal per-Member fee reduction or waiver capability and cannot use such adjustments to avoid TCS revenue share.

Any future commercial discount, promotion or exceptional fee-adjustment capability would require an explicit TCS-controlled product/commercial rule and is not part of the MVP baseline.

### 12.5 TCS Revenue Share

For MVP, TCS does not charge a separate recipient-facing platform fee.

TCS earns a configurable revenue share calculated from the **Organization Fee actually due/recognized under the agreed Group/Cycle terms**.

Initial commercial direction: **10% of the gross Organization Fee actually charged/recognized under those agreed terms**.

### 12.6 Provider Processing Cost

Provider processing cost is an Organization operating expense and is not automatically added to the Member's contribution amount.

TCS may show projected Group economics during setup.

### 12.7 Unpaid TCS Revenue Share

Unpaid TCS share progresses through configurable **DUE → OVERDUE → RESTRICTED** controls.

After a configured threshold, TCS may block new Group activation and new Cycle commencement, while existing active Cycles should continue.

An Organization-recorded revenue-share payment remains unresolved until authorized TCS receipt confirmation. Recording a transfer does not settle the obligation or remove applicable overdue/restriction or financial-clearance controls. Existing Member contributions, required payouts, disputes, recovery and essential lifecycle actions remain available.

### 12.8 TCS Revenue Share Payment

For MVP, an Organization pays Corestack/TCS revenue share manually. Once the applicable Member payout or payout installment is completed and its corresponding Organization Fee is recognized, the corresponding TCS revenue share becomes due.

TCS displays the approved Corestack/TCS receiving bank account, exact amount due and a unique payment reference. The Organization transfers from its own bank and records the transfer amount, date/time, bank/reference and supporting evidence. The payment then remains **PAYMENT RECORDED — AWAITING TCS CONFIRMATION**.

Only an authorized TCS internal user may confirm receipt. The Organization cannot confirm on behalf of Corestack/TCS. Only after authorized receipt confirmation does the obligation become **SETTLED**; an Organization declaration or receipt image is not TCS confirmation.

Any bank transfer charge belongs to the Organization and does not reduce the exact TCS amount due. For example, a ₦5,000 TCS obligation remains ₦5,000 even if the Organization's bank charges ₦50 for the transfer.

An underpayment or overpayment must retain its actual payment record and enter a payment/review exception. Neither recording nor normal TCS confirmation may falsely settle an amount mismatch. Refunds and complex adjustment accounting require separate controlled treatment.

Receiving accounts come from controlled TCS configuration. Each payment retains the account snapshot and unique reference used at the time; later account changes do not rewrite history. Audit preserves creation and due events, reference generation, original amount, Organization actor and transfer/evidence, awaiting-confirmation state, TCS confirming actor/time, settlement and any overdue/restriction events.

---

## Chapter 13 — Penalties

### 13.1 Configurable Penalty Rules

Penalty is a simple, non-compounding daily percentage of outstanding required contribution principal, beginning after grace expiry. The Group configures an integer rate from 0 to 10 basis points per day (0 to 0.10%); 0 disables accrual. Suitable new demo Groups use 5 bps/day (0.05%). The 10 bps/day platform ceiling is a prototype policy value requiring review before production. It caps the daily rate, not the accumulated penalty balance.

The daily rate is disclosed and accepted before activation, material changes require reconfirmation, and the activated rate is locked. Daily charges are rounded half-up to integer kobo per position component at the start of each eligible local calendar day. The first eligible day starts at grace expiry. Half and multiple positions follow their required principal components; optional recipient contributions are excluded.

Partial principal payments reduce the basis for future days without rewriting posted daily charges. Once required principal is fully paid, accrual stops even if accrued penalty remains outstanding. Principal payments, Recovery allocations, penalty accrual and waivers remain separate records.

### 13.2 Ownership

Penalty money belongs to the Organization.

### 13.3 Waiver

The Organization may reduce or fully waive accrued penalties where permitted, with full audit. Reductions apply only to unpaid accrued penalties with an authorized actor, meaningful reason and actual audit timestamp. Original accrual is preserved. Reductions cannot waive principal or exceed unpaid penalty. An Owner cannot self-approve a beneficial exception; independent TCS review is required.

### 13.4 Payout Readiness

Normal payout readiness requires applicable penalties to be cleared unless an approved waiver/forfeiture/exception applies.

### 13.5 Penalty Stop at Cycle End

Penalty growth stops when the Cycle ends.

Outstanding contribution principal and already accrued penalties remain due, but no new daily penalty continues after Cycle completion.

---

## Chapter 14 — Withdrawal, Early Exit and Replacement

### 14.1 Withdrawal

Before financial activation, a Member may withdraw normally.

### 14.2 Early Exit

After activation/financial commencement but before receiving payout, departure becomes **EARLY EXIT**.

### 14.3 Historical Recognition

Contributions already made remain recognized and history is never rewritten.

### 14.4 Vacated Position

An approved Early Exit may create a **VACATED / EXITED** Position.

### 14.5 Replacement

Replacement is permitted before the outgoing Member has received payout.

The replacement Member must regularize required prior contribution value before fully assuming the Position. Regularization funds go to the Organization.

### 14.6 Outgoing Member Settlement

Settlement may occur immediately, after replacement regularization, at Cycle completion or at another permitted point according to disclosed rules.

The default expected settlement timing is Cycle end unless earlier settlement is appropriate.

TCS tracks **Exit Settlement Due** until resolved.

### 14.7 No Replacement

If no replacement is found:

- active membership may reduce;
- the original Position remains historically traceable;
- the remaining Members continue;
- the Cycle is not rewritten as though the Position never existed;
- the Organization remains responsible for the outgoing Member's recognized exit settlement.

### 14.8 Organization Failure to Settle Exit

Failure to settle an approved exit when due becomes an Organization dispute/default and may trigger TCS restrictions or escalation.

---

## Chapter 15 — Post-Payout Default and Recovery

### 15.1 No Normal Exit After Payout

After receiving payout, failure to continue becomes **POST-PAYOUT DEFAULT** rather than voluntary Early Exit.

### 15.2 Liability

All remaining scheduled contribution principal remains owed. Inactivity, account suspension, attempted withdrawal or Cycle completion does not cancel the debt.

### 15.3 Default Progression

**Due -> Grace -> Late -> Penalty -> Seven full calendar days after grace expiry -> POST-PAYOUT DEFAULT**

Post-Payout Default requires recognized receipt of the relevant payout and outstanding required principal at that threshold. Partial principal debt qualifies; penalty-only debt, optional skipped contributions, no payout receipt, and unresolved payment exceptions alone do not qualify. The threshold is fixed for this prototype, independent of a zero daily penalty rate. Recovery uses principal first, oldest due first, then penalty oldest due first. Excess stays an exception. Later recovery and removal of restrictions never erase the historical default event.

### 15.4 Platform-Wide Restriction

While a formal Post-Payout Default/recovery case is open, a Member may be restricted platform-wide from new thrift commitments and Organization application where policy requires.

Existing commitments elsewhere continue.

Other Organizations see only an eligibility/restriction indicator, not private debt details.

### 15.5 Recovery Payment

Normal recovery uses TCS/provider-supported payment. Controlled manual recovery directly to the Organization may exist as an exception with evidence and audit. Partial recovery may be permitted.

### 15.6 Group Continues

A defaulting Member does not freeze the Group. Remaining obligations continue.

### 15.7 No Replacement After Payout

A Member who has already received payout is not replaced and remains liable.

### 15.8 Resolution

**Outstanding Cleared → Organization Reviews → Organization Marks Recovery Resolved → Platform Restriction Removed**

The default remains historical.

### 15.9 Cycle Completion With Recovery

A Cycle may close as **COMPLETED WITH OUTSTANDING RECOVERY**. The recovery case remains open independently.

---

## Chapter 16 — Force Close, Group Termination and Write-Off

### 16.1 Force Close Cycle

Where an active Cycle cannot be completed normally:

**Organization Initiates → TCS Internal Review/Approval → Force Close Executes**

### 16.2 Terminate Group

**Terminate Group** permanently closes the Group itself. A Force-Closed Cycle does not automatically terminate the Group.

### 16.3 Required Record

Force Close preserves outstanding principal, accrued penalties, affected Members, unpaid payouts, exit settlements, disputes, Organization absorption/write-off, reason, evidence, approving actors and timestamps.

### 16.4 Principal Write-Off / Organization Absorption

Outstanding contribution principal is not an ordinary penalty-style waiver.

If the Organization absorbs or writes off principal through controlled closure:

- it is explicit;
- the financial loss is assigned appropriately to the Organization;
- other Members' entitlements are not silently reduced;
- original default/history remains visible;
- TCS approval applies where Force Close is used.

Force Close must never falsely represent unpaid money as paid.

---

## Chapter 17 — Disputes and Appeals

### 17.1 Flow

**Dispute Raised → Evidence Submission → TCS Internal Review → Decision → Optional One Appeal → Final Resolution**

### 17.2 Evidence Window

Both parties may submit evidence within configured time limits. Missed deadlines are recorded and TCS may decide on available evidence.

### 17.3 One Appeal

One appeal is permitted where applicable. A different authorized reviewer should handle the appeal where practical.

### 17.4 Record Protection

Material records under dispute must not be casually altered. Authorized corrections remain auditable.

### 17.5 TCS Authority

TCS may resolve platform records/statuses, apply restrictions, request evidence and escalate to providers/banks where appropriate.

TCS must not pretend it can reverse external bank transfers where it lacks lawful or technical authority.

---

## Chapter 18 — Cycle Completion, Rollover and Start Fresh

### 18.1 No Automatic Next Cycle

A completed Cycle does not automatically create or activate another Cycle.

### 18.2 Continuation Options

Within the same Group, the Organization may choose:

- **Rollover Cycle** — copy relevant previous Cycle setup into a new draft Cycle;
- **Start Fresh Cycle** — build the next Cycle afresh.

The Organization may instead create an entirely new Group where the arrangement itself has fundamentally changed.

### 18.3 Historical Independence

Rollover never overwrites or changes old Group/Cycle history.

Each Cycle preserves its own snapshot of Members, Positions, contribution amount, fees, rules, obligations, payments, payouts, exits/defaults, disputes, amendments and closure status.

### 18.4 Member Reconfirmation

Every Member must explicitly reconfirm participation in a new Cycle. Silence is not acceptance.

### 18.5 Rollover Positions

Previous Positions may be copied forward as **proposed Positions**. The Organization may rearrange them before activation and Members see their proposed Position when reconfirming.

### 18.6 Material Change After Acceptance

If a material term changes after a Member accepted, the previous acceptance is invalidated and the affected Member must reconfirm.

Material terms include contribution amount, frequency, Organization fee, payout Position, Position size and other material Cycle rules.

### 18.7 Non-Responsive Members

After a configurable reconfirmation window, non-responsive Members may be removed from the draft and replacements recruited.

### 18.8 Smart Draft Management

Before activation, TCS should intelligently recalculate Members, equivalent Positions, Scheduled Payout Value, proposed payout order and readiness whenever the draft changes.

---

## Chapter 19 — Cycle Amendments After Activation

### 19.1 Locked Material Terms

Material Cycle terms are locked after financial participation begins.

### 19.2 Exceptional Amendment

A controlled **Cycle Amendment** may exist for genuine exceptions and must include reason, affected terms, affected Members, required Member consent/reconfirmation, appropriate TCS oversight for serious financial changes and complete audit history.

Normal commercial changes should apply to the next Cycle.

---

## Chapter 20 — Suspension and Restrictions

### 20.1 Organization Suspension

When TCS suspends an Organization:

- no new Group activation;
- no new Cycle commencement;
- existing active Cycles normally continue under TCS oversight;
- Members remain able to contribute, receive payouts and raise disputes.

TCS may intervene more strongly where fraud, financial loss, compliance breach or Member-protection concerns justify it.

### 20.2 Member Suspension

A suspended Member may be blocked from new commitments but must still be able to access existing Cycles, pay obligations, receive payouts, participate in recovery/disputes and perform essential account actions.

TCS must not create a default by blocking a Member from paying.

---

## Chapter 21 — Member and Organization Closure

### 21.1 Member Closure

A Member cannot close their TCS account while they participate in an active Cycle, have active obligations, await payout, have unresolved recovery/default or have unresolved disputes/financial cases.

Once clear:

**Member Requests Closure → Organization Clearance Where Applicable → TCS Review/Approval → Account Closed**

For Members linked to multiple Organizations, TCS confirms no unresolved active relationship remains.

Historical/audit/financial records are retained as required.

### 21.2 Organization Closure

An Organization cannot normally close while it has active Cycles, outstanding payouts, exit settlements, unresolved recovery/default, disputes or unpaid TCS obligations.

Normal route:

**Organization Requests Closure → TCS Reviews/Clears → Organization Closed**

Where unresolved matters remain, controlled Force Close/termination applies.

---

## Chapter 22 — Organization Payout Breach

### 22.1 Breach

Failure by an Organization to pay a beneficiary when due becomes **ORGANIZATION PAYOUT BREACH / DEFAULT**.

### 22.2 Consequences

TCS may mark payout overdue, escalate, restrict new Groups/Cycles, initiate dispute/recovery processes and suspend or apply stronger action for serious/repeated breaches.

### 22.3 Responsibility

The Organization remains responsible for resolving the payout.

TCS/Corestack does **not** automatically reimburse the Member from Corestack's own funds.

---

## Chapter 23 — Death, Incapacity and Exceptional Succession

### 23.1 Member Death/Incapacity

Participation is placed under controlled review. No history is deleted and no Position, payout entitlement or debt is automatically reassigned.

Treatment of next-of-kin, estate representative, inheritance, future contribution liability and beneficiary payment must follow externally validated legal/compliance rules.

### 23.2 Organization Owner Death/Incapacity

There is no automatic Owner transfer.

The Organization may be restricted from new activity while existing arrangements are protected. Succession/closure follows a legal/compliance-approved process.

---

## Chapter 24 — Historical Visibility and Audit

### 24.1 Read-Only History

Completed, cancelled, force-closed and terminated records remain visible in read-only history, including terms, Members/Positions, obligations, contributions, payouts, penalties, exits/defaults, disputes, amendments and closure reason/status.

### 24.2 Audit Principle

Material actions must answer:

> Who performed the action, what changed, when did it change, why was it changed, under what authority, and what was the previous state?

Audit data is not ordinary editable business data.

---

## Chapter 25 — Product Domains

The principal domains are:

- **Clients** — onboarding, profiles, verification, status and eligibility.
- **Organizations** — application, approval, profile, workspace and lifecycle.
- **Thrift** — Groups, Cycles, Rounds, membership, Positions, obligations, payout order, exits/defaults and lifecycle.
- **Payments** — initiation, attempts, transactions, provider confirmation, settlement, reconciliation and exceptions.
- **Operations** — internal review, disputes, payout/payment exceptions and controlled interventions.
- **Access Management** — users, roles, permissions, access requests and approval controls.
- **Reports** — Clients, Organizations, Thrift, Payments, Operations, management and audit reporting.
- **Settings** — genuine platform, Organization and system configuration only.

> **A backend capability does not automatically deserve a standalone menu item.**

---

## Chapter 26 — Product Experience Principles

TCS may be operationally sophisticated without feeling heavy.

- **Role Appropriate:** users see capabilities relevant to their responsibilities.
- **Task Oriented:** navigation follows user goals, not backend architecture.
- **Progressive Complexity:** advanced functionality appears only when needed.
- **Reuse Before Duplication:** shared workflows/screens should be reused where permissions safely allow.
- **Business Language Before Technical Language:** backend terminology does not automatically become product wording.
- **Complexity Lives in the System:** rules, state, permissions and audit may be complex while the user primarily sees the next relevant action.

---

# Part II — Initial MVP Commercial Model

## Chapter 27 — Commercial Direction

The following are MVP commercial defaults/direction, not immutable constitutional values:

- every activated Group has Organization Fee > 0;
- Organization Fee may be flat or percentage-based within TCS boundaries;
- fee is charged at payout;
- fee basis is Scheduled Payout Value;
- Organization Fee is mandatory under the agreed Group/Cycle terms disclosed before commitment, with no ordinary individual Member fee reduction or waiver by the Organizer in MVP;
- no separate recipient-facing TCS platform fee for MVP;
- initial TCS revenue share direction is **10% of gross Organization Fee actually charged/recognized under the agreed Group/Cycle terms**;
- TCS share follows the Organization Fee due/recognized under those agreed terms and cannot be avoided through Organizer fee reduction or waiver;
- on partial payouts, Organization fee and TCS share are recognized proportionally;
- recognized TCS share becomes due upon completion of the applicable payout/installment and is paid manually under §12.8, remaining unresolved until authorized TCS receipt confirmation;
- Organization bank charges on revenue-share transfers are Organization expenses and do not reduce TCS amounts due;
- provider processing cost is an Organization operating expense;
- TCS may show projected Group economics during setup.

---

# Part III — GCT / Configurable Rules

## Chapter 28 — General Control Framework

### 28.1 Configuration Hierarchy

**Platform Defaults → Organization Defaults → Group/Cycle Policy**

Lower levels operate only within higher-level limits.

### 28.2 GCT Scope

GCT may control:

- Organization fee boundaries;
- TCS revenue-share percentage;
- penalty type/rate/value;
- grace periods;
- default thresholds;
- supported frequencies;
- partial-payment permission;
- manual-payment availability;
- payout confirmation window;
- payout dispute window;
- evidence window;
- appeal availability;
- reconfirmation window;
- participation/risk thresholds;
- active commitment/exposure limits;
- penalty waiver rules and other explicitly approved non-Organization-Fee waiver controls;
- Force Close authority thresholds;
- schedule boundaries;
- other operational parameters.

### 28.3 Participation / Exposure Controls

Members may participate in multiple active Groups/Cycles, including across Organizations, subject to configurable risk controls.

Potential factors include active Group count, active Positions, total periodic commitment, outstanding obligations, recent defaults and other platform risk indicators.

Exact scoring and thresholds are not constitutional rules.

### 28.4 Runtime Controls

Authorized runtime controls may change approved system behaviour without redeployment. Changes remain authorized and auditable.

---

# Part IV — Operational Controls

## Chapter 29 — Access Management and Internal Operations

### 29.1 Access Management

May include internal user creation/maintenance, roles, permissions, activation/deactivation, access approval and sensitive-action authorization.

### 29.2 Maker-Checker

Sensitive actions may require independent approval according to risk. Maker-checker should not be applied blindly to every action.

### 29.3 Controlled Exceptions

High-risk exceptions should record initiating actor, approving actor where required, reason, evidence, before/after values, timestamp and audit reference.

---

## Chapter 30 — Rule Hierarchy

Where rules conflict:

**Law / Regulatory Requirement  
→ TCS Platform Rules  
→ Organization Rules  
→ Group/Cycle Rules  
→ Member-Specific Arrangement**

Lower-level rules may add detail but cannot override applicable law, TCS platform controls, protected Member rights, audit requirements or core financial lifecycle rules.

---

# Part V — External Legal, Compliance and Payment Provider Validation

## Chapter 31 — Production Readiness Boundary

Prototype and product development may continue before every external question is resolved.

Real-money production must not rely on unvalidated assumptions.

### 31.1 Legal Counsel

Validate:

- TCS operating model and regulatory classification;
- applicable CBN requirements;
- Organization/Member contracts;
- liability allocation;
- payout/default obligations;
- dispute/refund responsibility;
- Organization succession/Owner death/incapacity;
- Member death/incapacity/estate treatment;
- Force Close/write-off implications;
- whether a partner-bank/MFB structure is required.

### 31.2 Compliance / Data Protection

Validate:

- applicable Nigerian data-protection obligations;
- whether a DPIA is required;
- privacy-policy requirements;
- NIN/BVN/identity document/bank-detail handling;
- whether TCS should store BVN at all;
- data minimization;
- encryption/security;
- retention;
- access control;
- audit;
- incident handling.

### 31.3 Payment Provider Due Diligence

Confirm:

- provider classification of TCS;
- support for the multi-Organization model;
- Organization/subaccount onboarding;
- settlement routing;
- contribution collection options;
- DVA/virtual-account eligibility;
- Member vs Member–Organization vs Member–Group DVA model;
- customer validation requirements;
- DVA/account limits and scaling;
- pricing;
- approval of the thrift/B2B2C model;
- dispute/refund/reversal mechanics;
- fallback-provider options.

### 31.4 Provider Architecture Principle

TCS should use domain concepts such as Payment Attempt, Transaction, Provider Confirmation, Settlement and Reconciliation rather than hardcoding one provider's terminology throughout the product.

---

# Part VI — Future / Non-MVP Items

## Chapter 32 — Future Capabilities

Potential future capabilities include:

- Organization staff and delegated roles;
- Organization-level maker-checker;
- provider-assisted payout initiation;
- additional payment providers/routing;
- additional split Position types;
- advanced eligibility/risk scoring;
- advanced automated recovery;
- richer reconciliation;
- expanded analytics/reporting;
- AI-assisted operations;
- internationalization;
- other regulated/partner-supported capabilities.

Future functionality must not unnecessarily burden the MVP.

---

# Chapter 33 — Binding Constitutional Principles

1. **TCS coordinates thrift but does not take custody of thrift funds.**
2. **Every Group belongs to an approved Organization.**
3. **A Member is a platform-level identity and may participate across multiple Organizations.**
4. **Group, Cycle and Round are distinct business concepts.**
5. **A Cycle is a complete payout rotation; a Round is one contribution-and-payout period inside it.**
6. **Historical Cycles are preserved and never overwritten by Rollover.**
7. **Contribution obligation, payment, settlement and payout are separate concepts.**
8. **Normal contribution payment is provider-driven.**
9. **Manual contribution recording is an exception.**
10. **Payment confirmation and provider settlement are separate events.**
11. **Payment timeliness is determined by trusted provider success time.**
12. **MVP payout is Organization-controlled and manually executed from the Organization's bank.**
13. **The Organization records payout evidence; the beneficiary confirms or disputes.**
14. **Payout may auto-complete after a configurable confirmation window without falsely recording Member confirmation.**
15. **A separate dispute window may remain open after auto-completion.**
16. **Recipient contribution in their own payout Round is optional and creates no lateness/default if skipped.**
17. **Scheduled Payout Value remains the financial reference even when the recipient skips their own contribution.**
18. **Every activated Group has an Organization fee greater than zero under the normal commercial model.**
19. **Organization fee is applied at payout and based on Scheduled Payout Value.**
20. **TCS MVP revenue is a configurable share of the actual Organization fee charged, not a separate recipient platform fee.**
21. **Provider processing cost is an Organization operating expense.**
22. **Partial payout is a controlled exception and fees are apportioned proportionally.**
23. **Penalty growth stops when the Cycle ends.**
24. **Penalty may be waived within policy; principal is not an ordinary waiver item.**
25. **Before payout, Early Exit and replacement may apply under controlled rules.**
26. **After payout, failure to continue becomes Post-Payout Default.**
27. **Post-Payout Default may restrict new commitments platform-wide while existing commitments continue.**
28. **A defaulting Member does not freeze the Group.**
29. **A Cycle may complete with an open recovery case.**
30. **Force Close Cycle and Terminate Group are separate controlled actions.**
31. **Where unresolved financial obligations are affected, Force Close requires Organization initiation and TCS approval.**
32. **Force Close never silently erases debt or falsely records payment.**
33. **Normal cancellation is allowed only before financial obligations/transactions commence.**
34. **Once financial participation begins, normal cancellation is no longer available.**
35. **A completed Cycle does not automatically start another Cycle.**
36. **A next Cycle may use Rollover or Start Fresh within the same Group.**
37. **Every Member must explicitly reconfirm participation in a new Cycle.**
38. **Material changes after Member acceptance require reconfirmation.**
39. **Material terms are locked after financial participation begins except through controlled amendment.**
40. **An Organization Owner may participate in their own Group but cannot self-approve a beneficial exception.**
41. **Members may hold multiple concurrent commitments subject to configurable risk limits.**
42. **A suspended Member must still be able to fulfil existing financial obligations.**
43. **A suspended Organization normally continues existing active Cycles under TCS oversight while new activity is restricted.**
44. **Member and Organization closure are unavailable while material active obligations/cases remain.**
45. **Organization payout failure is an Organization breach; TCS does not automatically reimburse the Member from Corestack funds.**
46. **Member or Owner death/incapacity is handled through controlled review and externally validated legal/compliance procedures.**
47. **Normal Organization ownership transfer is not an MVP capability.**
48. **Closed, completed, cancelled, force-closed and terminated records remain visible in read-only history.**
49. **Tenant boundaries protect each Organization's information.**
50. **Rule hierarchy is Law/Regulation → TCS → Organization → Group/Cycle → Member-specific arrangement.**
51. **Material actions, overrides and financial exceptions must be traceable and auditable.**
52. **GCT and runtime controls must be authorized and auditable.**
53. **Product complexity should live in rules/state/audit rather than being exposed unnecessarily to users.**
54. **A backend capability does not automatically deserve a standalone menu item.**
55. **Prototype, frontend, backend, APIs, database, integrations and reporting must remain aligned with this Constitution.**

---

# Constitutional Status

This document is the current **TCS MVP Baseline Constitution v0.3** and is the product source of truth.

The previous backend and frontend implementations may be mined for useful ideas, workflows, endpoints and screens, but they do not override this Constitution.

The intended hierarchy is:

**Product Constitution  
→ Product/UX design and prototype  
→ API/domain model  
→ backend/frontend implementation  
→ integrations and reporting**

Where a new business scenario emerges:

1. identify the scenario;
2. determine whether an existing constitutional principle resolves it;
3. if not, agree the intended product behaviour;
4. amend the Constitution deliberately where necessary;
5. align prototype and implementation afterward.

The Constitution should evolve deliberately with the product and must never be silently redefined by implementation drift.
