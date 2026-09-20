import type { SourceReview } from '../operations/review.ts'
import type { SettlementAccount } from "../organizations/model.ts"
import type { ProviderConfirmation } from "../payments/model.ts"
export interface FinancePolicy {
  source: "explicit-demo-policy"
  settlementHours: number
  tcsOverdueHours: number
  tcsRestrictedHours: number
  expectedProviderFeePercent?: number
  manual: "off" | "organization-confirmed" | "review-required"
}
export interface AuditEvent {
  authority?: import("../access/model.ts").AuthoritySnapshot
  at: string
  actor: string
  action: string
  reason?: string
  before?: string
  after?: string
}
export interface ProviderSettlement {
  provider: string
  reference: string
  organizationId: string
  settledAt: string
  destination: SettlementAccount
  grossMinor: number
  processingFeeMinor: number
  otherDeductionsMinor: number
  deductionReason?: string
  netMinor: number
  lines: { providerReference: string ; grossMinor: number }[]
}
export interface SettlementRecord extends ProviderSettlement {
  reconciliationLinks?: { providerReference: string; transactionId: string; decisionId: string; at: string; actor: string; reason: string }[]
  id: string
  receivedAt: string
  status: "matched" | "partially-matched" | "unmatched" | "variance"
  matchedTransactionIds: string[]
  varianceMinor: number
  history: AuditEvent[]
}
export interface SettlementExpectation {
  transactionId: string
  groupId?: string
  cycleId?: string
  memberId: string
  provider: string
  providerReference: string
  grossMinor: number
  confirmedAt: string
  expectedFeeMinor?: number
  expectedNetMinor?: number
  dueAt?: string
  matchedGrossMinor: number
  status: "pending" | "delayed" | "partial" | "settled" | "exception"
}
export interface FinanceCase {
  adjustment?: import("./evidencedRevenue.ts").RecognitionAdjustment
  review?: SourceReview
  id: string
  organizationId: string
  groupId?: string
  cycleId?: string
  roundId?: string
  memberId?: string
  transactionId?: string
  settlementId?: string
  payoutId?: string
  obligationId?: string
  lifecycleId?: string
  kind: "fee-adjustment" | "revenue-share" | "amount-mismatch" | "unallocated" | "advance" | "late-optional" | "settlement" | "manual" | "duplicate" | "payout" | "recovery" | "exit"
  amountMinor: number
  reason: string
  sourceReference?: string
  createdAt: string
  status: "open" | "review-required" | "under-review" | "escalated" | "resolved"
  evidence?: { name: string ; type: string ; size: number }
  history: AuditEvent[]
}
export interface ManualContribution {
  review?: SourceReview
  id: string
  organizationId: string
  groupId: string
  cycleId: string
  roundId: string
  memberId: string
  amountMinor: number
  paidAt: string
  recordedAt: string
  actorId: string
  channel: "ordinary-bank-transfer" | "cash" | "approved-offline"
  reference: string
  reason: string
  evidence: { name: string ; type: string ; size: number ; file?: File }
  source: "organization-confirmed-manual"
  status: "allocated" | "review-required" | "rejected"
  allocatedMinor: number
}
export interface RevenueReceivable {
  review?: SourceReview
  dueAt: string
  sharePercent: number
  paymentReference: string
  account: RevenueAccount
  paymentStatus: "not-recorded" | "awaiting-confirmation" | "exception" | "settled"
  payments: RevenuePayment[]
  history: AuditEvent[]
  id: string
  organizationId: string
  groupId: string
  cycleId: string
  payoutId: string
  installmentId: string
  recognizedAt: string
  organizationFeeMinor: number
  amountMinor: number
  overdueAt?: string
  restrictedAt?: string
  status: "due" | "overdue" | "restricted" | "settled"
  settlement?: { reference: string ; at: string ; actor: string }
}
export interface RevenueAccount {
  id: string
  bankName: string
  accountName: string
  accountNumber: string
  source: "approved-prototype-configuration"
}
export interface RevenuePayment {
  id: string
  amountMinor: number
  bankChargeMinor: number
  transferredAt: string
  bankName: string
  bankReference: string
  evidence?: {name: string; type: string; size: number; file?: File}
  recordedAt: string
  recordedBy: string
  account: RevenueAccount
  paymentReference: string
  status: "awaiting-confirmation" | "exception" | "confirmed"
  confirmedBy?: string
  confirmedAt?: string
}
export interface ReconciliationState {
  payoutRecognitions?: import("./evidencedRevenue.ts").EvidencedRecognition[]
  revenueAccount?: RevenueAccount
  organizationId: string
  policy?: FinancePolicy
  referenceAt?: string
  expectations: SettlementExpectation[]
  settlements: SettlementRecord[]
  unmatchedPayments: ProviderConfirmation[]
  cases: FinanceCase[]
  receivables: RevenueReceivable[]
  history: AuditEvent[]
}
export const emptyReconciliation = (
  organizationId: string,
): ReconciliationState => ({
  organizationId,
  expectations: [],
  settlements: [],
  unmatchedPayments: [],
  cases: [],
  receivables: [],
  history: [],
})
export const demoFinancePolicy = (): FinancePolicy => ({
  source: "explicit-demo-policy",
  settlementHours: 48,
  tcsOverdueHours: 72,
  tcsRestrictedHours: 168,
  expectedProviderFeePercent: 1.5,
  manual: "off",
})
