import { useState } from 'react'
import { Badge, Button, Alert } from '../ui'
import { AppShell } from './AppShell'
import type { View, NavMeta } from '../../App'

interface Props {
  navigate: (v: View, meta?: NavMeta) => void
  mode: 'new' | 'active'
}

const GROUPS = [
  {
    id: 'g1',
    name: 'Lagos Mainland Ajo',
    role: 'Member',
    members: 12,
    monthlyAmount: 20000,
    cycle: 'Monthly',
    myPosition: 5,
    nextPayout: 'Aug 2025',
    collected: 4,
    total: 12,
    status: 'active' as const,
    tone: 'blue' as const,
  },
  {
    id: 'g2',
    name: "Surulere Women's Thrift",
    role: 'Member',
    members: 8,
    monthlyAmount: 15000,
    cycle: 'Monthly',
    myPosition: 2,
    nextPayout: 'Next month',
    collected: 7,
    total: 8,
    status: 'active' as const,
    tone: 'green' as const,
  },
]

const UPCOMING = [
  { group: 'Lagos Mainland Ajo', dueDate: '1 Aug 2025', amount: 20000, daysLeft: 6, groupId: 'g1' },
  { group: "Surulere Women's Thrift", dueDate: '5 Aug 2025', amount: 15000, daysLeft: 10, groupId: 'g2' },
]

const ACTIVITY = [
  { type: 'paid', group: 'Lagos Mainland Ajo', amount: 20000, date: '1 Jul 2025', note: 'July contribution' },
  { type: 'received', group: "Surulere Women's Thrift", amount: 120000, date: '5 Jun 2025', note: 'Payout received - position #1' },
  { type: 'paid', group: "Surulere Women's Thrift", amount: 15000, date: '5 Jun 2025', note: 'June contribution' },
  { type: 'paid', group: 'Lagos Mainland Ajo', amount: 20000, date: '1 Jun 2025', note: 'June contribution' },
  { type: 'joined', group: 'Lagos Mainland Ajo', amount: 0, date: '15 May 2025', note: 'Joined group' },
]

const ANNOUNCEMENTS = [
  { id: 'a1', group: 'Lagos Mainland Ajo', title: 'Contribution date reminder', body: 'Your next contribution of NGN 20,000 is due on 1 August 2025. Please ensure funds are ready.', time: '2 hours ago', unread: true },
  { id: 'a2', group: "Surulere Women's Thrift", title: 'Payout schedule updated', body: 'The coordinator has updated the payout schedule for the remainder of 2025. View details in your group.', time: '1 day ago', unread: true },
  { id: 'a3', group: 'System', title: 'Your identity is verified', body: 'Your NIN and documents have been verified. You are now fully eligible to participate in thrift groups.', time: '3 days ago', unread: false },
]

