import { fullName, type Client } from "../clients/model.ts"
import {
  canApply,
  closureBlockers,
  emptyOrganizationForm,
  organizationFormErrors,
  type Organization,
  type OrganizationForm,
  type SettlementAccount,
} from "./model.ts"

function owner(org: Organization, member: Client) {
  if (org.ownerMemberId !== member.id)
    throw new Error("This Organization belongs to another Member.")
}
function mutable(org: Organization, member: Client) {
  owner(org, member)
  if (org.status === "closed")
    throw new Error("Closed Organization records are read-only.")
}
function audit(
  org: Organization,
  member: Client,
  action: string,
  before?: unknown,
  after?: unknown,
  reason?: string,
): Organization["history"] {
  return [
    ...org.history,
    {
      at: new Date().toISOString(),
      actor: member.id,
      action,
      before,
      after,
      reason,
    },
  ]
}
export function createOrganization(
  member: Client,
  existing: Organization | null,
): Organization {
  if (!canApply(member))
    throw new Error("An active, verified Member is required to apply.")
  if (existing)
    throw new Error(
      "You already have an Organization or application in this scenario.",
    )
  return {
    id: crypto.randomUUID(),
    ownerMemberId: member.id,
    status: "draft",
    form: { ...emptyOrganizationForm },
    application: { responses: [] },
    settlementChanges: [],
    clearance: null,
    notifications: {
      applications: true,
      contributions: true,
      payouts: true,
      announcements: false,
    },
    activity: {
      asOf: "",
      groups: [],
      contributed: 0,
      paidOut: 0,
      completedCycles: 0,
      payouts: [],
      recent: [],
      pendingJoinRequests: 0,
    },
    history: [
      {
        at: new Date().toISOString(),
        actor: member.id,
        action: "Organization application started",
      },
    ],
    example: false,
  }
}
export function editApplication(
  org: Organization,
  member: Client,
  patch: Partial<OrganizationForm>,
): Organization {
  owner(org, member)
  if (org.status !== "draft")
    throw new Error(
      "Submitted application details are retained as a read-only record.",
    )
  return {
    ...org,
    form: {
      ...org.form,
      ...patch,
      declarationAccepted: Object.keys(patch).some(
        (key) => key !== "declarationAccepted",
      )
        ? false
        : (patch.declarationAccepted ?? org.form.declarationAccepted),
    },
  }
}
export function submitApplication(
  org: Organization,
  member: Client,
): Organization {
  owner(org, member)
  if (org.status !== "draft" || !canApply(member))
    throw new Error("Only an eligible Member can submit a draft application.")
  if (Object.keys(organizationFormErrors(org.form)).length)
    throw new Error(
      "Complete the required application details before submitting.",
    )
  if (!org.form.declarationAccepted)
    throw new Error("Accept the application declaration before submitting.")
  if (org.form.logo) validateOrganizationFile(org.form.logo, true)
  if (org.form.existingRecords)
    validateOrganizationFile(org.form.existingRecords)
  if (org.form.supportingDocs) validateOrganizationFile(org.form.supportingDocs)
  const at = new Date().toISOString()
  return {
    ...org,
    status: "submitted",
    application: {
      ...org.application,
      submittedAt: at,
      snapshot: { ...org.form },
      ownerSnapshot: { name: fullName(member), email: member.profile.email },
    },
    history: audit(
      org,
      member,
      "Application submitted for independent review",
      "draft",
      "submitted",
    ),
  }
}
export function respondToInformation(
  org: Organization,
  member: Client,
  text: string,
  document: File | null,
): Organization {
  owner(org, member)
  if (org.status !== "information-required" || !text.trim())
    throw new Error("Provide the requested information before submitting.")
  if (document) validateOrganizationFile(document)
  return {
    ...org,
    status: "pending",
    application: {
      ...org.application,
      review: org.application.review?{...org.application.review,caseStatus:'In Review',state:'Additional information received',publicMessage:undefined}:undefined,
      responses: [
        ...org.application.responses,
        { at: new Date().toISOString(), text: text.trim(), document },
      ],
    },
    history: audit(
      org,
      member,
      "Additional application information submitted",
      "information-required",
      "pending",
    ),
  }
}
export function validateOrganizationFile(file: File, logo = false) {
  const types = logo
    ? ["image/png", "image/jpeg"]
    : [
        "image/png",
        "image/jpeg",
        "application/pdf",
        "application/vnd.ms-excel",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      ]
  if (
    !types.includes(file.type) ||
    !file.size ||
    file.size > (logo ? 2 : 5) * 1024 * 1024
  )
    throw new Error(
      logo
        ? "Choose a non-empty PNG or JPG up to 2 MB."
        : "Choose a non-empty PDF, spreadsheet, PNG or JPG up to 5 MB.",
    )
}
export function editOrganizationProfile(
  org: Organization,
  member: Client,
  patch: Partial<OrganizationForm>,
): Organization {
  mutable(org, member)
  if (!["approved", "active", "restricted", "suspended"].includes(org.status))
    throw new Error("Profile changes are unavailable at this lifecycle stage.")
  const allowed = [
    "name",
    "tagline",
    "description",
    "email",
    "phone",
    "address",
    "location",
    "accent",
    "logo",
    "logoStyle",
  ]
  if (Object.keys(patch).some((key) => !allowed.includes(key)))
    throw new Error("Submitted business identity changes require TCS review.")
  if (patch.logo) validateOrganizationFile(patch.logo, true)
  const form = { ...org.form, ...patch }
  const errors = organizationFormErrors(form)
  if (Object.keys(patch).some((key) => errors[key]))
    throw new Error("Review the highlighted business profile details.")
  return {
    ...org,
    form,
    history: audit(org, member, "Organization profile updated", org.form, form),
  }
}
export const settlementBanks = [
  { code: "058", name: "GTBank" },
  { code: "044", name: "Access Bank" },
  { code: "057", name: "Zenith Bank" },
] as const
export interface SettlementEnquiry {
  bankCode: string
  bankName: string
  accountNumber: string
  resolvedName: string
  validation: "demo-resolved"
}
export function enquireSettlement(
  bankCode: string,
  accountNumber: string,
): SettlementEnquiry {
  const bank = settlementBanks.find((item) => item.code === bankCode)
  if (!bank) throw new Error("Select a bank.")
  if (!/^\d{10}$/.test(accountNumber))
    throw new Error("Enter a 10-digit account number.")
  if (accountNumber === "0000000000")
    throw new Error("Account not found in the demo. Check the sample details.")
  if (accountNumber === "9999999999")
    throw new Error(
      "Demo Name Enquiry is unavailable for this account. Retry with another sample.",
    )
  const names: Record<string, string> = {
    "0123456789": "OLAHBEE’S WORLD ENTERPRISES",
    "1234567890": "ADAEZE THRIFT NETWORK",
    "2222222222": "OLAHBEE WORLD SERVICES",
  }
  if (!names[accountNumber])
    throw new Error(
      "No sample account found. Use one of the listed demo accounts.",
    )
  return {
    bankCode,
    bankName: bank.name,
    accountNumber,
    resolvedName: names[accountNumber],
    validation: "demo-resolved",
  }
}
function confirmedAccount(
  result: SettlementEnquiry,
  confirmed: boolean,
): SettlementAccount {
  const resolved = enquireSettlement(result.bankCode, result.accountNumber)
  if (!confirmed)
    throw new Error("Confirm the resolved settlement account before saving.")
  if (
    resolved.resolvedName !== result.resolvedName ||
    resolved.bankName !== result.bankName
  )
    throw new Error("Run Name Enquiry again for the current account.")
  return {
    ...resolved,
    confirmation: "owner-confirmed",
    confirmedAt: new Date().toISOString(),
  }
}
export function saveInitialSettlement(
  org: Organization,
  member: Client,
  result: SettlementEnquiry,
  confirmed: boolean,
): Organization {
  mutable(org, member)
  if (org.status !== "approved" || org.settlement)
    throw new Error(
      "An existing settlement account can only be changed through review.",
    )
  const settlement = confirmedAccount(result, confirmed)
  return {
    ...org,
    settlement,
    history: audit(
      org,
      member,
      "Initial settlement account confirmed by Owner (demo)",
      undefined,
      settlement,
    ),
  }
}
export function requestSettlementChange(
  org: Organization,
  member: Client,
  result: SettlementEnquiry,
  confirmed: boolean,
  reason: string,
): Organization {
  mutable(org, member)
  if (
    !org.settlement ||
    !["approved", "active", "restricted", "suspended"].includes(org.status)
  )
    throw new Error("No eligible current settlement account.")
  if (org.settlementChanges.some((change) => ["pending","information-required"].includes(change.status) || (change.status === "approved" && !change.effectiveAt)))
    throw new Error("A settlement change is already awaiting review.")
  if (!reason.trim())
    throw new Error("Explain why you are requesting a settlement change.")
  const proposed = confirmedAccount(result, confirmed)
  if (
    proposed.bankCode === org.settlement.bankCode &&
    proposed.accountNumber === org.settlement.accountNumber
  )
    throw new Error("This is already your current settlement account.")
  const change = {
    id: crypto.randomUUID(),
    proposed,
    previous: { ...org.settlement },
    reason: reason.trim(),
    status: "pending" as const,
    requestedAt: new Date().toISOString(),
  }
  return {
    ...org,
    settlementChanges: [...org.settlementChanges, change],
    history: audit(
      org,
      member,
      "Settlement change requested; current account remains effective",
      org.settlement,
      proposed,
      reason.trim(),
    ),
  }
}
export function activateOrganization(
  org: Organization,
  member: Client,
  acknowledged: boolean,
): Organization {
  owner(org, member)
  if (
    org.status !== "approved" ||
    !canApply(member) ||
    !org.settlement ||
    !acknowledged
  )
    throw new Error(
      "Complete settlement setup and acknowledge your Owner responsibilities before activation.",
    )
  return {
    ...org,
    status: "active",
    activatedAt: new Date().toISOString(),
    clearance: {
      activeCycles: 0,
      outstandingPayouts: 0,
      exitSettlements: 0,
      recoveryCases: 0,
      disputes: 0,
      unpaidTcsObligations: 0,
    },
    history: audit(
      org,
      member,
      "Approved Organization activated by Owner (prototype)",
      "approved",
      "active",
    ),
  }
}
export function requestOrganizationClosure(
  org: Organization,
  member: Client,
  acknowledged: boolean,
): Organization {
  mutable(org, member)
  if (
    !["active", "restricted", "suspended"].includes(org.status) ||
    closureBlockers(org).length
  )
    throw new Error("Clear material activity before requesting normal closure.")
  if (!acknowledged)
    throw new Error(
      "Confirm that closure requires TCS review and history is retained.",
    )
  return {
    ...org,
    status: "closure-pending",
    closureRequestedAt: new Date().toISOString(),
    history: audit(
      org,
      member,
      "Organization closure requested; independent clearance required",
      org.status,
      "closure-pending",
    ),
  }
}
export function saveOrganizationNotifications(
  org: Organization,
  member: Client,
  notifications: Organization["notifications"],
): Organization {
  mutable(org, member)
  return {
    ...org,
    notifications: { ...notifications },
    history: audit(
      org,
      member,
      "Organization notification preferences saved",
      org.notifications,
      notifications,
    ),
  }
}

// Explicit local provider-event fixture. Internal approval alone never activates
// an account; a production adapter must supply a trusted provider confirmation.
export function applyPrototypeSettlementUpdate(org:Organization,event:{kind:'prototype-provider-update-confirmed';requestId:string;reference:string;at:string}):Organization {
  if(event.kind!=='prototype-provider-update-confirmed'||!event.reference.startsWith('DEMO-PROVIDER-')||!Number.isFinite(Date.parse(event.at)))throw Error('An explicit prototype provider confirmation is required.')
  const next=structuredClone(org),change=next.settlementChanges.find(c=>c.id===event.requestId)
  if(!change||change.status!=='approved'||!change.approvedAt||Date.parse(event.at)<Date.parse(change.approvedAt))throw Error('Provider confirmation must follow account-change approval.')
  if(change.effectiveAt)return next
  change.effectiveAt=event.at
  next.settlement=structuredClone(change.proposed)
  if(change.review){change.review.state='Approved — provider update confirmed / effective';change.review.caseStatus='Resolved'}
  next.history.push({at:event.at,actor:'Prototype provider confirmation',action:'Settlement account update confirmed: '+event.reference,before:change.previous,after:change.proposed})
  return next
}
