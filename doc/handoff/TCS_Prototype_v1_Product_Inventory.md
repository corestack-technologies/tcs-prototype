# TCS Prototype v1 Product Inventory

High-level product map. Detailed states, exact permissions and field contracts are in the linked handoff catalogues; source paths are relative to the repository.

| Domain / purpose | Actors | Major screens | Important actions | State/context / source |
| --- | --- | --- | --- | --- |
| Auth | Member / prospective Member | login, signup, otp, onboarding, success | Sign in, register, verify contacts, complete profile and submit identity | Public entry; own session for continuation; contact policy and submission validation; components: Login, Signup, ClientContact, ClientOnboarding, ClientSubmission |
| Member | Member | dashboard, dashboard-new, client-profile, client-verification | Inspect account; maintain own profile; submit/respond to verification | Own signed-in identity; account and KYC guards; essential activity retained under restriction; components: ClientHome, ClientProfile, ClientVerification |
| Discovery | Member | discover, community-detail, join-request, join-submitted, pending-approval | Discover requestable Groups and submit/inspect join interaction | Legacy fixture interaction; production must connect authorized Group recruitment, not copy demo isolation; components: components/thrift discovery and join components |
| Thrift participation | Member | my-groups, group-detail, contribution-schedule, group-timeline | Inspect membership, Position, schedule and history | Own participation and selected Group/Cycle; fallback legacy content is a distinct fixture; components: MemberGroups, ActiveCycleWorkspace; legacy GroupDetail, ContributionSchedule, GroupTimeline |
| Member payments | Member | contribution-detail, payment-confirmation, payment-gateway, contribution-history, member-payments | Inspect obligations, initiate contribution/advance, review attempts and status | Own eligible obligation; selected Group and optional Round; source checks and payment policy; components: payments/PaymentWorkspace |
| Member payouts | Beneficiary Member | payout-position, member-payouts | Inspect payout, confirm own receipt or dispute | Own beneficiary record; applicable receipt/dispute windows; components: payouts/PayoutWorkspace |
| Organization entry | Member / Owner | org-opportunity, org-application, org-review, org-activation, org-eligibility | Apply, respond, inspect decision, finish approved setup | Verified eligible applicant; one owned Organization; approved before activation; components: components/org/OrgOpportunity, OrgApplication, OrgReviewStatus, OrgActivation, OrgEligibility |
| Owner workspace | Organization Owner | owner-dashboard, owner-groups, owner-join-requests, owner-verification, owner-profile, owner-settings | Inspect workspace, Groups, request/verification context; maintain permitted profile/settings | Owned Organization and source status; Owner cannot decide platform KYC; legacy queues retain prototype scope; components: components/org/Owner* |
| Group preparation | Organization Owner | owner-group-setup, owner-group-recruit, owner-group-positions, owner-group-rules, owner-group-readiness, owner-group-activated | Draft terms, recruit, assign Positions, review commitments/readiness, activate | GroupGuard; owned eligible Organization; draft/activation locks and full readiness; components: GroupSetupWizard, GroupRecruitment, GroupPositions, GroupRulesReview, GroupReadiness, GroupActivated |
| Owner Cycle | Organization Owner | owner-cycles | Inspect Round, obligations, readiness and penalties | Owned Group/Cycle and permitted action; no silent active-term changes; components: rounds/ActiveCycleWorkspace |
| Lifecycle | Owner / participating Member according to view | owner-lifecycle, member-lifecycle | Exit, replacement, Recovery, amendment, completion and history | Own Member scope or owned Group; specific lifecycle/consent/independence guards; components: lifecycle/LifecycleWorkspace |
| Owner collections | Organization Owner | owner-collection, owner-collection-history | Monitor required/optional collection and recorded payments | Owned Group; manual exceptions only when policy permits; components: payments/PaymentWorkspace owner |
| Owner payout | Organization Owner | owner-payouts | Prepare instruction, record external transfer and inspect responses | Owned Group; readiness, bank snapshot, amount and exception guards; never confirm for recipient; components: payouts/PayoutWorkspace owner |
| Reconciliation | Organization Owner | owner-reconciliation | Inspect settlement matching, cases, fees and TCS share; record share transfer | Owned financial world; TCS receipt confirmation requires separate Internal authority; components: reconciliation/ReconciliationWorkspace |
| Operations | Authorized Internal reviewer | operations, reviewer-queue, reviewer-detail, org-review-queue, org-review-detail | Triage, inspect evidence, apply permitted source decisions/interventions | operations.case.view plus exact decision permission, source guards and independent reviewer where required; components: operations/OperationsWorkspace |
| Access | Authorized Internal administrator | access-management, security | Maintain users/roles, inspect audit, simulated sessions/locks | Exact access.* or security.* permissions; default deny and self-escalation protection; components: access/AccessWorkspace, SecurityWorkspace |
| Reports | Member / Owner / authorized Internal | member-reports, owner-reports, internal-reports | Filter, inspect source rows and export | Own identity/tenant; Internal exact report permission and protected-source gates; components: reports/ReportsWorkspace, InternalReportsWorkspace |
| Settings | Authorized Settings user | settings, diagnostics | Inspect/change supported runtime/date controls; read Diagnostics | settings.view plus exact action/diagnostics permission; controlled date forbidden in Production; components: settings/SettingsWorkspace, processes/DiagnosticsWorkspace |
| Processes | Authorized process user | scheduled-processes | Inspect runs, preview/execute, retry failures | operations.process.view; run and retry distinct permissions; current preview and environment/source guards; components: processes/ScheduledProcessesWorkspace |

