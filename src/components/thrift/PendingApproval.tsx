import { useState } from 'react'
import { Button, Badge, Alert } from '../ui'
import { AppShell } from './AppShell'
import type { View, NavMeta } from '../../App'

interface Props { navigate: (v: View, meta?: NavMeta) => void }

type RequestStatus = 'pending' | 'approved' | 'declined'

interface JoinRequest {
  id: string
  communityName: string
  coordinator: string
  amount: number
  frequency: string
  submittedDate: string
  submittedTime: string
  status: RequestStatus
  declineReason?: string
  position?: number
  firstDueDate?: string
}

const REQUESTS: JoinRequest[] = [
  {
    id: 'r1',
    communityName: 'Mainland Savers Club',
    coordinator: 'Emeka Nwosu',
    amount: 50000,
    frequency: 'Monthly',
    submittedDate: '29 Jul 2025',
    submittedTime: '2 hours ago',
    status: 'pending',
  },
  {
    id: 'r2',
    communityName: 'Yaba Tech Thrift',
    coordinator: 'Seun Bello',
    amount: 10000,
    frequency: 'Monthly',
    submittedDate: '20 Jul 2025',
    submittedTime: '9 days ago',
    status: 'approved',
    position: 9,
    firstDueDate: '1 Aug 2025',
  },
  {
    id: 'r3',
    communityName: 'Victoria Island Executives',
    coordinator: 'Tunde Adeyemi',
    amount: 100000,
    frequency: 'Monthly',
    submittedDate: '10 Jul 2025',
    submittedTime: '19 days ago',
    status: 'declined',
    declineReason: "We currently require members with a minimum of 6 months' TCS history. Please reapply in January 2026.",
  },
]

