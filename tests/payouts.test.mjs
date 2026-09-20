import test from "node:test"
import assert from "node:assert/strict"
import { seedPersona } from "../src/clients/seeds.ts"
import { seedOrganization } from "../src/organizations/seeds.ts"
import { paymentDemo } from "../src/payments/seeds.ts"
import { cycleOf } from "../src/groups/model.ts"
import { payoutTransition, evaluatePayouts } from "../src/payouts/service.ts"
import { payoutAmounts, payoutTotals } from "../src/payouts/math.ts"
const org = seedOrganization(seedPersona("verified"), "active"),
  member = org.ownerMemberId
const bank = {
    bankCode: "058",
    bankName: "GTBank",
    accountNumber: "0123456789",
    resolvedName: "Adaeze Okafor",
    status: "demo-confirmed",
    confirmedAt: "2099-09-01T00:00:00Z",
  },
  banks = { [member]: bank }
const policy = {
  source: "prototype-policy",
  confirmationHours: 48,
  disputeHours: 168,
  breachHours: 48,
  tcsSharePercent: 10,
}
const ready = () => {
  const g = paymentDemo(
    org,
    "payout-test",
    "Optional contribution skipped / ready",
  )
  return payoutTransition(
    g,
    org.id,
    member,
    member,
    { type: "policy", policy },
    cycleOf(g).active.referenceAt,
    banks,
  )
}
const record = (
  g,
  amount = payoutTotals(g.payouts.records[0]).net,
  extra = {},
) => {
  const p = g.payouts.records[0]
  return payoutTransition(
    g,
    org.id,
    member,
    member,
    {
      type: "record",
      payoutId: p.id,
      instructionId: p.instructions.at(-1).id,
      amountMinor: amount,
      transferredAt: g.payouts.referenceAt,
      reference: "BANK-" + (p.installments.length + 1),
      notes: "Transferred externally",
      partial: false,
      acknowledged: true,
      ...extra,
    },
    g.payouts.referenceAt,
    banks,
  )
}
const respond = (g, type = "confirm", actor = member, reason) => {
  const p = g.payouts.records[0],
    i = p.installments.at(-1)
  return payoutTransition(
    g,
    org.id,
    member,
    actor,
    { type, payoutId: p.id, installmentId: i.id, acknowledged: true, reason },
    g.payouts.referenceAt,
    banks,
  )
}
test("ready instruction preserves SPV separately from collected amount and fee", () => {
  const g = ready(),
    i = g.payouts.records[0].instructions[0]
  assert.equal(i.scheduledValueMinor, 40000000)
  assert.equal(i.actualRoundCollectionMinor, 30000000)
  assert.equal(i.feeMinor, 800000)
  assert.equal(i.netMinor, 29200000)
  assert.equal(i.bank.accountNumber, bank.accountNumber)
  const c = cycleOf(g)
  assert.equal(
    payoutAmounts(g, c, c.active.rounds[0], member).netMinor,
    29200000,
  )
})
test("Organization records external transfer but only beneficiary confirms receipt", () => {
  const g = record(ready()),
    p = g.payouts.records[0]
  assert.equal(p.status, "awaiting-confirmation")
  assert.equal(p.installments[0].confirmedBy, undefined)
  assert.throws(() => respond(g, "confirm", "different-owner"))
  const confirmed = respond(g)
  assert.equal(
    confirmed.payouts.records[0].status,
    "completed-member-confirmed",
  )
  assert.equal(confirmed.payouts.records[0].installments[0].confirmedBy, member)
  assert.ok(cycleOf(confirmed).active.resolvedRoundIds.includes(p.roundId))
})
test("timeout is distinct from Member confirmation and preserves post-timeout dispute rights", () => {
  const g = record(ready()),
    i = g.payouts.records[0].installments[0],
    expired = evaluatePayouts(g, i.confirmationDueAt, banks),
    p = expired.payouts.records[0]
  assert.equal(p.status, "completed-window-elapsed")
  assert.equal(p.installments[0].confirmedBy, undefined)
  assert.ok(p.installments[0].disputeClosesAt)
  const disputed = respond(
    expired,
    "dispute",
    member,
    "Transfer has not reached my account",
  )
  assert.equal(disputed.payouts.records[0].status, "disputed")
  assert.equal(disputed.payouts.records[0].disputes.length, 1)
  const final = evaluatePayouts(
    expired,
    p.installments[0].disputeClosesAt,
    banks,
  )
  assert.ok(final.payouts.records[0].finalizedAt)
  assert.throws(() =>
    respond(final, "dispute", member, "Payment was not received"),
  )
})
test("partial confirmation does not complete payout and cumulative fees reconcile exactly", () => {
  let g = ready(),
    net = payoutTotals(g.payouts.records[0]).net
  g = record(g, 10000000, {
    partial: true,
    partialReason: "Organization liquidity timing",
    completionPlan: "Complete balance after bank settlement",
    expectedCompletionAt: "2099-10-01T00:00:00Z",
    evidence: { name: "receipt.png", type: "image/png", size: 100 },
  })
  g = respond(g)
  assert.equal(g.payouts.records[0].status, "partially-paid")
  assert.equal(payoutTotals(g.payouts.records[0]).outstanding, net - 10000000)
  g = record(g, net - 10000000)
  g = respond(g)
  assert.equal(g.payouts.records[0].status, "completed-member-confirmed")
  assert.equal(payoutTotals(g.payouts.records[0]).recognizedFee, 800000)
  assert.equal(payoutTotals(g.payouts.records[0]).tcsShare, 80000)
})
test("bank change invalidates untransferred instruction and preserves recorded bank history", () => {
  const g = ready(),
    newBanks = { [member]: { ...bank, accountNumber: "9876543210" } },
    changed = evaluatePayouts(g, g.payouts.referenceAt, newBanks)
  assert.equal(changed.payouts.records[0].instructions[0].status, "stale")
  assert.equal(
    changed.payouts.records[0].instructions[0].bank.accountNumber,
    bank.accountNumber,
  )
  assert.throws(() =>
    payoutTransition(
      changed,
      org.id,
      member,
      member,
      {
        type: "record",
        payoutId: changed.payouts.records[0].id,
        instructionId: changed.payouts.records[0].instructions[0].id,
        amountMinor: 29200000,
        transferredAt: g.payouts.referenceAt,
        reference: "BANK",
        notes: "",
        partial: false,
        acknowledged: true,
      },
      g.payouts.referenceAt,
      newBanks,
    ),
  )
  const paid = record(g),
    history = structuredClone(paid.payouts.records[0].installments[0])
  assert.deepEqual(
    evaluatePayouts(paid, paid.payouts.referenceAt, newBanks).payouts.records[0]
      .installments[0],
    history,
  )
})
test("amount exceptions preserve transferred fact without enlarging entitlement or completing payout", () => {
  for (const amount of [10000000, 40000000]) {
    const g = record(ready(), amount),
      p = g.payouts.records[0]
    assert.equal(p.status, "exception")
    assert.equal(p.installments[0].amountMinor, amount)
    assert.equal(payoutTotals(p).net, 29200000)
    assert.equal(p.installments[0].feeRecognizedMinor, 0)
  }
})
test("Organization breach uses configurable target window and does not invent reimbursement", () => {
  const g = ready(),
    target = g.payouts.records[0].targetAt,
    late = new Date(Date.parse(target) + 49 * 3600000).toISOString(),
    next = evaluatePayouts(g, late, banks)
  assert.ok(next.payouts.records[0].breach)
  assert.equal(next.payouts.records[0].installments.length, 0)
  assert.equal(next.lifecycle.disputes[0].kind, "organization-payout-breach")
})

