# TCS Product Constitution

**Foundation Draft v0.2**  
**Product:** Thrift Core System (TCS)  
**Company:** Corestack Technologies

> This document defines the foundational business meaning, operating model, actors, product boundaries, financial principles, governance rules and core operating rules of TCS.
>
> It is intended to guide product design, prototype refinement, API design, database design, implementation, testing, reporting, integrations and future AI-assisted development.
>
> Where implementation, prototype behaviour or technical design conflicts with this Constitution, the conflict must be identified and resolved deliberately rather than silently redefining the product.

---

# Chapter 1 — What Is TCS?

## 1.1 Introduction

Thrift Core System (TCS) is a digital platform that enables individuals and approved Organizations to create, manage and participate in structured thrift schemes commonly known as Ajo, Esusu or contribution schemes.

TCS digitizes the operational processes required to coordinate:

- member onboarding;
- identity verification;
- Organization onboarding;
- thrift group creation;
- group recruitment;
- membership;
- payout positions;
- contribution obligations;
- payments;
- settlement visibility;
- payouts;
- penalties;
- defaults;
- disputes;
- reporting;
- internal oversight;
- audit and control.

TCS is designed to solve the operational weaknesses of traditional thrift systems while preserving the flexibility, trust and community relationships that make those systems successful.

## 1.2 The Problem TCS Solves

Traditional thrift schemes are commonly managed through informal tools and processes such as:

- WhatsApp groups;
- spreadsheets;
- notebooks;
- personal bank transfers;
- manual reminders;
- screenshots and payment references;
- verbal agreements;
- manual payout calculations;
- informal reconciliation.

These methods create problems including:

- weak record keeping;
- unclear contribution history;
- payment disputes;
- missed contribution disputes;
- difficulty tracking payout positions;
- poor reporting;
- dependence on the organizer;
- limited member visibility;
- weak audit trails;
- difficulty managing multiple groups;
- difficulty scaling thrift operations.

TCS provides a structured, auditable and transparent system of record for these activities.

## 1.3 What TCS Does

TCS enables:

- verified individuals to participate in thrift activities;
- eligible members to apply to become Organizations;
- approved Organizations to create and operate thrift groups;
- members to discover groups or receive invitations;
- Organizations to define group rules and financial policies;
- TCS to generate contribution obligations;
- members to make payments through supported payment providers;
- Organizations to monitor collections and settlement;
- Organizations to coordinate payouts;
- members to confirm payout receipt or raise disputes;
- TCS internal users to review, govern and support platform activity;
- management and Organizations to obtain reliable reporting.

Every significant business activity should be traceable and auditable.

## 1.4 What TCS Does Not Do

TCS is not:

- a bank;
- a digital wallet;
- a licensed deposit-taking institution;
- a savings institution;
- an investment platform;
- the legal owner of thrift funds.

TCS does not take custody of customer thrift funds.

Funds are processed through approved payment infrastructure and remain attributable to the relevant Organization and its members.

## 1.5 Core Philosophy

> **Digitize the coordination of thrift, not the ownership of money.**

---

# Chapter 2 — Business Narrative

## 2.1 Becoming a Member

An individual creates a TCS account and completes the required onboarding and identity verification.

Once the required conditions are satisfied, the individual becomes an active verified TCS Member.

A Member is a platform-level identity and may participate in eligible thrift groups belonging to different Organizations.

## 2.2 Becoming an Organization

An active verified Member who wishes to operate thrift activities may apply to become an Organization.

Organization eligibility is subject to TCS-defined criteria.

The detailed eligibility framework may evolve over time and may eventually consider factors such as:

- verification status;
- platform history;
- thrift participation history;
- behavioural indicators;
- risk indicators;
- previous Organization activity;
- other approved eligibility criteria.

The initial product does not require a complex eligibility scoring engine.

Organization applications are reviewed by authorized TCS internal users.

Only approved applicants receive Organization status.

## 2.3 Creating a Thrift Group

An approved Organization may create one or more thrift groups.

