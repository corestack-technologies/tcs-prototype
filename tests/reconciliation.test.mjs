import test from "node:test"
import assert from "node:assert/strict"
import { seedPersona } from "../src/clients/seeds.ts"
import { seedOrganization } from "../src/organizations/seeds.ts"
import {
  cycleOf,
  configurationErrors,
  exampleFeeBoundary,
  readiness,
  transition,
} from "../src/groups/model.ts"
import { balances, collection } from "../src/rounds/model.ts"
import { advanceReference } from "../src/rounds/service.ts"
import { paymentDemo } from "../src/payments/seeds.ts"
import { payoutDemo } from "../src/payouts/seeds.ts"
import { payoutReady, payoutTotals } from "../src/payouts/math.ts"
import { paymentClearance, startAttempt } from "../src/payments/service.ts"
import {
  emptyReconciliation,
  demoFinancePolicy,
} from "../src/reconciliation/model.ts"
import {
  reconcile,
  receiveSettlement,
  receivePayment,
  financialClearance,

} from "../src/reconciliation/service.ts"
import { recordManual } from "../src/reconciliation/manual.ts"
import {
  reconciliationDemo,
  RECONCILIATION_DEMOS,
  settlementFor,
} from "../src/reconciliation/seeds.ts"
const org = seedOrganization(seedPersona("verified"), "active"),
  member = org.ownerMemberId
const ready = () =>
  paymentDemo(org, "recon-ready", "Optional contribution skipped / ready")
