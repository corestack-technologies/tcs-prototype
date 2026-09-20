import type { SourceReview } from '../operations/review.ts'
﻿import type { Draft, Position } from "../groups/model.ts"
export interface ExitCase {
  review?: import("../operations/review.ts").SourceReview
  settlementConfirmations?: {id:string;at:string;actor:string;amountMinor:number;reason:string;evidence:string[]}[]
  id: string
  cycleId: string
  memberId: string
  kind: "withdrawal" | "early-exit"
  status: "requested" | "approved" | "declined"
  requestedAt: string
  reason: string
  approvedAt?: string
  positions: Position[]
  recognizedContributionsMinor: number
  settlement: {
    dueMinor: number
    status: "due" | "resolved"
    timing: "cycle-end" | "after-regularization" | "immediate" | "agreed-date"
    dueAt?: string
    responsibility: "organization"
    escalatedAt?: string
  }
}
export interface Replacement {
  id: string
  cycleId: string
  exitId: string
  outgoingMemberId: string
  incomingMemberId: string
  incomingName: string
  proposedAt: string
  positions: Position[]
  terms: Draft
  acceptance?: { at: string ; actorId: string ; terms: string }
  regularizationRequiredMinor: number
  regularizationSatisfiedMinor: number
  status: "proposed" | "awaiting-regularization" | "effective"
  effectiveAt?: string
  demoFinancialState?: boolean
}
export interface RecoveryCase {
  // Optional explicit source links. Legacy aggregate cases are derived in reporting.
  regularizedDefault?: boolean
  recordedAt?: string
  recoveryPayments?: {id:string;amountMinor:number;businessAt:string;recordedAt:string}[]
  obligationIds?: string[]
  penaltyObligations?: {id:string;dueAt:string;amountMinor:number;obligationId?:string}[]
  penaltyWaivers?: {id:string;penaltyId?:string;amountMinor:number;at:string;authority:string;reason:string;evidence:string[]}[]
  review?: import("../operations/review.ts").SourceReview
  restrictions?: import("../operations/interventionModel.ts").RestrictionRecord[]
  id: string
  cycleId: string
  memberId: string
  principalMinor: number
  penaltyMinor: number
  recoveredMinor: number
  status: "open" | "awaiting-review" | "resolved"
  restricted: boolean
  openedAt: string
  resolvedAt?: string
  resolvedBy?: string
  reviewStatus: "pending" | "reviewed"
  reason: string
  demoFinancialState?: boolean
}
export interface AmendmentRequest {
  effectiveAt?: string
  review?: SourceReview
  id: string
  cycleId: string
  reason: string
  requestedAt: string
  currentTerms: Draft
  proposedTerms: Draft
  affectedMemberIds: string[]
  consents: { memberId: string ; at: string ; terms: string }[]
  status: "awaiting-consent" | "pending-tcs-review" | "approved-awaiting-consent" | "approved-awaiting-application" | "effective" | "rejected" | "information-required"
}
export interface ForceCloseRequest {
  review?: SourceReview
  id: string
  cycleId: string
  requestedAt: string
  reason: string
  evidenceReference: string
  requestedAbsorptionMinor: number
  status: "pending-tcs-review" | "approved-demo" | "approved" | "rejected" | "information-required"
  balances: {
    principalMinor: number
    penaltyMinor: number
    unpaidPayoutMinor: number
    exitSettlementMinor: number
    recoveryMinor: number
    disputes: string[]
  }
  affectedMemberIds: string[]
}
export interface PayoutFact {
  cycleId: string
  position: number
  memberId: string
  status: "received-demo" | "received-recorded" | "completed-recorded" | "unpaid" | "breach-demo" | "vacant-resolved-demo"
  entitlementMinor: number
  at?: string
}
export interface GroupLifecycle {
  exits: ExitCase[]
  replacements: Replacement[]
  recoveries: RecoveryCase[]
  amendments: AmendmentRequest[]
  forceCloseRequests: ForceCloseRequest[]
  payoutFacts: PayoutFact[]
  disputes: {
    id: string
    cycleId: string
    exitId?: string
    review?: import("../operations/review.ts").SourceReview
    kind: "organization-payout-breach" | "exit-settlement" | "other"
    status: "open" | "resolved"
    reason: string
  }[]
  termination?: {
  review?: SourceReview
    status: "pending-tcs-review" | "terminated" | "rejected" | "information-required"
    at: string
    reason: string
  }
}
export const emptyLifecycle = (): GroupLifecycle => ({
  exits: [],
  replacements: [],
  recoveries: [],
  amendments: [],
  forceCloseRequests: [],
  payoutFacts: [],
  disputes: [],
})
