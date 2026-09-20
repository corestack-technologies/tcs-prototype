import test from "node:test"
import assert from "node:assert/strict"
import { seedPersona } from "../src/clients/seeds.ts"
import {
  canApply,
  canStartNewActivity,
  closureBlockers,
  hasWorkspace,
  organizationFormErrors,
} from "../src/organizations/model.ts"
import {
  organizationScenarios,
  seedOrganization,
} from "../src/organizations/seeds.ts"
import { OrganizationSession } from "../src/organizations/session.ts"
import {
  activateOrganization,
  createOrganization,
  editApplication,
  editOrganizationProfile,
  enquireSettlement,
  requestOrganizationClosure,
  requestSettlementChange,
  respondToInformation,
  saveInitialSettlement,
  saveOrganizationNotifications,
  submitApplication,
  validateOrganizationFile,
} from "../src/organizations/service.ts"

const member = () => seedPersona("verified")
const org = (scenario) => seedOrganization(member(), scenario)
const enquiry = () => enquireSettlement("058", "0123456789")

test("Organization entry requires a verified eligible Member and preserves one Owner identity", () => {
  for (const id of [
    "new",
    "required",
    "pending",
    "restricted",
    "suspended",
    "rejected",
  ]) {
    assert.equal(canApply(seedPersona(id)), false)
    assert.throws(() => createOrganization(seedPersona(id), null))
  }
  const owner = member()
  const original = structuredClone(owner)
  const draft = createOrganization(owner, null)
  assert.equal(draft.ownerMemberId, owner.id)
  assert.deepEqual(owner, original)
  assert.equal(draft.status, "draft")
  assert.equal(draft.activity.groups.length, 0)
  assert.throws(() => createOrganization(owner, draft))
})

test("application retains draft edits and a complete immutable submitted snapshot", () => {
  const original = org("draft")
  let draft = editApplication(original, member(), {
    name: "My Community",
    declarationAccepted: true,
  })
  assert.equal(draft.form.declarationAccepted, false)
  draft = editApplication(draft, member(), { declarationAccepted: true })
  const submitted = submitApplication(draft, member())
  assert.equal(submitted.id, original.id)
  assert.equal(submitted.ownerMemberId, member().id)
  assert.equal(submitted.status, "submitted")
  assert.equal(submitted.application.snapshot.name, "My Community")
  assert.notEqual(submitted.application.snapshot, submitted.form)
  assert.equal(
    submitted.application.ownerSnapshot.email,
    member().profile.email,
  )
  assert.equal(original.form.name, "Olahbee’s World")
  assert.throws(() =>
    editApplication(submitted, member(), { name: "Overwrite" }),
  )
  assert.throws(() => submitApplication(submitted, member()))
  assert.throws(() => activateOrganization(submitted, member(), true))
})

test("application validation requires business contact and meaningful operation details, not registration or files", () => {
  const draft = org("draft")
  assert.equal(
    Object.keys(
      organizationFormErrors({
        ...draft.form,
        registration: "",
        legalName: "",
        logo: null,
      }),
    ).length,
    0,
  )
  for (const [key, value] of [
    ["email", "bad"],
    ["phone", "abc"],
    ["estimatedMembers", "-1"],
    ["avgAmount", "NaN"],
    ["frequency", "Yearly"],
  ])
    assert.ok(organizationFormErrors({ ...draft.form, [key]: value })[key])
  assert.equal(
    organizationFormErrors({ ...draft.form, estimatedMembers: "0" })
      .estimatedMembers,
    undefined,
  )
  assert.throws(() => submitApplication(draft, member()))
  assert.throws(() =>
    submitApplication(
      {
        ...draft,
        form: { ...draft.form, email: "", declarationAccepted: true },
      },
      member(),
    ),
  )
})

