import { useState } from 'react'
import { Button, Badge } from '../ui'
import { AppShell } from './AppShell'
import { ALL_GROUPS } from './data'
import type { View, NavMeta } from '../../App'

interface Props { navigate: (v: View, meta?: NavMeta) => void }

type Filter = 'all' | 'active' | 'completed' | 'upcoming'

export function MyGroups({ navigate }: Props) {
  const [filter, setFilter] = useState<Filter>('all')

  const filtered = ALL_GROUPS.filter(g => filter === 'all' || g.status === filter)
  const counts = {
    all: ALL_GROUPS.length,
    active: ALL_GROUPS.filter(g => g.status === 'active').length,
    completed: ALL_GROUPS.filter(g => g.status === 'completed').length,
    upcoming: ALL_GROUPS.filter(g => g.status === 'upcoming').length,
  }

  const totalContributed = ALL_GROUPS.flatMap(g => g.rounds.filter(r => r.status === 'paid')).reduce((s, r) => s + r.amount, 0)
  const totalPayouts = ALL_GROUPS.flatMap(g => g.rounds.filter(r => r.isMyPayout && r.status === 'paid')).reduce((s, r) => s + (r.payoutAmount ?? 0), 0)

  return (
    <AppShell navigate={navigate} activeView="my-groups">
      {/* Header */}
      <div className="bg-white border-b border-[#E2E6F0] px-6 lg:px-8 py-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="display-font text-xl font-bold text-[#0D1117]">My thrift groups</h1>
            <p className="text-sm text-[#6B7280] mt-0.5">{ALL_GROUPS.length} groups across your contribution history</p>
          </div>
          <Button size="sm" onClick={() => navigate('discover')}>+ Join another group</Button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-6 lg:px-8 py-6">

        {/* Summary stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {[
            { label: 'Total groups', value: String(ALL_GROUPS.length), sub: 'Lifetime' },
            { label: 'Active now', value: String(counts.active), sub: 'Currently running', color: 'text-[#1746A2]' },
            { label: 'Total contributed', value: `₦${(totalContributed / 1000).toFixed(0)}k`, sub: 'Across all groups', color: 'text-[#1746A2]' },
            { label: 'Total received', value: `₦${(totalPayouts / 1000).toFixed(0)}k`, sub: 'All payouts', color: 'text-[#059669]' },
          ].map(s => (
            <div key={s.label} className="bg-white rounded-xl border border-[#E2E6F0] px-5 py-4">
              <p className="text-xs text-[#9CA3AF] font-medium uppercase tracking-wide mb-1">{s.label}</p>
              <p className={`display-font text-2xl font-bold ${s.color ?? 'text-[#0D1117]'}`}>{s.value}</p>
              {s.sub && <p className="text-xs text-[#6B7280] mt-0.5">{s.sub}</p>}
            </div>
          ))}
        </div>

        {/* Filter tabs */}
        <div className="flex gap-1 p-1 bg-white rounded-xl border border-[#E2E6F0] w-fit mb-5">
          {([
            { key: 'all', label: 'All' },
            { key: 'active', label: 'Active' },
            { key: 'completed', label: 'Completed' },
            { key: 'upcoming', label: 'Upcoming' },
          ] as { key: Filter; label: string }[]).map(f => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`px-4 py-2 text-sm font-semibold rounded-lg transition-colors ${filter === f.key ? 'bg-[#1746A2] text-white' : 'text-[#6B7280] hover:text-[#0D1117]'}`}
            >
              {f.label}
              <span className={`ml-1.5 text-xs px-1.5 py-0.5 rounded-full ${filter === f.key ? 'bg-white/20' : 'bg-[#F1F3F8]'}`}>
                {counts[f.key]}
              </span>
            </button>
          ))}
        </div>

        {/* Group cards */}
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center bg-white rounded-xl border border-[#E2E6F0]">
            <div className="text-4xl mb-3">📋</div>
            <p className="text-sm font-semibold text-[#374151] mb-1">No groups in this category</p>
            <p className="text-xs text-[#9CA3AF]">Groups you join will appear here.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {filtered.map(group => {
              const progress = (group.completedRounds / group.totalRounds) * 100
              const statusBadge =
                group.status === 'active' ? <Badge variant="verified">Active</Badge> :
                group.status === 'completed' ? <Badge variant="info">Completed</Badge> :
                <Badge variant="pending">Upcoming</Badge>

              return (
                <div
                  key={group.id}
                  className={`bg-white rounded-xl border overflow-hidden hover:shadow-md transition-shadow ${group.status === 'completed' ? 'border-[#E2E6F0] opacity-90' : 'border-[#E2E6F0]'}`}
                >
                  {/* Top bar accent */}
                  <div className="h-1" style={{ background: group.color }} />

                  <div className="p-5">
                    <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                      {/* Left */}
                      <div className="flex items-start gap-3 flex-1">
                        <div className="w-11 h-11 rounded-xl flex items-center justify-center text-2xl shrink-0" style={{ background: group.color + '18' }}>
                          {group.emoji}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap mb-0.5">
                            <p className="text-sm font-bold text-[#0D1117]">{group.name}</p>
                            {statusBadge}
                          </div>
                          <p className="text-xs text-[#6B7280]">
                            {group.members} members · ₦{group.amount.toLocaleString()}/{group.frequency === 'Monthly' ? 'mo' : 'wk'} · Coordinated by {group.coordinator.name}
                          </p>
                          <p className="text-xs text-[#9CA3AF] mt-0.5">{group.cycleStart} – {group.cycleEnd}</p>
                        </div>
                      </div>

                      {/* Stats row */}
                      <div className="flex gap-4 sm:gap-6 text-right shrink-0">
                        <div>
                          <p className="text-xs text-[#9CA3AF]">My position</p>
                          <p className="text-sm font-bold text-[#1746A2]">#{group.myPosition}</p>
                        </div>
                        <div>
                          <p className="text-xs text-[#9CA3AF]">My payout</p>
                          <p className="text-sm font-bold text-[#059669]">{group.myPayoutDate}</p>
                        </div>
                        {group.status === 'active' && (
                          <div>
                            <p className="text-xs text-[#9CA3AF]">Next due</p>
                            <p className={`text-sm font-bold ${group.daysUntilDue <= 5 ? 'text-[#DC2626]' : 'text-[#0D1117]'}`}>
                              {group.daysUntilDue <= 0 ? 'Today' : `${group.daysUntilDue}d`}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Progress bar */}
                    <div className="mt-4">
                      <div className="flex justify-between text-xs mb-1.5 text-[#6B7280]">
                        <span>Cycle progress</span>
                        <span className="font-semibold text-[#0D1117]">{group.completedRounds} of {group.totalRounds} rounds</span>
                      </div>
                      <div className="h-2 bg-[#F1F3F8] rounded-full overflow-hidden">
                        <div className="h-full rounded-full transition-all duration-700" style={{ width: `${progress}%`, background: group.color }} />
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-[#F1F3F8]">
                      <Button
                        size="sm"
                        onClick={() => navigate('group-detail', { groupId: group.id })}
                      >
                        View details
                      </Button>
                      {group.status === 'active' && (
                        <>
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => navigate('contribution-schedule', { groupId: group.id })}
                          >
                            Schedule
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => navigate('payout-position', { groupId: group.id })}
                          >
                            Payout position
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => navigate('group-timeline', { groupId: group.id })}
                          >
                            Timeline
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </AppShell>
  )
}
