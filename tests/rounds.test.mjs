import test from "node:test"
import assert from "node:assert/strict"
import {
  toMinor,
  shareAmount,
  generateObligations,
  balances,
  collection,
  obligationState,
} from "../src/rounds/model.ts"
const schedule = {
  periodStart: "2028-02-01T00:00:00Z",
  periodEnd: "2028-02-29T23:59:59.999Z",
  opensAt: "2028-02-20T00:00:00Z",
  dueDayStartsAt: "2028-02-29T00:00:00Z",
  dueAt: "2028-02-29T23:59:59.999Z",
  lateAt: "2028-03-03T00:00:00Z",
  payoutTargetAt: "2028-03-03T00:00:00Z",
  timezone: "Africa/Accra",
}
const snapshot = {
  terms: { amount: 100000 },
  participants: [
    { id: "m1", status: "approved" },
    { id: "m2", status: "approved" },
    { id: "m3", status: "approved" },
  ],
  positions: [
    { n: 1, holders: [{ memberId: "m1", fraction: 1 }] },
    { n: 2, holders: [{ memberId: "m1", fraction: 1 }] },
    {
      n: 3,
      holders: [
        { memberId: "m2", fraction: 0.5 },
        { memberId: "m3", fraction: 0.5 },
      ],
    },
  ],
}
const cycle = { id: "cycle-1", status: "activated", snapshot }
const rounds = snapshot.positions.map((p) => ({
  id: "round-" + p.n,
  groupId: "g",
  cycleId: cycle.id,
  number: p.n,
  position: p.n,
  beneficiaries: [],
  scheduledPayoutValueMinor: 30000000,
  schedule,
}))
const state = () => ({
  generatedAt: schedule.opensAt,
  penaltyEnabled: true,
  referenceAt: "2028-03-04T00:00:00Z",
  rounds,
  obligations: generateObligations("g", cycle, rounds),
  resolvedRoundIds: [],
})
test("currency conversion is exact and rejects unrepresentable money", () => {
  assert.equal(toMinor(0.29), 29)
  assert.equal(toMinor(100000.12), 10000012)
  assert.equal(shareAmount(10000012, 0.5), 5000006)
  for (const bad of [NaN, Infinity, -1, 0.001])
    assert.throws(() => toMinor(bad))
  assert.throws(() => shareAmount(1, 0.5))
  assert.throws(() => shareAmount(100, 0.25))
})
test("multiple positions retain required components while receiving one position", () => {
  const a = state(),
    o = a.obligations.find(
      (o) => o.memberId === "m1" && o.roundId === "round-1",
    ),
    b = balances(o)
  assert.equal(b.required, 10000000)
  assert.equal(b.optional, 10000000)
  assert.equal(b.outstanding, 10000000)
  assert.equal(o.components.find((c) => c.position === 1).requiredMinor, 0)
  assert.equal(
    o.components.find((c) => c.position === 2).requiredMinor,
    10000000,
  )
})
test("two half recipients share one Round and neither optional share becomes debt", () => {
  const a = state(),
    round = rounds[2]
  for (const id of ["m2", "m3"]) {
    const o = a.obligations.find(
        (o) => o.memberId === id && o.roundId === round.id,
      ),
      b = obligationState(o, round, a)
    assert.equal(b.required, 0)
    assert.equal(b.optional, 5000000)
    assert.equal(b.outstanding, 0)
    assert.equal(b.late, false)
    assert.equal(b.penaltyEligible, false)
  }
  assert.equal(a.rounds.length, 3)
  assert.equal(a.obligations.length, 9)
})
test("SPV remains distinct from required collection and optional amounts", () => {
  const a = state(),
    round = rounds[0]
  for (const o of a.obligations.filter((o) => o.roundId === round.id))
    for (const c of o.components) c.requiredSatisfiedMinor = c.requiredMinor
  const totals = collection(round, a)
  assert.equal(totals.required, 20000000)
  assert.equal(totals.collected, 20000000)
  assert.equal(totals.optional, 10000000)
  assert.equal(round.scheduledPayoutValueMinor, 30000000)
  assert.equal(totals.ready, true)
  const recipient = a.obligations.find(
    (o) => o.roundId === round.id && o.memberId === "m1",
  )
  recipient.components[0].optionalSatisfiedMinor =
    recipient.components[0].optionalMinor
  assert.equal(collection(round, a).collected, 30000000)
  assert.equal(collection(round, a).outstanding, 0)
})
test("partial fulfillment leaves required debt; fully satisfied debt is never currently late", () => {
  const a = state(),
    round = rounds[0],
    o = a.obligations.find((o) => o.roundId === round.id && o.memberId === "m1")
  o.components[1].requiredSatisfiedMinor = 2500000
  let b = obligationState(o, round, a)
  assert.equal(b.outstanding, 7500000)
  assert.equal(b.fulfillment, "Partially satisfied")
  assert.equal(b.late, true)
  o.components[1].requiredSatisfiedMinor = 10000000
  b = obligationState(o, round, a)
  assert.equal(b.fulfillment, "Satisfied")
  assert.equal(b.late, false)
  assert.equal(b.penaltyEligible, false)
})
test("future obligation fulfillment is representable without payment allocation or transactions", () => {
  const a = state()
  a.referenceAt = "2028-02-01T00:00:00Z"
  const o = a.obligations[0]
  o.components[1].requiredSatisfiedMinor = o.components[1].requiredMinor
  assert.equal(obligationState(o, rounds[0], a).fulfillment, "Satisfied")
  assert.equal(obligationState(o, rounds[0], a).timing, "Upcoming")
  assert.equal("payments" in a, false)
})
test("Cycle end stops penalty eligibility without waiving outstanding principal", () => {
  const a = state()
  a.endedAt = "2028-03-03T12:00:00Z"
  const b = obligationState(a.obligations[0], rounds[0], a)
  assert.ok(b.outstanding > 0)
  assert.equal(b.penaltyEligible, false)
})
test("over-fulfillment is rejected rather than hidden with a zero floor", () => {
  const a = state(),
    o = a.obligations[0]
  o.components[1].requiredSatisfiedMinor = o.components[1].requiredMinor + 1
  assert.throws(() => balances(o))
})