import { payoutDemo, PAYOUT_DEMOS } from "../src/payouts/seeds.ts"
import { lifecycleTransition } from "../src/lifecycle/service.ts"
import { percent, proportion } from "../src/payouts/math.ts"
test("payout completion blocks Early Exit while preserving remaining contribution obligations", () => {
  const g = respond(record(ready())),
    before = structuredClone(cycleOf(g).active.obligations)
  assert.throws(() =>
    lifecycleTransition(
      g,
      member,
      member,
      { type: "request-exit", memberId: member, reason: "Exit after payout" },
      g.payouts.referenceAt,
    ),
  )
  assert.deepEqual(cycleOf(g).active.obligations, before)
})
test("a dispute after timeout removes active rotation completion without rewriting transfer history", () => {
  const g = record(ready()),
    timeout = evaluatePayouts(
      g,
      g.payouts.records[0].installments[0].confirmationDueAt,
      banks,
    ),
    before = structuredClone(timeout.payouts.records[0].installments[0]),
    next = respond(timeout, "dispute", member, "Payment not received")
  assert.equal(
    next.payouts.records[0].installments[0].reference,
    before.reference,
  )
  assert.equal(
    next.payouts.records[0].installments[0].amountMinor,
    before.amountMinor,
  )
  assert.ok(
    !cycleOf(next).active.resolvedRoundIds.includes(
      next.payouts.records[0].roundId,
    ),
  )
  assert.equal(next.lifecycle.payoutFacts[0].status, "received-recorded")
})
test("unvalidated bank details prevent instruction and recording", () => {
  const g = paymentDemo(
      org,
      "no-bank",
      "Optional contribution skipped / ready",
    ),
    prepared = payoutTransition(
      g,
      org.id,
      member,
      member,
      { type: "policy", policy },
      cycleOf(g).active.referenceAt,
      {},
    )
  assert.equal(prepared.payouts.records[0].instructions.length, 0)
  assert.throws(() =>
    payoutTransition(
      prepared,
      org.id,
      member,
      member,
      { type: "refresh-instruction", payoutId: prepared.payouts.records[0].id },
      prepared.payouts.referenceAt,
      { [member]: { ...bank, status: "pending" } },
    ),
  )
})
test("controlled partial payout requires evidence, explanation and completion plan", () => {
  assert.throws(() => record(ready(), 10000000, { partial: true }))
  assert.throws(() =>
    record(ready(), 10000000, {
      partial: true,
      partialReason: "Liquidity",
      completionPlan: "Later",
      expectedCompletionAt: "2099-09-25T00:00:00Z",
    }),
  )
})
test("exact integer fee math handles fractions and cumulative final remainder", () => {
  assert.equal(percent(50000000, 5), 2500000)
  assert.equal(proportion(100, 1, 3), 33)
  assert.equal(proportion(100, 2, 3), 67)
  assert.equal(proportion(100, 3, 3), 100)
  assert.throws(() => proportion(10, 1, 0))
})
test("all payout demos use shared collections and traceable bank records", () => {
  for (const scenario of PAYOUT_DEMOS) {
    const g = payoutDemo(org, "scenario-" + scenario, scenario)
    assert.ok(g.payouts.records.length)
    for (const p of g.payouts.records) {
      assert.equal(
        p.instructions[0].actualRoundCollectionMinor,
        scenario.startsWith("Split beneficiaries") && p.position === 4 ? 35000000 : scenario === "Optional contribution made" ? 40000000 : 30000000,
      )
      assert.ok(
        p.installments.every((i) => i.bank.accountNumber && i.reference),
      )
      assert.ok(payoutTotals(p).recognizedFee <= payoutTotals(p).fee)
    }
  }
})
test('a late reference-time evaluation preserves logical timeout and finalization dates',()=>{
 const g=record(ready()),deadline=g.payouts.records[0].installments[0].confirmationDueAt,late=new Date(Date.parse(deadline)+200*3600000).toISOString(),next=evaluatePayouts(g,late,banks),p=next.payouts.records[0]
 assert.equal(p.completedAt,deadline);assert.equal(p.finalizedAt,new Date(Date.parse(deadline)+168*3600000).toISOString());assert.equal(p.installments[0].confirmedBy,undefined)
})

