import { businessTimestamp } from '../settings/service.ts'
﻿import type { Cycle, Fraction } from "../groups/model.ts"
export type Timing = "Upcoming" | "Open" | "Due" | "Grace" | "Late"
export interface RoundSchedule {
  periodStart: string
  periodEnd: string
  opensAt: string
  dueAt: string
  dueDayStartsAt: string
  lateAt: string
  payoutTargetAt: string
  timezone: string
}
export interface Round {
  id: string
  groupId: string
  cycleId: string
  number: number
  position: number
  beneficiaries: {
    memberId: string
    fraction: Fraction
    entitlementMinor: number
  }[]
  scheduledPayoutValueMinor: number
  schedule: RoundSchedule
}
export interface ObligationComponent {
  id: string
  position: number
  fraction: Fraction
  requiredMinor: number
  optionalMinor: number
  requiredSatisfiedMinor: number
  optionalSatisfiedMinor: number
}
export interface Obligation {
  id: string
  memberId: string
  groupId: string
  cycleId: string
  roundId: string
  components: ObligationComponent[]
}
export const effectiveReferenceAt = (active: ActiveCycle) => active.timeSource === 'ENVIRONMENT' ? businessTimestamp() : active.referenceAt
export interface ActiveCycle {
  timeSource?: 'ENVIRONMENT' | 'SCENARIO'
  generatedAt: string
  referenceAt: string
  rounds: Round[]
  obligations: Obligation[]
  demo?: string
  contributionPolicy?: {
    partial: "unconfigured" | "allowed" | "prohibited" | "demo-only"
    advance: "unconfigured" | "allowed" | "prohibited" | "demo-only"
  }
  // These are representative history markers, never payout execution records.
  generatedRoundIds?: string[]
  resolvedRoundIds: string[]
  endedAt?: string
  penaltyEnabled?: boolean
}
export function toMinor(amount: number): number {
  if (!Number.isFinite(amount) || amount < 0)
    throw Error("Money must be a non-negative finite amount.")
  const match = /^(\d+)(?:\.(\d{1,2}))?$/.exec(String(amount))
  if (!match) throw Error("Amounts must use no more than two decimal places.")
  const minor = Number(match[1]) * 100 + Number((match[2] || "").padEnd(2, "0"))
  if (!Number.isSafeInteger(minor))
    throw Error("Amount exceeds safe money limits.")
  return minor
}
function safe(value: number): number {
  if (!Number.isSafeInteger(value) || value < 0)
    throw Error("Money cannot be represented exactly in kobo.")
  return value
}
export const money = (minor: number) =>
  new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    minimumFractionDigits: minor % 100 ? 2 : 0,
    maximumFractionDigits: 2,
  }).format(minor / 100)
