import test from "node:test"
import assert from "node:assert/strict"
import { seedAccess, seedSession } from "../src/access/seeds.ts"
import { changeAccess } from "../src/access/service.ts"
import {
  hasPermission,
  hasAnyPermission,
  canAccessModule,
  effectivePermissions,
  authoritySnapshot,
} from "../src/access/authorization.ts"
import { permittedActions } from "../src/operations/review.ts"
import { applyTriage } from "../src/operations/model.ts"
import {
  previewDecision,
  executeDecision,
} from "../src/operations/decisions.ts"
import { projectCases } from "../src/operations/sources.ts"
import { seedPersona, demoPersonas } from "../src/clients/seeds.ts"
import { seedOrganization } from "../src/organizations/seeds.ts"
import { operationsDemoWorld } from "../src/operations/seeds.ts"
const reason = "Approved staffing responsibility change",
  at = "2100-01-01T00:00:00Z"
const setup = () => {
  const state = seedAccess()
  return {
    state,
    admin: seedSession("access-admin", state),
    other: seedSession("access-admin-2", state),
    finance: seedSession("finance-reviewer", state),
  }
}
test("exact identifiers, default deny and active status, including forged persona-only sessions", () => {
  const s = seedSession()
  assert.ok(hasPermission(s, "operations.case.view"))
  for (const p of [
    "operations",
    "operations.case",
    "operations.case.view.extra",
    "OPERATIONS.CASE.VIEW",
    "revenue_share.confirm",
  ])
    assert.equal(hasPermission(s, p), false)
  for (const s of [
    null,
    { kind: "tcs-internal", personaId: "ops-supervisor" },
    seedSession("unknown"),
    seedSession("pending-user"),
    seedSession("suspended-user"),
    seedSession("deactivated-user"),
  ]) {
    assert.deepEqual(effectivePermissions(s), [])
    assert.equal(canAccessModule(s, "operations"), false)
  }
  assert.equal(canAccessModule(seedSession("ops-supervisor"), "unknown"), false)
})
test("multiple active roles yield deduplicated union and ignore unknown or disabled roles", () => {
  const s = seedSession("multi-reviewer"),
    expected = [
      ...new Set([
        ...effectivePermissions(seedSession("verification-reviewer")),
        ...effectivePermissions(seedSession("finance-reviewer")),
      ]),
    ].sort()
  assert.deepEqual(effectivePermissions(s), expected)
  s.access.users
    .find((u) => u.id === s.personaId)
    .roleIds.push("missing", "finance")
  assert.deepEqual(effectivePermissions(s), expected)
  s.access.roles.find((r) => r.id === "finance").active = false
  assert.equal(hasPermission(s, "revenue_share.confirm"), false)
})
test("access administrator and Operations supervisor have deliberately separate authority", () => {
  assert.ok(canAccessModule(seedSession("access-admin"), "access-management"))
  assert.equal(
    canAccessModule(seedSession("access-admin"), "operations"),
    false,
  )
  assert.equal(
    canAccessModule(seedSession("ops-supervisor"), "access-management"),
    false,
  )
  assert.ok(
    hasPermission(seedSession("ops-supervisor"), "thrift.force_close.approve"),
  )
  assert.equal(
    hasPermission(seedSession("access-admin"), "thrift.force_close.approve"),
    false,
  )
  assert.throws(() =>
    changeAccess(seedSession("ops-supervisor"), {
      type: "create-user",
      name: "Test",
      identifier: "test",
      status: "Active",
      roleIds: [],
    }),
  )
})
test("creation, activation, suspension, reactivation and permanent deactivation retain history", () => {
  const { state, admin } = setup()
  changeAccess(
    admin,
    {
      type: "create-user",
      name: "Kemi",
      identifier: "kemi@corestack.example",
      status: "Pending",
      roleIds: ["analyst"],
    },
    "",
    at,
  )
  const id = state.users.at(-1).id,
    s = seedSession(id, state)
  assert.equal(hasPermission(s, "operations.case.view"), false)
  changeAccess(admin, { type: "status", id, status: "Active" }, "", at)
  assert.ok(hasPermission(s, "operations.case.view"))
  assert.throws(() =>
    changeAccess(admin, { type: "status", id, status: "Suspended" }, ""),
  )
  changeAccess(admin, { type: "status", id, status: "Suspended" }, reason, at)
  assert.equal(hasPermission(s, "operations.case.view"), false)
  changeAccess(admin, { type: "status", id, status: "Active" }, reason, at)
  assert.ok(hasPermission(s, "operations.case.view"))
  assert.ok(state.history.some((e) => e.action === "User Reactivated"))
  const history = JSON.stringify(state.history)
  changeAccess(admin, { type: "status", id, status: "Deactivated" }, reason, at)
  assert.equal(hasPermission(s, "operations.case.view"), false)
  assert.deepEqual(state.users.at(-1).roleIds, ["analyst"])
  assert.equal(JSON.stringify(state.history.slice(0, -1)), history)
  assert.throws(() =>
    changeAccess(admin, { type: "status", id, status: "Active" }, reason),
  )
  assert.throws(() =>
    changeAccess(admin, {
      type: "create-user",
      name: "Other",
      identifier: "KEMI@CORESTACK.EXAMPLE",
      status: "Pending",
      roleIds: [],
    }),
  )
})
test("role removal, assignment and role-permission changes immediately affect existing session", () => {
  const { state, admin, finance } = setup()
  assert.ok(hasPermission(finance, "revenue_share.confirm"))
  changeAccess(
    admin,
    { type: "remove", id: finance.personaId, roleId: "finance" },
    reason,
  )
  assert.equal(hasPermission(finance, "revenue_share.confirm"), false)
  changeAccess(
    admin,
    { type: "assign", id: finance.personaId, roleId: "finance" },
    reason,
  )
  assert.ok(hasPermission(finance, "revenue_share.confirm"))
  changeAccess(
    admin,
    {
      type: "permission-remove",
      id: "finance",
      permission: "revenue_share.confirm",
    },
    reason,
  )
  assert.equal(hasPermission(finance, "revenue_share.confirm"), false)
  changeAccess(
    admin,
    {
      type: "permission-add",
      id: "finance",
      permission: "revenue_share.confirm",
    },
    reason,
  )
  assert.ok(hasPermission(finance, "revenue_share.confirm"))
  assert.equal(state.history.length, 4)
  assert.throws(() =>
    changeAccess(
      admin,
      { type: "permission-add", id: "finance", permission: "revenue_share" },
      reason,
    ),
  )
})
test("direct and indirect self-escalation fail atomically; another administrator can assign authority", () => {
  const { state, admin, other } = setup(),
    before = JSON.stringify(state)
  for (const action of [
    { type: "assign", id: admin.personaId, roleId: "supervisor" },
    {
      type: "permission-add",
      id: "access-admin",
      permission: "thrift.force_close.approve",
    },
  ])
    assert.throws(() => changeAccess(admin, action, reason), /Self|self/)
  assert.equal(JSON.stringify(state), before)
  changeAccess(
    other,
    { type: "assign", id: admin.personaId, roleId: "supervisor" },
    reason,
  )
  assert.ok(hasPermission(admin, "thrift.force_close.approve"))
  assert.ok(state.history.at(-1).privileged)
  assert.throws(
    () =>
      changeAccess(
        other,
        { type: "remove", id: admin.personaId, roleId: "supervisor" },
        "",
      ),
    /reason/,
  )
})
test("role lifecycle cannot bypass self-escalation and baseline roles remain protected", () => {
  const { state, admin, other } = setup()
  changeAccess(admin, {
    type: "create-role",
    name: "Custom review",
    purpose: "Limited case review",
  })
  const role = state.roles.at(-1)
  changeAccess(other, { type: "assign", id: admin.personaId, roleId: role.id })
  changeAccess(admin, {
    type: "update-role",
    id: role.id,
    name: role.name,
    purpose: role.purpose,
    active: false,
  })
  changeAccess(
    admin,
    {
      type: "permission-add",
      id: role.id,
      permission: "revenue_share.confirm",
    },
    reason,
  )
  assert.throws(
    () =>
      changeAccess(
        admin,
        {
          type: "update-role",
          id: role.id,
          name: role.name,
          purpose: role.purpose,
          active: true,
        },
        reason,
      ),
    /Self/,
  )
  assert.throws(
    () =>
      changeAccess(admin, {
        type: "update-role",
        id: "analyst",
        name: "Analyst",
        purpose: "Triage only",
        active: false,
      }),
    /Baseline/,
  )
})
test("last active administrator safeguard and historical authority snapshots survive later changes", () => {
  const { state, admin, other } = setup()
  const snap = authoritySnapshot(other)
  changeAccess(
    admin,
    { type: "status", id: other.personaId, status: "Deactivated" },
    reason,
  )
  assert.throws(
    () =>
      changeAccess(
        admin,
        { type: "status", id: admin.personaId, status: "Suspended" },
        reason,
      ),
    /at least one/,
  )
  assert.ok(snap.roles.some((r) => r.name === "Access Administrator"))
  const history = JSON.stringify(state.history)
  changeAccess(admin, {
    type: "update-user",
    id: other.personaId,
    name: "Grace Updated",
    identifier: "grace@corestack.example",
  })
  assert.equal(JSON.stringify(state.history.slice(0, -1)), history)
})
test("case action permissions are exact; role labels do not grant authority", () => {
  const { state, admin } = setup(),
    s = seedSession("verification-reviewer", state),
    c = { type: "Member KYC Review", status: "New" }
  assert.ok(permittedActions(c, s).includes("approve"))
  assert.ok(!permittedActions(c, seedSession()).includes("approve"))
  changeAccess(admin, {
    type: "permission-remove",
    id: "verification",
    permission: "clients.verification.approve",
  })
  assert.ok(!permittedActions(c, s).includes("approve"))
  assert.ok(permittedActions(c, s).includes("reject"))
  state.roles.find((r) => r.id === "verification").name =
    "Operations Supervisor"
  assert.equal(hasPermission(s, "thrift.force_close.approve"), false)
})
test("read-only case authority cannot mutate triage through direct calls", () => {
  const s = seedSession()
  s.access.roles.find((r) => r.id === "analyst").permissions = [
    "operations.case.view",
  ]
  const c = { status: "New", priority: "Normal" }
  assert.throws(
    () =>
      applyTriage(c, undefined, { type: "note", text: "unauthorized" }, s, at),
    /permission/,
  )
  assert.throws(
    () =>
      applyTriage(
        c,
        undefined,
        { type: "assign", assignee: "finance-reviewer" },
        s,
        at,
      ),
    /permission/,
  )
  assert.equal(
    hasAnyPermission(s, ["operations.case.note", "operations.case.escalate"]),
    false,
  )
})
function sourceFixture() {
  const org = seedOrganization(seedPersona("verified"), "active")
  return {
    clients: demoPersonas.map((p) => seedPersona(p.id)),
    organizations: [org],
    worlds: [operationsDemoWorld(org)],
  }
}
const decisionInput = (action) => ({
  action,
  reason,
  evidence: ["Verified bank and source evidence"],
  evidenceConfirmed: true,
})
test("direct decision and previously previewed decision recheck live permission; historical actor survives changes", () => {
  const { state, admin } = setup(),
    reviewer = seedSession("verification-reviewer", state),
    sources = sourceFixture(),
    c = projectCases(sources, reviewer).find(
      (c) => c.type === "Member KYC Review" && c.status === "New",
    )
  const preview = previewDecision(
    sources,
    c.id,
    decisionInput("approve"),
    reviewer,
    at,
  )
  for (const id of [
    "ops-analyst",
    "access-admin",
    "suspended-user",
    "deactivated-user",
  ])
    assert.throws(() =>
      previewDecision(
        sources,
        c.id,
        decisionInput("approve"),
        seedSession(id, state),
        at,
      ),
    )
  changeAccess(admin, {
    type: "remove",
    id: reviewer.personaId,
    roleId: "verification",
  })
  assert.throws(() => executeDecision(sources, preview, reviewer, at))
  changeAccess(admin, {
    type: "assign",
    id: reviewer.personaId,
    roleId: "verification",
  })
  const result = executeDecision(sources, preview, reviewer, at),
    record = result.decision,
    snapshot = JSON.stringify(record)
  assert.equal(record.authority.name, "Bola")
  assert.ok(
    record.authority.permissions.includes("clients.verification.approve"),
  )
  changeAccess(admin, {
    type: "remove",
    id: reviewer.personaId,
    roleId: "verification",
  })
  assert.equal(JSON.stringify(record), snapshot)
})
test("finance role revocation denies receipt confirmation and supervisor independence is preserved after multi-role assignment", () => {
  const { state, admin, finance } = setup(),
    sources = sourceFixture(),
    cases = projectCases(sources, finance),
    revenue = cases.find(
      (c) =>
        c.type.startsWith("TCS Revenue Share") &&
        permittedActions(c, finance).includes("confirm-receipt"),
    )
  assert.ok(revenue)
  assert.ok(permittedActions(revenue, finance).includes("confirm-receipt"))
  changeAccess(
    admin,
    { type: "remove", id: finance.personaId, roleId: "finance" },
    reason,
  )
  assert.throws(() =>
    previewDecision(
      sources,
      revenue.id,
      decisionInput("confirm-receipt"),
      finance,
      at,
    ),
  )
  changeAccess(
    admin,
    { type: "assign", id: finance.personaId, roleId: "finance" },
    reason,
  )
  const force = projectCases(sources, finance).find(
    (c) => c.type === "Force Close Request",
  )
  const recommended = executeDecision(
    sources,
    previewDecision(sources, force.id, decisionInput("recommend"), finance, at),
    finance,
    at,
  ).sources
  changeAccess(
    admin,
    { type: "assign", id: finance.personaId, roleId: "supervisor" },
    reason,
  )
  assert.throws(
    () =>
      previewDecision(
        recommended,
        force.id,
        decisionInput("approve"),
        finance,
        at,
      ),
    /Independent/,
  )
  assert.doesNotThrow(() =>
    previewDecision(
      recommended,
      force.id,
      decisionInput("approve"),
      seedSession("ops-supervisor", state),
      at,
    ),
  )
})

