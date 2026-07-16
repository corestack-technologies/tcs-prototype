import { useState } from 'react'
import { Badge, Button, Alert } from '../ui'
import { AppShell } from './AppShell'
import type { View, NavMeta } from '../../App'

interface Props {
  navigate: (v: View, meta?: NavMeta) => void
  mode: 'new' | 'active'
}

// ── Sample data ───────────────────────────────────────────────────────────────

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
    color: '#1746A2',
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
    color: '#059669',
  },
]

const UPCOMING = [
  { group: 'Lagos Mainland Ajo', dueDate: '1 Aug 2025', amount: 20000, daysLeft: 6, groupId: 'g1' },
  { group: "Surulere Women's Thrift", dueDate: '5 Aug 2025', amount: 15000, daysLeft: 10, groupId: 'g2' },
]

const ACTIVITY = [
  { type: 'paid', group: 'Lagos Mainland Ajo', amount: 20000, date: '1 Jul 2025', note: 'July contribution' },
  { type: 'received', group: "Surulere Women's Thrift", amount: 120000, date: '5 Jun 2025', note: 'Payout — position #1' },
  { type: 'paid', group: "Surulere Women's Thrift", amount: 15000, date: '5 Jun 2025', note: 'June contribution' },
  { type: 'paid', group: 'Lagos Mainland Ajo', amount: 20000, date: '1 Jun 2025', note: 'June contribution' },
  { type: 'joined', group: 'Lagos Mainland Ajo', amount: 0, date: '15 May 2025', note: 'Joined group' },
]

const ANNOUNCEMENTS = [
  { id: 'a1', group: 'Lagos Mainland Ajo', title: 'Contribution date reminder', body: 'Your next contribution of ₦20,000 is due on 1 August 2025. Please ensure funds are ready.', time: '2 hours ago', unread: true },
  { id: 'a2', group: "Surulere Women's Thrift", title: 'New payout schedule published', body: 'The coordinator has updated the payout schedule for the remainder of 2025. View details in your group.', time: '1 day ago', unread: true },
  { id: 'a3', group: 'System', title: 'Your identity is verified ✓', body: 'Your NIN and documents have been verified. You are now fully eligible to participate in thrift groups.', time: '3 days ago', unread: false },
]

// ── Shared sub-components ─────────────────────────────────────────────────────

function SectionHeader({ title, action, onAction }: { title: string; action?: string; onAction?: () => void }) {
  return (
    <div className="flex items-center justify-between mb-4">
      <h2 className="display-font text-base font-bold text-[#0D1117]">{title}</h2>
      {action && (
        <button onClick={onAction} className="text-xs font-semibold text-[#1746A2] hover:underline">
          {action}
        </button>
      )}
    </div>
  )
}

function StatCard({ label, value, sub, color }: { label: string; value: string; sub?: string; color?: string }) {
  return (
    <div className="bg-white rounded-xl border border-[#E2E6F0] px-5 py-4">
      <p className="text-xs text-[#9CA3AF] font-medium uppercase tracking-wide mb-1.5">{label}</p>
      <p className={`display-font text-2xl font-bold ${color ?? 'text-[#0D1117]'}`}>{value}</p>
      {sub && <p className="text-xs text-[#6B7280] mt-0.5">{sub}</p>}
    </div>
  )
}

function VerificationBanner({ navigate }: { navigate: (v: View, meta?: NavMeta) => void }) {
  return (
    <div className="bg-[#FFFBEB] border border-[#FDE68A] rounded-xl px-5 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
      <div className="flex items-start gap-3">
        <div className="w-8 h-8 rounded-full bg-[#FEF3C7] flex items-center justify-center shrink-0 mt-0.5">
          <svg className="w-4 h-4 text-[#D97706]" viewBox="0 0 16 16" fill="currentColor">
            <path d="M8 1a7 7 0 100 14A7 7 0 008 1zm-.75 4.25a.75.75 0 011.5 0v3a.75.75 0 01-1.5 0v-3zm.75 6.5a.875.875 0 110-1.75.875.875 0 010 1.75z" />
          </svg>
        </div>
        <div>
          <p className="text-sm font-semibold text-[#92400E]">Identity verification pending</p>
          <p className="text-xs text-[#92400E] leading-relaxed mt-0.5">
            Your documents are being reviewed. You can explore communities but cannot join until verified.
          </p>
        </div>
      </div>
      <button onClick={() => navigate('dashboard')} className="shrink-0 text-xs font-semibold text-[#92400E] underline underline-offset-2">
        View status
      </button>
    </div>
  )
}

