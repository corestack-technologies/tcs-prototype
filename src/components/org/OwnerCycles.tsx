import { useState } from 'react'
import { Badge } from '../ui'
import { OwnerShell } from './OwnerShell'
import { ACTIVE_CYCLES } from './data'
import type { View, NavMeta } from '../../App'

interface Props { navigate: (v: View, meta?: NavMeta) => void }

export function OwnerCycles({ navigate }: Props) {
  const [activeGroup, setActiveGroup] = useState(ACTIVE_CYCLES[0].groupId)
  const cycle = ACTIVE_CYCLES.find(c => c.groupId === activeGroup) ?? ACTIVE_CYCLES[0]
  const cyclePct = Math.round((cycle.currentRound / cycle.totalRounds) * 100)
  const paidCount = cycle.members.filter(m => m.status === 'paid').length

  return (
    <OwnerShell navigate={navigate} activeView="owner-cycles">
      <div className="bg-white border-b border-[#E2E6F0] px-6 lg:px-8 py-5 shrink-0">
        <h1 className="display-font text-xl font-bold text-[#0D1117]">Active cycles</h1>
        <p className="text-sm text-[#6B7280] mt-0.5">{ACTIVE_CYCLES.length} cycles running</p>
      </div>

      <div className="flex-1 overflow-y-auto px-6 lg:px-8 py-6">
        <div className="max-w-3xl">

          {/* Group tabs */}
          <div className="flex gap-1 p-1 bg-white rounded-xl border border-[#E2E6F0] w-fit mb-6">
            {ACTIVE_CYCLES.map(c => (
              <button
                key={c.groupId}
                onClick={() => setActiveGroup(c.groupId)}
                className={`px-4 py-2 text-sm font-semibold rounded-lg transition-colors ${activeGroup === c.groupId ? 'bg-[#1746A2] text-white' : 'text-[#6B7280] hover:text-[#0D1117]'}`}
              >
                {c.emoji} {c.groupName.split(' ')[0]}
              </button>
            ))}
          </div>

          {/* Cycle header */}
          <div className="bg-white rounded-xl border border-[#E2E6F0] p-5 mb-5">
            <div className="flex items-start justify-between gap-4 mb-4">
              <div>
                <h2 className="display-font text-lg font-bold text-[#0D1117]">{cycle.groupName}</h2>
                <p className="text-sm text-[#6B7280]">Cycle {cycle.cycleNumber} · {cycle.startDate} – {cycle.endDate}</p>
              </div>
              <Badge variant="verified">Active</Badge>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
              {[
                { label: 'Current round', value: `${cycle.currentRound} / ${cycle.totalRounds}` },
                { label: 'Members', value: `${cycle.membersCount}` },
                { label: 'Contribution', value: `₦${cycle.amount.toLocaleString()}` },
                { label: 'Total contributed', value: `₦${(cycle.totalContributed / 1000000).toFixed(2)}M` },
              ].map(s => (
                <div key={s.label} className="bg-[#F8FAFF] rounded-lg px-3 py-2.5">
                  <p className="text-[10px] text-[#9CA3AF] uppercase tracking-wide">{s.label}</p>
                  <p className="text-sm font-bold text-[#0D1117] mt-0.5">{s.value}</p>
                </div>
              ))}
            </div>

            {/* Cycle progress */}
            <div className="mb-1">
              <div className="flex justify-between text-xs mb-1.5">
                <span className="text-[#6B7280]">Cycle progress</span>
                <span className="font-bold text-[#1746A2]">{cyclePct}%</span>
              </div>
              <div className="h-3 bg-[#F1F3F8] rounded-full overflow-hidden">
                <div className="h-full bg-[#1746A2] rounded-full transition-all" style={{ width: `${cyclePct}%` }} />
              </div>
            </div>
            <p className="text-xs text-[#9CA3AF] mt-1">Next round due: {cycle.nextRoundDue}</p>
          </div>

          {/* Member contribution status */}
          <div className="bg-white rounded-xl border border-[#E2E6F0] overflow-hidden">
            <div className="px-5 py-3.5 border-b border-[#F1F3F8] bg-[#F8FAFF] flex items-center justify-between">
              <p className="text-sm font-bold text-[#0D1117]">Round {cycle.currentRound} — member status</p>
              <p className="text-xs text-[#6B7280]">{paidCount}/{cycle.membersCount} confirmed</p>
            </div>
            <div className="divide-y divide-[#F1F3F8]">
              {cycle.members.map(m => (
                <div key={m.position} className={`flex items-center gap-4 px-5 py-3.5 ${m.isPayoutRecipient ? 'bg-[#EEF2FF]' : ''}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${m.status === 'paid' ? 'bg-[#ECFDF5] text-[#059669]' : m.status === 'overdue' ? 'bg-[#FEF2F2] text-[#DC2626]' : 'bg-[#F1F3F8] text-[#9CA3AF]'}`}>
                    {m.status === 'paid' ? '✓' : m.position}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-[#0D1117] truncate">
                      {m.name}
                      {m.isPayoutRecipient && <span className="ml-2 text-[10px] font-bold text-[#1746A2] bg-[#EEF2FF] px-1.5 py-0.5 rounded-full">Payout recipient</span>}
                    </p>
                    <p className="text-xs text-[#9CA3AF]">Position #{m.position}</p>
                  </div>
                  <div>
                    {m.status === 'paid'
                      ? <Badge variant="verified">Paid</Badge>
                      : m.status === 'overdue'
                        ? <Badge variant="rejected">Overdue</Badge>
                        : <Badge variant="pending">Pending</Badge>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </OwnerShell>
  )
}
