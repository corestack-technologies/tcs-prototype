import { seedSession } from '../access/seeds.ts'
import {recordRevenuePayment,confirmRevenuePayment} from "./revenue.ts"
import type { Organization } from "../organizations/model.ts"
import type { ThriftGroup } from "../groups/model.ts"
import { cycleOf } from "../groups/model.ts"
import { paymentDemo, type PaymentDemo } from "../payments/seeds.ts"
import { payoutDemo } from "../payouts/seeds.ts"
import {
  startAttempt,
  confirmPayment,
  advanceRound,
} from "../payments/service.ts"
import { prototypeProvider } from "../payments/provider.ts"
import { lifecycleTransition } from "../lifecycle/service.ts"
import {
  demoFinancePolicy,
  emptyReconciliation,
  type ProviderSettlement,
} from "./model.ts"
import { reconcile, receivePayment, receiveSettlement } from "./service.ts"
import { recordManual } from "./manual.ts"
import { percent } from "../payouts/math.ts"
export const RECONCILIATION_DEMOS = [
  "Confirmed / settlement pending",
  "Batch settled / provider cost",
  "Settlement variance",
  "Unmatched settlement",
  "Unallocated provider payment",
  "Partial contribution allowed",
  "Underpayment exception",
  "Overpayment exception",
  "Advance reservation",
  "Advance exception after exit",
  "Late optional payment exception",
  "Manual direct bank receipt",
  "Manual review required",
  "Duplicate provider and settlement",
  "TCS share due",
  "TCS share overdue",
  "TCS share restricted",
  "TCS share awaiting confirmation",
  "TCS share settled",
  "TCS share partial payout",
  "TCS share payment exception",
] as const
export type ReconciliationDemo = typeof RECONCILIATION_DEMOS[number]
export function settlementFor(
  org: Organization,
  groups: ThriftGroup[],
  reference: string,
  at: string,
): ProviderSettlement {
  const transactions = groups.flatMap((g) => g.payments?.transactions || [])
  if (!transactions.length || !org.settlement)
    throw Error(
      "Confirmed payments and an effective Organization account are required.",
    )
  const gross = transactions.reduce((s, t) => s + t.amountMinor, 0),
    fee = percent(gross, 1.5)
  return {
    provider: transactions[0].provider,
    reference,
    organizationId: org.id,
    settledAt: at,
    destination: structuredClone(org.settlement),
    grossMinor: gross,
    processingFeeMinor: fee,
    otherDeductionsMinor: 0,
    netMinor: gross - fee,
    lines: transactions.map((t) => ({
      providerReference: t.providerReference,
      grossMinor: t.amountMinor,
    })),
  }
}
export function reconciliationDemo(
  org: Organization,
  id: string,
  scenario: ReconciliationDemo,
) {
  const mapped: Partial<Record<ReconciliationDemo, PaymentDemo>> = {
    "Partial contribution allowed": "Partial contribution allowed",
    "Underpayment exception": "Underpayment exception",
    "Overpayment exception": "Overpayment exception",
    "Advance reservation": "Advance held until opening",
    "Manual direct bank receipt": "Awaiting contribution",
    "Manual review required": "Awaiting contribution",
    "Advance exception after exit": "Awaiting contribution",
  }
  let g = scenario.startsWith("TCS share")
    ? payoutDemo(org, id, scenario === "TCS share partial payout" ? "Partial payout" : ["TCS share awaiting confirmation","TCS share settled","TCS share payment exception"].includes(scenario) ? "Member confirmed" : "Final installment")
    : scenario === "Late optional payment exception"
      ? payoutDemo(org, id, "Late optional payment exception")
      : paymentDemo(
          org,
          id,
          mapped[scenario] || "Optional contribution skipped / ready",
        )
  let at = g.payouts?.referenceAt || cycleOf(g).active!.referenceAt
  let s = emptyReconciliation(org.id)
  s.policy = demoFinancePolicy()
  if (scenario.startsWith("Manual")) {
    const c = cycleOf(g),
      policy = {
        ...demoFinancePolicy(),
        manual:
          scenario === "Manual review required"
            ? "review-required" as const
            : "organization-confirmed" as const,
      }
    g.manualPolicy = policy
    g = recordManual(
      g,
      org,
      org.ownerMemberId,
      policy,
      {
        cycleId: c.id,
        roundId: c.active!.rounds[0].id,
        memberId: "c2",
        amountMinor: 10000000,
        paidAt: at,
        channel: "ordinary-bank-transfer",
        reference: "DEMO-DIRECT-TRANSFER",
        reason: "Member used the ordinary Organization bank account",
        evidence: {
          name: "demo-bank-receipt.txt",
          type: "text/plain",
          size: 48,
        },
      },
      at,
    )
  }
  if (scenario === "Advance exception after exit") {
    const c = cycleOf(g)
    c.active!.contributionPolicy = {
      partial: "unconfigured",
      advance: "demo-only",
    }
    const pay = (roundId: string, advance = false) => {
      g = startAttempt(
        g,
        org.id,
        org.form.name,
        "c2",
        { cycleId: c.id, roundId, includeOptional: false, advance },
        at,
      )
      g = confirmPayment(
        [g],
        org.id,
        prototypeProvider.confirmation(
          g.payments!.attempts.at(-1)!,
          "success",
          at,
        )!,
        at,
      )[0]
    }
    pay(c.active!.rounds[0].id)
    pay(advanceRound(g, c.id, "c2")!.id, true)
    g = lifecycleTransition(
      g,
      "c2",
      org.ownerMemberId,
      {
        type: "request-exit",
        memberId: "c2",
        reason: "Relocation before future contribution",
      },
      at,
    )
    g = lifecycleTransition(
      g,
      org.ownerMemberId,
      org.ownerMemberId,
      { type: "approve-exit", id: g.lifecycle!.exits[0].id },
      at,
    )
  }
  if (
    [
      "Batch settled / provider cost",
      "Settlement variance",
      "Unmatched settlement",
      "Duplicate provider and settlement",
    ].includes(scenario)
  ) {
    const event = settlementFor(org, [g], "DEMO-SETTLEMENT-" + id, at)
    if (scenario === "Settlement variance") event.netMinor -= 100000
    if (scenario === "Unmatched settlement")
      event.lines = event.lines.map((l) => ({
        ...l,
        providerReference: "UNKNOWN-" + l.providerReference,
      }))
    s = receiveSettlement(s, [g], org, event, at)
    if (scenario === "Duplicate provider and settlement") {
      s = receiveSettlement(s, [g], org, event, at)
      const next = receivePayment(s, [g], org, g.payments!.transactions[0], at)
      s = next.state
      g = next.groups[0]
    }
  }
  if (scenario === "Unallocated provider payment")
    s = receivePayment(
      s,
      [g],
      org,
      {
        provider: prototypeProvider.id,
        providerReference: "DEMO-UNMATCHED-" + id,
        attemptId: "unknown",
        organizationId: org.id,
        memberId: org.ownerMemberId,
        currency: "NGN",
        amountMinor: 7000000,
        confirmedAt: at,
        settlement: "pending",
      },
      at,
    ).state
  if (scenario === "TCS share overdue" || scenario === "TCS share restricted")
    at = new Date(
      Date.parse(at) + (scenario.endsWith("restricted") ? 169 : 73) * 3600000,
    ).toISOString()
  s = reconcile(s, [g], org, at)
  if (["TCS share awaiting confirmation","TCS share settled","TCS share payment exception"].includes(scenario)) {
    const r=s.receivables[0]
    s=recordRevenuePayment(s,org,org.ownerMemberId,r.id,{amountMinor:r.amountMinor-(scenario==="TCS share payment exception"?100:0),bankChargeMinor:5000,transferredAt:at,bankName:"Organization demo bank",bankReference:"DEMO-TCS-TRANSFER-"+id,evidence:{name:"demo-revenue-transfer.txt",type:"text/plain",size:40}},at)
    if(scenario==="TCS share settled")s=confirmRevenuePayment(s,org.id,r.id,s.receivables[0].payments[0].id,seedSession('finance-reviewer'),at)
  }
  g.history.push({
    at,
    actor: "Prototype scenario",
    action:
      "Settlement / reconciliation demo: " +
      scenario +
      ". Provider cost and timing values are explicit demo policy.",
  })
  return { group: g, state: s }
}
