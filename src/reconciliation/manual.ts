import type { ThriftGroup } from "../groups/model.ts"
import type { Organization } from "../organizations/model.ts"
import { emptyPayments, minor } from "../payments/model.ts"
import { optionalClosed, optionalDecision } from "../payments/optional.ts"
import type { FinancePolicy, ManualContribution } from "./model.ts"
export type ManualInput = Pick<ManualContribution, "cycleId" | "roundId" | "memberId" | "amountMinor" | "paidAt" | "channel" | "reference" | "reason" | "evidence"> & {
  includeOptional?: boolean
}
export function recordManual(
  group: ThriftGroup,
  org: Organization,
  actorId: string,
  policy: FinancePolicy | undefined,
  input: ManualInput,
  at: string,
): ThriftGroup {
  if (group.organizationId !== org.id || actorId !== org.ownerMemberId)
    throw Error("Only the owning Organization can record a manual receipt.")
  if (!policy || policy.manual === "off")
    throw Error("Manual contributions are not enabled by policy.")
  minor(input.amountMinor)
  if (
    !input.amountMinor ||
    !Number.isFinite(Date.parse(at)) ||
    !Number.isFinite(Date.parse(input.paidAt)) ||
    Date.parse(input.paidAt) > Date.parse(at) ||
    input.reason.trim().length < 5 ||
    !input.reference.trim() ||
    !input.evidence?.name ||
    !["cash", "ordinary-bank-transfer", "approved-offline"].includes(
      input.channel,
    )
  )
    throw Error(
      "Record the receipt amount, payment date, channel, reference, evidence and reason.",
    )
  if (
    group.manualContributions?.some(
      (m) => m.reference === input.reference.trim(),
    )
  )
    throw Error(
      "This manual reference is already recorded; review the original receipt.",
    )
  const g = structuredClone(group),
    c = g.cycles.find((c) => c.id === input.cycleId),
    o = c?.active?.obligations.find(
      (o) => o.memberId === input.memberId && o.roundId === input.roundId,
    )
  if (!c || !o)
    throw Error("Select this Member's generated contribution obligation.")
  const round = c.active!.rounds.find((r) => r.id === input.roundId)!
  let review =
    policy.manual === "review-required" ||
    input.memberId === actorId ||
    c.status !== "activated" ||
    !!c.active?.endedAt ||
    Date.parse(input.paidAt) < Date.parse(round.schedule.opensAt) ||
    !!g.lifecycle?.recoveries.some(
      (r) =>
        r.cycleId === c.id &&
        r.memberId === input.memberId &&
        r.status !== "resolved",
    )
  if (
    input.includeOptional &&
    (optionalClosed(g, c.id, round.id, input.memberId) ||
      optionalDecision(g, c.id, round.id, input.memberId)?.choice !==
        "contribute")
  )
    review = true
  const targets = o.components
    .flatMap((p) => [
      {
        component: p,
        kind: "required" as const,
        amount: p.requiredMinor - p.requiredSatisfiedMinor,
      },
      ...(input.includeOptional
        ? [
            {
              component: p,
              kind: "optional" as const,
              amount: p.optionalMinor - p.optionalSatisfiedMinor,
            },
          ]
        : []),
    ])
    .filter((t) => t.amount > 0)
    .sort(
      (a, b) => Number(a.kind === "optional") - Number(b.kind === "optional"),
    )
  const available = targets.reduce((sum, t) => minor(sum + t.amount), 0)
  const partial = ["allowed", "demo-only"].includes(
    c.active?.contributionPolicy?.partial || "",
  )
  if (
    input.amountMinor > available ||
    (!partial && input.amountMinor !== available)
  )
    review = true
  const id = g.id + "-manual-" + ((g.manualContributions?.length || 0) + 1)
  const record: ManualContribution = {
    ...structuredClone(input),
    id,
    organizationId: org.id,
    groupId: g.id,
    reference: input.reference.trim(),
    recordedAt: at,
    actorId,
    source: "organization-confirmed-manual",
    status: review ? "review-required" : "allocated",
    allocatedMinor: review ? 0 : input.amountMinor,
  }
  ;(g.manualContributions ??= []).push(record)
  if (!review) {
    const p = (g.payments ??= emptyPayments())
    let remaining = input.amountMinor
    for (const t of targets) {
      const amount = Math.min(remaining, t.amount)
      if (!amount) continue
      p.allocations.push({
        id: id + "-" + p.allocations.length,
        transactionId: id,
        organizationId: org.id,
        groupId: g.id,
        cycleId: c.id,
        roundId: round.id,
        memberId: input.memberId,
        obligationId: o.id,
        componentId: t.component.id,
        kind: t.kind,
        amountMinor: amount,
        confirmedAt: input.paidAt,
        timeliness:
          t.kind === "optional"
            ? "optional"
            : Date.parse(input.paidAt) <= Date.parse(round.schedule.dueAt)
              ? "on-time"
              : Date.parse(input.paidAt) < Date.parse(round.schedule.lateAt)
                ? "grace"
                : "late",
        source: "organization-confirmed-manual",
      })
      if (t.kind === "required") t.component.requiredSatisfiedMinor += amount
      else t.component.optionalSatisfiedMinor += amount
      remaining -= amount
    }
    c.financial.payments =
      (g.payments?.transactions.filter((t) => t.cycleId === c.id).length || 0) +
      (g.manualContributions?.filter(
        (m) => m.cycleId === c.id && m.status === "allocated",
      ).length || 0)
    c.financial.allocations = p.allocations.filter(
      (a) => a.cycleId === c.id,
    ).length
  }
  g.history.push({
    at,
    actor: actorId,
    action:
      "Manual/offline Organization receipt " +
      id +
      ": " +
      record.status +
      ". Evidence is not provider verification. " +
      input.reason,
  })
  return g
}
