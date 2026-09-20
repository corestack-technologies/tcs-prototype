import test from "node:test"
import assert from "node:assert/strict"
import { seedPersona } from "../src/clients/seeds.ts"
import { seedOrganization } from "../src/organizations/seeds.ts"
import { roundDemo } from "../src/rounds/seeds.ts"
import { cycleOf, exampleFeeBoundary } from "../src/groups/model.ts"
import { advanceReference } from "../src/rounds/service.ts"
import { balances, collection } from "../src/rounds/model.ts"
import {
  startAttempt,
  confirmPayment,
  checkAttempt,
  advanceRound,
} from "../src/payments/service.ts"
import { prototypeProvider } from "../src/payments/provider.ts"
import { paymentDemo, PAYMENT_DEMOS } from "../src/payments/seeds.ts"
import { lifecycleTransition } from "../src/lifecycle/service.ts"
const org = seedOrganization(seedPersona("verified"), "active"),
  member = org.ownerMemberId
const fresh = (id = "pay-test") =>
  roundDemo(org, id, exampleFeeBoundary(), "Monthly", "Open")
const start = (g, opts = {}, id = member) =>
  startAttempt(
    g,
    org.id,
    org.form.name,
    id,
    {
      cycleId: cycleOf(g).id,
      roundId: cycleOf(g).active.rounds[0].id,
      includeOptional: false,
      ...opts,
    },
    cycleOf(g).active.referenceAt,
  )
const confirm = (g, outcome = "success", changes = {}) => {
  const a = g.payments.attempts.at(-1),
    event = {
      ...prototypeProvider.confirmation(
        a,
        outcome,
        cycleOf(g).active.referenceAt,
      ),
      ...changes,
    }
  return confirmPayment(
    [g],
    org.id,
    event,
    changes.receivedAt || event.confirmedAt,
  )[0]
}
const own = (g, id = member, round = 0) =>
  cycleOf(g).active.obligations.find(
    (o) =>
      o.memberId === id && o.roundId === cycleOf(g).active.rounds[round].id,
  )
