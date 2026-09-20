import type { MemberBankDetails } from "../clients/model.ts"
export interface PayoutPolicy {
  source: "prototype-policy"
  confirmationHours: number
  disputeHours: number
  breachHours: number
  tcsSharePercent: number
  flatFeeSplit?: "position-share"
  collectionSplit?: "own-optional"
  lateOptional?: "exception"
}
export interface BankSnapshot extends MemberBankDetails {
  memberId: string
  capturedAt: string
}
export interface PayoutInstruction {
  id: string
  at: string
  bank: BankSnapshot
  scheduledValueMinor: number
  entitlementMinor: number
  actualRoundCollectionMinor: number
  attributableCollectionMinor: number
  feeMinor: number
  netMinor: number
  status: "current" | "stale"
  staleReason?: string
}
export interface PayoutInstallment {
  id: string
  instructionId: string
  bank: BankSnapshot
  amountMinor: number
  at: string
  recordedAt: string
  actorId: string
  reference: string
  evidence?: { name: string ; type: string ; size: number ; file?: File }
  notes: string
  partial: boolean
  partialReason?: string
  completionPlan?: string
  expectedCompletionAt?: string
  feeRecognizedMinor: number
  tcsShareMinor: number
  confirmationDueAt: string
  disputeClosesAt?: string
  status: "awaiting-confirmation" | "member-confirmed" | "window-elapsed" | "disputed"
  confirmedAt?: string
  confirmedBy?: string
  autoCompletedAt?: string
  finalizedAt?: string
  amountException?: string
}
export interface PayoutDispute {
  id: string
  installmentId: string
  memberId: string
  reason: string
  at: string
  status: "open" | "resolved"
  process?: import("../operations/interventionModel.ts").DisputeProcess
}
export interface PayoutRecord {
  review?: import("../operations/review.ts").SourceReview
  id: string
  groupId: string
  cycleId: string
  roundId: string
  position: number
  memberId: string
  fraction: 1 | 0.5
  beneficiaryName: string
  calculation?: {
    scheduledValueMinor: number
    entitlementMinor: number
    actualRoundCollectionMinor: number
    attributableCollectionMinor: number
    feeMinor: number
    netMinor: number
  }
  calculationChanged?: string
  readyAt: string
  targetAt: string
  instructions: PayoutInstruction[]
  installments: PayoutInstallment[]
  disputes: PayoutDispute[]
  policy?: PayoutPolicy
  breach?: {
    at: string
    dueAt: string
    amountMinor: number
    status: "open" | "resolved"
    resolvedAt?: string
    caseId: string
  }
  status: "ready" | "instruction-prepared" | "partially-paid" | "awaiting-confirmation" | "disputed" | "completed-member-confirmed" | "completed-window-elapsed" | "completed-operations-evidence" | "exception"
  completedAt?: string
  finalizedAt?: string
}
export interface PayoutState {
  policy?: PayoutPolicy
  records: PayoutRecord[]
  demoBanks?: Record<string, MemberBankDetails>
  demo?: string
  referenceAt?: string
}
export type BankDirectory = Record<string, MemberBankDetails | undefined>
export const emptyPayouts = (): PayoutState => ({ records: [] })
export const bankKey = (bank: MemberBankDetails | undefined) =>
  bank
    ? JSON.stringify([
        bank.bankCode,
        bank.bankName,
        bank.accountNumber,
        bank.resolvedName,
        bank.status,
      ])
    : ""
export function validBank(
  bank: MemberBankDetails | undefined,
): bank is MemberBankDetails {
  return (
    !!bank &&
    bank.status === "demo-confirmed" &&
    !!bank.bankCode &&
    !!bank.bankName &&
    /^\d{10}$/.test(bank.accountNumber) &&
    bank.resolvedName.trim().length > 2 &&
    Number.isFinite(Date.parse(bank.confirmedAt))
  )
}
export function validatePolicy(p: PayoutPolicy) {
  for (const n of [p.confirmationHours, p.disputeHours, p.breachHours])
    if (!Number.isInteger(n) || n < 1 || n > 8760)
      throw Error("Use positive prototype policy windows of up to one year.")
  if (
    !Number.isFinite(p.tcsSharePercent) ||
    p.tcsSharePercent < 0 ||
    p.tcsSharePercent > 100
  )
    throw Error("TCS share must be a valid percentage of the Organization fee.")
}
