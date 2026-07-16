import { useState } from 'react'
import { Badge } from '../ui'
import { OwnerShell } from './OwnerShell'
import { JOIN_REQUESTS } from './data'
import type { View, NavMeta } from '../../App'

interface Props { navigate: (v: View, meta?: NavMeta) => void }

export function OwnerJoinRequests({ navigate }: Props) {
  const [requests, setRequests] = useState(JOIN_REQUESTS)
  const [selected, setSelected] = useState<string | null>(null)
  const [declineReason, setDeclineReason] = useState('')
  const [processingId, setProcessingId] = useState<string | null>(null)

  const pending = requests.filter(r => r.status === 'pending')
  const resolved = requests.filter(r => r.status !== 'pending')

  const approve = (id: string) => {
    setProcessingId(id)
    setTimeout(() => {
      setRequests(r => r.map(req => req.id === id ? { ...req, status: 'approved' as const } : req))
      setProcessingId(null)
      setSelected(null)
    }, 1200)
  }

  const decline = (id: string) => {
    setProcessingId(id)
    setTimeout(() => {
      setRequests(r => r.map(req => req.id === id ? { ...req, status: 'declined' as const } : req))
      setProcessingId(null)
      setSelected(null)
      setDeclineReason('')
    }, 1000)
  }

  const RequestCard = ({ req }: { req: typeof JOIN_REQUESTS[0] }) => {
    const isProcessing = processingId === req.id
    const isPending = req.status === 'pending'
    const isSelected = selected === req.id

    return (
      <div className={`bg-white rounded-xl border transition-all ${isSelected ? 'border-[#1746A2] shadow-sm' : 'border-[#E2E6F0]'} overflow-hidden`}>
        <div
          className="flex items-center gap-4 px-5 py-4 cursor-pointer hover:bg-[#F8FAFF]"
          onClick={() => setSelected(isSelected ? null : req.id)}
        >
          <div className="w-10 h-10 rounded-full bg-[#EEF2FF] flex items-center justify-center text-sm font-bold text-[#1746A2] shrink-0">
            {req.initials}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-[#0D1117]">{req.name}</p>
            <p className="text-xs text-[#6B7280] mt-0.5">{req.occupation} · {req.employer}</p>
            <p className="text-xs text-[#9CA3AF] mt-0.5">Requested {req.requestedAt} → {req.groupName}</p>
          </div>
          <div className="shrink-0">
            {req.status === 'pending' ? <Badge variant="pending">Pending</Badge> : req.status === 'approved' ? <Badge variant="verified">Approved</Badge> : <Badge variant="rejected">Declined</Badge>}
          </div>
        </div>

        {/* Expanded detail */}
        {isSelected && isPending && (
          <div className="border-t border-[#F1F3F8] px-5 py-4 bg-[#F8FAFF]">
            <div className="grid sm:grid-cols-3 gap-3 mb-4">
              {[
                { label: 'Occupation', value: req.occupation },
                { label: 'Employer', value: req.employer },
                { label: 'Referred by', value: req.referredBy ?? 'No referral' },
              ].map(r => (
                <div key={r.label}>
                  <p className="text-[10px] text-[#9CA3AF] uppercase tracking-wide">{r.label}</p>
                  <p className="text-sm font-semibold text-[#0D1117] mt-0.5">{r.value}</p>
                </div>
              ))}
            </div>

            {/* Decline reason (optional) */}
            <div className="mb-4">
              <label className="text-xs font-semibold text-[#6B7280]">Decline reason (optional — sent to applicant)</label>
              <textarea
                value={declineReason}
                onChange={e => setDeclineReason(e.target.value)}
                rows={2}
                placeholder="e.g. Group is currently full. Please re-apply when a position opens."
                className="mt-1 w-full px-3 py-2 text-sm bg-white border border-[#E2E6F0] rounded-lg text-[#0D1117] placeholder:text-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#1746A2] resize-none"
              />
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => approve(req.id)}
                disabled={isProcessing}
                className="flex-1 py-2.5 text-sm font-bold bg-[#059669] text-white rounded-xl hover:bg-[#047857] disabled:opacity-60 transition-colors"
              >
                {isProcessing ? 'Approving…' : '✓ Approve member'}
              </button>
              <button
                onClick={() => decline(req.id)}
                disabled={isProcessing}
                className="flex-1 py-2.5 text-sm font-bold bg-white text-[#DC2626] border border-[#FECACA] rounded-xl hover:bg-[#FEF2F2] disabled:opacity-60 transition-colors"
              >
                {isProcessing ? 'Declining…' : '✕ Decline'}
              </button>
            </div>
          </div>
        )}
      </div>
    )
  }

  return (
    <OwnerShell navigate={navigate} activeView="owner-join-requests">
      <div className="bg-white border-b border-[#E2E6F0] px-6 lg:px-8 py-5 shrink-0">
        <h1 className="display-font text-xl font-bold text-[#0D1117]">Join requests</h1>
        <p className="text-sm text-[#6B7280] mt-0.5">{pending.length} pending · {resolved.length} resolved</p>
      </div>

      <div className="flex-1 overflow-y-auto px-6 lg:px-8 py-6">
        <div className="max-w-2xl flex flex-col gap-6">

          {pending.length > 0 && (
            <div>
              <p className="text-xs font-bold text-[#9CA3AF] uppercase tracking-wide mb-3">Pending review</p>
              <div className="flex flex-col gap-3">
                {pending.map(r => <RequestCard key={r.id} req={r} />)}
              </div>
            </div>
          )}

          {resolved.length > 0 && (
            <div>
              <p className="text-xs font-bold text-[#9CA3AF] uppercase tracking-wide mb-3">Resolved</p>
              <div className="flex flex-col gap-3">
                {resolved.map(r => <RequestCard key={r.id} req={r} />)}
              </div>
            </div>
          )}

          {pending.length === 0 && resolved.length === 0 && (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <div className="text-4xl mb-4">✅</div>
              <p className="text-sm font-bold text-[#374151] mb-1">No join requests</p>
              <p className="text-sm text-[#9CA3AF]">When members request to join your groups, they will appear here.</p>
            </div>
          )}
        </div>
      </div>
    </OwnerShell>
  )
}
