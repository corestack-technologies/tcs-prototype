import { seedSession } from '../src/access/seeds.ts'
import test from "node:test"
import assert from "node:assert/strict"
import fs from "node:fs"
import { seedPersona } from "../src/clients/seeds.ts"
import { seedOrganization } from "../src/organizations/seeds.ts"
import { payoutDemo } from "../src/payouts/seeds.ts"
import { payoutTransition } from "../src/payouts/service.ts"
import {
  reconcile,
  financialClearance,
  groupFinancialBlockers,
} from "../src/reconciliation/service.ts"
import {
  emptyReconciliation,
  demoFinancePolicy,
} from "../src/reconciliation/model.ts"
import {
  corestackAccount,
  recordRevenuePayment,
  confirmRevenuePayment,
} from "../src/reconciliation/revenue.ts"
const org = seedOrganization(seedPersona("verified"), "active"),
  owner = org.ownerMemberId
const reviewer = seedSession('finance-reviewer')
function fixture(scenario = "Member confirmed") {
  const g = payoutDemo(org, "revenue-test", scenario),
    at = g.payouts.referenceAt
  return {
    g,
    at,
    s: reconcile(
      { ...emptyReconciliation(org.id), policy: demoFinancePolicy() },
      [g],
      org,
      at,
    ),
  }
}
const input = (r, at) => ({
  amountMinor: r.amountMinor,
  bankChargeMinor: 5000,
  transferredAt: at,
  bankName: "Organization bank",
  bankReference: "BANK-REVENUE-001",
  evidence: { name: "receipt.txt", type: "text/plain", size: 40 },
})
test("Constitution v0.3 contains the manual rail without changing fee protection or penalty waiver", () => {
  const text = fs.readFileSync(
    "doc/constitution/TCS_Product_Constitution_MVP_Baseline_v0.3.md",
    "utf8",
  )
  assert.ok(text.includes("MVP Baseline v0.3"))
  assert.ok(text.includes("### 12.8 TCS Revenue Share Payment"))
  assert.ok(
    text.includes(
      "The Organization may reduce or fully waive accrued penalties where permitted, with full audit.",
    ),
  )
  assert.ok(
    text.includes(
      "the agreed Organization Fee is not subject to individual Organizer reduction or waiver in MVP",
    ),
  )
  assert.ok(
    text.includes("Only an authorized TCS internal user may confirm receipt"),
  )
  assert.equal(
    (text.match(/### 12.8 TCS Revenue Share Payment/g) || []).length,
    1,
  )
  assert.ok(!text.includes("If Organization fee is waived to zero"))
})
test("recorded but uncompleted Member payout does not yet create TCS share Due", () => {
  const { s } = fixture("Transfer awaiting confirmation")
  assert.equal(s.receivables.length, 0)
})
test("completion creates the exact share once with stable reference and account", () => {
  const { g, s, at } = fixture(),
    r = s.receivables[0]
  assert.equal(r.organizationFeeMinor, 800000)
  assert.equal(r.amountMinor, 80000)
  assert.equal(r.sharePercent, 10)
  assert.equal(r.paymentStatus, "not-recorded")
  assert.equal(r.status, "due")
  assert.deepEqual(r.account, corestackAccount())
  assert.deepEqual(reconcile(s, [g], org, at), s)
  assert.ok(r.history[0].action.includes("unique payment reference"))
})
test("Organization records transfer without settling or reducing amount for bank charges", () => {
  const { g, s, at } = fixture(),
    r = s.receivables[0],
    next = recordRevenuePayment(s, org, owner, r.id, input(r, at), at),
    row = next.receivables[0]
  assert.equal(row.amountMinor, 80000)
  assert.equal(row.payments[0].bankChargeMinor, 5000)
  assert.equal(row.status, "due")
  assert.equal(row.paymentStatus, "awaiting-confirmation")
  assert.equal(row.settlement, undefined)
  assert.equal(financialClearance(next, [g]).awaitingTcs, 1)
  assert.equal(financialClearance(next, [g]).unpaidTcs, 1)
  assert.equal(s.receivables[0].payments.length, 0)
})
test("only authorized TCS confirmation settles the recorded exact payment", () => {
  const { g, s, at } = fixture(),
    r = s.receivables[0],
    recorded = recordRevenuePayment(s, org, owner, r.id, input(r, at), at),
    p = recorded.receivables[0].payments[0]
  assert.throws(
    () =>
      confirmRevenuePayment(
        recorded,
        org.id,
        r.id,
        p.id,
        { id: owner, kind: "organization", permissions: reviewer.permissions },
        at,
      ),
    /Authorized TCS/,
  )
  assert.throws(
    () =>
      confirmRevenuePayment(
        recorded,
        org.id,
        r.id,
        p.id,
        seedSession('access-admin'),
        at,
      ),
    /Authorized TCS/,
  )
  const settled = confirmRevenuePayment(
    recorded,
    org.id,
    r.id,
    p.id,
    reviewer,
    at,
  )
  assert.equal(settled.receivables[0].status, "settled")
  assert.equal(settled.receivables[0].payments[0].confirmedBy, reviewer.personaId)
  assert.equal(financialClearance(settled, [g]).unpaidTcs, 0)
  assert.deepEqual(
    confirmRevenuePayment(settled, org.id, r.id, p.id, reviewer, at),
    settled,
  )
  assert.ok(
    settled.receivables[0].history.some(
      (h) => h.before === "awaiting-confirmation" && h.after === "settled",
    ),
  )
})
test("TCS cannot confirm receipt without an Organization-recorded payment", () => {
  const { s, at } = fixture(),
    r = s.receivables[0]
  assert.throws(
    () => confirmRevenuePayment(s, org.id, r.id, "missing", reviewer, at),
    /recorded payment/,
  )
})
test("lower and higher recorded amounts remain payment exceptions", () => {
  for (const difference of [-100, 100]) {
    const { g, s, at } = fixture(),
      r = s.receivables[0],
      next = recordRevenuePayment(
        s,
        org,
        owner,
        r.id,
        { ...input(r, at), amountMinor: r.amountMinor + difference },
        at,
      ),
      row = next.receivables[0]
    assert.equal(row.paymentStatus, "exception")
    assert.equal(row.payments[0].amountMinor, r.amountMinor + difference)
    assert.equal(row.amountMinor, r.amountMinor)
    assert.equal(next.cases.at(-1).kind, "revenue-share")
    assert.throws(
      () =>
        confirmRevenuePayment(
          next,
          org.id,
          r.id,
          row.payments[0].id,
          reviewer,
          at,
        ),
      /amount exceptions/,
    )
    assert.ok(groupFinancialBlockers(next, g) > 0)
  }
})
test("partial payout creates only completed installment share and cumulative share remains exact", () => {
  const partial = fixture("Partial payout"),
    full = fixture("Final installment")
  assert.equal(partial.s.receivables.length, 1)
  assert.ok(partial.s.receivables[0].amountMinor < 80000)
  assert.equal(
    full.s.receivables.reduce((sum, r) => sum + r.amountMinor, 0),
    80000,
  )
  assert.equal(
    new Set(full.s.receivables.map((r) => r.paymentReference)).size,
    2,
  )
})
test("overdue and restriction timing begins at installment completion and persists while awaiting TCS", () => {
  const { g, at } = fixture("Transfer awaiting confirmation"),
    p = g.payouts.records[0],
    completedAt = new Date(Date.parse(at) + 3600000).toISOString()
  const completed = payoutTransition(
    g,
    org.id,
    owner,
    owner,
    {
      type: "confirm",
      payoutId: p.id,
      installmentId: p.installments[0].id,
      acknowledged: true,
    },
    completedAt,
    g.payouts.demoBanks,
  )
  let s = reconcile(
      { ...emptyReconciliation(org.id), policy: demoFinancePolicy() },
      [completed],
      org,
      completedAt,
    ),
    r = s.receivables[0]
  assert.equal(r.dueAt, completedAt)
  assert.equal(Date.parse(r.overdueAt) - Date.parse(completedAt), 72 * 3600000)
  const later = new Date(Date.parse(completedAt) + 169 * 3600000).toISOString()
  s = reconcile(s, [completed], org, later)
  s = recordRevenuePayment(s, org, owner, r.id, input(r, later), later)
  assert.equal(s.receivables[0].status, "restricted")
  assert.ok(financialClearance(s, [completed]).restricted)
  const confirmed = confirmRevenuePayment(
    s,
    org.id,
    r.id,
    s.receivables[0].payments[0].id,
    reviewer,
    later,
  )
  assert.equal(financialClearance(confirmed, [completed]).restricted, false)
  assert.ok(
    confirmed.receivables[0].history.some((h) => h.after === "restricted"),
  )
})
test("receiving-account changes preserve existing obligation and recorded payment snapshots", () => {
  const { g, s, at } = fixture(),
    r = s.receivables[0],
    recorded = recordRevenuePayment(s, org, owner, r.id, input(r, at), at)
  recorded.revenueAccount = {
    ...corestackAccount(),
    id: "new-config",
    accountNumber: "DEMO-TCS-002",
  }
  const next = reconcile(recorded, [g], org, at)
  assert.equal(next.receivables[0].account.accountNumber, "DEMO-TCS-001")
  assert.equal(
    next.receivables[0].payments[0].account.accountNumber,
    "DEMO-TCS-001",
  )
  const other = payoutDemo(org, "another-completed", "Member confirmed"),
    all = reconcile(next, [g, other], org, at)
  assert.equal(all.receivables[1].account.accountNumber, "DEMO-TCS-002")
  assert.notEqual(
    all.receivables[0].paymentReference,
    all.receivables[1].paymentReference,
  )
})
test("tenant, actor, duplicate and timestamp controls protect recorded transfers", () => {
  const { s, at } = fixture(),
    r = s.receivables[0]
  assert.throws(
    () => recordRevenuePayment(s, org, "other-member", r.id, input(r, at), at),
    /owning Organization/,
  )
  assert.throws(
    () =>
      recordRevenuePayment(
        s,
        { ...org, id: "foreign" },
        owner,
        r.id,
        input(r, at),
        at,
      ),
    /owning Organization/,
  )
  assert.throws(
    () =>
      recordRevenuePayment(
        s,
        org,
        owner,
        r.id,
        { ...input(r, at), transferredAt: "2000-01-01T00:00:00Z" },
        at,
      ),
    /date/,
  )
  const recorded = recordRevenuePayment(s, org, owner, r.id, input(r, at), at)
  assert.throws(
    () => recordRevenuePayment(recorded, org, owner, r.id, input(r, at), at),
    /already recorded/,
  )
  assert.throws(
    () =>
      confirmRevenuePayment(
        recorded,
        "foreign",
        r.id,
        recorded.receivables[0].payments[0].id,
        reviewer,
        at,
      ),
    /Authorized/,
  )
})