// ── New user experience ───────────────────────────────────────────────────────

function NewUserDashboard({ navigate }: { navigate: (v: View, meta?: NavMeta) => void }) {
  return (
    <main className="flex-1 px-6 lg:px-8 py-7 overflow-y-auto">

      {/* Welcome */}
      <div className="mb-6">
        <h1 className="display-font text-2xl font-bold text-[#0D1117] mb-1">Welcome to TCS, Adaeze</h1>
        <p className="text-sm text-[#6B7280]">Your thrift journey starts here. Join a community and begin contributing.</p>
      </div>

      {/* Verification banner */}
      <div className="mb-6">
        <VerificationBanner navigate={navigate} />
      </div>

      {/* Getting started checklist */}
      <div className="mb-8">
        <SectionHeader title="Getting started" />
        <div className="bg-white rounded-xl border border-[#E2E6F0] overflow-hidden">
          {[
            { label: 'Create your account', done: true, detail: 'Account created and email verified' },
            { label: 'Complete identity verification', done: false, active: true, detail: 'Documents under review — 1–2 business days' },
            { label: 'Join a thrift community', done: false, detail: 'Discover and join a group near you' },
            { label: 'Make your first contribution', done: false, detail: 'Contribute on your due date to stay on track' },
          ].map((step, i, arr) => (
            <div key={i} className={`flex items-center gap-4 px-5 py-4 ${i < arr.length - 1 ? 'border-b border-[#F1F3F8]' : ''}`}>
              <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${step.done ? 'bg-[#059669]' : step.active ? 'bg-[#1746A2] ring-2 ring-[#C7D2FE]' : 'bg-[#F1F3F8] border border-[#E2E6F0]'}`}>
                {step.done ? (
                  <svg className="w-3 h-3 text-white" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M2.5 6l2.5 2.5L9.5 3" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                ) : step.active ? (
                  <div className="w-2 h-2 rounded-full bg-white" />
                ) : null}
              </div>
              <div className="flex-1">
                <p className={`text-sm font-semibold ${step.done ? 'text-[#059669]' : step.active ? 'text-[#0D1117]' : 'text-[#9CA3AF]'}`}>{step.label}</p>
                <p className="text-xs text-[#6B7280] mt-0.5">{step.detail}</p>
              </div>
              {step.active && (
                <Badge variant="pending">In progress</Badge>
              )}
              {step.done && (
                <Badge variant="verified">Done</Badge>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Discover CTA — prominent for new users */}
      <div className="mb-8">
        <div className="bg-[#1746A2] rounded-2xl p-6 sm:p-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-48 h-48 rounded-full bg-white/5 -mr-12 -mt-12" />
          <div className="absolute bottom-0 right-16 w-24 h-24 rounded-full bg-white/5 -mb-8" />
          <div className="relative">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-2xl">🏘</span>
              <span className="text-xs font-bold text-[#93C5FD] uppercase tracking-wider">Discover communities</span>
            </div>
            <h3 className="display-font text-xl sm:text-2xl font-bold text-white mb-2 leading-tight">
              Find a thrift group that works for you.
            </h3>
            <p className="text-[#BFDBFE] text-sm leading-relaxed mb-5">
              Browse verified thrift communities near you. Choose your contribution amount, schedule, and group size. Join with one request.
            </p>
            <div className="flex flex-wrap gap-3">
              <Button
                variant="primary"
                className="bg-white text-[#1746A2] hover:bg-[#EEF2FF]"
                onClick={() => navigate('discover')}
              >
                Browse communities →
              </Button>
              <button className="text-sm text-[#93C5FD] font-semibold hover:text-white transition-colors">
                Learn how it works
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Featured communities preview */}
      <div className="mb-8">
        <SectionHeader title="Popular near you" action="See all" onAction={() => navigate('discover')} />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[
            { name: 'Lagos Island Ajo', members: 12, amount: 25000, cycle: 'Monthly', spots: 3 },
            { name: 'Yaba Tech Thrift', members: 10, amount: 10000, cycle: 'Monthly', spots: 2 },
            { name: 'Mainland Savers', members: 15, amount: 50000, cycle: 'Monthly', spots: 1 },
          ].map(c => (
            <button
              key={c.name}
              onClick={() => navigate('community-detail', { communityId: c.name })}
              className="bg-white rounded-xl border border-[#E2E6F0] p-4 text-left hover:border-[#C7D2FE] hover:shadow-md transition-all group"
            >
              <div className="flex items-start justify-between gap-2 mb-3">
                <div className="w-10 h-10 rounded-xl bg-[#EEF2FF] flex items-center justify-center text-lg">🏘</div>
                <span className="text-[10px] font-bold text-[#059669] bg-[#ECFDF5] px-2 py-1 rounded-full">
                  {c.spots} spot{c.spots > 1 ? 's' : ''} left
                </span>
              </div>
              <p className="text-sm font-bold text-[#0D1117] mb-1 group-hover:text-[#1746A2] transition-colors">{c.name}</p>
              <p className="text-xs text-[#6B7280]">{c.members} members · ₦{c.amount.toLocaleString()} / month</p>
            </button>
          ))}
        </div>
      </div>

      {/* How TCS works */}
      <div>
        <SectionHeader title="How TCS works" />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { step: '01', icon: '🔍', title: 'Find a community', body: 'Browse public thrift groups and request to join one that matches your budget and schedule.' },
            { step: '02', icon: '💳', title: 'Contribute monthly', body: 'Each member contributes on their due date. Funds are pooled and paid out to one member per cycle.' },
            { step: '03', icon: '💰', title: 'Receive your payout', body: 'When it is your turn, the full pool is paid directly to your registered bank account.' },
          ].map(item => (
            <div key={item.step} className="bg-white rounded-xl border border-[#E2E6F0] p-5">
              <div className="flex items-center gap-3 mb-3">
                <span className="text-xl">{item.icon}</span>
                <span className="text-xs font-bold text-[#9CA3AF] uppercase tracking-wider">Step {item.step}</span>
              </div>
              <p className="text-sm font-bold text-[#0D1117] mb-1.5">{item.title}</p>
              <p className="text-xs text-[#6B7280] leading-relaxed">{item.body}</p>
            </div>
          ))}
        </div>
      </div>
    </main>
  )
}

// ── Active member experience ──────────────────────────────────────────────────

function ActiveDashboard({ navigate }: { navigate: (v: View, meta?: NavMeta) => void }) {
  const [dismissedAnnouncements, setDismissedAnnouncements] = useState<string[]>([])
  const totalContributed = 110000
  const totalReceived = 120000
  const activeGroups = GROUPS.length

  const visibleAnnouncements = ANNOUNCEMENTS.filter(a => !dismissedAnnouncements.includes(a.id))

  return (
    <main className="flex-1 px-6 lg:px-8 py-7 overflow-y-auto">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-7">
        <div>
          <h1 className="display-font text-2xl font-bold text-[#0D1117] mb-0.5">Good morning, Adaeze</h1>
          <p className="text-sm text-[#6B7280]">Tuesday, 29 July 2025 · Your next contribution is in <strong className="text-[#DC2626]">6 days</strong></p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" size="sm" onClick={() => navigate('discover')}>
            + Join community
          </Button>
          <Button size="sm" onClick={() => navigate('discover')}>
            Browse groups
          </Button>
        </div>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-7">
        <StatCard label="Active groups" value={String(activeGroups)} sub="Currently participating" />
        <StatCard label="Total contributed" value={`₦${(totalContributed / 1000).toFixed(0)}k`} sub="Across all groups" color="text-[#1746A2]" />
        <StatCard label="Total received" value={`₦${(totalReceived / 1000).toFixed(0)}k`} sub="Payouts received" color="text-[#059669]" />
        <StatCard label="Next payout" value="Aug 2025" sub="Lagos Mainland Ajo · Pos. 5" />
      </div>

      {/* Two-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Left column */}
        <div className="lg:col-span-2 flex flex-col gap-6">

          {/* Upcoming contributions */}
          <div>
            <SectionHeader title="Upcoming contributions" action="View all" />
            <div className="flex flex-col gap-3">
              {UPCOMING.map(item => (
                <div key={item.group} className={`bg-white rounded-xl border p-4 flex items-center gap-4 ${item.daysLeft <= 7 ? 'border-[#FECACA]' : 'border-[#E2E6F0]'}`}>
                  <div className={`w-10 h-10 rounded-xl flex flex-col items-center justify-center shrink-0 ${item.daysLeft <= 7 ? 'bg-[#FEF2F2]' : 'bg-[#EEF2FF]'}`}>
                    <span className={`text-base font-bold display-font leading-none ${item.daysLeft <= 7 ? 'text-[#DC2626]' : 'text-[#1746A2]'}`}>{item.daysLeft}</span>
                    <span className="text-[9px] text-[#9CA3AF] font-medium">days</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-[#0D1117] truncate">{item.group}</p>
                    <p className="text-xs text-[#6B7280]">Due {item.dueDate}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-bold text-[#0D1117]">₦{item.amount.toLocaleString()}</p>
                    {item.daysLeft <= 7 && (
                      <p className="text-[10px] text-[#DC2626] font-semibold">Due soon</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* My thrift groups */}
          <div>
            <SectionHeader title="My thrift groups" action="Discover more" onAction={() => navigate('discover')} />
            <div className="flex flex-col gap-4">
              {GROUPS.map(group => {
                const progress = (group.collected / group.total) * 100
                return (
                  <div key={group.id} className="bg-white rounded-xl border border-[#E2E6F0] p-5 hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between gap-3 mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl shrink-0" style={{ background: group.color + '18' }}>
                          🏘
                        </div>
                        <div>
                          <p className="text-sm font-bold text-[#0D1117]">{group.name}</p>
                          <p className="text-xs text-[#6B7280]">{group.members} members · {group.cycle}</p>
                        </div>
                      </div>
                      <Badge variant="verified">Active</Badge>
                    </div>

                    {/* Progress bar */}
                    <div className="mb-3">
                      <div className="flex justify-between text-xs mb-1.5">
                        <span className="text-[#6B7280]">Cycle progress</span>
                        <span className="font-semibold text-[#0D1117]">{group.collected}/{group.total} rounds</span>
                      </div>
                      <div className="h-2 bg-[#F1F3F8] rounded-full overflow-hidden">
                        <div className="h-full rounded-full transition-all" style={{ width: `${progress}%`, background: group.color }} />
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-3 text-center pt-3 border-t border-[#F1F3F8]">
                      <div>
                        <p className="text-xs text-[#9CA3AF]">Monthly</p>
                        <p className="text-sm font-bold text-[#0D1117]">₦{group.monthlyAmount.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-xs text-[#9CA3AF]">My position</p>
                        <p className="text-sm font-bold text-[#1746A2]">#{group.myPosition}</p>
                      </div>
                      <div>
                        <p className="text-xs text-[#9CA3AF]">Next payout</p>
                        <p className="text-sm font-bold text-[#059669]">{group.nextPayout}</p>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Recent activity */}
          <div>
            <SectionHeader title="Recent activity" action="View all" />
            <div className="bg-white rounded-xl border border-[#E2E6F0] overflow-hidden">
              {ACTIVITY.map((item, i) => (
                <div key={i} className={`flex items-center gap-4 px-5 py-3.5 ${i < ACTIVITY.length - 1 ? 'border-b border-[#F1F3F8]' : ''}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${item.type === 'received' ? 'bg-[#ECFDF5]' : item.type === 'paid' ? 'bg-[#EEF2FF]' : 'bg-[#F3F4F6]'}`}>
                    {item.type === 'received' && (
                      <svg className="w-4 h-4 text-[#059669]" viewBox="0 0 16 16" fill="currentColor">
                        <path d="M8 0a8 8 0 100 16A8 8 0 008 0zm.5 11.5v1a.5.5 0 01-1 0v-1A3 3 0 015 8.5h1a2 2 0 002 2v-3l-2-1a2 2 0 010-4v-1a.5.5 0 011 0v1a2 2 0 012 2H8a1 1 0 00-1-1v2l2 1a2 2 0 01.5 3.5z"/>
                      </svg>
                    )}
                    {item.type === 'paid' && (
                      <svg className="w-4 h-4 text-[#1746A2]" viewBox="0 0 16 16" fill="currentColor">
                        <path d="M1 3a1 1 0 011-1h12a1 1 0 011 1v7a1 1 0 01-1 1H2a1 1 0 01-1-1V3zm1 0v7h12V3H2zm6.5 2.5a1.5 1.5 0 110 3 1.5 1.5 0 010-3z"/>
                      </svg>
                    )}
                    {item.type === 'joined' && (
                      <svg className="w-4 h-4 text-[#6B7280]" viewBox="0 0 16 16" fill="currentColor">
                        <path d="M8 8a3 3 0 100-6 3 3 0 000 6zm.5 1H6a4 4 0 00-4 4v.5h1V13a3 3 0 013-3h2.5v-1z"/>
                        <path d="M13.5 9a.5.5 0 01.5.5V11h1.5a.5.5 0 010 1H14v1.5a.5.5 0 01-1 0V12h-1.5a.5.5 0 010-1H13V9.5a.5.5 0 01.5-.5z"/>
                      </svg>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-[#0D1117] truncate">{item.note}</p>
                    <p className="text-xs text-[#9CA3AF]">{item.group} · {item.date}</p>
                  </div>
                  {item.amount > 0 && (
                    <p className={`text-sm font-bold shrink-0 ${item.type === 'received' ? 'text-[#059669]' : 'text-[#0D1117]'}`}>
                      {item.type === 'received' ? '+' : '-'}₦{item.amount.toLocaleString()}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right column */}
        <div className="flex flex-col gap-5">

          {/* Contribution summary */}
          <div className="bg-white rounded-xl border border-[#E2E6F0] p-5">
            <h3 className="display-font text-sm font-bold text-[#0D1117] uppercase tracking-wide mb-4">2025 Summary</h3>
            <div className="flex flex-col gap-3">
              {[
                { label: 'Total contributed', value: '₦110,000', color: 'text-[#1746A2]' },
                { label: 'Total received', value: '₦120,000', color: 'text-[#059669]' },
                { label: 'Rounds completed', value: '7 of 20', color: 'text-[#0D1117]' },
                { label: 'On-time rate', value: '100%', color: 'text-[#059669]' },
              ].map(s => (
                <div key={s.label} className="flex justify-between items-center py-2 border-b border-[#F1F3F8] last:border-0">
                  <p className="text-xs text-[#6B7280]">{s.label}</p>
                  <p className={`text-sm font-bold ${s.color}`}>{s.value}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Announcements */}
          <div>
            <SectionHeader title="Notifications" action={visibleAnnouncements.length > 0 ? 'Mark all read' : undefined} />
            <div className="flex flex-col gap-3">
              {visibleAnnouncements.length === 0 ? (
                <div className="bg-white rounded-xl border border-[#E2E6F0] px-5 py-8 text-center">
                  <p className="text-2xl mb-2">🔔</p>
                  <p className="text-sm text-[#9CA3AF]">No new notifications</p>
                </div>
              ) : visibleAnnouncements.map(a => (
                <div key={a.id} className={`bg-white rounded-xl border p-4 ${a.unread ? 'border-[#C7D2FE]' : 'border-[#E2E6F0]'}`}>
                  <div className="flex items-start justify-between gap-2 mb-1.5">
                    <div className="flex items-center gap-2">
                      {a.unread && <span className="w-2 h-2 rounded-full bg-[#1746A2] shrink-0" />}
                      <p className="text-xs font-bold text-[#0D1117]">{a.title}</p>
                    </div>
                    <button
                      onClick={() => setDismissedAnnouncements(d => [...d, a.id])}
                      className="text-[#9CA3AF] hover:text-[#6B7280] shrink-0"
                    >
                      <svg className="w-3.5 h-3.5" viewBox="0 0 16 16" fill="currentColor">
                        <path d="M2.146 2.854a.5.5 0 11.708-.708L8 7.293l5.146-5.147a.5.5 0 01.708.708L8.707 8l5.147 5.146a.5.5 0 01-.708.708L8 8.707l-5.146 5.147a.5.5 0 01-.708-.708L7.293 8 2.146 2.854z" />
                      </svg>
                    </button>
                  </div>
                  <p className="text-xs text-[#6B7280] leading-relaxed">{a.body}</p>
                  <p className="text-[10px] text-[#9CA3AF] mt-2">{a.group} · {a.time}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Quick actions */}
          <div className="bg-white rounded-xl border border-[#E2E6F0] p-5">
            <h3 className="display-font text-sm font-bold text-[#0D1117] uppercase tracking-wide mb-3">Quick actions</h3>
            <div className="flex flex-col gap-2">
              {[
                { label: 'Join a community', icon: '🏘', action: () => navigate('discover') },
                { label: 'View my contributions', icon: '📊', action: () => {} },
                { label: 'Check payout schedule', icon: '📅', action: () => {} },
                { label: 'Pending join requests', icon: '⏳', action: () => navigate('pending-approval'), badge: '1' },
              ].map(qa => (
                <button
                  key={qa.label}
                  onClick={qa.action}
                  className="flex items-center justify-between px-3 py-2.5 rounded-xl hover:bg-[#F8FAFF] border border-transparent hover:border-[#E2E6F0] transition-all text-left"
                >
                  <span className="flex items-center gap-3 text-sm font-medium text-[#374151]">
                    <span>{qa.icon}</span>
                    {qa.label}
                  </span>
                  {qa.badge ? (
                    <span className="w-5 h-5 rounded-full bg-[#FEF3C7] text-[#92400E] text-[10px] font-bold flex items-center justify-center">
                      {qa.badge}
                    </span>
                  ) : (
                    <svg className="w-4 h-4 text-[#9CA3AF]" viewBox="0 0 16 16" fill="currentColor">
                      <path d="M6.22 3.22a.75.75 0 011.06 0l4.25 4.25a.75.75 0 010 1.06l-4.25 4.25a.75.75 0 01-1.06-1.06L9.94 8 6.22 4.28a.75.75 0 010-1.06z" />
                    </svg>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}

// ── Shell ─────────────────────────────────────────────────────────────────────

export function ClientDashboard({ navigate, mode }: Props) {
  return (
    <AppShell navigate={navigate} activeView="dashboard">
      {/* Topbar */}
      <div className="bg-white border-b border-[#E2E6F0] px-6 lg:px-8 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Badge variant={mode === 'active' ? 'verified' : 'pending'}>
            {mode === 'active' ? 'Eligible for thrift' : 'Verification pending'}
          </Badge>
        </div>
        <div className="flex items-center gap-3">
          <button className="relative p-2 rounded-xl hover:bg-[#F1F3F8] transition-colors">
            <svg className="w-5 h-5 text-[#6B7280]" viewBox="0 0 16 16" fill="currentColor">
              <path d="M8 16a2 2 0 002-2H6a2 2 0 002 2zm.995-14.901a1 1 0 10-1.99 0A5.002 5.002 0 003 6c0 1.098-.5 6-2 7h14c-1.5-1-2-5.902-2-7 0-2.42-1.72-4.44-4.005-4.901z"/>
            </svg>
            {mode === 'active' && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#DC2626]" />
            )}
          </button>
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#1746A2] to-[#3B82F6] flex items-center justify-center text-white text-xs font-bold">AO</div>
        </div>
      </div>

      {/* Mode toggle — for demo */}
      <div className="bg-[#FFFBEB] border-b border-[#FDE68A] px-6 lg:px-8 py-2 flex items-center gap-3">
        <span className="text-xs text-[#92400E] font-medium">Demo mode:</span>
        <button
          onClick={() => navigate(mode === 'active' ? 'dashboard-new' : 'dashboard')}
          className="text-xs font-semibold text-[#1746A2] hover:underline"
        >
          Switch to {mode === 'active' ? 'new user' : 'active member'} view →
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