import { chooseOptional, optionalDecision } from "../src/payments/optional.ts"
import { startAttempt, confirmPayment } from "../src/payments/service.ts"
import { prototypeProvider } from "../src/payments/provider.ts"
import { collection } from "../src/rounds/model.ts"
test("explicit skip preserves readiness, history and beneficiary execution cutoff", () => {
  let g = ready(), c = cycleOf(g), r = c.active.rounds[0], at = g.payouts.referenceAt
  const before = collection(r,c.active)
  g = chooseOptional(g,org.id,member,c.id,r.id,"contribute",at)
  g = chooseOptional(g,org.id,member,c.id,r.id,"skip",at)
  assert.deepEqual(collection(r,cycleOf(g).active),before)
  assert.equal(g.payments.optionalDecisions.length,3)
  assert.throws(()=>chooseOptional(g,org.id,"stranger",c.id,r.id,"skip",at))
  g = record(g)
  assert.equal(optionalDecision(g,c.id,r.id,member).lockedAt,at)
  assert.throws(()=>chooseOptional(g,org.id,member,c.id,r.id,"contribute",at),/final/)
  assert.throws(()=>startAttempt(g,org.id,org.form.name,member,{cycleId:c.id,roundId:r.id,includeOptional:true},at),/final/)
})
test("confirmed payment after skip is retained as an exception without changing collection", () => {
  let g = ready(), c = cycleOf(g), r = c.active.rounds[0], at = g.payouts.referenceAt
  g = startAttempt(g,org.id,org.form.name,member,{cycleId:c.id,roundId:r.id,includeOptional:true},at)
  const a = g.payments.attempts.at(-1), event = prototypeProvider.confirmation(a,"success",at)
  g = chooseOptional(g,org.id,member,c.id,r.id,"skip",at)
  g = record(g)
  const before = collection(r,cycleOf(g).active).collected
  g = confirmPayment([g],org.id,event,at)[0]
  assert.equal(g.payments.transactions.at(-1).status,"confirmed")
  assert.equal(g.payments.transactions.at(-1).allocationStatus,"exception")
  assert.equal(collection(r,cycleOf(g).active).collected,before)
})
test("locked contribute rejects new attempts and retains late confirmation as exception without new payout", () => {
  let g = ready(), c = cycleOf(g), r = c.active.rounds[0], at = g.payouts.referenceAt
  g = chooseOptional(g,org.id,member,c.id,r.id,"contribute",at)
  g = startAttempt(g,org.id,org.form.name,member,{cycleId:c.id,roundId:r.id,includeOptional:true},at)
  const pending = g.payments.attempts.at(-1)
  g = record(g)
  const first = structuredClone(g.payouts.records[0])
  assert.throws(()=>startAttempt(g,org.id,org.form.name,member,{cycleId:c.id,roundId:r.id,includeOptional:true},at),/closed/)
  const event = prototypeProvider.confirmation(pending,"success",at)
  g = confirmPayment([g],org.id,event,at)[0]
  g = evaluatePayouts(g,at,banks)
  assert.deepEqual(g.payouts.records[0],first)
  assert.equal(optionalDecision(g,c.id,r.id,member).confirmedMinorAtCutoff,0)
  assert.equal(g.payments.transactions.at(-1).allocationStatus,"exception")
  assert.equal(g.payments.transactions.at(-1).unallocatedMinor,event.amountMinor)
  assert.equal(payoutTotals(g.payouts.records[0]).outstanding,0)
})

