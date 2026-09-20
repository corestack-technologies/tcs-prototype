import { fullName, type Client } from "../clients/model.ts"
import {
  OWNER_GROUPS,
  ORGANIZATION,
  UPCOMING_PAYOUTS,
  RECENT_ACTIVITY,
  JOIN_REQUESTS,
} from "../components/org/data.ts"
import { createOrganization, enquireSettlement } from "./service.ts"
import type {
  Organization,
  OrganizationStatus,
  SettlementAccount,
} from "./model.ts"

export const organizationScenarios = [
  { id: "personal", label: "My application", status: "draft" },
  { id: "draft", label: "Olahbee’s World · saved draft", status: "draft" },
  {
    id: "submitted",
    label: "Olahbee’s World · submitted",
    status: "submitted",
  },
  {
    id: "pending",
    label: "Olahbee’s World · pending review",
    status: "pending",
  },
  {
    id: "information-required",
    label: "Olahbee’s World · information required",
    status: "information-required",
  },
  {
    id: "approved",
    label: "Olahbee’s World · approved / setup",
    status: "approved",
  },
  {
    id: "active",
    label: "Olahbee’s World · active workspace",
    status: "active",
  },
  {
    id: "adaeze",
    label: "Adaeze Thrift Network · active workspace",
    status: "active",
  },
  {
    id: "restricted",
    label: "Olahbee’s World · restricted",
    status: "restricted",
  },
  {
    id: "suspended",
    label: "Olahbee’s World · suspended",
    status: "suspended",
  },
  {
    id: "closure-ready",
    label: "Olahbee’s World · clear for closure request",
    status: "active",
  },
  {
    id: "closure-pending",
    label: "Olahbee’s World · closure pending",
    status: "closure-pending",
  },
  { id: "closed", label: "Olahbee’s World · closed history", status: "closed" },
  {
    id: "declined",
    label: "Olahbee’s World · declined application",
    status: "declined",
  },
  {
    id: "settlement-pending",
    label: "Olahbee’s World · settlement change pending",
    status: "active",
  },
  {
    id: "settlement-effective",
    label: "Olahbee’s World · settlement change effective",
    status: "active",
  },
] as const satisfies readonly {
  id: string
  label: string
  status: OrganizationStatus
}[]
export type OrganizationScenario = typeof organizationScenarios[number]["id"]
const at = "2025-01-01T10:00:00Z"
export function seedOrganization(
  member: Client,
  scenario: Exclude<OrganizationScenario, "personal">,
): Organization {
  const org = createOrganization(member, null)
  const status = organizationScenarios.find(
    (item) => item.id === scenario,
  )!.status
  const ada = scenario === "adaeze"
  org.id = `demo-org-${member.id}-${scenario}`
  org.example = true
  org.status = status
  org.form = {
    ...org.form,
    name: ada ? ORGANIZATION.name : "Olahbee’s World",
    legalName: ada ? "Adaeze Thrift Network" : "Olahbee’s World Enterprises",
    tagline: ada
      ? ORGANIZATION.tagline
      : "A familiar community. A clearer way to thrift.",
    description: ada
      ? ORGANIZATION.description
      : "A community-led thrift business helping Lagos professionals and growing households coordinate regular contributions with clear records and a personal service.",
    orgType: "Community Savings Group",
    email: ada ? "hello@adaeze.example" : "hello@olahbee.example",
    phone: "08031234567",
    address: "18 Admiralty Way, Lekki Phase 1",
    location: ada ? ORGANIZATION.location : "Lekki, Lagos",
    registration: "BN-DEMO-00847",
    logoStyle: ada ? "circle" : "arch",
    accent: ada ? "navy" : "blue",
    estimatedMembers: "20",
    frequency: "Monthly",
    avgAmount: "50000",
    existingProcess: "Spreadsheet and WhatsApp",
    communitiesServed: "Professionals and households in Lagos",
    meetingSchedule: "Monthly online check-in",
    whyDigitize:
      "Give our community consistent contribution records and clearer payout visibility.",
    challenges:
      "Reconciling records and following up on scheduled contributions.",
    expectedBenefits: "Less administration and a shared view for Members.",
    declarationAccepted: status !== "draft",
  }
  org.application =
    status === "draft"
      ? { responses: [] }
      : {
          submittedAt: at,
          snapshot: { ...org.form },
          ownerSnapshot: {
            name: fullName(member),
            email: member.profile.email,
          },
          responses: [],
          note:
            status === "information-required"
              ? "Please explain how business records are maintained and provide a sample supporting record if available."
              : status === "declined"
                ? "The sample application did not provide sufficient operational information for approval. Contact TCS for clarification of this outcome."
                : undefined,
        }
  const operating = [
    "active",
    "restricted",
    "suspended",
    "closure-pending",
    "closed",
  ].includes(status)
  if (operating) {
    org.activatedAt = "2025-01-02T09:00:00Z"
    org.settlement = {
      ...enquireSettlement("058", ada ? "1234567890" : "0123456789"),
      confirmation: "owner-confirmed",
      confirmedAt: at,
    }
    const historical = ["closure-ready", "closure-pending", "closed"].includes(
      scenario,
    )
    org.activity = {
      asOf: historical ? "2026-08-31" : "2025-07-31",
      groups: OWNER_GROUPS.map((group) => ({
        id: `${org.id}-${group.id}`,
        name: group.name,
        members: group.members,
        amount: group.amount,
        frequency: group.frequency,
        round: historical ? group.totalRounds : group.currentRound,
        rounds: group.totalRounds,
        paid: historical ? group.members : group.paidThisRound,
        status: historical ? "completed" : "active",
      })),
      contributed: 7800000,
      paidOut: ORGANIZATION.totalDisbursed,
      completedCycles: historical ? 3 : ORGANIZATION.totalCyclesCompleted,
      payouts: historical
        ? []
        : UPCOMING_PAYOUTS.map((payout) => ({
            id: `${org.id}-${payout.id}`,
            groupId: `${org.id}-${payout.groupId}`,
            groupName: payout.groupName,
            recipient: payout.recipientName,
            amount: payout.payoutAmount,
            dueDate: payout.dueDate,
            status: payout.status,
          })),
      recent: historical
        ? []
        : RECENT_ACTIVITY.slice(0, 5).map((event) => ({
            ...event,
            id: `${org.id}-${event.id}`,
          })),
      pendingJoinRequests: historical
        ? 0
        : JOIN_REQUESTS.filter((request) => request.status === "pending")
            .length,
    }
    org.clearance = {
      activeCycles: historical ? 0 : org.activity.groups.length,
      outstandingPayouts: org.activity.payouts.filter(
        (payout) =>
          payout.status === "in-progress" || payout.status === "ready",
      ).length,
      exitSettlements: 0,
      recoveryCases: 0,
      disputes: 0,
      unpaidTcsObligations: scenario === "restricted" ? 1 : 0,
    }
  }
  if (status === "closure-pending" || status === "closed")
    org.closureRequestedAt = "2026-09-03T10:00:00Z"
  org.history = [
    {
      at,
      actor: "Prototype scenario",
      action:
        status === "draft"
          ? "Sample application draft prepared"
          : "Sample application submitted",
      after: org.application.snapshot,
    },
  ]
  if (operating) {
    org.history.push({ at: "2025-01-02T08:00:00Z", actor: "TCS review · demo scenario", action: "Sample Organization application approved", before: "pending", after: "approved" })
    org.history.push({ at: org.activatedAt!, actor: member.id, action: "Sample Organization activated", before: "approved", after: "active" })
    if (status === "restricted" || status === "suspended") org.history.push({ at: "2026-09-02T08:00:00Z", actor: "TCS review · demo scenario", action: `Represented Organization state: ${status}`, before: "active", after: status })
    if (org.closureRequestedAt) org.history.push({ at: org.closureRequestedAt, actor: member.id, action: "Sample Organization closure requested after clearance", before: "active", after: "closure-pending" })
    if (status === "closed") org.history.push({ at: "2026-09-04T10:00:00Z", actor: "TCS review · demo scenario", action: "Sample Organization closure approved; records retained", before: "closure-pending", after: "closed" })
  } else if (status !== "draft" && status !== "submitted") org.history.push({ at: "2026-09-02T08:00:00Z", actor: "TCS review · demo scenario", action: `Represented Organization state: ${status}`, before: "submitted", after: status })
  if (scenario.startsWith("settlement-")) {
    const proposed: SettlementAccount = {
      ...enquireSettlement("044", "2222222222"),
      confirmation: "owner-confirmed",
      confirmedAt: "2026-09-03T10:00:00Z",
    }
    const approved = scenario === "settlement-effective"
    org.settlementChanges = [
      {
        id: `change-${org.id}`,
        previous: { ...org.settlement! },
        proposed,
        reason: "Move business settlement to our updated operating account.",
        status: approved ? "approved" : "pending",
        requestedAt: proposed.confirmedAt,
        approvedAt: approved ? "2026-09-04T11:00:00Z" : undefined,
        effectiveAt: approved ? "2026-09-04T12:00:00Z" : undefined,
      },
    ]
    if (approved) org.settlement = proposed
    org.history.push({
      at: proposed.confirmedAt,
      actor: member.id,
      action: "Sample settlement change requested",
      before: org.settlementChanges[0].previous,
      after: proposed,
      reason: org.settlementChanges[0].reason,
    })
    if (approved)
      org.history.push({
        at: "2026-09-04T12:00:00Z",
        actor: "TCS review · demo scenario",
        action:
          "Settlement change approved and effective; provider update represented",
        before: org.settlementChanges[0].previous,
        after: proposed,
      })
  }
  return org
}