test("additional information appends a response and returns to pending without replacing the application", () => {
  const initial = org("information-required")
  const snapshot = structuredClone(initial.application.snapshot)
  const attachment = new File(["sample"], "records.pdf", {
    type: "application/pdf",
  })
  const updated = respondToInformation(
    initial,
    member(),
    "We keep monthly reconciliation records.",
    attachment,
  )
  assert.equal(updated.status, "pending")
  assert.equal(updated.application.responses.length, 1)
  assert.equal(updated.application.responses[0].document, attachment)
  assert.deepEqual(updated.application.snapshot, snapshot)
  assert.equal(initial.application.responses.length, 0)
  assert.throws(() => respondToInformation(initial, member(), " ", null))
  assert.throws(() => respondToInformation(updated, member(), "Another", null))
})

test("Name Enquiry is deterministic, keeps bank distinct and covers invalid, failed and unavailable results", () => {
  assert.deepEqual(enquiry(), enquiry())
  assert.equal(enquiry().resolvedName, "OLAHBEE’S WORLD ENTERPRISES")
  assert.equal(enquireSettlement("044", "0123456789").bankName, "Access Bank")
  for (const [bank, account] of [
    ["", "0123456789"],
    ["bad", "0123456789"],
    ["058", "123"],
    ["058", "0000000000"],
    ["058", "9999999999"],
    ["058", "1111111111"],
  ])
    assert.throws(() => enquireSettlement(bank, account))
})

test("initial settlement is distinct from personal payout and requires Owner confirmation of resolved details", () => {
  const owner = member()
  const personal = structuredClone(owner)
  const initial = org("approved")
  assert.throws(() => saveInitialSettlement(initial, owner, enquiry(), false))
  assert.throws(() =>
    saveInitialSettlement(
      initial,
      owner,
      { ...enquiry(), resolvedName: "Typed name" },
      true,
    ),
  )
  assert.throws(() =>
    saveInitialSettlement(
      initial,
      owner,
      { ...enquiry(), accountNumber: "1234567890" },
      true,
    ),
  )
  const updated = saveInitialSettlement(initial, owner, enquiry(), true)
  assert.equal(updated.settlement.validation, "demo-resolved")
  assert.equal(updated.settlement.confirmation, "owner-confirmed")
  assert.ok(updated.settlement.confirmedAt)
  assert.deepEqual(owner, personal)
  assert.equal(updated.status, "approved")
  assert.throws(() => saveInitialSettlement(updated, owner, enquiry(), true))
})

test("activation cannot bypass independent Organization approval or setup acknowledgment", () => {
  const approved = org("approved")
  assert.throws(() => activateOrganization(approved, member(), true))
  const ready = saveInitialSettlement(approved, member(), enquiry(), true)
  assert.throws(() => activateOrganization(ready, member(), false))
  const active = activateOrganization(ready, member(), true)
  assert.equal(active.status, "active")
  assert.equal(active.id, ready.id)
  assert.equal(active.ownerMemberId, ready.ownerMemberId)
  assert.equal(active.activity.groups.length, 0)
  assert.equal(canStartNewActivity(active), true)
  assert.throws(() => activateOrganization(active, member(), true))
})

test("settlement change requests retain the effective account and record before, after, actor and reason", () => {
  const initial = org("active")
  const current = structuredClone(initial.settlement)
  const replacement = enquireSettlement("044", "2222222222")
  assert.throws(() =>
    requestSettlementChange(
      initial,
      member(),
      replacement,
      false,
      "Change bank",
    ),
  )
  assert.throws(() =>
    requestSettlementChange(initial, member(), replacement, true, " "),
  )
  assert.throws(() =>
    requestSettlementChange(initial, member(), enquiry(), true, "Same bank"),
  )
  const pending = requestSettlementChange(
    initial,
    member(),
    replacement,
    true,
    "Business account migration",
  )
  assert.deepEqual(pending.settlement, current)
  assert.equal(pending.settlementChanges[0].status, "pending")
  assert.equal(
    pending.settlementChanges[0].proposed.accountNumber,
    "2222222222",
  )
  assert.equal(pending.history.at(-1).actor, member().id)
  assert.equal(pending.history.at(-1).reason, "Business account migration")
  assert.deepEqual(pending.history.at(-1).before, current)
  assert.throws(() =>
    requestSettlementChange(pending, member(), replacement, true, "Again"),
  )
  assert.throws(() =>
    saveInitialSettlement(pending, member(), replacement, true),
  )
  assert.equal(initial.settlementChanges.length, 0)
})

