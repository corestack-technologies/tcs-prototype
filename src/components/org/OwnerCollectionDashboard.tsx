import { useState } from 'react'
import { Badge } from '../ui'
import { OwnerShell } from './OwnerShell'
import { COLLECTION_PERIODS, type CollectionPeriod, type CollectionMember, type ContribStatus } from './data'
import type { View, NavMeta } from '../../App'

interface Props { navigate: (v: View, meta?: NavMeta) => void }

type MemberFilter = 'all' | 'paid' | 'partial' | 'outstanding' | 'overdue' | 'settled-by-policy'

const FILTER_LABELS: Record<MemberFilter, string> = {
  all: 'All', paid: 'Paid', partial: 'Partial', outstanding: 'Outstanding', overdue: 'Overdue', 'settled-by-policy': 'Settled by Policy',
}

function statusBadge(s: ContribStatus) {
  switch (s) {
    case 'paid':               return <Badge variant="verified">Paid</Badge>
    case 'partial':            return <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#FFFBEB] text-[#92400E]">Partially Paid</span>
    case 'outstanding':        return <Badge variant="pending">Outstanding</Badge>
    case 'overdue':            return <Badge variant="rejected">Overdue</Badge>
    case 'settled-by-policy':  return <Badge variant="verified">Settled</Badge>
  }
}

function ProgressRing({ pct }: { pct: number }) {
  const r = 28
  const circ = 2 * Math.PI * r
  const dash = (pct / 100) * circ
  const color = pct === 100 ? '#059669' : pct >= 80 ? '#1746A2' : pct >= 50 ? '#D97706' : '#DC2626'
  return (
    <svg className="w-16 h-16 -rotate-90" viewBox="0 0 64 64">
      <circle cx="32" cy="32" r={r} fill="none" stroke="#F1F3F8" strokeWidth="6" />
      <circle cx="32" cy="32" r={r} fill="none" stroke={color} strokeWidth="6"
        strokeDasharray={`${dash} ${circ - dash}`} strokeLinecap="round"
        style={{ transition: 'stroke-dasharray 0.6s ease' }}
      />
    </svg>
  )
}

