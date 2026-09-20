import {
  closureEligibility,
  contactComplete,
  profileErrors,
  type Client,
  type IdentityDraft,
  type Profile,
} from "./model.ts"

export const clientPrototypePolicy = {
  // Explicitly enabled prototype interaction; replace with contact delivery in production.
  allowLocalContactCode: true,
  localContactCode: "246810",
}
const editable = (client: Client) =>
  client.verification.status === "required" &&
  !client.verification.submission &&
  client.accountStatus !== "closed"
export function editProfile(
  client: Client,
  key: keyof Profile,
  value: string,
): Client {
  if (!editable(client))
    throw new Error("This verification record requires a reviewed change.")
  if (key === "email" || key === "phone")
    throw new Error("Contact changes require separate verification.")
  if (["bankName", "accountNumber", "accountName"].includes(key))
    throw new Error("Resolve and confirm bank details before saving.")
  return {
    ...client,
    profile: { ...client.profile, [key]: value },
    onboardingComplete: false,
  }
}
export function finishOnboarding(client: Client): Client {
  if (!editable(client) || !contactComplete(client))
    throw new Error("Verify your contact details before completing onboarding.")
  if (Object.keys(profileErrors(client.profile)).length)
    throw new Error("Complete the required profile fields.")
  return {
    ...client,
    onboardingComplete: true,
    history: [
      ...client.history,
      {
        at: new Date().toISOString(),
        action: "Profile completed and reviewed by Member",
      },
    ],
  }
}
export function editIdentity(
  client: Client,
  identity: Partial<IdentityDraft>,
): Client {
  if (!editable(client))
    throw new Error("The submitted identity record cannot be edited directly.")
  return { ...client, identity: { ...client.identity, ...identity } }
}
export function submitIdentity(client: Client, acknowledged: boolean): Client {
  if (
    !editable(client) ||
    !client.onboardingComplete ||
    !contactComplete(client)
  )
    throw new Error(
      "Complete your profile and contact verification before submitting.",
    )
  if (Object.keys(profileErrors(client.profile)).length)
    throw new Error("Review your profile details before submitting.")
  if (!/^\d{11}$/.test(client.identity.nin))
    throw new Error("Enter your 11-digit NIN.")
  if (!client.identity.ninDocument || !client.identity.addressDocument)
    throw new Error("Attach both your NIN document and proof of address.")
  if (!acknowledged)
    throw new Error("Confirm that you have reviewed your information.")
  const at = new Date().toISOString()
  return {
    ...client,
    verification: {
      status: "pending",
      submittedAt: at,
      submission: {
        profile: { ...client.profile },
        nin: client.identity.nin,
        documents: [
          client.identity.ninDocument.name,
          client.identity.addressDocument.name,
        ],
      },
    },
    history: [
      ...client.history,
      { at, action: "Verification submitted for review" },
    ],
  }
}
export function verifyLocalContact(
  client: Client,
  channel: "email" | "phone",
  code: string,
): Client {
  if (!clientPrototypePolicy.allowLocalContactCode)
    throw new Error("Prototype contact confirmation is currently disabled.")
  if (client.contacts[channel])
    throw new Error("This contact has already been confirmed.")
  if (code !== clientPrototypePolicy.localContactCode)
    throw new Error("That code does not match the displayed local demo code.")
  return {
    ...client,
    contacts: { ...client.contacts, [channel]: true },
    history: [
      ...client.history,
      {
        at: new Date().toISOString(),
        action: `${
          channel === "email" ? "Email" : "Phone"
        } confirmed using explicit local demo code`,
      },
    ],
  }
}
export function requestClosure(client: Client): Client {
  if (closureEligibility(client.clearance) === "blocked")
    throw new Error(
      "Active participation or unresolved financial cases prevent closure.",
    )
  if (client.accountStatus === "closed" || client.closureRequestedAt)
    throw new Error("A closure request is already recorded.")
  const at = new Date().toISOString()
  return {
    ...client,
    closureRequestedAt: at,
    history: [
      ...client.history,
      {
        at,
        action:
          "Account closure review requested; clearance and approval outstanding",
      },
    ],
  }
}

export const prototypeBanks = [
  { code: "058", name: "GTBank" },
  { code: "044", name: "Access Bank" },
  { code: "057", name: "Zenith Bank" },
] as const

export interface NameEnquiryResult {
  bankCode: string
  accountNumber: string
  resolvedName: string
}

// Fixed fixtures deliberately do not infer a beneficiary from the Member's name.
export function enquireAccountName(
  bankCode: string,
  accountNumber: string,
): NameEnquiryResult {
  if (!prototypeBanks.some((bank) => bank.code === bankCode))
    throw new Error("Select a supported bank.")
  if (!/^\d{10}$/.test(accountNumber))
    throw new Error("Enter a 10-digit account number.")
  if (accountNumber === "0000000000")
    throw new Error("Demo account not found. Check the account number.")
  if (accountNumber === "9999999999")
    throw new Error(
      "Demo Name Enquiry unavailable. Try another sample account.",
    )
  const names: Record<string, string> = {
    "0123456789": "ADEOLA JOHNSON",
    "1234567890": "CHISOM OKAFOR",
  }
  if (!names[accountNumber])
    throw new Error(
      "No demo match. Use one of the sample accounts shown below.",
    )
  return { bankCode, accountNumber, resolvedName: names[accountNumber] }
}

export function saveBankDetails(
  client: Client,
  result: NameEnquiryResult,
  confirmed: boolean,
): Client {
  if (client.accountStatus === "closed")
    throw new Error("This account is closed.")
  if (!confirmed)
    throw new Error(
      "Confirm that the resolved account belongs to you before saving.",
    )
  const resolved = enquireAccountName(result.bankCode, result.accountNumber)
  if (resolved.resolvedName !== result.resolvedName)
    throw new Error("Run Name Enquiry again before confirming.")
  const at = new Date().toISOString()
  return {
    ...client,
    bankDetails: {
      ...resolved,
      bankName: prototypeBanks.find((bank) => bank.code === resolved.bankCode)!
        .name,
      status: "demo-confirmed",
      confirmedAt: at,
    },
    history: [
      ...client.history,
      { at, action: "Member confirmed and saved demo bank details" },
    ],
  }
}

export function setProfileImage(client: Client, file: File | null): Client {
  if (client.accountStatus === "closed")
    throw new Error("This account is closed.")
  if (
    file &&
    (!["image/jpeg", "image/png"].includes(file.type) ||
      file.size === 0 ||
      file.size > 5 * 1024 * 1024)
  )
    throw new Error("Choose a non-empty JPG or PNG no larger than 5 MB.")
  return {
    ...client,
    profileImage: file ?? undefined,
    history: [
      ...client.history,
      {
        at: new Date().toISOString(),
        action: file ? "Display picture updated" : "Display picture removed",
      },
    ],
  }
}

export function respondToVerification(client:Client,text:string,document:File|null):Client {
  if(client.verification.status!=='information-required'||text.trim().length<5)throw Error('Provide the requested verification information.')
  if(document&&(!['image/png','image/jpeg','application/pdf'].includes(document.type)||document.size<=0||document.size>5*1024*1024))throw Error('Use a non-empty JPG, PNG or PDF up to 5 MB.')
  const at=new Date().toISOString(),review=client.verification.review
  return {...client,verification:{...client.verification,status:'pending',responses:[...(client.verification.responses||[]),{at,text:text.trim(),document}],review:review?{...review,caseStatus:'In Review',state:'Additional information received',publicMessage:undefined}:undefined},history:[...client.history,{at,action:'Member submitted requested verification information'}]}
}
