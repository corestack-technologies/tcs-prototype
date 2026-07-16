import { useState } from 'react'
import { Logo, Badge, Button } from './ui'
import type { View, NavMeta } from '../App'

interface Props { navigate: (v: View, meta?: NavMeta) => void }

type Status = 'pending' | 'verified' | 'rejected'

interface Client {
  id: string
  name: string
  email: string
  phone: string
  submitted: string
  status: Status
  nin: string
  flag?: string
}

const CLIENTS: Client[] = [
  { id: '001', name: 'Adaeze Chidinma Okonkwo', email: 'adaeze@email.com', phone: '+234 801 234 5678', submitted: '2 hours ago', status: 'pending', nin: '12345678901' },
  { id: '002', name: 'Babatunde Seun Adeyemi', email: 'babatunde@email.com', phone: '+234 903 456 7890', submitted: '5 hours ago', status: 'pending', nin: '98765432109' },
  { id: '003', name: 'Chisom Grace Eze', email: 'chisom@email.com', phone: '+234 812 345 6789', submitted: '1 day ago', status: 'verified', nin: '11223344556' },
  { id: '004', name: 'Emeka John Nwosu', email: 'emeka@email.com', phone: '+234 706 789 0123', submitted: '1 day ago', status: 'rejected', nin: '55667788990', flag: 'Blurry NIN slip' },
  { id: '005', name: 'Fatimah Amina Bello', email: 'fatimah@email.com', phone: '+234 818 901 2345', submitted: '2 days ago', status: 'pending', nin: '44332211009' },
  { id: '006', name: 'Gbenga Olusegun Fasanya', email: 'gbenga@email.com', phone: '+234 805 234 5678', submitted: '3 days ago', status: 'verified', nin: '99887766554' },
  { id: '007', name: 'Halima Yusuf Ibrahim', email: 'halima@email.com', phone: '+234 913 456 7890', submitted: '3 days ago', status: 'rejected', nin: '33221100998', flag: 'Address mismatch' },
]

