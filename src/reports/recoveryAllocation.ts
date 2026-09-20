import type { Cycle, ThriftGroup } from '../groups/model.ts'
import { balances } from '../rounds/model.ts'
import { minor } from '../payments/model.ts'
import { recoveryBalances } from '../lifecycle/recovery.ts'

export interface RecoveryAllocation {
  caseId: string
  memberId: string
  sourceId: string
  obligationId?: string
  kind: 'principal' | 'penalty'
  dueAt: string
  round: number
  originalMinor: number
  appliedMinor: number
  waivedMinor: number
  outstandingMinor: number
  aggregatePenalty: boolean
}
export interface RecoveryProjection {
  allocations: RecoveryAllocation[]
  cases: { caseId: string; memberId: string; excessMinor: number; unappliedMinor: number; issue: string }[]
}
const total = (amounts: number[]) => amounts.reduce((a, b) => minor(a + minor(b)), 0)
const compare = (a: RecoveryAllocation, b: RecoveryAllocation) => Date.parse(a.dueAt) - Date.parse(b.dueAt) || a.round - b.round || (a.sourceId < b.sourceId ? -1 : a.sourceId > b.sourceId ? 1 : 0)

/** Read-only projection. It never changes obligations, recovered totals or payment transactions. */
export function allocateRecovery(group: ThriftGroup, cycle: Cycle): RecoveryProjection {
  const result: RecoveryProjection = { allocations: [], cases: [] }
  if (!group.cycles.includes(cycle)) throw Error('Recovery Cycle is outside this Group.')
  const cases = (group.lifecycle?.recoveries || []).filter(r => r.cycleId === cycle.id)
  const obligations = (cycle.active?.obligations || []).filter(o => o.groupId === group.id && o.cycleId === cycle.id)
  const generated = (roundId: string) => (!cycle.active?.generatedRoundIds || cycle.active.generatedRoundIds.includes(roundId)) && cycle.active?.rounds.some(r => r.id === roundId && r.groupId === group.id && r.cycleId === cycle.id && Date.parse(r.schedule.opensAt) <= Date.parse(cycle.active!.referenceAt))
  const eligible = (memberId: string, ids?: string[]) => obligations.filter(o => o.memberId === memberId && (!ids || ids.includes(o.id)) && balances(o).outstanding > 0 && generated(o.roundId))
  for (const recovery of cases) {
    const aggregate = recoveryBalances(recovery)
    const scoped = eligible(recovery.memberId, recovery.obligationIds)
    const overlap = cases.some(other => other !== recovery && other.memberId === recovery.memberId && eligible(other.memberId, other.obligationIds).some(o => scoped.some(p => p.id === o.id)))
    const principal = scoped.map<RecoveryAllocation>(o => {
      const round = cycle.active!.rounds.find(r => r.id === o.roundId)!
      return { caseId: recovery.id, memberId: recovery.memberId, sourceId: o.id, obligationId: o.id, kind: 'principal', dueAt: round.schedule.dueAt, round: round.number, originalMinor: balances(o).outstanding, appliedMinor: 0, waivedMinor: 0, outstandingMinor: balances(o).outstanding, aggregatePenalty: false }
    }).sort(compare)
    const invalidLinks = recovery.obligationIds?.some(id => !obligations.some(o => o.id === id && o.memberId === recovery.memberId))
    // An aggregate is one existing case liability, not an invented per-Round penalty charge.
    const penalties = (recovery.penaltyObligations || (recovery.penaltyMinor ? [{ id: recovery.id + ':penalty', dueAt: recovery.openedAt, amountMinor: recovery.penaltyMinor }] : [])).map<RecoveryAllocation>(p => {
      const obligationId = 'obligationId' in p ? p.obligationId : undefined
      const obligation = obligations.find(o => o.id === obligationId && o.memberId === recovery.memberId)
      const round = cycle.active?.rounds.find(r => r.id === obligation?.roundId)
      return { caseId: recovery.id, memberId: recovery.memberId, sourceId: p.id, obligationId, kind: 'penalty', dueAt: p.dueAt, round: round?.number || 0, originalMinor: minor(p.amountMinor), appliedMinor: 0, waivedMinor: 0, outstandingMinor: minor(p.amountMinor), aggregatePenalty: !recovery.penaltyObligations }
    }).sort(compare)
    let issue = overlap ? 'Overlapping Recovery case scope; explicit disjoint obligation links required.' : invalidLinks ? 'Recovery contains an obligation outside its Member/Group/Cycle scope.' : ''
    if (total(principal.map(p => p.originalMinor)) !== recovery.principalMinor) issue ||= 'Recovery principal does not reconcile to its generated source obligations.'
    if (total(penalties.map(p => p.originalMinor)) !== recovery.penaltyMinor || penalties.some(p => !Number.isFinite(Date.parse(p.dueAt)) || p.obligationId && !obligations.some(o => o.id === p.obligationId && o.memberId === recovery.memberId && balances(o).required > 0 && generated(o.roundId) && (!recovery.obligationIds || recovery.obligationIds.includes(o.id)))) || new Set(penalties.map(p => p.sourceId)).size !== penalties.length) issue ||= 'Penalty source records do not reconcile to this Recovery case.'
    if (principal.some(p => !Number.isFinite(Date.parse(p.dueAt))) || new Set(principal.map(p => p.sourceId)).size !== principal.length || cases.filter(r => r.id === recovery.id).length !== 1) issue ||= 'Invalid or duplicate Recovery source identifiers/dates.'
    if (aggregate.exception && !aggregate.excessMinor) issue ||= 'Invalid penalty waiver or Recovery financial state.'
    if (issue) {
      result.cases.push({ caseId: recovery.id, memberId: recovery.memberId, excessMinor: aggregate.excessMinor, unappliedMinor: recovery.recoveredMinor, issue })
      continue
    }
    const targeted = recovery.penaltyWaivers?.filter(w => !!w.penaltyId) || []
    if (targeted.some(w => !penalties.some(p => p.sourceId === w.penaltyId)) || penalties.some(p => total(targeted.filter(w => w.penaltyId === p.sourceId).map(w => w.amountMinor)) > p.originalMinor)) {
      result.cases.push({caseId:recovery.id,memberId:recovery.memberId,excessMinor:0,unappliedMinor:recovery.recoveredMinor,issue:'Invalid targeted penalty waiver.'}); continue
    }
    for (const p of penalties) { p.waivedMinor = total(targeted.filter(w => w.penaltyId === p.sourceId).map(w => w.amountMinor)); p.outstandingMinor -= p.waivedMinor }
    let waived = aggregate.penaltyWaived - total(targeted.map(w => w.amountMinor))
    // Waivers stay separate from payments; their total is already validated by recoveryBalances.
    for (const p of penalties) { const take = Math.min(waived, p.outstandingMinor); p.waivedMinor += take; p.outstandingMinor -= take; waived -= take }
    let remaining = 0
    const receipts = recovery.recoveryPayments
    if (receipts && (total(receipts.map(p => p.amountMinor)) !== recovery.recoveredMinor || new Set(receipts.map(p => p.id)).size !== receipts.length || receipts.some(p => !Number.isFinite(Date.parse(p.businessAt)) || !Number.isFinite(Date.parse(p.recordedAt))))) {
      result.cases.push({caseId:recovery.id,memberId:recovery.memberId,excessMinor:0,unappliedMinor:recovery.recoveredMinor,issue:'Dated Recovery receipts do not reconcile to the retained total.'}); continue
    }
    // New dated receipts cannot be silently reassigned to obligations or penalties generated later.
    for (const receipt of receipts ? [...receipts].sort((a,b) => Date.parse(a.businessAt)-Date.parse(b.businessAt)||a.id.localeCompare(b.id)) : [{amountMinor:minor(recovery.recoveredMinor),businessAt:''}]) {
      let unapplied=receipt.amountMinor
      for (const p of [...principal, ...penalties]) {
        const obligation=obligations.find(o=>o.id===p.obligationId)
        const available=p.kind==='penalty'?p.dueAt:cycle.active?.rounds.find(r=>r.id===obligation?.roundId)?.schedule.opensAt
        if (receipt.businessAt && (!available || Date.parse(available)>Date.parse(receipt.businessAt))) continue
        const applied=Math.min(unapplied,p.outstandingMinor)
        p.appliedMinor+=applied;p.outstandingMinor-=applied;unapplied-=applied
      }
      remaining=minor(remaining+unapplied)
    }
    result.allocations.push(...principal, ...penalties)
    result.cases.push({ caseId: recovery.id, memberId: recovery.memberId, excessMinor: remaining, unappliedMinor: remaining, issue: remaining ? 'Recovery Payment Exception' : '' })
  }
  return result
}