const clock = (g) => g.payouts?.referenceAt || cycleOf(g).active.referenceAt
const state = () => ({
  ...emptyReconciliation(org.id),
  policy: demoFinancePolicy(),
})
test("normal pending settlement preserves contribution, allocation, timeliness and payout readiness", () => {
  const g = ready(),
    before = structuredClone(g),
    s = reconcile(state(), [g], org, clock(g)),
    c = cycleOf(g),
    r = c.active.rounds[0]
  assert.ok(s.expectations.every((e) => e.status === "pending"))
  assert.equal(financialClearance(s, [g]).cases, 0)
  assert.equal(paymentClearance([g]), 0)
  assert.equal(collection(r, c.active).collected, 30000000)
  assert.ok(payoutReady(g, c, r))
  assert.deepEqual(g, before)
})
test("provider fees never reduce Member obligations or the Round payout base", () => {
  const g = ready(),
    before = structuredClone(g),
    event = settlementFor(org, [g], "batch", clock(g)),
    s = receiveSettlement(state(), [g], org, event, clock(g))
  assert.equal(event.grossMinor, 30000000)
  assert.equal(event.processingFeeMinor, 450000)
  assert.equal(event.netMinor, 29550000)
  assert.equal(s.settlements[0].status, "matched")
  assert.ok(s.expectations.every((e) => e.status === "settled"))
  assert.deepEqual(g, before)
  assert.equal(
    collection(cycleOf(g).active.rounds[0], cycleOf(g).active).collected,
    30000000,
  )
})
test("one settlement matches many payments across Groups in one Organization", () => {
  const a = ready(),
    b = paymentDemo(
      org,
      "other-group",
      "Optional contribution skipped / ready",
    ),
    event = settlementFor(org, [a, b], "multi", clock(a)),
    s = receiveSettlement(state(), [a, b], org, event, clock(a))
  assert.equal(s.settlements.length, 1)
  assert.equal(s.settlements[0].matchedTransactionIds.length, 8)
  assert.equal(s.settlements[0].grossMinor, 60000000)
})
test("duplicate settlement delivery is idempotent and conflicting delivery retains a case", () => {
  const g = ready(),
    at = clock(g),
    event = settlementFor(org, [g], "same", at),
    s = receiveSettlement(state(), [g], org, event, at)
  assert.deepEqual(receiveSettlement(s, [g], org, event, at), s)
  const conflict = receiveSettlement(
    s,
    [g],
    org,
    { ...event, netMinor: event.netMinor + 1 },
    at,
  )
  assert.equal(conflict.settlements.length, 1)
  assert.equal(conflict.settlements[0].netMinor, event.netMinor)
  assert.ok(conflict.cases.some((c) => c.kind === "duplicate"))
})
test("settlement variance and unexpected provider fee retain original transactions", () => {
  const g = ready(),
    at = clock(g),
    before = structuredClone(g),
    event = settlementFor(org, [g], "variance", at)
  let s = receiveSettlement(
    state(),
    [g],
    org,
    { ...event, netMinor: event.netMinor - 100 },
    at,
  )
  assert.equal(s.settlements[0].status, "variance")
  assert.equal(s.settlements[0].varianceMinor, -100)
  assert.ok(s.cases.length)
  s = receiveSettlement(
    state(),
    [g],
    org,
    {
      ...event,
      processingFeeMinor: event.processingFeeMinor + 100,
      netMinor: event.netMinor - 100,
    },
    at,
  )
  assert.equal(s.settlements[0].status, "variance")
  assert.deepEqual(g, before)
})
test("unmatched settlement later matches automatically with classification history retained", () => {
  const g = ready(),
    at = clock(g),
    event = settlementFor(org, [g], "early-delivery", at)
  let s = receiveSettlement(state(), [], org, event, at)
  assert.equal(s.settlements[0].status, "unmatched")
  s = reconcile(s, [g], org, at)
  assert.equal(s.settlements[0].status, "matched")
  assert.equal(s.cases[0].status, "resolved")
  assert.deepEqual(
    s.settlements[0].history.map((h) => h.after),
    ["unmatched", "matched"],
  )
})
test("partial matching and settlement overcoverage cannot inflate settled value", () => {
  const g = ready(),
    at = clock(g),
    event = settlementFor(org, [g], "partial", at)
  event.lines[0].providerReference = "unknown"
  const s = receiveSettlement(state(), [g], org, event, at)
  assert.equal(s.settlements[0].status, "partially-matched")
  const duplicate = receiveSettlement(
    s,
    [g],
    org,
    settlementFor(org, [g], "overlap", at),
    at,
  )
  assert.equal(duplicate.settlements[1].status, "variance")
  assert.ok(
    duplicate.expectations.every((e) => e.matchedGrossMinor <= e.grossMinor),
  )
})
test("settlement snapshots survive subsequent Organization account changes", () => {
  const g = ready(),
    at = clock(g),
    event = settlementFor(org, [g], "account", at),
    s = receiveSettlement(state(), [g], org, event, at)
  const changed = {
    ...org,
    settlement: { ...org.settlement, accountNumber: "9999999999" },
  }
  assert.deepEqual(
    reconcile(s, [g], changed, at).settlements[0].destination,
    event.destination,
  )
})
test("delayed settlement creates a case without making the Member unpaid", () => {
  const g = ready(),
    at = new Date(Date.parse(clock(g)) + 49 * 3600000).toISOString(),
    s = reconcile(state(), [g], org, at)
  assert.ok(s.expectations.every((e) => e.status === "delayed"))
  assert.ok(financialClearance(s, [g]).cases)
  assert.ok(payoutReady(g, cycleOf(g), cycleOf(g).active.rounds[0]))
})
test("unmatched provider money is retained without guessing an allocation", () => {
  const g = ready(),
    at = clock(g),
    event = {
      provider: "demo",
      providerReference: "unknown-payment",
      attemptId: "unknown",
      organizationId: org.id,
      memberId: member,
      currency: "NGN",
      amountMinor: 7000000,
      confirmedAt: at,
      settlement: "pending",
    }
  const next = receivePayment(state(), [g], org, event, at)
  assert.equal(next.state.unmatchedPayments.length, 1)
  assert.equal(next.state.expectations.at(-1).grossMinor, 7000000)
  assert.equal(next.state.cases[0].kind, "unallocated")
  assert.deepEqual(next.groups, [g])
  assert.deepEqual(
    receivePayment(next.state, [g], org, event, at).state,
    next.state,
  )
})
test("repeated provider confirmation does not duplicate settlement expectations", () => {
  const g = ready(),
    at = clock(g),
    s = reconcile(state(), [g], org, at),
    t = g.payments.transactions[0]
  const next = receivePayment(s, [g], org, t, at)
  assert.deepEqual(next.state, s)
  assert.deepEqual(next.groups, [g])
  const conflicting = receivePayment(
    s,
    [g],
    org,
    { ...t, amountMinor: t.amountMinor + 100 },
    at,
  )
  assert.equal(conflicting.state.expectations.length, s.expectations.length)
  assert.ok(conflicting.state.cases.some((c) => c.kind === "duplicate"))
})
test("tenant boundaries reject foreign payments, settlements and group data", () => {
  const g = ready(),
    at = clock(g),
    event = settlementFor(org, [g], "tenant", at)
  assert.throws(
    () =>
      receiveSettlement(
        state(),
        [g],
        org,
        { ...event, organizationId: "foreign" },
        at,
      ),
    /Invalid/,
  )
  assert.throws(
    () => reconcile(state(), [{ ...g, organizationId: "foreign" }], org, at),
    /tenant/,
  )
  assert.throws(
    () =>
      receivePayment(
        state(),
        [g],
        org,
        { ...g.payments.transactions[0], organizationId: "foreign" },
        at,
      ),
    /Invalid/,
  )
})
test("amount mismatch preserves confirmed money; partial permission changes allocation only", () => {
  const disallowed = reconciliationDemo(org, "short", "Underpayment exception"),
    allowed = reconciliationDemo(
      org,
      "partial",
      "Partial contribution allowed",
    ),
    over = reconciliationDemo(org, "over", "Overpayment exception")
  assert.equal(disallowed.group.payments.transactions[0].status, "confirmed")
  assert.equal(disallowed.group.payments.transactions[0].allocatedMinor, 0)
  assert.ok(disallowed.state.cases.some((c) => c.kind === "amount-mismatch"))
  assert.ok(allowed.group.payments.transactions[0].allocatedMinor > 0)
  assert.ok(over.state.cases.some((c) => c.kind === "amount-mismatch"))
})
test("advance reservations remain held, open normally, and exits retain exception ownership", () => {
  const held = reconciliationDemo(org, "held", "Advance reservation"),
    g = held.group,
    t = g.payments.transactions.at(-1),
    c = cycleOf(g)
  assert.equal(t.holdReason, "awaiting-round-opening")
  assert.ok(!held.state.cases.some((c) => c.kind === "advance"))
  assert.ok(!c.active.obligations.some((o) => o.roundId === t.roundId))
  const opened = advanceReference(
    g,
    c.active.rounds.find((r) => r.id === t.roundId).schedule.opensAt,
  )
  assert.equal(
    opened.payments.transactions.at(-1).allocationStatus,
    "allocated",
  )
  const exited = reconciliationDemo(
    org,
    "exited",
    "Advance exception after exit",
  )
  assert.ok(
    exited.state.cases.some((c) => c.kind === "advance" && c.memberId === "c2"),
  )
  assert.equal(exited.group.payments.transactions.at(-1).allocatedMinor, 0)
})
test("late optional money has a distinct case and never adds payout due", () => {
  const { group: g, state: s } = reconciliationDemo(
    org,
    "late",
    "Late optional payment exception",
  )
  assert.ok(s.cases.some((c) => c.kind === "late-optional"))
  assert.equal(payoutTotals(g.payouts.records[0]).outstanding, 0)
  assert.equal(g.payments.transactions.at(-1).allocatedMinor, 0)
})
const manualInput = (g) => ({
  cycleId: cycleOf(g).id,
  roundId: cycleOf(g).active.rounds[0].id,
  memberId: "c2",
  amountMinor: 10000000,
  paidAt: clock(g),
  channel: "ordinary-bank-transfer",
  reference: "manual-ref",
  reason: "Direct Organization bank transfer",
  evidence: { name: "receipt.txt", type: "text/plain", size: 10 },
})
test("manual contribution is off by default and requires owning Organization authority", () => {
  const g = paymentDemo(org, "manual", "Awaiting contribution"),
    input = manualInput(g)
  assert.throws(
    () => recordManual(g, org, member, undefined, input, clock(g)),
    /not enabled/,
  )
  assert.throws(
    () =>
      recordManual(
        g,
        org,
        "c2",
        { ...demoFinancePolicy(), manual: "organization-confirmed" },
        input,
        clock(g),
      ),
    /Only/,
  )
})
test("permitted ordinary bank receipt allocates with an explicit manual source", () => {
  const g = paymentDemo(org, "manual", "Awaiting contribution"),
    next = recordManual(
      g,
      org,
      member,
      { ...demoFinancePolicy(), manual: "organization-confirmed" },
      manualInput(g),
      clock(g),
    )
  assert.equal(next.payments.transactions.length, 0)
  assert.equal(
    next.payments.allocations[0].source,
    "organization-confirmed-manual",
  )
  assert.equal(
    balances(cycleOf(next).active.obligations.find((o) => o.memberId === "c2"))
      .outstanding,
    0,
  )
  assert.equal(
    next.manualContributions[0].source,
    "organization-confirmed-manual",
  )
  assert.throws(
    () =>
      recordManual(
        next,
        org,
        member,
        { ...demoFinancePolicy(), manual: "organization-confirmed" },
        manualInput(g),
        clock(g),
      ),
    /already/,
  )
})
test("manual review policy and Owner-benefiting receipts require independent review", () => {
  const g = paymentDemo(org, "review", "Awaiting contribution"),
    input = manualInput(g)
  const review = recordManual(
    g,
    org,
    member,
    { ...demoFinancePolicy(), manual: "review-required" },
    input,
    clock(g),
  )
  const self = recordManual(
    g,
    org,
    member,
    { ...demoFinancePolicy(), manual: "organization-confirmed" },
    { ...input, memberId: member },
    clock(g),
  )
  assert.equal(review.manualContributions[0].allocatedMinor, 0)
  assert.equal(self.manualContributions[0].status, "review-required")
  assert.ok(
    reconcile(state(), [self], org, clock(g)).cases.some(
      (c) => c.kind === "manual",
    ),
  )
})
test("Organization Fee remains mandatory and revenue share follows partial payout recognition", () => {
  const partial = payoutDemo(org, "partial-fee", "Partial payout"),
    full = payoutDemo(org, "full-fee", "Final installment")
  const a = reconcile(state(), [partial], org, clock(partial)),
    b = reconcile(state(), [full], org, clock(full))
  assert.ok(a.receivables.reduce((s, r) => s + r.amountMinor, 0) < 80000)
  assert.equal(
    b.receivables.reduce((s, r) => s + r.amountMinor, 0),
    80000,
  )
  assert.equal(
    b.receivables.reduce((s, r) => s + r.organizationFeeMinor, 0),
    800000,
  )
  assert.ok(
    configurationErrors(
      { ...cycleOf(full).terms, feeEnabled: false },
      exampleFeeBoundary(),
    ).length,
  )
  const split = payoutDemo(
      org,
      "split",
      "Split beneficiaries / independent responses",
    ),
    s = reconcile(state(), [split], org, clock(split))
  assert.equal(
    s.receivables.reduce((sum, r) => sum + r.amountMinor, 0),
    100000,
  )
})
test("commercial restrictions affect new activation but preserve existing contribution flows", () => {
  const demo = reconciliationDemo(org, "restricted", "TCS share restricted"),
    restricted = {
      ...org,
      commercialRestricted: financialClearance(demo.state, [demo.group])
        .restricted,
    }
  assert.ok(restricted.commercialRestricted)
  assert.ok(demo.state.receivables.every((r) => r.status === "restricted"))
  assert.equal(
    readiness(demo.group, restricted, exampleFeeBoundary()).find(
      (r) => r.id === "organization",
    )?.status,
    "fail",
  )
  const g = paymentDemo(org, "existing", "Awaiting contribution"),
    c = cycleOf(g)
  assert.doesNotThrow(() =>
    startAttempt(
      g,
      org.id,
      org.form.name,
      member,
      { cycleId: c.id, roundId: c.active.rounds[0].id, includeOptional: false },
      clock(g),
    ),
  )
})
test("TCS receipt confirmation settles only an Organization-recorded payment", () => {
  const demo=reconciliationDemo(org,"recorded-confirmation","TCS share settled")
  const r=demo.state.receivables[0]
  assert.equal(r.status,"settled")
  assert.equal(r.payments[0].status,"confirmed")
  assert.equal(r.payments[0].confirmedBy,"finance-reviewer")
})
test("all reconciliation demos retain shared records and have stable reevaluation", () => {
  for (const scenario of RECONCILIATION_DEMOS) {
    const { group, state: s } = reconciliationDemo(
      org,
      "demo-" + scenario,
      scenario,
    )
    assert.deepEqual(reconcile(s, [group], org, s.referenceAt), s)
  }
})

