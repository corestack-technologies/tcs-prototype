import test from "node:test"
import assert from "node:assert/strict"
import { seedSession } from "../src/access/seeds.ts"
import { hasPermission } from "../src/access/authorization.ts"
import {
  createSettings,
  businessClock,
  previewChange,
  applyChange,
  contactsVerified,
  readHistory,
  platformSettings,
} from "../src/settings/service.ts"
import { protectedHistory } from "../src/settings/history.ts"
import {
  availableInternalReports,
  generateInternalReport,
} from "../src/reports/internalService.ts"
const at = "2026-09-17T12:00:00.000Z",
  admin = () => seedSession("settings-admin")
const req = (date) => ({ category: "Business Date", mode: "CONTROLLED", date })
const apply = (s, r, b = "", session = admin()) => {
  const p = previewChange(session, r, "UAT lifecycle validation", b, s, at)
  return applyChange(session, p, true, b, s, at)
}
test("Real Time uses environment calendar date, Controlled changes only business time", () => {
  const s = createSettings()
  assert.equal(businessClock(s, at).businessDate, "2026-09-17")
  assert.equal(
    businessClock(s, "2026-09-17T23:30:00Z").businessDate,
    "2026-09-18",
  )
  apply(s, req("2026-10-01"))
  assert.equal(businessClock(s, at).businessDate, "2026-10-01")
  assert.equal(businessClock(s, at).actualTimestamp, at)
  assert.equal(s.history[0].at, at)
  apply(s, req("2026-10-02"))
  assert.equal(s.history[1].action, "ADVANCE")
  assert.equal(s.history.length, 2)
})
test("protected rewind, forward only, reset warnings and preserved history", () => {
  const s = createSettings()
  assert.throws(
    () => apply(s, req("2026-09-01"), "2026-09-10"),
    /Rewind rejected/,
  )
  apply(s, req("2026-10-01"))
  assert.throws(() => apply(s, req("2026-09-30")), /future/)
  const previous = s.history[0],
    p = previewChange(
      admin(),
      { category: "Business Date", mode: "REAL_TIME" },
      "Reset test clock",
      "2026-10-01",
      s,
      at,
    )
  assert.ok(p.warnings.some((w) => w.includes("remain preserved")))
  applyChange(admin(), p, true, "2026-10-01", s, at)
  assert.equal(s.mode, "REAL_TIME")
  assert.equal(s.history[0], previous)
  assert.equal(s.history.length, 2)
  assert.throws(() => {
    s.history[0].reason = "changed"
  }, TypeError)
})
test("permissions default deny and separate runtime/date authority", () => {
  for (const id of [
    "ops-analyst",
    "ops-supervisor",
    "access-admin",
    "settings-viewer",
    "pending-user",
    "suspended-user",
    "deactivated-user",
  ])
    assert.throws(
      () => apply(createSettings(), req("2026-10-01"), "", seedSession(id)),
      /denied/,
    )
  for (const session of [null, { kind: "member" }, { kind: "organization" }])
    assert.throws(
      () => previewChange(session, req("2026-10-01"), "Reason"),
      /denied/,
    )
  assert.throws(
    () =>
      apply(
        createSettings(),
        req("2026-10-01"),
        "",
        seedSession("runtime-manager"),
      ),
    /denied/,
  )
  assert.throws(
    () =>
      apply(
        createSettings(),
        {
          category: "Runtime Control",
          key: "CLIENT_VERIFICATION_MODE",
          value: "EMAIL",
        },
        "",
        seedSession("date-manager"),
      ),
    /denied/,
  )
  assert.equal(
    hasPermission(seedSession("access-admin"), "settings.view"),
    false,
  )
})
test("production, invalid dates, reasons, confirmation and stale preview rejected", () => {
  assert.throws(
    () => apply(createSettings("Production"), req("2026-10-01")),
    /non-production/,
  )
  for (const date of ["", "invalid", "2026-02-30"])
    assert.throws(() => apply(createSettings(), req(date)), /valid/)
  const s = createSettings(),
    session = admin()
  assert.throws(
    () => previewChange(session, req("2026-10-01"), " ", "", s, at),
    /reason/,
  )
  const p = previewChange(session, req("2026-10-01"), "Test reason", "", s, at)
  assert.throws(() => applyChange(session, p, false, "", s, at), /Confirmation/)
  assert.throws(
    () => applyChange(session, p, true, "2026-09-20", s, at),
    /Preview again/,
  )
  applyChange(session, p, true, "", s, at)
  assert.throws(() => applyChange(session, p, true, "", s, at))
  const p2 = previewChange(session, req("2026-10-02"), "Advance", "", s, at)
  session.access.users.find((u) => u.id === session.personaId).roleIds = []
  assert.throws(() => applyChange(session, p2, true, "", s, at), /denied/)
})
test("typed runtime updates affect future evaluation without rewriting historical KYC/security", () => {
  const s = createSettings(),
    session = admin(),
    before = structuredClone(session.access),
    contacts = { email: true, phone: false },
    kyc = { status: "verified", decidedAt: at }
  assert.equal(contactsVerified(contacts, s), false)
  apply(s, {
    category: "Runtime Control",
    key: "CLIENT_VERIFICATION_MODE",
    value: "EMAIL",
  })
  assert.equal(contactsVerified(contacts, s), true)
  assert.deepEqual(kyc, { status: "verified", decidedAt: at })
  assert.deepEqual(session.access, before)
  for (const [key, value] of [
    ["UNKNOWN", "EMAIL"],
    ["CLIENT_KYC_STATUS", "verified"],
    ["CLIENT_VERIFICATION_MODE", "INVALID"],
  ])
    assert.throws(
      () => apply(s, { category: "Runtime Control", key, value }),
      /invalid/,
    )
  assert.equal(s.history.length, 1)
  assert.equal(s.history[0].before, "BOTH")
})
test("protected history derives financial records, not scheduled future dates", () => {
  const world = {
    groups: [
      {
        cycles: [
          {
            financial: { obligations: 1 },
            active: {
              obligations: [{}],
              generatedAt: "2026-09-10T09:00:00Z",
              rounds: [{ schedule: { dueAt: "2099-01-01T00:00:00Z" } }],
            },
          },
        ],
        history: [],
      },
    ],
  }
  assert.equal(protectedHistory([world]), "2026-09-10")
  assert.equal(protectedHistory([]), "")
})
test("configuration reports use live source rows plus report and source permission", () => {
  Object.assign(platformSettings, createSettings())
  apply(platformSettings, req("2026-10-01"))
  const sources = { clients: [], organizations: [], worlds: [] },
    session = admin(),
    r = generateInternalReport(sources, session, "internal-business-date")
  assert.equal(r.rows.length, 1)
  assert.equal(r.rows[0].values.after, "CONTROLLED / 2026-10-01")
  assert.ok(
    !availableInternalReports(seedSession("ops-supervisor")).some(
      (d) => d.category === "Configuration",
    ),
  )
  assert.throws(
    () =>
      generateInternalReport(
        sources,
        seedSession("ops-supervisor"),
        "internal-business-date",
      ),
    /denied/,
  )
  assert.equal(readHistory(seedSession("runtime-manager")).length, 0)
  assert.equal(availableInternalReports(session).some(d=>d.id==='internal-process-runs'),false)
  Object.assign(platformSettings, createSettings())
})

