# Module 8B — Scheduled Processes, System Diagnostics & Settings Hardening

## Scope and entry points

- Operations → Scheduled Processes: `/operations/scheduled-processes`.
- Settings → System Diagnostics: `/settings/diagnostics` (read only).
- Internal Reports → Scheduled Process Run History: existing 7B report workspace.

Module 8A remains the configuration workspace. Business Date changes never invoke the process engine. The Settings success message and Business Date explanation point operators toward Scheduled Processes. No process execution button was added to Settings or Diagnostics. No generic process-failure cases are created.

## Catalogue and execution order

One code-defined umbrella process, `DAILY_LIFECYCLE_PROCESS`, coordinates the following steps in order. The catalogue records name, description, domain, financial effect, availability and retry safety; the workspace shows latest run status/time.

| Order | Step | Existing source service and effects |
| --- | --- | --- |
| 1 | ROUNDS_AND_OBLIGATIONS | `advanceReference`: every opened Round, original schedule obligations, effective amendments/handovers and eligible advance-reservation release. Due/grace/late eligibility remains the existing Round calculation. |
| 2 | PENALTY_ACCRUAL | `accruePenalties`: dated required principal, accepted daily rate, original day/component identity, no compounding. |
| 3 | PAYOUT_LIFECYCLE | `evaluatePayouts`: readiness records, configured confirmation/dispute/appeal/evidence windows, payout breach evaluation, installment completion and Round resolution. Original transfer evidence is preserved. |
| 4 | POST_PAYOUT_DEFAULT | `evaluatePostPayoutDefaults`: seven days after grace, recognized payout receipt, unpaid required principal, linked Recovery and retained default history. |
| 5 | FINANCIAL_RECONCILIATION | `reconcile`: reconciliation of existing provider facts, completed-installment Organization Fee/TCS share recognition and configured overdue/restriction windows. Existing clearance and Group restriction calculations are reused. |

The scheduler contains no fee/rate/default calculation. Payout evaluation passes its captured time explicitly into existing readiness calculations, so injected test clocks and retries do not accidentally consult the current global clock.

The approved financial regularization adds PENALTY_ACCRUAL after Round generation and POST_PAYOUT_DEFAULT after payout recognition, before financial reconciliation. Domain services apply the accepted 0-10 bps/day simple required-principal rate, daily catch-up and seven full calendar days after grace expiry for recognized payout recipients with unpaid required principal. Accrual identities prevent duplicates; dated principal allocations preserve historical daily bases. Audited reductions retain original accrual. Recovery payments remain payment-driven, principal first then penalty, and are never synthesized by the scheduler. Historical defaults and resolved cases remain retained. Cycle completion, exit approval and Recovery resolution remain explicit domain actions. Exit Settlement due/breach visibility continues through the existing source/report projections; there is no new exit enforcement policy.

## Time and scenario boundary

Every run captures BusinessClock's Business Date, mode, environment and effective business timestamp. Actual start/end and step timestamps use wall-clock time. REAL_TIME and CONTROLLED both work. Manual prototype runs are rejected in Production.

An environment Group is eligible only when it has active-source data and all retained Cycle clocks are explicitly ENVIRONMENT. Missing markers, SCENARIO markers and mixed-clock Groups remain excluded. Ordinary Cycle activation now initializes schedule/source state without generating obligations. Environment obligation generation occurs in Scheduled Processes, rather than unrelated Group actions; automatic payout evaluation on workspace rendering is disabled for environment Groups. Existing deterministic scenario controls retain their approved behavior.

Environment-only financial worlds are reconciled after successful Group steps. A world mixing scenario and environment Groups is not safely separable under the current shared reconciliation model: environment Group steps may complete, but financial evaluation is recorded as incomplete/failed, preserving scenario facts. Use an environment-only test dataset for full lifecycle validation. The UI never silently converts fixture clocks or resets financial history.

`businessTimestamp`, `referenceAt` and provider-confirmation time remain different concepts. The process does not query providers, create transactions, invent Recovery receipts or edit Access/security history. Timeouts record window expiry, never Member confirmation.

## Preview, execution, idempotency and catch-up

Manual execution requires exact permission, reason and confirmation. Preview lists captured date/mode/environment, deterministic step ordering, potential eligible Group count, excluded Group count, catch-up condition and warnings. Execution rechecks current actor, permissions, clock/configuration revision, run revision and source snapshot. An in-flight synchronous guard rejects overlapping invocations; it is not a distributed lock.

Each invocation receives a unique UUID. Same-date reruns are allowed. Domain service identity checks, generated Round IDs, installment status/finalization guards, advance-allocation identity and reconciliation identities prevent duplicate effects. Reference-clock-only updates do not count as financial changes. Counts represent per-step Group/financial-world evaluations; they are not unique Members, money or an obligation count.

