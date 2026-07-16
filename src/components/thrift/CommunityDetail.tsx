import { useState } from 'react'
import { Button, Badge, Alert } from '../ui'
import { AppShell } from './AppShell'
import type { View, NavMeta } from '../../App'

interface Props {
  navigate: (v: View, meta?: NavMeta) => void
  communityId?: string
}

const COMMUNITY = {
  id: 'c4',
  name: 'Mainland Savers Club',
  description: 'A high-value, disciplined thrift circle for serious savers in the Lagos Mainland area. We have operated since 2022 with zero missed payouts. All members are professionals with verified bank accounts. Contributions are collected on the 1st of every month.',
  coordinator: {
    name: 'Emeka Nwosu',
    since: 'Jan 2022',
    groups: 2,
    rating: '5.0',
  },
  members: 13,
  maxMembers: 15,
  amount: 50000,
  frequency: 'Monthly',
  pool: 750000,
  location: 'Lagos Mainland, Lagos State',
  startDate: 'January 2022',
  payoutDay: '1st of every month',
  spotsLeft: 2,
  tags: ['High-value', 'Established', 'Professional'],
  color: '#D97706',
  rules: [
    'All members must be fully verified on TCS before joining.',
    'Contributions are due by 11:59 PM on the 1st of each month.',
    'One missed contribution results in a formal warning.',
    'Two missed contributions result in removal from the group.',
    'Swapping positions is allowed only with coordinator approval.',
    'Payouts are sent within 24 hours of the collection deadline.',
  ],
  members_list: [
    { initials: 'EO', name: 'Emeka Okafor', position: 1, status: 'paid' },
    { initials: 'FB', name: 'Fatima Bello', position: 2, status: 'paid' },
    { initials: 'SL', name: 'Sunday Lawal', position: 3, status: 'paid' },
    { initials: 'CN', name: 'Chioma Nwobi', position: 4, status: 'paid' },
    { initials: 'AO', name: 'Adewale Ogunleye', position: 5, status: 'paid' },
    { initials: 'MK', name: 'Maryam Kano', position: 6, status: 'pending' },
    { initials: 'BO', name: 'Babatunde Oke', position: 7, status: 'paid' },
    { initials: '?', name: 'Open position', position: 14, status: 'open' },
    { initials: '?', name: 'Open position', position: 15, status: 'open' },
  ],
  payoutSchedule: [
    { month: 'Jan 2025', member: 'Emeka Okafor', amount: 750000, status: 'paid' },
    { month: 'Feb 2025', member: 'Fatima Bello', amount: 750000, status: 'paid' },
    { month: 'Mar 2025', member: 'Sunday Lawal', amount: 750000, status: 'paid' },
    { month: 'Apr 2025', member: 'Chioma Nwobi', amount: 750000, status: 'paid' },
    { month: 'May 2025', member: 'Adewale Ogunleye', amount: 750000, status: 'paid' },
    { month: 'Jun 2025', member: 'Maryam Kano', amount: 750000, status: 'upcoming' },
    { month: 'Jul 2025', member: 'Babatunde Oke', amount: 750000, status: 'upcoming' },
    { month: 'Aug 2025', member: 'TBD (new member)', amount: 750000, status: 'open' },
  ],
}

type Tab = 'overview' | 'members' | 'schedule' | 'rules'