import { roundDemo } from "../src/rounds/seeds.ts"
import { unresolved } from "../src/lifecycle/service.ts"
test("restriction blocks only first financial commencement, not existing Rounds",()=>{
  const upcoming=roundDemo(org,"not-commenced",exampleFeeBoundary(),"Monthly","Upcoming")
  upcoming.commercialCommencementRestricted=true
  assert.throws(()=>advanceReference(upcoming,cycleOf(upcoming).active.rounds[0].schedule.opensAt),/new financial commencement/)
  const active=ready();active.commercialCommencementRestricted=true
  assert.doesNotThrow(()=>advanceReference(active,cycleOf(active).active.rounds[1].schedule.opensAt))
})
test("partial settlement of one payment reconciles across distinct batches",()=>{
  const g=paymentDemo(org,"split-settlement","Exact contribution / settlement pending"),at=clock(g),t=g.payments.transactions[0]
  const whole=settlementFor(org,[g],"part-1",at)
  const half={...whole,grossMinor:t.amountMinor/2,processingFeeMinor:whole.processingFeeMinor/2,netMinor:whole.netMinor/2,lines:[{providerReference:t.providerReference,grossMinor:t.amountMinor/2}]}
  let s=receiveSettlement(state(),[g],org,half,at)
  assert.equal(s.expectations[0].status,"partial")
  s=receiveSettlement(s,[g],org,{...half,reference:"part-2"},at)
  assert.equal(s.expectations[0].status,"settled");assert.equal(s.expectations[0].matchedGrossMinor,t.amountMinor)
})
test("reconciled overdue settlement clears its case while preserving provider facts",()=>{
  const g=ready(),at=new Date(Date.parse(clock(g))+49*3600000).toISOString(),before=structuredClone(g.payments.transactions)
  let s=reconcile(state(),[g],org,at)
  assert.ok(s.cases.some(c=>c.status!=="resolved"))
  s=receiveSettlement(s,[g],org,settlementFor(org,[g],"late-settlement",at),at)
  assert.ok(s.cases.every(c=>c.status==="resolved"));assert.equal(financialClearance(s,[g]).cases,0);assert.deepEqual(g.payments.transactions,before)
  assert.equal(unresolved({...g,reconciliationBlockers:1}),true)
})
test("cash receipts retain manual identity and invalid money cannot be posted",()=>{
  const g=paymentDemo(org,"cash","Awaiting contribution"),policy={...demoFinancePolicy(),manual:"organization-confirmed"},input={...manualInput(g),channel:"cash"}
  const next=recordManual(g,org,member,policy,input,clock(g))
  assert.equal(next.manualContributions[0].channel,"cash");assert.equal(next.manualContributions[0].status,"allocated")
  assert.throws(()=>recordManual(g,org,member,policy,{...input,amountMinor:0.1},clock(g)),/integer kobo/)
  const readyGroup=ready(),event=settlementFor(org,[readyGroup],"invalid-money",clock(readyGroup))
  assert.throws(()=>receiveSettlement(state(),[readyGroup],org,{...event,processingFeeMinor:-1},clock(readyGroup)),/integer kobo/)
})

import { groupFinancialBlockers } from "../src/reconciliation/service.ts"
test("batch settlement exceptions flow into each affected Group clearance",()=>{
  const a=ready(),b=paymentDemo(org,"batch-other","Optional contribution skipped / ready"),at=clock(a),event=settlementFor(org,[a,b],"cross-group-variance",at)
  const s=receiveSettlement(state(),[a,b],org,{...event,netMinor:event.netMinor-100},at)
  assert.equal(groupFinancialBlockers(s,a),1);assert.equal(groupFinancialBlockers(s,b),1)
  assert.equal(groupFinancialBlockers(s,paymentDemo(org,"unrelated","Awaiting contribution")),0)
})
