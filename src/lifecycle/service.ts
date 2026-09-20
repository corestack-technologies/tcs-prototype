import { cyclePenaltyOutstanding } from '../penalties/balances.ts'
import { recoveryBalances } from './recovery.ts'
import { finishAmendmentApproval } from './amendment.ts'
import {payoutTotals} from '../payouts/math.ts'
import {releaseAdvance} from '../payments/service.ts'
﻿import {
  cycleOf,
  financiallyCommenced,
  type ThriftGroup,
  type Participant,
} from "../groups/model.ts"
import { balances, shareAmount, toMinor } from "../rounds/model.ts"
import { emptyLifecycle } from "./model.ts"
export type LifecycleAction = {
  type: "withdraw" | "request-exit"
  memberId: string
  reason: string
} | { type: "approve-exit" ; id: string } | {
  type: "replace"
  id: string
  incoming: Participant
} | { type: "accept-replacement" ; id: string ; memberId: string } | {
  type: "complete"
} | {
  type: "force-close"
  reason: string
  evidence: string
  absorptionMinor: number
} | { type: "terminate" ; reason: string } | {
  type: "consent-amendment"
  id: string
  memberId: string
}
export function unresolved(group: ThriftGroup) {
  const l = group.lifecycle || emptyLifecycle()
  return (
    group.cycles.some(c => cyclePenaltyOutstanding(group,c.id)>0) ||
    !!group.reconciliationBlockers ||
    (group.manualContributions?.some(m=>m.status==="review-required")||false) ||
    (group.payouts?.records.some(p=>!!p.calculationChanged||!p.status.startsWith("completed-")||!p.finalizedAt||p.disputes.some(d=>d.status!=='resolved')||p.breach?.status==='open')||false) ||
    (group.payments?.transactions.some(t=>t.unallocatedMinor>0||(group.reconciliationBlockers===undefined&&t.settlement==="exception"))||false) ||
    l.exits.some(
      (e) =>
        e.status === "approved" &&
        e.settlement.status === "due" &&
        e.settlement.dueMinor > 0,
    ) ||
    l.recoveries.some((r) => r.status !== "resolved") ||
    l.disputes.some((d) => d.status === "open") ||
    l.payoutFacts.some(
      (p) => p.status === "unpaid" || p.status === "breach-demo",
    ) ||
    group.cycles.some(
      (c) =>
        (c.active?.obligations || []).some(
          (o) => balances(o).outstanding > 0 && !l.recoveries.some(r=>r.cycleId===c.id&&r.memberId===o.memberId&&(!r.obligationIds||r.obligationIds.includes(o.id))&&r.status==="resolved"&&recoveryBalances(r).cleared),
        ),
    )
  )
}
export function lifecycleTransition(
  group: ThriftGroup,
  actorId: string,
  ownerId: string,
  action: LifecycleAction,
  at: string,
  eligible: (id: string) => boolean = () => true,
): ThriftGroup {
  const g = structuredClone(group),
    c = cycleOf(g),
    l = (g.lifecycle ??= emptyLifecycle())
  if (!Number.isFinite(Date.parse(at)))
    throw Error("A valid reference time is required.")
  const owner = () => {
    if (actorId !== ownerId) throw Error("Organization owner action required.")
  }
  const member = (id: string) => {
    if (actorId !== id)
      throw Error("Only the affected Member can confirm this action.")
  }
  const live = () => {
    if (c.status !== "activated") throw Error("An activated Cycle is required.")
  }
  const received = (id: string) =>
    l.payoutFacts.some(
      (p) =>
        p.cycleId === c.id && p.memberId === id && ["received-demo","received-recorded","completed-recorded"].includes(p.status),
    )
  const audit = (action: string) =>
    g.history.push({ at, actor: actorId, action })
  if (action.type === "withdraw" || action.type === "request-exit") {
    member(action.memberId)
    const p = c.participants.find(
      (p) => p.id === action.memberId && p.status === "approved",
    )
    if (!p || !["draft", "activated"].includes(c.status))
      throw Error("Current participation is required.")
    if (action.reason.trim().length < 5) throw Error("Provide a reason.")
    if (
      l.exits.some(
        (e) =>
          e.cycleId === c.id &&
          e.memberId === p.id &&
          e.status !== "declined" &&
          e.kind === "early-exit",
      )
    )
      throw Error("An exit record already exists.")
    const started = financiallyCommenced(c)
    if (action.type === "withdraw" && started)
      throw Error(
        "Financial participation has commenced. Request Early Exit before payout.",
      )
    if (action.type === "request-exit" && (!started || received(p.id)))
      throw Error(
        "Early Exit is only available after commencement and before any payout to this Member.",
      )
    const actual = (c.active?.obligations || [])
      .filter((o) => o.memberId === p.id)
      .reduce((s, o) => s + balances(o).collected, 0)
    l.exits.push({
      id: `${c.id}-exit-${l.exits.length + 1}`,
      cycleId: c.id,
      memberId: p.id,
      kind: started ? "early-exit" : "withdrawal",
      status: started ? "requested" : "approved",
      requestedAt: at,
      reason: action.reason,
      positions: c.positions
        .map((pos) => ({
          ...pos,
          holders: pos.holders.filter((h) => h.memberId === p.id),
        }))
        .filter((pos) => pos.holders.length),
      recognizedContributionsMinor: actual,
      settlement: {
        dueMinor: actual,
        status: actual ? "due" : "resolved",
        timing: "cycle-end",
        responsibility: "organization",
      },
      ...(!started ? { approvedAt: at } : {}),
    })
    if (!started) {
      if (c.snapshot) {
        ;(c.activationHistory ??= []).push({
          at: c.activatedAt || at,
          snapshot: structuredClone(c.snapshot),
        })
      }
      c.status = "draft"
      delete c.snapshot
      delete c.active
      delete c.activatedAt
      g.currentCycleId = null
      c.orderFinalized = false
      p.status = "rejected"
      p.revision++
      c.positions.forEach(
        (pos) => (pos.holders = pos.holders.filter((h) => h.memberId !== p.id)),
      )
      audit(
        `Withdrawal by ${p.name}. Organization notified in Group history; positions released; readiness required. Previous activation preserved.`,
      )
    } else
      audit(`Early Exit requested by ${p.name}; Organization approval pending.`)
  } else if (action.type === "approve-exit") {
    owner()
    live()
    const e = l.exits.find(
      (e) =>
        e.id === action.id && e.cycleId === c.id && e.status === "requested",
    )
    if (!e || received(e.memberId))
      throw Error("Only a pending pre-payout Early Exit can be approved.")
    e.status = "approved"
    e.approvedAt = at
    e.recognizedContributionsMinor = (c.active?.obligations || [])
      .filter((o) => o.memberId === e.memberId)
      .reduce((s, o) => s + balances(o).collected, 0)
    e.settlement.dueMinor = e.recognizedContributionsMinor
    e.settlement.status = e.settlement.dueMinor ? "due" : "resolved"
    audit(
      "Early Exit approved; vacancy recorded. Generated obligations retain their original Member. Organization owes recognized contribution principal without automatic deductions.",
    )
  } else if (action.type === "replace") {
    owner()
    live()
    const e = l.exits.find(
      (e) =>
        e.id === action.id &&
        e.cycleId === c.id &&
        e.status === "approved" &&
        e.kind === "early-exit",
    )
    if (
      !e ||
      received(e.memberId) ||
      l.replacements.some((r) => r.exitId === e.id)
    )
      throw Error("Select an unfilled pre-payout vacancy.")
    if (
      !action.incoming.verified ||
      !eligible(action.incoming.id) ||
      c.participants.some((p) => p.id === action.incoming.id)
    )
      throw Error("This Member is not eligible for this new commitment.")
    const required = (c.active?.rounds || [])
      .filter((r) => Date.parse(r.schedule.opensAt) <= Date.parse(at))
      .reduce(
        (sum, r) =>
          sum +
          e.positions.reduce(
            (s, p) =>
              s +
              (p.n === r.position
                ? 0
                : p.holders.reduce(
                    (v, h) =>
                      v + shareAmount(toMinor(c.terms.amount), h.fraction),
                    0,
                  )),
            0,
          ),
        0,
      )
    l.replacements.push({
      id: `${c.id}-replacement-${l.replacements.length + 1}`,
      cycleId: c.id,
      exitId: e.id,
      outgoingMemberId: e.memberId,
      incomingMemberId: action.incoming.id,
      incomingName: action.incoming.name,
      proposedAt: at,
      positions: structuredClone(e.positions),
      terms: structuredClone(c.terms),
      regularizationRequiredMinor: required,
      regularizationSatisfiedMinor: 0,
      status: "proposed",
    })
    c.participants.push({
      ...structuredClone(action.incoming),
      status: "approved",
      acceptances: [],
      revision: 0,
    })
    audit(
      "Replacement proposed; Member consent and separate historical Position regularization required.",
    )
  } else if (action.type === "accept-replacement") {
    member(action.memberId)
    live()
    const r = l.replacements.find(
      (r) =>
        r.id === action.id &&
        r.cycleId === c.id &&
        r.incomingMemberId === actorId,
    )
    if (!r || r.acceptance || !eligible(actorId))
      throw Error("No eligible replacement proposal awaits your acceptance.")
    r.acceptance = {
      at,
      actorId,
      terms: JSON.stringify({
        terms: r.terms,
        positions: r.positions,
        regularizationRequiredMinor: r.regularizationRequiredMinor,
      }),
    }
    r.status = "awaiting-regularization"
    audit(
      "Replacement Member accepted terms and Position. Financial handover awaits regularization and the next eligible Round.",
    )
  } else if (action.type === "complete") {
    if(g.payouts?.records.some(p=>p.cycleId===c.id&&p.calculationChanged))throw Error("A changed payout calculation awaits policy resolution.")
    owner()
    live()
    const a = c.active
    if (
      !a ||
      a.rounds.some(
        (r) =>
          !a.resolvedRoundIds.includes(r.id) ||
          Date.parse(r.schedule.dueAt) > Date.parse(at),
      )
    )
      throw Error("Every scheduled Round must have concluded.")
    if (
      a.rounds.some(
        (r) =>
          !r.beneficiaries.length &&
          !l.payoutFacts.some(
            (p) =>
              p.cycleId === c.id &&
              p.position === r.position &&
              p.status === "vacant-resolved-demo",
          ),
      )
    )
      throw Error(
        "Vacated payout Positions require an explicit resolved rotation outcome.",
      )
    if (
      a.rounds.some((r) =>
        r.beneficiaries.some(
          (b) =>
            !l.payoutFacts.some(
              (p) =>
                p.cycleId === c.id &&
                p.position === r.position &&
                p.memberId === b.memberId &&
                [
                  "received-demo",
                  "completed-recorded",
                  "vacant-resolved-demo",
                  "breach-demo",
                ].includes(p.status),
            ),
        ),
      )
    )
      throw Error(
        "Every payout Position requires a resolved rotation outcome; separate breach cases may continue.",
      )
    c.status = l.recoveries.some(
      (r) => r.cycleId === c.id && r.status !== "resolved",
    )
      ? "completed-with-recovery"
      : "completed"
    c.completedAt = at
    a.endedAt = at
    g.currentCycleId = null
    l.exits
      .filter(
        (e) =>
          e.cycleId === c.id &&
          e.status === "approved" &&
          e.settlement.timing === "cycle-end",
      )
      .forEach((e) => (e.settlement.dueAt = at))
    audit(
      "Rotation completed. Completion date fixed; penalty growth stopped. Outstanding cases continue independently. Choose continuation deliberately.",
    )
  } else if (action.type === "force-close") {
    owner()
    live()
    if (
      action.reason.trim().length < 10 ||
      !action.evidence.trim() ||
      !Number.isSafeInteger(action.absorptionMinor) ||
      action.absorptionMinor < 0
    )
      throw Error(
        "Provide a reason, evidence reference and valid proposed absorption amount.",
      )
    if (l.forceCloseRequests.some((r) => r.cycleId === c.id))
      throw Error("A Force Close request already exists.")
    l.forceCloseRequests.push({
      id: `${c.id}-force-close`,
      cycleId: c.id,
      requestedAt: at,
      reason: action.reason,
      evidenceReference: action.evidence,
      requestedAbsorptionMinor: action.absorptionMinor,
      status: "pending-tcs-review",
      affectedMemberIds: c.participants
        .filter((p) => p.status === "approved")
        .map((p) => p.id),
      balances: {
        principalMinor: (c.active?.obligations || []).reduce(
          (s, o) => s + balances(o).outstanding,
          0,
        ),
        penaltyMinor: cyclePenaltyOutstanding(g,c.id) + l.recoveries
          .filter((r) => r.cycleId === c.id && !r.regularizedDefault)
          .reduce((s, r) => s + recoveryBalances(r).penaltyOutstanding, 0),
        unpaidPayoutMinor: (c.active?.rounds || [])
          .filter((r) => Date.parse(r.schedule.opensAt) <= Date.parse(at))
          .reduce(
            (sum, r) =>
              sum +
              r.beneficiaries.reduce((sum,b)=>{const payout=g.payouts?.records.find(p=>p.cycleId===c.id&&p.roundId===r.id&&p.memberId===b.memberId);return sum+(payout?payoutTotals(payout).outstanding:l.payoutFacts.some(p=>p.cycleId===c.id&&p.position===r.position&&p.memberId===b.memberId&&['received-demo','completed-recorded'].includes(p.status))?0:b.entitlementMinor)},0),
            0,
          ),
        exitSettlementMinor: l.exits
          .filter((e) => e.cycleId === c.id && e.settlement.status === "due")
          .reduce((s, e) => s + e.settlement.dueMinor, 0),
        recoveryMinor: l.recoveries
          .filter((r) => r.cycleId === c.id && r.status !== "resolved")
          .reduce(
            (s, r) => s + recoveryBalances(r).outstanding,
            0,
          ),
        disputes: l.disputes
          .filter((d) => d.cycleId === c.id && d.status === "open")
          .map((d) => d.id),
      },
    })
    audit(
      "Force Close requested for TCS review. No balances settled, waived or absorbed; Group remains intact.",
    )
  } else if (action.type === "terminate") {
    owner()
    if (action.reason.trim().length < 10)
      throw Error("Explain why this Group should terminate.")
    const pending =
      g.cycles.some(
        (c) => c.status === "activated" && financiallyCommenced(c),
      ) || unresolved(g)
    l.termination = {
      status: pending ? "pending-tcs-review" : "terminated",
      at,
      reason: action.reason,
    }
    if (!pending && ["draft", "activated"].includes(c.status)) {
      c.status = "cancelled"
      c.cancelledAt = at
      c.cancellationReason = "Group terminated before financial commencement"
      g.currentCycleId = null
    }
    audit(
      pending
        ? "Group termination pending TCS review; unresolved financial matters retained."
        : "Group terminated; all historical Cycles retained read-only.",
    )
  } else if (action.type === "consent-amendment") {
    member(action.memberId)
    live()
    const a = l.amendments.find((a) => a.id === action.id && a.cycleId === c.id)
    if (
      !a || ["rejected","effective"].includes(a.status) ||
      !a.affectedMemberIds.includes(actorId) ||
      a.consents.some((s) => s.memberId === actorId)
    )
      throw Error("No amendment awaits your consent.")
    at=[at,...(a.review?.decisions.map(d=>d.at)||[])].sort().at(-1)!
    a.consents.push({
      memberId: actorId,
      at,
      terms: JSON.stringify(a.proposedTerms),
    })
    if (
      a.affectedMemberIds.every((id) =>
        a.consents.some((s) => s.memberId === id),
      )
    )
      { if(a.review?.decisions.some(d=>d.action==='approve')){a.review.state=finishAmendmentApproval(g,a,at);a.review.caseStatus=a.status==='effective'?'Resolved':'Awaiting External Action'}else{a.status='pending-tcs-review';if(a.review){a.review.state='Member consent complete ? awaiting review';a.review.caseStatus='In Review'}} }
    audit(
      "Member consent recorded for amendment request. Existing terms remain unchanged.",
    )
  }
  releaseAdvance(g,at)
  return g
}
