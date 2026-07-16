import { useState } from 'react'
import { Badge } from '../ui'
import { AppShell } from './AppShell'
import { getGroup } from './data'
import type { RoundStatus } from './data'
import type { View, NavMeta } from '../../App'

interface Props { navigate: (v: View, meta?: NavMeta) => void; groupId?: string }

type FilterTab = 'all' | 'open' | 'partial' | 'paid' | 'grace-period' | 'overdue' | 'upcoming'
type ViewMode = 'list' | 'calendar'

const MONTH_NAMES = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

function statusBadge(status: RoundStatus) {
  switch (status) {
    case 'paid':               return <Badge variant="verified">Paid</Badge>
    case 'open':               return <Badge variant="pending">Open</Badge>
    case 'partial':            return <Badge variant="pending">Partially Paid</Badge>
    case 'grace-period':       return <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#FFEDD5] text-[#9A3412]">Grace Period</span>
    case 'overdue':            return <Badge variant="rejected">Overdue</Badge>
    case 'settled-by-policy':  return <Badge variant="verified">Settled</Badge>
    default:                   return <Badge variant="pending">Upcoming</Badge>
  }
}

function statusDotClass(status: RoundStatus) {
  switch (status) {
    case 'paid':               return 'bg-[#ECFDF5] text-[#059669]'
    case 'open':               return 'bg-[#1746A2] text-white ring-4 ring-[#C7D2FE]'
    case 'partial':            return 'bg-[#FEF3C7] text-[#D97706] ring-4 ring-[#FDE68A]'
    case 'grace-period':       return 'bg-[#FFEDD5] text-[#EA580C] ring-4 ring-[#FDBA74]'
    case 'overdue':            return 'bg-[#FEF2F2] text-[#DC2626]'
    case 'settled-by-policy':  return 'bg-[#F0FDF4] text-[#16A34A]'
    default:                   return 'bg-[#F1F3F8] text-[#9CA3AF]'
  }
}

function statusDotContent(status: RoundStatus, n: number) {
  if (status === 'paid' || status === 'settled-by-policy') return '✓'
  if (status === 'overdue') return '!'
  return n
}