During group creation, the Organization defines relevant rules including:

- group identity;
- contribution frequency;
- contribution amount;
- group capacity;
- payout positions;
- payout order;
- admission rules;
- payment rules;
- penalties;
- Organization fees;
- financial policies;
- withdrawal rules;
- replacement rules;
- payout rules;
- other applicable terms.

## 2.4 Recruiting Members

Groups may support:

- public discovery;
- member join requests;
- Organization invitations;
- private/invite-only participation.

Organizations may operate both discoverable and private groups.

Membership becomes active only after required acceptance and commitment conditions are satisfied.

## 2.5 Preparing for Launch

Before activation, the Organization completes the group's readiness requirements.

These may include:

- sufficient membership;
- position allocation;
- confirmation of member commitments;
- finalized payout order;
- rule acknowledgement;
- financial configuration;
- readiness validation.

## 2.6 Running a Thrift Cycle

After activation, TCS generates contribution obligations according to the group's schedule.

Members fulfil those obligations through supported payment channels.

The payment provider confirms payment status.

TCS records:

- payment attempts;
- payment confirmation;
- allocation;
- obligation status;
- settlement information where available.

The payment provider subsequently settles funds according to the configured provider settlement arrangement into the Organization's designated account.

## 2.7 Managing Payouts

Payout is separate from contribution collection.

When a payout becomes due, TCS guides the Organization through the payout process.

For the MVP:

1. TCS determines the beneficiary and expected payout amount.
2. The Organization reviews the payout instruction.
3. TCS presents the beneficiary's validated payout/bank information.
4. The Organization transfers the money from its own bank account.
5. The Organization records the payout reference and supporting information in TCS.
6. The beneficiary confirms receipt or raises a dispute.
7. TCS records the final payout status.

Future versions may allow provider-assisted payout initiation directly from TCS where the selected provider and applicable operating arrangement support it.

## 2.8 Completing a Cycle

A cycle reaches operational completion when all required:

- obligations;
- payout positions;
- settlements;
- approved exceptions;
- exit settlements;
- disputes;
- and relevant operational checks

have been resolved.

Where a TCS platform fee remains outstanding, the payout itself may still be recorded as completed while the cycle remains in an appropriate state such as:

**AWAITING PLATFORM FEE**

until the required platform fee condition is satisfied.

---

# Chapter 3 — Stakeholders and Personas

## 3.1 Member

A verified individual who may:

- join eligible thrift groups;
- pay contribution obligations;
- view participation history;
- receive payouts;
- raise disputes;
- participate across multiple Organizations.

## 3.2 Organization

An approved business actor responsible for creating and operating thrift groups.

The Organization remains responsible for:

- its groups;
- group members;
- group rules;
- thrift funds after settlement;
- payout execution;
- operational decisions permitted by TCS;
- Organization-level fees;
- permitted exceptions.

## 3.3 Organization Owner

For the MVP, one Organization Owner performs the Organization's required administrative and operational duties.

Additional Organization staff accounts and delegated roles are not required for the initial product.

The product may introduce Organization staff and delegated permissions later.

## 3.4 TCS Internal User

Authorized Corestack/TCS personnel responsible for activities such as:

- identity review;
- Organization review;
- operational review;
- dispute management;
- access administration;
- configuration;
- monitoring;
- reporting;
- controlled exception handling.

Permissions determine which internal capabilities an individual internal user may access.

## 3.5 Platform Administrator

A privileged internal user responsible for platform governance, access, control configuration and platform integrity.

## 3.6 Payment Service Provider

An external licensed provider responsible for supported payment processing, transaction confirmation and settlement services.

TCS should remain provider-independent at the business-domain level.

The initial implementation may use **Paystack**, while allowing future integration with providers such as:

- Monnify;
- Flutterwave;
- other approved providers.

---

# Chapter 4 — Multi-Tenancy and Organization Model

## 4.1 Platform Model

TCS is a multi-Organization platform.

