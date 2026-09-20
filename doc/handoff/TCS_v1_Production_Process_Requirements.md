# TCS v1 Production Process Requirements

TCS Prototype v1 production handoff. Requirements describe the approved build contract, not infrastructure already delivered.

The prototype's DAILY_LIFECYCLE_PROCESS orchestrates existing rules. Its manual synchronous in-memory run is not a production scheduler. Preserve ordered steps: ROUNDS_AND_OBLIGATIONS → PENALTY_ACCRUAL → PAYOUT_LIFECYCLE → POST_PAYOUT_DEFAULT → FINANCIAL_RECONCILIATION.

1. Persist a durable run before work, with definition/version, target Business Date, actual start, trigger, actor/service authority, environment and reason. Persist per-step results and retry lineage. Production scheduling needs an explicit service identity; the prototype's MANUAL trigger is not a production scheduling implementation.
2. Use distributed concurrency control over the affected financial scope. A browser boolean is not a lock. Reject or serialize conflicting activations, receipts, configuration changes and overlapping runs. Lock duration/lease/recovery must tolerate process crashes.
3. Each domain effect has a durable idempotency key: Cycle/Round generation, transaction/allocation, component/day penalty, default debt scope and installment/share posting. A run ID alone is insufficient deduplication.
4. Commit each coherent financial aggregate change with its audit/outbox event atomically. Do not roll back a previously committed successful scope because another scope failed. Mark partial failure accurately and resume only safe remaining work.
5. Catch-up evaluates original schedule dates; preserve immutable posted days. Configuration and source revisions used in a preview must still hold on execution. Process services call domain rules, not duplicate financial formulas.
6. Retry needs explicit permission, bounded retry/backoff policy and a new run linked to the failed one. Preserve prior errors and successes. Permanent data errors require intervention; do not retry forever or hide them as no changes.
7. Monitor queue/run age, step failures, processing lag, duplicate conflicts and reconciliation variances. Correlate run → step → source record → audit. Alerts go to authorized operators with redacted context. Select operational SLAs during infrastructure design; do not treat demo elapsed age as an approved SLA.
8. Recover durable work after worker restart; test replay, overlapping workers, partial commit, provider duplicate delivery and backup restore. Keep business effects exactly-once in outcome through idempotency rather than claiming transport exactly-once delivery.
9. Business Date controls exist only in approved non-production environments. Production must enforce real-time mode on the server regardless of client input. Source history prevents invalid rewind; scenario-clock fixtures remain isolated from environment processing. Date changes never execute processes automatically.
10. Diagnostics is read-only and permission-controlled. It must distinguish missing sources, failures and warnings without exposing secrets or cross-scope data.

Acceptance: U21–U23 in the UAT catalogue. Sources: src/processes/model.ts/service.ts, src/settings/service.ts/history.ts and financial regularization services.

