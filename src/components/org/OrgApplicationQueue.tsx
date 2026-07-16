import { useState } from 'react'
import { Badge } from '../ui'
import type { View, NavMeta } from '../../App'

interface Props { navigate: (v: View, meta?: NavMeta) => void }

type AppStatus = 'all' | 'pending' | 'info-required' | 'approved' | 'rejected'

interface Application {
  id: string
  orgName: string
  applicantName: string
  applicantEmail: string
  orgType: string
  location: string
  estimatedMembers: number
  submittedDate: string
  status: 'pending' | 'info-required' | 'approved' | 'rejected'
  flagged?: boolean
}

const APPLICATIONS: Application[] = [
  { id: 'app-001', orgName: 'Ikeja Professional Savings Network', applicantName: 'Chukwuemeka Osei', applicantEmail: 'c.osei@email.ng', orgType: 'Investment & Savings Club', location: 'Ikeja, Lagos', estimatedMembers: 24, submittedDate: 'Jul 11, 2026', status: 'pending' },
  { id: 'app-002', orgName: 'Surulere Women Ajo Circle', applicantName: 'Ngozi Adeyemi', applicantEmail: 'ngozi.a@gmail.com', orgType: 'Rotating Savings Group (Ajo / Esusu)', location: 'Surulere, Lagos', estimatedMembers: 15, submittedDate: 'Jul 10, 2026', status: 'info-required', flagged: true },
  { id: 'app-003', orgName: 'Zenith Staff Welfare Fund', applicantName: 'Babajide Lawson', applicantEmail: 'b.lawson@zenithng.com', orgType: 'Staff Welfare & Savings Fund', location: 'Victoria Island, Lagos', estimatedMembers: 60, submittedDate: 'Jul 8, 2026', status: 'pending' },
  { id: 'app-004', orgName: 'GRA Abuja Community Thrift', applicantName: 'Fatima Aliyu', applicantEmail: 'f.aliyu@outlook.com', orgType: 'Community Development Fund', location: 'GRA, Abuja', estimatedMembers: 30, submittedDate: 'Jul 7, 2026', status: 'approved' },
  { id: 'app-005', orgName: 'Port Harcourt Market Cooperative', applicantName: 'Emeka Nwachukwu', applicantEmail: 'e.nwachukwu@gmail.com', orgType: 'Cooperative Savings Society', location: 'Port Harcourt, Rivers', estimatedMembers: 45, submittedDate: 'Jul 5, 2026', status: 'rejected' },
  { id: 'app-006', orgName: 'Lagos Island Faith Community Savings', applicantName: 'Pastor Samuel Ojo', applicantEmail: 's.ojo@faithharbour.org', orgType: 'Religious & Community Savings Group', location: 'Lagos Island, Lagos', estimatedMembers: 20, submittedDate: 'Jul 3, 2026', status: 'approved' },
]

const statusConfig: Record<Application['status'], { label: string; variant: 'pending' | 'verified' | 'rejected' | 'active'; badge: string }> = {
  pending: { label: 'Pending review', variant: 'pending', badge: 'bg-[#FFF8E6] text-[#B45309]' },
  'info-required': { label: 'Info required', variant: 'pending', badge: 'bg-[#EFF6FF] text-[#1746A2]' },
  approved: { label: 'Approved', variant: 'verified', badge: 'bg-[#ECFDF5] text-[#065F46]' },
  rejected: { label: 'Rejected', variant: 'rejected', badge: 'bg-[#FEF2F2] text-[#991B1B]' },
}

