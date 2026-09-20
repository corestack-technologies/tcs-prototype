# Module 4A — contribution payments and allocation

Open **Organization → Collections → Contribution payment demo scenarios**, add an example, then inspect its collection view or use **My Member contributions**. Existing Group cards and Active Cycle views link to Collections. Members also have a **Payments** navigation item. Historical gateway and confirmation routes now use the shared payment workspace.

Normal contribution flow:

1. The Member reviews required and optional components of the existing generated obligation.
2. Collection instructions create one awaiting-payment attempt. Repeated clicks reuse its pending instruction.
3. In the local adapter, the first confirmation check shows provider pending; the next supplies the deterministic outcome. Seeded pending, failed and expired outcomes remain distinct.
4. Successful confirmation records a transaction and automatically allocates eligible component balances. Organization approval and provider settlement are not prerequisites.
5. The same obligation balances drive the Member view, receipt, Organization collections and derived payout readiness.

The account model is a labelled Member-per-Organization prototype arrangement: stable account identity across that Organization's Groups, separate identity for another Organization. Displayed account numbers begin with `DEMO-` and are not real transfer instructions. Provider objects and behavior live behind `src/payments/provider.ts`. Production maps to Frontend → TCS Backend → licensed provider; no frontend secret, live API, account creation or backend simulation server was added.

Provider confirmation time determines timeliness. Callback receipt and settlement remain separate. Provider plus provider reference is idempotent across retained Groups; conflicting replays cannot overwrite prior facts. Allocations retain Member, Organization, Group, Cycle, Round and Position-component links.

Partial contributions require explicit policy. Disallowed underpayments and unexpected overpayments remain confirmed, wholly unallocated payment exceptions. Optional own-payout contributions require explicit Member choice and never become debt. Monetary inputs and allocations use integer kobo.

## Approved advance reservation rule

Advance-enabled Cycles must already have financially commenced. Earlier required obligations must be satisfied first. A confirmed advance is reserved against the earliest eligible future scheduled required contribution through its immutable instruction targets. Future Round obligations are **not** generated early. Normal Round opening generates the obligation, then applies the reservation automatically. An approved exit, changed ownership, ended Cycle or other allocation ineligibility preserves the money as an exception; it never silently follows a replacement Member or another Position.

The local demo provides advance-held and advance-released examples. Organization prototype inspection tools can move reference time to the next opening. Advance funds are separate from recognized contribution principal until actually allocated.

## Preserved financial history

Earlier Modules 3B/3C sample fulfillment remains intact. The payment history identifies earlier recognized contributions separately rather than inventing provider transactions for them. New payment demo totals reconcile directly to transactions and allocations. Unallocated funds and pending/exception settlement remain visible in Group/Organization financial-clearance boundaries.

The 19 payment scenarios cover awaiting, pending, exact success, failure, expiry, partial policy, under/overpayment, duplicate confirmation, required plus optional, optional skipped and readiness, half/multiple Positions, optional-only recipient, advance reservation/release, settlement states and delayed callback timeliness.

## Validation

```text
npm run typecheck:payments
npm run test:payments
node --experimental-strip-types --test tests/clients.test.mjs tests/organizations.test.mjs tests/groups.test.mjs tests/rounds.test.mjs tests/lifecycle.test.mjs tests/payments.test.mjs
node scripts/check-rounds-render.mjs
node scripts/check-lifecycle-render.mjs
node scripts/check-payments-render.mjs
npm run build
```

No payout execution, manual/offline recording, recovery payment, replacement regularization payment, exit settlement transfer, exception resolution queue or reconciliation workflow was added. Work remains local and in memory. Browser interaction checks require an attached browser; none was available in this session.
