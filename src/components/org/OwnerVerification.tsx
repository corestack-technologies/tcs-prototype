import { useState } from 'react'
import { Badge, Alert } from '../ui'
import { OwnerShell } from './OwnerShell'
import { VERIFICATION_QUEUE } from './data'
import type { View, NavMeta } from '../../App'

interface Props { navigate: (v: View, meta?: NavMeta) => void }

export function OwnerVerification({ navigate }: Props) {
  const [items, setItems] = useState(VERIFICATION_QUEUE)
  const [selected, setSelected] = useState<string | null>(null)
  const [rejectReason, setRejectReason] = useState('')
  const [processingId, setProcessingId] = useState<string | null>(null)

  const pending = items.filter(v => v.status === 'pending')
  const resolved = items.filter(v => v.status !== 'pending')

  const confirm = (id: string) => {
    setProcessingId(id)
    setTimeout(() => {
      setItems(v => v.map(item => item.id === id ? { ...item, status: 'verified' as const } : item))
      setProcessingId(null)
      setSelected(null)
    }, 1200)
  }

  const dismiss = (id: string) => {
    setProcessingId(id)
    setTimeout(() => {
      setItems(v => v.map(item => item.id === id ? { ...item, status: 'rejected' as const } : item))
      setProcessingId(null)
      setSelected(null)
      setRejectReason('')
    }, 1000)
  }

  const ItemCard = ({ item }: { item: typeof VERIFICATION_QUEUE[0] }) => {
    const isSelected = selected === item.id
    const isPending = item.status === 'pending'

    return (
      <div className={`bg-white rounded-xl border transition-all ${isSelected ? 'border-[#1746A2]' : 'border-[#E2E6F0]'} overflow-hidden`}>
        <div className="flex items-center gap-4 px-5 py-4 cursor-pointer hover:bg-[#F8FAFF]"
          onClick={() => setSelected(isSelected ? null : item.id)}>
          <div className="w-10 h-10 rounded-full bg-[#EEF2FF] flex items-center justify-center text-sm font-bold text-[#1746A2] shrink-0">
            {item.memberInitials}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-[#0D1117]">{item.memberName}</p>
            <p className="text-xs text-[#6B7280] mt-0.5">{item.groupName} · Round {item.roundNumber}</p>
            <p className="text-xs text-[#9CA3AF] mt-0.5">Flagged {item.submittedAt}</p>
          </div>
          <div className="text-right shrink-0">
            <p className="text-sm font-bold text-[#0D1117]">₦{item.amount.toLocaleString()}</p>
            {item.status === 'pending'
              ? <Badge variant="pending">Needs review</Badge>
              : item.status === 'verified'
              ? <Badge variant="verified">Resolved</Badge>
              : <Badge variant="rejected">Dismissed</Badge>}
          </div>
        </div>

        {isSelected && isPending && (
          <div className="border-t border-[#F1F3F8] px-5 py-4 bg-[#F8FAFF]">
            <div className="bg-white rounded-xl border border-[#E2E6F0] px-4 py-3.5 mb-4">
              <p className="text-[10px] font-bold text-[#9CA3AF] uppercase tracking-wide mb-2">Gateway transaction ID</p>
              <p className="font-mono text-sm text-[#1746A2] font-bold break-all">{item.reference}</p>
              {item.note && <p className="text-xs text-[#6B7280] mt-2 italic">"{item.note}"</p>}
            </div>

            <Alert type="info" className="mb-4">
              This contribution from {item.memberName} of ₦{item.amount.toLocaleString()} for Round {item.roundNumber} requires your attention. Confirm to mark it as resolved or dismiss it with a note.
            </Alert>

            <div className="mb-4">
              <label className="text-xs font-semibold text-[#6B7280]">Dismissal note (optional — shared with member)</label>
              <textarea
                value={rejectReason}
                onChange={e => setRejectReason(e.target.value)}
                rows={2}
                placeholder="e.g. Transaction ID not matched to your account. Please contact the Organization Owner."
                className="mt-1 w-full px-3 py-2 text-sm bg-white border border-[#E2E6F0] rounded-lg text-[#0D1117] placeholder:text-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#1746A2] resize-none"
              />
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => confirm(item.id)}
                disabled={processingId === item.id}
                className="flex-1 py-2.5 text-sm font-bold bg-[#059669] text-white rounded-xl hover:bg-[#047857] disabled:opacity-60 transition-colors"
              >
                {processingId === item.id ? 'Resolving…' : '✓ Mark as resolved'}
              </button>
              <button
                onClick={() => dismiss(item.id)}
                disabled={processingId === item.id}
                className="flex-1 py-2.5 text-sm font-bold bg-white text-[#DC2626] border border-[#FECACA] rounded-xl hover:bg-[#FEF2F2] disabled:opacity-60 transition-colors"
              >
                ✕ Dismiss exception
              </button>
            </div>
          </div>
        )}
      </div>
    )
  }

  return (
    <OwnerShell navigate={navigate} activeView="owner-verification">
      <div className="bg-white border-b border-[#E2E6F0] px-6 lg:px-8 py-5 shrink-0">
        <h1 className="display-font text-xl font-bold text-[#0D1117]">Contribution exceptions</h1>
        <p className="text-sm text-[#6B7280] mt-0.5">{pending.length} requiring review · {resolved.length} resolved</p>
      </div>

      <div className="flex-1 overflow-y-auto px-6 lg:px-8 py-6">
        <div className="max-w-2xl flex flex-col gap-6">

          {pending.length > 0 && (
            <div>
              <Alert type="warning" className="mb-4">
                {pending.length} contribution{pending.length > 1 ? 's' : ''} {pending.length > 1 ? 'have' : 'has'} been flagged for review. Payout readiness for the affected round is held until all exceptions are resolved.
              </Alert>
              <p className="text-xs font-bold text-[#9CA3AF] uppercase tracking-wide mb-3">Requiring review</p>
              <div className="flex flex-col gap-3">
                {pending.map(item => <ItemCard key={item.id} item={item} />)}
              </div>
            </div>
          )}

          {resolved.length > 0 && (
            <div>
              <p className="text-xs font-bold text-[#9CA3AF] uppercase tracking-wide mb-3">Resolved</p>
              <div className="flex flex-col gap-3">
                {resolved.map(item => <ItemCard key={item.id} item={item} />)}
              </div>
            </div>
          )}

          {pending.length === 0 && resolved.length === 0 && (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <div className="text-4xl mb-4">✅</div>
              <p className="text-sm font-bold text-[#374151] mb-1">No exceptions</p>
              <p className="text-sm text-[#9CA3AF]">All contributions are being processed normally through the payment gateway.</p>
            </div>
          )}
        </div>
      </div>
    </OwnerShell>
  )
}