export function OrgApplicationQueue({ navigate }: Props) {
  const [filter, setFilter] = useState<AppStatus>('all')
  const [search, setSearch] = useState('')

  const counts = {
    all: APPLICATIONS.length,
    pending: APPLICATIONS.filter(a => a.status === 'pending').length,
    'info-required': APPLICATIONS.filter(a => a.status === 'info-required').length,
    approved: APPLICATIONS.filter(a => a.status === 'approved').length,
    rejected: APPLICATIONS.filter(a => a.status === 'rejected').length,
  }

  const filtered = APPLICATIONS.filter(a => {
    if (filter !== 'all' && a.status !== filter) return false
    if (search && !a.orgName.toLowerCase().includes(search.toLowerCase()) && !a.applicantName.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  return (
    <div className="min-h-screen bg-[#F4F6FA] flex flex-col">
      {/* Top bar */}
      <div className="bg-white border-b border-[#E2E6F0] px-6 lg:px-10 py-4 flex items-center justify-between gap-4 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[#1746A2] flex items-center justify-center">
            <span className="text-white font-black text-sm">T</span>
          </div>
          <div>
            <p className="text-sm font-bold text-[#0D1117]">TCS Internal</p>
            <p className="text-xs text-[#9CA3AF]">Organization Review</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('org-eligibility')}
            className="text-sm font-semibold text-[#1746A2] hover:underline"
          >
            Eligibility management
          </button>
          <div className="w-7 h-7 rounded-full bg-[#E2E6F0] flex items-center justify-center text-xs font-bold text-[#6B7280]">
            R
          </div>
        </div>
      </div>

      <div className="flex-1 px-6 lg:px-10 py-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="display-font text-2xl font-bold text-[#0D1117]">Application queue</h1>
            <p className="text-sm text-[#6B7280] mt-0.5">Review and process organization applications</p>
          </div>
          <div className="relative w-full sm:w-72">
            <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9CA3AF]" viewBox="0 0 16 16" fill="currentColor">
              <path d="M6.5 1a5.5 5.5 0 104.472 8.719l3.155 3.154a.75.75 0 001.06-1.06l-3.154-3.155A5.5 5.5 0 006.5 1zM2.5 6.5a4 4 0 118 0 4 4 0 01-8 0z" />
            </svg>
            <input
              type="search"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search applicants or organizations…"
              className="w-full pl-9 pr-4 py-2.5 text-sm bg-white border border-[#E2E6F0] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1746A2]"
            />
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {[
            { label: 'Pending review', value: counts.pending, color: 'text-[#D97706]' },
            { label: 'Info required', value: counts['info-required'], color: 'text-[#1746A2]' },
            { label: 'Approved (30d)', value: counts.approved, color: 'text-[#059669]' },
            { label: 'Rejected (30d)', value: counts.rejected, color: 'text-[#DC2626]' },
          ].map(s => (
            <div key={s.label} className="bg-white rounded-xl border border-[#E2E6F0] px-5 py-4">
              <p className="text-xs text-[#9CA3AF] font-medium mb-1">{s.label}</p>
              <p className={`display-font text-3xl font-bold ${s.color}`}>{s.value}</p>
            </div>
          ))}
        </div>

        {/* Filter tabs */}
        <div className="flex gap-1 p-1 bg-white rounded-xl border border-[#E2E6F0] w-fit mb-5">
          {(['all', 'pending', 'info-required', 'approved', 'rejected'] as AppStatus[]).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3.5 py-1.5 text-sm font-semibold rounded-lg transition-colors flex items-center gap-1.5 ${filter === f ? 'bg-[#1746A2] text-white' : 'text-[#6B7280] hover:text-[#0D1117]'}`}
            >
              <span className="capitalize">{f === 'info-required' ? 'Info required' : f}</span>
              {f !== 'all' && counts[f] > 0 && (
                <span className={`text-xs font-bold px-1.5 py-0.5 rounded-full min-w-[20px] text-center ${filter === f ? 'bg-white/20 text-white' : 'bg-[#F1F3F8] text-[#6B7280]'}`}>
                  {counts[f]}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl border border-[#E2E6F0] overflow-hidden">
          <div className="hidden lg:grid grid-cols-[1fr_160px_140px_120px_100px] px-5 py-3 border-b border-[#F1F3F8] bg-[#F8FAFF]">
            {['Organization', 'Applicant', 'Type', 'Submitted', 'Status'].map(h => (
              <p key={h} className="text-xs font-bold text-[#9CA3AF] uppercase tracking-wide">{h}</p>
            ))}
          </div>

          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="text-3xl mb-3">📋</div>
              <p className="text-sm font-semibold text-[#374151]">No applications found</p>
              <p className="text-xs text-[#9CA3AF] mt-1">Try adjusting your search or filter.</p>
            </div>
          ) : filtered.map((app, i) => {
            const sc = statusConfig[app.status]
            return (
              <button
                key={app.id}
                onClick={() => navigate('org-review-detail', { clientId: app.id })}
                className={`w-full text-left flex flex-col lg:grid lg:grid-cols-[1fr_160px_140px_120px_100px] items-start lg:items-center gap-2 lg:gap-0 px-5 py-4 hover:bg-[#F8FAFF] transition-colors ${i < filtered.length - 1 ? 'border-b border-[#F1F3F8]' : ''}`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-full bg-[#EEF2FF] flex items-center justify-center text-[#1746A2] text-sm font-bold shrink-0">
                    {app.orgName.charAt(0)}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-[#0D1117] truncate">{app.orgName}</p>
                      {app.flagged && <span className="text-[10px] font-bold text-[#1746A2] bg-[#EEF2FF] px-1.5 py-0.5 rounded-full shrink-0">Flag</span>}
                    </div>
                    <p className="text-xs text-[#9CA3AF]">{app.location} · {app.estimatedMembers} est. members</p>
                  </div>
                </div>
                <div className="min-w-0">
                  <p className="text-sm text-[#374151] font-medium truncate">{app.applicantName}</p>
                  <p className="text-xs text-[#9CA3AF] truncate">{app.applicantEmail}</p>
                </div>
                <p className="text-xs text-[#6B7280] lg:truncate">{app.orgType}</p>
                <p className="text-sm text-[#6B7280]">{app.submittedDate}</p>
                <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${sc.badge}`}>{sc.label}</span>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
