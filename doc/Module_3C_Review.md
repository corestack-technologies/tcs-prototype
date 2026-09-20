# Module 3C — local review guide

Open **Organization → Groups → Lifecycle demo scenarios**, add a separate example, then use that Group's **Lifecycle / history** button. Active Cycle retains its Round and obligation views. **My Groups** opens Member-scoped lifecycle and retained history.

Implemented boundaries:

- Pre-commencement withdrawal returns the same Cycle to preparation, archives its activation snapshot, releases positions and preserves other Members' valid acceptances.
- Early Exit requires Organization approval before any received payout. Recognized actual contribution principal starts Exit Settlement Due; no automatic debt or penalty offsets.
- Approved exit creates an operational vacancy. Original snapshots and generated obligations remain untouched. Replacement requires Member consent and historical position regularization, then begins at the next eligible Round. Vacancies never reduce original scheduled payout value.
- Completion requires concluded Rounds and resolved rotation outcomes. Independent recovery, settlement and Organization cases can survive a fixed completion date. Penalty growth stops at Cycle end.
- Rollover and Start Fresh create new drafts under the same Group. Existing Module 3A acceptance/readiness remains authoritative. A configurable demo reconfirmation window has a deterministic deadline advance.
- Amendment and Force Close are requests with consent/review boundaries, not free edits or execution. Normal Group termination requires financial clearance; otherwise it remains pending review. History is retained.
- Open restricted recovery cases block new commitments across the in-memory Group worlds, exposing a generic eligibility result. Existing commitments continue. Only fully cleared recovery can be reviewed and resolved.

Financial fulfillment, received payouts, regularization and recovered amounts are explicitly seeded sample facts. The selector includes withdrawal, exit request, vacancy, pending/effective replacement, default/recovery, completion, rollover/fresh, amendment, Force Close, termination and Organization breach examples. No payment, allocation, payout, waiver or absorption execution is implemented.

Validation commands:

```text
npm run typecheck:clients
npm run typecheck:organizations
npm run typecheck:groups
npm run typecheck:rounds
npm run typecheck:lifecycle
node --experimental-strip-types --test tests/clients.test.mjs tests/organizations.test.mjs tests/groups.test.mjs tests/rounds.test.mjs tests/lifecycle.test.mjs
node scripts/check-rounds-render.mjs
node scripts/check-lifecycle-render.mjs
npm run build
```

All changes remain local and in memory. No backend persistence was introduced. Existing module work and demo data are retained. Browser interaction validation requires an attached browser; this session had none available.
