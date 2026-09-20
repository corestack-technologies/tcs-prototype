import type { ThriftGroup } from "../groups/model.ts"
import { emptyPayments } from "./model.ts"
export const optionalDecision = (g: ThriftGroup, cycleId: string, roundId: string, memberId: string) =>
  [...(g.payments?.optionalDecisions || [])].reverse().find(d => d.cycleId === cycleId && d.roundId === roundId && d.memberId === memberId)
export const optionalClosed = (g: ThriftGroup, cycleId: string, roundId: string, memberId: string) =>
  !!optionalDecision(g, cycleId, roundId, memberId)?.lockedAt || !!g.payouts?.records.some(p => p.cycleId === cycleId && p.roundId === roundId && p.memberId === memberId && p.installments.length)
export function chooseOptional(group: ThriftGroup, organizationId: string, memberId: string, cycleId: string, roundId: string, choice: "contribute" | "skip", at: string): ThriftGroup {
  if (group.organizationId !== organizationId || !Number.isFinite(Date.parse(at))) throw Error("Invalid Organization or decision time.")
  const g = structuredClone(group), c = g.cycles.find(c => c.id === cycleId)
  const o = c?.active?.obligations.find(o => o.roundId === roundId && o.memberId === memberId)
  if (c?.status !== "activated" || !o?.components.some(p => p.optionalMinor > 0)) throw Error("Only this Member can choose for their opened optional contribution.")
  if (choice !== "contribute" && choice !== "skip") throw Error("Choose contribute or skip.")
  const prior = optionalDecision(g, cycleId, roundId, memberId)
  if (prior?.lockedAt || g.payouts?.records.some(p => p.cycleId === cycleId && p.roundId === roundId && p.memberId === memberId && p.installments.length)) throw Error("Your optional-contribution decision is final because payout execution has begun.")
  if (choice === "skip" && o.components.some(p => p.optionalSatisfiedMinor > 0)) throw Error("An already confirmed optional contribution remains in collection history.")
  if (prior?.choice === choice) return g
  const records = (g.payments ??= emptyPayments())
  ;(records.optionalDecisions ??= []).push({cycleId, roundId, memberId, choice, at})
  g.history.push({at, actor: memberId, action: "Own-Round optional contribution choice: " + choice + "."})
  return g
}