Corestack Technologies operates the TCS platform.

An approved Organization is the primary business tenant.

## 4.2 Tenant-Owned Activity

Organization-controlled activity may include:

- thrift groups;
- group membership;
- cycles;
- contribution obligations;
- Organization configuration;
- payment records relating to its groups;
- payout records;
- Organization reports;
- disputes relating to its operations.

## 4.3 Member Identity

A TCS Member exists at platform level.

A Member is not permanently owned by one Organization.

A Member may simultaneously participate in eligible groups operated by different Organizations.

Membership records belong to the relevant group and Organization.

## 4.4 Tenant Isolation

An Organization must not obtain unauthorized visibility into another Organization's:

- groups;
- members;
- payments;
- financial records;
- configuration;
- reports;
- disputes;
- operational data.

Shared TCS identity does not weaken tenant-level isolation.

## 4.5 Internal Oversight

Authorized TCS internal users may access tenant information where legitimately required for:

- platform operations;
- support;
- review;
- investigation;
- reporting;
- governance;
- dispute resolution.

Such access must remain permission-controlled and auditable.

---

# Chapter 5 — Thrift Group and Position Model

## 5.1 Group

Every thrift group belongs to an approved Organization.

## 5.2 Position

A payout position represents entitlement within the group's payout sequence.

## 5.3 Equivalent Position

A full position represents:

**1.0 equivalent position**

Where split positions are permitted:

A half position represents:

**0.5 equivalent position**

The initial supported split model is based on halves unless the product explicitly expands this later.

## 5.4 Multiple Positions

Group policy may support:

- one position only;
- multiple positions up to a configured maximum;
- unrestricted multiple positions within available group capacity.

## 5.5 Payout Order

Payout order must be defined before group activation.

Material changes after activation must be subject to controlled rules and audit.

## 5.6 Public and Private Groups

Organizations may create:

- publicly discoverable groups;
- private groups;
- invite-only groups.

---

# Chapter 6 — Contribution and Obligation Model

## 6.1 Obligation

A contribution obligation represents an amount a Member is required to contribute for a specific group and cycle period.

An obligation is not itself a payment.

Payment and obligation status must remain separate concepts.

## 6.2 Supported Frequencies

Initial supported frequencies are:

- Daily;
- Weekly;
- Biweekly;
- Monthly.

## 6.3 Contribution Lifecycle

A contribution obligation may progress through states such as:

**Upcoming → Open → Due → Grace → Late → Penalty Applied → Paid → Allocated → Closed**

The exact technical status model may differ, but the business meaning must remain clear.

## 6.4 Monthly Default Schedule

Recommended monthly operating defaults:

- obligation opens: **20th of the month**;
- normal due date: **last calendar day of the month at 11:59:59 PM**;
- grace period: **1st and 2nd of the following month**;
- late status / penalty begins: **3rd at 12:00 AM**;
- penalty accrues according to configured daily rules;
- standard payout target: **3rd or earlier where readiness conditions are satisfied**.

## 6.5 Daily Default Schedule

Recommended daily operating defaults:

- obligation due: **11:59:59 PM on the assigned day**;
- no grace period by default;
- late status may begin at **12:00 AM the following day**;
- standard payout target: approximately **12:00 PM the following day**;
- earlier payout may occur once required conditions are satisfied.

## 6.6 Weekly Default Schedule

Recommended weekly operating defaults:

- contribution week: **Sunday to Saturday**;
- due: **Saturday at 11:59:59 PM**;
- grace: **Sunday**;
- penalty may begin: **Monday at 12:00 AM**;
- payout target: **Monday or earlier where ready**.

## 6.7 Biweekly Default Schedule

Recommended biweekly operating defaults:

- period covers two consecutive contribution weeks;
- due: **second Saturday at 11:59:59 PM**;
- grace: **Sunday and Monday**;
- penalty may begin: **Tuesday at 12:00 AM**;
- payout target: **Tuesday or earlier where ready**.

## 6.8 Early Payout