export const shareAmount = (baseMinor: number, fraction: Fraction) => {
  if (![1, 0.5].includes(fraction))
    throw Error("Only full and half shares are supported.")
  return safe((baseMinor * (fraction === 1 ? 2 : 1)) / 2)
}
export function generateObligations(
  groupId: string,
  cycle: Cycle,
  rounds: Round[],
): Obligation[] {
  if (cycle.status !== "activated" || !cycle.snapshot)
    throw Error("An activated Cycle snapshot is required.")
  const snapshot = cycle.snapshot,
    base = toMinor(snapshot.terms.amount)
  const participants = snapshot.participants.filter(
    (p) => p.status === "approved",
  )
  return rounds.flatMap((round) =>
    participants.map((member) => ({
      id: `${round.id}-member-${member.id}`,
      memberId: member.id,
      groupId,
      cycleId: cycle.id,
      roundId: round.id,
      components: snapshot.positions.flatMap((position) =>
        position.holders
          .filter((h) => h.memberId === member.id)
          .map((h) => {
            const amount = shareAmount(base, h.fraction),
              optional = position.n === round.position
            return {
              id: `${round.id}-${member.id}-position-${position.n}`,
              position: position.n,
              fraction: h.fraction,
              requiredMinor: optional ? 0 : amount,
              optionalMinor: optional ? amount : 0,
              requiredSatisfiedMinor: 0,
              optionalSatisfiedMinor: 0,
            }
          }),
      ),
    })),
  )
}
export function balances(obligation: Obligation) {
  const sum = (
    key: "requiredMinor" | "optionalMinor" | "requiredSatisfiedMinor" | "optionalSatisfiedMinor",
  ) =>
    safe(
      obligation.components.reduce((s, c) => {
        for (const k of [
          "requiredMinor",
          "optionalMinor",
          "requiredSatisfiedMinor",
          "optionalSatisfiedMinor",
        ] as const)
          safe(c[k])
        if (
          c.requiredSatisfiedMinor > c.requiredMinor ||
          c.optionalSatisfiedMinor > c.optionalMinor
        )
          throw Error(
            "Fulfillment exceeds the corresponding obligation component.",
          )
        return s + c[key]
      }, 0),
    )
  const required = sum("requiredMinor"),
    optional = sum("optionalMinor"),
    satisfied = sum("requiredSatisfiedMinor"),
    optionalMade = sum("optionalSatisfiedMinor")
  return {
    required,
    optional,
    satisfied,
    optionalMade,
    outstanding: required - satisfied,
    collected: safe(satisfied + optionalMade),
    fulfillment:
      required === 0
        ? optionalMade > 0
          ? "Optional contribution made"
          : "Optional / not required"
        : satisfied === required
          ? "Satisfied"
          : satisfied > 0
            ? "Partially satisfied"
            : "Unpaid",
  }
}
export function timing(schedule: RoundSchedule, referenceAt: string): Timing {
  const now = Date.parse(referenceAt)
  if (!Number.isFinite(now)) throw Error("Choose a valid reference time.")
  if (now < Date.parse(schedule.opensAt)) return "Upcoming"
  if (now < Date.parse(schedule.dueDayStartsAt)) return "Open"
  if (now <= Date.parse(schedule.dueAt)) return "Due"
  if (now < Date.parse(schedule.lateAt)) return "Grace"
  return "Late"
}
export function obligationState(
  obligation: Obligation,
  round: Round,
  active: ActiveCycle,
) {
  const b = balances(obligation),
    t = timing(round.schedule, effectiveReferenceAt(active))
  return {
    ...b,
    timing: t,
    late: b.outstanding > 0 && t === "Late",
    penaltyEligible:
      active.penaltyEnabled === true &&
      b.outstanding > 0 &&
      t === "Late" &&
      (!active.endedAt ||
        Date.parse(effectiveReferenceAt(active)) < Date.parse(active.endedAt)),
  }
}
export function collection(round: Round, active: ActiveCycle, referenceAt = effectiveReferenceAt(active)) {
  const list = active.obligations
    .filter((o) => o.roundId === round.id)
    .map(balances)
  const total = (
    key: "required" | "optional" | "satisfied" | "optionalMade" | "outstanding" | "collected",
  ) => safe(list.reduce((s, b) => s + b[key], 0))
  const required = total("required"),
    satisfied = total("satisfied"),
    outstanding = total("outstanding")
  return {
    required,
    satisfied,
    outstanding,
    optional: total("optional"),
    optionalMade: total("optionalMade"),
    collected: total("collected"),
    requiredMembers: list.filter((b) => b.required > 0).length,
    satisfiedMembers: list.filter((b) => b.required > 0 && b.outstanding === 0)
      .length,
    ready:
      list.length > 0 &&
      outstanding === 0 &&
      timing(round.schedule, referenceAt) !== "Upcoming",
  }
}
export function currentRound(active: ActiveCycle): Round | null {
  const unresolved = active.rounds.filter(
    (r) => !active.resolvedRoundIds.includes(r.id),
  )
  // A later period opening never erases an unresolved earlier Round.
  return (
    unresolved.find(
      (r) => Date.parse(r.schedule.opensAt) <= Date.parse(effectiveReferenceAt(active)),
    ) ||
    unresolved[0] ||
    null
  )
}

export function generateRounds(
  groupId: string,
  cycle: Cycle,
  schedules: RoundSchedule[],
): Round[] {
  if (cycle.status !== "activated" || !cycle.snapshot)
    throw Error("An activated Cycle snapshot is required.")
  const positions = [...cycle.snapshot.positions].sort((a, b) => a.n - b.n)
  if (
    positions.length !== schedules.length ||
    positions.some(
      (p, i) =>
        p.n !== i + 1 || p.holders.reduce((s, h) => s + h.fraction, 0) !== 1,
    )
  )
    throw Error("Round schedules must match finalized payout positions.")
  for (const p of positions)
    for (const h of p.holders)
      shareAmount(toMinor(cycle.snapshot.terms.amount), h.fraction)
  const base = toMinor(cycle.snapshot.terms.amount),
    equivalents = positions.reduce(
      (s, p) => s + p.holders.reduce((n, h) => n + h.fraction, 0),
      0,
    ),
    spv = safe(base * equivalents)
  return positions.map((p, i) => ({
    id: `${cycle.id}-round-${p.n}`,
    groupId,
    cycleId: cycle.id,
    number: p.n,
    position: p.n,
    beneficiaries: p.holders.map((h) => ({
      ...h,
      entitlementMinor: shareAmount(spv, h.fraction),
    })),
    scheduledPayoutValueMinor: spv,
    schedule: { ...schedules[i] },
  }))
}
