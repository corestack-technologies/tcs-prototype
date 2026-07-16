import { useState } from 'react'
import { Button, Badge, Alert } from '../ui'
import { AppShell } from './AppShell'
import { getGroup } from './data'
import type { View, NavMeta } from '../../App'

interface Props { navigate: (v: View, meta?: NavMeta) => void; groupId?: string }

type Tab = 'overview' | 'schedule' | 'members' | 'rules'

const statusBadge = (s: string) => {
  if (s === 'paid') return <Badge variant="verified">Contributed</Badge>
  if (s === 'pending') return <Badge variant="pending">Pending</Badge>
  if (s === 'overdue') return <Badge variant="rejected">Overdue</Badge>
  return <Badge variant="not-started">—</Badge>
}

export function GroupDetail({ navigate, groupId }: Props) {
  const [tab, setTab] = useState<Tab>('overview')
  const g = getGroup(groupId)
  const progress = (g.completedRounds / g.totalRounds) * 100
  const myRound = g.rounds.find(r => r.isMyPayout)
  const nextRound = g.rounds.find(r => r.status === 'upcoming')

  const tabs: { id: Tab; label: string }[] = [
    { id: 'overview', label: 'Overview' },
    { id: 'schedule', label: 'Contribution schedule' },
    { id: 'members', label: `Members (${g.members})` },
    { id: 'rules', label: 'Group rules' },
  ]

  return (
    <AppShell navigate={navigate} activeView="my-groups">
      {/* Breadcrumb */}
      <div className="bg-white border-b border-[#E2E6F0] px-6 lg:px-8 py-3.5 flex items-center gap-3 shrink-0">
        <button onClick={() => navigate('my-groups')} className="flex items-center gap-1.5 text-sm text-[#6B7280] hover:text-[#0D1117] font-medium">
          <svg className="w-4 h-4" viewBox="0 0 16 16" fill="currentColor"><path d="M9.78 11.78a.75.75 0 01-1.06 0L4.47 7.53a.75.75 0 010-1.06l4.25-4.25a.75.75 0 111.06 1.06L6.06 7l3.72 3.72a.75.75 0 010 1.06z" /></svg>
          My groups
        </button>
        <span className="text-[#E2E6F0]">/</span>
        <span className="text-sm font-semibold text-[#0D1117] truncate">{g.name}</span>
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* Hero */}
        <div className="bg-white border-b border-[#E2E6F0]">
          <div className="h-1.5" style={{ background: g.color }} />
          <div className="px-6 lg:px-8 py-6">
            <div className="flex flex-col lg:flex-row lg:items-start gap-5">
              <div className="flex items-start gap-4 flex-1">
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl shrink-0" style={{ background: g.color + '18' }}>{g.emoji}</div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <h1 className="display-font text-xl font-bold text-[#0D1117]">{g.name}</h1>
                    {g.status === 'active' ? <Badge variant="verified">Active</Badge> : <Badge variant="info">Completed</Badge>}
                  </div>
                  <p className="text-sm text-[#6B7280]">{g.members} members · ₦{g.amount.toLocaleString()}/{g.frequency === 'Monthly' ? 'month' : 'cycle'} · {g.cycleStart} – {g.cycleEnd}</p>
                  <p className="text-xs text-[#9CA3AF] mt-1">Coordinated by {g.coordinator.name} · Joined {g.joinedDate}</p>
                </div>
              </div>
              <div className="flex gap-2 flex-wrap lg:flex-nowrap lg:shrink-0">
                <Button size="sm" onClick={() => navigate('contribution-schedule', { groupId: g.id })}>View schedule</Button>
                <Button variant="secondary" size="sm" onClick={() => navigate('payout-position', { groupId: g.id })}>Payout position</Button>
                <Button variant="ghost" size="sm" onClick={() => navigate('group-timeline', { groupId: g.id })}>Timeline</Button>
              </div>
            </div>

            {/* Progress bar */}
            <div className="mt-5">
              <div className="flex justify-between text-xs mb-1.5 text-[#6B7280]">
                <span>Cycle progress</span>
                <span className="font-semibold text-[#0D1117]">{g.completedRounds}/{g.totalRounds} rounds complete</span>
              </div>
              <div className="h-2.5 bg-[#F1F3F8] rounded-full overflow-hidden">
                <div className="h-full rounded-full transition-all" style={{ width: `${progress}%`, background: g.color }} />
              </div>
            </div>
          </div>

          {/* Tab bar */}
          <div className="px-6 lg:px-8 flex gap-0 overflow-x-auto border-t border-[#F1F3F8]">
            {tabs.map(t => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`px-4 py-3.5 text-sm font-semibold border-b-2 whitespace-nowrap transition-colors ${tab === t.id ? 'border-[#1746A2] text-[#1746A2]' : 'border-transparent text-[#6B7280] hover:text-[#0D1117]'}`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Tab content */}
        <div className="px-6 lg:px-8 py-6 max-w-5xl">

          {/* ── Overview ── */}
          {tab === 'overview' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
              <div className="lg:col-span-2 flex flex-col gap-5">

                {/* My at-a-glance */}
                <div className="bg-white rounded-xl border border-[#E2E6F0] p-5">
                  <p className="text-xs font-bold text-[#9CA3AF] uppercase tracking-wide mb-4">My participation</p>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    {[
                      { label: 'My position', value: `#${g.myPosition}`, color: 'text-[#1746A2]' },
                      { label: 'Monthly amount', value: `₦${g.amount.toLocaleString()}`, color: 'text-[#0D1117]' },
                      { label: 'My payout month', value: g.myPayoutDate, color: 'text-[#059669]' },
                      { label: 'Payout amount', value: `₦${g.myPayoutEstimate.toLocaleString()}`, color: 'text-[#059669]' },
                    ].map(s => (
                      <div key={s.label} className="bg-[#F8FAFF] rounded-xl px-4 py-3">
                        <p className="text-xs text-[#9CA3AF] mb-1">{s.label}</p>
                        <p className={`display-font text-lg font-bold ${s.color}`}>{s.value}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* About */}
                <div className="bg-white rounded-xl border border-[#E2E6F0] p-5">
                  <p className="text-xs font-bold text-[#9CA3AF] uppercase tracking-wide mb-3">About this group</p>
                  <p className="text-sm text-[#374151] leading-relaxed">{g.description}</p>
                </div>

                {/* Next contribution alert */}
                {g.status === 'active' && nextRound && (
                  <div className={`rounded-xl border px-5 py-4 flex items-center justify-between gap-4 ${g.daysUntilDue <= 5 ? 'bg-[#FEF2F2] border-[#FECACA]' : 'bg-[#EFF6FF] border-[#BFDBFE]'}`}>
                    <div>
                      <p className={`text-sm font-bold ${g.daysUntilDue <= 5 ? 'text-[#991B1B]' : 'text-[#1E40AF]'}`}>
                        {g.daysUntilDue <= 0 ? 'Contribution due today!' : `Next contribution due in ${g.daysUntilDue} days`}
                      </p>
                      <p className={`text-xs mt-0.5 ${g.daysUntilDue <= 5 ? 'text-[#DC2626]' : 'text-[#3B82F6]'}`}>
                        {g.nextDueDate} · ₦{g.amount.toLocaleString()} · Round {nextRound.roundNumber} of {g.totalRounds}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      variant={g.daysUntilDue <= 5 ? 'danger' : 'primary'}
                      onClick={() => navigate('contribution-detail', { groupId: g.id, roundId: nextRound.id })}
                    >
                      View details →
                    </Button>
                  </div>
                )}

                {/* Payout alert if I received */}
                {myRound && (
                  <Alert type="success" title={`Your payout was received in ${g.myPayoutDate}`}>
                    ₦{g.myPayoutEstimate.toLocaleString()} was sent to your GTBank account. Reference: {myRound.reference ?? 'TCS-PAYOUT'}
                  </Alert>
                )}
              </div>

              {/* Right panel */}
              <div className="flex flex-col gap-5">
                <div className="bg-white rounded-xl border border-[#E2E6F0] p-5">
                  <p className="text-xs font-bold text-[#9CA3AF] uppercase tracking-wide mb-3">Coordinator</p>
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0" style={{ background: g.color }}>
                      {g.coordinator.initials}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-[#0D1117]">{g.coordinator.name}</p>
                      <p className="text-xs text-[#6B7280]">Group coordinator</p>
                    </div>
                  </div>
                  <p className="text-xs text-[#9CA3AF]">For queries, contact your coordinator via your registered phone number.</p>
                </div>

                <div className="bg-white rounded-xl border border-[#E2E6F0] p-5">
                  <p className="text-xs font-bold text-[#9CA3AF] uppercase tracking-wide mb-3">Group details</p>
                  {[
                    { label: 'Contribution', value: `₦${g.amount.toLocaleString()}` },
                    { label: 'Frequency', value: g.frequency },
                    { label: 'Members', value: `${g.members}/${g.maxMembers}` },
                    { label: 'Cycle', value: `${g.cycleStart} – ${g.cycleEnd}` },
                    { label: 'Payout pool', value: `₦${(g.amount * g.maxMembers).toLocaleString()}` },
                  ].map(row => (
                    <div key={row.label} className="flex justify-between items-center py-2 border-b border-[#F1F3F8] last:border-0">
                      <p className="text-xs text-[#6B7280]">{row.label}</p>
                      <p className="text-sm font-semibold text-[#0D1117]">{row.value}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ── Schedule tab ── */}
          {tab === 'schedule' && (
            <div className="flex flex-col gap-4">
              <div className="flex justify-end">
                <Button size="sm" onClick={() => navigate('contribution-schedule', { groupId: g.id })}>
                  Open full schedule →
                </Button>
              </div>
              <div className="bg-white rounded-xl border border-[#E2E6F0] overflow-hidden">
                <div className="px-5 py-3.5 border-b border-[#F1F3F8] bg-[#F8FAFF]">
                  <p className="text-xs font-bold text-[#9CA3AF] uppercase tracking-wide">All {g.totalRounds} rounds</p>
                </div>
                {g.rounds.map((round, i) => (
                  <div
                    key={round.id}
                    onClick={() => navigate('contribution-detail', { groupId: g.id, roundId: round.id })}
                    className={`flex items-center gap-4 px-5 py-3.5 cursor-pointer hover:bg-[#F8FAFF] transition-colors ${i < g.rounds.length - 1 ? 'border-b border-[#F1F3F8]' : ''} ${round.isMyPayout ? 'bg-[#ECFDF5]/40' : ''}`}
                  >
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${round.status === 'paid' ? 'bg-[#ECFDF5] text-[#059669]' : round.status === 'overdue' ? 'bg-[#FEF2F2] text-[#DC2626]' : round.status === 'upcoming' ? 'bg-[#EEF2FF] text-[#1746A2]' : 'bg-[#F1F3F8] text-[#9CA3AF]'}`}>
                      {round.status === 'paid' ? '✓' : round.roundNumber}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-[#0D1117]">
                        Round {round.roundNumber}
                        {round.isMyPayout && <span className="ml-2 text-[10px] font-bold text-[#059669] bg-[#ECFDF5] px-1.5 py-0.5 rounded-full">My payout</span>}
                      </p>
                      <p className="text-xs text-[#6B7280]">{round.dueDate} · Payout to {round.payoutRecipient}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-semibold text-[#0D1117]">₦{round.amount.toLocaleString()}</p>
                      <div className="flex justify-end mt-0.5">
                        {round.status === 'paid' ? <Badge variant="verified">Paid</Badge> : round.status === 'upcoming' ? <Badge variant="pending">Upcoming</Badge> : round.status === 'overdue' ? <Badge variant="rejected">Overdue</Badge> : <Badge variant="not-started">—</Badge>}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── Members tab ── */}
          {tab === 'members' && (
            <div className="bg-white rounded-xl border border-[#E2E6F0] overflow-hidden">
              <div className="px-5 py-3.5 border-b border-[#F1F3F8] bg-[#F8FAFF]">
                <p className="text-xs font-bold text-[#9CA3AF] uppercase tracking-wide">{g.members} members · Contributions this round</p>
              </div>
              {g.memberList.map((m, i) => (
                <div key={i} className={`flex items-center gap-4 px-5 py-4 ${i < g.memberList.length - 1 ? 'border-b border-[#F1F3F8]' : ''} ${m.isMe ? 'bg-[#EEF2FF]/40' : ''}`}>
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0" style={{ background: m.isMe ? '#1746A2' : '#6B7280' }}>
                    {m.initials}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-[#0D1117]">
                      {m.name}
                      {m.isMe && <span className="ml-2 text-[10px] font-bold text-[#1746A2] bg-[#EEF2FF] px-1.5 py-0.5 rounded-full">You</span>}
                    </p>
                    <p className="text-xs text-[#9CA3AF]">Position #{m.position}</p>
                  </div>
                  {statusBadge(m.status)}
                </div>
              ))}
            </div>
          )}

          {/* ── Rules tab ── */}
          {tab === 'rules' && (
            <div className="bg-white rounded-xl border border-[#E2E6F0] p-6">
              <p className="text-xs font-bold text-[#9CA3AF] uppercase tracking-wide mb-5">Group rules</p>
              {g.rules.length === 0 ? (
                <p className="text-sm text-[#9CA3AF]">No rules documented for this group.</p>
              ) : (
                <ol className="flex flex-col gap-4">
                  {g.rules.map((rule, i) => (
                    <li key={i} className="flex gap-4 items-start">
                      <span className="w-6 h-6 rounded-full bg-[#EEF2FF] text-[#1746A2] text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">{i + 1}</span>
                      <p className="text-sm text-[#374151] leading-relaxed">{rule}</p>
                    </li>
                  ))}
                </ol>
              )}
            </div>
          )}
        </div>
      </div>
    </AppShell>
  )
}