A scheduled payout date is not intended to unnecessarily delay an otherwise ready payout.

> Where all required obligations and readiness conditions are satisfied early, the Organization may proceed with payout before the normal grace period or scheduled payout target expires.

## 6.9 Advance Payments

Advance payment may be permitted.

Unless explicit obligation selection is allowed, advance amounts should normally be allocated to the earliest eligible unpaid obligation.

## 6.10 Partial Payments

Groups may allow or prohibit partial payment.

Where partial payment is permitted:

- the received amount is recorded;
- the obligation remains outstanding until fully satisfied;
- remaining balance remains visible.

---

# Chapter 7 — Payment and Settlement Model

## 7.1 Payment Principle

The normal contribution flow is provider-driven.

The normal flow is:

**Obligation → Pay → Provider → Confirmation → Allocation → Settlement/Reconciliation**

Ordinary successful contributions must not depend on manual Organization approval.

## 7.2 Member Payment Experience

The Member interacts primarily with a simple **Pay** action.

TCS does not need to expose unnecessary provider complexity.

The payment provider may determine the available payment methods, which may include:

- bank transfer;
- card;
- USSD;
- provider-generated virtual account;
- other supported provider channels.

## 7.3 Virtual Accounts

TCS may use provider-issued virtual or dedicated accounts as a payment collection rail.

Such accounts:

- are provided by the payment service provider;
- are not TCS bank accounts;
- are not TCS wallets;
- do not represent stored value held by TCS.

Virtual accounts may be associated with a Member, Organization, payment context or transaction according to the provider integration design.

## 7.4 Payment Attempt

A payment attempt represents an attempt by a Member to satisfy an obligation.

One obligation may have multiple attempts where previous attempts:

- fail;
- expire;
- are abandoned;
- remain unconfirmed.

## 7.5 Provider Confirmation

A payment becomes provider-confirmed based on trusted provider information.

TCS should use appropriate provider mechanisms such as:

- callbacks/webhooks;
- transaction verification;
- background requery/status checks

to resolve payment status.

Ordinary delayed provider confirmation should not require Organization intervention.

## 7.6 Payment Timeliness

Timeliness is based on the provider-confirmed successful-payment timestamp.

It is not based on:

- settlement time;
- webhook arrival time;
- Organization review time.

## 7.7 Settlement

Payment confirmation and settlement are separate events.

For the initial model, provider-confirmed contributions are settled to the relevant Organization's designated settlement account according to the provider's settlement schedule, which may include arrangements such as T+1 or other provider-defined schedules.

Settlement delay does not automatically make a Member late.

## 7.8 Wrong Amount

Where money is actually received but does not match the expected payment amount, TCS must not incorrectly mark the transaction as technically failed.

The transaction should enter an appropriate exception state such as:

**AMOUNT MISMATCH / PAYMENT EXCEPTION**

The amount should not be incorrectly allocated until the exception is resolved.

The Member may raise a dispute or correction request.

## 7.9 Manual Contributions

Manual/offline contribution recording is not the normal TCS payment method.

It may exist only as a controlled exception capability.

Manual contribution capability:

- is disabled by default;
- may be enabled by TCS for approved use cases;
- must remain distinguishable from provider-confirmed payments;
- must be auditable.

Possible future use cases may include:

- provider outage;
- controlled offline payment;
- migration;
- historical record entry;
- reconciliation exception.

## 7.10 Settlement Account Changes

An Organization's settlement account is sensitive financial configuration.

A settlement-account change must follow a controlled process that may include:

- request;
- account validation;
- verification;
- internal authorization;
- provider update;
- audit history.

---

# Chapter 8 — Payout Model

## 8.1 Separation of Payment and Payout

Contribution payment and payout are different financial events.

A Member contributes into the thrift arrangement.

The Organization subsequently pays the beneficiary whose payout position becomes due.

## 8.2 MVP Payout Process

For the MVP:

