import test from "node:test"
import assert from "node:assert/strict"
import {
  nextCycle,
  resolveRecovery,
  requestAmendment,
} from "../src/lifecycle/continuation.ts"
import { emptyLifecycle } from "../src/lifecycle/model.ts"
import { roundDemo } from "../src/rounds/seeds.ts"
import { seedPersona } from "../src/clients/seeds.ts"
import { seedOrganization } from "../src/organizations/seeds.ts"
import {
  cycleOf,
  exampleFeeBoundary,
  accepted,
  transition,
} from "../src/groups/model.ts"
const org = seedOrganization(seedPersona("verified"), "active"),
  at = "2099-12-25T00:00:00Z"
const completed = () => {
  const g = roundDemo(
    org,
    "lifecycle-test",
    exampleFeeBoundary(),
    "Monthly",
    "Half recipients · prior history",
  )
  cycleOf(g).status = "completed"
  cycleOf(g).completedAt = at
  cycleOf(g).active.endedAt = at
  g.lifecycle = emptyLifecycle()
  return g
}
test("Rollover creates a new draft under the same Group and never alters old Cycle data", () => {
  const old = completed(),
    previous = structuredClone(cycleOf(old)),
    g = nextCycle(old, org, "rollover", at)
  assert.equal(g.id, old.id)
  assert.equal(g.cycles.length, 2)
  assert.deepEqual(g.cycles[0], previous)
  assert.equal(cycleOf(g).status, "draft")
  assert.equal(cycleOf(g).number, 2)
  assert.equal(cycleOf(g).snapshot, undefined)
  assert.equal(cycleOf(g).active, undefined)
  assert.equal(cycleOf(g).terms.startDate, "")
  assert.equal(g.currentCycleId, null)
  assert.ok(cycleOf(g).participants.every((p) => !accepted(cycleOf(g), p)))
  assert.equal(cycleOf(g).orderFinalized, false)
  assert.equal(cycleOf(g).financial.obligations, 0)
  const edited = transition(g, org, exampleFeeBoundary(), {
    type: "terms",
    terms: { ...cycleOf(g).terms, amount: 120000 },
  })
  assert.deepEqual(edited.cycles[0], previous)
  assert.deepEqual(old.cycles[0], previous)
})
test("Start Fresh retains the Group while clearing previous participation and assignments", () => {
  const old = completed(),
    g = nextCycle(old, org, "fresh", at)
  assert.equal(g.name, old.name)
  assert.equal(cycleOf(g).participants.length, 0)
  assert.ok(cycleOf(g).positions.every((p) => p.holders.length === 0))
  assert.deepEqual(g.cycles[0], old.cycles[0])
})
test("continuation is deliberate, blocked for active Cycles and terminated Groups", () => {
  const active = roundDemo(
    org,
    "active-test",
    exampleFeeBoundary(),
    "Monthly",
    "Open",
  )
  assert.throws(() => nextCycle(active, org, "rollover", at))
  const g = completed()
  g.lifecycle.termination = {
    status: "terminated",
    at,
    reason: "Arrangement ended",
  }
  assert.throws(() => nextCycle(g, org, "fresh", at))
  assert.throws(() =>
    nextCycle(completed(), { ...org, id: "another-tenant" }, "fresh", at),
  )
})
test("recovery resolution changes the independent case without rewriting completed Cycle history", () => {
  const g = completed()
  cycleOf(g).status = "completed-with-recovery"
  g.lifecycle.recoveries.push({
    id: "r1",
    cycleId: cycleOf(g).id,
    memberId: org.ownerMemberId,
    principalMinor: 100000,
    penaltyMinor: 2000,
    recoveredMinor: 102000,
    status: "awaiting-review",
    restricted: true,
    openedAt: at,
    reviewStatus: "pending",
    reason: "Historical demo default",
    demoFinancialState: true,
  })
  const old = structuredClone(cycleOf(g)),
    next = resolveRecovery(g, org, "r1", "2100-01-05T00:00:00Z")
  assert.deepEqual(cycleOf(next), old)
  assert.equal(next.lifecycle.recoveries[0].status, "resolved")
  assert.equal(next.lifecycle.recoveries[0].restricted, false)
  g.lifecycle.recoveries[0].recoveredMinor = 0
  assert.throws(() => resolveRecovery(g, org, "r1", at))
})
test("Amendment is a request only; it never silently edits active financial terms", () => {
  const g = roundDemo(
      org,
      "amendment-test",
      exampleFeeBoundary(),
      "Monthly",
      "Open",
    ),
    old = structuredClone(cycleOf(g))
  const next = requestAmendment(
    g,
    org,
    "Exceptional correction requiring Member consent",
    { ...old.terms, amount: 110000 },
    at,
  )
  assert.deepEqual(cycleOf(next), old)
  assert.equal(next.lifecycle.amendments[0].status, "awaiting-consent")
  assert.equal(
    next.lifecycle.amendments[0].affectedMemberIds.length,
    old.participants.length,
  )
})

