import test from "node:test"
import assert from "node:assert/strict"
import { seedPersona } from "../src/clients/seeds.ts"
import { seedOrganization } from "../src/organizations/seeds.ts"
import {
  newGroup,
  cycleOf,
  transition,
  exampleFeeBoundary,
  readiness,
  accepted,
  admitted,
  reserved,
  memberTerms,
  configurationErrors,
  financiallyCommenced,
  allocationValid,
  feePerPosition,
} from "../src/groups/model.ts"
import { seedGroup, SCENARIOS, DIRECTORY } from "../src/groups/seeds.ts"
const org = () => seedOrganization(seedPersona("verified"), "active")
const bounds = exampleFeeBoundary()
const sample = (scenario = "Ready for activation", o = org()) =>
  seedGroup(o, "group-test", scenario, bounds)
const change = (g, a, o = org()) => transition(g, o, bounds, a)
const pass = (g) =>
  readiness(g, org(), bounds).every((r) => r.status === "pass")
const acceptAll = (g) => {
  for (const p of admitted(cycleOf(g)))
    g = change(g, {
      type: "accept",
      id: p.id,
      actorId: p.id,
      confirmed: true,
      reviewedTerms: memberTerms(cycleOf(g), p.id),
    })
  return g
}
test("Group identity is persistent and separate from the first Cycle; no financial records generated", () => {
  const g = newGroup(org(), "g")
  assert.equal(g.organizationId, org().id)
  assert.notEqual(g.id, cycleOf(g).id)
  assert.equal(g.currentCycleId, null)
  assert.equal(cycleOf(g).number, 1)
  assert.equal(cycleOf(g).status, "draft")
  assert.equal(financiallyCommenced(cycleOf(g)), false)
  assert.equal("rounds" in cycleOf(g), false)
})
test("all representative scenarios are coherent and readiness is derived", () => {
  for (const scenario of SCENARIOS) {
    const g = sample(scenario)
    assert.equal(pass(g), scenario === "Ready for activation")
    assert.equal(allocationValid(cycleOf(g)), true)
    assert.equal(financiallyCommenced(cycleOf(g)), false)
  }
})
test("invitation/public requests reserve nothing until admission; admission is not Member acceptance", () => {
  let g = sample("Recruitment in progress")
  assert.equal(reserved(cycleOf(g)), 1)
  assert.equal(
    admitted(cycleOf(g)).filter((p) => accepted(cycleOf(g), p)).length,
    0,
  )
  g = change(g, {
    type: "recruit",
    member: { ...DIRECTORY[4], source: "public-request" },
  })
  assert.equal(reserved(cycleOf(g)), 1)
  g = change(g, { type: "admit", id: "c5", equivalent: 0.5 })
  assert.equal(reserved(cycleOf(g)), 1.5)
  assert.equal(pass(g), false)
  const privateGroup = newGroup(org(), "private")
  assert.throws(
    () =>
      change(privateGroup, {
        type: "recruit",
        member: { ...DIRECTORY[0], source: "public-request" },
      }),
    /Public requests/,
  )
  assert.throws(
    () =>
      change(privateGroup, {
        type: "recruit",
        member: { ...DIRECTORY[0], verified: false },
      }),
    /verified/,
  )
})
test("full/half only; no overcapacity, excess Member commitments or quarter allocations", () => {
  const g = sample("Recruitment in progress")
  for (const equivalent of [0, -1, 0.25, NaN, Infinity, 3])
    assert.throws(() => change(g, { type: "admit", id: "c2", equivalent }))
  const ready = sample()
  assert.throws(() =>
    change(ready, { type: "assign", id: "c1", position: 1, fraction: 1 }),
  )
  let draft = sample("Positions incomplete")
  assert.throws(() =>
    change(draft, { type: "assign", id: "c4", position: 3, fraction: 0.25 }),
  )
  draft = change(draft, {
    type: "assign",
    id: "c4",
    position: 3,
    fraction: 0.5,
  })
  assert.equal(allocationValid(cycleOf(draft), true), true)
  assert.throws(() =>
    change(draft, {
      type: "terms",
      terms: { ...cycleOf(draft).terms, splitParts: 4 },
    }),
  )
  assert.throws(() =>
    change(draft, {
      type: "terms",
      terms: { ...cycleOf(draft).terms, allowSplit: false },
    }),
  )
})
test("multiple-position policies enforce one, configured maximum, or available capacity", () => {
  for (const policy of ["none", "max", "unlimited"]) {
    let g = sample("Recruitment in progress")
    g = change(g, {
      type: "terms",
      terms: {
        ...cycleOf(g).terms,
        multiplePositions: policy,
        maxPerMember: 1.5,
      },
    })
    if (policy === "none")
      assert.throws(() =>
        change(g, { type: "admit", id: "c2", equivalent: 1.5 }),
      )
    else {
      g = change(g, {
        type: "admit",
        id: "c2",
        equivalent: policy === "max" ? 1.5 : 2,
      })
      assert.equal(reserved(cycleOf(g)), policy === "max" ? 2.5 : 3)
    }
  }
})
test("capacity can grow; shrinking cannot discard assigned positions or commitments", () => {
  const g = sample()
  assert.throws(() =>
    change(g, { type: "terms", terms: { ...cycleOf(g).terms, positions: 2 } }),
  )
  const larger = change(g, {
    type: "terms",
    terms: { ...cycleOf(g).terms, positions: 4 },
  })
  assert.equal(cycleOf(larger).positions.length, 4)
  assert.equal(cycleOf(larger).orderFinalized, false)
  assert.equal(pass(larger), false)
  const empty = newGroup(org(), "empty")
  assert.equal(
    cycleOf(
      change(empty, {
        type: "terms",
        terms: { ...cycleOf(empty).terms, positions: 2 },
      }),
    ).positions.length,
    2,
  )
})
test("removal retains acceptance history, frees assignments/capacity, and re-add requires fresh acceptance", () => {
  let g = sample()
  const old = structuredClone(g)
  g = change(g, { type: "remove", id: "c1" })
  assert.equal(reserved(cycleOf(g)), 2)
  assert.equal(cycleOf(g).positions[0].holders.length, 0)
  assert.equal(cycleOf(g).participants[0].acceptances.length, 1)
  assert.equal(pass(g), false)
  g = change(g, { type: "readd", id: "c1" })
  g = change(g, { type: "admit", id: "c1", equivalent: 1 })
  g = change(g, { type: "assign", position: 1, id: "c1", fraction: 1 })
  assert.equal(accepted(cycleOf(g), cycleOf(g).participants[0]), false)
  g = acceptAll(g)
  g = change(g, { type: "finalize" })
  assert.equal(pass(g), true)
  assert.equal(cycleOf(old).participants[0].status, "approved")
})
test("material global terms invalidate all affected acceptances, including changing back", () => {
  for (const patch of [
    { amount: 60000 },
    { frequency: "Weekly" },
    { feeValue: 3 },
    { rules: "Additional meeting agreement." },
    { notesToMembers: "New material terms." },
    { startDate: "2099-12-20" },
    { defaultChargeEnabled: true },
  ]) {
    let g = sample()
    const original = cycleOf(g).terms
    g = change(g, { type: "terms", terms: { ...original, ...patch } })
    assert.equal(
      admitted(cycleOf(g)).some((p) => accepted(cycleOf(g), p)),
      false,
    )
    assert.equal(pass(g), false)
    g = change(g, { type: "terms", terms: original })
    assert.equal(
      admitted(cycleOf(g)).some((p) => accepted(cycleOf(g), p)),
      false,
    )
    g = acceptAll(g)
    assert.equal(pass(g), true)
    assert.equal(cycleOf(g).participants[0].acceptances.length, 2)
  }
})
test("cosmetic Group edits preserve acceptance; positional changes invalidate affected Members and finalization", () => {
  let g = sample()
  g = change(g, {
    type: "terms",
    terms: {
      ...cycleOf(g).terms,
      name: "Renamed Group",
      description: "New description",
    },
  })
  assert.equal(pass(g), true)
  g = change(g, { type: "unassign", position: 1, id: "c1" })
  g = change(g, { type: "unassign", position: 2, id: "c2" })
  g = change(g, { type: "assign", position: 2, id: "c1", fraction: 1 })
  g = change(g, { type: "assign", position: 1, id: "c2", fraction: 1 })
  assert.deepEqual(
    cycleOf(g).participants.map((p) => accepted(cycleOf(g), p)),
    [false, false, true, true],
  )
  assert.equal(cycleOf(g).orderFinalized, false)
})
test("explicit Member identity, complete allocation, current reviewed terms and confirmation are required", () => {
  const g = sample("Commitments pending"),
    a = {
      type: "accept",
      id: "c1",
      actorId: "c1",
      confirmed: true,
      reviewedTerms: memberTerms(cycleOf(g), "c1"),
    }
  assert.throws(() => change(g, { ...a, actorId: org().ownerMemberId }))
  assert.throws(() => change(g, { ...a, confirmed: false }))
  assert.throws(() => change(g, { ...a, reviewedTerms: "stale" }))
  let partial = sample("Positions incomplete")
  assert.throws(() =>
    change(partial, {
      ...a,
      id: "c4",
      actorId: "c4",
      reviewedTerms: memberTerms(cycleOf(partial), "c4"),
    }),
  )
  assert.equal(
    accepted(cycleOf(change(g, a)), cycleOf(change(g, a)).participants[0]),
    true,
  )
})
test("reminders never count as acceptance", () => {
  const g = change(sample("Commitments pending"), { type: "remind", id: "c1" })
  assert.equal(cycleOf(g).participants[0].reminderSent, true)
  assert.equal(pass(g), false)
})
test("fee is positive, disclosed, on Scheduled Payout Value and configurable per demo world", () => {
  const t = cycleOf(sample()).terms
  assert.equal(
    feePerPosition({ ...t, feeType: "percentage", feeValue: 2 }),
    3000,
  )
  for (const feeValue of [0, -1, NaN, 11])
    assert.ok(configurationErrors({ ...t, feeValue }, bounds).length)
  assert.equal(
    configurationErrors({ ...t, feeValue: 11 }, {
      maxPercentage: 15,
      maxFlat: 100000,
    }).length,
    0,
  )
  assert.ok(
    configurationErrors({ ...t, recipientPolicy: "normal" }, bounds).length,
  )
  assert.throws(() =>
    change(sample(), {
      type: "terms",
      terms: { ...t, recipientPolicy: "normal" },
    }),
  )
})
test("activation rechecks all gates and Organization eligibility; no manual bypass", () => {
  for (const scenario of [
    "New draft",
    "Recruitment in progress",
    "Positions incomplete",
    "Commitments pending",
    "Reconfirmation required",
  ])
    assert.throws(() =>
      change(sample(scenario), { type: "activate", confirmed: true }),
    )
  assert.throws(() => change(sample(), { type: "activate", confirmed: false }))
  for (const status of ["approved", "restricted", "suspended", "closed"])
    assert.throws(() =>
      change(sample(), { type: "activate", confirmed: true }, {
        ...org(),
        status,
      }),
    )
  assert.throws(() =>
    change(sample(), { type: "activate", confirmed: true }, {
      ...org(),
      settlement: undefined,
    }),
  )
})
test("activation protects complete snapshot and selects current Cycle without financial commencement", () => {
  const original = sample(),
    g = change(original, { type: "activate", confirmed: true }),
    c = cycleOf(g)
  assert.equal(c.status, "activated")
  assert.equal(g.currentCycleId, c.id)
  assert.deepEqual(c.snapshot.terms, c.terms)
  assert.deepEqual(c.snapshot.participants, c.participants)
  assert.deepEqual(c.snapshot.positions, c.positions)
  assert.equal(financiallyCommenced(c), false)
  assert.equal("rounds" in c, false)
  for (const action of [
    { type: "remove", id: "c1" },
    { type: "terms", terms: c.terms },
    { type: "unassign", position: 1, id: "c1" },
    { type: "recruit", member: DIRECTORY[4] },
  ])
    assert.throws(() => change(g, action), /protected/)
  assert.equal(cycleOf(original).status, "draft")
})
test("draft and activated Cycles cancel deliberately; reason, history and snapshot retained", () => {
  for (const scenario of ["New draft", "Activated · no financial activity"]) {
    const g = sample(scenario)
    assert.throws(() =>
      change(g, { type: "cancel", confirmed: false, reason: "Valid reason" }),
    )
    assert.throws(() =>
      change(g, { type: "cancel", confirmed: true, reason: "" }),
    )
    const cancelled = change(g, {
      type: "cancel",
      confirmed: true,
      reason: "Participants requested postponement.",
    })
    assert.equal(cancelled.id, g.id)
    assert.equal(cycleOf(cancelled).status, "cancelled")
    assert.deepEqual(cycleOf(cancelled).snapshot, cycleOf(g).snapshot)
    assert.equal(cancelled.history.length, g.history.length + 1)
    assert.throws(() => change(cancelled, { type: "remove", id: "c1" }))
  }
})
test("each financial commencement indicator individually blocks normal cancellation", () => {
  for (const field of [
    "obligations",
    "payments",
    "allocations",
    "payouts",
    "postings",
  ]) {
    const g = sample("Activated · no financial activity")
    cycleOf(g).financial[field] = 1
    assert.throws(
      () =>
        change(g, {
          type: "cancel",
          confirmed: true,
          reason: "Cannot cancel now",
        }),
      /financial commencement/,
    )
  }
})
test("Organization separation and unrestricted creation are enforced", () => {
  assert.throws(
    () =>
      change(sample(), { type: "remove", id: "c1" }, {
        ...org(),
        id: "another-tenant",
      }),
    /another Organization/,
  )
  for (const status of [
    "draft",
    "restricted",
    "suspended",
    "closed",
    "closure-pending",
  ])
    assert.throws(() => newGroup({ ...org(), status }, "bad"))
  const a = sample(),
    b = sample()
  const edited = change(a, { type: "remove", id: "c1" })
  assert.equal(reserved(cycleOf(edited)), 2)
  assert.equal(reserved(cycleOf(b)), 3)
})