import { generateRounds, timing, currentRound } from "../src/rounds/model.ts"
import { calendarDate, addDays, localInstant } from "../src/rounds/calendar.ts"
test("calendar helpers preserve leap years, month/year rollover and configured timezone", () => {
  assert.equal(calendarDate(2028, 2, 0), "2028-02-29")
  assert.equal(calendarDate(2027, 2, 0), "2027-02-28")
  assert.equal(addDays("2028-12-31", 1), "2029-01-01")
  assert.equal(
    localInstant("2028-03-03", "Africa/Lagos"),
    "2028-03-02T23:00:00.000Z",
  )
  assert.equal(
    localInstant("2028-03-03", "Africa/Accra"),
    "2028-03-03T00:00:00.000Z",
  )
  assert.equal(
    localInstant("2028-03-03", "Africa/Nairobi"),
    "2028-03-02T21:00:00.000Z",
  )
  assert.throws(() => localInstant("2028-03-03", "unknown"))
})
test("one Round per finalized slot; beneficiaries and SPV derive from snapshot", () => {
  const result = generateRounds("g", cycle, [schedule, schedule, schedule])
  assert.equal(result.length, 3)
  assert.equal(result[2].beneficiaries.length, 2)
  assert.equal(result[2].beneficiaries[0].entitlementMinor, 15000000)
  assert.equal(result[2].scheduledPayoutValueMinor, 30000000)
  assert.deepEqual(
    generateRounds("g", cycle, [schedule, schedule, schedule]),
    result,
  )
  assert.throws(() =>
    generateRounds("g", { ...cycle, status: "draft" }, [
      schedule,
      schedule,
      schedule,
    ]),
  )
  assert.throws(() => generateRounds("g", cycle, [schedule]))
})
test("timing boundaries are independent of fulfillment", () => {
  for (const [reference, expected] of [
    ["2028-02-19T23:59:59.999Z", "Upcoming"],
    ["2028-02-20T00:00:00Z", "Open"],
    ["2028-02-29T00:00:00Z", "Due"],
    ["2028-02-29T23:59:59.999Z", "Due"],
    ["2028-03-01T00:00:00Z", "Grace"],
    ["2028-03-02T23:59:59.999Z", "Grace"],
    ["2028-03-03T00:00:00Z", "Late"],
  ])
    assert.equal(timing(schedule, reference), expected)
})
test("current Round does not silently discard an unresolved earlier Round", () => {
  const a = state()
  assert.equal(currentRound(a).number, 1)
  a.resolvedRoundIds = ["round-1"]
  assert.equal(currentRound(a).number, 2)
})

import { schedules } from "../src/rounds/schedule.ts"
import { advanceReference } from "../src/rounds/service.ts"
import { roundDemo, ROUND_DEMOS } from "../src/rounds/seeds.ts"
import { seedPersona } from "../src/clients/seeds.ts"
import { seedOrganization } from "../src/organizations/seeds.ts"
import {
  defaultDraft,
  cycleOf,
  transition,
  exampleFeeBoundary,
  financiallyCommenced,
} from "../src/groups/model.ts"
const organization = seedOrganization(seedPersona("verified"), "active"),
  boundary = exampleFeeBoundary()
