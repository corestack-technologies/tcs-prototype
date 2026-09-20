import {
  createClient,
  emptyProfile,
  type Client,
  type MemberActivity,
} from "./model.ts"

export const demoPersonas = [
  {
    id: "new",
    label: "New Member",
    email: "new@tcs.ng",
    description: "Start with contact verification",
  },
  {
    id: "incomplete",
    label: "Onboarding incomplete",
    email: "incomplete@tcs.ng",
    description: "Continue a saved profile",
  },
  {
    id: "required",
    label: "Verification required",
    email: "required@tcs.ng",
    description: "Prepare identity documents",
  },
  {
    id: "pending",
    label: "Pending review",
    email: "pending@tcs.ng",
    description: "Inspect a submitted record",
  },
  {
    id: "information-required",
    label: "Information required",
    email: "information@tcs.ng",
    description: "Read a request for information",
  },
  {
    id: "verified",
    label: "Verified / active",
    email: "member@tcs.ng",
    description: "Explore the Member dashboard",
  },
  {
    id: "restricted",
    label: "Restricted Member",
    email: "restricted@tcs.ng",
    description: "Existing participation remains visible",
  },
  {
    id: "suspended",
    label: "Suspended Member",
    email: "suspended@tcs.ng",
    description: "Essential account access is preserved",
  },
  {
    id: "rejected",
    label: "Verification declined",
    email: "rejected@tcs.ng",
    description: "Inspect the verification outcome",
  },
] as const
export type PersonaId = typeof demoPersonas[number]["id"]

function activitySeed(): MemberActivity {
  return {
    asOf: "2026-09-06",
    groups: [
      {
        id: "mainland",
        name: "Lagos Mainland Ajo",
        organization: "Mainland Community Cooperative",
        monthlyContribution: 20000,
        position: 5,
        positions: 12,
        round: 5,
        cycleNumber: 1,
        contributionDueDate: "2026-09-30",
        paidRounds: 4,
        payoutDate: "2026-10-03",
        scheduledValue: 240000,
        organizationFee: 4800,
      },
      {
        id: "surulere",
        name: "Surulere Circle",
        organization: "Surulere Community Collective",
        monthlyContribution: 15000,
        position: 2,
        positions: 12,
        round: 3,
        cycleNumber: 1,
        contributionDueDate: "2026-09-30",
        paidRounds: 2,
        payoutDate: "2026-09-03",
        scheduledValue: 180000,
        organizationFee: 3600,
      },
    ],
    contributions: [
      ...["2026-05-25", "2026-06-25", "2026-07-25", "2026-08-25"].map(
        (paidAt, index) => ({
          id: `mainland-${index}`,
          groupId: "mainland",
          amount: 20000,
          paidAt,
          reference: `TCS-DEMO-LM-${index + 1}`,
        }),
      ),
      ...["2026-07-25", "2026-08-25"].map((paidAt, index) => ({
        id: `surulere-${index}`,
        groupId: "surulere",
        amount: 15000,
        paidAt,
        reference: `TCS-DEMO-SC-${index + 1}`,
      })),
    ],
    payouts: [
      {
        id: "payout-surulere",
        groupId: "surulere",
        amount: 176400,
        receivedAt: "2026-09-03",
        reference: "TCS-DEMO-PAYOUT-002",
      },
    ],
  }
}

export function seedPersona(id: PersonaId): Client {
  const persona = demoPersonas.find((item) => item.id === id)!
  const client = createClient({
    ...emptyProfile,
    firstName: "Adaeze",
    middleName: "Chidinma",
    lastName: "Okonkwo",
    email: persona.email,
    phone: "08012345678",
    dob: "1994-04-12",
    gender: "Female",
    address: "12 Akinremi Street",
    city: "Ikeja",
    state: "Lagos",
    bankName: "GTBank",
    accountNumber: "0123456789",
    accountName: "Adaeze Chidinma Okonkwo",
  })
  client.id = `demo-${id}`
  client.personaId = id
  client.example = true
  client.contacts = { email: id !== "new", phone: id !== "new" }
  client.onboardingComplete = !["new", "incomplete"].includes(id)
  client.verification.status = ["verified", "restricted", "suspended"].includes(
    id,
  )
    ? "verified"
    : ["new", "incomplete", "required"].includes(id)
      ? "required"
      : id as "pending" | "information-required" | "rejected"
  client.accountStatus =
    id === "restricted" || id === "suspended" ? id : "active"
  client.history = [
    { at: "2026-09-01T09:00:00+01:00", action: "Member account created" },
  ]
  if (id === "new" || id === "incomplete") {
    client.profile = {
      ...client.profile,
      dob: id === "new" ? "" : client.profile.dob,
      gender: "",
      address: "",
      city: "",
      state: "",
      bankName: "",
      accountNumber: "",
      accountName: "",
    }
  }
  if (id !== "new")
    client.history.push({
      at: "2026-09-01T09:05:00+01:00",
      action: "Email and phone confirmed",
    })
  if (client.onboardingComplete)
    client.history.push({
      at: "2026-09-01T09:15:00+01:00",
      action: "Member profile completed",
    })
  if (client.verification.status !== "required") {
    client.verification.submittedAt = "2026-09-02T10:30:00+01:00"
    client.verification.submission = {
      profile: { ...client.profile },
      nin: "12345678901",
      documents: ["NIN-slip.pdf", "Proof-of-address.pdf"],
    }
    client.history.push({
      at: client.verification.submittedAt,
      action: "Identity documents submitted for review",
    })
    if (id === "information-required")
      client.verification.note =
        "The address document is not legible. A clearer copy is required. The correction workflow will be available with verification review."
    if (id === "rejected")
      client.verification.note =
        "The name on the identity document could not be matched to the submitted profile. Review follow-up will be available with verification review."
    if (client.verification.status === "verified")
      client.history.push({
        at: "2026-09-03T11:00:00+01:00",
        action: "Identity verified — seeded review outcome",
      })
  }
  if (client.verification.status === "verified") {
    client.history = [
      { at: "2026-04-20T09:00:00+01:00", action: "Member account created" },
      { at: "2026-04-20T09:05:00+01:00", action: "Email and phone confirmed" },
      { at: "2026-04-21T10:00:00+01:00", action: "Member profile completed" },
      {
        at: "2026-04-22T10:30:00+01:00",
        action: "Identity documents submitted for review",
      },
      {
        at: "2026-04-23T11:00:00+01:00",
        action: "Identity verified — seeded review outcome",
      },
    ]
    client.verification.submittedAt = "2026-04-22T10:30:00+01:00"
    client.activity = activitySeed()
    // The dashboard references these existing sample commitments; closure uses the same boundary.
    client.clearance = {
      activeCycles: client.activity.groups.length,
      obligations: 0,
      awaitingPayouts: 0,
      recoveryCases: 0,
      disputes: 0,
    }
    if (client.accountStatus !== "active")
      client.history.push({
        at: "2026-09-05T14:00:00+01:00",
        action: `Account ${client.accountStatus} — seeded review outcome; existing participation preserved`,
      })
  }
  return client
}

export function activityTotals(activity: MemberActivity) {
  return {
    contributed: activity.contributions.reduce(
      (sum, row) => sum + row.amount,
      0,
    ),
    received: activity.payouts.reduce((sum, row) => sum + row.amount, 0),
    groups: activity.groups.length,
  }
}
