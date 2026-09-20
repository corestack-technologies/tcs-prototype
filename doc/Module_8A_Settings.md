# Module 8A — Platform Settings, Runtime Controls & Business Date

## Workspace and authorization

Open `/settings`, or select an explicitly authorized internal user and choose Settings. Platform contains Runtime Controls; Environment contains Business Date; History contains Configuration Changes. No operational work, Access Management settings, provider credentials, or scheduled-process execution was added.

Permissions are `settings.view`, `settings.runtime_controls.manage`, `settings.business_date.view`, `settings.business_date.manage`, and `settings.audit.view`. Service calls recheck active-user authority. Managing Business Date also requires its view permission. Preview confirmation revalidates actor, configuration revision, environment date and protected history. Settings privileges are sensitive permissions in Access Management, so existing self-escalation protection applies.

Seed users are Kemi (Settings administrator), Lara (read only), Musa (runtime manager), and Ngozi (Business Date manager). Their roles are deliberately separate from Operations and Access Administrator. Members and Organization Owners receive no Settings authority. Date history is withheld from runtime-only users.

## Time contract

`src/settings/service.ts` supplies `businessClock`, `actualTimestamp` and `businessTimestamp`. The calendar is Africa/Lagos. REAL_TIME follows the actual calendar, including midnight rollover; CONTROLLED resolves to the selected date at midnight in that timezone. Production always resolves REAL_TIME and rejects date mutations.

One module-level settings state is shared by every workspace and persona in the running prototype. It is not keyed by user, Organization, Group or session. Like the approved Modules 1–7 stores, it is in-memory: a full reload/reseed starts a fresh dataset. This simulates environment scope; cross-browser/server persistence remains future production/UAT implementation, not infrastructure built in 8A. Do not persist this clock alone across reloads while resetting its financial source dataset.

New normally activated Cycles explicitly use `timeSource: ENVIRONMENT`. Existing deterministic source/demo Cycles use SCENARIO semantics, including older records with an omitted marker. Their `referenceAt`, scenario provider timestamps, and scenario evaluation controls are preserved. Scenario time is not the environment Business Date. Ordinary Cycles cannot use the per-scenario reference-advance action to override environment time.

Round timing, grace/late eligibility, collection readiness, and obligation aging projections consume effective environment time for environment Cycles. Explicit normal business actions pass environment time into existing lifecycle/round/payout services. Existing source processing remains explicit; changing Settings neither runs a scheduler nor generates obligations, penalties or payout postings. Financial balances remain source facts rather than hypothetical postings.

Login/security/session/Access audit code is unchanged. Configuration audit and report generation use actual timestamps. Ordinary payment attempt/provider-check timestamps use actual time; deterministic demo provider timestamps remain explicit scenario inputs. Provider event confirmation/receipt times are never rewritten by Business Date changes.

## Date safety and history

The service supports enable controlled, forward advancement, and reset to REAL_TIME. Valid date, reason, permission, preview and explicit confirmation are required. Preview shows old/new mode and date, direction, reason, protected-through boundary and applicable future-record warning. Source changes or actor changes invalidate a pending preview.

The protected boundary is computed across all shared Organization worlds from financially active Cycles, obligation generation, payment/allocation records, payouts, lifecycle/recovery, manual contribution and reconciliation source history. Future schedule/due dates alone do not establish processed history. The scan is deliberately conservative for a Group that has financial history and includes retained significant history, including deterministic scenarios. A controlled date earlier than this boundary is rejected with reset/reseed guidance. Continued CONTROLLED mode advances forward only.

Reset to REAL_TIME preserves every source record and audit event, even if the calendar is behind protected history. It discloses future-record warnings. Existing service monotonicity guards can reject later processing against future source records; resetting the clock is not dataset repair. Reset/reseed the dataset for an earlier test scenario.

History is append-only through service mutations, with frozen events/arrays and no edit/delete actions. Records include actor ID/name, category, action/key, prior/new modes and dates or values, environment, reason and actual timestamp. Unified history supports category, actor, source action/control and actual-date filters.

## Runtime catalogue classification

The current prototype had no configurable runtime-control service. Read-only legacy inspection covered `tcs-frontend` report reference consumers and `thrift-core-system` runtime/control documentation and service definitions.

| Legacy key | Classification and 8A treatment |
| --- | --- |
| CLIENT_VERIFICATION_MODE | Meaningful typed contact-channel control: EMAIL, PHONE, BOTH. Default BOTH preserves approved behavior. Applies to future contact eligibility and contact-confirmation flow; does not change KYC decisions. |
| CLIENT_KYC_STATUS | Reference status catalogue, replaced by the approved typed KYC workflow; not administrator-editable runtime behavior. |
| REPORT_MODULES | Reference catalogue, replaced by the Module 7 code-defined implemented report catalogue. Not exposed as a mutable control. |
| REPORT_VISIBILITY_SCOPE | Reference catalogue, replaced by exact reporting permissions and Member/Organization/internal source isolation. Not a switch that can broaden tenant access. |
| Provider activation, credentials and broad legacy GCT parameters | Outside 8A; no providers/secrets or arbitrary keys exposed. Existing Group/Cycle policy snapshots and approved rules remain authoritative. |
| Demo/scenario reference clocks | Prototype-only tools; explicitly distinct from environment Business Date, retained for deterministic regressions. |

The one meaningful carried-forward runtime control has a defined key, label, description, enum type, allowed values, platform/environment scope, environment applicability, sensitivity and last-change information. No generic JSON, SQL, script, key creation or per-Organization override editor exists. A change immediately affects future eligibility evaluation and leaves previous verification history intact.

## Reports and validation

Business Date Change History and Runtime Control Change History are available through the existing 7B catalogue, filters, projection, CSV and print foundation. They require `reports.platform.view` plus Settings/source permissions. Scheduled Process Run History remains planned; there are no fabricated process rows.

Validation: 415 service tests passed across Modules 1–8A, including eight Settings/time tests. All 1,156 existing/new render checks passed, including nine Settings permission/route checks. Scoped Modules 1–8A/integration typecheck passed. Full typecheck retains six pre-existing unused-symbol diagnostics: OrgApplicationQueue/Badge, OwnerPayouts/empty, CommunityDetail/communityId, DiscoverCommunities/Button, GroupTimeline/isPast, JoinRequestSubmitted/communityId. Build passes with the existing large-chunk warning. Browser runtime discovery returned no connected browsers, so interactive visual QA is not claimed.

No commits, pushes, PRs, backend changes, provider integration, or Module 8B implementation were performed.

Localhost verification: `GET /settings` and `GET /reports/internal` both returned HTTP 200 on port 8443. Development server is available at http://localhost:8443/settings.