**Payout Due  
→ Organization Reviews  
→ TCS Provides Beneficiary Details  
→ Organization Transfers from Bank  
→ Organization Records Transfer  
→ Beneficiary Confirms or Disputes  
→ Payout Completed**

TCS orchestrates the process but does not itself hold the payout funds.

## 8.3 Payout Evidence

The Organization records sufficient payout information such as:

- beneficiary;
- payout amount;
- payout date;
- bank/reference information;
- supporting evidence where required.

## 8.4 Beneficiary Confirmation

The beneficiary may:

- confirm receipt;
- raise a dispute.

Confirmation provides additional operational certainty but must not replace actual financial evidence.

## 8.5 Early Payout Using Organization Liquidity

An Organization may choose to execute payout using its own liquidity before provider settlement is fully completed.

The Organization assumes the corresponding liquidity risk.

## 8.6 Exceptional or Partial Payout

Controlled exceptional payout may be permitted.

Relevant information may include:

- reason;
- amount;
- authorizer;
- evidence;
- outstanding amount;
- completion plan.

## 8.7 Future Provider-Assisted Payout

TCS may later support:

**Organization → Initiate Payout in TCS → Provider → Beneficiary**

where an approved provider and applicable commercial/regulatory arrangement permit it.

The Constitution does not require the MVP to implement this.

---

# Chapter 9 — Withdrawal, Early Exit, Replacement and Default

## 9.1 Withdrawal Before Activation

A Member may withdraw before group activation according to the applicable group rules.

This is a normal:

**WITHDRAWAL**

and is different from an exit after the thrift has started.

## 9.2 Early Exit

After group activation but before receiving payout, a Member who can no longer continue may enter an:

**EARLY EXIT**

process.

The Organization determines whether the exit may proceed according to the group's disclosed rules.

## 9.3 Early Exit Contribution Recognition

Contributions already made by the exiting Member remain recognized.

The exiting Member does not lose the historical record of payments already made.

## 9.4 Position Vacancy

Following an approved early exit, the Member's payout position may become:

**VACATED / EXITED**

The original cycle history must not be rewritten as though the Member never participated.

## 9.5 Replacement

The Organization may replace an early-exit Member with another eligible verified Member.

The replacement Member must regularize the required prior contribution value before fully assuming the position.

Regularization funds are received and controlled by the Organization.

## 9.6 Settlement of the Outgoing Member

The Organization determines, according to:

- disclosed group rules;
- applicable financial policy;
- approved operating discretion,

whether the outgoing Member is settled:

- immediately;
- when replacement regularization occurs;
- at cycle completion;
- at another permitted settlement point.

All such settlement treatment must remain transparent and auditable.

## 9.7 No Replacement

Where no replacement is found:

- active membership may reduce;
- the exited position remains historically traceable;
- the remaining group continues according to the approved operating rules;
- the Organization remains responsible for the outgoing Member's recognized exit settlement.

## 9.8 Organization Failure to Settle Exit

Where the Organization fails to settle an approved exit obligation when due, the matter becomes an:

**ORGANIZATION DISPUTE / DEFAULT**

and may be escalated to TCS Operations.

TCS may impose appropriate platform restrictions subject to policy.

## 9.9 Post-Payout Default

Once a Member has received their payout, normal voluntary early exit is no longer available for remaining obligations.

Failure to continue becomes:

**POST-PAYOUT DEFAULT**

Post-payout default may trigger:

- outstanding obligations;
- penalties;
- restrictions;
- escalation;
- dispute handling;
- recovery processes;
- other approved controls.

A dedicated post-payout default process flow will be designed separately.

---

# Chapter 10 — Fees and Penalties

## 10.1 Fee Transparency

Financial rules must be disclosed before a Member commits to a group.

Members must be able to understand applicable:

- contribution amount;
- Organization fees;
- penalties;
- applicable TCS/platform charges;
- other material financial rules.

## 10.2 Organization Fee

An Organization may configure a group-level service fee according to TCS-controlled boundaries.

An Organization fee may be:

- flat amount;
- percentage.

