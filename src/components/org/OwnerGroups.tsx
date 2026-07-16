import { Button, Badge } from '../ui'
import { OwnerShell } from './OwnerShell'
import { OWNER_GROUPS } from './data'
import type { View, NavMeta } from '../../App'

interface Props { navigate: (v: View, meta?: NavMeta) => void }

export function OwnerGroups({ navigate }: Props) {
  const totalMembers = OWNER_GROUPS.reduce((s, g) => s + g.members, 0)

  return (
    <OwnerShell navigate={navigate} activeView="owner-groups">
      {/* Header */}
      <div className="bg-white border-b border-[#E2E6F0] px-6 lg:px-8 py-5 shrink-0">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="display-font text-xl font-bold text-[#0D1117]">My groups</h1>
            <p className="text-sm text-[#6B7280] mt-0.5">{OWNER_GROUPS.length} groups · {totalMembers} total members</p>
          </div>
          <Button onClick={() => navigate('owner-group-setup')}>
            + Set up new group
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-6 lg:px-8 py-6">

        {OWNER_GROUPS.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-16 h-16 rounded-2xl bg-[#EEF2FF] flex items-center justify-center text-3xl mb-4">🏛</div>
            <p className="text-sm font-bold text-[#374151] mb-1">No groups yet</p>
            <p className="text-sm text-[#9CA3AF] mb-6">Create your first thrift group to get started.</p>
            <Button onClick={() => navigate('owner-group-setup')}>Set up first group</Button>
          </div>
        ) : (
          <div className="flex flex-col gap-5">
            {OWNER_GROUPS.map(g => {
              const cyclePct = Math.round((g.currentRound / g.totalRounds) * 100)
              const paidPct = Math.round((g.paidThisRound / g.members) * 100)

              return (
                <div key={g.id} className="bg-white rounded-xl border border-[#E2E6F0] overflow-hidden">
                  {/* Color accent */}
                  <div className="h-1.5" style={{ background: g.color }} />

                  <div className="p-6">
                    <div className="flex items-start justify-between gap-4 mb-5">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl shrink-0" style={{ background: g.color + '18' }}>
                          {g.emoji}
                        </div>
                        <div>
                          <h2 className="display-font text-base font-bold text-[#0D1117]">{g.name}</h2>
                          <p className="text-xs text-[#9CA3AF] mt-0.5">{g.cycleStart} – {g.cycleEnd} · {g.frequency}</p>
                        </div>
                      </div>
                      <Badge variant={g.status === 'active' ? 'verified' : 'not-started'}>
                        {g.status === 'active' ? 'Active' : g.status}
                      </Badge>
                    </div>

                    {/* Stats grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
                      {[
                        { label: 'Members', value: `${g.members}/${g.maxMembers}` },
                        { label: 'Contribution', value: `₦${g.amount.toLocaleString()}` },
                        { label: 'Current round', value: `${g.currentRound} of ${g.totalRounds}` },
                        { label: 'This round', value: `${g.paidThisRound} paid`, alert: g.pendingThisRound > 0 },
                      ].map(s => (
                        <div key={s.label} className="bg-[#F8FAFF] rounded-lg px-3 py-2.5">
                          <p className="text-[10px] text-[#9CA3AF] uppercase tracking-wide">{s.label}</p>
                          <p className={`text-sm font-bold mt-0.5 ${s.alert ? 'text-[#D97706]' : 'text-[#0D1117]'}`}>{s.value}</p>
                        </div>
                      ))}
                    </div>

                    {/* Cycle progress */}
                    <div className="mb-2">
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-[#9CA3AF]">Cycle progress</span>
                        <span className="font-semibold text-[#0D1117]">{cyclePct}%</span>
                      </div>
                      <div className="h-2 bg-[#F1F3F8] rounded-full overflow-hidden">
                        <div className="h-full bg-[#1746A2] rounded-full" style={{ width: `${cyclePct}%` }} />
                      </div>
                    </div>

                    {/* Round contributions progress */}
                    <div className="mb-5">
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-[#9CA3AF]">Round {g.currentRound} contributions</span>
                        <span className={`font-semibold ${g.pendingThisRound > 0 ? 'text-[#D97706]' : 'text-[#059669]'}`}>{g.paidThisRound}/{g.members} confirmed</span>
                      </div>
                      <div className="h-2 bg-[#F1F3F8] rounded-full overflow-hidden">
                        <div className={`h-full rounded-full ${paidPct === 100 ? 'bg-[#059669]' : 'bg-[#D97706]'}`} style={{ width: `${paidPct}%` }} />
                      </div>
                    </div>

                    {/* Next payout */}
                    <div className="bg-[#EEF2FF] rounded-xl px-4 py-3 mb-5">
                      <p className="text-xs text-[#6B7280] mb-0.5">Next payout</p>
                      <p className="text-sm font-bold text-[#1746A2]">{g.nextPayoutRecipient} — ₦{g.nextPayoutAmount.toLocaleString()}</p>
                      <p className="text-xs text-[#9CA3AF]">Due {g.nextPayoutDate}</p>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-wrap gap-2">
                      <Button size="sm" onClick={() => navigate('owner-cycles')}>View cycle</Button>
                      <Button size="sm" variant="secondary" onClick={() => navigate('owner-verification')}>Verify contributions</Button>
                      <Button size="sm" variant="secondary" onClick={() => navigate('owner-payouts')}>Manage payouts</Button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </OwnerShell>
  )
}
