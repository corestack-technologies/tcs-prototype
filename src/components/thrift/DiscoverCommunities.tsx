import { useState } from 'react'
import { Button, Badge } from '../ui'
import { AppShell } from './AppShell'
import type { View, NavMeta } from '../../App'

interface Props { navigate: (v: View, meta?: NavMeta) => void }

type Frequency = 'Weekly' | 'Monthly' | 'Biweekly'
type SortKey = 'popular' | 'newest' | 'amount-asc' | 'amount-desc'

interface Community {
  id: string
  name: string
  description: string
  members: number
  maxMembers: number
  amount: number
  frequency: Frequency
  location: string
  coordinator: string
  spotsLeft: number
  tags: string[]
  joined: boolean
  pending: boolean
  color: string
}

const COMMUNITIES: Community[] = [
  {
    id: 'c1',
    name: 'Lagos Mainland Ajo',
    description: 'A trusted monthly thrift group for professionals in the Lagos Mainland area. All members are verified and contributions are strictly managed.',
    members: 10,
    maxMembers: 12,
    amount: 20000,
    frequency: 'Monthly',
    location: 'Lagos, Nigeria',
    coordinator: 'Chioma Obi',
    spotsLeft: 2,
    tags: ['Professional', 'Verified', 'Lagos'],
    joined: true,
    pending: false,
    color: '#1746A2',
  },
  {
    id: 'c2',
    name: "Surulere Women's Thrift",
    description: "A women-only savings and contribution group based in Surulere. We've been running for 3 years with 100% payout success.",
    members: 8,
    maxMembers: 8,
    amount: 15000,
    frequency: 'Monthly',
    location: 'Surulere, Lagos',
    coordinator: 'Funmi Adeyemi',
    spotsLeft: 0,
    tags: ["Women's", 'Surulere', 'Closed'],
    joined: true,
    pending: false,
    color: '#059669',
  },
  {
    id: 'c3',
    name: 'Yaba Tech Thrift',
    description: 'For tech workers and entrepreneurs in the Yaba / Unilag corridor. Flexible contribution schedule and fast payouts.',
    members: 8,
    maxMembers: 10,
    amount: 10000,
    frequency: 'Monthly',
    location: 'Yaba, Lagos',
    coordinator: 'Seun Bello',
    spotsLeft: 2,
    tags: ['Tech', 'Flexible', 'Yaba'],
    joined: false,
    pending: true,
    color: '#7C3AED',
  },
  {
    id: 'c4',
    name: 'Mainland Savers Club',
    description: 'High-value thrift for serious savers. ₦50,000/month per member. Payout pool is ₦750,000. Strong track record since 2022.',
    members: 13,
    maxMembers: 15,
    amount: 50000,
    frequency: 'Monthly',
    location: 'Lagos Mainland',
    coordinator: 'Emeka Nwosu',
    spotsLeft: 2,
    tags: ['High-value', 'Established'],
    joined: false,
    pending: false,
    color: '#D97706',
  },
  {
    id: 'c5',
    name: 'Ibadan Professionals Ajo',
    description: 'A disciplined savings circle for working professionals in Ibadan. Contributions are biweekly and payouts are prompt.',
    members: 6,
    maxMembers: 10,
    amount: 8000,
    frequency: 'Biweekly',
    location: 'Ibadan, Oyo',
    coordinator: 'Adunola Ogunyemi',
    spotsLeft: 4,
    tags: ['Ibadan', 'Biweekly', 'Welcoming'],
    joined: false,
    pending: false,
    color: '#0891B2',
  },
  {
    id: 'c6',
    name: 'Abuja Civil Servants Thrift',
    description: 'For FCT civil servants and government workers. Payroll-friendly monthly schedule aligned with salary dates.',
    members: 18,
    maxMembers: 20,
    amount: 30000,
    frequency: 'Monthly',
    location: 'Abuja, FCT',
    coordinator: 'Musa Lawal',
    spotsLeft: 2,
    tags: ['Civil service', 'Abuja', 'Salary-aligned'],
    joined: false,
    pending: false,
    color: '#DC2626',
  },
]

const FREQUENCIES: Frequency[] = ['Weekly', 'Monthly', 'Biweekly']
const AMOUNTS = [
  { label: 'Any amount', min: 0, max: Infinity },
  { label: 'Under ₦10k', min: 0, max: 10000 },
  { label: '₦10k–₦25k', min: 10000, max: 25000 },
  { label: '₦25k–₦50k', min: 25000, max: 50000 },
  { label: '₦50k+', min: 50000, max: Infinity },
]

