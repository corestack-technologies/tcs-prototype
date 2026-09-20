import type { ThriftGroup } from "../groups/model.ts"
export interface CollectionAccount {
  id: string
  provider: string
  memberId: string
  organizationId: string
  scope: "member-organization-demo"
  bankName: string
  accountName: string
  accountNumber: string
  destination: "organization-provider-arrangement"
  prototype: true
}
export type AttemptStatus = "created" | "awaiting-payment" | "provider-pending" | "confirmed" | "failed" | "expired"
export type DemoOutcome = "success" | "pending" | "failed" | "expired" | "underpayment" | "overpayment"
export interface AllocationTarget {
  obligationId: string
  componentId: string
  roundId: string
  kind: "required" | "optional"
  amountMinor: number
}
export interface PaymentAttempt {
  id: string
  provider: string
  organizationId: string
  groupId: string
  cycleId: string
  roundId: string
  memberId: string
  accountId: string
  createdAt: string
  updatedAt: string
  status: AttemptStatus
  expectedMinor: number
  intent?: "contribution" | "advance"
  includeOptional: boolean
  targets: AllocationTarget[]
  demoOutcome: DemoOutcome
  transactionId?: string
}
export interface ProviderConfirmation {
  provider: string
  providerReference: string
  attemptId: string
  organizationId: string
  memberId: string
  currency: "NGN"
  amountMinor: number
  confirmedAt: string
  settlement: "pending" | "settled" | "exception"
}
export interface PaymentTransaction extends ProviderConfirmation {
  businessAt?: string
  id: string
  groupId: string
  cycleId: string
  roundId: string
  receivedAt: string
  status: "confirmed"
  allocationStatus: "unallocated" | "allocated" | "partially-allocated" | "exception"
  holdReason?: "awaiting-round-opening"
  allocatedMinor: number
  unallocatedMinor: number
}
export interface PaymentAllocation extends AllocationTarget {
  businessAt?: string
  source?: "organization-confirmed-manual"
  id: string
  transactionId: string
  memberId: string
  organizationId: string
  groupId: string
  cycleId: string
  confirmedAt: string
  timeliness: "on-time" | "grace" | "late" | "optional"
}
export interface PaymentException {
  id: string
  transactionId: string
  kind: "amount-mismatch" | "ineligible-obligation" | "duplicate-conflict"
  amountMinor: number
  reason: string
  at: string
  status: "open"
}
export interface OptionalDecision {
  cycleId: string
  roundId: string
  memberId: string
  choice: "contribute" | "skip"
  at: string
  lockedAt?: string
  confirmedMinorAtCutoff?: number
}
export interface PaymentRecords {
  optionalDecisions?: OptionalDecision[]
  accounts: CollectionAccount[]
  attempts: PaymentAttempt[]
  transactions: PaymentTransaction[]
  allocations: PaymentAllocation[]
  exceptions: PaymentException[]
}
export const emptyPayments = (): PaymentRecords => ({
  accounts: [],
  attempts: [],
  transactions: [],
  allocations: [],
  exceptions: [],
})
export const paymentRecords = (group: ThriftGroup) =>
  group.payments || emptyPayments()
export function minor(value: number): number {
  if (!Number.isSafeInteger(value) || value < 0)
    throw Error(
      "Payment amounts must be non-negative integer kobo within safe limits.",
    )
  return value
}

export function parsePaymentAmount(value: string): number {
  const match = /^(\d+)(?:\.(\d{1,2}))?$/.exec(value.trim())
  if (!match) throw Error("Use an amount with no more than two decimal places.")
  return minor(Number(match[1]) * 100 + Number((match[2] || "").padEnd(2, "0")))
}
