import { hasPermission, authoritySnapshot } from '../access/authorization.ts'
import type { InternalSession } from '../access/model.ts'
import type { Organization } from "../organizations/model.ts"
import { minor } from "../payments/model.ts"
import type {
  ReconciliationState,
  RevenueAccount,
  RevenuePayment,
} from "./model.ts"

// Controlled prototype configuration, never a live verified receiving account.
export const corestackAccount = (): RevenueAccount => ({
  id: "corestack-prototype-account-1",
  bankName: "Prototype Bank — no real transfers",
  accountName: "Corestack Technologies Ltd. (demo)",
  accountNumber: "DEMO-TCS-001",
  source: "approved-prototype-configuration",
})
export type RevenuePaymentInput = Pick<RevenuePayment, "amountMinor" | "bankChargeMinor" | "transferredAt" | "bankName" | "bankReference" | "evidence">

function validTime(at: string) {
  if (!Number.isFinite(Date.parse(at)))
    throw Error("A valid revenue-share payment timestamp is required.")
}
export function recordRevenuePayment(
  state: ReconciliationState,
  org: Organization,
  actorId: string,
  receivableId: string,
  input: RevenuePaymentInput,
  at: string,
) {
  if (state.organizationId !== org.id || actorId !== org.ownerMemberId)
    throw Error("Only the owning Organization may record its transfer.")
  validTime(at)
  validTime(input.transferredAt)
  minor(input.amountMinor)
  minor(input.bankChargeMinor)
  const s = structuredClone(state),
    r = s.receivables.find((r) => r.id === receivableId)
  if (!r || r.organizationId !== org.id || r.status === "settled")
    throw Error("Select an unpaid revenue-share obligation.")
  if (r.payments.length)
    throw Error(
      "A payment is already recorded; await TCS confirmation or controlled review.",
    )
  if (
    !input.amountMinor ||
    input.bankReference.trim().length < 3 ||
    !input.bankName.trim() ||
    Date.parse(input.transferredAt) < Date.parse(r.dueAt) ||
    Date.parse(input.transferredAt) > Date.parse(at) ||
    Date.parse(at) < Date.parse(s.referenceAt || r.dueAt)
  )
    throw Error(
      "Record the bank, reference, positive transferred amount and date on or after this obligation became due.",
    )
  if (
    s.receivables.some((row) =>
      row.payments.some(
        (p) =>
          p.bankName === input.bankName.trim() &&
          p.bankReference === input.bankReference.trim(),
      ),
    )
  )
    throw Error(
      "This bank transfer reference is already recorded for the Organization.",
    )
  const mismatch = input.amountMinor !== r.amountMinor
  const payment: RevenuePayment = {
    ...structuredClone(input),
    id: r.id + "-payment-1",
    bankName: input.bankName.trim(),
    bankReference: input.bankReference.trim(),
    recordedAt: at,
    recordedBy: actorId,
    account: structuredClone(r.account),
    paymentReference: r.paymentReference,
    status: mismatch ? "exception" : "awaiting-confirmation",
  }
  r.payments.push(payment)
  r.paymentStatus = mismatch ? "exception" : "awaiting-confirmation"
  const event = {
    at,
    actor: actorId,
    action:
      "Organization recorded revenue-share transfer " + payment.bankReference,
    before: "not-recorded",
    after: payment.status,
    reason: mismatch
      ? "Transferred amount differs from the exact TCS amount due; controlled review required."
      : "Awaiting authorized TCS receipt confirmation. Bank charges remain Organization expenses.",
  }
  r.history.push(event)
  s.history.push({ ...event, action: r.id + ": " + event.action })
  s.referenceAt = at
  if (mismatch)
    s.cases.push({
      id: "revenue-payment:" + payment.id,
      organizationId: org.id,
      groupId: r.groupId,
      cycleId: r.cycleId,
      payoutId: r.payoutId,
      transactionId: payment.id,
      kind: "revenue-share",
      amountMinor: input.amountMinor,
      sourceReference: payment.bankReference,
      reason:
        "Organization revenue-share transfer amount does not match the exact amount due. No settlement or adjustment inferred.",
      createdAt: at,
      status: "review-required",
      evidence: input.evidence,
      history: [event],
    })
  return s
}
// Trusted internal boundary for Module 5; never exposed as an Organization action.
export function confirmRevenuePayment(
  state: ReconciliationState,
  organizationId: string,
  receivableId: string,
  paymentId: string,
  actor: InternalSession,
  at: string,
) {
  if (
    state.organizationId !== organizationId ||
    actor.kind !== "tcs-internal" ||
    !hasPermission(actor,'revenue_share.confirm')
  )
    throw Error("Authorized TCS internal receipt confirmation is required.")
  validTime(at)
  const s = structuredClone(state),
    r = s.receivables.find((r) => r.id === receivableId),
    p = r?.payments.find((p) => p.id === paymentId)
  if (!r || !p || r.organizationId !== organizationId)
    throw Error("Select the recorded payment for this Organization obligation.")
  if (p.status === "confirmed") return s
  if (
    p.status !== "awaiting-confirmation" ||
    p.amountMinor !== r.amountMinor ||
    Date.parse(at) < Date.parse(p.recordedAt) ||
    Date.parse(at) < Date.parse(s.referenceAt || p.recordedAt)
  )
    throw Error(
      "An exact recorded payment and valid TCS confirmation time are required; amount exceptions cannot be settled here.",
    )
  p.status = "confirmed"
  p.confirmedBy = actor.personaId
  p.confirmedAt = at
  r.history.push({
    at,
    actor: actor.personaId,
    authority: authoritySnapshot(actor),
    action: "TCS confirmed receipt of " + p.bankReference,
    before: "awaiting-confirmation",
    after: "settled",
  })
  s.history.push({
    at,
    actor: actor.personaId,
    authority: authoritySnapshot(actor),
    action:
      "Revenue-share obligation " +
      r.id +
      " settled after TCS receipt confirmation",
    before: r.status,
    after: "settled",
  })
  r.settlement = { reference: p.bankReference, at, actor: actor.personaId }
  r.paymentStatus = "settled"
  r.status = "settled"
  s.referenceAt = at
  return s
}
