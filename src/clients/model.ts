import { contactsVerified } from '../settings/service.ts'
import type { SourceReview } from '../operations/review.ts'
export type VerificationStatus = "required" | "pending" | "information-required" | "rejected" | "verified"
export type AccountStatus = "active" | "restricted" | "suspended" | "closed"
export interface Profile {
  firstName: string
  middleName: string
  lastName: string
  email: string
  phone: string
  dob: string
  gender: string
  language: string
  address: string
  city: string
  state: string
  bankName: string
  accountNumber: string
  accountName: string
}
export interface IdentityDraft {
  nin: string
  ninDocument: File | null
  addressDocument: File | null
}
export interface Clearance {
  activeCycles: number
  obligations: number
  awaitingPayouts: number
  recoveryCases: number
  disputes: number
}
export interface Client {
  restrictions?: import('../operations/interventionModel.ts').RestrictionRecord[]
  interventionReview?: import('../operations/review.ts').SourceReview
  profileImage?: File
  bankDetails?: MemberBankDetails
  restrictionReason?: string
  restrictionNextAction?: string
  id: string
  profile: Profile
  contacts: { email: boolean; phone: boolean }
  onboardingComplete: boolean
  verification: {
  review?: SourceReview
    status: VerificationStatus
    responses?: { at: string; text: string; document: File | null }[]
    submittedAt?: string
    note?: string
    submission?: { profile: Profile; nin: string; documents: string[] }
  }
  identity: IdentityDraft
  accountStatus: AccountStatus
  closureRequestedAt?: string
  clearance: Clearance | null
  example: boolean
  personaId?: string
  activity?: MemberActivity
  history: { at: string; action: string }[]
}
export interface MemberBankDetails {
  bankCode: string
  bankName: string
  accountNumber: string
  resolvedName: string
  status: 'demo-confirmed'
  confirmedAt: string
}
export const emptyProfile: Profile = {
  firstName: "",
  middleName: "",
  lastName: "",
  email: "",
  phone: "",
  dob: "",
  gender: "",
  language: "English",
  address: "",
  city: "",
  state: "",
  bankName: "",
  accountNumber: "",
  accountName: "",
}
export const fullName = (client: Client) =>
  [client.profile.firstName, client.profile.middleName, client.profile.lastName]
    .filter(Boolean)
    .join(" ")
export const contactComplete = (client: Client) =>
  contactsVerified(client.contacts)
export function profileErrors(profile: Profile, today = new Date()) {
  const errors: Record<string, string> = {}
  for (const key of [
    "firstName",
    "lastName",
    "dob",
    "address",
    "city",
    "state",
  ] as const)
    if (!profile[key].trim()) errors[key] = "Please complete this field."
  if (profile.dob) {
    const date = new Date(`${profile.dob}T00:00:00Z`)
    if (
      !/^\d{4}-\d{2}-\d{2}$/.test(profile.dob) ||
      !Number.isFinite(date.getTime()) ||
      date.toISOString().slice(0, 10) !== profile.dob ||
      profile.dob > today.toISOString().slice(0, 10)
    )
      errors.dob = "Enter a valid birth date that is not in the future."
    else {
      let age = today.getUTCFullYear() - date.getUTCFullYear()
      if (today.getUTCMonth() < date.getUTCMonth() || (today.getUTCMonth() === date.getUTCMonth() && today.getUTCDate() < date.getUTCDate())) age--
      if (age < 18) errors.dob = "You must be at least 18 years old to become a TCS Member."
    }
  }
  if (profile.accountNumber || profile.bankName || profile.accountName) {
    if (!/^\d{10}$/.test(profile.accountNumber))
      errors.accountNumber = "Enter a 10-digit account number."
    if (!profile.bankName.trim()) errors.bankName = "Enter your bank name."
    if (!profile.accountName.trim())
      errors.accountName = "Enter the account holder name."
  }
  return errors
}
export function closureEligibility(
  clearance: Clearance | null,
): "unknown" | "blocked" | "clear" {
  if (!clearance) return "unknown"
  return Object.values(clearance).some((count) => count > 0)
    ? "blocked"
    : "clear"
}
export function clientStatus(client: Client) {
  if (client.accountStatus === "closed")
    return {
      label: "Account closed",
      title: "Your account is closed",
      detail: "Your historical records are retained.",
      tone: "neutral",
    }
  if (client.accountStatus !== "active")
    return {
      label:
        client.accountStatus === "suspended"
          ? "Account suspended"
          : "Account restricted",
      title: "Some account activity is restricted",
      detail:
        "Essential account access remains available. Restrictions do not cancel existing financial responsibilities or dispute rights.",
      tone: "warning",
    }
  if (!contactComplete(client))
    return {
      label: "Verify your contact",
      title: "Let’s confirm your contact details",
      detail: "Verify your email and phone before completing your profile.",
      tone: "warning",
    }
  if (!client.onboardingComplete)
    return {
      label: "Onboarding incomplete",
      title: "Make yourself at home",
      detail:
        "A few details will help complete your TCS profile. Your progress stays with you as you move between pages.",
      tone: "brand",
    }
  return verificationStatus(client)
}
export function verificationStatus(client: Client) {
  const statuses = {
    required: {
      label: "Verification required",
      title: "Your profile is ready. Verify your identity next.",
      detail:
        "Review your details and prepare your identity documents for TCS review.",
      tone: "brand",
    },
    pending: {
      label: "Pending review",
      title: "Your verification is awaiting review",
      detail:
        "Your submission has been recorded. No further action is needed unless TCS requests more information.",
      tone: "warning",
    },
    "information-required": {
      label: "Information required",
      title: "Your verification needs another look",
      detail:
        client.verification.note ||
        "Review the requested information before submitting again.",
      tone: "warning",
    },
    rejected: {
      label: "Verification declined",
      title: "Review your verification outcome",
      detail:
        client.verification.note ||
        "Your submission was declined. Review the decision before taking your next step.",
      tone: "danger",
    },
    verified: {
      label: "Identity verified",
      title: "Your TCS profile is verified",
      detail:
        "Your Member identity belongs to you, independently of any Organization. Future participation remains subject to eligibility.",
      tone: "success",
    },
  }
  return statuses[client.verification.status]
}
export function createClient(profile: Profile): Client {
  return {
    id: crypto.randomUUID(),
    profile,
    contacts: { email: false, phone: false },
    onboardingComplete: false,
    verification: { status: "required" },
    identity: { nin: "", ninDocument: null, addressDocument: null },
    accountStatus: "active",
    clearance: null,
    example: false,
    history: [
      {
        at: new Date().toISOString(),
        action: "Account created in this prototype session",
      },
    ],
  }
}
export interface GroupPreview {
  id: string
  name: string
  organization: string
  monthlyContribution: number
  position: number
  positions: number
  round: number
  cycleNumber: number
  contributionDueDate: string
  paidRounds: number
  payoutDate: string
  scheduledValue: number
  organizationFee: number
}
export interface MemberActivity {
  asOf: string
  groups: GroupPreview[]
  contributions: { id: string; groupId: string; amount: number; paidAt: string; reference: string }[]
  payouts: { id: string; groupId: string; amount: number; receivedAt: string; reference: string }[]
}