import { effectiveReferenceAt, obligationState } from "../src/rounds/model.ts"
import { timing } from "../src/rounds/model.ts"
test("environment reads follow Business Date without generating obligations; scenarios remain deterministic", () => {
  const s = platformSettings
  Object.assign(s, createSettings())
  const environment = {
      timeSource: "ENVIRONMENT",
      referenceAt: "2026-01-01T00:00:00Z",
    },
    scenario = { referenceAt: "2099-01-01T00:00:00Z", timeSource: "SCENARIO" }
  apply(s, req("2026-10-01"))
  assert.equal(effectiveReferenceAt(environment), "2026-10-01T00:00:00+01:00")
  assert.equal(effectiveReferenceAt(scenario), scenario.referenceAt)
  const schedule = {
    opensAt: "2026-09-20T00:00:00+01:00",
    dueDayStartsAt: "2026-09-30T00:00:00+01:00",
    dueAt: "2026-09-30T23:59:59+01:00",
    lateAt: "2026-10-03T00:00:00+01:00",
  }
  assert.equal(timing(schedule, effectiveReferenceAt(environment)), "Grace")
  apply(s, req("2026-10-03"))
  assert.equal(timing(schedule, effectiveReferenceAt(environment)), "Late")
  const active = {
      ...environment,
      obligations: [],
      rounds: [],
      resolvedRoundIds: [],
      penaltyEnabled: true,
    },
    o = {
      components: [
        {
          requiredMinor: 100,
          requiredSatisfiedMinor: 0,
          optionalMinor: 0,
          optionalSatisfiedMinor: 0,
        },
      ],
    },
    round = { schedule }
  const before = structuredClone(active)
  assert.equal(obligationState(o, round, active).penaltyEligible, true)
  assert.deepEqual(active, before)
  Object.assign(s, createSettings())
})