export function ReviewerQueue({ navigate }: Props) {
  const [filter, setFilter] = useState<'all' | Status>('all')
  const [search, setSearch] = useState('')

  const filtered = CLIENTS.filter(c => {
    const matchStatus = filter === 'all' || c.status === filter
    const matchSearch = !search || c.name.toLowerCase().includes(search.toLowerCase()) || c.email.toLowerCase().includes(search.toLowerCase()) || c.nin.includes(search)
    return matchStatus && matchSearch
  })

  const counts = {
    all: CLIENTS.length,
    pending: CLIENTS.filter(c => c.status === 'pending').length,
    verified: CLIENTS.filter(c => c.status === 'verified').length,
    rejected: CLIENTS.filter(c => c.status === 'rejected').length,
  }

  const statusBadgeMap: Record<Status, 'pending' | 'verified' | 'rejected'> = {
    pending: 'pending', verified: 'verified', rejected: 'rejected',
  }
  const statusLabel: Record<Status, string> = {
    pending: 'Pending review', verified: 'Verified', rejected: 'Rejected',
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#F4F6FA]">
      {/* Header */}
      <div className="bg-white border-b border-[#E2E6F0] px-8 py-4 flex items-center justify-between">
        <Logo size="sm" />
        <div className="flex items-center gap-3">
          <span className="text-xs bg-[#FEF3C7] text-[#92400E] px-2.5 py-1 rounded-full font-semibold">Internal reviewer</span>
          <div className="w-8 h-8 rounded-full bg-[#374151] flex items-center justify-center text-white text-sm font-bold">R</div>
          <button onClick={() => navigate('login')} className="text-xs text-[#6B7280] hover:text-[#0D1117] font-medium">Sign out</button>
        </div>
      </div>

      <div className="flex-1 px-8 py-8 max-w-7xl mx-auto w-full">
        {/* Page header */}
        <div className="mb-6">
          <h1 className="display-font text-2xl font-bold text-[#0D1117] mb-1">Identity verification queue</h1>
          <p className="text-sm text-[#6B7280]">Review submitted identity documents and take action on each submission.</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          {[
            { label: 'Total submissions', value: counts.all, color: 'text-[#0D1117]', bg: 'bg-white' },
            { label: 'Pending review', value: counts.pending, color: 'text-[#92400E]', bg: 'bg-[#FFFBEB]' },
            { label: 'Verified', value: counts.verified, color: 'text-[#065F46]', bg: 'bg-[#ECFDF5]' },
            { label: 'Rejected', value: counts.rejected, color: 'text-[#991B1B]', bg: 'bg-[#FEF2F2]' },
          ].map(stat => (
            <div key={stat.label} className={`${stat.bg} rounded-xl border border-[#E2E6F0] px-5 py-4`}>
              <p className={`display-font text-3xl font-bold ${stat.color}`}>{stat.value}</p>
              <p className="text-xs text-[#6B7280] mt-0.5">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Filters + Search */}
        <div className="flex flex-col sm:flex-row gap-3 mb-5">
          <div className="flex gap-1 p-1 bg-white rounded-xl border border-[#E2E6F0]">
            {(['all', 'pending', 'verified', 'rejected'] as const).map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3.5 py-1.5 text-sm font-semibold rounded-lg transition-colors capitalize ${filter === f ? 'bg-[#1746A2] text-white' : 'text-[#6B7280] hover:text-[#0D1117]'}`}
              >
                {f === 'all' ? 'All' : f.charAt(0).toUpperCase() + f.slice(1)}
                <span className={`ml-1.5 text-xs px-1.5 py-0.5 rounded-full ${filter === f ? 'bg-white/20' : 'bg-[#F1F3F8]'}`}>
                  {counts[f]}
                </span>
              </button>
            ))}
          </div>
          <div className="flex-1 relative">
            <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9CA3AF]" viewBox="0 0 16 16" fill="currentColor">
              <path d="M6.5 1a5.5 5.5 0 104.472 8.719l3.155 3.154a.75.75 0 001.06-1.06l-3.154-3.155A5.5 5.5 0 006.5 1zM2.5 6.5a4 4 0 118 0 4 4 0 01-8 0z" />
            </svg>
            <input
              type="search"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by name, email, or NIN…"
              className="w-full pl-9 pr-4 py-2.5 text-sm bg-white border border-[#E2E6F0] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1746A2]"
            />
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl border border-[#E2E6F0] overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#F1F3F8] bg-[#F8FAFF]">
                {['Client', 'NIN', 'Phone', 'Submitted', 'Status', 'Action'].map(h => (
                  <th key={h} className="text-left px-5 py-3.5 text-xs font-bold text-[#9CA3AF] uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-[#9CA3AF] text-sm">No submissions match your filter.</td>
                </tr>
              ) : filtered.map((client, i) => (
                <tr key={client.id} className={`border-b border-[#F1F3F8] hover:bg-[#F8FAFF] transition-colors ${i === filtered.length - 1 ? 'border-0' : ''}`}>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#1746A2] to-[#3B82F6] flex items-center justify-center text-white text-xs font-bold shrink-0">
                        {client.name.split(' ').map(n => n[0]).slice(0, 2).join('')}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-[#0D1117]">{client.name}</p>
                        <p className="text-xs text-[#9CA3AF]">{client.email}</p>
                        {client.flag && (
                          <span className="text-[10px] text-[#DC2626] font-medium">⚠ {client.flag}</span>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <span className="font-mono text-xs text-[#374151] bg-[#F1F3F8] px-2 py-1 rounded">{client.nin}</span>
                  </td>
                  <td className="px-5 py-4 text-xs text-[#6B7280]">{client.phone}</td>
                  <td className="px-5 py-4 text-xs text-[#6B7280]">{client.submitted}</td>
                  <td className="px-5 py-4">
                    <Badge variant={statusBadgeMap[client.status]}>{statusLabel[client.status]}</Badge>
                  </td>
                  <td className="px-5 py-4">
                    <Button
                      variant={client.status === 'pending' ? 'primary' : 'ghost'}
                      size="sm"
                      onClick={() => navigate('reviewer-detail', { clientId: client.id })}
                    >
                      {client.status === 'pending' ? 'Review →' : 'View details'}
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