const terms = (frequency, startDate, patch = {}) => ({
  ...defaultDraft(),
  positions: 4,
  frequency,
  startDate,
  contributionWindowDays: frequency === "Biweekly" ? 14 : 7,
  gracePeriodDays: frequency === "Daily" ? 0 : frequency === "Weekly" ? 1 : 2,
  ...patch,
})
test("Monthly Round 1 never opens before the approved effective date", () => {
  for (const [day, expected] of [
    ["10", "2099-09-19T23:00:00.000Z"],
    ["20", "2099-09-19T23:00:00.000Z"],
    ["25", "2099-10-19T23:00:00.000Z"],
  ])
    assert.equal(
      schedules(terms("Monthly", "2099-09-" + day))[0].opensAt,
      expected,
    )
  const s = schedules(terms("Monthly", "2028-02-20"))[0]
  assert.equal(s.dueAt, "2028-02-29T22:59:59.999Z")
  assert.equal(s.lateAt, "2028-03-02T23:00:00.000Z")
})
test("Daily, Weekly and Biweekly align to the first allowed start boundary", () => {
  const daily = schedules(terms("Daily", "2028-02-29"))
  assert.equal(daily[0].opensAt, "2028-02-28T23:00:00.000Z")
  assert.equal(daily[0].dueAt, "2028-02-29T22:59:59.999Z")
  assert.equal(daily[0].lateAt, "2028-02-29T23:00:00.000Z")
  assert.equal(daily[0].payoutTargetAt, "2028-03-01T11:00:00.000Z")
  for (const f of ["Weekly", "Biweekly"]) {
    const s = schedules(terms(f, "2028-02-28"))
    assert.equal(s[0].opensAt, "2028-03-04T23:00:00.000Z")
    assert.equal(
      s[0].dueAt,
      f === "Weekly" ? "2028-03-11T22:59:59.999Z" : "2028-03-18T22:59:59.999Z",
    )
    assert.equal(
      s[0].lateAt,
      f === "Weekly" ? "2028-03-12T23:00:00.000Z" : "2028-03-20T23:00:00.000Z",
    )
    assert.equal(schedules(terms(f, "2028-03-05"))[0].opensAt, s[0].opensAt)
  }
})
test("saved schedule values and timezone are honored centrally", () => {
  const s = schedules(
    terms("Monthly", "2028-02-11", {
      contributionOpenDay: 10,
      gracePeriodDays: 4,
      timezone: "Africa/Accra",
    }),
  )[0]
  assert.equal(s.opensAt, "2028-03-10T00:00:00.000Z")
  assert.equal(s.lateAt, "2028-04-05T00:00:00.000Z")
  const weekly = schedules(
    terms("Weekly", "2028-03-05", {
      contributionWindowDays: 5,
      gracePeriodDays: 2,
    }),
  )[0]
  assert.equal(weekly.dueAt, "2028-03-09T22:59:59.999Z")
  assert.equal(weekly.lateAt, "2028-03-11T23:00:00.000Z")
  assert.throws(() =>
    schedules(terms("Weekly", "2028-03-05", { contributionWindowDays: 8 })),
  )
})
test("opening automatically generates obligations exactly once and closes cancellation", () => {
  let g = roundDemo(organization, "automatic", boundary, "Monthly", "Upcoming"),
    c = cycleOf(g)
  assert.equal(c.active.rounds.length, 4)
  assert.equal(c.active.obligations.length, 0)
  assert.equal(financiallyCommenced(c), false)
  const cancelled = transition(g, organization, boundary, {
    type: "cancel",
    confirmed: true,
    reason: "Before the first opening",
  })
  assert.equal(cycleOf(cancelled).status, "cancelled")
  const snapshot = structuredClone(c.snapshot),
    opening = c.active.rounds[0].schedule.opensAt
  g = advanceReference(g, opening)
  c = cycleOf(g)
  assert.equal(c.financial.obligations, 4)
  assert.equal(c.active.obligations.length, 4)
  assert.equal(financiallyCommenced(c), true)
  assert.deepEqual(c.snapshot, snapshot)
  assert.throws(() =>
    transition(g, organization, boundary, {
      type: "cancel",
      confirmed: true,
      reason: "Too late to cancel",
    }),
  )
  const again = advanceReference(g, opening)
  assert.deepEqual(again, g)
  assert.throws(() =>
    advanceReference(g, new Date(Date.parse(opening) - 1).toISOString()),
  )
  const next = advanceReference(g, c.active.rounds[1].schedule.opensAt)
  assert.equal(cycleOf(next).active.obligations.length, 8)
  assert.equal(cycleOf(next).financial.payments, 0)
  assert.equal(cycleOf(next).financial.payouts, 0)
})
test("all frequencies and compact demo scenarios reconcile obligations and collection", () => {
  for (const f of ["Daily", "Weekly", "Biweekly", "Monthly"])
    for (const d of ROUND_DEMOS) {
      const g = roundDemo(organization, `${f}-${d}`, boundary, f, d),
        c = cycleOf(g),
        a = c.active
      assert.equal(a.rounds.length, 4)
      assert.equal(c.financial.obligations, a.obligations.length)
      for (const r of a.rounds) {
        const t = collection(r, a)
        assert.equal(t.outstanding, t.required - t.satisfied)
        assert.equal(t.collected, t.satisfied + t.optionalMade)
        assert.equal(r.scheduledPayoutValueMinor, 40000000)
      }
      assert.equal(c.financial.payments, 0)
      assert.equal(c.financial.allocations, 0)
      assert.equal(c.financial.payouts, 0)
      assert.equal(c.financial.postings, 0)
    }
})