The fee must be disclosed in the group rules.

## 10.3 TCS Platform Fee

TCS may charge a platform fee.

The platform fee may be:

- flat amount;
- percentage.

Platform fee rules are controlled centrally by TCS through approved configuration.

The Organization must be able to see the applicable TCS fee when configuring or operating the group.

## 10.4 Platform Fee Timing

The TCS platform fee is not silently deducted from every Member's contribution principal.

For the initial operating model, the platform fee becomes due around the payout/cycle-completion process according to TCS policy.

Payout and platform fee status remain separate.

For example:

- Payout: **COMPLETED**
- Platform Fee: **DUE**
- Cycle: **AWAITING PLATFORM FEE**

This keeps financial records truthful.

## 10.5 Penalties

Penalties may be:

- flat;
- percentage-based;
- subject to daily accrual;
- subject to maximum values or other configured boundaries.

## 10.6 Penalty Ownership

Penalty money belongs to the Organization.

## 10.7 Penalty Waiver

The Organization may waive or forgive a Member's penalty where permitted.

Nigeria-specific thrift operations often require practical discretion.

Penalty waiver or forfeiture must be auditable.

Audit should include:

- amount;
- reason;
- authorizer;
- date/time.

## 10.8 Penalty and Payout Readiness

The normal rule is that outstanding penalties must be cleared before a Member's payout is considered fully ready.

The Organization may exercise approved discretion to:

- waive the penalty;
- permit payout;
- forfeit the penalty,

where permitted by group policy and TCS controls.

---

# Chapter 11 — Disputes, Appeals and Exceptions

## 11.1 Dispute Principle

TCS must provide a structured process for resolving disagreements between Members and Organizations.

## 11.2 Dispute Process

A typical dispute may follow:

**Dispute Raised  
→ Evidence Submission  
→ Internal Review  
→ Decision  
→ Optional Appeal  
→ Final Resolution**

## 11.3 Evidence

Both parties may provide relevant evidence.

Evidence submission may be subject to configured time limits.

## 11.4 Record Protection

Material records involved in an active dispute must not be casually altered.

Changes required during dispute resolution must remain auditable.

## 11.5 TCS Authority

TCS may:

- review evidence;
- resolve the platform record;
- determine platform status;
- apply permitted restrictions;
- request additional information;
- escalate to the payment provider or bank where appropriate;
- enforce TCS platform rules.

TCS cannot pretend to reverse funds already transferred into an external bank account where it lacks lawful or technical authority to do so.

External reversal/refund processes must follow the applicable provider or banking process.

## 11.6 Appeal

Where permitted, a party dissatisfied with an initial decision may submit an appeal.

Appeal review should be independent where practical.

## 11.7 Provider Disputes

Where a dispute concerns provider-processed money, TCS may interact with the provider's dispute, reversal, refund or transaction-verification process.

---

# Chapter 12 — Product Domains

TCS should remain powerful without becoming unnecessarily heavy.

The principal product domains are:

## 12.1 Clients

Covers:

- onboarding;
- profiles;
- verification;
- client/member status.

## 12.2 Organizations

Covers:

- Organization application;
- approval;
- profile;
- Organization workspace;
- Organization-level activity.

## 12.3 Thrift

Covers:

- groups;
- membership;
- positions;
- cycles;
- obligations;
- contribution schedules;
- payout order;
- group lifecycle.

## 12.4 Payments

Covers:

- payment initiation;
- payment attempts;
- transactions;
- provider confirmation;
- settlement information;
- reconciliation;
- payment exceptions.

## 12.5 Operations

Covers internal:

- review queues;
- verification review;
- Organization review;
- thrift operations;
- payment exceptions;
- dispute review;
- payout exceptions;
- controlled interventions.

## 12.6 Access Management

The preferred product-facing name for capabilities historically referred to as UAC.

Covers:

- users;
- roles;
- permissions;
- access requests;
- approval controls.

## 12.7 Reports

Covers reporting across:

