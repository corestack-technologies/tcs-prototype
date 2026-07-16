import { useState } from 'react'
import { Badge } from '../ui'
import { AppShell } from './AppShell'
import { CONTRIBUTION_HISTORY } from './data'
import type { View, NavMeta } from '../../App'

interface Props { navigate: (v: View, meta?: NavMeta) => void }

type FilterStatus = 'all' | 'paid' | 'upcoming' | 'overdue'

export function ContributionHistory({ navigate }: Props) {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<FilterStatus>('all')
  const [groupFilter, setGroupFilter] = useState('all')

  const groups = ['all', ...Array.from(new Set(CONTRIBUTION_HISTORY.map(h => h.groupName)))]

  const filtered = CONTRIBUTION_HISTORY.filter(h => {
    if (statusFilter !== 'all' && h.status !== statusFilter) return false
    if (groupFilter !== 'all' && h.groupName !== groupFilter) return false
    if (search && !h.groupName.toLowerCase().includes(search.toLowerCase()) && !(h.reference ?? '').toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  const totalContributed = CONTRIBUTION_HISTORY.filter(h => h.status === 'paid').reduce((s, h) => s + h.amount, 0)
  const totalPayouts = CONTRIBUTION_HISTORY.filter(h => h.isMyPayout).reduce((s, h) => s + (h.payoutAmount ?? 0), 0)
  const myPayoutCount = CONTRIBUTION_HISTORY.filter(h => h.isMyPayout).length

  return (
    <AppShell navigate={navigate} activeView="contribution-history">
      {/* Header */}
      <div className="bg-white border-b border-[#E2E6F0] px-6 lg:px-8 py-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="display-font text-xl font-bold text-[#0D1117]">Contribution history</h1>
            <p className="text-sm text-[#6B7280] mt-0.5">All contributions across your groups</p>
          </div>
          <div className="relative w-full sm:w-72">
            <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9CA3AF]" viewBox="0 0 16 16" fill="currentColor">
              <path d="M6.5 1a5.5 5.5 0 104.472 8.719l3.155 3.154a.75.75 0 001.06-1.06l-3.154-3.155A5.5 5.5 0 006.5 1zM2.5 6.5a4 4 0 118 0 4 4 0 01-8 0z" />
            </svg>
            <input
              type="search"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by group or reference…"
              className="w-full pl-9 pr-4 py-2.5 text-sm bg-[#F4F6FA] border border-[#E2E6F0] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1746A2] focus:bg-white transition-colors"
            />
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-6 lg:px-8 py-6">

        {/* Summary */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {[
            { label: 'Total contributions', value: `${CONTRIBUTION_HISTORY.filter(h => h.status === 'paid').length}`, sub: 'Rounds paid' },
            { label: 'Total amount', value: `₦${(totalContributed / 1000).toFixed(0)}k`, sub: 'Contributed', color: 'text-[#1746A2]' },
            { label: 'Payouts received', value: `${myPayoutCount}`, sub: `₦${(totalPayouts / 1000).toFixed(0)}k total` },
            { label: 'On-time rate', value: '100%', sub: 'No missed rounds', color: 'text-[#059669]' },
          ].map(s => (
            <div key={s.label} className="bg-white rounded-xl border border-[#E2E6F0] px-5 py-4">
              <p className="text-xs text-[#9CA3AF] font-medium uppercase tracking-wide mb-1">{s.label}</p>
              <p className={`display-font text-2xl font-bold ${s.color ?? 'text-[#0D1117]'}`}>{s.value}</p>
              {s.sub && <p className="text-xs text-[#6B7280] mt-0.5">{s.sub}</p>}
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-5">
          <div className="flex gap-1 p-1 bg-white rounded-xl border border-[#E2E6F0]">
            {(['all', 'paid', 'upcoming', 'overdue'] as FilterStatus[]).map(f => (
              <button key={f} onClick={() => setStatusFilter(f)} className={`px-3 py-1.5 text-sm font-semibold rounded-lg transition-colors capitalize ${statusFilter === f ? 'bg-[#1746A2] text-white' : 'text-[#6B7280] hover:text-[#0D1117]'}`}>
                {f}
              </button>
            ))}
          </div>
          <select
            value={groupFilter}
            onChange={e => setGroupFilter(e.target.value)}
            className="text-sm border border-[#E2E6F0] rounded-xl px-3 py-2.5 bg-white text-[#374151] focus:outline-none focus:ring-2 focus:ring-[#1746A2]"
          >
            <option value="all">All groups</option>
            {groups.filter(g => g !== 'all').map(g => <option key={g} value={g}>{g}</option>)}
          </select>
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl border border-[#E2E6F0] overflow-hidden">
          {/* Header */}
          <div className="hidden sm:grid grid-cols-[1fr_120px_100px_130px_100px] px-5 py-3 border-b border-[#F1F3F8] bg-[#F8FAFF]">
            {['Group / Round', 'Amount', 'Status', 'Paid on', 'Reference'].map(h => (
              <p key={h} className="text-xs font-bold text-[#9CA3AF] uppercase tracking-wide">{h}</p>
            ))}
          </div>

          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="text-3xl mb-3">📋</div>
              <p className="text-sm font-semibold text-[#374151] mb-1">No contributions found</p>
              <p className="text-xs text-[#9CA3AF]">Try adjusting your filters.</p>
            </div>
          ) : filtered.map((entry, i) => (
            <div
              key={entry.id}
              onClick={() => navigate('contribution-detail', { groupId: entry.groupId, roundId: `r${entry.roundNumber}` })}
              className={`flex flex-col sm:grid sm:grid-cols-[1fr_120px_100px_130px_100px] items-start sm:items-center gap-2 sm:gap-0 px-5 py-4 cursor-pointer hover:bg-[#F8FAFF] transition-colors ${i < filtered.length - 1 ? 'border-b border-[#F1F3F8]' : ''} ${entry.isMyPayout ? 'bg-[#ECFDF5]/20' : ''}`}
            >
              {/* Group / round */}
              <div className="flex items-center gap-3 min-w-0">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm shrink-0 ${entry.status === 'paid' ? 'bg-[#ECFDF5] text-[#059669]' : entry.status === 'overdue' ? 'bg-[#FEF2F2] text-[#DC2626]' : 'bg-[#EEF2FF] text-[#1746A2]'}`}>
                  {entry.status === 'paid' ? '✓' : entry.roundNumber}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-[#0D1117] truncate">{entry.groupName}</p>
                  <p className="text-xs text-[#9CA3AF]">
                    Round {entry.roundNumber}
                    {entry.isMyPayout && <span className="ml-1.5 text-[10px] font-bold text-[#059669] bg-[#ECFDF5] px-1.5 py-0.5 rounded-full">My payout</span>}
                  </p>
                </div>
              </div>

              {/* Amount */}
              <div>
                <p className="text-sm font-bold text-[#0D1117]">₦{entry.amount.toLocaleString()}</p>
                {entry.isMyPayout && <p className="text-xs text-[#059669] font-semibold">+₦{(entry.payoutAmount ?? 0).toLocaleString()} recv</p>}
              </div>

              {/* Status */}
              <div>
                {entry.status === 'paid' ? <Badge variant="verified">Paid</Badge> : entry.status === 'overdue' ? <Badge variant="rejected">Overdue</Badge> : <Badge variant="pending">Upcoming</Badge>}
              </div>

              {/* Date */}
              <p className="text-sm text-[#6B7280]">{entry.paidDate ?? entry.dueDate}</p>

              {/* Reference */}
              {entry.reference ? (
                <span className="font-mono text-xs text-[#6B7280] bg-[#F1F3F8] px-2 py-1 rounded truncate max-w-[120px] block">
                  {entry.reference}
                </span>
              ) : <span className="text-xs text-[#9CA3AF]">—</span>}
            </div>
          ))}
        </div>
      </div>
    </AppShell>
  )
}
