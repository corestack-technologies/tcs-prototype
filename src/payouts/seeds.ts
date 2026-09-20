import { chooseOptional } from "../payments/optional.ts"
import { roundDemo } from "../rounds/seeds.ts"
import { exampleFeeBoundary } from "../groups/model.ts"
import {advanceReference} from '../rounds/service.ts'
﻿import type { Organization } from "../organizations/model.ts"
import { paymentDemo } from "../payments/seeds.ts"
import { cycleOf } from "../groups/model.ts"
import { payoutTransition, evaluatePayouts } from "./service.ts"
import { payoutTotals } from "./math.ts"
import type { BankDirectory, PayoutPolicy } from "./model.ts"
export const PAYOUT_DEMOS = [
  "Ready for payout",
  "Transfer awaiting confirmation",
  "Member confirmed",
  "Confirmation window elapsed",
  "Dispute window closed",
  "Disputed payout",
  "Partial payout",
  "Final installment",
  "Optional contribution made",
  "Organization payout breach",
  "Stale bank instruction",
  "Overpayment exception",
  "Underpayment exception",
  "Split beneficiaries / flat fee",
  "Split beneficiaries / independent responses",
  "Late optional payment exception",
] as const
export type PayoutDemo = typeof PAYOUT_DEMOS[number]
export const demoPayoutPolicy = (): PayoutPolicy => ({
  source: "prototype-policy",
  confirmationHours: 48,
  disputeHours: 168,
  breachHours: 48,
  tcsSharePercent: 10,
})
export function payoutDemo(
  org: Organization,
  id: string,
  scenario: PayoutDemo,
) {
  if (scenario.startsWith("Split beneficiaries")) return splitPayoutDemo(org,id,scenario)
  let g = paymentDemo(org, id, "Optional contribution skipped / ready"),
    c = cycleOf(g),
    at = c.active!.referenceAt
  const banks: BankDirectory = Object.fromEntries(
    c.participants.map((m, i) => [
      m.id,
      {
        bankCode: "058",
        bankName: "GTBank · validated demo",
        accountNumber: "012345678" + i,
        resolvedName: m.name,
        status: "demo-confirmed",
        confirmedAt: at,
      },
    ]),
  )
  g.payouts = {
    records: [],
    demo: scenario,
    demoBanks: banks as NonNullable<typeof g.payouts>["demoBanks"],
  }
  if (scenario === "Optional contribution made") {
    // Use the 4A provider/allocator for the voluntary component as well.
    g = includeOptional(g, org)
  }
  g = payoutTransition(
    g,
    org.id,
    org.ownerMemberId,
    org.ownerMemberId,
    { type: "policy", policy: demoPayoutPolicy() },
    at,
    banks,
  )
  const record = (amount?: number, partial = false) => {
    const p = g.payouts!.records[0]
    g = payoutTransition(
      g,
      org.id,
      org.ownerMemberId,
      org.ownerMemberId,
      {
        type: "record",
        payoutId: p.id,
        instructionId: p.instructions[p.instructions.length - 1].id,
        amountMinor: amount ?? payoutTotals(p).outstanding,
        transferredAt: at,
        reference: "DEMO-BANK-" + (p.installments.length + 1),
        notes:
          "Representative external Organization bank transfer; no bank API called",
        partial,
        partialReason: partial ? "Temporary liquidity timing" : undefined,
        completionPlan: partial
          ? "Complete the remaining balance after funds arrive"
          : undefined,
        expectedCompletionAt: partial
          ? new Date(Date.parse(at) + 24 * 3600000).toISOString()
          : undefined,
        evidence: partial
          ? { name: "demo-transfer-receipt.txt", type: "text/plain", size: 48 }
          : undefined,
        acknowledged: true,
      },
      at,
      banks,
    )
  }
  const respond = (type: "confirm" | "dispute") => {
    const p = g.payouts!.records[0]
    g = payoutTransition(
      g,
      org.id,
      org.ownerMemberId,
      p.memberId,
      {
        type,
        payoutId: p.id,
        installmentId: p.installments[p.installments.length - 1].id,
        reason:
          type === "dispute"
            ? "Transfer has not reached my account"
            : undefined,
        acknowledged: true,
      },
      at,
      banks,
    )
  }
  if (scenario === "Late optional payment exception") {
    g = startAttempt(g,org.id,org.form.name,org.ownerMemberId,{cycleId:c.id,roundId:c.active!.rounds[0].id,includeOptional:true},at)
    const pending = g.payments!.attempts[g.payments!.attempts.length-1]
    record()
    at = new Date(Date.parse(at)+1000).toISOString()
    g = confirmPayment([g],org.id,prototypeProvider.confirmation(pending,"success",at)!,at)[0]
    g = evaluatePayouts(g,at,banks)
  } else if (scenario === "Stale bank instruction") {
    banks[org.ownerMemberId] = {
      ...banks[org.ownerMemberId]!,
      accountNumber: "9876543210",
    }
    g.payouts!.demoBanks = (banks as NonNullable<typeof g.payouts>["demoBanks"])
    g = evaluatePayouts(g, at, banks)
  } else if (scenario === "Organization payout breach") {
    at = new Date(
      Date.parse(g.payouts!.records[0].targetAt) + 49 * 3600000,
    ).toISOString()
    g = evaluatePayouts(g, at, banks)
  } else if (
    !["Ready for payout", "Optional contribution made"].includes(scenario)
  ) {
    record(
      scenario === "Partial payout" || scenario === "Final installment"
        ? 10000000
        : scenario === "Overpayment exception"
          ? 40000000
          : scenario === "Underpayment exception"
            ? 10000000
            : undefined,
      ["Partial payout", "Final installment"].includes(scenario),
    )
    if (
      ["Member confirmed", "Partial payout", "Final installment"].includes(
        scenario,
      )
    )
      respond("confirm")
    if (scenario === "Final installment") {
      record()
      respond("confirm")
    }
    if (
      ["Confirmation window elapsed", "Dispute window closed"].includes(
        scenario,
      )
    ) {
      at = g.payouts!.records[0].installments[0].confirmationDueAt
      g = evaluatePayouts(g, at, banks)
      if (scenario === "Dispute window closed") {
        at = g.payouts!.records[0].installments[0].disputeClosesAt!
        g = evaluatePayouts(g, at, banks)
      }
    }
    if (scenario === "Disputed payout") respond("dispute")
  }
  return advanceReference(g,at)
}
import { startAttempt, confirmPayment } from "../payments/service.ts"
import { prototypeProvider } from "../payments/provider.ts"
import type { ThriftGroup } from "../groups/model.ts"
function includeOptional(g: ThriftGroup, org: Organization) {
  const c = cycleOf(g),
    at = c.active!.referenceAt
  const started = startAttempt(
    g,
    org.id,
    org.form.name,
    org.ownerMemberId,
    { cycleId: c.id, roundId: c.active!.rounds[0].id, includeOptional: true },
    at,
  )
  const event = prototypeProvider.confirmation(
    started.payments!.attempts[started.payments!.attempts.length - 1],
    "success",
    at,
  )!
  return confirmPayment([started], org.id, event, at)[0]
}

