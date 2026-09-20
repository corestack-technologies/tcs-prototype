import {
  demoPersonas,
  seedPersona,
  activityTotals,
} from "../src/clients/seeds.ts"
import test from "node:test"
import assert from "node:assert/strict"
import {
  createClient,
  emptyProfile,
  contactComplete,
  clientStatus,
  closureEligibility,
  profileErrors,
} from "../src/clients/model.ts"
import {
  finishOnboarding,
  submitIdentity,
  editProfile,
  editIdentity,
  requestClosure,
  verifyLocalContact,
  clientPrototypePolicy,
} from "../src/clients/service.ts"

const profile = {
  ...emptyProfile,
  firstName: "Test",
  lastName: "Member",
  email: "member@example.test",
  phone: "08012345678",
  dob: "1995-04-10",
  address: "1 Sample Street",
  city: "Ikeja",
  state: "Lagos",
}
const contactConfirmed = () => ({
  ...createClient(profile),
  contacts: { email: true, phone: true },
})
const prepared = () => ({
  ...finishOnboarding(contactConfirmed()),
  identity: {
    nin: "12345678901",
    ninDocument: new File(["sample"], "nin.pdf", { type: "application/pdf" }),
    addressDocument: new File(["sample"], "address.pdf", {
      type: "application/pdf",
    }),
  },
})