test("exact provider confirmation allocates same 3B obligation without Organization approval or settlement", () => {
  const before = fresh(),
    started = start(before)
  assert.equal(balances(own(started)).satisfied, 0)
  const g = confirm(started),
    t = g.payments.transactions[0]
  assert.equal(t.amountMinor, 10000000)
  assert.equal(t.settlement, "pending")
  assert.equal(t.allocationStatus, "allocated")
  assert.equal(balances(own(g)).outstanding, 0)
  assert.equal(
    collection(cycleOf(g).active.rounds[0], cycleOf(g).active).satisfied,
    10000000,
  )
  assert.equal(before.payments, undefined)
  assert.equal(balances(own(before)).satisfied, 0)
})
test("failed and expired attempts retain obligation and allow a distinct retry", () => {
  for (const outcome of ["failed", "expired"]) {
    let g = fresh(outcome)
    g = startAttempt(
      g,
      org.id,
      org.form.name,
      member,
      {
        cycleId: cycleOf(g).id,
        roundId: cycleOf(g).active.rounds[0].id,
        includeOptional: false,
      },
      cycleOf(g).active.referenceAt,
      outcome,
    )
    const a = g.payments.attempts[0]
    g = checkAttempt([g], org.id, member, a.id, a.createdAt)[0]
    g = checkAttempt([g], org.id, member, a.id, a.createdAt)[0]
    assert.equal(g.payments.attempts[0].status, outcome)
    assert.equal(g.payments.transactions.length, 0)
    assert.equal(balances(own(g)).satisfied, 0)
    g = start(g)
    assert.equal(g.payments.attempts.length, 2)
    assert.equal(g.payments.attempts[0].status, outcome)
  }
})
test("pending attempts do not satisfy contributions; repeated instruction clicks are stable", () => {
  let g = start(fresh()),
    a = g.payments.attempts[0]
  g = start(g)
  assert.equal(g.payments.attempts.length, 1)
  g = checkAttempt([g], org.id, member, a.id, a.createdAt)[0]
  assert.equal(g.payments.attempts[0].status, "provider-pending")
  assert.equal(balances(own(g)).satisfied, 0)
  g = checkAttempt([g], org.id, member, a.id, a.createdAt)[0]
  assert.equal(g.payments.attempts[0].status, "confirmed")
  assert.equal(g.payments.transactions.length, 1)
})
test("partial policy is explicit and multiple confirmed payments can satisfy one obligation", () => {
  const blocked = fresh()
  assert.throws(() => start(blocked, { amountMinor: 4000000 }))
  cycleOf(blocked).active.contributionPolicy = {
    partial: "allowed",
    advance: "unconfigured",
  }
  let g = confirm(start(blocked, { amountMinor: 4000000 }))
  assert.equal(balances(own(g)).outstanding, 6000000)
  assert.equal(balances(own(g)).fulfillment, "Partially satisfied")
  g = confirm(start(g))
  assert.equal(balances(own(g)).outstanding, 0)
  assert.equal(g.payments.transactions.length, 2)
  assert.equal(
    g.payments.allocations.reduce((s, a) => s + a.amountMinor, 0),
    10000000,
  )
})
test("underpayment disallowed and overpayment preserve confirmed money as wholly unallocated exceptions", () => {
  for (const outcome of ["underpayment", "overpayment"]) {
    const g = confirm(start(fresh(outcome)), outcome),
      t = g.payments.transactions[0]
    assert.equal(t.status, "confirmed")
    assert.equal(t.allocationStatus, "exception")
    assert.equal(t.allocatedMinor, 0)
    assert.equal(t.unallocatedMinor, t.amountMinor)
    assert.equal(balances(own(g)).satisfied, 0)
    assert.equal(g.payments.exceptions.length, 1)
    assert.equal(g.payments.attempts[0].status, "confirmed")
  }
})
test("duplicate provider reference is idempotent and conflicting payload cannot overwrite history", () => {
  const started = start(fresh()),
    event = prototypeProvider.confirmation(
      started.payments.attempts[0],
      "success",
      cycleOf(started).active.referenceAt,
    )
  const once = confirmPayment([started], org.id, event, event.confirmedAt),
    twice = confirmPayment(once, org.id, event, event.confirmedAt)
  assert.deepEqual(twice, once)
  assert.equal(twice[0].payments.transactions.length, 1)
  assert.throws(() =>
    confirmPayment(
      once,
      org.id,
      { ...event, amountMinor: event.amountMinor + 1 },
      event.confirmedAt,
    ),
  )
  assert.deepEqual(once, twice)
})
test("half, multiple and mixed required/optional allocations retain each component share", () => {
  const half = confirm(start(fresh("half"), {}, "c3"))
  assert.equal(half.payments.transactions[0].amountMinor, 5000000)
  assert.equal(own(half, "c3").components[0].fraction, 0.5)
  const mixed = confirm(start(fresh("mixed"), { includeOptional: true }))
  assert.equal(mixed.payments.transactions[0].amountMinor, 20000000)
  assert.equal(
    mixed.payments.allocations.filter((a) => a.kind === "required").length,
    1,
  )
  assert.equal(
    mixed.payments.allocations.filter((a) => a.kind === "optional").length,
    1,
  )
  assert.equal(balances(own(mixed)).optionalMade, 10000000)
  let multi = fresh("multi")
  multi = advanceReference(
    multi,
    cycleOf(multi).active.rounds[1].schedule.opensAt,
  )
  multi = confirm(start(multi, { roundId: cycleOf(multi).active.rounds[1].id }))
  assert.equal(multi.payments.transactions[0].amountMinor, 20000000)
  assert.equal(multi.payments.allocations.length, 2)
})
test("optional-only recipient has no debt and only an explicit voluntary choice is allocated", () => {
  let g = fresh()
  g = advanceReference(g, cycleOf(g).active.rounds[1].schedule.opensAt)
  const roundId = cycleOf(g).active.rounds[1].id
  assert.equal(balances(own(g, "c2", 1)).required, 0)
  assert.throws(() => start(g, { roundId }, "c2"))
  g = confirm(start(g, { roundId, includeOptional: true }, "c2"))
  assert.equal(g.payments.allocations[0].kind, "optional")
  assert.equal(g.payments.allocations[0].timeliness, "optional")
  assert.equal(balances(own(g, "c2", 1)).outstanding, 0)
})
test("optional amounts skipped do not block derived collection readiness", () => {
  const g = paymentDemo(org, "ready", "Optional contribution skipped / ready"),
    c = cycleOf(g),
    summary = collection(c.active.rounds[0], c.active)
  assert.equal(summary.ready, true)
  assert.equal(summary.optionalMade, 0)
  assert.equal(
    summary.collected,
    g.payments.transactions.reduce((s, t) => s + t.allocatedMinor, 0),
  )
  assert.equal(c.financial.payouts, 0)
})
test("timeliness uses provider success time despite late callback and settlement exception", () => {
  const started = start(fresh()),
    r = cycleOf(started).active.rounds[0],
    success = new Date(Date.parse(r.schedule.dueAt) - 120000).toISOString(),
    arrival = new Date(Date.parse(r.schedule.lateAt) + 300000).toISOString(),
    event = {
      ...prototypeProvider.confirmation(
        started.payments.attempts[0],
        "success",
        success,
      ),
      settlement: "exception",
    }
  const g = confirmPayment([started], org.id, event, arrival)[0]
  assert.equal(g.payments.allocations[0].timeliness, "on-time")
  assert.equal(g.payments.transactions[0].receivedAt, arrival)
  assert.equal(g.payments.transactions[0].confirmedAt, success)
  assert.equal(balances(own(g)).outstanding, 0)
})
test("collection accounts are stable per Member and Organization across Groups", () => {
  const a = prototypeProvider.collectionAccount(
      org.id,
      member,
      org.form.name,
      "Ada",
    ),
    b = prototypeProvider.collectionAccount(
      org.id,
      member,
      org.form.name,
      "Ada",
    ),
    other = prototypeProvider.collectionAccount(
      "other-org",
      member,
      "Other",
      "Ada",
    )
  assert.deepEqual(a, b)
  assert.notEqual(a.id, other.id)
  assert.notEqual(a.accountNumber, other.accountNumber)
  assert.equal(a.prototype, true)
  assert.match(a.accountNumber, /^DEMO-/)
  const first = start(fresh("one")),
    second = start(fresh("two"))
  assert.deepEqual(first.payments.accounts, second.payments.accounts)
})
test("tenant and Member boundaries reject cross-owner confirmations and payment checks", () => {
  const g = start(fresh()),
    a = g.payments.attempts[0],
    event = prototypeProvider.confirmation(a, "success", a.createdAt)
  assert.throws(() =>
    startAttempt(
      g,
      "another-org",
      "Another",
      member,
      { cycleId: a.cycleId, roundId: a.roundId, includeOptional: false },
      a.createdAt,
    ),
  )
  assert.throws(() => confirmPayment([g], "another-org", event, a.createdAt))
  assert.throws(() =>
    confirmPayment([g], org.id, { ...event, memberId: "c3" }, a.createdAt),
  )
  assert.throws(() => checkAttempt([g], org.id, "c3", a.id, a.createdAt))
})
test("advance reservation does not create future obligation early and applies exactly once at opening", () => {
  const held = paymentDemo(org, "advance", "Advance held until opening"),
    c = cycleOf(held),
    t = held.payments.transactions.at(-1)
  assert.equal(t.allocationStatus, "unallocated")
  assert.equal(t.holdReason, "awaiting-round-opening")
  assert.equal(t.unallocatedMinor, 20000000)
  assert.ok(!c.active.obligations.some((o) => o.roundId === t.roundId))
  assert.equal(c.financial.obligations, 4)
  const opened = advanceReference(held, c.active.rounds[1].schedule.opensAt),
    tx = opened.payments.transactions.at(-1)
  assert.equal(tx.allocationStatus, "allocated")
  assert.equal(tx.holdReason, undefined)
  assert.equal(balances(own(opened, member, 1)).outstanding, 0)
  assert.equal(opened.payments.transactions.length, 2)
  assert.deepEqual(
    advanceReference(opened, cycleOf(opened).active.referenceAt),
    opened,
  )
})
test("advance reservation becomes an exception after exit and never transfers to replacement", () => {
  const held = paymentDemo(org, "exit-advance", "Advance held until opening"),
    at = cycleOf(held).active.referenceAt
  let g = lifecycleTransition(
    held,
    member,
    member,
    {
      type: "request-exit",
      memberId: member,
      reason: "Relocation before payout",
    },
    at,
  )
  g = lifecycleTransition(
    g,
    member,
    member,
    { type: "approve-exit", id: g.lifecycle.exits[0].id },
    at,
  )
  const t = g.payments.transactions.at(-1)
  assert.equal(t.allocationStatus, "exception")
  assert.equal(t.allocatedMinor, 0)
  assert.equal(t.unallocatedMinor, 20000000)
  assert.equal(t.holdReason, undefined)
  const opened = advanceReference(
    g,
    cycleOf(g).active.rounds[1].schedule.opensAt,
  )
  assert.equal(opened.payments.transactions.at(-1).allocatedMinor, 0)
  assert.ok(!opened.payments.allocations.some((a) => a.transactionId === t.id))
})
test("advance permission is not silently enabled and does not commence a future Cycle", () => {
  const g = fresh()
  assert.equal(advanceRound(g, cycleOf(g).id, member), undefined)
  assert.throws(() => start(g, { advance: true }))
  const upcoming = roundDemo(
    org,
    "future",
    exampleFeeBoundary(),
    "Monthly",
    "Upcoming",
  )
  cycleOf(upcoming).active.contributionPolicy = {
    partial: "allowed",
    advance: "allowed",
  }
  assert.throws(() => start(upcoming, { advance: true }))
  assert.equal(cycleOf(upcoming).financial.obligations, 0)
})
test("late confirmation of an ended Cycle is retained without rewriting its historical obligations", () => {
  const g = start(fresh()),
    c = cycleOf(g)
  c.status = "completed"
  c.completedAt = c.active.referenceAt
  c.active.endedAt = c.active.referenceAt
  const old = structuredClone(c)
  const next = confirm(g)
  assert.deepEqual(cycleOf(next), old)
  assert.equal(next.payments.transactions[0].status, "confirmed")
  assert.equal(next.payments.transactions[0].allocationStatus, "exception")
  assert.equal(next.payments.transactions[0].allocatedMinor, 0)
})
test("all payment demos reconcile transactions, allocations and actual obligation fulfillment", () => {
  for (const scenario of PAYMENT_DEMOS) {
    const g = paymentDemo(org, "demo-" + scenario, scenario),
      p = g.payments,
      c = cycleOf(g)
    if (!p) continue
    assert.equal(
      p.transactions.reduce((s, t) => s + t.allocatedMinor, 0),
      p.allocations.reduce((s, a) => s + a.amountMinor, 0),
    )
    assert.equal(
      p.allocations.reduce((s, a) => s + a.amountMinor, 0),
      c.active.obligations.reduce((s, o) => s + balances(o).collected, 0),
    )
    assert.ok(
      p.transactions.every(
        (t) => t.amountMinor === t.allocatedMinor + t.unallocatedMinor,
      ),
    )
    assert.equal(c.financial.payouts, 0)
  }
})
import { parsePaymentAmount } from "../src/payments/model.ts"
import { paymentClearance } from "../src/payments/service.ts"
import { closureBlockers } from "../src/organizations/model.ts"
import { lifecycleDemo } from "../src/lifecycle/seeds.ts"
test("money inputs reject sub-kobo precision and unsafe values rather than rounding silently", () => {
  assert.equal(parsePaymentAmount("100000.01"), 10000001)
  assert.throws(() => parsePaymentAmount("1.001"))
  assert.throws(() => parsePaymentAmount("-1"))
  assert.throws(() => parsePaymentAmount("900719925474099100"))
})
test("replacement payment uses actual generated owner, retaining outgoing historical obligation identity", () => {
  let g = lifecycleDemo(
      org,
      "payment-replacement",
      "Replacement regularized / handover",
    ),
    c = cycleOf(g),
    old = own(g)
  old.components.find((p) => p.requiredMinor > 0).requiredSatisfiedMinor = 0
  const originalId = old.id,
    replacementId = g.lifecycle.replacements[0].incomingMemberId
  g = confirm(start(g))
  assert.equal(own(g).id, originalId)
  assert.equal(balances(own(g)).outstanding, 0)
  assert.throws(() => start(g, { roundId: c.active.rounds[1].id }))
  g = confirm(start(g, { roundId: c.active.rounds[1].id }, replacementId))
  assert.equal(g.payments.transactions.at(-1).memberId, replacementId)
  assert.ok(
    g.payments.allocations
      .filter((a) => a.transactionId === g.payments.transactions.at(-1).id)
      .every((a) => a.memberId === replacementId),
  )
})
test("unallocated money blocks clearance; normal pending settlement is tracked separately by 4C", () => {
  const pending = confirm(start(fresh("pending-clearance"))),
    settled = paymentDemo(org, "settled-clearance", "Settlement settled"),
    mismatch = confirm(start(fresh("exception-clearance")), "overpayment")
  assert.equal(paymentClearance([pending, settled, mismatch]), 1)
  assert.ok(
    closureBlockers({
      ...org,
      clearance: { ...org.clearance, paymentCases: 1 },
    }).some((s) => s.includes("Unallocated payments / advance reservations: 1")),
  )
})