// Isolated accepted demo terms; live Group terms and prior demos are unchanged.
function splitPayoutDemo(org: Organization, id: string, scenario: string): ThriftGroup {
  let g = roundDemo(org,id,exampleFeeBoundary(),"Monthly","Half recipients · prior history",{feeEnabled:true,feeType:"flat",feeValue:20000})
  const c = cycleOf(g), r = c.active!.rounds[3], at = c.active!.referenceAt
  const banks: BankDirectory = Object.fromEntries(c.participants.map((m,i)=>[m.id,{bankCode:"058",bankName:"GTBank · validated demo",accountNumber:"012345678"+i,resolvedName:m.name,status:"demo-confirmed",confirmedAt:at}]))
  g = chooseOptional(g,org.id,"c3",c.id,r.id,"skip",at)
  g = startAttempt(g,org.id,org.form.name,"c4",{cycleId:c.id,roundId:r.id,includeOptional:true},at)
  g = confirmPayment([g],org.id,prototypeProvider.confirmation(g.payments!.attempts[0],"success",at)!,at)[0]
  g.payouts = {records:[],policy:demoPayoutPolicy(),demo:scenario,demoBanks:banks as NonNullable<typeof g.payouts>["demoBanks"]}
  g = evaluatePayouts(g,at,banks)
  if (scenario.endsWith("independent responses")) {
    for (const memberId of ["c3","c4"]) {
      const p = g.payouts!.records.find(p=>p.roundId===r.id && p.memberId===memberId)!
      g = payoutTransition(g,org.id,org.ownerMemberId,org.ownerMemberId,{type:"record",payoutId:p.id,instructionId:p.instructions[0].id,amountMinor:payoutTotals(p).net,transferredAt:at,reference:"DEMO-SPLIT-"+memberId,notes:"External transfer demo",partial:false,acknowledged:true},at,banks)
      if (memberId === "c3") g = payoutTransition(g,org.id,org.ownerMemberId,memberId,{type:"confirm",payoutId:p.id,installmentId:g.payouts!.records.find(row=>row.id===p.id)!.installments[0].id,acknowledged:true},at,banks)
    }
  }
  return g
}