test("split flat fee applies once and each beneficiary retains their own optional contribution", () => {
  const g = payoutDemo(org,"split-math","Split beneficiaries / flat fee"), c = cycleOf(g), r = c.active.rounds[3]
  const a = payoutAmounts(g,c,r,"c3"), b = payoutAmounts(g,c,r,"c4")
  assert.equal(a.feeMinor,1000000)
  assert.equal(b.feeMinor,1000000)
  assert.equal(a.attributableCollectionMinor,15000000)
  assert.equal(b.attributableCollectionMinor,20000000)
  assert.equal(a.attributableCollectionMinor+b.attributableCollectionMinor,collection(r,c.active).collected)
  // User's 1m Position example: required collection 900k plus B's 50k.
  r.scheduledPayoutValueMinor=100000000
  for (const o of c.active.obligations.filter(o=>o.roundId===r.id))
    for (const p of o.components) {p.requiredMinor*=3; p.requiredSatisfiedMinor*=3}
  assert.equal(payoutAmounts(g,c,r,"c3").attributableCollectionMinor,45000000)
  assert.equal(payoutAmounts(g,c,r,"c4").attributableCollectionMinor,50000000)
  assert.equal(collection(r,c.active).collected,95000000)
  c.snapshot.terms.feeValue=20000.01
  assert.equal(payoutAmounts(g,c,r,"c3").feeMinor+payoutAmounts(g,c,r,"c4").feeMinor,2000001)
})
test("split recipients confirm independently and one Round resolves only after both", () => {
  let g = payoutDemo(org,"split-confirm","Split beneficiaries / independent responses"), c = cycleOf(g), r=c.active.rounds[3]
  const rows = g.payouts.records.filter(p=>p.roundId===r.id)
  assert.equal(rows.length,2)
  assert.equal(rows[0].status,"completed-member-confirmed")
  assert.equal(rows[1].status,"awaiting-confirmation")
  assert.equal(c.active.resolvedRoundIds.includes(r.id),false)
  const second=rows[1], at=g.payouts.referenceAt, banks=g.payouts.demoBanks
  const action={type:"confirm",payoutId:second.id,installmentId:second.installments[0].id,acknowledged:true}
  assert.throws(()=>payoutTransition(g,org.id,member,"c3",action,at,banks),/Only this beneficiary/)
  g=payoutTransition(g,org.id,member,"c4",action,at,banks)
  assert.ok(cycleOf(g).active.resolvedRoundIds.includes(r.id))
  assert.equal(g.payouts.records.filter(p=>p.roundId===r.id).reduce((s,p)=>s+payoutTotals(p).recognizedFee,0),2000000)
})
test("partial first transfer freezes optional state and late callbacks cannot enlarge the remainder", () => {
  let g=ready(), c=cycleOf(g), r=c.active.rounds[0], at=g.payouts.referenceAt
  g=startAttempt(g,org.id,org.form.name,member,{cycleId:c.id,roundId:r.id,includeOptional:true},at)
  const pending=g.payments.attempts.at(-1)
  g=record(g,10000000,{partial:true,partialReason:"Liquidity",completionPlan:"Complete next day",expectedCompletionAt:new Date(Date.parse(at)+86400000).toISOString(),evidence:{name:"receipt.txt",type:"text/plain",size:10}})
  const before=payoutTotals(g.payouts.records[0]), later=new Date(Date.parse(at)+1000).toISOString()
  const event=prototypeProvider.confirmation(pending,"success",at)
  g=confirmPayment([g],org.id,event,later)[0]
  g=evaluatePayouts(g,later,banks)
  assert.deepEqual(payoutTotals(g.payouts.records[0]),before)
  assert.equal(g.payments.transactions.at(-1).allocationStatus,"exception")
  assert.equal(g.payments.transactions.at(-1).allocatedMinor,0)
  assert.equal(collection(r,cycleOf(g).active).collected,30000000)
})
test("confirmed optional amount is retained at cutoff and duplicate callback stays idempotent", () => {
  let g=payoutDemo(org,"paid-cutoff","Optional contribution made"), c=cycleOf(g), r=c.active.rounds[0], at=g.payouts.referenceAt
  const p=g.payouts.records[0], banks=g.payouts.demoBanks
  g=payoutTransition(g,org.id,member,member,{type:"record",payoutId:p.id,instructionId:p.instructions[0].id,amountMinor:payoutTotals(p).net,transferredAt:at,reference:"PAID-CUTOFF",notes:"External demo transfer",partial:false,acknowledged:true},at,banks)
  const d=optionalDecision(g,c.id,r.id,member), t=g.payments.transactions.at(-1)
  assert.equal(d.confirmedMinorAtCutoff,10000000)
  const before=structuredClone(g.payouts.records[0])
  g=confirmPayment([g],org.id,t,at)[0]
  g=evaluatePayouts(g,at,banks)
  assert.deepEqual(g.payouts.records[0],before)
  assert.equal(payoutTotals(g.payouts.records[0]).net,39200000)
})