import { lifecycleTransition, unresolved } from "../src/lifecycle/service.ts"
import { lifecycleDemo, LIFECYCLE_DEMOS } from "../src/lifecycle/seeds.ts"
import { advanceReference } from "../src/rounds/service.ts"
import { DIRECTORY } from "../src/groups/seeds.ts"
const demo = (name) => lifecycleDemo(org, "scenario-" + name, name)
test("every compact lifecycle scenario is constructible without payment execution", () => {
  for (const name of LIFECYCLE_DEMOS) {
    const g = demo(name)
    assert.equal(g.id, "scenario-" + name)
    assert.ok(g.cycles.length)
    assert.equal(cycleOf(g).financial.payments, 0)
  }
})
test("activated withdrawal preserves snapshot and others acceptance, returns same Cycle to readiness", () => {
  const g = roundDemo(
      org,
      "withdraw",
      exampleFeeBoundary(),
      "Monthly",
      "Upcoming",
    ),
    old = structuredClone(cycleOf(g)),
    next = lifecycleTransition(
      g,
      org.ownerMemberId,
      org.ownerMemberId,
      {
        type: "withdraw",
        memberId: org.ownerMemberId,
        reason: "Plans have changed",
      },
      old.active.referenceAt,
    ),
    c = cycleOf(next)
  assert.equal(c.id, old.id)
  assert.equal(c.status, "draft")
  assert.deepEqual(c.activationHistory[0].snapshot, old.snapshot)
  assert.equal(c.active, undefined)
  assert.ok(
    c.positions.every((p) =>
      p.holders.every((h) => h.memberId !== org.ownerMemberId),
    ),
  )
  assert.ok(
    c.participants
      .filter((p) => p.id !== org.ownerMemberId)
      .every((p) => accepted(c, p)),
  )
  assert.equal(next.lifecycle.exits[0].kind, "withdrawal")
  assert.equal(next.lifecycle.exits[0].status, "approved")
  assert.deepEqual(cycleOf(g), old)
})
test("first obligation blocks normal withdrawal; Member identity and post-payout exits are enforced", () => {
  const g = roundDemo(org, "started", exampleFeeBoundary(), "Monthly", "Open"),
    action = {
      type: "withdraw",
      memberId: org.ownerMemberId,
      reason: "Changed plans",
    }
  assert.throws(() =>
    lifecycleTransition(g, org.ownerMemberId, org.ownerMemberId, action, at),
  )
  assert.throws(() =>
    lifecycleTransition(
      g,
      "another",
      org.ownerMemberId,
      { ...action, type: "request-exit" },
      at,
    ),
  )
  const paid = demo("Post-payout default / recovery")
  assert.throws(() =>
    lifecycleTransition(
      paid,
      org.ownerMemberId,
      org.ownerMemberId,
      { ...action, type: "request-exit" },
      at,
    ),
  )
})
test("exit principal is actual contributions without penalty offsets; generated obligations retained", () => {
  const g = demo("Early Exit requested"),
    before = structuredClone(cycleOf(g).active.obligations),
    e = g.lifecycle.exits[0],
    next = lifecycleTransition(
      g,
      org.ownerMemberId,
      org.ownerMemberId,
      { type: "approve-exit", id: e.id },
      cycleOf(g).active.referenceAt,
    )
  assert.equal(next.lifecycle.exits[0].settlement.dueMinor, 20000000)
  assert.deepEqual(cycleOf(next).active.obligations, before)
  assert.equal(
    next.lifecycle.exits[0].settlement.responsibility,
    "organization",
  )
})
test("replacement switches only future Round ownership after consent and regularization", () => {
  const g = demo("Replacement regularized / handover"),
    c = cycleOf(g),
    r = g.lifecycle.replacements[0]
  assert.equal(r.regularizationRequiredMinor, 10000000)
  assert.equal(g.lifecycle.exits[0].settlement.dueMinor, 20000000)
  assert.ok(r.acceptance)
  assert.equal(r.effectiveAt, c.active.rounds[1].schedule.opensAt)
  assert.ok(
    c.active.obligations.some(
      (o) =>
        o.roundId === c.active.rounds[0].id && o.memberId === org.ownerMemberId,
    ),
  )
  assert.ok(
    c.active.obligations.some(
      (o) =>
        o.roundId === c.active.rounds[1].id && o.memberId === DIRECTORY[4].id,
    ),
  )
  assert.ok(
    !c.active.obligations.some(
      (o) =>
        o.roundId === c.active.rounds[1].id && o.memberId === org.ownerMemberId,
    ),
  )
  assert.ok(c.snapshot.participants.some((p) => p.id === org.ownerMemberId))
  assert.ok(!c.snapshot.participants.some((p) => p.id === DIRECTORY[4].id))
})
test("unfilled vacancy preserves scheduled payout value and does not generate new debt for exited Member", () => {
  const g = demo("Vacancy / settlement due"),
    c = cycleOf(g),
    next = advanceReference(g, c.active.rounds[1].schedule.opensAt),
    a = cycleOf(next).active
  assert.equal(
    a.rounds[1].scheduledPayoutValueMinor,
    c.active.rounds[1].scheduledPayoutValueMinor,
  )
  assert.ok(
    !a.obligations.some(
      (o) => o.roundId === a.rounds[1].id && o.memberId === org.ownerMemberId,
    ),
  )
  assert.ok(unresolved(next))
})
test("completion gates all Rounds and payout outcomes, fixes end date and allows independent recovery", () => {
  const incomplete = roundDemo(
    org,
    "incomplete",
    exampleFeeBoundary(),
    "Monthly",
    "Open",
  )
  assert.throws(() =>
    lifecycleTransition(
      incomplete,
      org.ownerMemberId,
      org.ownerMemberId,
      { type: "complete" },
      at,
    ),
  )
  const ready = demo("Ready to complete"),
    time = cycleOf(ready).active.referenceAt,
    done = lifecycleTransition(
      ready,
      org.ownerMemberId,
      org.ownerMemberId,
      { type: "complete" },
      time,
    )
  assert.equal(cycleOf(done).status, "completed")
  assert.equal(cycleOf(done).completedAt, time)
  assert.equal(cycleOf(done).active.endedAt, time)
  assert.equal(done.cycles.length, 1)
  assert.throws(() =>
    lifecycleTransition(
      done,
      org.ownerMemberId,
      org.ownerMemberId,
      { type: "complete" },
      time,
    ),
  )
  assert.equal(
    cycleOf(demo("Completed with recovery")).status,
    "completed-with-recovery",
  )
  const missing = structuredClone(ready)
  missing.lifecycle.payoutFacts.pop()
  assert.throws(() =>
    lifecycleTransition(
      missing,
      org.ownerMemberId,
      org.ownerMemberId,
      { type: "complete" },
      time,
    ),
  )
})
test("termination retains history and routes unresolved financial cases to review", () => {
  const g = demo("Completed with recovery"),
    next = lifecycleTransition(
      g,
      org.ownerMemberId,
      org.ownerMemberId,
      {
        type: "terminate",
        reason: "Group should conclude under controlled review",
      },
      at,
    )
  assert.equal(next.lifecycle.termination.status, "pending-tcs-review")
  assert.deepEqual(next.cycles, g.cycles)
  const clear = demo("Terminated history")
  assert.equal(clear.lifecycle.termination.status, "terminated")
  assert.equal(clear.cycles.length, 1)
  assert.throws(() =>
    transition(clear, org, exampleFeeBoundary(), {
      type: "terms",
      terms: cycleOf(clear).terms,
    }),
  )
})
test("Force Close captures liabilities without settling, waiving or terminating", () => {
  const g = demo("Force Close pending review")
  assert.equal(g.lifecycle.forceCloseRequests[0].status, "pending-tcs-review")
  assert.equal(cycleOf(g).status, "activated")
  assert.equal(g.lifecycle.termination, undefined)
  assert.equal(g.lifecycle.forceCloseRequests[0].requestedAbsorptionMinor, 0)
})
test("replacement acceptance rejects another actor and new commitment restrictions", () => {
  const g = demo("Replacement awaiting consent"),
    r = g.lifecycle.replacements[0],
    action = {
      type: "accept-replacement",
      id: r.id,
      memberId: r.incomingMemberId,
    }
  assert.throws(() =>
    lifecycleTransition(g, org.ownerMemberId, org.ownerMemberId, action, at),
  )
  assert.throws(() =>
    lifecycleTransition(
      g,
      r.incomingMemberId,
      org.ownerMemberId,
      action,
      at,
      () => false,
    ),
  )
})
test('one resolved recovery cannot hide another Member unpaid obligation at termination',()=>{
 const g=demo('Recovery cleared / review due'),c=cycleOf(g),caseRecord=g.lifecycle.recoveries[0]
 const reviewed=resolveRecovery(g,org,caseRecord.id,c.active.referenceAt)
 assert.equal(unresolved(reviewed),false)
 const another=cycleOf(reviewed).active.obligations.find(o=>o.memberId!==org.ownerMemberId&&o.components.some(p=>p.requiredMinor>0))
 another.components.find(p=>p.requiredMinor>0).requiredSatisfiedMinor=0
 assert.equal(unresolved(reviewed),true)
 const pending=lifecycleTransition(reviewed,org.ownerMemberId,org.ownerMemberId,{type:'terminate',reason:'End Group after independent case review'},at)
 assert.equal(pending.lifecycle.termination.status,'pending-tcs-review')
})
test('amendment consent remains Member-specific and requires all affected Members before TCS review',()=>{
 let g=demo('Amendment consent pending'),old=structuredClone(cycleOf(g)),a=g.lifecycle.amendments[0]
 for(const id of a.affectedMemberIds)g=lifecycleTransition(g,id,org.ownerMemberId,{type:'consent-amendment',id:a.id,memberId:id},cycleOf(g).active.referenceAt)
 assert.equal(g.lifecycle.amendments[0].status,'pending-tcs-review');assert.deepEqual(cycleOf(g),old)
 assert.throws(()=>requestAmendment(g,org,'Invalid negative contribution',{...old.terms,amount:-1},at))
})
test('rollover preserves replacement assignments as unaccepted proposals',()=>{
 const g=demo('Replacement regularized / handover'),c=cycleOf(g)
 c.status='completed';c.completedAt=at;c.active.endedAt=at
 const next=nextCycle(g,org,'rollover',at),draft=cycleOf(next)
 assert.ok(draft.positions.some(p=>p.holders.some(h=>h.memberId===DIRECTORY[4].id)))
 assert.ok(!draft.positions.some(p=>p.holders.some(h=>h.memberId===org.ownerMemberId)))
 assert.ok(draft.participants.every(p=>!accepted(draft,p)));assert.deepEqual(next.cycles[0],g.cycles[0])
})
test('Force Closed sample preserves liabilities and prevents direct normal termination',()=>{
 const g=demo('Force Closed / retained liabilities'),old=structuredClone(cycleOf(g))
 assert.equal(old.status,'force-closed');assert.ok(old.active.endedAt);assert.ok(g.lifecycle.forceCloseRequests[0].balances.unpaidPayoutMinor>0)
 const pending=lifecycleTransition(g,org.ownerMemberId,org.ownerMemberId,{type:'terminate',reason:'Request controlled financial resolution'},old.active.referenceAt)
 assert.equal(pending.lifecycle.termination.status,'pending-tcs-review');assert.deepEqual(cycleOf(pending),old)
})
