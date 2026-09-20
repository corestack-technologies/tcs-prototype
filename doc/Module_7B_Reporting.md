# Module 7B — Internal, Audit & Operational Reporting

## Completed scope

The internal Reports workspace is available at `/reports/internal` and through Internal navigation. It reuses the Module 7A report model, result rows, column/export metadata, filters, summary cards, row details, money formatting and report UI. Existing Member/Organization reporting remains intact and now also supports CSV, metric drill-down and basic printing.

Available internal reports:

- Platform Overview, Member / Organization Growth, Group / Cycle Activity.
- Financial Activity, TCS Revenue Share, Payment Exceptions, Reconciliation, Payout Exceptions / Breaches, Defaults & Recovery, Exit Settlement Breaches.
- Operations Cases, Disputes & Appeals, Material Internal Activity.
- Access Audit, Security Events.

Business Date Change History, Scheduled Process Run History and Runtime Control Change History are clearly planned/disabled. They have no fabricated records or executable controls. Module 8 is not implemented.

## Source and financial rules

Business records come from the existing Client, Organization, Group, payment, reconciliation and Operations providers. Reports do not create separate demo worlds. Existing source-workspace demo controls populate the same records used in reporting. Access and Security reports use the shared Module 6 state.

Financial projections reuse the approved 7A calculations, including principal-first/oldest-due Recovery allocation, stable ties, historical cleared rows, original debt age, excess exceptions, and case-level undated aggregate penalties. No payment transactions, postings, waivers or case resolutions are fabricated.

Financial Activity distinguishes contributions, payout execution, scheduled payout projections, Organization fees and posted TCS shares. These are different measures, not an additive pool of Corestack-owned funds. Original fee/share recognition and signed adjustment requirements remain separately visible; reports do not execute netting, credits or refunds. Missing values remain unavailable, with totals explicitly limited to known amounts.

Reconciliation preserves original provider gross, fees, deductions, net and variance. Full-transaction expectations can recur across partial settlements, so those contextual expectation columns are not totaled across settlement rows. Only the recorded settlement amounts are additive at settlement grain.

Growth uses recorded entity/history events; undated records are disclosed and excluded from date filters. Operations age reuses Module 5 source/reference clocks and resolution timestamps, without inventing SLA thresholds. The “My roles” filter uses shared Role membership of the current assignee because no separate organizational team model exists. Revenue aging preserves due/overdue/restricted/payment state and discloses missing timestamps.

## Permissions and privacy

Exact, default-deny reporting permissions:

| Permission | Baseline roles |
| --- | --- |
| `reports.platform.view` | Operations Supervisor |
| `reports.operations.view` | Operations Analyst, Verification Reviewer, Financial Operations Reviewer, Operations Supervisor |
| `reports.financial.view` | Financial Operations Reviewer, Operations Supervisor |
| `reports.access_audit.view` | Access Administrator |
| `reports.security.view` | Access Administrator |

Reporting-only roles work without acquiring source decision or queue authority. Access Administrator does not gain platform/financial visibility. Members and Organization Owners cannot invoke internal reports. Existing access self-escalation and Operations independence checks remain in force.

Route, generation and export entry points check live authorization. Role/permission removal, suspension, deactivation and locking deny reports immediately. Retained bound export functions read the current selected identity, including immediately after logout or identity changes. Source case links independently require `operations.case.view`; their target uses the existing controlled Operations workspace.

Projection allowlists exclude bank account details, KYC documents/NIN, review comments, private Operations notes and session secrets. Platform Cycle reports do not leak financial columns through hidden service fields. Material decisions preserve historical actor/authority snapshots; Access Audit is included in general activity only when separately permitted. Audit before/after text is a readable allowlist, never a raw object dump.

Security is explicitly simulated/prototype context. Linked Access Audit events are correlated rather than counted again as duplicate business actions; repeated security projections for the same Access Audit ID are deduplicated. Access and Security remain separate event streams.

## Exports and drill-down

- CSV is available for tabular Member, Organization and internal reports. The export regenerates the authorized report under current filters and current identity instead of trusting stale rendered data.
- Metadata includes report name, actual generated timestamp, actor, filters, row count, source reference dates and currency/units. Money exports as integer NGN minor units (kobo); the screen formats human-readable NGN.
- CSV includes only declared columns plus source kind/ID. It escapes quotes, commas and multiline values, preserves Unicode, and neutralizes spreadsheet formula prefixes in text cells.
- Summary cards select contributing source rows through the report service’s metric filter. All totals recompute from that same filtered dataset, and CSV uses the same metric/filter selection.
- Row details expose source references. Case rows can open the controlled Operations case when separately authorized. Reports contain no decision queue controls.
- Basic print styling and print-time authorization are provided. PDF/statement-grade output is not claimed.

## Validation results

- **405 domain tests passed:** 52 Module 7B tests, 100 Module 7A tests, 253 Modules 1–6 regressions.
- **1,045 render/route checks passed:** 33 internal reporting checks, 334 Module 7A checks and 678 existing workspace/route checks.
- Exact permissions, role-appropriate catalogues, anonymous/Member/Owner denial, inactive/locked denial, reporting-only roles, immediate revocation, retained export closure after logout, original audit snapshots, source privacy, filtered totals, metric drill-down and CSV round-trip/formula protection passed.
- Scoped typecheck (`node scripts/check-reports.mjs`) passed for reporting and Modules 1–6 integrations.
- Production build passed. JavaScript output is approximately 1,041 kB / 269 kB gzip; the pre-existing large-bundle advisory remains. No heavy export/BI dependencies or duplicated demo datasets were introduced.
- Localhost port 8443 returned HTTP 200 for `/reports/internal`, `/reports/member`, `/reports/organization` and the internal report source module.
- Full typecheck retains six unchanged TS6133 diagnostics outside this work: `Badge` in OrgApplicationQueue, `empty` in OwnerPayouts, `communityId` in CommunityDetail, `Button` in DiscoverCommunities, `isPast` in GroupTimeline, and `communityId` in JoinRequestSubmitted. No unrelated cleanup was performed.
- Render checks use React server rendering; interactive browser screenshots and printed/PDF visual fidelity are not claimed.

Commands: `npm run test:reports:internal`, `npm run test:reports:internal:render`, `npm run test:reports`, `npm run typecheck:reports`, `npm run build`.

No unresolved Module 7 product question remains. Source date/history gaps are disclosed as data limitations, and future system reports await their source modules. No commit, push, PR or remote changes were made. Work stops after Module 7B.
