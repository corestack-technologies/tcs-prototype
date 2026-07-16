import { OwnerShell } from './OwnerShell'
import { ORGANIZATION, OWNER_GROUPS, JOIN_REQUESTS, VERIFICATION_QUEUE, UPCOMING_PAYOUTS, RECENT_ACTIVITY } from './data'
import type { View, NavMeta } from '../../App'

interface Props { navigate: (v: View, meta?: NavMeta) => void }

const activityIcon: Record<string, string> = {
  join_request: '👤',
  contribution: '💳',
  payout: '💰',
  member_approved: '✅',
  member_declined: '❌',
  cycle_started: '🔄',
  group_created: '🏛',
}

export function OwnerDashboard({ navigate }: Props) {
  const pendingRequests = JOIN_REQUESTS.filter(r => r.status === 'pending').length
  const pendingVerifications = VERIFICATION_QUEUE.filter(v => v.status === 'pending').length
  const readyPayouts = UPCOMING_PAYOUTS.filter(p => p.status === 'ready').length
  const inProgressPayouts = UPCOMING_PAYOUTS.filter(p => p.status === 'in-progress')

  const totalContributed = OWNER_GROUPS.reduce((s, g) => s + g.currentRound * g.amount * g.members, 0)

  return (
    <OwnerShell navigate={navigate} activeView="owner-dashboard">
      <div className="flex-1 overflow-y-auto px-6 lg:px-8 py-7">

        {/* Welcome bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-7">
          <div>
            <h1 className="display-font text-2xl font-bold text-[#0D1117]">
              Good morning, {ORGANIZATION.owner.name.split(' ')[0]} 👋
            </h1>
            <p className="text-sm text-[#6B7280] mt-0.5">{ORGANIZATION.name} · {ORGANIZATION.groupCount} active groups · {ORGANIZATION.memberCount} members</p>
          </div>
          <button
            onClick={() => navigate('owner-group-setup')}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#1746A2] text-white text-sm font-semibold rounded-xl hover:bg-[#1339A0] transition-colors shrink-0"
          >
            <svg className="w-4 h-4" viewBox="0 0 16 16" fill="currentColor"><path d="M8 1.5a.75.75 0 01.75.75V7h4.75a.75.75 0 010 1.5H8.75v4.75a.75.75 0 01-1.5 0V8.5H2.5a.75.75 0 010-1.5h4.75V2.25A.75.75 0 018 1.5z" /></svg>
            Create group
          </button>
        </div>

        {/* Urgent alerts */}
        {(pendingRequests > 0 || pendingVerifications > 0 || readyPayouts > 0) && (
          <div className="flex flex-col gap-3 mb-6">
            {pendingVerifications > 0 && (
              <div className="flex items-center justify-between gap-4 bg-[#FEF2F2] border border-[#FECACA] rounded-xl px-5 py-3.5">
                <div className="flex items-center gap-3">
                  <span className="text-lg">⚠️</span>
                  <p className="text-sm font-semibold text-[#991B1B]">{pendingVerifications} contribution exception{pendingVerifications > 1 ? 's' : ''} requiring your review</p>
                </div>
                <button onClick={() => navigate('owner-verification')} className="text-xs font-bold text-[#DC2626] hover:underline shrink-0">Review →</button>
              </div>
            )}
            {pendingRequests > 0 && (
              <div className="flex items-center justify-between gap-4 bg-[#FFFBEB] border border-[#FDE68A] rounded-xl px-5 py-3.5">
                <div className="flex items-center gap-3">
                  <span className="text-lg">👤</span>
                  <p className="text-sm font-semibold text-[#92400E]">{pendingRequests} member join request{pendingRequests > 1 ? 's' : ''} pending review</p>
                </div>
                <button onClick={() => navigate('owner-join-requests')} className="text-xs font-bold text-[#D97706] hover:underline shrink-0">Review →</button>
              </div>
            )}
          </div>
        )}

        {/* Stats grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-7">
          {[
            { label: 'Total members', value: `${ORGANIZATION.memberCount}`, sub: `across ${ORGANIZATION.groupCount} groups`, color: 'text-[#0D1117]' },
            { label: 'Total contributed', value: `₦${(totalContributed / 1000000).toFixed(1)}M`, sub: 'This year', color: 'text-[#1746A2]' },
            { label: 'Contribution exceptions', value: `${pendingVerifications}`, sub: pendingVerifications > 0 ? 'Require review' : 'All clear', color: pendingVerifications > 0 ? 'text-[#DC2626]' : 'text-[#059669]' },
            { label: 'Completed cycles', value: `${ORGANIZATION.totalCyclesCompleted}`, sub: 'All time', color: 'text-[#059669]' },
          ].map(s => (
            <div key={s.label} className="bg-white rounded-xl border border-[#E2E6F0] px-5 py-4">
              <p className="text-xs text-[#9CA3AF] font-medium uppercase tracking-wide mb-1">{s.label}</p>
              <p className={`display-font text-2xl font-bold ${s.color}`}>{s.value}</p>
              <p className="text-xs text-[#6B7280] mt-0.5">{s.sub}</p>
            </div>
          ))}
        </div>

        <div className="grid lg:grid-cols-3 gap-6">

          {/* Groups column (2/3) */}
          <div className="lg:col-span-2 flex flex-col gap-5">

            {/* Active groups */}
            <div className="bg-white rounded-xl border border-[#E2E6F0] overflow-hidden">
              <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#F1F3F8]">
                <p className="text-sm font-bold text-[#0D1117]">Active groups</p>
                <button onClick={() => navigate('owner-groups')} className="text-xs font-semibold text-[#1746A2] hover:underline">View all</button>
              </div>
              {OWNER_GROUPS.map((g, i) => {
                const pct = Math.round((g.currentRound / g.totalRounds) * 100)
                return (
                  <div key={g.id} onClick={() => navigate('owner-groups')} className={`flex items-center gap-4 px-5 py-4 cursor-pointer hover:bg-[#F8FAFF] transition-colors ${i < OWNER_GROUPS.length - 1 ? 'border-b border-[#F1F3F8]' : ''}`}>
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl shrink-0" style={{ background: g.color + '18' }}>{g.emoji}</div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-[#0D1117] truncate">{g.name}</p>
                      <p className="text-xs text-[#9CA3AF] mt-0.5">{g.members} members · Round {g.currentRound}/{g.totalRounds} · ₦{g.amount.toLocaleString()}/mo</p>
                      <div className="h-1.5 bg-[#F1F3F8] rounded-full mt-2 overflow-hidden">
                        <div className="h-full bg-[#1746A2] rounded-full" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-xs font-bold text-[#DC2626]">{g.pendingThisRound} pending</p>
                      <p className="text-xs text-[#9CA3AF]">this round</p>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Upcoming payouts */}
            <div className="bg-white rounded-xl border border-[#E2E6F0] overflow-hidden">
              <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#F1F3F8]">
                <p className="text-sm font-bold text-[#0D1117]">Upcoming payouts</p>
                <button onClick={() => navigate('owner-payouts')} className="text-xs font-semibold text-[#1746A2] hover:underline">View all</button>
              </div>
              {inProgressPayouts.length === 0 ? (
                <div className="px-5 py-8 text-center">
                  <p className="text-sm text-[#9CA3AF]">No payouts in progress.</p>
                </div>
              ) : inProgressPayouts.map((p, i) => {
                const pct = Math.round((p.contributionsPaid / p.contributionsTotal) * 100)
                const ready = p.contributionsPaid === p.contributionsTotal
                return (
                  <div key={p.id} className={`px-5 py-4 ${i < inProgressPayouts.length - 1 ? 'border-b border-[#F1F3F8]' : ''}`}>
                    <div className="flex items-center justify-between gap-3 mb-2">
                      <div>
                        <p className="text-sm font-bold text-[#0D1117]">{p.recipientName}</p>
                        <p className="text-xs text-[#9CA3AF]">{p.groupName} · Round {p.roundNumber} · Due {p.dueDate}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-[#0D1117]">₦{p.payoutAmount.toLocaleString()}</p>
                        <p className={`text-xs font-semibold ${ready ? 'text-[#059669]' : 'text-[#D97706]'}`}>{ready ? 'Ready to dispatch' : `${p.contributionsPaid}/${p.contributionsTotal} paid`}</p>
                      </div>
                    </div>
                    <div className="h-1.5 bg-[#F1F3F8] rounded-full overflow-hidden">
                      <div className={`h-full rounded-full ${ready ? 'bg-[#059669]' : 'bg-[#D97706]'}`} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Activity column (1/3) */}
          <div className="flex flex-col gap-5">

            {/* Quick actions */}
            <div className="bg-white rounded-xl border border-[#E2E6F0] p-4">
              <p className="text-xs font-bold text-[#9CA3AF] uppercase tracking-wide mb-3">Quick actions</p>
              <div className="flex flex-col gap-1.5">
                {[
                  { label: 'Review contribution exceptions', count: pendingVerifications, view: 'owner-verification' as View, urgent: true },
                  { label: 'Review join requests', count: pendingRequests, view: 'owner-join-requests' as View },
                  { label: 'View upcoming payouts', view: 'owner-payouts' as View },
                  { label: 'Create a new group', view: 'owner-group-setup' as View },
                ].map(a => (
                  <button
                    key={a.label}
                    onClick={() => navigate(a.view)}
                    className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg text-sm font-semibold text-left transition-colors ${a.urgent && a.count ? 'text-[#DC2626] hover:bg-[#FEF2F2]' : 'text-[#374151] hover:bg-[#F4F6FA]'}`}
                  >
                    <span>{a.label}</span>
                    {a.count != null && a.count > 0 && (
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${a.urgent ? 'bg-[#FEE2E2] text-[#DC2626]' : 'bg-[#EEF2FF] text-[#1746A2]'}`}>{a.count}</span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Recent activity */}
            <div className="bg-white rounded-xl border border-[#E2E6F0] overflow-hidden">
              <div className="px-5 py-3.5 border-b border-[#F1F3F8]">
                <p className="text-sm font-bold text-[#0D1117]">Recent activity</p>
              </div>
              <div className="divide-y divide-[#F1F3F8]">
                {RECENT_ACTIVITY.slice(0, 5).map(a => (
                  <div key={a.id} className="flex items-start gap-3 px-5 py-3.5">
                    <span className="text-base shrink-0 mt-0.5">{activityIcon[a.type] ?? '📌'}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-[#374151] leading-relaxed">{a.message}</p>
                      <p className="text-[10px] text-[#9CA3AF] mt-1">{a.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>
      </div>
    </OwnerShell>
  )
}
