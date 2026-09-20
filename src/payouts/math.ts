import { cyclePenaltyOutstanding } from '../penalties/balances.ts'
import { recoveryBalances } from '../lifecycle/recovery.ts'
﻿import type { Cycle, ThriftGroup } from "../groups/model.ts"
import type { Round } from "../rounds/model.ts"
import { collection, toMinor, shareAmount } from "../rounds/model.ts"
import { minor } from "../payments/model.ts"
import type { PayoutPolicy, PayoutRecord } from "./model.ts"
// Exact integer arithmetic; fractional kobo use a documented half-up prototype convention.
export function proportion(
  amount: number,
  numerator: number,
  denominator: number,
): number {
  minor(amount)
  minor(numerator)
  minor(denominator)
  if (!denominator) throw Error("A positive financial denominator is required.")
  const value =
    (BigInt(amount) * BigInt(numerator) * 2n + BigInt(denominator)) /
    (2n * BigInt(denominator))
  return minor(Number(value))
}
export function percent(amount: number, rate: number): number {
  const text = String(rate),
    match = /^(\d+)(?:\.(\d+))?$/.exec(text)
  if (!match) throw Error("Use a non-negative finite percentage.")
  const scale = 10 ** (match[2]?.length || 0),
    n = Number(match[1]) * scale + Number(match[2] || 0)
  return proportion(amount, n, 100 * scale)
}
export function payoutAmounts(
  group: ThriftGroup,
  cycle: Cycle,
  round: Round,
  memberId: string,
  _policy?: PayoutPolicy,
) {
  if (round.groupId !== group.id || round.cycleId !== cycle.id)
    throw Error("Payout schedule belongs to a different Group or Cycle.")
  const b = round.beneficiaries.find((b) => b.memberId === memberId)
  if (!b)
    throw Error("This Member is not the effective beneficiary for this Round.")
  // Execution freezes this beneficiary's actual collection and fee snapshot.
  const frozen = group.payouts?.records.find(p => p.cycleId === cycle.id && p.roundId === round.id && p.memberId === memberId && p.installments.length)
  if (frozen?.calculation) return { ...frozen.calculation }
  const actual = collection(round, cycle.active!).collected,
    spv = round.scheduledPayoutValueMinor,
    entitlement = shareAmount(spv, b.fraction),
    t = cycle.snapshot!.terms
  const ownOptional = (cycle.active?.obligations || [])
    .filter((o) => o.roundId === round.id && o.memberId === memberId)
    .flatMap((o) => o.components)
    .filter((p) => p.position === round.position)
    .reduce((s, p) => s + p.optionalMinor - p.optionalSatisfiedMinor, 0)
  const attributable = minor(entitlement - ownOptional)
  // One flat fee per Position. Assign any indivisible kobo remainder to the last beneficiary.
  const flatTotal = toMinor(t.feeValue), index = round.beneficiaries.findIndex(p => p.memberId === memberId)
  const flatShare = index === round.beneficiaries.length - 1
    ? flatTotal - round.beneficiaries.slice(0,index).reduce((sum,p)=>sum + proportion(flatTotal,p.fraction * 2,2),0)
    : proportion(flatTotal,b.fraction * 2,2)
  const fee = t.feeEnabled
    ? t.feeType === "percentage"
      ? percent(entitlement, t.feeValue)
      : flatShare
    : 0
  if (fee > attributable)
    throw Error(
      "The Organization fee exceeds attributable collection; controlled resolution is required.",
    )
  return {
    scheduledValueMinor: spv,
    entitlementMinor: entitlement,
    actualRoundCollectionMinor: actual,
    attributableCollectionMinor: attributable,
    feeMinor: fee,
    netMinor: attributable - fee,
  }
}
export function installmentReceived(record:PayoutRecord,id:string):number {
 const i=record.installments.find(i=>i.id===id)!
 const d=record.disputes.find(d=>d.installmentId===id)
 const resolution=d?.process?.resolutions.at(-1)
 return resolution?resolution.receivedMinor:d?0:i.amountMinor
}
export function payoutUnresolved(record:PayoutRecord){
 return record.disputes.some(d=>d.status!=='resolved')||record.breach?.status==='open'||record.installments.some(i=>!!i.amountException)||payoutTotals(record).outstanding>0
}
export function payoutTotals(record: PayoutRecord) {
  const instruction =
      record.calculation || record.instructions[record.instructions.length - 1],
    paid = minor(record.installments.reduce((s, i) => s + i.amountMinor, 0)),
    net = instruction?.netMinor || 0,
    received = minor(record.installments.reduce((s,i)=>s+installmentReceived(record,i.id),0))
  return {
    net,
    paid,
    received,
    outstanding: Math.max(0, net - received),
    fee: instruction?.feeMinor || 0,
    recognizedFee: record.installments.reduce(
      (s, i) => s + i.feeRecognizedMinor,
      0,
    ),
    tcsShare: record.installments.reduce((s, i) => s + i.tcsShareMinor, 0),
  }
}
export function payoutReady(group: ThriftGroup, cycle: Cycle, round: Round, at?: string) {
  if (
    cycle.status !== "activated" ||
    !cycle.active ||
    !collection(round, cycle.active, at).ready
  )
    return false
  if (
    group.lifecycle?.recoveries.some(
      (r) =>
        r.cycleId === cycle.id && r.status !== "resolved" && recoveryBalances(r).penaltyOutstanding > 0,
    )
  )
    return false
  if (cyclePenaltyOutstanding(group, cycle.id) > 0) return false
  return !(group.lifecycle?.exits || []).some(
    (e) =>
      e.cycleId === cycle.id &&
      e.kind === "early-exit" &&
      e.status === "approved" &&
      !group.lifecycle?.replacements.some(
        (r) =>
          r.exitId === e.id &&
          r.effectiveAt &&
          Date.parse(r.effectiveAt) <= Date.parse(round.schedule.opensAt),
      ),
  )
}