- Clients;
- Organizations;
- Thrift;
- Payments;
- Operations;
- management and audit.

## 12.8 Settings

Settings should contain only genuine:

- platform configuration;
- Organization configuration;
- system controls.

Settings must not become a dumping ground for normal operational functionality.

---

# Chapter 13 — Internal Operations and Access Management

## 13.1 Internal Operations

Authorized TCS internal users may perform activities including:

- KYC/verification review;
- Organization review;
- dispute review;
- payment exception review;
- operational intervention;
- monitoring;
- reporting;
- configuration management.

The MVP does not require unnecessary internal departments or excessive persona fragmentation.

Permissions determine what each internal user may perform.

## 13.2 Access Management

Access Management controls internal platform access.

Capabilities may include:

- user creation;
- user maintenance;
- roles;
- permissions;
- activation/deactivation;
- access approval;
- sensitive-action authorization.

## 13.3 Maker-Checker

Sensitive actions may require independent approval.

Maker-checker should be applied according to risk.

It should not be added to every action simply because the capability exists.

## 13.4 Organization Access

The MVP uses a single Organization Owner.

Future product versions may introduce:

- Organization administrators;
- group managers;
- finance users;
- operational users;
- read-only/reporting users.

---

# Chapter 14 — Configuration and General Control Framework

## 14.1 Configuration Hierarchy

TCS configuration follows:

**Platform Defaults  
→ Organization Defaults  
→ Group Financial Policy**

Lower levels operate inside limits defined by higher levels.

## 14.2 Runtime Controls

Authorized runtime controls allow selected behaviour to be adjusted without source-code changes or redeployment.

## 14.3 General Control Table — GCT

The General Control Table provides controlled configuration for reusable platform rules.

Examples may include:

- fee type;
- fee limits;
- penalty rules;
- grace periods;
- supported frequencies;
- manual-payment availability;
- dispute windows;
- appeal availability;
- schedule boundaries;
- waiver permissions;
- platform thresholds;
- allowed configuration ranges.

Exact technical implementation may evolve.

## 14.4 Configuration Authority

Controls may be:

- platform-only;
- Organization-configurable within approved limits;
- group-configurable before activation;
- locked after activation;
- amendable only through controlled approval.

## 14.5 Active-Cycle Protection

Material group financial rules should not normally be changed silently after a cycle becomes active.

Changes should generally apply to:

- future cycles;
- future groups;

unless an authorized exceptional process permits otherwise.

---

# Chapter 15 — Reporting, Audit and Product Experience

## 15.1 Reporting Principle

Reporting is a core TCS capability.

TCS should provide sufficient information to replace the weak visibility commonly associated with WhatsApp, spreadsheets and manual thrift administration.

## 15.2 Member Reporting

Members should be able to understand:

- obligations;
- payment history;
- outstanding amounts;
- penalties;
- group participation;
- payout history;
- exit/default status where applicable.

## 15.3 Organization Reporting

Organizations should be able to understand:

- groups;
- membership;
- positions;
- obligations;
- collections;
- delinquency;
- penalties;
- payouts;
- exits;
- defaults;
- disputes;
- payment exceptions;
- cycles.

## 15.4 Internal Reporting

TCS internal reporting may cover:

- member activity;
- Organization activity;
- group activity;
- payments;
- settlement;
- reconciliation;
- exceptions;
- defaults;
- disputes;
- payouts;
- platform fees;
- audit activity.

## 15.5 Audit Principle

Material actions must answer:

> Who performed the action, what was changed, when was it changed, under what authority, and what was the previous state?

Audit data must not be treated as ordinary editable business data.

## 15.6 Product Simplicity

TCS may contain extensive operational capability without exposing all complexity to every user.

The following principles apply:

### Role Appropriate

Users should see capabilities relevant to their responsibilities.

### Task Oriented

Navigation should reflect user goals rather than backend architecture.

### Progressive Complexity

Advanced functionality should appear only when needed.

### Reuse Before Duplication