Approved product meaning is governed by Constitution v1.0. In-memory seed worlds, projected cases and legacy discovery are implementation limitations rather than alternate product rules. See TCS_v1_State_Transition_Catalogue.md for exact state axes.

## Important state axes by product area

| Area | Important states / source |
| --- | --- |
| Auth / Member | Contact verified/unverified and onboarding completeness; KYC required/pending/information-required/rejected/verified; account active/restricted/suspended/closed. src/clients/model.ts |
| Organization | Application draft/submitted/pending/information-required/approved/declined; workspace active/restricted/suspended/closure-pending/closed. src/organizations/model.ts |
| Thrift preparation | Participant pending/approved/rejected; acceptance tied to material revision; draft/activated/cancelled Cycle. src/groups/model.ts |
| Active thrift / lifecycle | Timing Upcoming/Open/Due/Grace/Late independent of unpaid/partial/satisfied obligation; completed/completed-with-recovery/force-closed; Recovery open/awaiting-review/resolved. src/rounds/model.ts; src/lifecycle/model.ts |
| Payments | Attempt pending/confirmed/failed/expired; allocation unallocated/allocated/partial/exception; settlement independent. src/payments/model.ts |
| Payout / reconciliation | Ready/instruction-prepared/partial/awaiting-confirmation/disputed/completed variants; receivable due/overdue/restricted/settled. src/payouts/model.ts; src/reconciliation/model.ts |
| Operations | New/Assigned/In Review/awaiting states/Escalated/Resolved/Closed; source decisions separately guarded. src/operations/model.ts |
| Access / Security | User Pending/Active/Suspended/Deactivated; role active/inactive; account lock separate; session Active/Expired/Revoked. src/access/model.ts |
| Reports | Read-only source projection, available/unavailable/empty/denied/error presentation; no report-owned financial state. src/reports/model.ts |
| Settings / processes | REAL_TIME/CONTROLLED (non-production only); run RUNNING/COMPLETED/COMPLETED_WITH_NO_CHANGES/PARTIAL_FAILURE/FAILED. src/settings/service.ts; src/processes/model.ts |

Exact component paths for every View are in [Route / Screen Inventory](TCS_v1_Route_Screen_Inventory.md).
