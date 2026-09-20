import { seedSession } from '../src/access/seeds.ts'
﻿import test from "node:test"
import assert from "node:assert/strict"
import { seedPersona, demoPersonas } from "../src/clients/seeds.ts"
import { seedOrganization } from "../src/organizations/seeds.ts"
import { OrganizationSession } from "../src/organizations/session.ts"
import { operationsDemoWorld } from "../src/operations/seeds.ts"
import { projectCases } from "../src/operations/sources.ts"
import {
  applyTriage,
  filterCases,
  isResolved,
  ageHours,
  caseClock,
  money,
} from "../src/operations/model.ts"
import { reconciliationDemo } from "../src/reconciliation/seeds.ts"
import { reconcile } from "../src/reconciliation/service.ts"
const actor = seedSession("ops-analyst"),
  now = "2100-01-01T00:00:00Z"
function fixture() {
  const member = seedPersona("verified"),
    org = seedOrganization(member, "active")
  return {
    clients: demoPersonas.map((p) => seedPersona(p.id)),
    organizations: [org, seedOrganization(member, "pending")],
    worlds: [operationsDemoWorld(org)],
  }
}
test("representative queue uses existing records from all four modules without duplicate identities", () => {
  const s = fixture(),
    before = structuredClone(s),
    cases = projectCases(s, actor)
  assert.deepEqual(s, before)
  assert.equal(cases.length, new Set(cases.map((c) => c.id)).size)
  assert.deepEqual(projectCases(s, actor), cases)
  assert.ok(
    cases.length < 30,
    "compact scenarios, no flood of unrelated delayed settlements",
  )
  for (const type of [
    "Member KYC Review",
    "Organization Application Review",
    "Amount Mismatch",
    "Unallocated Payment",
    "Settlement Variance",
    "Manual Contribution Review",
    "Late Optional Contribution",
    "Payout Dispute",
    "Organization Payout Breach",
    "TCS Revenue Share — Awaiting Confirmation",
    "Post-Payout Recovery",
    "Exit Settlement Breach",
    "Cycle Amendment Request",
    "Force Close Request",
  ])
    assert.ok(
      cases.some((c) => c.type === type),
      type,
    )
  assert.deepEqual(
    new Set(cases.map((c) => c.module)),
    new Set(["Clients", "Organizations", "Thrift", "Payments"]),
  )
})
test("one source exception stays one case on replay; source updates retain identity and triage", () => {
  const org = seedOrganization(seedPersona("verified"), "active"),
    demo = reconciliationDemo(org, "replay", "Underpayment exception")
  const sources = {
    clients: [],
    organizations: [org],
    worlds: [{ groups: [demo.group], finance: demo.state }],
  }
  const c = projectCases(sources, actor).find(
      (c) => c.type === "Amount Mismatch",
    ),
    metadata = {
      [c.id]: applyTriage(
        c,
        undefined,
        { type: "assign", assignee: actor.personaId },
        actor,
        now,
      ),
    }
  sources.worlds[0].finance = reconcile(
    demo.state,
    [demo.group],
    org,
    demo.state.referenceAt,
  )
  let current = projectCases(sources, actor, metadata)
  assert.equal(current.filter((x) => x.id === c.id).length, 1)
  const original = sources.worlds[0].finance.cases.find((f) =>
    c.id.endsWith(f.id),
  )
  original.reason = "Provider investigation updated the original issue"
  original.status = "resolved"
  original.history.push({
    at: now,
    actor: "Source service",
    action: "Source resolved",
    after: "resolved",
  })
  current = projectCases(sources, actor, metadata).find((x) => x.id === c.id)
  assert.equal(current.reason, original.reason)
  assert.equal(current.status, "Resolved")
  assert.equal(current.assignee, actor.personaId)
  assert.ok(current.timeline.some((e) => e.action === "Source resolved"))
})
test("assignment, reassign, unassign and persona-specific My Queue", () => {
  const s = fixture(),
    c = projectCases(s, actor).find((c) => !isResolved(c))
  let t = applyTriage(
    c,
    undefined,
    { type: "assign", assignee: actor.personaId },
    actor,
    now,
  )
  let cases = projectCases(s, actor, { [c.id]: t })
  assert.equal(filterCases(cases, { view: "My Queue" }, actor, now).length, 1)
  const other = { ...actor, personaId: "finance-reviewer" }
  assert.equal(filterCases(cases, { view: "My Queue" }, other, now).length, 0)
  t = applyTriage(
    cases.find((x) => x.id === c.id),
    t,
    { type: "assign", assignee: other.personaId },
    actor,
    now,
  )
  cases = projectCases(s, actor, { [c.id]: t })
  assert.equal(filterCases(cases, { view: "My Queue" }, other, now).length, 1)
  t = applyTriage(
    cases.find((x) => x.id === c.id),
    t,
    { type: "assign", assignee: "" },
    other,
    now,
  )
  assert.equal(
    projectCases(s, actor, { [c.id]: t }).find((x) => x.id === c.id).status,
    "New",
  )
  assert.throws(() =>
    applyTriage(
      c,
      t,
      { type: "assign", assignee: "organization-owner" },
      actor,
      now,
    ),
  )
})
test("practical combined filters, case reference search, age and resolved history", () => {
  const cases = projectCases(fixture(), actor),
    c = cases.find((c) => c.type === "Settlement Variance")
  assert.equal(
    filterCases(
      cases,
      {
        view: "All Cases",
        search: c.reference.toLowerCase(),
        module: "Payments",
        priority: "High",
        organizationId: c.organizationId,
        assignment: "unassigned",
        olderThanHours: 24,
      },
      actor,
      now,
    )[0].id,
    c.id,
  )
  assert.equal(
    filterCases(cases, { search: c.reference, module: "Clients" }, actor, now)
      .length,
    0,
  )
  assert.ok(
    filterCases(cases, { view: "History / Resolved" }, actor, now).length > 0,
  )
  assert.ok(filterCases(cases, { view: "My Queue" }, actor, now).length === 0)
  assert.ok(ageHours(c, caseClock(c, now)) > 0)
})
test("triage notes and request history are internal and never mutate financial/product state", () => {
  const s = fixture(),
    before = structuredClone(s),
    c = projectCases(s, actor).find((c) => c.type === "Payout Dispute")
  let t = applyTriage(
    c,
    undefined,
    { type: "note", text: "Evidence inspected internally" },
    actor,
    now,
  )
  t = applyTriage(
    c,
    t,
    {
      type: "status",
      status: "Awaiting Information",
      text: "Organization: provide the transfer receipt",
    },
    actor,
    now,
  )
  const next = projectCases(s, actor, { [c.id]: t }).find((x) => x.id === c.id)
  assert.equal(next.status, "Awaiting Information")
  assert.equal(next.sourceStatus, "disputed")
  assert.equal(next.timeline.filter((e) => e.origin === "Internal").length, 2)
  assert.ok(next.nextAction.includes("no message"))
  assert.deepEqual(s, before)
  assert.throws(() =>
    applyTriage(
      c,
      t,
      { type: "status", status: "Resolved", text: "resolve" },
      actor,
      now,
    ),
  )
  assert.throws(() =>
    applyTriage(
      c,
      t,
      { type: "status", status: "Escalated", text: " " },
      actor,
      now,
    ),
  )
  assert.throws(() =>
    applyTriage(
      { ...c, status: "Resolved" },
      t,
      { type: "note", text: "edit history" },
      actor,
      now,
    ),
  )
})
test("financial context, evidence, payout snapshot and linked source identity", () => {
  const s = fixture(),
    cases = projectCases(s, actor)
  const batch = cases.find((c) => c.type === "Settlement Variance")
  assert.ok(batch.financial.some((f) => f.label === "Actual settlement"))
  assert.ok(
    batch.financial.some((f) => f.label === "Variance (actual minus expected)"),
  )
  assert.ok(
    s.worlds[0].finance.settlements.some((b) => b.id === batch.source.id),
  )
  const payout = cases.find((c) => c.type === "Payout Dispute")
  assert.ok(
    payout.context.some((f) => f.label === "Transfer / beneficiary snapshot"),
  )
  assert.ok(payout.timeline.some((e) => e.action === "Member disputed payout"))
  assert.ok(payout.evidence.length)
  const manual = cases.find((c) => c.type === "Manual Contribution Review")
  assert.ok(
    manual.context.some((f) => f.value.includes("Not provider-confirmed")),
  )
  const force = cases.find((c) => c.type === "Force Close Request")
  assert.ok(force.evidence.length)
  assert.ok(
    force.financial.some(
      (f) => f.label === "Requested Organization absorption",
    ),
  )
})
test("revenue awaiting confirmation and mismatch use one source-linked case; no settlement by triage", () => {
  const s = fixture(),
    r = s.worlds[0].finance.receivables.find(
      (r) => r.paymentStatus === "awaiting-confirmation",
    )
  const c = projectCases(s, actor).find((c) => c.source.id === r.id)
  assert.ok(c)
  assert.ok(c.context.some((f) => f.label === "Corestack account snapshot"))
  assert.ok(
    c.financial.some(
      (f) =>
        f.label === "Mismatch (recorded minus due)" && f.value === money(0),
    ),
  )
  const t = applyTriage(
    c,
    undefined,
    { type: "status", status: "Awaiting Approval", text: "Evidence prepared" },
    actor,
    now,
  )
  projectCases(s, actor, { [c.id]: t })
  assert.equal(r.paymentStatus, "awaiting-confirmation")
  assert.notEqual(r.status, "settled")
  const org = s.organizations[0],
    d = reconciliationDemo(org, "mismatch", "TCS share payment exception")
  const mismatch = projectCases(
    {
      clients: [],
      organizations: [org],
      worlds: [{ groups: [d.group], finance: d.state }],
    },
    actor,
  )
  assert.equal(
    mismatch.filter((c) => c.type === "TCS Revenue Share Payment Exception")
      .length,
    1,
  )
})
test("cross-tenant joins rejected and Organization filtering never leaks other tenant cases", () => {
  const s = fixture(),
    other = seedOrganization(seedPersona("verified"), "adaeze")
  s.organizations.push(other)
  s.worlds.push(operationsDemoWorld(other))
  const cases = projectCases(s, actor)
  const filtered = filterCases(cases, { organizationId: other.id }, actor, now)
  assert.ok(filtered.length)
  assert.ok(filtered.every((c) => c.organizationId === other.id))
  assert.equal(new Set(cases.map((c) => c.id)).size, cases.length)
  s.worlds[0].groups.push(s.worlds[1].groups[0])
  assert.throws(() => projectCases(s, actor), /tenant/)
})
test("Member and Organization sessions cannot access Operations projection or triage", () => {
  const s = fixture(),
    c = projectCases(s, actor)[0]
  for (const invalid of [
    null,
    { kind: "organization", personaId: "ops-analyst" },
    seedSession("unknown"),
  ]) {
    assert.throws(() => projectCases(s, invalid))
    assert.throws(() => filterCases([c], {}, invalid, now))
    assert.throws(() =>
      applyTriage(
        c,
        undefined,
        { type: "note", text: "private" },
        invalid,
        now,
      ),
    )
  }
})
test("shared Organization demo loading is idempotent and remains selectable by its Owner", () => {
  const session = new OrganizationSession(),
    member = seedPersona("verified"),
    org = session.ensureOperationsDemo(member)
  assert.equal(session.ensureOperationsDemo(member), org)
  assert.equal(session.all().length, 2)
  session.select(member, "active")
  assert.equal(session.current(member), org)
})
