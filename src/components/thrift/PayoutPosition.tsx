import { getGroup } from './data'
import { AppShell } from './AppShell'
import type { View, NavMeta } from '../../App'

interface Props { navigate: (v: View, meta?: NavMeta) => void; groupId?: string }

export function PayoutPosition({ navigate, groupId }: Props) {
  const g = getGroup(groupId)

  // Each member has a position (1-indexed). Find my position from the round where isMyPayout is true.
  const myPayoutRound = g.rounds.find(r => r.isMyPayout)
  const myPosition = myPayoutRound?.roundNumber ?? 5

  const totalMembers = g.members
  const paidOutCount = g.rounds.filter(r => r.status === 'paid').length
  const myPayoutReceived = myPayoutRound?.status === 'paid'

  // Build member payout order from rounds (one payout per round)
  const payoutOrder = g.rounds.map(r => ({
    position: r.roundNumber,
    name: r.payoutRecipient ?? `Member ${r.roundNumber}`,
    isMe: r.isMyPayout ?? false,
    received: r.status === 'paid',
    dueDate: r.dueDate,
    amount: r.payoutAmount ?? g.amount * g.members,
    roundStatus: r.status,
  }))

  const membersAhead = payoutOrder.filter(m => m.position < myPosition && !m.received).length
  const myEntry = payoutOrder.find(m => m.isMe)

  // Estimated payout date — use round's due date
  const estimatedPayoutDate = myPayoutRound?.dueDate ?? '—'

  const cycleProgressPct = Math.round((paidOutCount / g.totalRounds) * 100)

  return (
    <AppShell navigate={navigate} activeView="my-groups">
      {/* Breadcrumb */}
      <div className="bg-white border-b border-[#E2E6F0] px-6 lg:px-8 py-3.5 flex items-center gap-3 shrink-0">
        <button onClick={() => navigate('group-detail', { groupId: g.id })} className="flex items-center gap-1.5 text-sm text-[#6B7280] hover:text-[#0D1117] font-medium">
          <svg className="w-4 h-4" viewBox="0 0 16 16" fill="currentColor"><path d="M9.78 11.78a.75.75 0 01-1.06 0L4.47 7.53a.75.75 0 010-1.06l4.25-4.25a.75.75 0 111.06 1.06L6.06 7l3.72 3.72a.75.75 0 010 1.06z" /></svg>
          {g.name}
        </button>
        <span className="text-[#E2E6F0]">/</span>
        <span className="text-sm font-semibold text-[#0D1117]">Payout position</span>
      </div>

      <div className="flex-1 overflow-y-auto px-6 lg:px-8 py-7">
        <div className="max-w-2xl">

          {/* Hero card */}
          <div className={`rounded-2xl p-6 mb-6 ${myPayoutReceived ? 'bg-[#ECFDF5] border border-[#A7F3D0]' : 'bg-[#EEF2FF] border border-[#C7D2FE]'}`}>
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-[#6B7280] mb-1">My payout position</p>
                <div className="flex items-end gap-2">
                  <span className="display-font text-6xl font-black text-[#0D1117] leading-none">#{myPosition}</span>
                  <span className="text-sm text-[#6B7280] mb-2">of {totalMembers}</span>
                </div>
                {myPayoutReceived ? (
                  <p className="text-sm font-semibold text-[#059669] mt-2">Payout received — {estimatedPayoutDate}</p>
                ) : (
                  <p className="text-sm text-[#6B7280] mt-2">
                    Estimated payout: <span className="font-bold text-[#0D1117]">{estimatedPayoutDate}</span>
                  </p>
                )}
              </div>
              <div className={`w-20 h-20 rounded-2xl flex items-center justify-center shrink-0 ${myPayoutReceived ? 'bg-[#D1FAE5]' : 'bg-[#DBEAFE]'}`}>
                {myPayoutReceived ? (
                  <svg className="w-10 h-10 text-[#059669]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                ) : (
                  <svg className="w-10 h-10 text-[#1746A2]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </div>
            </div>

            <div className="mt-5 grid grid-cols-3 gap-3">
              {[
                { label: 'Payout amount', value: `₦${((myEntry?.amount ?? 0) / 1000).toFixed(0)}k` },
                { label: 'Rounds ahead', value: myPayoutReceived ? '—' : `${membersAhead} member${membersAhead !== 1 ? 's' : ''}` },
                { label: 'Cycle progress', value: `${cycleProgressPct}%` },
              ].map(s => (
                <div key={s.label} className="bg-white/60 rounded-xl px-3 py-2.5 text-center">
                  <p className="text-xs text-[#6B7280]">{s.label}</p>
                  <p className="display-font text-base font-bold text-[#0D1117] mt-0.5">{s.value}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Cycle progress bar */}
          <div className="bg-white rounded-xl border border-[#E2E6F0] px-5 py-4 mb-5">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-bold text-[#0D1117]">Cycle progress</p>
              <p className="text-xs text-[#6B7280]">{paidOutCount} of {g.totalRounds} rounds paid out</p>
            </div>
            <div className="relative h-3 bg-[#F1F3F8] rounded-full overflow-hidden mb-2">
              <div
                className="absolute inset-y-0 left-0 bg-[#1746A2] rounded-full transition-all"
                style={{ width: `${cycleProgressPct}%` }}
              />
              {/* My position marker */}
              <div
                className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-[#059669] border-2 border-white shadow"
                style={{ left: `calc(${((myPosition - 1) / g.totalRounds) * 100}% - 6px)` }}
              />
            </div>
            <div className="flex justify-between text-xs text-[#9CA3AF]">
              <span>Start</span>
              <span className="text-[#1746A2] font-semibold">My payout (#{myPosition})</span>
              <span>End</span>
            </div>
          </div>

          {/* Payout queue */}
          <div className="bg-white rounded-xl border border-[#E2E6F0] overflow-hidden mb-5">
            <div className="px-5 py-3.5 border-b border-[#F1F3F8] bg-[#F8FAFF] flex items-center justify-between">
              <p className="text-sm font-bold text-[#0D1117]">Payout queue</p>
              <p className="text-xs text-[#9CA3AF]">Chronological order</p>
            </div>
            <div className="divide-y divide-[#F1F3F8]">
              {payoutOrder.map((m) => (
                <div
                  key={m.position}
                  className={`flex items-center gap-4 px-5 py-3.5 ${m.isMe ? 'bg-[#EEF2FF]' : m.received ? 'opacity-70' : ''}`}
                >
                  {/* Position badge */}
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${m.received ? 'bg-[#ECFDF5] text-[#059669]' : m.isMe ? 'bg-[#1746A2] text-white ring-2 ring-offset-1 ring-[#1746A2]' : 'bg-[#F1F3F8] text-[#6B7280]'}`}>
                    {m.received ? '✓' : m.position}
                  </div>

                  {/* Name */}
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-semibold truncate ${m.isMe ? 'text-[#1746A2]' : 'text-[#0D1117]'}`}>
                      {m.name}
                      {m.isMe && <span className="ml-2 text-[10px] font-bold bg-[#1746A2] text-white px-1.5 py-0.5 rounded-full">You</span>}
                    </p>
                    <p className="text-xs text-[#9CA3AF] mt-0.5">{m.dueDate}</p>
                  </div>

                  {/* Amount + status */}
                  <div className="text-right shrink-0">
                    <p className="text-sm font-semibold text-[#0D1117]">₦{m.amount.toLocaleString()}</p>
                    <p className={`text-xs mt-0.5 ${m.received ? 'text-[#059669] font-semibold' : m.roundStatus === 'upcoming' ? 'text-[#6B7280]' : 'text-[#9CA3AF]'}`}>
                      {m.received ? 'Received' : 'Upcoming'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Info note */}
          <div className="bg-[#F8FAFF] rounded-xl border border-[#E2E6F0] px-5 py-4 text-sm text-[#6B7280] leading-relaxed">
            <span className="font-semibold text-[#0D1117]">How payout positions work: </span>
            Positions are assigned by the group coordinator before the cycle begins. Each member receives their payout in the round matching their position. You must contribute every round regardless of when your own payout occurs.
          </div>
        </div>
      </div>
    </AppShell>
  )
}