export function DiscoverCommunities({ navigate }: Props) {
  const [search, setSearch] = useState('')
  const [freqFilter, setFreqFilter] = useState<Frequency | 'All'>('All')
  const [amountFilter, setAmountFilter] = useState(0)
  const [availableOnly, setAvailableOnly] = useState(false)
  const [sort, setSort] = useState<SortKey>('popular')

  const amountRange = AMOUNTS[amountFilter]

  const filtered = COMMUNITIES
    .filter(c => {
      if (search && !c.name.toLowerCase().includes(search.toLowerCase()) && !c.location.toLowerCase().includes(search.toLowerCase())) return false
      if (freqFilter !== 'All' && c.frequency !== freqFilter) return false
      if (c.amount < amountRange.min || c.amount > amountRange.max) return false
      if (availableOnly && c.spotsLeft === 0) return false
      return true
    })
    .sort((a, b) => {
      if (sort === 'popular') return b.members - a.members
      if (sort === 'newest') return 0
      if (sort === 'amount-asc') return a.amount - b.amount
      if (sort === 'amount-desc') return b.amount - a.amount
      return 0
    })

  return (
    <AppShell navigate={navigate} activeView="discover">
      {/* Topbar */}
      <div className="bg-white border-b border-[#E2E6F0] px-6 lg:px-8 py-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="display-font text-xl font-bold text-[#0D1117]">Discover communities</h1>
            <p className="text-sm text-[#6B7280]">{filtered.length} groups available · Find one that fits your budget</p>
          </div>
          <div className="relative w-full sm:w-72">
            <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9CA3AF]" viewBox="0 0 16 16" fill="currentColor">
              <path d="M6.5 1a5.5 5.5 0 104.472 8.719l3.155 3.154a.75.75 0 001.06-1.06l-3.154-3.155A5.5 5.5 0 006.5 1zM2.5 6.5a4 4 0 118 0 4 4 0 01-8 0z" />
            </svg>
            <input
              type="search"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by name or location…"
              className="w-full pl-9 pr-4 py-2.5 text-sm bg-white border border-[#E2E6F0] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1746A2]"
            />
          </div>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Filter sidebar */}
        <aside className="hidden lg:flex flex-col w-56 shrink-0 bg-white border-r border-[#E2E6F0] px-5 py-6 gap-7">
          {/* Frequency */}
          <div>
            <p className="text-[10px] font-bold text-[#9CA3AF] uppercase tracking-widest mb-3">Contribution cycle</p>
            <div className="flex flex-col gap-1.5">
              {(['All', ...FREQUENCIES] as const).map(f => (
                <button
                  key={f}
                  onClick={() => setFreqFilter(f)}
                  className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors text-left ${freqFilter === f ? 'bg-[#EEF2FF] text-[#1746A2]' : 'text-[#6B7280] hover:bg-[#F1F3F8]'}`}
                >
                  <span className={`w-3.5 h-3.5 rounded-full border-2 flex items-center justify-center shrink-0 ${freqFilter === f ? 'border-[#1746A2]' : 'border-[#D1D5DB]'}`}>
                    {freqFilter === f && <span className="w-1.5 h-1.5 rounded-full bg-[#1746A2]" />}
                  </span>
                  {f}
                </button>
              ))}
            </div>
          </div>

          {/* Amount range */}
          <div>
            <p className="text-[10px] font-bold text-[#9CA3AF] uppercase tracking-widest mb-3">Monthly contribution</p>
            <div className="flex flex-col gap-1.5">
              {AMOUNTS.map((a, i) => (
                <button
                  key={i}
                  onClick={() => setAmountFilter(i)}
                  className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors text-left ${amountFilter === i ? 'bg-[#EEF2FF] text-[#1746A2]' : 'text-[#6B7280] hover:bg-[#F1F3F8]'}`}
                >
                  <span className={`w-3.5 h-3.5 rounded-full border-2 flex items-center justify-center shrink-0 ${amountFilter === i ? 'border-[#1746A2]' : 'border-[#D1D5DB]'}`}>
                    {amountFilter === i && <span className="w-1.5 h-1.5 rounded-full bg-[#1746A2]" />}
                  </span>
                  {a.label}
                </button>
              ))}
            </div>
          </div>

          {/* Availability toggle */}
          <div>
            <p className="text-[10px] font-bold text-[#9CA3AF] uppercase tracking-widest mb-3">Availability</p>
            <label className="flex items-center gap-3 cursor-pointer">
              <div
                onClick={() => setAvailableOnly(!availableOnly)}
                className={`w-10 h-6 rounded-full transition-colors relative cursor-pointer ${availableOnly ? 'bg-[#1746A2]' : 'bg-[#E2E6F0]'}`}
              >
                <div className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-transform ${availableOnly ? 'translate-x-5' : 'translate-x-1'}`} />
              </div>
              <span className="text-sm text-[#374151] font-medium">Open spots only</span>
            </label>
          </div>
        </aside>

        {/* Grid */}
        <main className="flex-1 overflow-y-auto px-6 lg:px-8 py-6">
          {/* Sort bar */}
          <div className="flex items-center justify-between mb-5">
            <p className="text-sm text-[#6B7280]">Showing <strong className="text-[#0D1117]">{filtered.length}</strong> communities</p>
            <select
              value={sort}
              onChange={e => setSort(e.target.value as SortKey)}
              className="text-sm border border-[#E2E6F0] rounded-lg px-3 py-2 bg-white text-[#374151] focus:outline-none focus:ring-2 focus:ring-[#1746A2]"
            >
              <option value="popular">Most popular</option>
              <option value="newest">Newest first</option>
              <option value="amount-asc">Amount: low to high</option>
              <option value="amount-desc">Amount: high to low</option>
            </select>
          </div>

          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="text-4xl mb-3">🔍</div>
              <p className="text-sm font-semibold text-[#374151] mb-1">No communities found</p>
              <p className="text-xs text-[#9CA3AF]">Try adjusting your filters or search term</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {filtered.map(community => (
                <CommunityCard
                  key={community.id}
                  community={community}
                  onClick={() => navigate('community-detail', { communityId: community.id })}
                />
              ))}
            </div>
          )}
        </main>
      </div>
    </AppShell>
  )
}

function CommunityCard({ community: c, onClick }: { community: Community; onClick: () => void }) {
  const fillPercent = Math.round((c.members / c.maxMembers) * 100)
  const isFull = c.spotsLeft === 0

  return (
    <button
      onClick={onClick}
      className="bg-white rounded-xl border border-[#E2E6F0] p-5 text-left hover:border-[#C7D2FE] hover:shadow-md transition-all group flex flex-col gap-4"
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl shrink-0" style={{ background: c.color + '18' }}>
            🏘
          </div>
          <div>
            <p className="text-sm font-bold text-[#0D1117] group-hover:text-[#1746A2] transition-colors leading-snug">{c.name}</p>
            <p className="text-xs text-[#9CA3AF]">{c.location}</p>
          </div>
        </div>
        <div className="shrink-0">
          {c.joined && <Badge variant="verified">Member</Badge>}
          {c.pending && !c.joined && <Badge variant="pending">Pending</Badge>}
          {isFull && !c.joined && !c.pending && <Badge variant="not-started">Full</Badge>}
          {!isFull && !c.joined && !c.pending && (
            <span className="text-[10px] font-bold text-[#059669] bg-[#ECFDF5] px-2 py-1 rounded-full">
              {c.spotsLeft} spot{c.spotsLeft > 1 ? 's' : ''} left
            </span>
          )}
        </div>
      </div>

      {/* Description */}
      <p className="text-xs text-[#6B7280] leading-relaxed line-clamp-2">{c.description}</p>

      {/* Key stats */}
      <div className="grid grid-cols-3 gap-2 text-center">
        <div className="bg-[#F8FAFF] rounded-lg px-2 py-2">
          <p className="text-xs font-bold text-[#0D1117]">₦{c.amount.toLocaleString()}</p>
          <p className="text-[10px] text-[#9CA3AF]">{c.frequency}</p>
        </div>
        <div className="bg-[#F8FAFF] rounded-lg px-2 py-2">
          <p className="text-xs font-bold text-[#0D1117]">{c.members}/{c.maxMembers}</p>
          <p className="text-[10px] text-[#9CA3AF]">Members</p>
        </div>
        <div className="bg-[#F8FAFF] rounded-lg px-2 py-2">
          <p className="text-xs font-bold text-[#0D1117]">₦{(c.amount * c.maxMembers).toLocaleString()}</p>
          <p className="text-[10px] text-[#9CA3AF]">Pool</p>
        </div>
      </div>

      {/* Fill bar */}
      <div>
        <div className="flex justify-between text-[10px] mb-1 text-[#9CA3AF]">
          <span>Group capacity</span>
          <span className="font-semibold">{fillPercent}% full</span>
        </div>
        <div className="h-1.5 bg-[#F1F3F8] rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all"
            style={{ width: `${fillPercent}%`, background: isFull ? '#DC2626' : c.color }}
          />
        </div>
      </div>

      {/* Tags */}
      <div className="flex flex-wrap gap-1.5">
        {c.tags.map(tag => (
          <span key={tag} className="text-[10px] font-semibold text-[#6B7280] bg-[#F1F3F8] px-2 py-1 rounded-full">
            {tag}
          </span>
        ))}
      </div>
    </button>
  )
}