test("effective settlement scenario represents independent approval and keeps the prior account", () => {
  const pending = org("settlement-pending")
  const effective = org("settlement-effective")
  assert.equal(pending.settlement.accountNumber, "0123456789")
  assert.equal(effective.settlement.accountNumber, "2222222222")
  assert.equal(
    effective.settlementChanges[0].previous.accountNumber,
    "0123456789",
  )
  assert.equal(effective.settlementChanges[0].status, "approved")
  assert.ok(effective.settlementChanges[0].approvedAt)
  assert.ok(effective.settlementChanges[0].effectiveAt)
})

test("branding changes are audited and do not rewrite submitted legal identity or Member avatar", () => {
  const initial = org("active")
  const owner = member()
  const snapshot = structuredClone(initial.application.snapshot)
  const logo = new File(["sample"], "business.png", { type: "image/png" })
  const changed = editOrganizationProfile(initial, owner, {
    name: "New trading name",
    logo,
    accent: "navy",
  })
  assert.equal(changed.form.logo, logo)
  assert.equal(changed.form.name, "New trading name")
  assert.equal(changed.history.at(-1).before.name, initial.form.name)
  assert.deepEqual(changed.application.snapshot, snapshot)
  assert.equal(owner.profileImage, undefined)
  assert.equal(
    editOrganizationProfile(changed, owner, {
      logo: null,
      logoStyle: "initials",
    }).form.logo,
    null,
  )
  assert.throws(() =>
    editOrganizationProfile(initial, owner, {
      legalName: "Different legal entity",
    }),
  )
  assert.throws(() => editOrganizationProfile(initial, owner, { name: "" }))
})

test("Organization files reject empty, oversized and unsupported content types", () => {
  for (const file of [
    new File([], "empty.png", { type: "image/png" }),
    new File(["a"], "file.html", { type: "text/html" }),
    new File([new Uint8Array(2 * 1024 * 1024 + 1)], "large.jpg", {
      type: "image/jpeg",
    }),
  ])
    assert.throws(() => validateOrganizationFile(file, true))
  assert.doesNotThrow(() =>
    validateOrganizationFile(
      new File(["x"], "record.pdf", { type: "application/pdf" }),
    ),
  )
})

test("suspension and restriction block new activity while keeping the workspace and existing sample Cycles", () => {
  for (const id of ["suspended", "restricted"]) {
    const initial = org(id)
    assert.equal(canStartNewActivity(initial), false)
    assert.equal(hasWorkspace(initial), true)
    assert.equal(initial.activity.groups.length, 2)
    assert.ok(initial.settlement)
    assert.ok(initial.application.snapshot)
    assert.throws(() => requestOrganizationClosure(initial, member(), true))
  }
})

test("each material clearance blocker prevents closure; request never closes or erases records", () => {
  const ready = org("closure-ready")
  assert.deepEqual(closureBlockers(ready), [])
  assert.throws(() => requestOrganizationClosure(ready, member(), false))
  for (const key of Object.keys(ready.clearance)) {
    const blocked = { ...ready, clearance: { ...ready.clearance, [key]: 1 } }
    assert.equal(closureBlockers(blocked).length, 1)
    assert.throws(() => requestOrganizationClosure(blocked, member(), true))
  }
  assert.throws(() =>
    requestOrganizationClosure({ ...ready, clearance: null }, member(), true),
  )
  const pending = requestOrganizationClosure(ready, member(), true)
  assert.equal(pending.status, "closure-pending")
  assert.deepEqual(pending.activity, ready.activity)
  assert.deepEqual(pending.settlement, ready.settlement)
  assert.equal(pending.history.length, ready.history.length + 1)
  assert.throws(() => requestOrganizationClosure(pending, member(), true))
})

