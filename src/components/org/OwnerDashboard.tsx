import { Button, Badge, Alert } from '../ui'
import { OwnerShell } from './OwnerShell'
import { ORGANIZATION, OWNER_GROUPS, JOIN_REQUESTS, VERIFICATION_QUEUE, UPCOMING_PAYOUTS, RECENT_ACTIVITY } from './data'
import type { View, NavMeta } from '../../App'

interface Props { navigate: (v: View, meta?: NavMeta) => void }

const Icon = ({ path, className = 'h-4 w-4' }: { path: string; className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d={path} />
  </svg>
)

const icons = {
  plus: 'M12 5v14m-7-7h14',
  groups: 'M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2m14-10a4 4 0 100-8 4 4 0 000 8m6 10v-2a4 4 0 00-3-3.87',
  wallet: 'M3 7h18v12H3V7zm3-3h12m0 7h3v4h-3a2 2 0 110-4z',
  alert: 'M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z',
  check: 'M20 6L9 17l-5-5',
  payout: 'M12 3v18m5-14H9.5a3.5 3.5 0 000 7H14a3.5 3.5 0 010 7H6',
  request: 'M18 9v6m3-3h-6M13 7a4 4 0 11-8 0 4 4 0 018 0zM3 21a6 6 0 0112 0',
  arrowRight: 'M5 12h14m-6-6l6 6-6 6',
  activity: 'M4 19V5m0 14h16M8 16v-5m4 5V8m4 8v-8',
  cycle: 'M4 4v6h6M20 20v-6h-6M5 15a7 7 0 0012 3M19 9A7 7 0 007 6',
}

const activityPath: Record<string, string> = {
  join_request: icons.request,
  contribution: icons.wallet,
  payout: icons.payout,
  member_approved: icons.check,
  member_declined: icons.alert,
  cycle_started: icons.cycle,
  group_created: icons.groups,
}

function MetricCard({ label, value, sub, icon, tone = 'blue' }: { label: string; value: string; sub: string; icon: string; tone?: 'blue' | 'green' | 'red' | 'neutral' }) {
  const toneClass = {
    blue: 'bg-[var(--tcs-brand-soft)] text-[var(--tcs-brand)]',
    green: 'bg-[var(--tcs-success-soft)] text-[var(--tcs-success)]',
    red: 'bg-[var(--tcs-danger-soft)] text-[var(--tcs-danger)]',
    neutral: 'bg-[var(--tcs-surface-muted)] text-[var(--tcs-text-muted)]',
  }[tone]

  return (
    <div className="tcs-surface rounded-[var(--tcs-radius-lg)] p-4 sm:p-5">
      <div className="mb-4 flex items-center justify-between gap-3">
        <p className="tcs-label">{label}</p>
        <span className={`flex h-9 w-9 items-center justify-center rounded-[var(--tcs-radius-sm)] ${toneClass}`}>
          <Icon path={icon} />
        </span>
      </div>
      <p className="tcs-kpi text-2xl font-extrabold text-[var(--tcs-text)]">{value}</p>
      <p className="mt-1 text-xs text-[var(--tcs-text-muted)]">{sub}</p>
    </div>
  )
}

export function OwnerDashboard({ navigate }: Props) {
  const pendingRequests = JOIN_REQUESTS.filter(r => r.status === 'pending').length
  const pendingVerifications = VERIFICATION_QUEUE.filter(v => v.status === 'pending').length
  const readyPayouts = UPCOMING_PAYOUTS.filter(p => p.status === 'ready').length
  const inProgressPayouts = UPCOMING_PAYOUTS.filter(p => p.status === 'in-progress')
  const totalContributed = OWNER_GROUPS.reduce((s, g) => s + g.currentRound * g.amount * g.members, 0)
  const totalPendingThisRound = OWNER_GROUPS.reduce((s, g) => s + g.pendingThisRound, 0)

  return (
    <OwnerShell navigate={navigate} activeView="owner-dashboard">
      <main className="flex-1 overflow-y-auto px-[var(--tcs-space-page-x)] py-[var(--tcs-space-page-y)]">
        <div className="mx-auto max-w-7xl">
          <div className="mb-6 flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
            <div>
              <p className="tcs-label mb-2">Organization command center</p>
              <h1 className="display-font text-2xl font-extrabold text-[var(--tcs-text)] sm:text-3xl">
                Good morning, {ORGANIZATION.owner.name.split(' ')[0]}
              </h1>
              <p className="mt-2 text-sm leading-6 text-[var(--tcs-text-muted)]">
                {ORGANIZATION.name} - {ORGANIZATION.groupCount} active groups - {ORGANIZATION.memberCount} members.
              </p>
            </div>
            <Button onClick={() => navigate('owner-group-setup')} className="w-full sm:w-auto">
              <Icon path={icons.plus} />
              Create group
            </Button>
          </div>

          {(pendingRequests > 0 || pendingVerifications > 0 || readyPayouts > 0) && (
            <div className="mb-6 grid gap-3 lg:grid-cols-3">
              {pendingVerifications > 0 && (
                <button onClick={() => navigate('owner-verification')} className="rounded-[var(--tcs-radius-lg)] border border-[#ecc1bd] bg-[var(--tcs-danger-soft)] p-4 text-left transition-colors hover:bg-[#ffe8e6]">
                  <div className="mb-2 flex items-center justify-between gap-3">
                    <span className="flex h-9 w-9 items-center justify-center rounded-[var(--tcs-radius-sm)] bg-white text-[var(--tcs-danger)]">
                      <Icon path={icons.alert} />
                    </span>
                    <Badge variant="rejected">{pendingVerifications} open</Badge>
                  </div>
                  <p className="font-extrabold text-[#9b312c]">Contribution exceptions</p>
                  <p className="mt-1 text-xs leading-5 text-[#9b312c]">Review payment references before affected payouts proceed.</p>
                </button>
              )}
              {pendingRequests > 0 && (
                <button onClick={() => navigate('owner-join-requests')} className="rounded-[var(--tcs-radius-lg)] border border-[#efd38e] bg-[var(--tcs-warning-soft)] p-4 text-left transition-colors hover:bg-[#ffefc4]">
                  <div className="mb-2 flex items-center justify-between gap-3">
                    <span className="flex h-9 w-9 items-center justify-center rounded-[var(--tcs-radius-sm)] bg-white text-[var(--tcs-warning)]">
                      <Icon path={icons.request} />
                    </span>
                    <Badge variant="pending">{pendingRequests} pending</Badge>
                  </div>
                  <p className="font-extrabold text-[#8a5b12]">Join requests waiting</p>
                  <p className="mt-1 text-xs leading-5 text-[#8a5b12]">Approve or decline members requesting entry to your groups.</p>
                </button>
              )}
              {readyPayouts > 0 && (
                <button onClick={() => navigate('owner-payouts')} className="rounded-[var(--tcs-radius-lg)] border border-[#b7dfcc] bg-[var(--tcs-success-soft)] p-4 text-left transition-colors hover:bg-[#ddf3e8]">
                  <div className="mb-2 flex items-center justify-between gap-3">
                    <span className="flex h-9 w-9 items-center justify-center rounded-[var(--tcs-radius-sm)] bg-white text-[var(--tcs-success)]">
                      <Icon path={icons.payout} />
                    </span>
                    <Badge variant="verified">{readyPayouts} ready</Badge>
                  </div>
                  <p className="font-extrabold text-[#08714d]">Payouts ready</p>
                  <p className="mt-1 text-xs leading-5 text-[#08714d]">Record payout execution for completed collection rounds.</p>
                </button>
              )}
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <MetricCard label="Total members" value={`${ORGANIZATION.memberCount}`} sub={`Across ${ORGANIZATION.groupCount} groups`} icon={icons.groups} />
            <MetricCard label="Contributed" value={`NGN ${(totalContributed / 1000000).toFixed(1)}M`} sub="Tracked this year" icon={icons.wallet} />
            <MetricCard label="Exceptions" value={`${pendingVerifications}`} sub={pendingVerifications > 0 ? 'Require owner review' : 'All clear'} icon={icons.alert} tone={pendingVerifications > 0 ? 'red' : 'green'} />
            <MetricCard label="Completed cycles" value={`${ORGANIZATION.totalCyclesCompleted}`} sub="All time" icon={icons.check} tone="green" />
          </div>

          <div className="mt-6 grid gap-6 xl:grid-cols-[1.55fr_0.85fr]">
            <div className="space-y-6">
              <section className="tcs-surface-raised overflow-hidden rounded-[var(--tcs-radius-xl)]">
                <div className="flex items-center justify-between gap-4 border-b border-[var(--tcs-border)] px-5 py-4">
                  <div>
                    <p className="tcs-label mb-1">Group health</p>
                    <h2 className="font-extrabold text-[var(--tcs-text)]">Active groups</h2>
                  </div>
                  <button onClick={() => navigate('owner-groups')} className="tcs-link text-xs">View all</button>
                </div>
                <div className="divide-y divide-[var(--tcs-border)]">
                  {OWNER_GROUPS.map(g => {
                    const cyclePct = Math.round((g.currentRound / g.totalRounds) * 100)
                    const roundPct = Math.round((g.paidThisRound / g.members) * 100)
                    const hasPending = g.pendingThisRound > 0
                    return (
                      <button key={g.id} onClick={() => navigate('owner-groups')} className="grid w-full gap-4 px-5 py-4 text-left transition-colors hover:bg-[var(--tcs-brand-subtle)] md:grid-cols-[1fr_180px_130px] md:items-center">
                        <div className="min-w-0">
                          <div className="mb-2 flex items-center gap-3">
                            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[var(--tcs-radius-sm)] bg-[var(--tcs-brand-soft)] text-[var(--tcs-brand)]">
                              <Icon path={icons.groups} />
                            </span>
                            <div className="min-w-0">
                              <p className="truncate text-sm font-extrabold text-[var(--tcs-text)]">{g.name}</p>
                              <p className="mt-1 text-xs text-[var(--tcs-text-muted)]">{g.members} members - Round {g.currentRound}/{g.totalRounds} - NGN {g.amount.toLocaleString()}/mo</p>
                            </div>
                          </div>
                          <div className="h-2 overflow-hidden rounded-full bg-[var(--tcs-surface-muted)]">
                            <div className="h-full rounded-full bg-[var(--tcs-brand)]" style={{ width: `${cyclePct}%` }} />
                          </div>
                        </div>
                        <div>
                          <div className="mb-2 flex justify-between text-xs">
                            <span className="font-semibold text-[var(--tcs-text-muted)]">This round</span>
                            <span className={`font-extrabold ${hasPending ? 'text-[var(--tcs-danger)]' : 'text-[var(--tcs-success)]'}`}>{g.paidThisRound}/{g.members} paid</span>
                          </div>
                          <div className="h-2 overflow-hidden rounded-full bg-[var(--tcs-surface-muted)]">
                            <div className={`h-full rounded-full ${hasPending ? 'bg-[var(--tcs-warning)]' : 'bg-[var(--tcs-success)]'}`} style={{ width: `${roundPct}%` }} />
                          </div>
                        </div>
                        <div className="flex items-center justify-between gap-3 md:justify-end">
                          <Badge variant={hasPending ? 'pending' : 'verified'}>{hasPending ? `${g.pendingThisRound} pending` : 'On track'}</Badge>
                          <Icon path={icons.arrowRight} className="h-4 w-4 text-[var(--tcs-text-faint)]" />
                        </div>
                      </button>
                    )
                  })}
                </div>
              </section>

              <section className="tcs-surface overflow-hidden rounded-[var(--tcs-radius-xl)]">
                <div className="flex items-center justify-between gap-4 border-b border-[var(--tcs-border)] px-5 py-4">
                  <div>
                    <p className="tcs-label mb-1">Payout readiness</p>
                    <h2 className="font-extrabold text-[var(--tcs-text)]">Upcoming payouts</h2>
                  </div>
                  <button onClick={() => navigate('owner-payouts')} className="tcs-link text-xs">Open tracker</button>
                </div>
                {inProgressPayouts.length === 0 ? (
                  <div className="px-5 py-8">
                    <Alert type="info" title="No payouts in progress">Payouts appear here once a cycle round is underway.</Alert>
                  </div>
                ) : (
                  <div className="divide-y divide-[var(--tcs-border)]">
                    {inProgressPayouts.map(p => {
                      const pct = Math.round((p.contributionsPaid / p.contributionsTotal) * 100)
                      const ready = p.contributionsPaid === p.contributionsTotal
                      return (
                        <button key={p.id} onClick={() => navigate('owner-payouts')} className="w-full px-5 py-4 text-left transition-colors hover:bg-[var(--tcs-brand-subtle)]">
                          <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                            <div>
                              <p className="text-sm font-extrabold text-[var(--tcs-text)]">{p.recipientName}</p>
                              <p className="mt-1 text-xs text-[var(--tcs-text-muted)]">{p.groupName} - Round {p.roundNumber} - Due {p.dueDate}</p>
                            </div>
                            <div className="sm:text-right">
                              <p className="text-sm font-extrabold text-[var(--tcs-text)]">NGN {p.payoutAmount.toLocaleString()}</p>
                              <p className={`mt-1 text-xs font-extrabold ${ready ? 'text-[var(--tcs-success)]' : 'text-[var(--tcs-warning)]'}`}>{ready ? 'Ready to record' : `${p.contributionsPaid}/${p.contributionsTotal} contributions`}</p>
                            </div>
                          </div>
                          <div className="h-2 overflow-hidden rounded-full bg-[var(--tcs-surface-muted)]">
                            <div className={`h-full rounded-full ${ready ? 'bg-[var(--tcs-success)]' : 'bg-[var(--tcs-warning)]'}`} style={{ width: `${pct}%` }} />
                          </div>
                        </button>
                      )
                    })}
                  </div>
                )}
              </section>
            </div>

            <aside className="space-y-5">
              <section className="rounded-[var(--tcs-radius-xl)] bg-[var(--tcs-brand-900)] p-5 text-white shadow-[var(--tcs-shadow-md)]">
                <p className="mb-2 text-xs font-bold uppercase tracking-[0.12em] text-[#9cc7ff]">Operations snapshot</p>
                <h2 className="text-xl font-extrabold">{totalPendingThisRound} member obligations need follow-up this round.</h2>
                <p className="mt-3 text-sm leading-6 text-[#d6e5ff]">Prioritize contribution exceptions first, then join requests and payout records.</p>
                <button
                  onClick={() => navigate('owner-collection')}
                  className="mt-5 flex h-11 w-full items-center justify-center rounded-[var(--tcs-radius-md)] bg-white px-4 text-sm font-extrabold text-[var(--tcs-brand-900)] transition-colors hover:bg-[#eaf1ff]"
                >
                  Open collection operations
                </button>
              </section>

              <section className="tcs-surface rounded-[var(--tcs-radius-lg)] p-5">
                <p className="tcs-label mb-3">Clear next actions</p>
                <div className="space-y-2">
                  {[
                    { label: 'Review contribution exceptions', count: pendingVerifications, view: 'owner-verification' as View, urgent: true, icon: icons.alert },
                    { label: 'Review join requests', count: pendingRequests, view: 'owner-join-requests' as View, icon: icons.request },
                    { label: 'View payout tracker', view: 'owner-payouts' as View, icon: icons.payout },
                    { label: 'Create a new group', view: 'owner-group-setup' as View, icon: icons.plus },
                  ].map(a => (
                    <button
                      key={a.label}
                      onClick={() => navigate(a.view)}
                      className={`flex w-full items-center justify-between rounded-[var(--tcs-radius-sm)] px-3 py-2.5 text-left text-sm font-bold transition-colors ${a.urgent && a.count ? 'text-[var(--tcs-danger)] hover:bg-[var(--tcs-danger-soft)]' : 'text-[var(--tcs-text-soft)] hover:bg-[var(--tcs-surface-muted)] hover:text-[var(--tcs-text)]'}`}
                    >
                      <span className="flex min-w-0 items-center gap-3">
                        <Icon path={a.icon} className="h-4 w-4 shrink-0" />
                        <span className="truncate">{a.label}</span>
                      </span>
                      {a.count != null && a.count > 0 ? (
                        <span className={`flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[10px] font-extrabold ${a.urgent ? 'bg-[var(--tcs-danger-soft)] text-[var(--tcs-danger)]' : 'bg-[var(--tcs-brand-soft)] text-[var(--tcs-brand)]'}`}>{a.count}</span>
                      ) : (
                        <Icon path={icons.arrowRight} className="h-4 w-4 shrink-0 text-[var(--tcs-text-faint)]" />
                      )}
                    </button>
                  ))}
                </div>
              </section>

              <section className="tcs-surface overflow-hidden rounded-[var(--tcs-radius-lg)]">
                <div className="border-b border-[var(--tcs-border)] px-5 py-4">
                  <p className="tcs-label mb-1">Audit trail</p>
                  <h2 className="font-extrabold text-[var(--tcs-text)]">Recent activity</h2>
                </div>
                <div className="divide-y divide-[var(--tcs-border)]">
                  {RECENT_ACTIVITY.slice(0, 5).map(a => (
                    <div key={a.id} className="flex items-start gap-3 px-5 py-4">
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[var(--tcs-radius-sm)] bg-[var(--tcs-surface-muted)] text-[var(--tcs-text-muted)]">
                        <Icon path={activityPath[a.type] ?? icons.activity} className="h-4 w-4" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs leading-5 text-[var(--tcs-text-soft)]">{a.message}</p>
                        <p className="mt-1 text-[11px] font-semibold text-[var(--tcs-text-faint)]">{a.time}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            </aside>
          </div>
        </div>
      </main>
    </OwnerShell>
  )
}