const Icon = ({ path, className = 'h-4 w-4' }: { path: string; className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d={path} />
  </svg>
)

const icons = {
  wallet: 'M3 7h18v12H3V7zm3-3h12m0 7h3v4h-3a2 2 0 110-4z',
  calendar: 'M8 2v4m8-4v4M3 10h18M5 4h14a2 2 0 012 2v14H3V6a2 2 0 012-2z',
  groups: 'M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2m14-10a4 4 0 100-8 4 4 0 000 8m6 10v-2a4 4 0 00-3-3.87',
  payout: 'M12 3v18m5-14H9.5a3.5 3.5 0 000 7H14a3.5 3.5 0 010 7H6',
  arrowRight: 'M5 12h14m-6-6l6 6-6 6',
  bell: 'M18 8a6 6 0 10-12 0c0 7-3 7-3 7h18s-3 0-3-7m-8 11a2 2 0 004 0',
  check: 'M20 6L9 17l-5-5',
  search: 'M11 19a8 8 0 100-16 8 8 0 000 16zm10 2l-4.35-4.35',
  shield: 'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z',
  close: 'M6 18L18 6M6 6l12 12',
  trend: 'M3 17l6-6 4 4 7-8m0 0v6m0-6h-6',
  clock: 'M12 8v5l3 2m6-3a9 9 0 11-18 0 9 9 0 0118 0z',
}

function Money({ value }: { value: number }) {
  return <span className="tcs-kpi">NGN {value.toLocaleString()}</span>
}

function SectionHeader({ title, action, onAction }: { title: string; action?: string; onAction?: () => void }) {
  return (
    <div className="mb-3 flex items-center justify-between gap-4">
      <div>
        <h2 className="display-font text-base font-extrabold text-[var(--tcs-text)]">{title}</h2>
      </div>
      {action && (
        <button onClick={onAction} className="tcs-link text-xs">
          {action}
        </button>
      )}
    </div>
  )
}

function StatCard({ label, value, sub, icon, tone = 'blue' }: { label: string; value: string; sub?: string; icon: string; tone?: 'blue' | 'green' | 'amber' | 'neutral' }) {
  const toneClass = {
    blue: 'bg-[var(--tcs-brand-soft)] text-[var(--tcs-brand)]',
    green: 'bg-[var(--tcs-success-soft)] text-[var(--tcs-success)]',
    amber: 'bg-[var(--tcs-warning-soft)] text-[var(--tcs-warning)]',
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
      {sub && <p className="mt-1 text-xs text-[var(--tcs-text-muted)]">{sub}</p>}
    </div>
  )
}

function VerificationBanner({ navigate }: { navigate: (v: View, meta?: NavMeta) => void }) {
  return (
    <Alert type="warning" title="Identity verification pending" className="mb-6">
      Your documents are being reviewed. You can explore communities, and thrift participation opens after verification.
      <button onClick={() => navigate('dashboard')} className="ml-1 font-extrabold underline underline-offset-2">View status</button>
    </Alert>
  )
}

function NewUserDashboard({ navigate }: { navigate: (v: View, meta?: NavMeta) => void }) {
  const steps = [
    { label: 'Account created', done: true, detail: 'Email and phone are ready for use.' },
    { label: 'Identity verification', done: false, active: true, detail: 'Documents under review - usually 1 to 2 business days.' },
    { label: 'Join a community', done: false, detail: 'Browse public thrift groups after verification.' },
    { label: 'Make first contribution', done: false, detail: 'Track obligations and confirmations from your dashboard.' },
  ]

  return (
    <main className="flex-1 overflow-y-auto px-[var(--tcs-space-page-x)] py-[var(--tcs-space-page-y)]">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="tcs-label mb-2">Member dashboard</p>
            <h1 className="display-font text-2xl font-extrabold text-[var(--tcs-text)] sm:text-3xl">Welcome to TCS, Adaeze</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--tcs-text-muted)]">Your account is ready. Complete verification, then join a thrift community that matches your budget and schedule.</p>
          </div>
          <Button onClick={() => navigate('discover')} className="w-full sm:w-auto">
            <Icon path={icons.search} />
            Browse communities
          </Button>
        </div>

        <VerificationBanner navigate={navigate} />

        <div className="grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
          <section className="tcs-surface-raised rounded-[var(--tcs-radius-xl)] p-5 sm:p-6">
            <div className="mb-6 flex items-center justify-between gap-4">
              <div>
                <p className="tcs-label mb-2">Getting started</p>
                <h2 className="text-lg font-extrabold text-[var(--tcs-text)]">Your path to participation</h2>
              </div>
              <Badge variant="pending">In review</Badge>
            </div>

            <div className="space-y-3">
              {steps.map((step, i) => (
                <div key={step.label} className="flex gap-4 rounded-[var(--tcs-radius-md)] border border-[var(--tcs-border)] bg-white p-4">
                  <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-extrabold ${step.done ? 'bg-[var(--tcs-success)] text-white' : step.active ? 'bg-[var(--tcs-brand)] text-white' : 'bg-[var(--tcs-surface-muted)] text-[var(--tcs-text-faint)]'}`}>
                    {step.done ? <Icon path={icons.check} className="h-4 w-4" /> : i + 1}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold text-[var(--tcs-text)]">{step.label}</p>
                    <p className="mt-1 text-xs leading-5 text-[var(--tcs-text-muted)]">{step.detail}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-[var(--tcs-radius-xl)] bg-[var(--tcs-brand-900)] p-5 text-white shadow-[var(--tcs-shadow-md)] sm:p-6">
            <p className="mb-3 inline-flex items-center gap-2 rounded-[var(--tcs-radius-sm)] bg-white/10 px-3 py-1.5 text-xs font-bold uppercase tracking-[0.12em] text-[#bcd4ff]">
              <Icon path={icons.shield} className="h-3.5 w-3.5" />
              Verified communities
            </p>
            <h2 className="text-2xl font-extrabold leading-tight">Find a thrift group with clear rules before you commit.</h2>
            <p className="mt-4 text-sm leading-6 text-[#d6e5ff]">Review contribution amount, group size, payout order and coordinator details in one place.</p>
            <div className="mt-7 grid gap-3 sm:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3">
              {[
                ['Open groups', '18'],
                ['Avg monthly', 'NGN 25k'],
                ['Pending request', '1'],
              ].map(([label, value]) => (
                <div key={label} className="rounded-[var(--tcs-radius-md)] border border-white/12 bg-white/[0.07] p-3">
                  <p className="tcs-kpi text-xl font-extrabold">{value}</p>
                  <p className="mt-1 text-[11px] text-[#bcd4ff]">{label}</p>
                </div>
              ))}
            </div>
          </section>
        </div>

        <section className="mt-7">
          <SectionHeader title="Popular near you" action="See all" onAction={() => navigate('discover')} />
          <div className="grid gap-4 md:grid-cols-3">
            {[
              { name: 'Lagos Island Ajo', members: 12, amount: 25000, cycle: 'Monthly', spots: 3 },
              { name: 'Yaba Tech Thrift', members: 10, amount: 10000, cycle: 'Monthly', spots: 2 },
              { name: 'Mainland Savers', members: 15, amount: 50000, cycle: 'Monthly', spots: 1 },
            ].map(c => (
              <button
                key={c.name}
                onClick={() => navigate('community-detail', { communityId: c.name })}
                className="tcs-surface rounded-[var(--tcs-radius-lg)] p-5 text-left transition-all hover:border-[#c7d6f6] hover:shadow-[var(--tcs-shadow-md)]"
              >
                <div className="mb-4 flex items-center justify-between gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-[var(--tcs-radius-sm)] bg-[var(--tcs-brand-soft)] text-[var(--tcs-brand)]">
                    <Icon path={icons.groups} />
                  </span>
                  <Badge variant="verified">{c.spots} spots</Badge>
                </div>
                <p className="font-extrabold text-[var(--tcs-text)]">{c.name}</p>
                <p className="mt-2 text-sm text-[var(--tcs-text-muted)]">{c.members} members - NGN {c.amount.toLocaleString()} / {c.cycle.toLowerCase()}</p>
              </button>
            ))}
          </div>
        </section>
      </div>
    </main>
  )
}

function ActiveDashboard({ navigate }: { navigate: (v: View, meta?: NavMeta) => void }) {
  const [dismissedAnnouncements, setDismissedAnnouncements] = useState<string[]>([])
  const totalContributed = 110000
  const totalReceived = 120000
  const visibleAnnouncements = ANNOUNCEMENTS.filter(a => !dismissedAnnouncements.includes(a.id))

  return (
    <main className="flex-1 overflow-y-auto px-[var(--tcs-space-page-x)] py-[var(--tcs-space-page-y)]">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6 flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <p className="tcs-label mb-2">Member dashboard</p>
            <h1 className="display-font text-2xl font-extrabold text-[var(--tcs-text)] sm:text-3xl">Good morning, Adaeze</h1>
            <p className="mt-2 text-sm leading-6 text-[var(--tcs-text-muted)]">Tuesday, 29 July 2025 - next contribution is due in <strong className="font-extrabold text-[var(--tcs-danger)]">6 days</strong>.</p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Button variant="secondary" onClick={() => navigate('pending-approval')}>
              <Icon path={icons.clock} />
              Pending requests
            </Button>
            <Button onClick={() => navigate('discover')}>
              <Icon path={icons.search} />
              Browse groups
            </Button>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard label="Active groups" value={String(GROUPS.length)} sub="Currently participating" icon={icons.groups} />
          <StatCard label="Contributed" value={`NGN ${(totalContributed / 1000).toFixed(0)}k`} sub="Across all groups" icon={icons.wallet} />
          <StatCard label="Received" value={`NGN ${(totalReceived / 1000).toFixed(0)}k`} sub="Payouts received" icon={icons.payout} tone="green" />
          <StatCard label="Next payout" value="Aug 2025" sub="Lagos Mainland Ajo - position 5" icon={icons.trend} tone="amber" />
        </div>

        <div className="mt-6 grid gap-6 xl:grid-cols-[1.55fr_0.85fr]">
          <div className="space-y-6">
            <section className="tcs-surface-raised rounded-[var(--tcs-radius-xl)] p-5 sm:p-6">
              <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="tcs-label mb-2">Upcoming obligation</p>
                  <h2 className="text-xl font-extrabold text-[var(--tcs-text)]">Lagos Mainland Ajo</h2>
                  <p className="mt-1 text-sm text-[var(--tcs-text-muted)]">Round contribution due 1 Aug 2025.</p>
                </div>
                <div className="rounded-[var(--tcs-radius-md)] bg-[var(--tcs-danger-soft)] px-4 py-3 text-right">
                  <p className="text-xs font-bold text-[var(--tcs-danger)]">Due in</p>
                  <p className="tcs-kpi text-2xl font-extrabold text-[var(--tcs-danger)]">6 days</p>
                </div>
              </div>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="rounded-[var(--tcs-radius-md)] border border-[var(--tcs-border)] bg-white p-4">
                  <p className="tcs-label">Amount</p>
                  <p className="mt-2 text-xl font-extrabold text-[var(--tcs-text)]"><Money value={20000} /></p>
                </div>
                <div className="rounded-[var(--tcs-radius-md)] border border-[var(--tcs-border)] bg-white p-4">
                  <p className="tcs-label">Payout position</p>
                  <p className="mt-2 text-xl font-extrabold text-[var(--tcs-brand)]">#5 of 12</p>
                </div>
                <div className="rounded-[var(--tcs-radius-md)] border border-[var(--tcs-border)] bg-white p-4">
                  <p className="tcs-label">Cycle progress</p>
                  <p className="mt-2 text-xl font-extrabold text-[var(--tcs-text)]">4 / 12</p>
                </div>
              </div>
              <div className="mt-5 flex flex-col gap-3 sm:flex-row">
                <Button onClick={() => navigate('contribution-schedule', { groupId: 'g1' })} className="w-full sm:w-auto">
                  View contribution schedule
                </Button>
                <Button variant="secondary" onClick={() => navigate('payout-position', { groupId: 'g1' })} className="w-full sm:w-auto">
                  Check payout position
                </Button>
              </div>
            </section>

            <section>
              <SectionHeader title="My thrift groups" action="Discover more" onAction={() => navigate('discover')} />
              <div className="grid gap-4 lg:grid-cols-2">
                {GROUPS.map(group => {
                  const progress = Math.round((group.collected / group.total) * 100)
                  const toneClass = group.tone === 'green' ? 'bg-[var(--tcs-success-soft)] text-[var(--tcs-success)]' : 'bg-[var(--tcs-brand-soft)] text-[var(--tcs-brand)]'
                  return (
                    <button key={group.id} onClick={() => navigate('group-detail', { groupId: group.id })} className="tcs-surface rounded-[var(--tcs-radius-lg)] p-5 text-left transition-all hover:border-[#c7d6f6] hover:shadow-[var(--tcs-shadow-md)]">
                      <div className="mb-4 flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <span className={`flex h-10 w-10 items-center justify-center rounded-[var(--tcs-radius-sm)] ${toneClass}`}>
                            <Icon path={icons.groups} />
                          </span>
                          <div>
                            <p className="font-extrabold text-[var(--tcs-text)]">{group.name}</p>
                            <p className="mt-1 text-xs text-[var(--tcs-text-muted)]">{group.members} members - {group.cycle}</p>
                          </div>
                        </div>
                        <Badge variant="verified">Active</Badge>
                      </div>
                      <div className="mb-4">
                        <div className="mb-2 flex justify-between text-xs">
                          <span className="font-semibold text-[var(--tcs-text-muted)]">Cycle progress</span>
                          <span className="font-extrabold text-[var(--tcs-text)]">{progress}%</span>
                        </div>
                        <div className="h-2 overflow-hidden rounded-full bg-[var(--tcs-surface-muted)]">
                          <div className={`h-full rounded-full ${group.tone === 'green' ? 'bg-[var(--tcs-success)]' : 'bg-[var(--tcs-brand)]'}`} style={{ width: `${progress}%` }} />
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-3 border-t border-[var(--tcs-border)] pt-4 text-sm">
                        <div>
                          <p className="text-xs text-[var(--tcs-text-faint)]">Amount</p>
                          <p className="mt-1 font-extrabold text-[var(--tcs-text)]">NGN {(group.monthlyAmount / 1000).toFixed(0)}k</p>
                        </div>
                        <div>
                          <p className="text-xs text-[var(--tcs-text-faint)]">Position</p>
                          <p className="mt-1 font-extrabold text-[var(--tcs-brand)]">#{group.myPosition}</p>
                        </div>
                        <div>
                          <p className="text-xs text-[var(--tcs-text-faint)]">Payout</p>
                          <p className="mt-1 font-extrabold text-[var(--tcs-success)]">{group.nextPayout}</p>
                        </div>
                      </div>
                    </button>
                  )
                })}
              </div>
            </section>

            <section>
              <SectionHeader title="Recent activity" action="View history" onAction={() => navigate('contribution-history')} />
              <div className="tcs-surface overflow-hidden rounded-[var(--tcs-radius-lg)]">
                {ACTIVITY.map((item, i) => (
                  <div key={`${item.note}-${item.date}`} className={`flex items-center gap-4 px-5 py-4 ${i < ACTIVITY.length - 1 ? 'border-b border-[var(--tcs-border)]' : ''}`}>
                    <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-[var(--tcs-radius-sm)] ${item.type === 'received' ? 'bg-[var(--tcs-success-soft)] text-[var(--tcs-success)]' : item.type === 'paid' ? 'bg-[var(--tcs-brand-soft)] text-[var(--tcs-brand)]' : 'bg-[var(--tcs-surface-muted)] text-[var(--tcs-text-muted)]'}`}>
                      <Icon path={item.type === 'received' ? icons.payout : item.type === 'paid' ? icons.wallet : icons.groups} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-bold text-[var(--tcs-text)]">{item.note}</p>
                      <p className="mt-1 text-xs text-[var(--tcs-text-muted)]">{item.group} - {item.date}</p>
                    </div>
                    {item.amount > 0 && (
                      <p className={`shrink-0 text-sm font-extrabold ${item.type === 'received' ? 'text-[var(--tcs-success)]' : 'text-[var(--tcs-text)]'}`}>
                        {item.type === 'received' ? '+' : '-'}NGN {item.amount.toLocaleString()}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </section>
          </div>

          <aside className="space-y-5">
            <section className="tcs-surface rounded-[var(--tcs-radius-lg)] p-5">
              <p className="tcs-label mb-4">Upcoming contributions</p>
              <div className="space-y-3">
                {UPCOMING.map(item => (
                  <button key={item.group} onClick={() => navigate('contribution-schedule', { groupId: item.groupId })} className="flex w-full items-center gap-3 rounded-[var(--tcs-radius-md)] border border-[var(--tcs-border)] bg-white p-3 text-left transition-colors hover:bg-[var(--tcs-brand-subtle)]">
                    <div className={`flex h-11 w-11 shrink-0 flex-col items-center justify-center rounded-[var(--tcs-radius-sm)] ${item.daysLeft <= 7 ? 'bg-[var(--tcs-danger-soft)] text-[var(--tcs-danger)]' : 'bg-[var(--tcs-brand-soft)] text-[var(--tcs-brand)]'}`}>
                      <span className="tcs-kpi text-base font-extrabold leading-none">{item.daysLeft}</span>
                      <span className="text-[9px] font-bold uppercase">days</span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-bold text-[var(--tcs-text)]">{item.group}</p>
                      <p className="mt-1 text-xs text-[var(--tcs-text-muted)]">Due {item.dueDate}</p>
                    </div>
                    <p className="text-sm font-extrabold text-[var(--tcs-text)]">NGN {(item.amount / 1000).toFixed(0)}k</p>
                  </button>
                ))}
              </div>
            </section>

            <section className="tcs-surface rounded-[var(--tcs-radius-lg)] p-5">
              <div className="mb-4 flex items-center justify-between gap-3">
                <p className="tcs-label">Notifications</p>
                <Icon path={icons.bell} className="h-4 w-4 text-[var(--tcs-text-muted)]" />
              </div>
              <div className="space-y-3">
                {visibleAnnouncements.length === 0 ? (
                  <div className="rounded-[var(--tcs-radius-md)] border border-[var(--tcs-border)] bg-[var(--tcs-surface-muted)] px-4 py-7 text-center">
                    <p className="text-sm font-bold text-[var(--tcs-text)]">No new notifications</p>
                    <p className="mt-1 text-xs text-[var(--tcs-text-muted)]">You are up to date.</p>
                  </div>
                ) : visibleAnnouncements.map(a => (
                  <div key={a.id} className={`rounded-[var(--tcs-radius-md)] border p-4 ${a.unread ? 'border-[#c7d6f6] bg-[var(--tcs-brand-subtle)]' : 'border-[var(--tcs-border)] bg-white'}`}>
                    <div className="mb-2 flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        {a.unread && <span className="h-2 w-2 shrink-0 rounded-full bg-[var(--tcs-brand)]" />}
                        <p className="text-sm font-extrabold text-[var(--tcs-text)]">{a.title}</p>
                      </div>
                      <button onClick={() => setDismissedAnnouncements(d => [...d, a.id])} className="rounded-[var(--tcs-radius-xs)] p-1 text-[var(--tcs-text-faint)] hover:bg-white hover:text-[var(--tcs-text-muted)]" aria-label="Dismiss notification">
                        <Icon path={icons.close} className="h-3.5 w-3.5" />
                      </button>
                    </div>
                    <p className="text-xs leading-5 text-[var(--tcs-text-muted)]">{a.body}</p>
                    <p className="mt-2 text-[11px] font-semibold text-[var(--tcs-text-faint)]">{a.group} - {a.time}</p>
                  </div>
                ))}
              </div>
            </section>

            <section className="tcs-surface rounded-[var(--tcs-radius-lg)] p-5">
              <p className="tcs-label mb-3">Quick actions</p>
              <div className="space-y-2">
                {[
                  { label: 'Join a community', path: icons.search, action: () => navigate('discover') },
                  { label: 'View contribution history', path: icons.wallet, action: () => navigate('contribution-history') },
                  { label: 'Check payout schedule', path: icons.calendar, action: () => navigate('payout-position', { groupId: 'g1' }) },
                  { label: 'Pending join requests', path: icons.clock, action: () => navigate('pending-approval'), badge: '1' },
                ].map(qa => (
                  <button key={qa.label} onClick={qa.action} className="flex w-full items-center justify-between rounded-[var(--tcs-radius-sm)] px-3 py-2.5 text-left text-sm font-bold text-[var(--tcs-text-soft)] transition-colors hover:bg-[var(--tcs-surface-muted)] hover:text-[var(--tcs-text)]">
                    <span className="flex min-w-0 items-center gap-3">
                      <Icon path={qa.path} className="h-4 w-4 shrink-0 text-[var(--tcs-text-muted)]" />
                      <span className="truncate">{qa.label}</span>
                    </span>
                    {qa.badge ? (
                      <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-[var(--tcs-warning-soft)] px-1.5 text-[10px] font-extrabold text-[#8a5b12]">{qa.badge}</span>
                    ) : (
                      <Icon path={icons.arrowRight} className="h-4 w-4 shrink-0 text-[var(--tcs-text-faint)]" />
                    )}
                  </button>
                ))}
              </div>
            </section>
          </aside>
        </div>
      </div>
    </main>
  )
}

export function ClientDashboard({ navigate, mode }: Props) {
  return (
    <AppShell navigate={navigate} activeView="dashboard">
      <div className="flex shrink-0 items-center justify-between border-b border-[var(--tcs-border)] bg-[var(--tcs-surface-raised)] px-[var(--tcs-space-page-x)] py-3">
        <Badge variant={mode === 'active' ? 'verified' : 'pending'}>
          {mode === 'active' ? 'Eligible for thrift' : 'Verification pending'}
        </Badge>
        <div className="flex items-center gap-2">
          <button className="relative rounded-[var(--tcs-radius-sm)] p-2 text-[var(--tcs-text-muted)] transition-colors hover:bg-[var(--tcs-surface-muted)]" aria-label="Notifications">
            <Icon path={icons.bell} className="h-5 w-5" />
            {mode === 'active' && <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-[var(--tcs-danger)]" />}
          </button>
          <div className="hidden h-8 w-8 items-center justify-center rounded-[var(--tcs-radius-sm)] bg-[var(--tcs-brand-900)] text-xs font-extrabold text-white sm:flex">AO</div>
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-3 border-b border-[#efd38e] bg-[var(--tcs-warning-soft)] px-[var(--tcs-space-page-x)] py-2">
        <span className="text-xs font-bold text-[#8a5b12]">Demo mode</span>
        <button
          onClick={() => navigate(mode === 'active' ? 'dashboard-new' : 'dashboard')}
          className="tcs-link text-xs"
        >
          Switch to {mode === 'active' ? 'new user' : 'active member'} view
        </button>
      </div>

      {mode === 'new' ? (
        <NewUserDashboard navigate={navigate} />
      ) : (
        <ActiveDashboard navigate={navigate} />
      )}
    </AppShell>
  )
}
