import {optionalDecision} from "../payments/optional.ts"
﻿import type { ThriftGroup } from "../groups/model.ts"
import { emptyLifecycle } from "../lifecycle/model.ts"
import { minor } from "../payments/model.ts"
import {
  bankKey,
  validBank,
  emptyPayouts,
  validatePolicy,
  type BankDirectory,
  type PayoutPolicy,
  type PayoutRecord,
  type PayoutInstallment,
} from "./model.ts"
import {
  payoutAmounts,
  installmentReceived,
  payoutReady,
  payoutTotals,
  proportion,
  percent,
} from "./math.ts"
const plus = (at: string, hours: number) =>
  new Date(Date.parse(at) + hours * 3600000).toISOString()
const nowValid = (at: string) => {
  if (!Number.isFinite(Date.parse(at)))
    throw Error("A valid payout reference time is required.")
}
const audit = (g: ThriftGroup, at: string, actor: string, action: string) =>
  g.history.push({ at, actor, action })
export function evaluatePayouts(
  group: ThriftGroup,
  at: string,
  banks: BankDirectory = {},
): ThriftGroup {
  nowValid(at)
  const g = structuredClone(group)
  if (!g.payouts) return g
  const state = g.payouts
  if (state.referenceAt && Date.parse(at) < Date.parse(state.referenceAt))
    throw Error("Payout reference time cannot move backwards.")
  state.referenceAt = at
  for (const c of g.cycles) {
    if (!c.active) continue
    if (c.status === "activated")
      for (const round of c.active.rounds) {
        if (!payoutReady(g, c, round, at)) continue
        for (const b of round.beneficiaries) {
          let record = state.records.find(
            (p) =>
              p.cycleId === c.id &&
              p.roundId === round.id &&
              p.memberId === b.memberId,
          )
          if (!record) {
            record = {
              id: `${round.id}-payout-${b.memberId}`,
              groupId: g.id,
              cycleId: c.id,
              roundId: round.id,
              position: round.position,
              memberId: b.memberId,
              fraction: b.fraction,
              beneficiaryName:
                c.participants.find((p) => p.id === b.memberId)?.name ||
                b.memberId,
              readyAt: at,
              targetAt: round.schedule.payoutTargetAt,
              instructions: [],
              installments: [],
              disputes: [],
              status: "ready",
              policy: state.policy ? structuredClone(state.policy) : undefined,
            }
            state.records.push(record)
            audit(
              g,
              at,
              "TCS",
              "Round " +
                round.number +
                " payout ready for " +
                record.beneficiaryName +
                ".",
            )
          }
          try {
            const calculated = payoutAmounts(
              g,
              c,
              round,
              b.memberId,
              record.policy,
            )
            record.calculation = calculated
            const existing = record.instructions[record.instructions.length - 1]
            if (existing && existing.netMinor !== calculated.netMinor) {
              if (!record.installments.length) {
                existing.status = "stale"
                existing.staleReason =
                  "Confirmed collection changed; refreshed transfer amount required."
              } else {
                record.calculationChanged = "Frozen payout calculation changed unexpectedly; controlled review required."
              }
            }
          } catch {}
          const bank = banks[b.memberId],
            last = record.instructions[record.instructions.length - 1]
          if (
            last &&
            last.status === "current" &&
            bankKey(last.bank) !== bankKey(bank) &&
            !record.installments.some((i) => i.instructionId === last.id)
          ) {
            last.status = "stale"
            last.staleReason =
              "Member payout bank details changed before transfer."
            audit(
              g,
              at,
              "TCS",
              "Payout instruction " +
                last.id +
                " invalidated after bank detail change.",
            )
          }
          if (!last && validBank(bank)) {
            try {
              const amounts = payoutAmounts(
                g,
                c,
                round,
                b.memberId,
                record.policy,
              )
              record.instructions.push({
                id: record.id + "-instruction-1",
                at,
                bank: {
                  ...structuredClone(bank),
                  memberId: b.memberId,
                  capturedAt: at,
                },
                ...amounts,
                status: "current",
              })
              record.status = "instruction-prepared"
              audit(
                g,
                at,
                "TCS",
                "Payout instruction prepared with validated beneficiary bank snapshot.",
              )
            } catch {
              /* A disclosed financial-policy blocker is displayed by the payout view. */
            }
          }
        }
      }
    for (const record of state.records.filter((p) => p.cycleId === c.id)) {
      for(const d of record.disputes){
        const process=d.process;if(!process)continue
        for(const request of process.requests)if(!request.responses.length&&!request.missedAt&&Date.parse(at)>Date.parse(request.deadline)){request.missedAt=at;audit(g,at,'TCS',request.party+' evidence deadline missed; case and request retained.')}
        if(process.stage==='appeal-available'&&!process.appeal&&Date.parse(at)>Date.parse(process.appealDeadline!)){
          process.stage='final';process.finalizedAt=process.appealDeadline;d.status='resolved'
          const linked=g.lifecycle?.disputes.find(l=>l.id===d.installmentId+'-dispute');if(linked)linked.status='resolved'
          audit(g,at,'TCS','Dispute '+d.id+' finalized after configured one-appeal window expired; original resolution retained.')
        }
      }
      // Existing transfer evidence remains unchanged. Timed case events live outside the immutable Cycle.
      for (const i of record.installments) {
        if (
          i.status === "awaiting-confirmation" &&
          Date.parse(at) >= Date.parse(i.confirmationDueAt) &&
          !record.disputes.some((d) => d.installmentId === i.id)
        ) {
          i.status = "window-elapsed"
          i.autoCompletedAt = i.confirmationDueAt
          i.disputeClosesAt = plus(
            i.confirmationDueAt,
            record.policy!.disputeHours,
          )
          audit(
            g,
            at,
            "TCS",
            "Payout installment " +
              i.id +
              " completed — confirmation window elapsed. No Member confirmation recorded.",
          )
        }
        if (
          i.status === "window-elapsed" &&
          i.disputeClosesAt &&
          Date.parse(at) >= Date.parse(i.disputeClosesAt) &&
          !i.finalizedAt
        ) {
          i.finalizedAt = i.disputeClosesAt
          audit(g, at, "TCS", "Normal dispute window closed for " + i.id + ".")
        }
      }
      deriveRecord(g, record, at)
      if(record.review&&record.disputes.length&&record.disputes.every(d=>d.status==='resolved')&&record.status.startsWith('completed-')){record.review.caseStatus='Resolved';record.review.state='Payout resolved on retained Operations evidence; no Member confirmation fabricated'}
      const totals = payoutTotals(record)
      if(record.breach?.status==='open' && totals.outstanding===0 && record.disputes.every(d=>d.status==='resolved') && record.status.startsWith('completed-')){
        record.breach.status='resolved';record.breach.resolvedAt=at
        const linked=g.lifecycle?.disputes.find(d=>d.id===record.breach!.caseId);if(linked)linked.status='resolved'
        audit(g,at,'TCS','Organization payout breach resolved from evidenced payout outcome; original breach retained.')
      }
      if (
        c.status === "activated" &&
        record.policy &&
        totals.outstanding > 0 &&
        !record.breach &&
        Date.parse(at) >
          Date.parse(
            plus(
              new Date(
                Math.max(
                  Date.parse(record.targetAt),
                  Date.parse(record.readyAt),
                ),
              ).toISOString(),
              record.policy.breachHours,
            ),
          )
      ) {
        const caseId = record.id + "-breach"
        record.breach = {
          at,
          dueAt: plus(new Date(Math.max(Date.parse(record.targetAt),Date.parse(record.readyAt))).toISOString(), record.policy.breachHours),
          amountMinor: totals.outstanding,
          status: "open",
          caseId,
        }
        g.lifecycle ??= emptyLifecycle()
        g.lifecycle.disputes.push({
          id: caseId,
          cycleId: c.id,
          kind: "organization-payout-breach",
          status: "open",
          reason:
            "Organization payout remains outstanding beyond the configured payout policy window.",
        })
        audit(
          g,
          at,
          "TCS",
          "Organization payout breach identified; no TCS reimbursement or automatic enforcement.",
        )
      }
    }
    if (c.status === "activated") {
      for (const round of c.active.rounds) {
        const recorded = state.records.filter(
          (p) => p.cycleId === c.id && p.roundId === round.id,
        )
        if (recorded.some((p) => !p.status.startsWith("completed-")))
          c.active.resolvedRoundIds = c.active.resolvedRoundIds.filter(
            (id) => id !== round.id,
          )
        const payouts = state.records.filter(
          (p) => p.cycleId === c.id && p.roundId === round.id,
        )
        if (
          round.beneficiaries.length &&
          round.beneficiaries.every((b) =>
            payouts.some(
              (p) =>
                p.memberId === b.memberId && p.status.startsWith("completed-"),
            ),
          ) &&
          !c.active.resolvedRoundIds.includes(round.id)
        ) {
          c.active.resolvedRoundIds.push(round.id)
          audit(
            g,
            at,
            "TCS",
            "Round " +
              round.number +
              " payout outcomes completed; Cycle progression updated.",
          )
        }
      }
      c.financial.payouts = state.records
        .filter((p) => p.cycleId === c.id)
        .reduce((s, p) => s + p.installments.length, 0)
    }
  }
  return g
}
function recordDisputeFinal(p:PayoutRecord,id:string){return p.disputes.some(d=>d.installmentId===id&&d.status==='resolved')}
function deriveRecord(g: ThriftGroup, p: PayoutRecord, at: string) {
  const totals = payoutTotals(p),
    prior = p.status
  if (p.disputes.some(d=>d.status!=='resolved')) {p.status = "disputed";delete p.completedAt;delete p.finalizedAt}
  else if (p.installments.some((i) => i.amountException)) p.status = "exception"
  else if (totals.outstanding > 0 && p.disputes.some(d=>d.process?.resolutions.length)) {
    p.status = totals.received > 0 ? "partially-paid" : "exception"
    delete p.completedAt
    delete p.finalizedAt
  }
  else if (totals.paid > 0 && totals.outstanding > 0) {
    p.status = "partially-paid"
    delete p.completedAt
    delete p.finalizedAt
  }
  else if (
    p.installments.length &&
    p.installments.some((i) => i.status === "awaiting-confirmation")
  )
    p.status = "awaiting-confirmation"
  else if (p.installments.length && totals.outstanding === 0) {
    p.status = p.disputes.some(d=>d.process?.resolutions.length) ? "completed-operations-evidence" : p.installments.every((i) => i.status === "member-confirmed")
      ? "completed-member-confirmed"
      : "completed-window-elapsed"
    p.completedAt ??= new Date(Math.max(...p.installments.map(i=>Date.parse(i.confirmedAt||i.autoCompletedAt||at)))).toISOString()
    if (
      p.installments.every(
        (i) => i.status === "member-confirmed" || !!i.finalizedAt || recordDisputeFinal(p,i.id),
      )
    )
      p.finalizedAt ??= new Date(Math.max(...p.installments.map(i=>Date.parse(i.finalizedAt||i.confirmedAt||at)))).toISOString()
  }
  const retained = g.lifecycle?.payoutFacts.find(
    (f) =>
      f.cycleId === p.cycleId &&
      f.position === p.position &&
      f.memberId === p.memberId,
  )
  if (
    retained?.status === "completed-recorded" &&
    !p.status.startsWith("completed-")
  )
    retained.status = "received-recorded"
  if (prior !== p.status && p.status.startsWith("completed-"))
    audit(g, at, "TCS", "Payout " + p.id + " " + p.status + ".")
  if (
    p.installments.some(
      (i) => i.status === "member-confirmed" || i.status === "window-elapsed" || !!p.disputes.find(d=>d.installmentId===i.id)?.process?.resolutions.length && installmentReceived(p,i.id)>0,
    )
  ) {
    g.lifecycle ??= emptyLifecycle()
    let fact = g.lifecycle.payoutFacts.find(
      (f) =>
        f.cycleId === p.cycleId &&
        f.position === p.position &&
        f.memberId === p.memberId,
    )
    if (!fact) {
      fact = {
        cycleId: p.cycleId,
        position: p.position,
        memberId: p.memberId,
        status: "received-recorded",
        entitlementMinor: p.instructions[0]?.entitlementMinor || 0,
        at,
      }
      g.lifecycle.payoutFacts.push(fact)
    }
    fact.status = p.status.startsWith("completed-")
      ? "completed-recorded"
      : "received-recorded"
  }
}
export type PayoutAction = {type:'evidence-response'|'appeal';payoutId:string;disputeId:string;requestId?:string;statement:string;evidence:string[];party:'Member'|'Organization'} | { type: "policy" ; policy: PayoutPolicy } | {
  type: "refresh-instruction"
  payoutId: string
} | {
  type: "record"
  payoutId: string
  instructionId: string
  amountMinor: number
  transferredAt: string
  reference: string
  evidence?: PayoutInstallment["evidence"]
  notes: string
  partial: boolean
  partialReason?: string
  completionPlan?: string
  expectedCompletionAt?: string
  acknowledged: boolean
} | {
  type: "confirm" | "dispute"
  payoutId: string
  installmentId: string
  reason?: string
  acknowledged: boolean
}
export function payoutTransition(
  group: ThriftGroup,
  organizationId: string,
  ownerId: string,
  actorId: string,
  action: PayoutAction,
  at: string,
  banks: BankDirectory,
): ThriftGroup {
  if (group.organizationId !== organizationId)
    throw Error("This payout belongs to another Organization.")
  nowValid(at)
  const initial = structuredClone(group)
  initial.payouts ??= emptyPayouts()
  let g = evaluatePayouts(initial, at, banks),
    s = g.payouts!
  const owner = () => {
    if (actorId !== ownerId)
      throw Error(
        "Only the Organization Owner can record an external transfer.",
      )
  }
  if (action.type === "policy") {
    owner()
    validatePolicy(action.policy)
    if (s.records.some((p) => p.cycleId===g.cycles[g.cycles.length-1].id && p.installments.length))
      throw Error("Recorded payout policy snapshots cannot be changed.")
    s.policy = structuredClone(action.policy)
    s.records.filter(p=>p.cycleId===g.cycles[g.cycles.length-1].id).forEach((p) => (p.policy = structuredClone(action.policy)))
    audit(
      g,
      at,
      actorId,
      "Explicit prototype payout windows and revenue-share policy configured.",
    )
    return evaluatePayouts(g, at, banks)
  }
  const p = s.records.find((p) => p.id === action.payoutId)
  if (!p) throw Error("This payout is not ready or does not exist.")
  const c = g.cycles.find((c) => c.id === p.cycleId)!,
    round = c.active!.rounds.find((r) => r.id === p.roundId)!
  if(action.type==='evidence-response'||action.type==='appeal'){
    if(action.party==='Member'?actorId!==p.memberId:actorId!==ownerId)throw Error('Only the identified party may submit this response.')
    if(action.statement.trim().length<10||!action.evidence.some(e=>e.trim()))throw Error('Provide a meaningful statement and evidence reference.')
    const d=p.disputes.find(d=>d.id===action.disputeId),process=d?.process
    if(!process||process.stage==='final')throw Error('This dispute is not accepting ordinary submissions.')
    if(action.type==='appeal'){
      if(process.stage!=='appeal-available'||process.appeal||Date.parse(at)>Date.parse(process.appealDeadline!))throw Error('Only one appeal within the configured window is permitted.')
      process.appeal={at,actor:actorId,party:action.party,reason:action.statement,evidence:[...action.evidence]};process.stage='appeal-pending'
      if(p.review){p.review.caseStatus='Awaiting Approval';p.review.state='One appeal pending independent review'}
    }else{
      const request=process.requests.find(r=>r.id===action.requestId&&r.party===action.party)
      if(!request)throw Error('Choose the request addressed to this party.')
      if(Date.parse(at)>Date.parse(request.deadline)&&!request.responses.length)request.missedAt??=at
      request.responses.push({at,actor:actorId,statement:action.statement,evidence:[...action.evidence]})
      if(p.review){p.review.caseStatus='In Review';p.review.state='Party evidence received'}
    }
    audit(g,at,actorId,action.party+' submitted '+action.type+': '+action.statement)
    return evaluatePayouts(g,at,banks)
  }
  if (action.type === "refresh-instruction") {
    owner()
    if (c.status !== "activated")
      throw Error("Historical payout instructions are read-only.")
    const bank = banks[p.memberId]
    if (!validBank(bank))
      throw Error("The Member must provide validated bank details.")
    const last = p.instructions[p.instructions.length - 1]
    if (
      last &&
      bankKey(last.bank) === bankKey(bank) &&
      last.status === "current"
    )
      throw Error("The existing instruction is current.")
    if (last && !p.installments.some((i) => i.instructionId === last.id)) {
      last.status = "stale"
      last.staleReason = "Superseded by a newly validated instruction."
    }
    p.instructions.push({
      id: p.id + "-instruction-" + (p.instructions.length + 1),
      at,
      bank: { ...structuredClone(bank), memberId: p.memberId, capturedAt: at },
      ...payoutAmounts(g, c, round, p.memberId, p.policy),
      status: "current",
    })
    delete p.calculationChanged
    audit(
      g,
      at,
      actorId,
      "Payout instruction refreshed. Prior bank snapshots preserved.",
    )
  } else if (action.type === "record") {
    owner()
    if (c.status !== "activated" || !payoutReady(g, c, round))
      throw Error("Normal transfer recording requires an active, ready Round.")
    if (!p.policy)
      throw Error(
        "Configure explicit prototype confirmation/dispute policy before recording payout.",
      )
    const instruction = p.instructions.find(
        (i) => i.id === action.instructionId,
      ),
      latest = p.instructions[p.instructions.length - 1]
    if (
      !instruction ||
      instruction !== latest ||
      instruction.status !== "current" ||
      !validBank(banks[p.memberId]) ||
      bankKey(instruction.bank) !== bankKey(banks[p.memberId])
    )
      throw Error(
        "Beneficiary bank instruction is stale or unvalidated. Refresh before recording transfer.",
      )
    minor(action.amountMinor)
    nowValid(action.transferredAt)
    if (
      !action.amountMinor ||
      !action.acknowledged ||
      action.reference.trim().length < 3 ||
      Date.parse(action.transferredAt) > Date.parse(at) ||
      Date.parse(action.transferredAt) < Date.parse(instruction.at)
    )
      throw Error(
        "Confirm the external transfer, amount, reference and actual date after instruction preparation.",
      )
    if (p.installments.some((i) => i.reference === action.reference.trim()))
      throw Error(
        "This transfer reference is already recorded for this payout.",
      )
    if (p.calculationChanged) throw Error(p.calculationChanged)
    if (p.disputes.some(d=>d.status!=='resolved') || p.installments.some((i) => i.amountException))
      throw Error(
        "This payout has an unresolved case; normal further recording is unavailable.",
      )
    const before = payoutTotals(p)
    if (before.outstanding === 0) throw Error("No payout balance remains.")
    if (
      action.partial &&
      (!action.partialReason?.trim() ||
        !action.completionPlan?.trim() ||
        !action.evidence ||
        !action.expectedCompletionAt ||
        !Number.isFinite(Date.parse(action.expectedCompletionAt)) ||
        Date.parse(action.expectedCompletionAt) <=
          Date.parse(action.transferredAt))
    )
      throw Error(
        "Controlled Partial Payout requires a reason, evidence, authorizer and future completion plan/date.",
      )
    const exception =
      action.amountMinor > before.outstanding
        ? "Recorded transfer exceeds the protected net payout entitlement."
        : action.amountMinor < before.outstanding && !action.partial
          ? "Short transfer was not identified as controlled Partial Payout."
          : undefined
    const feeCumulative = proportion(
        before.fee,
        Math.min(before.received + action.amountMinor, before.net),
        before.net,
      ),
      fee = feeCumulative - proportion(before.fee,Math.min(before.received,before.net),before.net),
      tcsCumulative = percent(feeCumulative, p.policy.tcsSharePercent)
    const decision = optionalDecision(g,c.id,round.id,p.memberId)
    if (!decision) throw Error("The beneficiary must select contribute or skip before payout execution begins.")
    if (!decision.lockedAt) {
      decision.lockedAt = at
      decision.confirmedMinorAtCutoff = (c.active?.obligations || [])
        .filter(o => o.roundId === round.id && o.memberId === p.memberId)
        .flatMap(o => o.components).reduce((sum,component)=>sum + component.optionalSatisfiedMinor,0)
      audit(g,at,actorId,"Optional contribution frozen at first payout transfer: Member choice " + decision.choice + "; provider-confirmed " + decision.confirmedMinorAtCutoff + " kobo. Unpaid optional amount is not debt; later funds require payment exception resolution.")
    }
    p.installments.push({
      id: p.id + "-installment-" + (p.installments.length + 1),
      instructionId: instruction.id,
      bank: structuredClone(instruction.bank),
      amountMinor: action.amountMinor,
      at: action.transferredAt,
      recordedAt: at,
      actorId,
      reference: action.reference.trim(),
      evidence: action.evidence ? structuredClone(action.evidence) : undefined,
      notes: action.notes,
      partial: action.partial,
      partialReason: action.partialReason,
      completionPlan: action.completionPlan,
      expectedCompletionAt: action.expectedCompletionAt,
      feeRecognizedMinor: exception ? 0 : Math.max(0, fee),
      tcsShareMinor: exception
        ? 0
        : Math.max(0, tcsCumulative - percent(proportion(before.fee,Math.min(before.received,before.net),before.net),p.policy.tcsSharePercent)),
      confirmationDueAt: plus(at, p.policy.confirmationHours),
      status: "awaiting-confirmation",
      amountException: exception,
    })
    audit(
      g,
      at,
      actorId,
      action.partial
        ? "Controlled partial payout recorded from Organization bank; recipient confirmation pending."
        : "External Organization bank transfer recorded; recipient confirmation pending. No TCS transfer was executed.",
    )
  } else if(action.type==='confirm'||action.type==='dispute') {
    if (actorId !== p.memberId)
      throw Error("Only this beneficiary can confirm or dispute their receipt.")
    if (!action.acknowledged)
      throw Error("Explicit Member acknowledgement is required.")
    const i = p.installments.find((i) => i.id === action.installmentId)
    if (!i) throw Error("Choose this Member payout installment.")
    if (action.type === "confirm") {
      if (i.status !== "awaiting-confirmation" || i.amountException)
        throw Error(
          "This installment is not awaiting normal recipient confirmation.",
        )
      i.status = "member-confirmed"
      i.confirmedAt = at
      i.confirmedBy = actorId
      i.finalizedAt = at
      audit(
        g,
        at,
        actorId,
        "Member confirmed receipt of payout installment " + i.id + ".",
      )
    } else {
      if (
        !["awaiting-confirmation", "window-elapsed"].includes(i.status) ||
        i.finalizedAt ||
        (i.disputeClosesAt && Date.parse(at) >= Date.parse(i.disputeClosesAt))
      )
        throw Error(
          "The normal dispute window has closed or this transfer already has a response.",
        )
      if (!action.reason || action.reason.trim().length < 5)
        throw Error("Describe the payout problem.")
      i.status = "disputed"
      p.disputes.push({
        id: p.id + "-dispute-" + (p.disputes.length + 1),
        installmentId: i.id,
        memberId: actorId,
        reason: action.reason,
        at,
        status: "open",
      })
      g.lifecycle ??= emptyLifecycle()
      g.lifecycle.disputes.push({
        id: i.id + "-dispute",
        cycleId: c.id,
        kind: "other",
        status: "open",
        reason: "Member payout dispute: " + action.reason,
      })
      audit(
        g,
        at,
        actorId,
        "Member disputed payout installment. Controlled review is required; no automatic completion.",
      )
    }
  }
  return evaluatePayouts(g, at, banks)
}

export function payoutClearance(groups: ThriftGroup[]): number {
  return groups.reduce(
    (count, g) =>
      count +
      (g.payouts?.records.filter(
        (p) =>
          !!p.calculationChanged ||
          !p.finalizedAt ||
          p.disputes.some(d=>d.status!=="resolved") ||
          p.breach?.status==="open" ||
          !p.status.startsWith("completed-"),
      ).length || 0),
    0,
  )
}