Different personas may share screens and workflows where permissions safely control behaviour.

### Business Language Before Technical Language

Technical names such as UAC or internal implementation terminology do not automatically become product labels.

### Capability Does Not Equal Navigation

> **A backend capability does not automatically deserve a standalone menu item.**

---

# Chapter 16 — Geography, Providers and Product Evolution

## 16.1 Geography

The current TCS product is designed specifically for **Nigeria**.

Nigeria-specific:

- operating behaviour;
- payment providers;
- banking infrastructure;
- thrift practices;
- payment schedules;
- business realities

may therefore influence the MVP.

Internationalization is not an immediate product requirement.

## 16.2 Payment Provider Strategy

The business domain remains provider-independent.

The initial provider may be **Paystack**.

Future providers may include:

- Monnify;
- Flutterwave;
- other approved Nigerian payment providers.

Provider-specific technical implementation must not unnecessarily redefine core TCS business concepts.

## 16.3 Provider Due Diligence

Before production usage, Corestack must validate the applicable provider arrangement for the TCS multi-Organization operating model, including:

- Organization onboarding;
- subaccounts;
- settlement;
- virtual-account capability;
- commercial terms;
- transaction limits;
- required verification;
- payout capabilities;
- applicable provider controls.

## 16.4 Product Scope

Capabilities should be classified as:

### MVP

Required to operate the first usable version of TCS.

### Near-Term

Important enhancements following validation of the MVP.

### Future

Capabilities that may expand the platform later.

Future functionality must not unnecessarily burden the current product.

---

# Chapter 17 — Constitutional Principles

The following principles are binding product principles for TCS:

1. **TCS coordinates thrift but does not take custody of thrift funds.**

2. **Every thrift group belongs to an approved Organization.**

3. **A verified TCS Member may participate in eligible groups across multiple Organizations.**

4. **Organizations remain responsible for the operation of their groups and the funds settled to them.**

5. **Contribution obligation, payment, settlement and payout are separate business concepts.**

6. **Normal Member contribution payment is provider-driven.**

7. **Manual payment recording is an exception, not the primary payment model.**

8. **Payment confirmation and provider settlement are separate events.**

9. **Payment timeliness is determined using trusted provider confirmation.**

10. **Payout is controlled by the Organization while TCS coordinates and records the process.**

11. **Organizations may use their own liquidity to execute early payout and assume the corresponding risk.**

12. **A Member may withdraw normally before activation.**

13. **After activation but before payout, withdrawal becomes an Early Exit process.**

14. **After receiving payout, failure to continue becomes Post-Payout Default rather than normal voluntary exit.**

15. **Replacement Members must regularize the required prior contribution position before assuming an exited position.**

16. **The Organization controls the timing of an outgoing Member's settlement within the disclosed group rules and approved operating discretion.**

17. **Penalties belong to the Organization and may be waived according to authorized rules.**

18. **Organization fees and TCS platform fees must be transparent.**

19. **Material financial rules must be visible before a Member commits to a group.**

20. **Disputes must be evidence-based, controlled and auditable.**

21. **Material actions and overrides must remain traceable.**

22. **Tenant boundaries must protect each Organization's information.**

23. **Flexibility must operate within approved configuration boundaries.**

24. **GCT and runtime controls must be authorized and auditable.**

25. **Product interfaces should expose complexity according to user need rather than backend complexity.**

26. **A backend capability does not automatically deserve a user-facing menu item.**

27. **Prototype, frontend, backend, APIs, database, integrations and reporting must remain aligned with this Constitution.**

---

# Constitutional Status

This document is the current working product baseline for TCS.

It defines the intended product and business direction but does not prevent future controlled amendments.

Where new business scenarios emerge, TCS should:

1. identify the scenario;
2. determine whether it conflicts with an existing constitutional principle;
3. agree the intended product behaviour;
4. update the Constitution where necessary;
5. subsequently align prototype and implementation.

The Constitution should therefore evolve deliberately with the product rather than being silently overridden by implementation decisions.