export function CommunityDetail({ navigate, communityId }: Props) {
  const [tab, setTab] = useState<Tab>('overview')
  const c = COMMUNITY
  const fillPercent = Math.round((c.members / c.maxMembers) * 100)

  const tabs: { id: Tab; label: string }[] = [
    { id: 'overview', label: 'Overview' },
    { id: 'members', label: 'Members' },
    { id: 'schedule', label: 'Payout schedule' },
    { id: 'rules', label: 'Group rules' },
  ]

  return (
    <AppShell navigate={navigate} activeView="discover">
      {/* Back bar */}
      <div className="bg-white border-b border-[#E2E6F0] px-6 lg:px-8 py-3.5 flex items-center gap-4">
        <button
          onClick={() => navigate('discover')}
          className="flex items-center gap-1.5 text-sm text-[#6B7280] hover:text-[#0D1117] font-medium transition-colors"
        >
          <svg className="w-4 h-4" viewBox="0 0 16 16" fill="currentColor">
            <path d="M9.78 11.78a.75.75 0 01-1.06 0L4.47 7.53a.75.75 0 010-1.06l4.25-4.25a.75.75 0 111.06 1.06L6.06 7l3.72 3.72a.75.75 0 010 1.06z" />
          </svg>
          Discover communities
        </button>
        <span className="text-[#E2E6F0]">/</span>
        <span className="text-sm font-semibold text-[#0D1117] truncate">{c.name}</span>
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* Hero */}
        <div className="bg-white border-b border-[#E2E6F0] px-6 lg:px-8 py-7">
          <div className="max-w-4xl flex flex-col sm:flex-row sm:items-start gap-5">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl shrink-0" style={{ background: c.color + '18' }}>
              🏘
            </div>
            <div className="flex-1">
              <div className="flex flex-wrap items-start gap-2 mb-2">
                <h1 className="display-font text-2xl font-bold text-[#0D1117]">{c.name}</h1>
                <span className="text-[10px] font-bold text-[#059669] bg-[#ECFDF5] px-2.5 py-1 rounded-full self-center">
                  {c.spotsLeft} spots left
                </span>
              </div>
              <p className="text-sm text-[#6B7280] mb-3">{c.location} · Coordinated by {c.coordinator.name} · Since {c.startDate}</p>
              <div className="flex flex-wrap gap-1.5 mb-4">
                {c.tags.map(t => (
                  <span key={t} className="text-xs font-semibold text-[#6B7280] bg-[#F1F3F8] px-2.5 py-1 rounded-full">{t}</span>
                ))}
              </div>
              {/* Key numbers */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div>
                  <p className="text-xs text-[#9CA3AF] uppercase tracking-wide font-medium">Monthly</p>
                  <p className="text-lg font-bold text-[#0D1117] display-font">₦{c.amount.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-xs text-[#9CA3AF] uppercase tracking-wide font-medium">Payout pool</p>
                  <p className="text-lg font-bold text-[#059669] display-font">₦{c.pool.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-xs text-[#9CA3AF] uppercase tracking-wide font-medium">Members</p>
                  <p className="text-lg font-bold text-[#0D1117] display-font">{c.members}/{c.maxMembers}</p>
                </div>
                <div>
                  <p className="text-xs text-[#9CA3AF] uppercase tracking-wide font-medium">Payout day</p>
                  <p className="text-lg font-bold text-[#0D1117] display-font">{c.payoutDay}</p>
                </div>
              </div>
            </div>
            {/* CTA */}
            <div className="sm:ml-6 shrink-0 flex flex-col gap-2.5">
              <Button
                size="lg"
                onClick={() => navigate('join-request', { communityId: c.id })}
              >
                Request to join →
              </Button>
              <p className="text-xs text-center text-[#9CA3AF]">Free to request · No commitment</p>
            </div>
          </div>
        </div>

        {/* Tab bar */}
        <div className="bg-white border-b border-[#E2E6F0] px-6 lg:px-8">
          <div className="flex gap-0 overflow-x-auto">
            {tabs.map(t => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`px-4 py-3.5 text-sm font-semibold border-b-2 transition-colors whitespace-nowrap ${tab === t.id ? 'border-[#1746A2] text-[#1746A2]' : 'border-transparent text-[#6B7280] hover:text-[#0D1117]'}`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Tab content */}
        <div className="px-6 lg:px-8 py-7 max-w-4xl">
          {tab === 'overview' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 flex flex-col gap-5">
                <div className="bg-white rounded-xl border border-[#E2E6F0] p-5">
                  <h2 className="display-font text-sm font-bold text-[#0D1117] uppercase tracking-wide mb-3">About this group</h2>
                  <p className="text-sm text-[#374151] leading-relaxed">{c.description}</p>
                </div>

                <div className="bg-white rounded-xl border border-[#E2E6F0] p-5">
                  <h2 className="display-font text-sm font-bold text-[#0D1117] uppercase tracking-wide mb-4">How contributions work</h2>
                  <div className="flex flex-col gap-3">
                    {[
                      { icon: '📅', label: 'Collection date', value: `${c.payoutDay} (${c.frequency})` },
                      { icon: '💳', label: 'Amount per member', value: `₦${c.amount.toLocaleString()}` },
                      { icon: '💰', label: 'Payout amount', value: `₦${c.pool.toLocaleString()} (full pool)` },
                      { icon: '🏦', label: 'Payout method', value: 'Direct bank transfer within 24 hours' },
                      { icon: '🔒', label: 'Position assignment', value: 'Assigned by coordinator at joining' },
                    ].map(row => (
                      <div key={row.label} className="flex items-center gap-3 py-2.5 border-b border-[#F1F3F8] last:border-0">
                        <span className="text-base w-6 text-center">{row.icon}</span>
                        <span className="text-xs text-[#6B7280] w-36 shrink-0">{row.label}</span>
                        <span className="text-sm font-semibold text-[#0D1117]">{row.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-5">
                {/* Coordinator */}
                <div className="bg-white rounded-xl border border-[#E2E6F0] p-5">
                  <h2 className="display-font text-sm font-bold text-[#0D1117] uppercase tracking-wide mb-3">Coordinator</h2>
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#D97706] to-[#F59E0B] flex items-center justify-center text-white text-sm font-bold">
                      EN
                    </div>
                    <div>
                      <p className="text-sm font-bold text-[#0D1117]">{c.coordinator.name}</p>
                      <p className="text-xs text-[#6B7280]">Since {c.coordinator.since}</p>
                    </div>
                  </div>
                  <div className="flex gap-4 text-center">
                    <div className="flex-1 bg-[#F8FAFF] rounded-lg py-2">
                      <p className="text-sm font-bold text-[#0D1117]">⭐ {c.coordinator.rating}</p>
                      <p className="text-[10px] text-[#9CA3AF]">Rating</p>
                    </div>
                    <div className="flex-1 bg-[#F8FAFF] rounded-lg py-2">
                      <p className="text-sm font-bold text-[#0D1117]">{c.coordinator.groups}</p>
                      <p className="text-[10px] text-[#9CA3AF]">Groups</p>
                    </div>
                  </div>
                </div>

                {/* Capacity */}
                <div className="bg-white rounded-xl border border-[#E2E6F0] p-5">
                  <h2 className="display-font text-sm font-bold text-[#0D1117] uppercase tracking-wide mb-3">Group capacity</h2>
                  <div className="flex justify-between text-xs mb-1.5 text-[#6B7280]">
                    <span>{c.members} members joined</span>
                    <span className="font-semibold text-[#0D1117]">{fillPercent}%</span>
                  </div>
                  <div className="h-2 bg-[#F1F3F8] rounded-full overflow-hidden mb-2">
                    <div className="h-full rounded-full" style={{ width: `${fillPercent}%`, background: c.color }} />
                  </div>
                  <p className="text-xs text-[#059669] font-semibold">{c.spotsLeft} open spots remaining</p>
                </div>

                {/* CTA again */}
                <Alert type="info">
                  Once you request to join, the coordinator will review your profile and respond within 48 hours.
                </Alert>

                <Button size="lg" className="w-full" onClick={() => navigate('join-request', { communityId: c.id })}>
                  Request to join →
                </Button>
              </div>
            </div>
          )}

          {tab === 'members' && (
            <div className="bg-white rounded-xl border border-[#E2E6F0] overflow-hidden">
              <div className="px-5 py-4 border-b border-[#F1F3F8] bg-[#F8FAFF]">
                <p className="text-xs font-bold text-[#9CA3AF] uppercase tracking-wide">{c.members} members · {c.spotsLeft} open spots</p>
              </div>
              {c.members_list.map((m, i) => (
                <div key={i} className={`flex items-center gap-4 px-5 py-3.5 ${i < c.members_list.length - 1 ? 'border-b border-[#F1F3F8]' : ''}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${m.status === 'open' ? 'bg-[#F1F3F8] text-[#9CA3AF] border-2 border-dashed border-[#D1D5DB]' : 'bg-gradient-to-br from-[#1746A2] to-[#3B82F6] text-white'}`}>
                    {m.initials}
                  </div>
                  <div className="flex-1">
                    <p className={`text-sm font-semibold ${m.status === 'open' ? 'text-[#9CA3AF] italic' : 'text-[#0D1117]'}`}>{m.name}</p>
                    <p className="text-xs text-[#9CA3AF]">Position #{m.position}</p>
                  </div>
                  <div>
                    {m.status === 'paid' && <Badge variant="verified">Contributed</Badge>}
                    {m.status === 'pending' && <Badge variant="pending">Pending</Badge>}
                    {m.status === 'open' && <Badge variant="not-started">Open spot</Badge>}
                  </div>
                </div>
              ))}
            </div>
          )}

          {tab === 'schedule' && (
            <div className="bg-white rounded-xl border border-[#E2E6F0] overflow-hidden">
              <div className="px-5 py-4 border-b border-[#F1F3F8] bg-[#F8FAFF]">
                <p className="text-xs font-bold text-[#9CA3AF] uppercase tracking-wide">Payout schedule — 2025</p>
              </div>
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[#F1F3F8]">
                    {['Month', 'Recipient', 'Payout amount', 'Status'].map(h => (
                      <th key={h} className="text-left px-5 py-3 text-xs font-bold text-[#9CA3AF] uppercase tracking-wide">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {c.payoutSchedule.map((row, i) => (
                    <tr key={i} className={`border-b border-[#F1F3F8] ${i === c.payoutSchedule.length - 1 ? 'border-0' : ''}`}>
                      <td className="px-5 py-3.5 text-sm font-semibold text-[#0D1117]">{row.month}</td>
                      <td className="px-5 py-3.5 text-sm text-[#374151]">{row.member}</td>
                      <td className="px-5 py-3.5 text-sm font-semibold text-[#059669]">₦{row.amount.toLocaleString()}</td>
                      <td className="px-5 py-3.5">
                        {row.status === 'paid' && <Badge variant="verified">Paid out</Badge>}
                        {row.status === 'upcoming' && <Badge variant="pending">Upcoming</Badge>}
                        {row.status === 'open' && <Badge variant="not-started">TBD</Badge>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {tab === 'rules' && (
            <div className="bg-white rounded-xl border border-[#E2E6F0] p-6">
              <h2 className="display-font text-sm font-bold text-[#0D1117] uppercase tracking-wide mb-5">Group rules & expectations</h2>
              <ol className="flex flex-col gap-4">
                {c.rules.map((rule, i) => (
                  <li key={i} className="flex gap-4 items-start">
                    <span className="w-6 h-6 rounded-full bg-[#EEF2FF] text-[#1746A2] text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                      {i + 1}
                    </span>
                    <p className="text-sm text-[#374151] leading-relaxed">{rule}</p>
                  </li>
                ))}
              </ol>
              <div className="mt-6 pt-5 border-t border-[#F1F3F8]">
                <Alert type="info">
                  By requesting to join this group, you confirm that you have read and agree to all group rules listed above.
                </Alert>
              </div>
            </div>
          )}
        </div>
      </div>
    </AppShell>
  )
}
