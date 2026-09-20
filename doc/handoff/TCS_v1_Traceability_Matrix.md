# TCS v1 Traceability Matrix

Production handoff for frozen TCS Prototype v1. No production implementation is performed in Stage 8.

Read rule references against [Constitution v1.0](../constitution/TCS_Product_Constitution_v1.0.md), capability IDs against [API Requirements](TCS_v1_API_Requirements.md) and Uxx IDs against [UAT Acceptance](TCS_v1_UAT_Acceptance_Catalogue.md). View IDs resolve through [Route Inventory](TCS_v1_Route_Screen_Inventory.md). Evidence names refer to tests/<name>.test.mjs, with production integration evidence explicitly outstanding.

| Constitution rule | Domain / rule | Screen / route | API capability | Entity | Permission / actor | Acceptance / regression |
| --- | --- | --- | --- | --- | --- | --- |
| §2.3, §3.3 | Organization ownership / cross-Organization Member | org-application; org-activation; my-groups | A02/A04/A07 | Member, Organization, Membership | Member/Owner; application reviewer | U03/U04; organizations/groups |
| Ch5, §4.4–4.6 | Recruitment / half Positions / activation | owner-group-recruit; owner-group-positions; owner-group-readiness | A06–A09 | Commitment, Position, Cycle snapshot | Owner; affected Member consent | U04–U07; groups/rounds |
| Ch6 | Financial point of no return | owner-group-activated; owner-lifecycle | A06/A09/A17 | Cycle, obligation/posting | Owner plus lifecycle approval | U06/U19; lifecycle |
| Ch7–8 | Obligation and own-Position optionality | group-detail; member-payments; owner-collection | A09–A11 | Round, ObligationComponent, OptionalDecision | Own Member or Owner scope | U07/U11; rounds/payments |
| §7.8, Ch9 | Provider confirmation / advance / timeliness | member-payments; owner-reconciliation | A11/A12 | Attempt, transaction, allocation, reservation | Member/provider; payments.exception.review | U08–U10; payments/reconciliation |
| Ch10–11 | Manual payout / partial / receipt evidence | owner-payouts; member-payouts | A13 | Payout, instruction, installment | Owner records; beneficiary responds | U12/U13; payouts |
| Ch12, Ch27 | Fee / TCS share recognition and confirmation | owner-reconciliation; operations | A14 | Fee posting, RevenueReceivable, RevenuePayment | Owner; revenue_share.confirm | U13/U25; revenue |
| Ch13 | Simple daily principal-only penalty | owner-cycles; member-lifecycle | A15/A22 | PenaltyAccrual, PenaltyWaiver | Domain process; permitted non-beneficial Owner waiver | U16; financial-regularization |
| §15.3–15.9 | Seven-day default / Recovery / privacy | member-lifecycle; owner-lifecycle; operations | A15/A18 | DefaultEvent, RecoveryCase, restriction | Member/Owner; exact dispute/restriction authority | U15/U17; financial-regularization/lifecycle |
| Ch14 | Early Exit / replacement / Organization settlement | member-lifecycle; owner-lifecycle | A16 | ExitCase, Replacement, settlement | Affected Member; Owner; independent review if beneficial | U18; lifecycle |
| Ch16, Ch18–19 | Force Close / termination / rollover / amendment | owner-lifecycle; operations | A09/A17/A18 | Cycle, amendment, ForceCloseRequest | thrift.force_close.approve; thrift.amendment.review; Member consent | U19; operations-interventions |
| Ch17, C35 | Disputes / independent appeal | member-payouts; operations | A18 | DisputeProcess, evidence, resolution | disputes.decide; disputes.appeal_review; cases.exceptional_reopen | U14; operations-interventions |
| Ch20–24 | Restrictions / clearance / history | client-profile; owner-settings; operations | A02/A05/A18 | Restriction, clearance, immutable history | Exact Member/Organization restriction permission | U17/U19/U21; operations-interventions |
| C34 | Exact authority / no self-escalation | access-management; security | A19 | User, Role, Permission, AuthoritySnapshot | access.* and security.* exact catalogue | U21; access/security |
| C36 | Non-production date / runtime controls | settings; diagnostics | A21 | RuntimeControl, BusinessDateChange | settings.*; no inherited process authority | U22; settings |
| C37 | Ordered idempotent lifecycle processing | scheduled-processes | A22 | Run, StepResult, domain event keys | operations.process.view/run/retry distinct | U07/U23; processes |
| C38, Ch24 | Reports / source fidelity / export | member-reports; owner-reports; internal-reports | A20 | Report projection and source links | Own/tenant or exact reports.* plus source gates | U20; reports/internal-reports |
| §2.7, §31.4 | Provider independence / no custody | member-payments; owner-payouts; owner-reconciliation | A11–A14/A23 | Provider facts, settlement, notification event | Backend adapter authority; no browser secret | U24/U25; production adapter UAT |