function CalendarView({ rounds, groupId, navigate }: { rounds: ReturnType<typeof getGroup>['rounds']; groupId: string; navigate: (v: View, meta?: NavMeta) => void }) {
  const [focusMonth, setFocusMonth] = useState(7)
  const monthRounds = rounds.filter(r => new Date(r.dueDateISO).getMonth() === focusMonth)
  const year = rounds[0] ? new Date(rounds[0].dueDateISO).getFullYear() : 2025
  const roundMonths = [...new Set(rounds.map(r => new Date(r.dueDateISO).getMonth()))]

  return (
    <div className="bg-white rounded-xl border border-[#E2E6F0] p-5">
      <div className="flex items-center justify-between mb-5">
        <button onClick={() => setFocusMonth(m => Math.max(m - 1, roundMonths[0]))} disabled={focusMonth <= (roundMonths[0] ?? 0)} className="p-2 rounded-lg hover:bg-[#F1F3F8] disabled:opacity-30">
          <svg className="w-4 h-4 text-[#6B7280]" viewBox="0 0 16 16" fill="currentColor"><path d="M9.78 3.22a.75.75 0 010 1.06L6.06 8l3.72 3.72a.75.75 0 11-1.06 1.06L4.47 8.53a.75.75 0 010-1.06l4.25-4.25a.75.75 0 011.06 0z" /></svg>
        </button>
        <h3 className="display-font text-base font-bold text-[#0D1117]">{MONTH_NAMES[focusMonth]} {year}</h3>
        <button onClick={() => setFocusMonth(m => Math.min(m + 1, roundMonths[roundMonths.length - 1]))} disabled={focusMonth >= (roundMonths[roundMonths.length - 1] ?? 11)} className="p-2 rounded-lg hover:bg-[#F1F3F8] disabled:opacity-30">
          <svg className="w-4 h-4 text-[#6B7280]" viewBox="0 0 16 16" fill="currentColor"><path d="M6.22 3.22a.75.75 0 011.06 0l4.25 4.25a.75.75 0 010 1.06L7.28 12.78a.75.75 0 01-1.06-1.06L9.94 8 6.22 4.28a.75.75 0 010-1.06z" /></svg>
        </button>
      </div>
      <div className="flex gap-1.5 flex-wrap mb-5">
        {roundMonths.map(m => (
          <button key={m} onClick={() => setFocusMonth(m)} className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors ${focusMonth === m ? 'bg-[#1746A2] text-white' : 'bg-[#F1F3F8] text-[#6B7280] hover:bg-[#E2E6F0]'}`}>
            {MONTH_NAMES[m]}
          </button>
        ))}
      </div>
      {monthRounds.length === 0 ? (
        <div className="text-center py-8 text-[#9CA3AF] text-sm">No contributions in {MONTH_NAMES[focusMonth]}</div>
      ) : (
        <div className="flex flex-col gap-3">
          {monthRounds.map(round => (
            <button key={round.id} onClick={() => navigate('contribution-detail', { groupId, roundId: round.id })} className="w-full text-left flex items-center gap-4 p-4 rounded-xl border border-[#E2E6F0] hover:border-[#C7D2FE] hover:bg-[#F8FAFF] transition-all">
              <div className={`w-12 h-12 rounded-xl flex flex-col items-center justify-center shrink-0 ${statusDotClass(round.status)}`}>
                <span className="display-font text-lg font-bold leading-none">{new Date(round.dueDateISO).getDate()}</span>
                <span className="text-[9px] font-medium">{MONTH_NAMES[focusMonth].toUpperCase()}</span>
              </div>
              <div className="flex-1">
                <p className="text-sm font-bold text-[#0D1117]">
                  Round {round.roundNumber} — ₦{round.amount.toLocaleString()}
                  {round.isMyPayout && <span className="ml-2 text-[10px] font-bold text-[#059669] bg-[#ECFDF5] px-1.5 py-0.5 rounded-full">Your payout</span>}
                </p>
                <p className="text-xs text-[#6B7280] mt-0.5">Payout to {round.payoutRecipient}</p>
                {round.status === 'partial' && round.amountPaid > 0 && (
                  <p className="text-xs text-[#D97706] mt-0.5">₦{round.amountPaid.toLocaleString()} of ₦{round.amount.toLocaleString()} paid</p>
                )}
              </div>
              {statusBadge(round.status)}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

const FILTER_LABELS: Record<FilterTab, string> = {
  all: 'All', open: 'Open', partial: 'Partial', paid: 'Paid',
  'grace-period': 'Grace', overdue: 'Overdue', upcoming: 'Upcoming',
}

export function ContributionSchedule({ navigate, groupId }: Props) {
  const g = getGroup(groupId)
  const [viewMode, setViewMode] = useState<ViewMode>('list')
  const [filter, setFilter] = useState<FilterTab>('all')

  const filtered = g.rounds.filter(r => {
    if (filter === 'all') return true
    if (filter === 'upcoming') return r.status === 'upcoming'
    return r.status === filter
  })

  const counts: Record<FilterTab, number> = {
    all: g.rounds.length,
    open: g.rounds.filter(r => r.status === 'open').length,
    partial: g.rounds.filter(r => r.status === 'partial').length,
    paid: g.rounds.filter(r => r.status === 'paid').length,
    'grace-period': g.rounds.filter(r => r.status === 'grace-period').length,
    overdue: g.rounds.filter(r => r.status === 'overdue').length,
    upcoming: g.rounds.filter(r => r.status === 'upcoming').length,
  }

  const paidCount = counts.paid
  const openCount = counts.open + counts.partial + counts['grace-period']
  const overdueCount = counts.overdue

  return (
    <AppShell navigate={navigate} activeView="my-groups">
      <div className="bg-white border-b border-[#E2E6F0] px-6 lg:px-8 py-3.5 flex items-center gap-3 shrink-0">
        <button onClick={() => navigate('group-detail', { groupId: g.id })} className="flex items-center gap-1.5 text-sm text-[#6B7280] hover:text-[#0D1117] font-medium">
          <svg className="w-4 h-4" viewBox="0 0 16 16" fill="currentColor"><path d="M9.78 11.78a.75.75 0 01-1.06 0L4.47 7.53a.75.75 0 010-1.06l4.25-4.25a.75.75 0 111.06 1.06L6.06 7l3.72 3.72a.75.75 0 010 1.06z" /></svg>
          {g.name}
        </button>
        <span className="text-[#E2E6F0]">/</span>
        <span className="text-sm font-semibold text-[#0D1117]">Contribution schedule</span>
      </div>

      <div className="flex-1 overflow-y-auto px-6 lg:px-8 py-6">
        <div className="max-w-3xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
            <div>
              <h1 className="display-font text-xl font-bold text-[#0D1117]">Contribution schedule</h1>
              <p className="text-sm text-[#6B7280] mt-0.5">{g.name} · {g.cycleStart} – {g.cycleEnd}</p>
            </div>
            <div className="flex gap-1 p-1 bg-white rounded-xl border border-[#E2E6F0]">
              {(['list', 'calendar'] as const).map(mode => (
                <button key={mode} onClick={() => setViewMode(mode)} className={`px-3.5 py-2 text-sm font-semibold rounded-lg transition-colors capitalize ${viewMode === mode ? 'bg-[#1746A2] text-white' : 'text-[#6B7280] hover:text-[#0D1117]'}`}>
                  {mode === 'list' ? '☰ List' : '🗓 Calendar'}
                </button>
              ))}
            </div>
          </div>

          {/* Summary stats */}
          <div className="grid grid-cols-3 gap-3 mb-5">
            {[
              { label: 'Confirmed', count: paidCount, color: 'text-[#059669]', bg: 'bg-[#ECFDF5]' },
              { label: 'In progress', count: openCount, color: 'text-[#1746A2]', bg: 'bg-[#EEF2FF]' },
              { label: 'Overdue', count: overdueCount, color: overdueCount > 0 ? 'text-[#DC2626]' : 'text-[#9CA3AF]', bg: overdueCount > 0 ? 'bg-[#FEF2F2]' : 'bg-[#F1F3F8]' },
            ].map(s => (
              <div key={s.label} className={`${s.bg} rounded-xl px-4 py-3 text-center`}>
                <p className={`display-font text-2xl font-bold ${s.color}`}>{s.count}</p>
                <p className="text-xs text-[#6B7280] mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>

          {viewMode === 'calendar' ? (
            <CalendarView rounds={g.rounds} groupId={g.id} navigate={navigate} />
          ) : (
            <>
              {/* Filter tabs — scrollable on mobile */}
              <div className="flex gap-1 p-1 bg-white rounded-xl border border-[#E2E6F0] w-fit mb-4 overflow-x-auto max-w-full">
                {(Object.keys(FILTER_LABELS) as FilterTab[]).map(f => {
                  const c = counts[f]
                  if (f !== 'all' && c === 0) return null
                  return (
                    <button key={f} onClick={() => setFilter(f)} className={`px-3 py-2 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap flex items-center gap-1.5 ${filter === f ? 'bg-[#1746A2] text-white' : 'text-[#6B7280] hover:text-[#0D1117]'}`}>
                      {FILTER_LABELS[f]}
                      {f !== 'all' && <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${filter === f ? 'bg-white/20 text-white' : 'bg-[#F1F3F8] text-[#6B7280]'}`}>{c}</span>}
                    </button>
                  )
                })}
              </div>

              <div className="bg-white rounded-xl border border-[#E2E6F0] overflow-hidden">
                {filtered.length === 0 ? (
                  <div className="text-center py-12 text-[#9CA3AF] text-sm">No rounds match this filter.</div>
                ) : filtered.map((round, i) => {
                  const isNextOpen = (round.status === 'open' || round.status === 'partial') && i === filtered.findIndex(r => r.status === 'open' || r.status === 'partial')
                  return (
                    <div
                      key={round.id}
                      onClick={() => navigate('contribution-detail', { groupId: g.id, roundId: round.id })}
                      className={`flex items-center gap-4 px-5 py-4 cursor-pointer hover:bg-[#F8FAFF] transition-colors ${i < filtered.length - 1 ? 'border-b border-[#F1F3F8]' : ''} ${round.isMyPayout ? 'bg-[#ECFDF5]/20' : ''}`}
                    >
                      <div className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${statusDotClass(round.status)}`}>
                        {statusDotContent(round.status, round.roundNumber)}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-sm font-semibold text-[#0D1117]">Round {round.roundNumber}</p>
                          {isNextOpen && <span className="text-[10px] font-bold text-[#1746A2] bg-[#EEF2FF] px-1.5 py-0.5 rounded-full">Pay now</span>}
                          {round.isMyPayout && <span className="text-[10px] font-bold text-[#059669] bg-[#ECFDF5] px-1.5 py-0.5 rounded-full">My payout</span>}
                        </div>
                        <p className="text-xs text-[#6B7280] mt-0.5">
                          {round.openDate ? `Opens ${round.openDate} · ` : ''}Due {round.dueDate}
                          {round.gracePeriodEnd && (round.status === 'grace-period' || round.status === 'partial') && ` · Grace ends ${round.gracePeriodEnd}`}
                          {round.paidDate && ` · Paid ${round.paidDate}`}
                        </p>
                        {round.status === 'partial' && round.amountPaid > 0 && (
                          <div className="mt-1.5 h-1 w-24 bg-[#F1F3F8] rounded-full overflow-hidden">
                            <div className="h-full bg-[#D97706] rounded-full" style={{ width: `${Math.round((round.amountPaid / round.amount) * 100)}%` }} />
                          </div>
                        )}
                      </div>

                      <div className="text-right shrink-0">
                        <p className="text-sm font-semibold text-[#0D1117]">₦{round.amount.toLocaleString()}</p>
                        <div className="flex justify-end mt-0.5">{statusBadge(round.status)}</div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </>
          )}
        </div>
      </div>
    </AppShell>
  )
}