test("new account has no claimed verification or fabricated financial participation", () => {
  const member = createClient(profile)
  assert.equal(contactComplete(member), false)
  assert.equal(member.onboardingComplete, false)
  assert.equal(member.verification.status, "required")
  assert.equal(member.clearance, null)
  assert.equal(clientStatus(member).label, "Verify your contact")
})
test("onboarding requires confirmed contacts and complete personal information", () => {
  assert.throws(() => finishOnboarding(createClient(profile)))
  assert.throws(() =>
    finishOnboarding({
      ...contactConfirmed(),
      profile: { ...profile, address: "" },
    }),
  )
  const member = finishOnboarding(contactConfirmed())
  assert.equal(member.onboardingComplete, true)
  assert.equal(member.verification.status, "required")
})
test("submission becomes pending, preserves the same identity and records a snapshot", () => {
  const before = prepared()
  const after = submitIdentity(before, true)
  assert.equal(after.id, before.id)
  assert.deepEqual(after.profile, profile)
  assert.equal(after.verification.status, "pending")
  assert.equal(clientStatus(after).label, "Pending review")
  assert.notEqual(after.verification.submission.profile, before.profile)
  assert.equal(before.verification.status, "required")
  assert.equal(after.history.at(-1).action, "Verification submitted for review")
  assert.throws(() => submitIdentity(after, true))
})
test("submission requires both attachments and explicit review acknowledgement", () => {
  assert.throws(() => submitIdentity(prepared(), false))
  assert.throws(() =>
    submitIdentity(
      {
        ...prepared(),
        identity: { ...prepared().identity, ninDocument: null },
      },
      true,
    ),
  )
  assert.throws(() =>
    submitIdentity(
      { ...prepared(), identity: { ...prepared().identity, nin: "123" } },
      true,
    ),
  )
})
test("draft edits propagate without silently completing onboarding", () => {
  const member = editProfile(contactConfirmed(), "firstName", "Updated")
  assert.equal(member.profile.firstName, "Updated")
  assert.equal(member.onboardingComplete, false)
  assert.equal(
    editIdentity(member, { nin: "12345678901" }).identity.nin,
    "12345678901",
  )
})
test("independent examples do not modify submitted accounts", () => {
  const pending = submitIdentity(prepared(), true)
  const verified = seedPersona("verified")
  assert.equal(verified.example, true)
  assert.notEqual(pending.id, verified.id)
  assert.equal(pending.verification.status, "pending")
})
test("closure eligibility distinguishes unknown, blocked and clear", () => {
  const clear = {
    activeCycles: 0,
    obligations: 0,
    awaitingPayouts: 0,
    recoveryCases: 0,
    disputes: 0,
  }
  assert.equal(closureEligibility(null), "unknown")
  assert.equal(closureEligibility(clear), "clear")
  for (const key of Object.keys(clear))
    assert.equal(closureEligibility({ ...clear, [key]: 1 }), "blocked")
})
test("closure request never closes the account or erases its history", () => {
  const member = contactConfirmed()
  const requested = requestClosure(member)
  assert.ok(requested.closureRequestedAt)
  assert.equal(requested.accountStatus, "active")
  assert.equal(requested.history.length, member.history.length + 1)
  assert.throws(() => requestClosure(requested))
  assert.throws(() =>
    requestClosure({
      ...member,
      clearance: {
        activeCycles: 1,
        obligations: 0,
        awaitingPayouts: 0,
        recoveryCases: 0,
        disputes: 0,
      },
    }),
  )
})
test("suspension is distinct from identity verification and does not erase account data", () => {
  const member = seedPersona("suspended")
  assert.equal(clientStatus(member).label, "Account suspended")
  assert.equal(member.verification.status, "verified")
  assert.ok(member.profile.email)
})
test("invalid or future dates and partial bank records cannot complete a profile", () => {
  assert.ok(profileErrors({ ...profile, dob: "9999-12-31" }).dob)
  assert.ok(profileErrors({ ...profile, dob: "invalid" }).dob)
  assert.ok(profileErrors({ ...profile, accountNumber: "123" }).accountNumber)
  assert.equal(Object.keys(profileErrors(profile)).length, 0)
})
test("contact confirmation has no automatic success path", () => {
  const member = createClient(profile)
  assert.throws(() => verifyLocalContact(member, "email", "000000"))
  if (!clientPrototypePolicy.allowLocalContactCode)
    assert.throws(() =>
      verifyLocalContact(
        member,
        "email",
        clientPrototypePolicy.localContactCode,
      ),
    )
  assert.equal(member.contacts.email, false)
})
test("explicitly enabled local contact codes advance both contacts, never identity approval", () => {
  const previous = clientPrototypePolicy.allowLocalContactCode
  clientPrototypePolicy.allowLocalContactCode = true
  try {
    let member = createClient(profile)
    assert.throws(() => verifyLocalContact(member, "email", "000000"))
    member = verifyLocalContact(
      member,
      "email",
      clientPrototypePolicy.localContactCode,
    )
    assert.equal(contactComplete(member), false)
    assert.throws(() =>
      verifyLocalContact(
        member,
        "email",
        clientPrototypePolicy.localContactCode,
      ),
    )
    member = verifyLocalContact(
      member,
      "phone",
      clientPrototypePolicy.localContactCode,
    )
    assert.equal(contactComplete(member), true)
    assert.equal(member.verification.status, "required")
    assert.equal(member.onboardingComplete, false)
    assert.equal(clientStatus(member).label, "Onboarding incomplete")
  } finally {
    clientPrototypePolicy.allowLocalContactCode = previous
  }
})
test("impossible calendar dates cannot be accepted as a birth date", () => {
  assert.ok(profileErrors({ ...profile, dob: "2025-02-31" }).dob)
})
test("MVP age boundary is exactly 18 with no maximum-age limit", () => {
  const today = new Date("2026-09-06T12:00:00Z")
  assert.ok(profileErrors({ ...profile, dob: "2008-09-07" }, today).dob)
  assert.equal(
    profileErrors({ ...profile, dob: "2008-09-06" }, today).dob,
    undefined,
  )
  assert.equal(
    profileErrors({ ...profile, dob: "1900-01-01" }, today).dob,
    undefined,
  )
})
test("all requested personas have distinct stable identities and coherent milestones", () => {
  const members = demoPersonas.map((persona) => seedPersona(persona.id))
  assert.equal(new Set(members.map((member) => member.id)).size, members.length)
  assert.equal(contactComplete(seedPersona("new")), false)
  assert.equal(contactComplete(seedPersona("incomplete")), true)
  assert.equal(seedPersona("incomplete").onboardingComplete, false)
  assert.equal(seedPersona("required").onboardingComplete, true)
  for (const member of members.filter(
    (member) => member.verification.status !== "required",
  )) {
    assert.ok(member.verification.submission)
    assert.deepEqual(member.verification.submission.profile, member.profile)
  }
})
test("submitted scenarios including information-required stay read-only", () => {
  for (const id of [
    "pending",
    "information-required",
    "rejected",
    "verified",
  ]) {
    const member = seedPersona(id)
    assert.throws(() => editProfile(member, "firstName", "Changed"))
    assert.throws(() => editIdentity(member, { nin: "11111111111" }))
    assert.throws(() => submitIdentity(member, true))
  }
})
test("restored dashboard totals reconcile to separate contribution and payout records", () => {
  const member = seedPersona("verified")
  const totals = activityTotals(member.activity)
  assert.deepEqual(totals, { contributed: 110000, received: 176400, groups: 2 })
  assert.equal(member.clearance.activeCycles, totals.groups)
  assert.equal(closureEligibility(member.clearance), "blocked")
  for (const group of member.activity.groups) {
    assert.equal(
      group.scheduledValue,
      group.positions * group.monthlyContribution,
    )
    assert.equal(
      member.activity.contributions.filter((row) => row.groupId === group.id)
        .length,
      group.paidRounds,
    )
  }
  assert.equal(seedPersona("new").activity, undefined)
})
test("signup through contact, onboarding and submission preserves one Member and stops pending", () => {
  let member = createClient(profile)
  const id = member.id
  member = verifyLocalContact(
    member,
    "email",
    clientPrototypePolicy.localContactCode,
  )
  member = verifyLocalContact(
    member,
    "phone",
    clientPrototypePolicy.localContactCode,
  )
  member = editProfile(member, "firstName", "Chisom")
  member = finishOnboarding(member)
  member = editIdentity(member, prepared().identity)
  member = submitIdentity(member, true)
  assert.equal(member.id, id)
  assert.equal(member.profile.firstName, "Chisom")
  assert.equal(member.verification.submission.profile.firstName, "Chisom")
  assert.equal(member.verification.status, "pending")
  assert.throws(() => editProfile(member, "firstName", "Overwritten"))
})
import {
  enquireAccountName,
  saveBankDetails,
  setProfileImage,
} from "../src/clients/service.ts"

