import { businessClock } from '../settings/service.ts'
import { chooseOptional, optionalDecision, optionalClosed } from "./optional.ts"
import { generateObligations } from "../rounds/model.ts"
import { effectiveCycle } from "../lifecycle/handover.ts"
import type { ThriftGroup } from "../groups/model.ts"
import type { Obligation, ObligationComponent } from "../rounds/model.ts"
import { balances } from "../rounds/model.ts"
import {
  emptyPayments,
  minor,
  type AllocationTarget,
  type ProviderConfirmation,
  type DemoOutcome,
} from "./model.ts"
import { prototypeProvider } from "./provider.ts"
const validTime = (at: string) => {
  if (!Number.isFinite(Date.parse(at)))
    throw Error("A valid payment timestamp is required.")
}
const allowed = (policy: string | undefined) =>
  policy === "allowed" || policy === "demo-only"
export interface PaymentChoice {
  cycleId: string
  roundId: string
  includeOptional: boolean
  amountMinor?: number
  advance?: boolean
}
export function startAttempt(
  group: ThriftGroup,
  organizationId: string,
  organizationName: string,
  memberId: string,
  choice: PaymentChoice,
  at: string,
  outcome: DemoOutcome = "success",
): ThriftGroup {
  validTime(at)
  if (choice.includeOptional && optionalClosed(group,choice.cycleId,choice.roundId,memberId))
    throw Error("Optional contribution is final and closed because payout execution has begun.")
  if (group.organizationId !== organizationId)
    throw Error("This contribution belongs to another Organization.")
  const g = choice.includeOptional && !choice.advance && optionalDecision(group,choice.cycleId,choice.roundId,memberId)?.choice !== "contribute"
    ? chooseOptional(group, organizationId, memberId, choice.cycleId, choice.roundId, "contribute", at)
    : structuredClone(group),
    c = g.cycles.find((c) => c.id === choice.cycleId),
    records = (g.payments ??= emptyPayments())
  if (!c || c.status !== "activated" || !c.active || c.active.endedAt)
    throw Error(
      "Only eligible active Cycle contributions can be paid here. Recovery and historical cases use a separate process.",
    )
  if (choice.advance) {
    if (
      !allowed(c.active.contributionPolicy?.advance) ||
      !c.financial.obligations
    )
      throw Error(
        "Advance contributions require an explicit policy and financial commencement.",
      )
    if (choice.includeOptional)
      throw Error(
        "Advance instructions cover required principal; optional own-Round contributions remain voluntary when the Round opens.",
      )
    if (
      c.active.obligations.some(
        (o) => o.memberId === memberId && balances(o).outstanding > 0,
      )
    )
      throw Error(
        "Satisfy your earlier required contributions before making an advance contribution.",
      )
    const first = advanceRound(g, c.id, memberId)
    if (!first || first.id !== choice.roundId)
      throw Error(
        "Advance money is held for the earliest eligible future required contribution.",
      )
  }
  const r = c.active.rounds.find((r) => r.id === choice.roundId),
    o =
      c.active.obligations.find(
        (o) => o.memberId === memberId && o.roundId === choice.roundId,
      ) ||
      (choice.advance && r
        ? generateObligations(g.id, effectiveCycle(g, c, r), [r]).find(
            (o) => o.memberId === memberId,
          )
        : undefined)
  if (
    !r ||
    !o ||
    (!choice.advance &&
      Date.parse(r.schedule.opensAt) > Date.parse(c.active.referenceAt))
  )
    throw Error(
      "Choose an opened contribution obligation belonging to this Member.",
    )
  if (
    g.lifecycle?.recoveries.some(
      (r) =>
        r.cycleId === c.id &&
        r.memberId === memberId &&
        r.status !== "resolved",
    )
  )
    throw Error(
      "This contribution is in formal recovery; recovery payments are outside this batch.",
    )
  const existing = records.attempts.find(
    (a) =>
      a.cycleId === c.id &&
      a.roundId === r.id &&
      a.memberId === memberId &&
      ["created", "awaiting-payment", "provider-pending"].includes(a.status),
  )
  if (existing) return g
  if (
    choice.advance &&
    records.transactions.some(
      (t) =>
        t.memberId === memberId &&
        t.cycleId === c.id &&
        t.holdReason === "awaiting-round-opening",
    )
  )
    throw Error(
      "An advance contribution is already awaiting its Round opening.",
    )
  const targets: AllocationTarget[] = o.components
    .flatMap((p) => {
      const rows: AllocationTarget[] = []
      if (p.requiredMinor > p.requiredSatisfiedMinor)
        rows.push({
          obligationId: o.id,
          componentId: p.id,
          roundId: r.id,
          kind: "required",
          amountMinor: p.requiredMinor - p.requiredSatisfiedMinor,
        })
      if (choice.includeOptional && p.optionalMinor > p.optionalSatisfiedMinor)
        rows.push({
          obligationId: o.id,
          componentId: p.id,
          roundId: r.id,
          kind: "optional",
          amountMinor: p.optionalMinor - p.optionalSatisfiedMinor,
        })
      return rows
    })
    .sort(
      (a, b) =>
        Number(a.kind === "optional") - Number(b.kind === "optional") ||
        a.componentId.localeCompare(b.componentId),
    )
  const total = minor(targets.reduce((s, t) => s + t.amountMinor, 0)),
    amount =
      choice.amountMinor === undefined ? total : minor(choice.amountMinor)
  if (!amount || amount > total)
    throw Error(
      "Choose an outstanding contribution amount. Optional contribution is voluntary.",
    )
  if (amount < total && !allowed(c.active.contributionPolicy?.partial))
    throw Error("Partial contributions are not enabled for this Cycle.")
  const m = c.participants.find((p) => p.id === memberId)
  if (!m) throw Error("Current or retained Member participation is required.")
  const account = prototypeProvider.collectionAccount(
    organizationId,
    memberId,
    organizationName,
    m.name,
  )
  if (!records.accounts.some((a) => a.id === account.id))
    records.accounts.push(account)
  records.attempts.push({
    id: `${g.id}-attempt-${records.attempts.length + 1}`,
    provider: prototypeProvider.id,
    organizationId,
    groupId: g.id,
    cycleId: c.id,
    roundId: r.id,
    memberId,
    accountId: account.id,
    createdAt: at,
    updatedAt: at,
    status: "awaiting-payment",
    expectedMinor: amount,
    intent: choice.advance ? "advance" : "contribution",
    includeOptional: choice.includeOptional,
    targets,
    demoOutcome: outcome,
  })
  g.history.push({
    at,
    actor: memberId,
    action:
      "Contribution instructions created. Awaiting provider confirmation; obligation balances unchanged.",
  })
  return g
}
// Confirmation is a trusted backend/provider boundary in production. React cannot supply a paid flag.
export function confirmPayment(
  groups: ThriftGroup[],
  organizationId: string,
  event: ProviderConfirmation,
  receivedAt: string,
): ThriftGroup[] {
  validTime(receivedAt)
  validTime(event.confirmedAt)
  minor(event.amountMinor)
  if (
    !event.providerReference.trim() ||
    !event.provider.trim() ||
    !event.attemptId.trim()
  )
    throw Error(
      "A trusted provider identity and instruction reference are required.",
    )
  if (
    !event.amountMinor ||
    event.currency !== "NGN" ||
    event.organizationId !== organizationId
  )
    throw Error("Provider confirmation currency, tenant or amount is invalid.")
  if (Date.parse(event.confirmedAt) > Date.parse(receivedAt))
    throw Error(
      "Provider success time cannot be after receipt of its confirmation.",
    )
  const existing = groups
    .flatMap((g) => g.payments?.transactions || [])
    .find(
      (t) =>
        t.provider === event.provider &&
        t.providerReference === event.providerReference,
    )
  if (existing) {
    if (
      existing.organizationId !== event.organizationId ||
      existing.memberId !== event.memberId ||
      existing.attemptId !== event.attemptId ||
      existing.amountMinor !== event.amountMinor ||
      existing.confirmedAt !== event.confirmedAt
    )
      throw Error(
        "Conflicting replay of an existing provider transaction. Original payment retained.",
      )
    return structuredClone(groups)
  }
  const found = groups.find((g) =>
    g.payments?.attempts.some((a) => a.id === event.attemptId),
  )
  if (!found || found.organizationId !== organizationId)
    throw Error("No matching payment instruction in this Organization.")
  const result = structuredClone(groups),
    g = result.find((g) => g.id === found.id)!,
    p = g.payments!,
    attempt = p.attempts.find((a) => a.id === event.attemptId)!
  if (
    attempt.provider !== event.provider ||
    attempt.memberId !== event.memberId
  )
    throw Error(
      "Provider confirmation does not match the instructed Member or provider.",
    )
  if (Date.parse(event.confirmedAt) < Date.parse(attempt.createdAt))
    throw Error("Provider success predates this payment instruction.")
  const c = g.cycles.find((c) => c.id === attempt.cycleId)!
  const transactionId = `${event.provider}:${event.providerReference}`
  let reason = "",
    kind: "amount-mismatch" | "ineligible-obligation" = "amount-mismatch"
  if (
    c.status !== "activated" ||
    !c.active ||
    c.active.endedAt ||
    g.lifecycle?.recoveries.some(
      (r) =>
        r.cycleId === c.id &&
        r.memberId === attempt.memberId &&
        r.status !== "resolved",
    )
  ) {
    reason =
      "Contribution is no longer eligible for normal allocation; received funds require controlled resolution."
    kind = "ineligible-obligation"
  }
  if (attempt.targets.some(t => t.kind === "optional") && optionalDecision(g, c.id, attempt.roundId, attempt.memberId)?.choice === "skip") {
    reason = "Member chose to skip this optional contribution; confirmed funds require exception resolution."
    kind = "ineligible-obligation"
  }
  if (attempt.targets.some(t => t.kind === "optional") && optionalClosed(g,c.id,attempt.roundId,attempt.memberId)) {
    reason = "Payout execution has begun for this beneficiary. Optional contribution is frozen; received funds are a PAYMENT EXCEPTION for later resolution and do not increase payout."
    kind = "ineligible-obligation"
  }
  if (attempt.transactionId) {
    reason =
      "Another confirmed payment already belongs to this instruction; additional funds require resolution."
  }
  const advanceHolding =
    attempt.intent === "advance" &&
    c.status === "activated" &&
    c.active &&
    Date.parse(
      c.active.rounds.find((r) => r.id === attempt.roundId)!.schedule.opensAt,
    ) > Date.parse(c.active.referenceAt)
  const targets = attempt.targets.map((t) => ({
    target: t,
    obligation: c.active?.obligations.find((o) => o.id === t.obligationId),
    component: c.active?.obligations
      .find((o) => o.id === t.obligationId)
      ?.components.find((p) => p.id === t.componentId),
  }))
  const eligible = (entry: typeof targets[number]) =>
    entry.obligation?.memberId === attempt.memberId &&
    entry.obligation.groupId === g.id &&
    entry.obligation.cycleId === c.id &&
    !!entry.component &&
    (entry.target.kind !== "optional" || attempt.includeOptional)
  if (!advanceHolding && targets.some((t) => !eligible(t))) {
    reason =
      "An allocation target no longer matches the original Member, Cycle or chosen contribution."
    kind = "ineligible-obligation"
  }
  const outstanding = (
    component: ObligationComponent,
    kind: "required" | "optional",
  ) =>
    kind === "required"
      ? component.requiredMinor - component.requiredSatisfiedMinor
      : component.optionalMinor - component.optionalSatisfiedMinor
  const available = advanceHolding
    ? attempt.targets.reduce((s, t) => s + t.amountMinor, 0)
    : targets.reduce(
        (s, t) =>
          s +
          (t.component
            ? Math.min(
                t.target.amountMinor,
                outstanding(t.component, t.target.kind),
              )
            : 0),
        0,
      )
  if (
    !reason &&
    (event.amountMinor > attempt.expectedMinor ||
      event.amountMinor > available ||
      (!allowed(c.active?.contributionPolicy?.partial) &&
        (event.amountMinor !== attempt.expectedMinor ||
          event.amountMinor !== available)))
  )
    reason =
      "Confirmed amount does not match the eligible instructed amount. Funds are retained unallocated for payment exception resolution."
  let remaining = event.amountMinor
  if (!reason && !advanceHolding)
    for (const entry of targets) {
      if (!remaining) break
      const { target, component } = entry,
        componentAmount = Math.min(
          remaining,
          target.amountMinor,
          outstanding(component!, target.kind),
        )
      if (!componentAmount) continue
      const r = c.active!.rounds.find((r) => r.id === target.roundId)!
      p.allocations.push({
        ...target,
        amountMinor: componentAmount,
        id: `${transactionId}-allocation-${p.allocations.length + 1}`,
        transactionId,
        memberId: attempt.memberId,
        organizationId,
        groupId: g.id,
        cycleId: c.id,
        confirmedAt: event.confirmedAt,
        businessAt: c.active?.timeSource === "ENVIRONMENT" ? businessClock(undefined, receivedAt).businessTimestamp : event.confirmedAt,
        timeliness:
          target.kind === "optional"
            ? "optional"
            : Date.parse(event.confirmedAt) <= Date.parse(r.schedule.dueAt)
              ? "on-time"
              : Date.parse(event.confirmedAt) < Date.parse(r.schedule.lateAt)
                ? "grace"
                : "late",
      })
      if (target.kind === "required")
        component!.requiredSatisfiedMinor = minor(
          component!.requiredSatisfiedMinor + componentAmount,
        )
      else
        component!.optionalSatisfiedMinor = minor(
          component!.optionalSatisfiedMinor + componentAmount,
        )
      remaining -= componentAmount
    }
  p.transactions.push({
    ...event,
    id: transactionId,
    groupId: g.id,
    cycleId: c.id,
    roundId: attempt.roundId,
    receivedAt,
    businessAt: c.active?.timeSource === "ENVIRONMENT" ? businessClock(undefined, receivedAt).businessTimestamp : event.confirmedAt,
    status: "confirmed",
    allocationStatus: reason
      ? "exception"
      : advanceHolding
        ? "unallocated"
        : remaining
          ? "partially-allocated"
          : "allocated",
    ...(!reason && advanceHolding
      ? { holdReason: "awaiting-round-opening" as const }
      : {}),
    allocatedMinor: event.amountMinor - remaining,
    unallocatedMinor: remaining,
  })
  if (reason)
    p.exceptions.push({
      id: transactionId + "-exception",
      transactionId,
      kind,
      amountMinor: event.amountMinor,
      reason,
      at: receivedAt,
      status: "open",
    })
  attempt.status = "confirmed"
  attempt.updatedAt = receivedAt
  attempt.transactionId ??= transactionId
  // Historical Cycles remain immutable even if a late provider callback arrives.
  if (c.status === "activated") {
    c.financial.payments = p.transactions.filter(
      (t) => t.cycleId === c.id,
    ).length + (g.manualContributions?.filter(m=>m.cycleId===c.id && m.status==="allocated").length || 0)
    c.financial.allocations = p.allocations.filter(
      (a) => a.cycleId === c.id,
    ).length
  }
  g.history.push({
    at: receivedAt,
    actor: "Prototype provider confirmation",
    action: `Payment ${event.providerReference} confirmed at ${event.confirmedAt}; ${event.amountMinor - remaining} kobo allocated; settlement ${event.settlement}.${
      reason ? " Payment exception retained." : ""
    }`,
  })
  releaseAdvance(g, receivedAt)
  return result
}
export function checkAttempt(
  groups: ThriftGroup[],
  organizationId: string,
  memberId: string,
  attemptId: string,
  at: string,
): ThriftGroup[] {
  validTime(at)
  const next = structuredClone(groups),
    g = next.find((g) => g.payments?.attempts.some((a) => a.id === attemptId)),
    a = g?.payments?.attempts.find((a) => a.id === attemptId)
  if (
    !g ||
    !a ||
    g.organizationId !== organizationId ||
    a.memberId !== memberId
  )
    throw Error("Only the instructed Member can check this payment.")
  if (["confirmed", "failed", "expired"].includes(a.status)) return next
  a.updatedAt = at
  if (a.status === "awaiting-payment" || a.demoOutcome === "pending") {
    a.status = "provider-pending"
    return next
  }
  if (a.demoOutcome === "failed" || a.demoOutcome === "expired") {
    a.status = a.demoOutcome
    return next
  }
  const event = prototypeProvider.confirmation(a, a.demoOutcome, at)!
  return confirmPayment(next, organizationId, event, at)
}
export function obligationPaymentSummary(
  group: ThriftGroup,
  obligation: Obligation,
) {
  const allocations = (group.payments?.allocations || []).filter(
    (a) => a.obligationId === obligation.id,
  )
  return { ...balances(obligation), allocations }
}