function RequestCard({ req, navigate }: { req: JoinRequest; navigate: (v: View, meta?: NavMeta) => void }) {
  const [withdrawn, setWithdrawn] = useState(false)
  const [withdrawing, setWithdrawing] = useState(false)

  if (withdrawn) return null

  const handleWithdraw = () => {
    setWithdrawing(true)
    setTimeout(() => {
      setWithdrawing(false)
      setWithdrawn(true)
    }, 1200)
  }

  return (
    <div className={`bg-white rounded-xl border overflow-hidden ${req.status === 'approved' ? 'border-[#A7F3D0]' : req.status === 'declined' ? 'border-[#FECACA]' : 'border-[#E2E6F0]'}`}>
      {/* Card header */}
      <div className={`px-5 py-1.5 text-[10px] font-bold uppercase tracking-widest ${req.status === 'approved' ? 'bg-[#ECFDF5] text-[#065F46]' : req.status === 'declined' ? 'bg-[#FEF2F2] text-[#991B1B]' : 'bg-[#FFFBEB] text-[#92400E]'}`}>
        {req.status === 'approved' ? '✓ Request approved' : req.status === 'declined' ? '✕ Request declined' : '⏳ Awaiting coordinator review'}
      </div>

      <div className="p-5">
        {/* Community info */}
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#EEF2FF] flex items-center justify-center text-xl shrink-0">🏘</div>
            <div>
              <p className="text-sm font-bold text-[#0D1117]">{req.communityName}</p>
              <p className="text-xs text-[#6B7280]">Coordinated by {req.coordinator}</p>
            </div>
          </div>
          <Badge
            variant={req.status === 'approved' ? 'verified' : req.status === 'declined' ? 'rejected' : 'pending'}
          >
            {req.status === 'approved' ? 'Approved' : req.status === 'declined' ? 'Declined' : 'Pending'}
          </Badge>
        </div>

        {/* Details row */}
        <div className="flex items-center gap-4 text-xs text-[#6B7280] mb-4 pb-4 border-b border-[#F1F3F8]">
          <span>₦{req.amount.toLocaleString()}/{req.frequency === 'Monthly' ? 'mo' : 'wk'}</span>
          <span className="w-1 h-1 rounded-full bg-[#D1D5DB]" />
          <span>Submitted {req.submittedDate}</span>
          <span className="w-1 h-1 rounded-full bg-[#D1D5DB]" />
          <span>{req.submittedTime}</span>
        </div>

        {/* Status-specific content */}
        {req.status === 'pending' && (
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-xs text-[#92400E]">
              <div className="w-5 h-5 rounded-full bg-[#FEF3C7] flex items-center justify-center">
                <svg className="w-3 h-3 text-[#D97706] animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
              </div>
              Waiting for {req.coordinator} to respond
            </div>
            <button
              onClick={handleWithdraw}
              disabled={withdrawing}
              className="text-xs font-semibold text-[#DC2626] hover:underline disabled:opacity-50"
            >
              {withdrawing ? 'Withdrawing…' : 'Withdraw request'}
            </button>
          </div>
        )}

        {req.status === 'approved' && (
          <div className="flex flex-col gap-3">
            <div className="bg-[#ECFDF5] rounded-xl border border-[#A7F3D0] px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <p className="text-xs font-bold text-[#065F46] mb-1">You are now a member! 🎉</p>
                <div className="flex flex-wrap gap-3 text-xs text-[#065F46]">
                  <span>Position: <strong>#{req.position}</strong></span>
                  <span className="w-1 h-1 rounded-full bg-[#A7F3D0] self-center" />
                  <span>First contribution due: <strong>{req.firstDueDate}</strong></span>
                </div>
              </div>
              <Button size="sm" variant="success" onClick={() => navigate('dashboard')}>
                View in dashboard →
              </Button>
            </div>
          </div>
        )}

        {req.status === 'declined' && (
          <div className="flex flex-col gap-3">
            <div className="bg-[#FEF2F2] rounded-xl border border-[#FECACA] px-4 py-3">
              <p className="text-xs font-bold text-[#991B1B] mb-1">Reason from coordinator</p>
              <p className="text-xs text-[#991B1B] leading-relaxed">{req.declineReason}</p>
            </div>
            <div className="flex gap-2">
              <Button size="sm" variant="secondary" onClick={() => navigate('discover')} className="flex-1">
                Find another group
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export function PendingApproval({ navigate }: Props) {
  const pendingCount = REQUESTS.filter(r => r.status === 'pending').length
  const approvedCount = REQUESTS.filter(r => r.status === 'approved').length
  const declinedCount = REQUESTS.filter(r => r.status === 'declined').length

  return (
    <AppShell navigate={navigate} activeView="pending-approval">
      {/* Topbar */}
      <div className="bg-white border-b border-[#E2E6F0] px-6 lg:px-8 py-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="display-font text-xl font-bold text-[#0D1117] mb-0.5">Join requests</h1>
            <p className="text-sm text-[#6B7280]">
              {REQUESTS.length} request{REQUESTS.length !== 1 ? 's' : ''} · {pendingCount} awaiting response
            </p>
          </div>
          <Button size="sm" onClick={() => navigate('discover')}>+ Browse more groups</Button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-6 lg:px-8 py-7">
        <div className="max-w-2xl">

          {/* Summary pills */}
          <div className="flex gap-3 mb-7">
            {[
              { label: 'Pending', count: pendingCount, color: 'bg-[#FEF3C7] text-[#92400E]' },
              { label: 'Approved', count: approvedCount, color: 'bg-[#D1FAE5] text-[#065F46]' },
              { label: 'Declined', count: declinedCount, color: 'bg-[#FEE2E2] text-[#991B1B]' },
            ].map(pill => (
              <div key={pill.label} className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold ${pill.color}`}>
                <span className="text-base font-bold">{pill.count}</span>
                {pill.label}
              </div>
            ))}
          </div>

          {/* Tip for pending */}
          {pendingCount > 0 && (
            <Alert type="info" className="mb-5">
              Coordinators typically respond within 24–48 hours. You will receive a TCS notification and SMS when a decision is made.
            </Alert>
          )}

          {/* Request cards */}
          <div className="flex flex-col gap-4">
            {REQUESTS.map(req => (
              <RequestCard key={req.id} req={req} navigate={navigate} />
            ))}
          </div>

          {/* Empty state fallback */}
          {REQUESTS.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="text-4xl mb-3">📋</div>
              <p className="text-sm font-semibold text-[#374151] mb-1">No join requests yet</p>
              <p className="text-xs text-[#9CA3AF] mb-5">Browse communities and request to join a thrift group.</p>
              <Button onClick={() => navigate('discover')}>Discover communities</Button>
            </div>
          )}

          {/* Tip */}
          <div className="mt-8 p-4 rounded-xl bg-[#F8FAFF] border border-[#E2E6F0]">
            <p className="text-xs font-semibold text-[#0D1117] mb-1.5">💡 Tips for getting approved</p>
            <ul className="text-xs text-[#6B7280] flex flex-col gap-1 leading-relaxed">
              <li>• Write a genuine, personal introduction in your request</li>
              <li>• Ensure your identity and bank account are verified</li>
              <li>• Only request groups whose contribution amount you can comfortably afford</li>
              <li>• Be patient — coordinators review requests carefully</li>
            </ul>
          </div>
        </div>
      </div>
    </AppShell>
  )
}
