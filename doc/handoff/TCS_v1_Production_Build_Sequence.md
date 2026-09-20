# TCS v1 Production Build Sequence

Production handoff for frozen TCS Prototype v1. No production implementation is performed in Stage 8.

Follow vertical slices: each includes persistence, domain service, API, approved frontend connection, authorization, tests and UAT. Foundations must include minimum real RBAC/audit, scheduling/idempotency primitives and provider-neutral notification events as soon as dependent slices need them. Later Access, Reports, Settings and notification slices complete their full workspaces/adapters; they do not postpone essential security or financial processing.

| Order | Slice | Persistence / domain | API | Frontend connection | Authorization | Tests / UAT |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | Foundation / environments | Tenant/source IDs, audit/outbox, migration/version conventions | Health/config and error contracts | Retain layouts; no domain rewrite | Deny-by-default middleware, secret isolation | Environment isolation, restore and API smoke UAT |
| 2 | Auth / Member | Identity, profile, real session, contact challenges | Registration/contact/profile/auth actions A01–A02 | Connect Auth and Member profile | Own identity, expiry/revocation/rate limits | U01/U21 |
| 3 | Verification | Submission snapshots and protected document references | KYC and reviewer actions A03 | Verification and Operations source review | Exact verification permissions; private evidence | U02/U24 |
| 4 | Organization | Application, Owner relationship, approved settlement snapshot | Application/setup/profile actions A04–A05 | Organization entry and Owner workspace | One Owner, tenant isolation and independent review | U03 |
| 5 | Group setup | Versioned terms, fee/rate policy snapshot | Draft/readiness A06 | Group setup and review | Owned eligible Organization; material locks | U04/U06 |
| 6 | Recruitment / Positions | Request/invitation, membership, holdings, commitments | A07–A08 | Connect discovery and shared recruitment | Eligibility, capacity, full/half and explicit acceptance | U04/U05 |
| 7 | Cycles / obligations | Atomic activation, schedule and component records | A09–A10 plus idempotent generation | Member Group / Owner Cycle views | No cancellation after commencement; own/tenant scope | U06/U07/U11 |
| 8 | Payments / reconciliation | Attempt, provider facts, allocation, reservation, settlement | A11–A12; verified provider adapter | Payments and reconciliation | Tenant/reference validation; manual exception authority | U08–U10/U24 |
| 9 | Payout / commercial share | Instruction, evidence, installment, fee/share receivable | A13–A14 | Payout recipient and Owner views | Own receipt; partial authorization; independent TCS confirmation | U12/U13/U25 |
| 10 | Defaults / Recovery / exit | Daily charges, default scope, receipts/allocations, exits/handover | A15–A17 | Lifecycle, penalty, Recovery and history | Accepted rate, threshold, self-benefit and consent rules | U15–U19 |
| 11 | Operations completion | Durable cases, triage, decisions, evidence/appeals/restrictions | A18 | Full Operations workflows | Exact source decision and independence checks | U14/U17/U19 |
| 12 | Access / Security administration | Users, roles, audit and security events | A19 | Access/Security workspaces | Self-escalation/last-admin guard; real session revocation | U21 |
| 13 | Report completion | Authorized source projections and export query snapshot | A20 | Complete catalogue and source drilldown | Report plus source permission; privacy | U20 |
| 14 | Settings / durable processing | Config revisions, run/steps/retry lineage, worker locking | A21–A22 | Settings, process and Diagnostics | Date/run/retry separation; real-time-only Production | U22/U23 |
| 15 | Notification channels completion | Event/consent/template/delivery history | A23; Mailtrap, SMS sandbox, Meta adapters | Own status/history and preferences where approved | Consented channel and signed status callbacks | U24 |
| 16 | Final UAT / controlled pilot | Rehearsed data, migrations, restore and monitoring | End-to-end integrated contracts | Real-device and network UAT | Security/provider/legal readiness evidence | U01–U26; one trusted Organization and limited Groups |

Prototype → Handoff extraction → Constitution v1.0 → Freeze → Production Build → UAT integrations → Controlled Pilot. Production readiness decisions precede real-money use; they need not block starting isolated foundation work. Validate provider settlement architecture before locking payment storage/contracts. Keep production-discovered corrections traceable to the Constitution, update acceptance criteria deliberately, and place unrelated new features in Post_V1_Backlog.md.

## Building strategy alignment

Reviewed the original doc/TCS_V1_Building_Strategy.docx dated 15 September 2026 by reading its document text without modifying the binary. This sequence retains progressive frontend reuse, vertical slices, Mailtrap, Africa's Talking and Meta WhatsApp directions, all three notification channels within V1, and a small controlled pilot. Field Data Dictionary and Settings Catalogue are included because the strategy explicitly asks for them. No material direction conflict was found. Its sample field wording about financial commencement must be read with final activation snapshot/reconfirmation/amendment rules; it is not permission to silently edit activated terms.

