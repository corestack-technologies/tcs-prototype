import React from 'react'
import { getGroup } from './data'
import { AppShell } from './AppShell'
import type { View, NavMeta } from '../../App'

interface Props { navigate: (v: View, meta?: NavMeta) => void; groupId?: string }

type EventType = 'joined' | 'contribution' | 'payout-received' | 'payout-sent' | 'upcoming' | 'cycle-complete'

interface TimelineEvent {
  type: EventType
  date: string
  title: string
  subtitle?: string
  amount?: number
  reference?: string
  isMe?: boolean
}


export function GroupTimeline({ navigate, groupId }: Props) {
  const g = getGroup(groupId)

  const events: TimelineEvent[] = []

  // Joined event
  events.push({
    type: 'joined',
    date: g.cycleStart,
    title: `Joined ${g.name}`,
    subtitle: `Position #${g.myPosition} assigned · ${g.members} members · ₦${g.amount.toLocaleString()}/round`,
  })

  // One event per round
  for (const round of g.rounds) {
    if (round.status === 'paid') {
      // My contribution is implicit; highlight if it was my payout round
      if (round.isMyPayout) {
        events.push({
          type: 'payout-received',
          date: round.paidDate ?? round.dueDate,
          title: 'Payout received',
          subtitle: `Round ${round.roundNumber} · Received from coordinator`,
          amount: round.payoutAmount,
          reference: round.reference,
          isMe: true,
        })
      } else {
        events.push({
          type: 'contribution',
          date: round.paidDate ?? round.dueDate,
          title: `Round ${round.roundNumber} contribution`,
          subtitle: `Payout to ${round.payoutRecipient}${round.reference ? ' · Ref: ' + round.reference : ''}`,
          amount: round.amount,
          reference: round.reference,
        })
      }
    } else if (round.status === 'upcoming' || round.status === 'pending-verification') {
      events.push({
        type: 'upcoming',
        date: round.dueDate,
        title: `Round ${round.roundNumber} due`,
        subtitle: `Payout to ${round.payoutRecipient}${round.isMyPayout ? ' — your payout round' : ''}`,
        amount: round.amount,
        isMe: round.isMyPayout,
      })
    }
  }

  // Cycle completion
  const allDone = g.rounds.every(r => r.status === 'paid')
  if (allDone) {
    events.push({
      type: 'cycle-complete',
      date: g.cycleEnd,
      title: 'Cycle complete',
      subtitle: `All ${g.totalRounds} rounds completed · ${g.name}`,
    })
  }

  const typeConfig: Record<EventType, { icon: React.ReactNode; dotBg: string; dotBorder: string }> = {
    joined: {
      icon: <svg className="w-3.5 h-3.5" viewBox="0 0 16 16" fill="currentColor"><path d="M8 1a7 7 0 110 14A7 7 0 018 1zm0 1.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zm.75 3.25a.75.75 0 00-1.5 0v2.5H5a.75.75 0 000 1.5h2.25V12a.75.75 0 001.5 0V9.75H11a.75.75 0 000-1.5H8.75v-2.5z" /></svg>,
      dotBg: 'bg-[#1746A2]',
      dotBorder: 'border-[#C7D2FE]',
    },
    contribution: {
      icon: <svg className="w-3.5 h-3.5" viewBox="0 0 16 16" fill="currentColor"><path d="M14 3H2a1 1 0 00-1 1v8a1 1 0 001 1h12a1 1 0 001-1V4a1 1 0 00-1-1zM8 9.5a1.5 1.5 0 110-3 1.5 1.5 0 010 3z" /></svg>,
      dotBg: 'bg-[#059669]',
      dotBorder: 'border-[#A7F3D0]',
    },
    'payout-received': {
      icon: <svg className="w-3.5 h-3.5" viewBox="0 0 16 16" fill="currentColor"><path d="M13.78 4.22a.75.75 0 010 1.06l-7.25 7.25a.75.75 0 01-1.06 0L2.22 9.28a.75.75 0 011.06-1.06L6 10.94l6.72-6.72a.75.75 0 011.06 0z" /></svg>,
      dotBg: 'bg-[#059669]',
      dotBorder: 'border-[#6EE7B7]',
    },
    'payout-sent': {
      icon: <svg className="w-3.5 h-3.5" viewBox="0 0 16 16" fill="currentColor"><path d="M9.78 11.78a.75.75 0 01-1.06 0L4.47 7.53a.75.75 0 010-1.06l4.25-4.25a.75.75 0 111.06 1.06L6.06 7l3.72 3.72a.75.75 0 010 1.06z" /></svg>,
      dotBg: 'bg-[#6B7280]',
      dotBorder: 'border-[#E2E6F0]',
    },
    upcoming: {
      icon: <svg className="w-3.5 h-3.5" viewBox="0 0 16 16" fill="currentColor"><path d="M8 1a7 7 0 110 14A7 7 0 018 1zm.75 4.25a.75.75 0 00-1.5 0v4c0 .199.079.39.22.53l2.5 2.5a.75.75 0 001.06-1.06l-2.28-2.28V5.25z" /></svg>,
      dotBg: 'bg-[#D97706]',
      dotBorder: 'border-[#FDE68A]',
    },
    'cycle-complete': {
      icon: <svg className="w-3.5 h-3.5" viewBox="0 0 16 16" fill="currentColor"><path d="M8 1l1.94 4.38L14 6.25l-3 3.07.71 4.18L8 11.25l-3.71 2.25.71-4.18-3-3.07 4.06-.87L8 1z" /></svg>,
      dotBg: 'bg-[#1746A2]',
      dotBorder: 'border-[#C7D2FE]',
    },
  }

  return (
    <AppShell navigate={navigate} activeView="my-groups">
      {/* Breadcrumb */}
      <div className="bg-white border-b border-[#E2E6F0] px-6 lg:px-8 py-3.5 flex items-center gap-3 shrink-0">
        <button onClick={() => navigate('group-detail', { groupId: g.id })} className="flex items-center gap-1.5 text-sm text-[#6B7280] hover:text-[#0D1117] font-medium">
          <svg className="w-4 h-4" viewBox="0 0 16 16" fill="currentColor"><path d="M9.78 11.78a.75.75 0 01-1.06 0L4.47 7.53a.75.75 0 010-1.06l4.25-4.25a.75.75 0 111.06 1.06L6.06 7l3.72 3.72a.75.75 0 010 1.06z" /></svg>
          {g.name}
        </button>
        <span className="text-[#E2E6F0]">/</span>
        <span className="text-sm font-semibold text-[#0D1117]">Group timeline</span>
      </div>

      <div className="flex-1 overflow-y-auto px-6 lg:px-8 py-7">
        <div className="max-w-2xl">

          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="display-font text-xl font-bold text-[#0D1117]">Group timeline</h1>
              <p className="text-sm text-[#6B7280] mt-0.5">{g.name} · {g.cycleStart} – {g.cycleEnd}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-[#9CA3AF] mb-0.5">Completed</p>
              <p className="display-font text-xl font-bold text-[#1746A2]">{g.rounds.filter(r => r.status === 'paid').length}/{g.totalRounds}</p>
            </div>
          </div>

          {/* Legend */}
          <div className="flex flex-wrap gap-3 mb-6">
            {[
              { label: 'Contribution', color: 'bg-[#059669]' },
              { label: 'Payout received', color: 'bg-[#059669]', ring: true },
              { label: 'Upcoming', color: 'bg-[#D97706]' },
              { label: 'Milestone', color: 'bg-[#1746A2]' },
            ].map(l => (
              <div key={l.label} className="flex items-center gap-1.5">
                <div className={`w-2.5 h-2.5 rounded-full ${l.color}`} />
                <span className="text-xs text-[#6B7280]">{l.label}</span>
              </div>
            ))}
          </div>

          {/* Timeline */}
          <div className="relative">
            {/* Vertical line */}
            <div className="absolute left-[19px] top-4 bottom-4 w-px bg-[#E2E6F0]" />

            <div className="flex flex-col gap-0">
              {events.map((event, i) => {
                const cfg = typeConfig[event.type]
                const isPast = event.type === 'contribution' || event.type === 'payout-received' || event.type === 'joined' || event.type === 'cycle-complete'
                const isUpcoming = event.type === 'upcoming'
                const isPayoutReceived = event.type === 'payout-received'

                return (
                  <div key={i} className="flex gap-4 pb-6 last:pb-0">
                    {/* Dot */}
                    <div className="relative z-10 flex flex-col items-center shrink-0 pt-0.5">
                      <div className={`w-9 h-9 rounded-full ${cfg.dotBg} border-2 ${cfg.dotBorder} flex items-center justify-center text-white shadow-sm ${isPayoutReceived ? 'ring-4 ring-[#D1FAE5]' : ''}`}>
                        {cfg.icon}
                      </div>
                    </div>

                    {/* Card */}
                    <div className={`flex-1 min-w-0 rounded-xl border p-4 ${isPayoutReceived ? 'bg-[#ECFDF5] border-[#A7F3D0]' : isUpcoming ? 'bg-[#FFFBEB] border-[#FDE68A] opacity-80' : event.type === 'joined' || event.type === 'cycle-complete' ? 'bg-[#EEF2FF] border-[#C7D2FE]' : 'bg-white border-[#E2E6F0]'}`}>
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm font-bold ${isPayoutReceived ? 'text-[#065F46]' : isUpcoming ? 'text-[#92400E]' : 'text-[#0D1117]'}`}>
                            {event.title}
                            {event.isMe && event.type === 'upcoming' && (
                              <span className="ml-2 text-[10px] font-bold text-[#D97706] bg-[#FDE68A] px-1.5 py-0.5 rounded-full">Your payout</span>
                            )}
                          </p>
                          {event.subtitle && <p className="text-xs text-[#6B7280] mt-0.5 leading-relaxed">{event.subtitle}</p>}
                          {event.reference && (
                            <p className="text-xs font-mono text-[#9CA3AF] mt-1 bg-[#F1F3F8] inline-block px-1.5 py-0.5 rounded">{event.reference}</p>
                          )}
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-xs text-[#9CA3AF]">{event.date}</p>
                          {event.amount && (
                            <p className={`text-sm font-bold mt-0.5 ${isPayoutReceived ? 'text-[#059669]' : 'text-[#0D1117]'}`}>
                              {isPayoutReceived ? '+' : ''}₦{event.amount.toLocaleString()}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  )
}
