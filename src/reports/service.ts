import { penaltyBalance } from '../penalties/balances.ts'
import { effectiveReferenceAt } from '../rounds/model.ts'
import { allocateRecovery } from './recoveryAllocation.ts'
import type { Cycle, ThriftGroup } from '../groups/model.ts'
import { balances, collection, currentRound, obligationState } from '../rounds/model.ts'
import { minor } from '../payments/model.ts'
import { payoutAmounts, payoutReady, payoutTotals } from '../payouts/math.ts'
import { finalRecognition } from '../reconciliation/evidencedRevenue.ts'
import { recoveryBalances } from '../lifecycle/recovery.ts'
import type { PayoutRecord } from '../payouts/model.ts'
import type { ReconciliationState } from '../reconciliation/model.ts'
import type { Cell, ReportActor, ReportFilters, ReportResult, ReportRow, ReportSources } from './model.ts'
import { reportCatalogue } from './catalogue.ts'

// All projections are allowlists. Never serialize a source record, review, bank account or audit note.
const sum = (values: number[]) => minor(values.reduce((a, b) => minor(a + minor(b)), 0))
const signedSum = (values: number[]) => values.reduce((a, b) => {
  if (!Number.isSafeInteger(b) || !Number.isSafeInteger(a + b)) throw Error('Unsafe report total.')
  return a + b
}, 0)
const positions = (c: Cycle, memberId: string) => [...new Set([...(c.snapshot?.positions || []), ...c.positions]
  .flatMap(p => p.holders.filter(h => h.memberId === memberId).map(h => `${p.n} (${h.fraction === 0.5 ? '½' : 'full'})`)))].join(', ')
const name = (c: Cycle, id: string) => c.participants.find(p => p.id === id)?.name || c.snapshot?.participants.find(p => p.id === id)?.name || id
const atDate = (at: string) => at ? at.slice(0, 10) : ''
function outcome(p: PayoutRecord) {
  const totals = payoutTotals(p)
  const evidenced = sum(p.installments.map(i => {
    const d = p.disputes.find(d => d.installmentId === i.id)
    return d ? finalRecognition(p, i.id)?.receivedMinor || 0 : i.status === 'member-confirmed' ? i.amountMinor : 0
  }))
  const window = sum(p.installments.filter(i => i.status === 'window-elapsed' && !p.disputes.some(d => d.installmentId === i.id)).map(i => i.amountMinor))
  const disputed = sum(p.installments.filter(i => p.disputes.some(d => d.installmentId === i.id)).map(i => i.amountMinor))
  // Existing payout balance includes undisputed recorded transfers. Keep that source balance,
  // and disclose unconfirmed transfers separately; never label it evidenced receipt.
  const awaiting = sum(p.installments.filter(i => i.status === 'awaiting-confirmation' && !p.disputes.some(d => d.installmentId === i.id)).map(i => i.amountMinor))
  const provisional = p.disputes.some(d => d.process?.stage !== 'final')
  const finalBalance = Math.max(0, totals.net - evidenced - window - awaiting)
  return { ...totals, evidenced, window, disputed, awaiting, outstanding: provisional ? Math.max(totals.outstanding, finalBalance) : finalBalance }
}

