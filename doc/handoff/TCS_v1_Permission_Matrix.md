# TCS v1 Permission Matrix

Frozen product extraction for TCS Prototype v1. Production requirements below are not implemented infrastructure.

Authority is the union of exact recognized permissions on currently active assigned roles for an active, unlocked user. Unknown keys and missing context deny. Role names are not capabilities; no wildcard, implicit administrator inheritance or self-escalation is permitted. Module visibility does not grant source-action authority.

External actors use identity and tenant/participation checks rather than internal role keys: Member actions require the same Member and eligible source; Owner actions require the same Organization owner and applicable lifecycle state. Restricted/suspended actors retain essential existing obligations, payout, Recovery and dispute access. An Owner cannot self-approve a beneficial exception.

| Exact permission | Capability | Seeded roles granting it |
| --- | --- | --- |
| settings.view | View platform Settings | Platform Settings Administrator; Settings Viewer; Runtime Controls Manager; Business Date Manager |
| settings.runtime_controls.manage | Manage runtime controls | Platform Settings Administrator; Runtime Controls Manager |
| settings.business_date.view | View Business Date | Platform Settings Administrator; Settings Viewer; Business Date Manager |
| settings.business_date.manage | Manage non-production Business Date | Platform Settings Administrator; Business Date Manager |
| settings.audit.view | View configuration history | Platform Settings Administrator; Settings Viewer; Runtime Controls Manager; Business Date Manager |
| settings.diagnostics.view | View read-only system diagnostics | Platform Settings Administrator; Settings Viewer |
| operations.process.view | View scheduled processes and run history | Operations Analyst; Financial Operations Reviewer; Operations Supervisor |
| operations.process.run | Execute prototype lifecycle processes | Financial Operations Reviewer; Operations Supervisor |
| operations.process.retry | Retry failed prototype lifecycle runs | Operations Supervisor |
| reports.platform.view | View platform overview and growth reports | Operations Supervisor; Platform Settings Administrator; Settings Viewer |
| reports.operations.view | View Operations oversight reports | Operations Analyst; Verification Reviewer; Financial Operations Reviewer; Operations Supervisor |
| reports.financial.view | View platform financial reports | Financial Operations Reviewer; Operations Supervisor |
| reports.access_audit.view | View Access Audit reports | Access Administrator |
| reports.security.view | View prototype security reports | Access Administrator |
| security.overview.view | View security overview | Access Administrator |
| security.sessions.view | View simulated sessions | Access Administrator |
| security.sessions.revoke | Revoke simulated sessions | Access Administrator |
| security.events.view | View security events | Access Administrator |
| security.accounts.locked.view | View locked internal accounts | Access Administrator |
| security.accounts.unlock | Unlock internal accounts | Access Administrator |
| operations.case.view | View cases | Operations Analyst; Verification Reviewer; Financial Operations Reviewer; Operations Supervisor |
| operations.case.assign | Assign and triage cases | Operations Analyst; Verification Reviewer; Financial Operations Reviewer; Operations Supervisor |
| operations.case.note | Add internal notes | Operations Analyst; Verification Reviewer; Financial Operations Reviewer; Operations Supervisor |
| operations.case.escalate | Escalate cases | Operations Analyst; Verification Reviewer; Financial Operations Reviewer; Operations Supervisor |
| clients.verification.review | Review verification | Verification Reviewer; Operations Supervisor |
| clients.verification.approve | Approve verification | Verification Reviewer; Operations Supervisor |
| clients.verification.reject | Reject verification | Verification Reviewer; Operations Supervisor |
| clients.verification.request_information | Request verification information | Verification Reviewer; Operations Supervisor |
| organizations.application.review | Review applications | Verification Reviewer; Operations Supervisor |
| organizations.application.approve | Approve applications | Verification Reviewer; Operations Supervisor |
| organizations.application.reject | Reject applications | Verification Reviewer; Operations Supervisor |
| organizations.application.request_information | Request application information | Verification Reviewer; Operations Supervisor |
| organizations.settlement_account.review | Review settlement account changes | Financial Operations Reviewer; Operations Supervisor |
| payments.manual_contribution.review | Review manual contributions | Financial Operations Reviewer; Operations Supervisor |
| payments.exception.review | Review payment exceptions | Financial Operations Reviewer; Operations Supervisor |
| payments.reconciliation.correct | Correct reconciliation | Financial Operations Reviewer; Operations Supervisor |
| revenue_share.confirm | Confirm TCS Revenue Share receipt | Financial Operations Reviewer; Operations Supervisor |
| thrift.amendment.review | Decide Cycle amendments | Operations Supervisor |
| thrift.force_close.recommend | Recommend lifecycle intervention | Operations Analyst; Financial Operations Reviewer; Operations Supervisor |
| thrift.force_close.approve | Approve Force Close | Operations Supervisor |
| thrift.termination.review | Decide Group termination | Operations Supervisor |
| disputes.review | Investigate financial disputes and recovery | Financial Operations Reviewer; Operations Supervisor |
| disputes.decide | Decide evidenced payout outcomes | Financial Operations Reviewer; Operations Supervisor |
| disputes.appeal_review | Decide independent appeals | Financial Operations Reviewer; Operations Supervisor |
| cases.exceptional_reopen | Exceptionally reopen disputes | Operations Supervisor |
| restrictions.member.apply | Apply or release Member restrictions | Operations Supervisor |
| restrictions.organization.apply | Apply or release Organization restrictions | Operations Supervisor |
| access.users.view | View internal users | Access Administrator |
| access.users.maintain | Maintain internal users | Access Administrator |
| access.roles.view | View roles and permission catalogue | Access Administrator |
| access.roles.maintain | Maintain roles and permissions | Access Administrator |
| access.assignments.maintain | Maintain user role assignments | Access Administrator |

## Separation and sensitive actions

- Access Administrator has Access/Security capabilities, not Operations or Settings. There is no distinct seeded Security Administrator role; security authority is expressed by exact security.* permissions (granted to the baseline Access Administrator). Production may assign approved permission sets without inventing broader powers.
- Financial reviewer can run processes, but cannot retry by default; Operations Supervisor includes retry. Analyst can view only. Business Date manager cannot execute processes.
- Role/assignment editing must reject direct or indirect self-escalation, stale previews and removal of the last effective Access Administrator. Current authority is rechecked at commit.
- Appeals reject the original deciding reviewer. Force Close requires its specific recommendation/approval and source eligibility. Financial corrections retain original facts.
- Internal Business Date report requires reports.platform.view, settings.view, settings.audit.view and settings.business_date.view; Runtime history omits only the last gate. Process history requires reports.operations.view and operations.process.view.
- Audit stores actual actor, role/permission snapshot, reason and before/after. Later role changes do not rewrite historical authority.

Sources: src/access/model.ts, authorization.ts, service.ts, preview.ts, security.ts; src/operations decisions/interventions; src/reports/internalService.ts.