test('permission removal updates every role holder and access audit contains immutable required fields',()=>{
 const {state,admin,finance}=setup(),multi=seedSession('multi-reviewer',state)
 assert.ok(hasPermission(finance,'revenue_share.confirm'));assert.ok(hasPermission(multi,'revenue_share.confirm'))
 const before=structuredClone(state.roles.find(r=>r.id==='finance'))
 changeAccess(admin,{type:'permission-remove',id:'finance',permission:'revenue_share.confirm'},reason,at)
 assert.equal(hasPermission(finance,'revenue_share.confirm'),false);assert.equal(hasPermission(multi,'revenue_share.confirm'),false)
 assert.ok(hasPermission(multi,'clients.verification.approve'))
 const event=state.history.at(-1);assert.equal(event.actor.userId,admin.personaId);assert.equal(event.target,'finance');assert.equal(event.at,at);assert.equal(event.reason,reason);assert.deepEqual(event.before,before);assert.ok(!event.after.permissions.includes('revenue_share.confirm'));assert.ok(event.privileged)
 const snapshot=JSON.stringify(event);changeAccess(admin,{type:'permission-add',id:'finance',permission:'revenue_share.confirm'},reason,at);assert.equal(JSON.stringify(state.history[0]),snapshot)
})
test('pending direct decisions and elevated exceptional reopening enforce current permission',()=>{
 const {state,admin}=setup(),sources=sourceFixture(),supervisor=seedSession('ops-supervisor',state),c=projectCases(sources,supervisor).find(c=>c.type==='Member KYC Review'&&c.status==='New')
 assert.throws(()=>previewDecision(sources,c.id,decisionInput('approve'),seedSession('pending-user',state),at))
 const final={type:'Payout Dispute',status:'Resolved',context:[],disputeProcesses:[{process:{stage:'final'}}]}
 assert.ok(permittedActions(final,supervisor).includes('exceptional-reopen'))
 assert.ok(!permittedActions(final,seedSession('finance-reviewer',state)).includes('exceptional-reopen'))
 changeAccess(admin,{type:'permission-remove',id:'supervisor',permission:'cases.exceptional_reopen'},reason,at)
 assert.ok(!permittedActions(final,supervisor).includes('exceptional-reopen'))
})