function PeriodSelector({ periods, selected, onSelect }: { periods: CollectionPeriod[]; selected: CollectionPeriod; onSelect: (p: CollectionPeriod) => void }) {
  return (
    <div className="flex gap-3 flex-wrap mb-6">
      {periods.map(p => (
        <button
          key={p.id}
          onClick={() => onSelect(p)}
          className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl border text-sm font-semibold transition-all ${selected.id === p.id ? 'border-[#1746A2] bg-[#EEF2FF] text-[#1746A2]' : 'border-[#E2E6F0] bg-white text-[#374151] hover:border-[#1746A2] hover:bg-[#F8FAFF]'}`}
        >
          <span>{p.emoji}</span>
          <span>{p.groupName.split(' ').slice(0, 2).join(' ')}</span>
          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-[#F1F3F8] text-[#6B7280]">Rd {p.roundNumber}</span>
        </button>
      ))}
    </div>
  )
}

function MemberRow({ m }: { m: CollectionMember }) {
  const [expanded, setExpanded] = useState(false)
  const outstanding = m.obligation - m.amountPaid
  const paidPct = m.obligation > 0 ? Math.round((m.amountPaid / m.obligation) * 100) : 0

  return (
    <div className={`border-b border-[#F1F3F8] last:border-0 ${expanded ? 'bg-[#F8FAFF]' : ''}`}>
      <div
        className="flex items-center gap-4 px-5 py-3.5 cursor-pointer hover:bg-[#F8FAFF] transition-colors"
        onClick={() => setExpanded(e => !e)}
      >
        <div className="w-8 h-8 rounded-full bg-[#EEF2FF] flex items-center justify-center text-xs font-bold text-[#1746A2] shrink-0">
          {m.initials}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-[#0D1117]">{m.name}</p>
          {m.status === 'partial' && (
            <div className="mt-1 h-1 w-32 bg-[#F1F3F8] rounded-full overflow-hidden">
              <div className="h-full bg-[#D97706] rounded-full" style={{ width: `${paidPct}%` }} />
            </div>
          )}
        </div>
        <div className="text-right shrink-0 mr-2">
          <p className="text-sm font-semibold text-[#0D1117]">₦{m.amountPaid.toLocaleString()}</p>
          <p className="text-xs text-[#9CA3AF]">of ₦{m.obligation.toLocaleString()}</p>
        </div>
        {statusBadge(m.status)}
        <svg className={`w-4 h-4 text-[#9CA3AF] transition-transform shrink-0 ${expanded ? 'rotate-180' : ''}`} viewBox="0 0 16 16" fill="currentColor">
          <path d="M3.22 6.22a.75.75 0 011.06 0L8 9.94l3.72-3.72a.75.75 0 111.06 1.06l-4.25 4.25a.75.75 0 01-1.06 0L3.22 7.28a.75.75 0 010-1.06z" />
        </svg>
      </div>

      {expanded && (
        <div className="px-5 pb-4 border-t border-[#F1F3F8]">
          <div className="mt-3 grid grid-cols-2 gap-3 text-xs">
            {[
              { label: 'Obligation', value: `₦${m.obligation.toLocaleString()}` },
              { label: 'Paid', value: `₦${m.amountPaid.toLocaleString()}` },
              { label: 'Outstanding', value: `₦${outstanding.toLocaleString()}` },
              ...(m.defaultCharge ? [{ label: 'Default charge', value: `₦${m.defaultCharge.toLocaleString()}` }] : []),
              ...(m.confirmedAt ? [{ label: 'Last confirmed', value: m.confirmedAt }] : []),
              ...(m.providerRef ? [{ label: 'Provider reference', value: m.providerRef }] : []),
              ...(m.note ? [{ label: 'Note', value: m.note }] : []),
            ].map((row, i) => (
              <div key={i} className="col-span-1">
                <p className="text-[#9CA3AF] mb-0.5">{row.label}</p>
                <p className="font-semibold text-[#0D1117] font-mono text-xs break-all">{row.value}</p>
              </div>
            ))}
          </div>
          {(m.status === 'outstanding' || m.status === 'partial') && (
            <button className="mt-3 text-xs font-bold text-[#1746A2] hover:underline">
              Send reminder →
            </button>
          )}
        </div>
      )}
    </div>
  )
}

function CollectionComplete({ period, navigate }: { period: CollectionPeriod; navigate: (v: View, meta?: NavMeta) => void }) {
  return (
    <div className="bg-[#ECFDF5] border-2 border-[#A7F3D0] rounded-2xl p-8 text-center mb-6">
      <div className="flex justify-center mb-4">
        <div className="w-16 h-16 rounded-2xl bg-[#D1FAE5] flex items-center justify-center">
          <svg className="w-8 h-8 text-[#059669]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      </div>
      <h2 className="display-font text-xl font-bold text-[#065F46] mb-2">Collection Complete</h2>
      <p className="text-sm text-[#059669] mb-6">
        All required contributions have been received or settled by group policy.<br />
        {period.completionDate && `Completed on ${period.completionDate}.`}
      </p>
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: 'Expected', value: `₦${period.expectedPrincipal.toLocaleString()}` },
          { label: 'Confirmed', value: `₦${period.confirmedPrincipal.toLocaleString()}` },
          { label: 'Outstanding', value: `₦${period.outstandingPrincipal.toLocaleString()}` },
        ].map(s => (
          <div key={s.label} className="bg-white/70 rounded-xl p-3">
            <p className="text-xs text-[#6B7280] mb-1">{s.label}</p>
            <p className="text-base font-bold text-[#065F46]">{s.value}</p>
          </div>
        ))}
      </div>
      <button
        onClick={() => navigate('owner-payouts')}
        className="inline-flex items-center gap-2 px-6 py-3 bg-[#059669] text-white text-sm font-bold rounded-xl hover:bg-[#047857] transition-colors"
      >
        Prepare Payout →
      </button>
      <p className="text-xs text-[#6B7280] mt-3">Payout preparation is the next step. The payout journey begins in Epic 7.</p>
    </div>
  )
}

export function OwnerCollectionDashboard({ navigate }: Props) {
  const [selectedPeriod, setSelectedPeriod] = useState<CollectionPeriod>(COLLECTION_PERIODS[0])
  const [memberFilter, setMemberFilter] = useState<MemberFilter>('all')

  const p = selectedPeriod
  const isComplete = p.status === 'complete'

  const counts: Record<MemberFilter, number> = {
    all: p.members.length,
    paid: p.members.filter(m => m.status === 'paid').length,
    partial: p.members.filter(m => m.status === 'partial').length,
    outstanding: p.members.filter(m => m.status === 'outstanding').length,
    overdue: p.members.filter(m => m.status === 'overdue').length,
    'settled-by-policy': p.members.filter(m => m.status === 'settled-by-policy').length,
  }

  const filteredMembers = p.members.filter(m => memberFilter === 'all' || m.status === memberFilter)
  const needsAttention = p.members.filter(m => m.status === 'outstanding' || m.status === 'overdue' || m.status === 'partial')

  const periodStatusColor = {
    open: 'text-[#1746A2] bg-[#EEF2FF]',
    'grace-period': 'text-[#92400E] bg-[#FEF3C7]',
    complete: 'text-[#065F46] bg-[#ECFDF5]',
    overdue: 'text-[#991B1B] bg-[#FEF2F2]',
  }[p.status]

  const periodStatusLabel = {
    open: 'Open', 'grace-period': 'Grace Period', complete: 'Complete', overdue: 'Overdue',
  }[p.status]

  return (
    <OwnerShell navigate={navigate} activeView="owner-collection">
      <div className="bg-white border-b border-[#E2E6F0] px-6 lg:px-8 py-5 shrink-0">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="display-font text-xl font-bold text-[#0D1117]">Collection Operations</h1>
            <p className="text-sm text-[#6B7280] mt-0.5">{COLLECTION_PERIODS.length} active collection period{COLLECTION_PERIODS.length > 1 ? 's' : ''}</p>
          </div>
          <button
            onClick={() => navigate('owner-collection-history')}
            className="text-sm font-semibold text-[#1746A2] hover:underline"
          >
            Collection history →
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-6 lg:px-8 py-6">
        <div className="max-w-4xl">

          <PeriodSelector periods={COLLECTION_PERIODS} selected={selectedPeriod} onSelect={setSelectedPeriod} />

          {/* Complete state */}
          {isComplete && <CollectionComplete period={p} navigate={navigate} />}

          {/* Period header */}
          <div className="bg-white rounded-xl border border-[#E2E6F0] p-5 mb-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{p.emoji}</span>
                <div>
                  <p className="text-base font-bold text-[#0D1117]">{p.groupName}</p>
                  <p className="text-xs text-[#6B7280]">Round {p.roundNumber} of {p.totalRounds}</p>
                </div>
              </div>
              <span className={`text-xs font-bold px-3 py-1 rounded-full ${periodStatusColor}`}>{periodStatusLabel}</span>
            </div>

            {/* Dates */}
            <div className="grid grid-cols-3 gap-3 mb-5">
              {[
                { label: 'Opens', value: p.openDate },
                { label: 'Normal deadline', value: p.normalDeadline },
                { label: 'Grace period ends', value: p.gracePeriodEnd },
              ].map(d => (
                <div key={d.label} className="bg-[#F8FAFF] rounded-xl p-3 text-center">
                  <p className="text-[10px] text-[#9CA3AF] uppercase tracking-wide mb-1">{d.label}</p>
                  <p className="text-sm font-bold text-[#0D1117]">{d.value}</p>
                </div>
              ))}
            </div>

            {/* Principal stats */}
            <div className="flex items-center gap-5">
              <div className="relative flex-shrink-0">
                <ProgressRing pct={p.completionPct} />
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="display-font text-sm font-bold text-[#0D1117]">{p.completionPct}%</span>
                </div>
              </div>
              <div className="flex-1 grid grid-cols-3 gap-3">
                {[
                  { label: 'Expected', value: p.expectedPrincipal, color: 'text-[#0D1117]' },
                  { label: 'Confirmed', value: p.confirmedPrincipal, color: 'text-[#059669]' },
                  { label: 'Outstanding', value: p.outstandingPrincipal, color: p.outstandingPrincipal > 0 ? 'text-[#DC2626]' : 'text-[#059669]' },
                ].map(s => (
                  <div key={s.label}>
                    <p className="text-xs text-[#9CA3AF] mb-0.5">{s.label}</p>
                    <p className={`display-font text-lg font-bold ${s.color}`}>₦{(s.value / 1000).toFixed(0)}k</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Progress bar */}
            <div className="mt-4 h-2 bg-[#F1F3F8] rounded-full overflow-hidden">
              <div className="h-full bg-[#1746A2] rounded-full transition-all" style={{ width: `${p.completionPct}%` }} />
            </div>

            {/* Member breakdown pills */}
            <div className="mt-4 flex flex-wrap gap-2">
              {[
                { label: 'Paid', count: counts.paid, color: 'bg-[#ECFDF5] text-[#059669]' },
                { label: 'Partial', count: counts.partial, color: 'bg-[#FFFBEB] text-[#92400E]' },
                { label: 'Outstanding', count: counts.outstanding, color: 'bg-[#F1F3F8] text-[#6B7280]' },
                { label: 'Overdue', count: counts.overdue, color: 'bg-[#FEF2F2] text-[#DC2626]' },
                { label: 'Settled by policy', count: counts['settled-by-policy'], color: 'bg-[#F0FDF4] text-[#16A34A]' },
              ].filter(x => x.count > 0).map(x => (
                <span key={x.label} className={`text-xs font-bold px-3 py-1 rounded-full ${x.color}`}>
                  {x.count} {x.label}
                </span>
              ))}
            </div>
          </div>

          {/* Members requiring attention */}
          {needsAttention.length > 0 && !isComplete && (
            <div className="bg-white rounded-xl border border-[#E2E6F0] overflow-hidden mb-5">
              <div className="px-5 py-3.5 border-b border-[#F1F3F8] bg-[#FEF2F2]/50">
                <p className="text-sm font-bold text-[#991B1B]">Members requiring attention ({needsAttention.length})</p>
              </div>
              {needsAttention.map(m => <MemberRow key={m.id} m={m} />)}
            </div>
          )}

          {/* All members with filter */}
          <div className="bg-white rounded-xl border border-[#E2E6F0] overflow-hidden mb-5">
            <div className="px-5 py-3.5 border-b border-[#F1F3F8] flex items-center justify-between gap-3">
              <p className="text-sm font-bold text-[#0D1117]">All participants</p>
              <div className="flex gap-1 p-1 bg-[#F4F6FA] rounded-lg overflow-x-auto">
                {(Object.keys(FILTER_LABELS) as MemberFilter[]).map(f => {
                  if (f !== 'all' && counts[f] === 0) return null
                  return (
                    <button key={f} onClick={() => setMemberFilter(f)} className={`px-2.5 py-1 text-xs font-semibold rounded-md whitespace-nowrap transition-colors ${memberFilter === f ? 'bg-white text-[#0D1117] shadow-sm' : 'text-[#6B7280] hover:text-[#0D1117]'}`}>
                      {FILTER_LABELS[f]} {f !== 'all' && `(${counts[f]})`}
                    </button>
                  )
                })}
              </div>
            </div>
            {filteredMembers.map(m => <MemberRow key={m.id} m={m} />)}
          </div>

          {/* Recent confirmed payments */}
          {p.recentPayments.length > 0 && (
            <div className="bg-white rounded-xl border border-[#E2E6F0] overflow-hidden">
              <div className="px-5 py-3.5 border-b border-[#F1F3F8]">
                <p className="text-sm font-bold text-[#0D1117]">Recent confirmed payments</p>
              </div>
              {p.recentPayments.map((pay, i) => (
                <div key={i} className={`flex items-center gap-4 px-5 py-3.5 ${i < p.recentPayments.length - 1 ? 'border-b border-[#F1F3F8]' : ''}`}>
                  <div className="w-8 h-8 rounded-full bg-[#ECFDF5] flex items-center justify-center text-xs font-bold text-[#059669] shrink-0">
                    {pay.memberInitials}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-[#0D1117]">{pay.memberName}</p>
                    <p className="text-xs text-[#9CA3AF] font-mono">{pay.providerRef}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-bold text-[#059669]">₦{pay.amount.toLocaleString()}</p>
                    <p className="text-xs text-[#9CA3AF]">{pay.confirmedAt}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </OwnerShell>
  )
}