// Scheduling preview only: does not create obligations or start a Cycle.
export function advanceRound(
  group: ThriftGroup,
  cycleId: string,
  memberId: string,
) {
  const c = group.cycles.find((c) => c.id === cycleId)
  if (
    !c?.active ||
    c.status !== "activated" ||
    !allowed(c.active.contributionPolicy?.advance) ||
    !c.financial.obligations
  )
    return undefined
  return c.active.rounds.find(
    (r) =>
      Date.parse(r.schedule.opensAt) > Date.parse(c.active!.referenceAt) &&
      generateObligations(group.id, effectiveCycle(group, c, r), [r]).some(
        (o) => o.memberId === memberId && balances(o).outstanding > 0,
      ),
  )
}
// Called only after the ordinary 3B opening has generated actual obligations.
export function releaseAdvance(group: ThriftGroup, at: string): void {
  const p = group.payments
  if (!p) return
  for (const t of p.transactions.filter(
    (t) => t.holdReason === "awaiting-round-opening",
  )) {
    const c = group.cycles.find((c) => c.id === t.cycleId)!,
      a = p.attempts.find((a) => a.id === t.attemptId)!,
      round = c.active?.rounds.find((r) => r.id === t.roundId)
    const exited = group.lifecycle?.exits.some(
      (e) =>
        e.cycleId === c.id &&
        e.memberId === t.memberId &&
        e.status === "approved" &&
        e.kind === "early-exit" &&
        round &&
        Date.parse(e.approvedAt!) < Date.parse(round.schedule.opensAt),
    )
    if (
      c.status === "activated" &&
      !exited &&
      round &&
      Date.parse(round.schedule.opensAt) > Date.parse(c.active!.referenceAt)
    )
      continue
    const o = c.active?.obligations.find(
      (o) => o.roundId === t.roundId && o.memberId === t.memberId,
    )
    const targets = a.targets.map((target) => ({
      target,
      component: o?.components.find((p) => p.id === target.componentId),
    }))
    const available = targets.reduce(
      (s, e) =>
        s +
        (e.component
          ? Math.min(
              e.target.amountMinor,
              e.component.requiredMinor - e.component.requiredSatisfiedMinor,
            )
          : 0),
      0,
    )
    let reason = ""
    if (
      c.status !== "activated" ||
      exited ||
      !o ||
      targets.some((e) => !e.component) ||
      group.lifecycle?.recoveries.some(
        (r) =>
          r.cycleId === c.id &&
          r.memberId === t.memberId &&
          r.status !== "resolved",
      )
    )
      reason =
        "The opening obligation is no longer eligible for this Member. Advance funds remain recorded for controlled resolution."
    else if (
      t.amountMinor > available ||
      (!allowed(c.active!.contributionPolicy?.partial) &&
        t.amountMinor !== available)
    )
      reason =
        "The opening obligation amount differs from the held advance. Funds require payment exception resolution."
    delete t.holdReason
    if (reason) {
      t.allocationStatus = "exception"
      p.exceptions.push({
        id: t.id + "-opening-exception",
        transactionId: t.id,
        kind: "ineligible-obligation",
        amountMinor: t.unallocatedMinor,
        reason,
        at,
        status: "open",
      })
      continue
    }
    let remaining = t.unallocatedMinor
    for (const e of targets) {
      const amount = Math.min(
        remaining,
        e.target.amountMinor,
        e.component!.requiredMinor - e.component!.requiredSatisfiedMinor,
      )
      if (!amount) continue
      e.component!.requiredSatisfiedMinor = minor(
        e.component!.requiredSatisfiedMinor + amount,
      )
      p.allocations.push({
        ...e.target,
        amountMinor: amount,
        id: t.id + "-allocation-" + (p.allocations.length + 1),
        transactionId: t.id,
        memberId: t.memberId,
        organizationId: t.organizationId,
        groupId: group.id,
        cycleId: c.id,
        confirmedAt: t.confirmedAt,
        businessAt: new Date(Math.max(Date.parse(t.businessAt || t.confirmedAt), Date.parse(round!.schedule.opensAt))).toISOString(),
        timeliness:
          Date.parse(t.confirmedAt) <= Date.parse(round!.schedule.dueAt)
            ? "on-time"
            : Date.parse(t.confirmedAt) < Date.parse(round!.schedule.lateAt)
              ? "grace"
              : "late",
      })
      remaining -= amount
    }
    t.allocatedMinor = t.amountMinor - remaining
    t.unallocatedMinor = remaining
    t.allocationStatus = remaining ? "partially-allocated" : "allocated"
    c.financial.allocations = p.allocations.filter(
      (a) => a.cycleId === c.id,
    ).length
    group.history.push({
      at,
      actor: "TCS Round opening",
      action:
        "Held advance contribution allocated to the newly generated obligation. Provider success timestamp retained.",
    })
  }
}

export function paymentClearance(groups: ThriftGroup[]): number {
  return groups.reduce(
    (count, g) =>
      count +
      (g.payments?.transactions.filter(
        (t) => t.unallocatedMinor > 0 || (g.reconciliationBlockers === undefined && t.settlement === "exception"),
      ).length || 0),
    0,
  )
}