test("tenant ownership is enforced on every mutable Organization service", () => {
  const stranger = { ...member(), id: "different-member" }
  const operations = [
    () => editApplication(org("draft"), stranger, { name: "Leak" }),
    () => submitApplication(org("draft"), stranger),
    () => editOrganizationProfile(org("active"), stranger, { name: "Leak" }),
    () =>
      respondToInformation(org("information-required"), stranger, "Leak", null),
    () => saveInitialSettlement(org("approved"), stranger, enquiry(), true),
    () =>
      requestSettlementChange(org("active"), stranger, enquiry(), true, "Leak"),
    () => activateOrganization(org("approved"), stranger, true),
    () => requestOrganizationClosure(org("closure-ready"), stranger, true),
    () =>
      saveOrganizationNotifications(
        org("active"),
        stranger,
        org("active").notifications,
      ),
  ]
  for (const operation of operations) assert.throws(operation, /another Member/)
})

test("closed Organization is read-only and scenario records are independently seeded", () => {
  const closed = org("closed")
  assert.throws(() =>
    editOrganizationProfile(closed, member(), { name: "Changed" }),
  )
  assert.throws(() =>
    saveOrganizationNotifications(closed, member(), closed.notifications),
  )
  assert.throws(() =>
    requestSettlementChange(closed, member(), enquiry(), true, "Changed"),
  )
  const examples = organizationScenarios
    .filter((item) => item.id !== "personal")
    .map((item) => org(item.id))
  assert.equal(new Set(examples.map((item) => item.id)).size, examples.length)
  for (const example of examples)
    assert.equal(example.ownerMemberId, member().id)
  const first = org("active"),
    second = org("active")
  const changed = editOrganizationProfile(first, member(), { name: "Changed" })
  assert.notEqual(changed.form.name, second.form.name)
  assert.equal(second.form.name, "Olahbee’s World")
})

test("session retains an application across context switches, sign-out and demo inspection without cross-tenant access", () => {
  const session = new OrganizationSession()
  const owner = member(),
    other = { ...member(), id: "another-owner" }
  session.start(owner)
  const applicationId = session.current(owner).id
  session.update(owner, applicationId, (value) =>
    editApplication(value, owner, { name: "Saved draft" }),
  )
  assert.equal(session.current(null), null)
  assert.equal(session.current(other), null)
  assert.equal(session.current(owner).form.name, "Saved draft")
  session.select(owner, "active")
  const exampleId = session.current(owner).id
  session.update(owner, exampleId, (value) =>
    editOrganizationProfile(value, owner, { name: "Edited demo" }),
  )
  session.select(owner, "personal")
  assert.equal(session.current(owner).id, applicationId)
  assert.equal(session.current(owner).form.name, "Saved draft")
  assert.throws(() => session.start(owner))
  session.select(owner, "active")
  assert.equal(session.current(owner).form.name, "Edited demo")
  session.select(other, "active")
  assert.notEqual(session.current(other).id, exampleId)
  assert.equal(session.current(other).form.name, "Olahbee’s World")
})

test("a stale asynchronous edit cannot land in a different Organization scenario or change ownership", () => {
  const session = new OrganizationSession(),
    owner = member()
  session.select(owner, "active")
  const originalId = session.current(owner).id
  session.select(owner, "adaeze")
  assert.throws(() =>
    session.update(owner, originalId, (value) =>
      editOrganizationProfile(value, owner, { name: "Wrong Organization" }),
    ),
  )
  const id = session.current(owner).id
  assert.throws(() =>
    session.update(owner, id, (value) => ({
      ...value,
      ownerMemberId: "another-owner",
    })),
  )
  assert.throws(() =>
    session.update(owner, id, (value) => ({ ...value, id: "another-tenant" })),
  )
  assert.equal(session.current(owner).form.name, "Adaeze Thrift Network")
  assert.throws(() => session.select(owner, "missing-scenario"))
})

test("sample financial previews belong to their Organization and reconcile to closure blockers", () => {
  const sample = org("active")
  assert.equal(sample.activity.payouts.length, 3)
  for (const payout of sample.activity.payouts)
    assert.ok(
      sample.activity.groups.some((group) => group.id === payout.groupId),
    )
  assert.equal(
    sample.clearance.activeCycles,
    sample.activity.groups.filter((group) => group.status === "active").length,
  )
  assert.equal(
    sample.clearance.outstandingPayouts,
    sample.activity.payouts.filter((payout) =>
      ["in-progress", "ready"].includes(payout.status),
    ).length,
  )
})
