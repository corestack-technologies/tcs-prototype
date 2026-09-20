import { recoveryBalances } from '../lifecycle/recovery.ts'
import { reconcileEvidencedPayout } from './evidencedRevenue.ts'
import {corestackAccount} from "./revenue.ts"
import type { ThriftGroup } from "../groups/model.ts"
import type { Organization } from "../organizations/model.ts"
import { minor, type ProviderConfirmation } from "../payments/model.ts"
import { confirmPayment } from "../payments/service.ts"
import { payoutUnresolved, payoutTotals } from "../payouts/math.ts"
import { percent, proportion } from "../payouts/math.ts"
import type {
  FinanceCase,
  FinancePolicy,
  ProviderSettlement,
  ReconciliationState,
} from "./model.ts"
const time = (at: string) => {
  if (!Number.isFinite(Date.parse(at)))
    throw Error("A valid financial event time is required.")
}
const plus = (at: string, hours: number) =>
  new Date(Date.parse(at) + hours * 3600000).toISOString()
export function validateFinancePolicy(p: FinancePolicy) {
  if (
    p.source !== "explicit-demo-policy" ||
    !["off", "organization-confirmed", "review-required"].includes(p.manual)
  )
    throw Error("Use explicit permitted prototype policy.")
  for (const n of [p.settlementHours, p.tcsOverdueHours, p.tcsRestrictedHours])
    if (!Number.isInteger(n) || n < 1 || n > 87600)
      throw Error("Use positive configurable timing windows.")
  if (p.tcsRestrictedHours <= p.tcsOverdueHours)
    throw Error("Restriction must follow the overdue threshold.")
  if (
    p.expectedProviderFeePercent !== undefined &&
    (!Number.isFinite(p.expectedProviderFeePercent) ||
      p.expectedProviderFeePercent < 0 ||
      p.expectedProviderFeePercent > 100)
  )
    throw Error("Invalid expected provider cost.")
}
function tenant(
  state: ReconciliationState,
  org: Organization,
  groups: ThriftGroup[],
) {
  if (
    state.organizationId !== org.id ||
    groups.some((g) => g.organizationId !== org.id)
  )
    throw Error("Organization financial records are tenant-isolated.")
}
function addCase(
  s: ReconciliationState,
  row: Omit<FinanceCase, "organizationId" | "status" | "history">,
) {
  if (!s.cases.some((c) => c.id === row.id))
    s.cases.push({
      ...row,
      organizationId: s.organizationId,
      status: "review-required",
      history: [
        {
          at: row.createdAt,
          actor: "TCS",
          action: "Case prepared for Operations",
          after: "review-required",
        },
      ],
    })
}
export function reconcile(
  state: ReconciliationState,
  groups: ThriftGroup[],
  org: Organization,
  at: string,
): ReconciliationState {
  tenant(state, org, groups)
  time(at)
  if (state.referenceAt && Date.parse(at) < Date.parse(state.referenceAt))
    throw Error("Financial reference time cannot move backwards.")
  const s = structuredClone(state)
  s.referenceAt = at
  const transactions = groups.flatMap((g) =>
    (g.payments?.transactions || []).map((t) => ({ ...t, groupId: g.id })),
  )
  const sources = [
    ...transactions,
    ...s.unmatchedPayments.map((t) => ({
      ...t,
      id: t.provider + ":" + t.providerReference,
      groupId: undefined,
      cycleId: undefined,
    })),
  ]
  for (const t of sources) {
    if (s.expectations.some((e) => e.transactionId === t.id)) continue
    const fee =
      s.policy?.expectedProviderFeePercent === undefined
        ? undefined
        : percent(t.amountMinor, s.policy.expectedProviderFeePercent)
    s.expectations.push({
      transactionId: t.id,
      groupId: t.groupId,
      cycleId: t.cycleId,
      memberId: t.memberId,
      provider: t.provider,
      providerReference: t.providerReference,
      grossMinor: t.amountMinor,
      confirmedAt: t.confirmedAt,
      expectedFeeMinor: fee,
      expectedNetMinor: fee === undefined ? undefined : t.amountMinor - fee,
      dueAt: s.policy
        ? plus(t.confirmedAt, s.policy.settlementHours)
        : undefined,
      matchedGrossMinor: 0,
      status: "pending",
    })
  }
  const used = new Map<string, number>()
  for (const settlement of s.settlements) {
    const previous = settlement.status,
      matched: string[] = []
    let matchedGross = 0,
      unknown = 0,
      invalid = false,
      knownFees = true,
      expectedFees = 0
    const staged = new Map<string, number>()
    for (const line of settlement.lines) {
      const correction=settlement.reconciliationLinks?.filter(l=>l.providerReference===line.providerReference).at(-1)
      const e = s.expectations.find(
        (e) =>
          e.provider === settlement.provider &&
          (correction ? e.transactionId === correction.transactionId : e.providerReference === line.providerReference),
      )
      if (!e) {
        unknown++
        knownFees = false
        continue
      }
      if (e.expectedFeeMinor === undefined) knownFees = false
      else
        expectedFees = minor(
          expectedFees +
            proportion(e.expectedFeeMinor, line.grossMinor, e.grossMinor),
        )
      const amount =
        (used.get(e.transactionId) || 0) +
        (staged.get(e.transactionId) || 0) +
        line.grossMinor
      if (
        amount > e.grossMinor ||
        Date.parse(settlement.settledAt) < Date.parse(e.confirmedAt)
      ) {
        invalid = true
        continue
      }
      staged.set(
        e.transactionId,
        (staged.get(e.transactionId) || 0) + line.grossMinor,
      )
      matched.push(e.transactionId)
      matchedGross += line.grossMinor
    }
    const expected =
      settlement.grossMinor -
      settlement.processingFeeMinor -
      settlement.otherDeductionsMinor
    settlement.varianceMinor =
      settlement.netMinor -
      (knownFees && !unknown
        ? settlement.grossMinor - expectedFees - settlement.otherDeductionsMinor
        : expected)
    const lineTotal = settlement.lines.reduce(
      (sum, l) => minor(sum + l.grossMinor),
      0,
    )
    settlement.status =
      invalid ||
      settlement.varianceMinor !== 0 || settlement.netMinor !== expected ||
      lineTotal !== settlement.grossMinor
        ? "variance"
        : unknown || !settlement.lines.length
          ? matchedGross
            ? "partially-matched"
            : "unmatched"
          : "matched"
    settlement.matchedTransactionIds = [...new Set(matched)]
    if (settlement.status !== "variance")
      for (const [id, amount] of staged)
        used.set(id, (used.get(id) || 0) + amount)
    if (previous !== settlement.status)
      settlement.history.push({
        at,
        actor: "TCS automatic matching",
        action: "Settlement classification updated",
        before: previous,
        after: settlement.status,
      })
    const caseId = "settlement:" + settlement.id
    if (settlement.status !== "matched")
      addCase(s, {
        id: caseId,
        settlementId: settlement.id,
        kind: "settlement",
        amountMinor:
          Math.abs(settlement.varianceMinor) || settlement.grossMinor,
        reason:
          settlement.status === "variance"
            ? "Settlement amount, deductions or transaction coverage does not reconcile."
            : "Some provider references have no safely matched confirmed payment.",
        createdAt: at,
        sourceReference: settlement.reference,
      })
    else {
      const c = s.cases.find((c) => c.id === caseId)
      if (c && c.status !== "resolved") {
        c.history.push({
          at,
          actor: "TCS automatic matching",
          action: "References and amounts now reconcile",
          before: c.status,
          after: "resolved",
        })
        c.status = "resolved"
      }
    }
  }
  for (const e of s.expectations) {
    e.matchedGrossMinor = used.get(e.transactionId) || 0
    const variance = s.settlements.some(
      (p) =>
        p.status === "variance" &&
        p.matchedTransactionIds.includes(e.transactionId),
    )
    e.status = variance
      ? "exception"
      : e.matchedGrossMinor === e.grossMinor
        ? "settled"
        : e.dueAt && Date.parse(at) > Date.parse(e.dueAt)
          ? "delayed"
          : e.matchedGrossMinor
            ? "partial"
            : "pending"
    const id = "delayed:" + e.transactionId
    if (e.status === "delayed")
      addCase(s, {
        id,
        groupId: e.groupId,
        cycleId: e.cycleId,
        memberId: e.memberId,
        transactionId: e.transactionId,
        kind: "settlement",
        amountMinor: e.grossMinor - e.matchedGrossMinor,
        reason: "Provider settlement is beyond its configured normal period.",
        createdAt: at,
        sourceReference: e.providerReference,
      })
    if (e.status === "settled")
      for (const caseId of [id, "provider-settlement:" + e.transactionId]) {
        const c = s.cases.find((c) => c.id === caseId)
        if (c && c.status !== "resolved") {
          c.history.push({
            at,
            actor: "TCS",
            action: "Provider settlement matched",
            before: c.status,
            after: "resolved",
          })
          c.status = "resolved"
        }
      }
  }
  for (const g of groups) {
    for (const t of g.payments?.transactions || []) {
      if (
        t.settlement === "exception" &&
        s.expectations.find((e) => e.transactionId === t.id)?.status !==
          "settled"
      )
        addCase(s, {
          id: "provider-settlement:" + t.id,
          groupId: g.id,
          cycleId: t.cycleId,
          roundId: t.roundId,
          memberId: t.memberId,
          transactionId: t.id,
          kind: "settlement",
          amountMinor: t.amountMinor,
          reason:
            "Provider reported a settlement exception; matching evidence is required.",
          createdAt: t.receivedAt,
        })
      if (!t.unallocatedMinor || t.holdReason === "awaiting-round-opening")
        continue
      const original = g.payments?.exceptions.find(
          (e) => e.transactionId === t.id,
        ),
        attempt = g.payments?.attempts.find((a) => a.id === t.attemptId)
      const kind = original?.reason.includes("Payout execution")
        ? "late-optional"
        : attempt?.intent === "advance"
          ? "advance"
          : original?.kind === "amount-mismatch"
            ? "amount-mismatch"
            : "unallocated"
      addCase(s, {
        id: "payment:" + t.id,
        groupId: g.id,
        cycleId: t.cycleId,
        roundId: t.roundId,
        memberId: t.memberId,
        transactionId: t.id,
        obligationId: attempt?.targets[0]?.obligationId,
        kind,
        amountMinor: t.unallocatedMinor,
        reason:
          original?.reason || "Confirmed payment has no eligible allocation.",
        createdAt: t.receivedAt,
        sourceReference: t.providerReference,
      })
    }
    for (const m of g.manualContributions || [])
      if (m.status === "review-required")
        addCase(s, {
          id: "manual:" + m.id,
          groupId: g.id,
          cycleId: m.cycleId,
          roundId: m.roundId,
          memberId: m.memberId,
          transactionId: m.id,
          kind: "manual",
          amountMinor: m.amountMinor,
          reason: m.reason,
          createdAt: m.recordedAt,
          evidence: m.evidence,
          sourceReference: m.reference,
        })
    for (const p of g.payouts?.records || []) {
      reconcileEvidencedPayout(s,p,org)
      if (
        p.disputes.length ||
        p.breach ||
        p.installments.some((i) => i.amountException)
      )
        addCase(s, {
          id: "payout:" + p.id,
          groupId: g.id,
          cycleId: p.cycleId,
          roundId: p.roundId,
          memberId: p.memberId,
          payoutId: p.id,
          kind: "payout",
          amountMinor: payoutTotals(p).outstanding || payoutTotals(p).paid,
          reason:
            p.disputes[0]?.reason ||
            p.installments.find((i) => i.amountException)?.amountException ||
            "Organization payout breach",
          createdAt: p.breach?.at || p.disputes[0]?.at || p.readyAt,
          evidence: p.installments.find((i) => i.evidence)?.evidence,
        })
      for (const i of p.installments) {
        if (
          !i.tcsShareMinor ||
          !["member-confirmed","window-elapsed"].includes(i.status) ||
          !!i.amountException ||
          s.receivables.some((r) => r.installmentId === i.id)
        )
          continue
        const dueAt=i.confirmedAt || i.autoCompletedAt!
        const paymentReference="TCS-"+encodeURIComponent(org.id)+":"+encodeURIComponent(i.id)
        const history=[{at:dueAt,actor:"TCS",action:"Revenue share created and due after completed payout installment; unique payment reference generated: "+paymentReference,after:"due"}]
        s.history.push(...history)
        s.receivables.push({
          dueAt,sharePercent:p.policy!.tcsSharePercent,paymentReference,account:structuredClone(s.revenueAccount||corestackAccount()),paymentStatus:"not-recorded",payments:[],history,
          id: "tcs:" + i.id,
          organizationId: org.id,
          groupId: g.id,
          cycleId: p.cycleId,
          payoutId: p.id,
          installmentId: i.id,
          recognizedAt: i.recordedAt,
          organizationFeeMinor: i.feeRecognizedMinor,
          amountMinor: i.tcsShareMinor,
          overdueAt: s.policy
            ? plus(dueAt, s.policy.tcsOverdueHours)
            : undefined,
          restrictedAt: s.policy
            ? plus(dueAt, s.policy.tcsRestrictedHours)
            : undefined,
          status: "due",
        })
      }
    }
    for (const r of g.lifecycle?.recoveries || [])
      if (r.principalMinor + r.penaltyMinor >= 0)
        addCase(s, {
          id: "recovery:" + r.id,
          groupId: g.id,
          cycleId: r.cycleId,
          memberId: r.memberId,
          lifecycleId: r.id,
          kind: "recovery",
          amountMinor: recoveryBalances(r).outstanding,
          reason: recoveryBalances(r).exception?"Recovery allocation exception: excess or invalid waiver requires review; no negative balance.":"Outstanding recovery retained for Operations; principal first, then penalty.",
          createdAt: at,
        })
    for (const e of g.lifecycle?.exits || [])
      if (e.settlement.status === "due" && e.settlement.dueMinor)
        addCase(s, {
          id: "exit:" + e.id,
          groupId: g.id,
          cycleId: e.cycleId,
          memberId: e.memberId,
          lifecycleId: e.id,
          kind: "exit",
          amountMinor: e.settlement.dueMinor,
          reason: "Exit Settlement Due; retained lifecycle case.",
          createdAt: e.approvedAt || at,
        })
  }
  for (const item of s.cases.filter((c) => c.status !== "resolved")) {
    const g = groups.find((g) => g.id === item.groupId)
    const resolved =
      item.kind === "payout" ? g?.payouts?.records.some(p=>p.id===item.payoutId&&!payoutUnresolved(p)&&!!p.finalizedAt&&!p.calculationChanged) : item.kind === "recovery"
        ? g?.lifecycle?.recoveries.some(
            (r) => r.id === item.lifecycleId && r.status === "resolved",
          )
        : item.kind === "exit"
          ? g?.lifecycle?.exits.some(
              (e) =>
                e.id === item.lifecycleId && e.settlement.status === "resolved",
            )
          : false
    if (resolved) {
      item.history.push({
        at,
        actor: "TCS lifecycle state",
        action: "Original lifecycle case resolved",
        before: item.status,
        after: "resolved",
      })
      item.status = "resolved"
    }
  }
  for (const r of s.receivables)
    if (!r.settlement) {
      const before = r.status
      r.status =
        r.restrictedAt && Date.parse(at) >= Date.parse(r.restrictedAt)
          ? "restricted"
          : r.overdueAt && Date.parse(at) >= Date.parse(r.overdueAt)
            ? "overdue"
            : "due"
      if (before !== r.status) {
        r.history.push({at,actor:"TCS commercial controls",action:"Revenue-share commercial status changed",before,after:r.status})
        s.history.push({
          at,
          actor: "TCS commercial controls",
          action: "Revenue receivable " + r.id,
          before,
          after: r.status,
        })
      }
    }
  return s
}
export function receiveSettlement(
  state: ReconciliationState,
  groups: ThriftGroup[],
  org: Organization,
  event: ProviderSettlement,
  at: string,
) {
  tenant(state, org, groups)
  time(at)
  time(event.settledAt)
  if (
    event.organizationId !== org.id ||
    !event.provider.trim() ||
    !event.reference.trim() ||
    Date.parse(event.settledAt) > Date.parse(at)
  )
    throw Error("Invalid provider settlement identity or time.")
  for (const value of [
    event.grossMinor,
    event.processingFeeMinor,
    event.otherDeductionsMinor,
    event.netMinor,
    ...event.lines.map((l) => l.grossMinor),
  ])
    minor(value)
  if (
    !event.grossMinor ||
    event.lines.some((l) => !l.providerReference.trim() || !l.grossMinor) ||
    !/^\d{10}$/.test(event.destination.accountNumber)
  )
    throw Error(
      "Settlement requires a valid account snapshot and referenced amounts.",
    )
  minor(event.processingFeeMinor + event.otherDeductionsMinor)
  if (event.otherDeductionsMinor && !event.deductionReason?.trim())
    throw Error("Known provider deductions require an explanation.")
  const s = structuredClone(state),
    id = event.provider + ":" + event.reference,
    prior = s.settlements.find((r) => r.id === id)
  if (prior) {
    const keys = Object.keys(event) as Array<keyof ProviderSettlement>
    if (
      keys.some(
        (key) => JSON.stringify(prior[key]) !== JSON.stringify(event[key]),
      )
    )
      addCase(s, {
        id: "duplicate-settlement:" + id,
        settlementId: id,
        kind: "duplicate",
        amountMinor: event.netMinor,
        reason:
          "Conflicting duplicate settlement delivery; original financial record preserved.",
        createdAt: at,
        sourceReference: event.reference,
      })
    return reconcile(s, groups, org, at)
  }
  s.settlements.push({
    ...structuredClone(event),
    id,
    receivedAt: at,
    status: "unmatched",
    matchedTransactionIds: [],
    varianceMinor: 0,
    history: [
      {
        at,
        actor: "Prototype provider event",
        action: "Settlement received",
        after: "unmatched",
      },
    ],
  })
  return reconcile(s, groups, org, at)
}
export function receivePayment(
  state: ReconciliationState,
  groups: ThriftGroup[],
  org: Organization,
  event: ProviderConfirmation,
  at: string,
) {
  tenant(state, org, groups)
  time(at)
  time(event.confirmedAt)
  minor(event.amountMinor)
  if (
    event.organizationId !== org.id ||
    event.currency !== "NGN" ||
    !event.provider.trim() ||
    !event.providerReference.trim() ||
    !event.memberId ||
    !event.amountMinor ||
    Date.parse(event.confirmedAt) > Date.parse(at)
  )
    throw Error("Invalid confirmed payment event.")
  const s = structuredClone(state),
    id = event.provider + ":" + event.providerReference
  const existing = [
    ...groups.flatMap((g) => g.payments?.transactions || []),
    ...s.unmatchedPayments,
  ].find(
    (t) =>
      t.provider === event.provider &&
      t.providerReference === event.providerReference,
  )
  if (existing) {
    if (
      existing.amountMinor !== event.amountMinor ||
      existing.memberId !== event.memberId ||
      existing.attemptId !== event.attemptId ||
      existing.confirmedAt !== event.confirmedAt
    )
      addCase(s, {
        id: "duplicate-payment:" + id,
        transactionId: id,
        kind: "duplicate",
        amountMinor: event.amountMinor,
        reason:
          "Conflicting duplicate payment reference; original facts retained.",
        createdAt: at,
      })
    return {
      state: reconcile(s, groups, org, at),
      groups: structuredClone(groups),
    }
  }
  if (
    groups.some((g) =>
      g.payments?.attempts.some(
        (a) =>
          a.id === event.attemptId &&
          a.provider === event.provider &&
          a.memberId === event.memberId,
      ),
    )
  ) {
    const next = confirmPayment(groups, org.id, event, at)
    return { state: reconcile(s, next, org, at), groups: next }
  }
  s.unmatchedPayments.push(structuredClone(event))
  addCase(s, {
    id: "unmatched:" + id,
    transactionId: id,
    memberId: event.memberId,
    kind: "unallocated",
    amountMinor: event.amountMinor,
    reason:
      "Provider confirmed funds without a safely identified payment instruction. No allocation inferred.",
    createdAt: at,
    sourceReference: event.providerReference,
  })
  return {
    state: reconcile(s, groups, org, at),
    groups: structuredClone(groups),
  }
}
export function financialClearance(
  s: ReconciliationState,
  groups: ThriftGroup[],
) {
  if (groups.some((g) => g.organizationId !== s.organizationId))
    throw Error("Tenant mismatch.")
  return {
    cases: s.cases.filter((c) => c.status !== "resolved").length,
    awaitingTcs: s.receivables.filter(r=>r.paymentStatus==="awaiting-confirmation").length,
    revenuePaymentExceptions:s.receivables.filter(r=>r.paymentStatus==="exception").length,
    unpaidTcs: s.receivables.filter((r) => r.status !== "settled").length,
    restricted: s.receivables.some((r) => r.status === "restricted"),
    reserved: groups
      .flatMap((g) => g.payments?.transactions || [])
      .filter((t) => t.holdReason === "awaiting-round-opening").length,
  }
}

export function groupFinancialBlockers(s: ReconciliationState, group: ThriftGroup): number {
  if (group.organizationId !== s.organizationId) throw Error("Tenant mismatch.")
  const transactions = group.payments?.transactions || []
  const cases = s.cases.filter(c => c.status !== "resolved" && (
    c.groupId === group.id ||
    transactions.some(t => t.id === c.transactionId) ||
    (c.settlementId && s.settlements.some(b => b.id === c.settlementId &&
      b.lines.some(line => transactions.some(t => t.provider === b.provider && t.providerReference === line.providerReference))))
  ))
  return cases.length + s.receivables.filter(r => r.groupId === group.id && r.status !== "settled").length
}