export function generateReport(sources: ReportSources, actor: ReportActor | null, id: string, filters: ReportFilters = {}, generatedAt = new Date().toISOString()): ReportResult {
  const definition = reportCatalogue.find(d => d.id === id)
  if (!actor || !actor.memberId || !['member', 'organization'].includes(actor.kind) || !definition || definition.audience !== actor.kind)
    throw Error('Report access denied.')
  const owned = actor.kind === 'organization' ? sources.organizations.find(o => o.id === actor.organizationId && o.ownerMemberId === actor.memberId && o.workspace) : undefined
  if (actor.kind === 'organization' && !owned) throw Error('Organization report access denied.')
  if (owned && filters.organizationId && filters.organizationId !== owned.id) throw Error('Cross-Organization report access denied.')
  if (actor.kind === 'member' && filters.memberId && filters.memberId !== actor.memberId) throw Error('Another Member’s report access denied.')
  if (!Number.isFinite(Date.parse(generatedAt))) throw Error('Invalid generated timestamp.')
  for (const d of [filters.from, filters.to]) if (d && (!/^\d{4}-\d{2}-\d{2}$/.test(d) || !Number.isFinite(Date.parse(d)))) throw Error('Invalid report date filter.')
  if (filters.from && filters.to && filters.from > filters.to) throw Error('From date must not follow To date.')
  const rows: ReportRow[] = [], references = new Set<string>(), notices = new Set<string>()
  const seen = new Set<string>()
  const own = (memberId: string) => actor.kind === 'organization' || actor.memberId === memberId
  const kind = id.replace(/^(member|organization)-/, '')
  for (const world of sources.worlds) for (const g of world.groups) {
    if (owned && g.organizationId !== owned.id) continue
    const org = sources.organizations.find(o => o.id === g.organizationId)
    if (!org) continue
    const finance = world.finance?.organizationId === g.organizationId ? world.finance : undefined
    for (const c of g.cycles) {
      const recoveryProjection = allocateRecovery(g, c)
      const recoveryFor = (obligationId: string) => recoveryProjection.allocations.filter(a => a.kind === 'principal' && a.obligationId === obligationId)
      const recoveredFor = (obligationId: string) => sum(recoveryFor(obligationId).map(a => a.appliedMinor))
      const terms = c.snapshot?.terms || c.terms
      const base = { organization: org.name, group: g.name, cycle: String(c.number), frequency: terms.frequency }
      const cycleRows: ReportRow[] = []
      const add = (sourceKind: string, sourceId: string, memberId: string, roundId: string, date: string, values: Record<string, Cell>, detail: Record<string, Cell> = {}) => {
        if (memberId && !own(memberId)) return
        const key = `${g.organizationId}:${g.id}:${c.id}:${sourceKind}:${sourceId}`
        if (seen.has(key)) return
        seen.add(key)
        const r: ReportRow = { id: key, organizationId: org.id, groupId: g.id, cycleId: c.id, roundId, memberId, date,
          values: { ...base, member: memberId ? name(c, memberId) : '', position: memberId ? positions(c, memberId) : '', round: c.active?.rounds.find(r => r.id === roundId)?.number || '', date, ...values },
          detail: { 'Cycle lifecycle': c.status, ...detail }, source: { kind: sourceKind, id: sourceId } }
        rows.push(r); cycleRows.push(r)
      }
      if (kind === 'contributions' || kind === 'payments') contributionRows(g, c, add, finance)
      if (['obligations', 'collections'].includes(kind)) for (const o of c.active?.obligations || []) {
        if (o.groupId !== g.id || o.cycleId !== c.id || !own(o.memberId)) continue
        const r = c.active!.rounds.find(r => r.id === o.roundId && r.groupId === g.id && r.cycleId === c.id)
        if (!r) continue
        const b = obligationState(o, r, c.active!)
        const recoveryApplied = recoveredFor(o.id), netPrincipal = minor(b.outstanding - recoveryApplied)
        if (id === 'organization-obligations' && !b.outstanding) continue
        const recovery = (g.lifecycle?.recoveries || []).filter(x => x.cycleId === c.id && x.memberId === o.memberId)
        const allocations = (g.payments?.allocations || []).filter(a => a.organizationId === g.organizationId && a.groupId === g.id && a.cycleId === c.id && a.memberId === o.memberId && a.obligationId === o.id)
        const tx = (g.payments?.transactions || []).filter(t => allocations.some(a => a.transactionId === t.id))
        const manual = (g.manualContributions || []).filter(m => m.organizationId === g.organizationId && m.cycleId === c.id && m.roundId === r.id && m.memberId === o.memberId)
        const choice = g.payments?.optionalDecisions?.find(d => d.cycleId === c.id && d.roundId === r.id && d.memberId === o.memberId)
        const optional = !b.optional ? 'Not Applicable' : b.optionalMade > 0 ? 'Contributed' : choice?.choice === 'skip' ? 'Skipped' : 'Not yet contributed (optional)'
        if (recovery.length) notices.add('Recovery is derived principal first, oldest due first, then penalties. Original amounts and due dates are preserved. Recovery totals and these net balances describe the same debt and must not be added together.')
        add('obligation', o.id, o.memberId, r.id, r.schedule.dueAt, {
          position: o.components.map(p => `${p.position} (${p.fraction === 0.5 ? '½' : 'full'})`).join(', '),
          expected: b.required, satisfied: b.satisfied, collected: b.collected, outstanding: netPrincipal, recoveryApplied, penaltyRecoveryApplied: 0, penaltyOutstanding: 0, optionalPaid: b.optionalMade, optional,
          stage: !netPrincipal ? 'No required debt' : b.timing,
          status: recoveryApplied && !netPrincipal ? 'CLEARED BY RECOVERY' : recoveryApplied ? 'PARTIALLY RECOVERED' : recovery.length && b.outstanding ? 'Default / Recovery' : b.fulfillment,
          days: netPrincipal ? Math.max(0, Math.floor((Date.parse(effectiveReferenceAt(c.active!)) - Date.parse(r.schedule.dueAt)) / 86400000)) : 0,
          references: [...tx.map(t => t.providerReference), ...manual.map(m => m.reference)].join(', '),
        }, {
          'Penalty': 'Daily penalty rows show original accrual, reductions, Recovery allocation and outstanding balance separately.',
          'Source principal outstanding before Recovery (minor)': b.outstanding,
          'Recovery allocation records': recoveryFor(o.id).map(a => `${a.caseId}: ${a.appliedMinor} kobo`).join('; ') || 'None',
          'Reference date': effectiveReferenceAt(c.active!), 'Recovery records': recovery.map(r => r.id).join(', ') || 'None',
          'Separate Recovery balances (minor units)': recovery.map(r => { const b = recoveryBalances(r); return `${r.id}: principal outstanding ${b.principalOutstanding}; penalty outstanding ${b.penaltyOutstanding}; original aggregate recovered ${r.recoveredMinor}; ${r.status}${b.exception ? ' / financial exception' : ''}` }).join('; ') || 'None',
          'Payout context': (g.lifecycle?.payoutFacts || []).some(p => p.cycleId === c.id && p.memberId === o.memberId && ['received-demo', 'received-recorded', 'completed-recorded'].includes(p.status)) || (g.payouts?.records || []).some(p => p.cycleId === c.id && p.memberId === o.memberId && outcome(p).evidenced > 0) ? 'Post-payout' : 'Receipt not established',
          'Payment dates': [...tx.map(t => t.confirmedAt), ...manual.map(m => m.paidAt)].join(', '),
          'Payment origins': [...new Set([...tx.map(() => 'Provider Confirmed'), ...manual.map(m => m.review?.decisions.some(d => d.action === 'accept-manual') ? 'Manual / Organization Confirmed / TCS Reviewed' : `Manual / Organization Confirmed / ${m.status}`)])].join(', '),
          'Allocation states': tx.map(t => `${t.id}: ${t.allocationStatus}`).join(', '),
          'Settlement indicators': tx.map(t => `${t.providerReference}: ${finance?.expectations.find(e => e.transactionId === t.id)?.status || t.settlement}`).join(', '),
        })
      }
      if (['obligations', 'collections'].includes(kind)) {
        for (const a of g.penalties?.accruals.filter(a => a.cycleId === c.id) || []) {
          const b = penaltyBalance(g,a), linked = recoveryProjection.allocations.find(p => p.kind === 'penalty' && p.sourceId === a.id)
          const defaultEvent = g.penalties?.defaults.find(d => d.cycleId === c.id && d.memberId === a.memberId)
          add('daily-penalty',a.id,a.memberId,a.roundId,a.businessAt,{
            expected:0,satisfied:0,collected:0,outstanding:0,recoveryApplied:0,penaltyAccrued:b.accrued,penaltyWaived:b.waived,penaltyRecoveryApplied:b.paid,penaltyOutstanding:b.outstanding,optionalPaid:0,optional:'Not Applicable',
            stage:defaultEvent?'POST_PAYOUT_DEFAULT (history retained)':'Daily penalty', status:b.outstanding?'Penalty outstanding':b.paid?'CLEARED BY RECOVERY':'Penalty waived',
          },{'Accrual date':a.accrualDate,'Daily rate (bps)':a.dailyRateBps,'Principal basis (minor)':a.principalBasisMinor,'Position component':a.componentId,'Recorded at (actual)':a.recordedAt,'Recovery case':linked?.caseId||'None','Default threshold':defaultEvent?.thresholdAt||'Not triggered','Waiver records':g.penalties?.waivers.filter(w=>w.accrualId===a.id).map(w=>w.id+' / '+w.actor+' / '+w.at+' / '+w.amountMinor+' kobo / '+w.reason).join('; ')||'None'})
        }
        for (const a of recoveryProjection.allocations.filter(a => a.kind === 'penalty' && !g.penalties?.accruals.some(p => p.id === a.sourceId))) {
          if (!own(a.memberId)) continue
          const obligation = c.active?.obligations.find(o => o.id === a.obligationId)
          add('recovery-penalty', a.caseId + ':' + a.sourceId, a.memberId, obligation?.roundId || '', a.aggregatePenalty ? '' : a.dueAt, {
            expected: 0, satisfied: 0, collected: 0, outstanding: 0, recoveryApplied: 0, penaltyAccrued: a.originalMinor, penaltyWaived: a.waivedMinor, penaltyRecoveryApplied: a.appliedMinor, penaltyOutstanding: a.outstandingMinor, optionalPaid: 0, optional: 'Not Applicable',
            stage: a.outstandingMinor ? 'Default / Recovery penalty' : 'Cleared penalty',
            status: !a.outstandingMinor && a.appliedMinor ? 'CLEARED BY RECOVERY' : !a.outstandingMinor ? 'Penalty waived' : a.appliedMinor ? 'PARTIALLY RECOVERED' : 'Penalty outstanding',
            days: a.aggregatePenalty ? null : a.outstandingMinor ? Math.max(0, Math.floor((Date.parse((c.active ? effectiveReferenceAt(c.active) : a.dueAt)) - Date.parse(a.dueAt)) / 86400000)) : 0,
          }, { 'Recovery case': a.caseId, 'Original penalty (minor)': a.originalMinor, 'Penalty Recovery applied (minor)': a.appliedMinor, 'Penalty waived (minor)': a.waivedMinor,
            'Due-date basis': a.aggregatePenalty ? 'Legacy case-level aggregate; original penalty due date not recorded. No Round charge or due date invented.' : 'Original penalty due date',
            'Allocation basis': 'Principal first, then oldest-due penalty. Derived from the original aggregate; not a new payment transaction.' })
        }
        for (const x of recoveryProjection.cases) if (x.issue && own(x.memberId)) notices.add(x.caseId + ': ' + x.issue + ' Unapplied Recovery: ' + x.unappliedMinor + ' kobo. Source balances retained; no cross-case allocation.')
      }
      if (kind === 'rounds') for (const r of c.active?.rounds || []) {
        if (!(c.active?.obligations.some(o => o.roundId === r.id))) continue
        const b = collection(r, c.active!), obligations = c.active!.obligations.filter(o => o.roundId === r.id), bs = obligations.map(balances)
        add('round', r.id, '', r.id, r.schedule.dueAt, { expected: b.required, collected: b.collected, outstanding: minor(b.outstanding - sum(obligations.map(o => recoveredFor(o.id)))), members: b.requiredMembers,
          positions: obligations.flatMap(o => o.components).filter(p => p.requiredMinor > 0).reduce((s, p) => s + p.fraction, 0),
          fully: b.satisfiedMembers, partial: bs.filter(b => b.satisfied > 0 && b.outstanding > 0).length, unpaid: bs.filter(b => b.required > 0 && !b.satisfied).length,
          skipped: g.payments?.optionalDecisions?.filter(d => d.cycleId === c.id && d.roundId === r.id && d.choice === 'skip').length || 0,
          optionalPaid: b.optionalMade, optionalMembers: bs.filter(b => b.optionalMade > 0).length, status: payoutReady(g, c, r) ? 'Payout ready' : 'Not payout ready',
        }, { 'Reference date': effectiveReferenceAt(c.active!), 'Penalty': 'See daily penalty rows and linked Recovery balances; amounts describe the same debt and must not be added together.', 'Source obligations': obligations.map(o => o.id).join(', ') })
      }
      if (kind === 'participation') {
        const ids = new Set([...c.participants, ...(c.snapshot?.participants || [])].map(p => p.id))
        for (const e of g.lifecycle?.exits || []) if (e.cycleId === c.id) ids.add(e.memberId)
        if (ids.has(actor.memberId)) {
          const exit = g.lifecycle?.exits.find(e => e.cycleId === c.id && e.memberId === actor.memberId)
          const recovery = g.lifecycle?.recoveries.find(r => r.cycleId === c.id && r.memberId === actor.memberId)
          add('participation', actor.memberId, actor.memberId, '', terms.startDate, { status: exit ? `${exit.kind}: ${exit.status}` : c.participants.find(p => p.id === actor.memberId)?.status || 'Historical participant', lifecycle: c.status }, {
            'Default / Recovery': recovery ? `${recovery.id}: ${recovery.status}` : 'None', 'Activated': c.activatedAt || '', 'Completed': c.completedAt || '', 'Exited': exit?.approvedAt || '',
          })
        }
      }
      if (kind === 'payouts') {
        const records = (g.payouts?.records || []).filter(p => p.groupId === g.id && p.cycleId === c.id)
        for (const p of records) {
          const b = outcome(p), calc = p.calculation || p.instructions.at(-1)
          add('payout', p.id, p.memberId, p.roundId, p.targetAt, { position: `${p.position} (${p.fraction === 0.5 ? '½' : 'full'})`, entitlement: calc?.entitlementMinor ?? null, fee: calc?.feeMinor ?? null, net: calc?.netMinor ?? null, transferred: b.paid, evidenced: b.evidenced, outstanding: calc ? b.outstanding : null,
            status: p.breach?.status === 'open' ? 'Breached' : p.status.startsWith('completed') ? 'Completed' : p.status === 'ready' || p.status === 'instruction-prepared' ? 'Due' : p.status === 'partially-paid' ? 'Partially Paid' : p.status === 'awaiting-confirmation' ? 'Awaiting Confirmation' : p.status === 'disputed' ? 'Disputed' : p.status,
          }, { 'Source status': p.status, 'Recorded transfers': p.installments.map(i => `${i.reference}: ${i.amountMinor} kobo at ${i.at}`).join('; '), 'Disputed amount (minor)': b.disputed,
            'Awaiting confirmation (minor)': b.awaiting, 'Completed by window (minor)': b.window,
            'Receipt basis': p.installments.map(i => `${i.id}: ${p.disputes.some(d => d.installmentId === i.id) ? finalRecognition(p, i.id) ? 'Final Operations evidence' : 'Disputed; outcome not final' : i.status}`).join('; '),
            'Balance basis': 'Existing payout balance after undisputed recorded transfers and final evidence; awaiting confirmation is not evidenced receipt.',
            'Breach': p.breach?.status || 'None', 'Dispute': p.disputes.map(d => `${d.id}: ${d.process?.stage || d.status}`).join(', ') || 'None',
          })
        }
        // Scheduled beneficiaries remain visible before payout execution becomes ready.
        for (const r of c.active?.rounds || []) for (const b of r.beneficiaries) {
          if (records.some(p => p.roundId === r.id && p.memberId === b.memberId) || !own(b.memberId)) continue
          let calc: ReturnType<typeof payoutAmounts> | undefined
          try { calc = payoutAmounts(g, c, r, b.memberId) } catch { /* Source policy exception is disclosed, never guessed. */ }
          add('scheduled-payout', `${r.id}:${b.memberId}`, b.memberId, r.id, r.schedule.payoutTargetAt, { position: `${r.position} (${b.fraction === 0.5 ? '½' : 'full'})`, entitlement: b.entitlementMinor, fee: calc?.feeMinor ?? null, net: calc?.netMinor ?? null, transferred: 0, evidenced: 0, outstanding: calc?.netMinor ?? null, status: calc ? 'Scheduled' : 'Calculation exception' }, { 'Basis': 'Schedule projection; net may change with optional contribution. No payout execution or receipt is inferred.' })
        }
      }
      if (kind === 'recovery') for (const r of g.lifecycle?.recoveries || []) if (r.cycleId === c.id) {
        const b = recoveryBalances(r), projected = recoveryProjection.cases.find(x => x.caseId === r.id)
        add('recovery', r.id, r.memberId, '', r.openedAt, { principal: r.principalMinor, penalty: r.penaltyMinor, recovered: r.recoveredMinor, principalOutstanding: b.principalOutstanding, penaltyOutstanding: b.penaltyOutstanding, waived: b.penaltyWaived, outstanding: b.outstanding, restriction: r.restricted ? 'Restricted' : 'Removed / inactive', status: b.exception || projected?.issue ? 'Financial exception' : r.status }, {
          'Derived allocation state': projected?.issue || 'Principal oldest due first, then penalty oldest due first', 'Round allocation details': recoveryProjection.allocations.filter(a => a.caseId === r.id).map(a => `${a.sourceId}: ${a.kind} ${a.appliedMinor} kobo`).join('; ') || 'None', 'Unapplied Recovery (minor)': projected?.unappliedMinor || 0, 'Principal recovered (minor)': b.principalRecovered, 'Penalty recovered (minor)': b.penaltyRecovered, 'Excess recovery (minor)': b.excessMinor, 'Organization review': r.reviewStatus, 'Resolved at': r.resolvedAt || '', 'Historical default': 'Retained', 'Recorded at (actual)': r.recordedAt || 'Legacy record', 'Post-Payout Default threshold': g.penalties?.defaults.find(d=>d.recoveryId===r.id)?.thresholdAt || 'Legacy record', 'Allocation': 'Principal first, then penalty. Original aggregate total retained.',
        })
      }
      if (kind === 'exits') for (const e of g.lifecycle?.exits || []) if (e.cycleId === c.id) {
        const settled = e.settlement.status === 'resolved' ? e.settlement.dueMinor : sum((e.settlementConfirmations || []).map(x => x.amountMinor))
        const replacement = g.lifecycle?.replacements.find(r => r.exitId === e.id)
        add('exit', e.id, e.memberId, '', e.settlement.dueAt || e.requestedAt, { contributions: e.recognizedContributionsMinor, due: e.settlement.dueMinor, settled, outstanding: Math.max(0, e.settlement.dueMinor - settled), replacement: replacement ? `${replacement.status}: ${replacement.regularizationSatisfiedMinor}/${replacement.regularizationRequiredMinor} kobo` : 'No replacement', status: e.settlement.escalatedAt && e.settlement.status !== 'resolved' ? 'Breached' : `${e.status} / ${e.settlement.status}` }, {
          'Responsibility': 'Organization — separate from Member default', 'Timing': e.settlement.timing, 'Settlement basis': e.settlementConfirmations?.length ? 'Source settlement confirmations' : e.settlement.status === 'resolved' ? 'Source resolved status; no individual receipt record' : 'Not settled', 'Replacement record': replacement?.id || '',
        })
      }
      if (kind === 'fees') for (const p of g.payouts?.records || []) if (p.groupId === g.id && p.cycleId === c.id) for (const i of p.installments) {
        const final = finalRecognition(p, i.id), disputed = p.disputes.some(d => d.installmentId === i.id)
        const adjustment = latestAdjustment(finance, i.id)
        add('payout-installment', i.id, p.memberId, p.roundId, i.recordedAt, { position: `${p.position} (${p.fraction})`, reference: i.id, recordedFee: i.feeRecognizedMinor, recognized: final ? final.organizationFeeMinor : disputed ? null : i.feeRecognizedMinor, adjustment: adjustment?.organizationFeeDifferenceMinor || 0, status: adjustment ? 'FEE / REVENUE SHARE ADJUSTMENT REQUIRED' : final ? 'Final Operations evidence' : disputed ? 'Disputed — recognition under review' : i.status }, {
          'Fee method': terms.feeType, 'Agreed rate / flat value': terms.feeValue, 'Entitlement basis (minor)': p.calculation?.entitlementMinor ?? p.instructions.at(-1)?.entitlementMinor ?? null, 'Scheduled payout value (minor)': p.calculation?.scheduledValueMinor ?? null, 'Final evidenced receipt (minor)': final?.receivedMinor ?? null, 'Payout record': p.id, 'Transfer reference': i.reference,
          'Policy': 'Mandatory agreed Cycle fee; no individual waiver. Original recognition remains preserved.',
        })
      }
      if (kind === 'revenue') for (const r of finance?.receivables || []) if (r.organizationId === g.organizationId && r.groupId === g.id && r.cycleId === c.id) {
        const confirmed = sum(r.payments.filter(p => p.status === 'confirmed').map(p => p.amountMinor)), adjustment = latestAdjustment(finance, r.installmentId)
        add('revenue-share', r.id, '', '', r.dueAt, { recognized: r.organizationFeeMinor, due: r.amountMinor, transferred: sum(r.payments.map(p => p.amountMinor)), confirmed, outstanding: Math.max(0, r.amountMinor - confirmed), adjustment: adjustment?.tcsShareDifferenceMinor || 0, reference: r.paymentReference, status: r.paymentStatus + ' / ' + r.status }, {
          'Recognition date': r.recognizedAt, 'Installment': r.installmentId, 'Share percent': r.sharePercent,
          'Financial review': adjustment ? 'FEE / REVENUE SHARE ADJUSTMENT REQUIRED; original posting preserved. No refund or credit executed.' : 'None',
          'Final evidenced share (minor)': adjustment?.evidencedTcsShareMinor ?? null,
          'Transfers': r.payments.map(p => `${p.bankReference}: ${p.amountMinor} kobo / ${p.status} / ${p.transferredAt}`).join('; '),
        })
      }
      if (kind === 'cycles') {
        const bs = (c.active?.obligations || []).map(balances), payouts = (g.payouts?.records || []).filter(p => p.cycleId === c.id).map(outcome)
        add('cycle', c.id, '', '', terms.startDate, { members: new Set((c.snapshot?.participants || c.participants).filter(p => p.status === 'approved').map(p => p.id)).size,
          positions: (c.snapshot?.positions || c.positions).flatMap(p => p.holders).reduce((n, h) => n + h.fraction, 0), spv: c.active?.rounds[0]?.scheduledPayoutValueMinor ?? null,
          expected: sum(bs.map(b => b.required)), collected: sum(bs.map(b => b.collected)), outstanding: minor(sum(bs.map(b => b.outstanding)) - sum(recoveryProjection.allocations.filter(a => a.kind === 'principal').map(a => a.appliedMinor))), payoutOutstanding: sum(payouts.map(p => p.outstanding)), payoutTransferred: sum(payouts.map(p => p.paid)), recoveries: g.lifecycle?.recoveries.filter(r => r.cycleId === c.id).length || 0, status: c.status,
        }, { 'Current Round': c.active ? currentRound(c.active)?.number || '' : '', 'Recorded payout (minor)': sum(payouts.map(p => p.paid)), 'Unresolved financial cases': finance?.cases.filter(x => x.groupId === g.id && x.cycleId === c.id && x.status !== 'resolved').length || 0,
          'Force Close history': (g.lifecycle?.forceCloseRequests || []).filter(f => f.cycleId === c.id).map(f => `${f.id}: ${f.status}; proposed absorption ${f.requestedAbsorptionMinor} kobo (not inferred as applied)`).join('; ') || 'None',
          'Collection basis': 'Generated obligations net of derived Recovery; recorded collections are unchanged. Recovery balances are not additive.',
        })
      }
      if (cycleRows.length) {
        if (c.active?.referenceAt) references.add(c.active.referenceAt)
        if (g.payouts?.referenceAt) references.add(g.payouts.referenceAt)
        if (finance?.referenceAt && actor.kind === 'organization') references.add(finance.referenceAt)
      }
    }
  }
  const options: ReportResult['options'] = {}
  const labels: Record<string, string> = { organizationId: 'organization', groupId: 'group', cycleId: 'cycle', roundId: 'round', memberId: 'member', frequency: 'frequency', status: 'status', position: 'position' }
  const dimension = (r: ReportRow, k: string): string => k in r ? String(r[k as keyof ReportRow]) : String(r.values[k] ?? '')
  for (const key of definition.filters) options[key] = [...new Map(rows.map(r => [dimension(r, key), String(r.values[labels[key]] ?? dimension(r, key))])).entries()].filter(([v]) => !!v).map(([value, label]) => ({ value, label }))
  if(filters.metric && !definition.columns.some(c=>c.key===filters.metric&&c.total))throw Error('Unknown report metric.')
  const filtered = rows.filter(r => (!filters.metric || Number(r.values[filters.metric]||0)!==0) && definition.filters.every(k => !filters[k as keyof ReportFilters] || dimension(r, k) === filters[k as keyof ReportFilters]) &&
    (!filters.from || atDate(r.date) >= filters.from) && (!filters.to || !!r.date && atDate(r.date) <= filters.to) &&
    (!filters.search || [...Object.values(r.values), ...Object.values(r.detail), r.source.id].join(' ').toLowerCase().includes(filters.search.toLowerCase())))
  filtered.sort((a, b) => filters.sort === 'outstanding' ? Number(b.values.outstanding || 0) - Number(a.values.outstanding || 0) || a.id.localeCompare(b.id) : filters.sort === 'member' ? String(a.values.member).localeCompare(String(b.values.member)) || a.id.localeCompare(b.id) : filters.sort === 'position' ? parseInt(String(a.values.position) || '0') - parseInt(String(b.values.position) || '0') || a.id.localeCompare(b.id) : (filters.sort === 'oldest' ? 1 : -1) * a.date.localeCompare(b.date) || a.id.localeCompare(b.id))
  const summaries = definition.columns.filter(c => c.total).map(c => ({ key: c.key, label: c.label, type: c.type, value: c.type === 'money' ? signedSum(filtered.map(r => Number(r.values[c.key] || 0))) : filtered.reduce((n, r) => n + Number(r.values[c.key] || 0), 0) }))
  if (filtered.some(r => definition.columns.some(c => c.type === 'money' && r.values[c.key] === null))) notices.add('Some financial values are unavailable or under review. Totals include known amounts only; inspect row details.')
  if (kind === 'collections') notices.add('Unallocated, advance-reserved and exception money does not satisfy obligations. Inspect the payment register below for those source payments.')
  return { definition, rows: filtered, summaries, filters: { ...filters }, options, generatedAt, references: [...references].sort(), notices: [...notices], empty: 'No source records match this report. Load a shared scenario in the existing workspace or adjust the filters.', export: { version: 1, currency: 'NGN', moneyUnit: 'minor', reportId: id, columns: definition.columns.map(c => ({ ...c })), filters: { ...filters } } }
}
function latestAdjustment(finance: ReconciliationState | undefined, installmentId: string) {
  return finance?.cases.filter(c => c.adjustment?.installmentId === installmentId).at(-1)?.adjustment
}
type AddRow = (kind: string, id: string, memberId: string, roundId: string, date: string, values: Record<string, Cell>, detail?: Record<string, Cell>) => void
function contributionRows(g: ThriftGroup, c: Cycle, add: AddRow, finance?: ReconciliationState) {
  for (const a of g.payments?.attempts || []) if (a.organizationId === g.organizationId && a.groupId === g.id && a.cycleId === c.id && !a.transactionId) add('payment-attempt', a.id, a.memberId, a.roundId, a.createdAt, {
    received: 0, allocated: 0, unallocated: 0, source: a.intent === 'advance' ? 'Advance attempt — unconfirmed' : 'Provider attempt — unconfirmed', reference: a.id, status: a.status, settlement: 'Not applicable',
  }, { 'Requested payment (minor)': a.expectedMinor, 'Receipt': 'No confirmed money received. Attempt amount is not included in payment totals.' })
  for (const t of g.payments?.transactions || []) if (t.organizationId === g.organizationId && t.groupId === g.id && t.cycleId === c.id) {
    const attempt = g.payments?.attempts.find(a => a.transactionId === t.id)
    const obligation = c.active?.obligations.find(o => o.memberId === t.memberId && o.roundId === t.roundId)
    add('payment', t.id, t.memberId, t.roundId, t.confirmedAt, { received: t.amountMinor, allocated: t.allocatedMinor, unallocated: t.unallocatedMinor,
      source: attempt?.intent === 'advance' ? t.holdReason ? 'Advance reservation' : t.allocatedMinor ? 'Advance / allocated after opening' : 'Confirmed advance / exception' : 'Provider Confirmed', reference: t.providerReference, status: t.allocationStatus === 'exception' ? 'Payment Exception' : t.holdReason || t.allocationStatus, settlement: finance?.expectations.find(e => e.transactionId === t.id)?.status || t.settlement,
    }, { 'Required obligation (minor)': obligation ? balances(obligation).required : null, 'Provider': t.provider, 'Settlement': finance?.expectations.find(e => e.transactionId === t.id)?.status || t.settlement, 'Exception type': (g.payments?.exceptions || []).filter(e => e.transactionId === t.id).map(e => e.kind).join(', ') || 'None', 'Allocation records': g.payments?.allocations.filter(a => a.transactionId === t.id).map(a => `${a.id}: ${a.amountMinor} kobo → ${a.obligationId}`).join('; ') || 'None' })
  }
  for (const m of g.manualContributions || []) if (m.organizationId === g.organizationId && m.groupId === g.id && m.cycleId === c.id) add('manual-payment', m.id, m.memberId, m.roundId, m.paidAt, {
    received: m.amountMinor, allocated: m.allocatedMinor, unallocated: minor(m.amountMinor - m.allocatedMinor), source: m.review?.decisions.some(d => d.action === 'accept-manual') ? 'Manual / Organization Confirmed / TCS Reviewed' : 'Manual / Organization Confirmed', reference: m.reference, status: m.status, settlement: 'Direct Organization receipt',
  }, { 'Recorded at': m.recordedAt, 'Channel': m.channel, 'Recognition': m.status === 'allocated' ? 'Allocated contribution' : 'Does not satisfy an obligation' })
}
