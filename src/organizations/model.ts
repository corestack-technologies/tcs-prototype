import type { SourceReview } from '../operations/review.ts'
import type { Client } from "../clients/model.ts"

export type OrganizationStatus = "draft" | "submitted" | "pending" | "information-required" | "approved" | "active" | "restricted" | "suspended" | "closure-pending" | "closed" | "declined"
export interface OrganizationForm {
  name: string
  legalName: string
  tagline: string
  description: string
  orgType: string
  location: string
  email: string
  phone: string
  address: string
  registration: string
  logo: File | null
  accent: "blue" | "navy"
  logoStyle: "arch" | "circle" | "initials"
  estimatedMembers: string
  frequency: string
  avgAmount: string
  existingProcess: string
  communitiesServed: string
  meetingSchedule: string
  whyDigitize: string
  challenges: string
  expectedBenefits: string
  existingRecords: File | null
  communityRefs: string
  supportingDocs: File | null
  declarationAccepted: boolean
}
export interface SettlementAccount {
  bankCode: string
  bankName: string
  accountNumber: string
  resolvedName: string
  validation: "demo-resolved"
  confirmation: "owner-confirmed"
  confirmedAt: string
}
export interface SettlementChange {
  review?: SourceReview
  id: string
  proposed: SettlementAccount
  previous: SettlementAccount
  reason: string
  status: "pending" | "approved" | "information-required" | "rejected"
  requestedAt: string
  approvedAt?: string
  effectiveAt?: string
}
export interface Organization {
  restrictions?: import('../operations/interventionModel.ts').RestrictionRecord[]
  interventionReview?: import('../operations/review.ts').SourceReview
  commercialRestricted?: boolean
  id: string
  ownerMemberId: string
  status: OrganizationStatus
  form: OrganizationForm
  application: {
  review?: SourceReview
    submittedAt?: string
    snapshot?: OrganizationForm
    ownerSnapshot?: {
      name: string
      email: string
    }
    note?: string
    responses: {
      at: string
      text: string
      document: File | null
    }[]
  }
  settlement?: SettlementAccount
  settlementChanges: SettlementChange[]
  activatedAt?: string
  closureRequestedAt?: string
  clearance: {
    activeCycles: number
    outstandingPayouts: number
    exitSettlements: number
    recoveryCases: number
    disputes: number
    unpaidTcsObligations: number
    paymentCases?: number
    payoutCases?: number
    reconciliationCases?: number
    tcsReceivableCases?: number
  } | null
  notifications: {
    applications: boolean
    contributions: boolean
    payouts: boolean
    announcements: boolean
  }
  activity: {
    asOf: string
    groups: {
      id: string
      name: string
      members: number
      amount: number
      frequency: string
      round: number
      rounds: number
      paid: number
      status: "active" | "completed"
    }[]
    contributed: number
    paidOut: number
    completedCycles: number
    payouts: {
      id: string
      groupId: string
      groupName: string
      recipient: string
      amount: number
      dueDate: string
      status: "in-progress" | "upcoming" | "ready" | "dispatched"
    }[]
    recent: {
      id: string
      message: string
      time: string
    }[]
    pendingJoinRequests: number
  }
  history: {
    at: string
    actor: string
    action: string
    before?: unknown
    after?: unknown
    reason?: string
  }[]
  example: boolean
}
export const emptyOrganizationForm: OrganizationForm = {
  name: "",
  legalName: "",
  tagline: "",
  description: "",
  orgType: "",
  location: "",
  email: "",
  phone: "",
  address: "",
  registration: "",
  logo: null,
  accent: "blue",
  logoStyle: "initials",
  estimatedMembers: "",
  frequency: "",
  avgAmount: "",
  existingProcess: "",
  communitiesServed: "",
  meetingSchedule: "",
  whyDigitize: "",
  challenges: "",
  expectedBenefits: "",
  existingRecords: null,
  communityRefs: "",
  supportingDocs: null,
  declarationAccepted: false,
}
export const organizationStatusLabels: Record<OrganizationStatus, string> = {
  draft: "Application draft",
  submitted: "Submitted",
  pending: "Pending review",
  "information-required": "Information required",
  approved: "Approved · setup needed",
  active: "Active",
  restricted: "Restricted",
  suspended: "Suspended",
  "closure-pending": "Closure pending",
  closed: "Closed",
  declined: "Declined",
}
export const hasWorkspace = (org: Organization) =>
  [
    "approved",
    "active",
    "restricted",
    "suspended",
    "closure-pending",
    "closed",
  ].includes(org.status)
export const canApply = (member: Client) =>
  member.verification.status === "verified" && member.accountStatus === "active" && !member.restrictions?.some(r=>r.reviewStatus==='active')
export const canStartNewActivity = (org: Organization) =>
  org.status === "active" && !org.restrictions?.some(r=>r.reviewStatus==='active')
export const clearanceLabels = {
  activeCycles: "Active Cycles",
  outstandingPayouts: "Outstanding payouts",
  exitSettlements: "Exit settlements",
  recoveryCases: "Defaults / recovery",
  disputes: "Unresolved disputes",
  unpaidTcsObligations: "Unpaid TCS obligations",
  paymentCases: "Unallocated payments / advance reservations",
  reconciliationCases: "Financial reconciliation / review cases",
  tcsReceivableCases: "TCS revenue-share receivables",
  payoutCases: "Unresolved payouts / recipient confirmation",
}
export function closureBlockers(org: Organization) {
  if (!org.clearance) return ["Clearance has not yet been established"]
  return Object.entries(org.clearance)
    .filter(([, count]) => count > 0)
    .map(
      ([key, count]) =>
        `${clearanceLabels[(key as keyof typeof clearanceLabels)]}: ${count}`,
    )
}
export function organizationFormErrors(form: OrganizationForm) {
  const errors: Record<string, string> = {}
  for (const key of [
    "name",
    "description",
    "orgType",
    "location",
    "email",
    "phone",
    "address",
    "estimatedMembers",
    "frequency",
    "avgAmount",
    "whyDigitize",
    "challenges",
  ] as const)
    if (!form[key].trim()) errors[key] = "Please complete this field."
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
    errors.email = "Enter a valid business email."
  if (!/^\+?[\d\s()-]{10,18}$/.test(form.phone))
    errors.phone = "Enter a valid business phone number."
  if (!/^\d+$/.test(form.estimatedMembers))
    errors.estimatedMembers =
      "Enter a whole number (zero is allowed for a new operation)."
  if (!/^\d+(\.\d{1,2})?$/.test(form.avgAmount) || Number(form.avgAmount) <= 0)
    errors.avgAmount = "Enter a positive amount without commas."
  if (!["Daily", "Weekly", "Biweekly", "Monthly"].includes(form.frequency))
    errors.frequency = "Select a contribution frequency."
  return errors
}