Catch-up passes the target timestamp directly to existing domain services. `advanceReference` visits every scheduled opening through that time, including intermediate months. It does not jump directly to the final month or fabricate intermediate payments. Newly eligible data can process on the same business date.

## Failure and retry model

Steps record started/completed timestamps, evaluated/changed/skipped/failed counts, status, safe errors and notes. Domain services evaluate cloned individual records; each successful Group/world is committed independently. A later failure does not roll back earlier successful work. Failed Group prerequisites block dependent payout/financial evaluation; independent Groups continue. A partially failed run is never labeled completed.

Runs finish as COMPLETED, COMPLETED_WITH_NO_CHANGES, PARTIAL_FAILURE or FAILED. RUNNING is an internal synchronous execution state; the UI cannot observe a long-running job because no worker/scheduler exists. Final Run records, nested definition/actor/step snapshots and the history array are frozen. There are no edit/delete actions.

Retries require `operations.process.retry`, reason and confirmation; they do not implicitly require run authority. A retry creates a new Run linked by `retryOf` and retains the original business timestamp/mode/date, even if the environment date has advanced. Existing monotonic source guards may reject a retry that would move newer processed history backward. Original runs remain unchanged. Successful retry descendants clear their ancestor failure attention indicators without rewriting those records.

Expected source failures produce safe Group/Organization context and review guidance, never stack traces. The independent service exposes a controlled `beforeRecord` test hook for failure injection; no failure-injection or arbitrary-code UI is provided.

## Permissions and personas

Exact default-deny permissions:

- `operations.process.view`: catalogue and run history.
- `operations.process.run`: new manual invocations, also requiring view.
- `operations.process.retry`: failed/partial retries, also requiring view.
- `settings.diagnostics.view`: read-only diagnostics, also requiring `settings.view`.

Existing personas are reused: Ada/Operations Analyst is a process viewer; Chidi/Financial Operations Reviewer can run but cannot retry; Dami/Operations Supervisor can run and retry. Access Administrators, Settings Administrators, Business Date managers, Members and Organization Owners gain no process authority. Kemi/Settings Administrator and Lara/Settings Viewer receive diagnostic visibility only. Run/retry permissions join the existing sensitive-permission governance model.

Service boundaries recheck authority at execution, not only navigation visibility. Process reports require both `reports.operations.view` and `operations.process.view`. Diagnostics expose safe aggregate run summaries, not process reasons, actor authority snapshots or configuration secrets.

## Diagnostics and reports

Diagnostics show actual time, effective date/mode/environment, latest successful run, unresolved failed/partial attention, catch-up/opened-but-ungenerated Round count, protected/future history warnings and persistence/source-readiness information. They do not repair anything. No CPU, database, uptime or provider-health claims are made.

The 7B Scheduled Process Run History placeholder is replaced with `internal-process-runs`, using existing filters, report detail, CSV and print. Columns include Run ID/process, target Business Date, trigger, actor, actual start/end, status, evaluation counts and retry link. Filters include process, status, actor, actual date range, Business Date and failed-only. Summary run/status totals derive from the filtered rows. Configuration and process histories remain separate event sources. Existing configuration-report source permissions are preserved.

## Persistence and production handoff

All state is in-memory prototype state, consistent with Modules 1–8A. Full reload/reseed resets source data and process history together. There is no durable or cross-browser process persistence and no real automatic trigger. Do not persist a clock/run store alone while resetting its financial sources.

Future production implementation needs durable runs and step/record results; database transaction boundaries; database uniqueness/idempotency constraints; distributed concurrency protection; scheduler/orchestrator infrastructure; retry/backoff and dead-letter strategy; failure monitoring/alerting; tracing/metrics; authoritative environment-wide clock storage; deployment safety; and separate production execution privileges/approvals. None is implemented here.

## Validation

Validation results are recorded after the final checks below. The six pre-existing full-typecheck diagnostics remain outside scope: OrgApplicationQueue/Badge, OwnerPayouts/empty, CommunityDetail/communityId, DiscoverCommunities/Button, GroupTimeline/isPast, JoinRequestSubmitted/communityId. Production build retains the large-chunk warning. Browser discovery returned no connected browser; interactive visual QA is not claimed.

All work remains local. No commit, push, PR, backend work, live provider integration or final whole-prototype hardening was performed.

Final validation: 430/430 service tests passed, including 14 direct Module 8B tests. The 1,157 existing render scenarios and 25 new process/diagnostic/authority scenarios passed (1,182 total). Scoped Modules 1–8B/integration typecheck passed. Full typecheck reports only the six pre-existing unused-symbol diagnostics listed above. Production build passed with the existing bundle-size warning. GET requests to `/operations/scheduled-processes`, `/settings/diagnostics` and `/reports/internal` returned HTTP 200 on localhost port 8443. Interactive browser discovery returned “No browser is available”; automated render verification is not claimed as interactive visual QA.