test("one half beneficiary's cutoff does not close the other beneficiary's optional contribution", () => {
  let g=payoutDemo(org,"split-cutoff","Split beneficiaries / flat fee"), c=cycleOf(g), r=c.active.rounds[3], at=g.payouts.referenceAt, banks=g.payouts.demoBanks
  // Independent seeded branch: B has not paid yet; A remains skip.
  const o=c.active.obligations.find(o=>o.roundId===r.id && o.memberId==="c4")
  for (const component of o.components) component.optionalSatisfiedMinor=0
  g.payments.attempts=[];g.payments.transactions=[];g.payments.allocations=[]
  g.payouts.records=[]
  g=evaluatePayouts(g,at,banks)
  const a=g.payouts.records.find(p=>p.roundId===r.id && p.memberId==="c3")
  g=payoutTransition(g,org.id,member,member,{type:"record",payoutId:a.id,instructionId:a.instructions[0].id,amountMinor:payoutTotals(a).net,transferredAt:at,reference:"A-FIRST",notes:"External demo transfer",partial:false,acknowledged:true},at,banks)
  const frozen=structuredClone(g.payouts.records.find(p=>p.id===a.id).calculation)
  g=startAttempt(g,org.id,org.form.name,"c4",{cycleId:c.id,roundId:r.id,includeOptional:true},at)
  g=confirmPayment([g],org.id,prototypeProvider.confirmation(g.payments.attempts.at(-1),"success",at),at)[0]
  g=evaluatePayouts(g,at,banks)
  assert.deepEqual(g.payouts.records.find(p=>p.id===a.id).calculation,frozen)
  const b=g.payouts.records.find(p=>p.roundId===r.id && p.memberId==="c4")
  assert.equal(b.calculation.attributableCollectionMinor,20000000)
  assert.equal(b.instructions[0].status,"stale")
  assert.equal(optionalDecision(g,c.id,r.id,"c4").lockedAt,undefined)
})