test("Name Enquiry is deterministic and rejects invalid, missing and unavailable accounts", () => {
  assert.deepEqual(
    enquireAccountName("058", "0123456789"),
    enquireAccountName("058", "0123456789"),
  )
  assert.equal(
    enquireAccountName("044", "1234567890").resolvedName,
    "CHISOM OKAFOR",
  )
  for (const [bank, account] of [
    ["", "0123456789"],
    ["058", "123"],
    ["058", "0000000000"],
    ["058", "9999999999"],
    ["058", "1111111111"],
  ]) {
    assert.throws(() => enquireAccountName(bank, account))
  }
})

test("bank saving requires confirmation and a matching resolved result", () => {
  const member = contactConfirmed()
  const result = enquireAccountName("058", "0123456789")
  assert.throws(() => saveBankDetails(member, result, false))
  assert.throws(() =>
    saveBankDetails(member, { ...result, resolvedName: "Invented" }, true),
  )
  assert.throws(() =>
    saveBankDetails(member, { ...result, accountNumber: "1234567890" }, true),
  )
  for (const key of ["bankName", "accountName", "accountNumber"])
    assert.throws(() => editProfile(member, key, "Unconfirmed"))
  const saved = saveBankDetails(member, result, true)
  assert.equal(saved.bankDetails.status, "demo-confirmed")
  assert.equal(saved.bankDetails.resolvedName, result.resolvedName)
  assert.ok(saved.bankDetails.confirmedAt)
  assert.equal(member.bankDetails, undefined)
  assert.equal(saved.onboardingComplete, member.onboardingComplete)
})

test("avatar and bank updates preserve every submitted verification scenario and demo activity", () => {
  const image = new File(["sample"], "avatar.png", { type: "image/png" })
  for (const persona of [
    "pending",
    "information-required",
    "rejected",
    "verified",
    "suspended",
  ]) {
    const member = seedPersona(persona)
    const snapshot = structuredClone(member.verification)
    const updated = saveBankDetails(
      setProfileImage(member, image),
      enquireAccountName("058", "0123456789"),
      true,
    )
    assert.deepEqual(updated.verification, snapshot)
    assert.deepEqual(updated.profile, member.profile)
    assert.deepEqual(updated.activity, member.activity)
    assert.equal(updated.identity, member.identity)
    assert.equal(updated.profileImage, image)
    assert.equal(setProfileImage(updated, null).profileImage, undefined)
    assert.equal(member.profileImage, undefined)
  }
})

test("avatar validation rejects empty, unsupported and oversized files", () => {
  for (const file of [
    new File([], "empty.png", { type: "image/png" }),
    new File(["pdf"], "file.pdf", { type: "application/pdf" }),
    new File([new Uint8Array(5 * 1024 * 1024 + 1)], "large.jpg", {
      type: "image/jpeg",
    }),
  ]) {
    assert.throws(() => setProfileImage(contactConfirmed(), file))
  }
})

test("a retained submission remains locked even if its status is required", () => {
  const member = submitIdentity(prepared(), true)
  member.verification.status = "required"
  assert.throws(() => editProfile(member, "firstName", "Changed"))
  assert.throws(() => editIdentity(member, { nin: "11111111111" }))
  assert.throws(() => submitIdentity(member, true))
})
