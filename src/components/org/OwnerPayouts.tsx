import { useState } from 'react'
import { Alert } from '../ui'
import { OwnerShell } from './OwnerShell'
import { UPCOMING_PAYOUTS } from './data'
import type { View, NavMeta } from '../../App'

interface Props { navigate: (v: View, meta?: NavMeta) => void }

type PayoutState = 'upcoming' | 'in-progress' | 'ready-to-record' | 'sent' | 'confirmed' | 'disputed'

interface ExtendedPayout {
  id: string
  recipientName: string
  recipientInitials: string
  groupName: string
  roundNumber: number
  payoutAmount: number
  dueDate: string
  contributionsPaid: number
  contributionsTotal: number
  state: PayoutState
  sentRef?: string
  sentDate?: string
  sentNote?: string
  disputeNote?: string
}

const toState = (p: typeof UPCOMING_PAYOUTS[0]): PayoutState => {
  if (p.status === 'upcoming') return 'upcoming'
  if (p.contributionsPaid === p.contributionsTotal) return 'ready-to-record'
  return 'in-progress'
}

export function OwnerPayouts({ navigate }: Props) {
  const [payouts, setPayouts] = useState<ExtendedPayout[]>(() =>
    UPCOMING_PAYOUTS.map(p => ({
      id: p.id,
      recipientName: p.recipientName,
      recipientInitials: p.recipientInitials,
      groupName: p.groupName,
      roundNumber: p.roundNumber,
      payoutAmount: p.payoutAmount,
      dueDate: p.dueDate,
      contributionsPaid: p.contributionsPaid,
      contributionsTotal: p.contributionsTotal,
      state: toState(p),
    }))
  )

  const [expanded, setExpanded] = useState<string | null>(null)
  const [recordForm, setRecordForm] = useState<{ ref: string; date: string; note: string }>({ ref: '', date: '', note: '' })
  const [recordErrors, setRecordErrors] = useState<{ ref?: string; date?: string }>({})
  const [submitting, setSubmitting] = useState(false)
  const [disputeNote, setDisputeNote] = useState('')

  const update = (id: string, patch: Partial<ExtendedPayout>) =>
    setPayouts(ps => ps.map(p => p.id === id ? { ...p, ...patch } : p))

  const recordAsSent = (id: string) => {
    const e: typeof recordErrors = {}
    if (!recordForm.ref.trim()) e.ref = 'Transaction reference is required.'
    if (!recordForm.date) e.date = 'Date of payment is required.'
    setRecordErrors(e)
    if (Object.keys(e).length) return

    setSubmitting(true)
    setTimeout(() => {
      update(id, { state: 'sent', sentRef: recordForm.ref, sentDate: recordForm.date, sentNote: recordForm.note || undefined })
      setSubmitting(false)
      setExpanded(null)
      setRecordForm({ ref: '', date: '', note: '' })
      setRecordErrors({})
    }, 1200)
  }

  const confirmReceipt = (id: string) => {
    update(id, { state: 'confirmed' })
    setExpanded(null)
  }

  const recordDispute = (id: string) => {
    update(id, { state: 'disputed', disputeNote: disputeNote || 'Recipient reported an issue with this payout.' })
    setDisputeNote('')
    setExpanded(null)
  }

  const resolveDispute = (id: string) => update(id, { state: 'confirmed' })

  const ready = payouts.filter(p => p.state === 'ready-to-record')
  const inProgress = payouts.filter(p => p.state === 'in-progress')
  const sent = payouts.filter(p => p.state === 'sent')
  const upcoming = payouts.filter(p => p.state === 'upcoming')
  const disputed = payouts.filter(p => p.state === 'disputed')
  const confirmed = payouts.filter(p => p.state === 'confirmed')

  const PayoutCard = ({ p }: { p: ExtendedPayout }) => {
    const isExpanded = expanded === p.id
    const pct = Math.round((p.contributionsPaid / p.contributionsTotal) * 100)

    return (
      <div className={`bg-white rounded-xl border overflow-hidden transition-all ${p.state === 'ready-to-record' ? 'border-[#059669]' : p.state === 'confirmed' ? 'border-[#A7F3D0]' : p.state === 'disputed' ? 'border-[#FECACA]' : p.state === 'sent' ? 'border-[#C7D2FE]' : 'border-[#E2E6F0]'}`}>
        <div
          className="px-5 py-4 cursor-pointer hover:bg-[#F8FAFF] transition-colors"
          onClick={() => setExpanded(isExpanded ? null : p.id)}
        >
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#EEF2FF] flex items-center justify-center text-sm font-bold text-[#1746A2] shrink-0">
                {p.recipientInitials}
              </div>
              <div>
                <p className="text-sm font-bold text-[#0D1117]">{p.recipientName}</p>
                <p className="text-xs text-[#9CA3AF]">{p.groupName} · Round {p.roundNumber} · Due {p.dueDate}</p>
              </div>
            </div>
            <div className="text-right shrink-0">
              <p className="display-font text-base font-bold text-[#0D1117]">₦{p.payoutAmount.toLocaleString()}</p>
              <p className={`text-xs font-semibold mt-0.5 ${p.state === 'ready-to-record' ? 'text-[#059669]' : p.state === 'confirmed' ? 'text-[#059669]' : p.state === 'disputed' ? 'text-[#DC2626]' : p.state === 'sent' ? 'text-[#1746A2]' : p.state === 'in-progress' ? 'text-[#D97706]' : 'text-[#9CA3AF]'}`}>
                {p.state === 'ready-to-record' && 'Ready to record'}
                {p.state === 'in-progress' && `${p.contributionsPaid}/${p.contributionsTotal} contributions`}
                {p.state === 'sent' && 'Awaiting confirmation'}
                {p.state === 'confirmed' && 'Payout confirmed'}
                {p.state === 'disputed' && 'Dispute recorded'}
                {p.state === 'upcoming' && 'Upcoming'}
              </p>
            </div>
          </div>

          {/* Progress bar for in-progress */}
          {(p.state === 'in-progress' || p.state === 'ready-to-record') && (
            <div className="mt-3">
              <div className="h-1.5 bg-[#F1F3F8] rounded-full overflow-hidden">
                <div className={`h-full rounded-full ${pct === 100 ? 'bg-[#059669]' : 'bg-[#D97706]'}`} style={{ width: `${pct}%` }} />
              </div>
              <p className="text-xs text-[#9CA3AF] mt-1">{p.contributionsPaid} of {p.contributionsTotal} contributions verified</p>
            </div>
          )}

          {/* Sent summary */}
          {p.state === 'sent' && p.sentRef && (
            <div className="mt-2 text-xs text-[#6B7280]">Ref: <span className="font-mono text-[#1746A2]">{p.sentRef}</span> · {p.sentDate}</div>
          )}
        </div>

        {/* Expanded content */}
        {isExpanded && (
          <div className="border-t border-[#F1F3F8] px-5 py-5 bg-[#F8FAFF]">

            {/* Ready to record — show form */}
            {p.state === 'ready-to-record' && (
              <div>
                <Alert type="success" className="mb-4">
                  All {p.contributionsTotal} contributions have been verified. You can now record this payout.
                </Alert>
                <div className="bg-[#EEF2FF] rounded-xl px-4 py-3 mb-4 text-xs text-[#374151]">
                  <span className="font-semibold text-[#1746A2]">How payouts work on TCS:</span> Transfer ₦{p.payoutAmount.toLocaleString()} from your organization's settlement account to {p.recipientName}'s registered account. Then record the transaction reference here so TCS can track the payout and notify the recipient to confirm receipt.
                </div>
                <div className="flex flex-col gap-3">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-[#0D1117]">Transaction reference <span className="text-[#DC2626]">*</span></label>
                    <input
                      value={recordForm.ref}
                      onChange={e => setRecordForm(f => ({ ...f, ref: e.target.value }))}
                      placeholder="e.g. GTB/2025/08/00198765"
                      className="w-full px-3 py-2 text-sm font-mono bg-white border border-[#E2E6F0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1746A2] placeholder:font-sans placeholder:text-[#9CA3AF]"
                    />
                    {recordErrors.ref && <p className="text-xs text-[#DC2626]">{recordErrors.ref}</p>}
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-[#0D1117]">Date of payment <span className="text-[#DC2626]">*</span></label>
                    <input
                      type="date"
                      value={recordForm.date}
                      onChange={e => setRecordForm(f => ({ ...f, date: e.target.value }))}
                      className="w-full px-3 py-2 text-sm bg-white border border-[#E2E6F0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1746A2]"
                    />
                    {recordErrors.date && <p className="text-xs text-[#DC2626]">{recordErrors.date}</p>}
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-[#0D1117]">Note <span className="text-[#9CA3AF] font-normal">(optional)</span></label>
                    <input
                      value={recordForm.note}
                      onChange={e => setRecordForm(f => ({ ...f, note: e.target.value }))}
                      placeholder="e.g. Sent via GTBank mobile app"
                      className="w-full px-3 py-2 text-sm bg-white border border-[#E2E6F0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1746A2] placeholder:text-[#9CA3AF]"
                    />
                  </div>
                  <button
                    onClick={() => recordAsSent(p.id)}
                    disabled={submitting}
                    className="w-full py-2.5 text-sm font-bold bg-[#1746A2] text-white rounded-xl hover:bg-[#1339A0] disabled:opacity-60 transition-colors"
                  >
                    {submitting ? 'Recording…' : `Record payout as sent to ${p.recipientName}`}
                  </button>
                </div>
              </div>
            )}

            {/* Sent — awaiting confirmation */}
            {p.state === 'sent' && (
              <div>
                <div className="bg-[#EEF2FF] rounded-xl border border-[#C7D2FE] px-4 py-4 mb-4">
                  <p className="text-xs font-bold text-[#9CA3AF] uppercase tracking-wide mb-2">Recorded payout details</p>
                  <div className="flex flex-col gap-2 text-sm">
                    <div className="flex justify-between"><span className="text-[#6B7280]">Amount</span><span className="font-semibold">₦{p.payoutAmount.toLocaleString()}</span></div>
                    <div className="flex justify-between"><span className="text-[#6B7280]">Reference</span><span className="font-mono text-xs text-[#1746A2] font-bold">{p.sentRef}</span></div>
                    <div className="flex justify-between"><span className="text-[#6B7280]">Date sent</span><span className="font-semibold">{p.sentDate}</span></div>
                    {p.sentNote && <div className="flex justify-between"><span className="text-[#6B7280]">Note</span><span className="text-[#374151]">{p.sentNote}</span></div>}
                  </div>
                </div>
                <p className="text-xs text-[#6B7280] mb-3">Once {p.recipientName} has confirmed receipt, mark the payout as confirmed below. If there is an issue, record a dispute so TCS can log it for resolution.</p>
                <div className="flex gap-2">
                  <button
                    onClick={() => confirmReceipt(p.id)}
                    className="flex-1 py-2.5 text-sm font-bold bg-[#059669] text-white rounded-xl hover:bg-[#047857] transition-colors"
                  >
                    ✓ Recipient confirmed receipt
                  </button>
                  <button
                    onClick={() => setExpanded(p.id + '-dispute')}
                    className="flex-1 py-2.5 text-sm font-bold bg-white text-[#DC2626] border border-[#FECACA] rounded-xl hover:bg-[#FEF2F2] transition-colors"
                  >
                    Record dispute
                  </button>
                </div>

                {expanded === p.id + '-dispute' && (
                  <div className="mt-3 flex flex-col gap-2">
                    <textarea
                      value={disputeNote}
                      onChange={e => setDisputeNote(e.target.value)}
                      rows={2}
                      placeholder="Describe the dispute — e.g. Recipient claims payment was not received."
                      className="w-full px-3 py-2 text-sm bg-white border border-[#FECACA] rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-[#DC2626] placeholder:text-[#9CA3AF]"
                    />
                    <button
                      onClick={() => recordDispute(p.id)}
                      className="w-full py-2 text-sm font-bold bg-[#DC2626] text-white rounded-xl hover:bg-[#B91C1C] transition-colors"
                    >
                      Confirm dispute
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Disputed */}
            {p.state === 'disputed' && (
              <div>
                <Alert type="error" className="mb-4">
                  A dispute has been recorded for this payout. Work with {p.recipientName} and TCS support to resolve it before marking as complete.
                </Alert>
                {p.disputeNote && (
                  <div className="bg-[#FEF2F2] rounded-lg px-4 py-3 mb-4 text-sm text-[#991B1B] italic">"{p.disputeNote}"</div>
                )}
                <button
                  onClick={() => resolveDispute(p.id)}
                  className="w-full py-2.5 text-sm font-bold bg-white text-[#374151] border border-[#E2E6F0] rounded-xl hover:bg-[#F4F6FA] transition-colors"
                >
                  Mark dispute resolved
                </button>
              </div>
            )}

            {/* Confirmed */}
            {p.state === 'confirmed' && (
              <div className="flex items-center gap-3 py-2.5 px-4 bg-[#ECFDF5] rounded-xl">
                <svg className="w-5 h-5 text-[#059669] shrink-0" viewBox="0 0 16 16" fill="currentColor"><path d="M13.78 4.22a.75.75 0 010 1.06l-7.25 7.25a.75.75 0 01-1.06 0L2.22 9.28a.75.75 0 011.06-1.06L6 10.94l6.72-6.72a.75.75 0 011.06 0z" /></svg>
                <div>
                  <p className="text-sm font-bold text-[#059669]">Payout confirmed</p>
                  <p className="text-xs text-[#059669]/80">{p.recipientName} has confirmed receipt of ₦{p.payoutAmount.toLocaleString()}.</p>
                </div>
              </div>
            )}

          </div>
        )}
      </div>
    )
  }

  const Section = ({ title, items, empty }: { title: string; items: ExtendedPayout[]; empty?: string }) =>
    items.length === 0 ? null : (
      <div>
        <p className="text-xs font-bold text-[#9CA3AF] uppercase tracking-wide mb-3">{title}</p>
        <div className="flex flex-col gap-3">{items.map(p => <PayoutCard key={p.id} p={p} />)}</div>
      </div>
    )

  return (
    <OwnerShell navigate={navigate} activeView="owner-payouts">
      <div className="bg-white border-b border-[#E2E6F0] px-6 lg:px-8 py-5 shrink-0">
        <h1 className="display-font text-xl font-bold text-[#0D1117]">Payout tracker</h1>
        <p className="text-sm text-[#6B7280] mt-0.5">Record and track payouts across your groups</p>
      </div>

      <div className="flex-1 overflow-y-auto px-6 lg:px-8 py-6">
        <div className="max-w-2xl flex flex-col gap-7">

          {/* Platform note */}
          <div className="flex gap-3 bg-[#EEF2FF] rounded-xl border border-[#C7D2FE] px-5 py-4">
            <svg className="w-4 h-4 text-[#1746A2] shrink-0 mt-0.5" viewBox="0 0 16 16" fill="currentColor"><path d="M8 1a7 7 0 110 14A7 7 0 018 1zm.75 3a.75.75 0 00-1.5 0v5c0 .414.336.75.75.75h3a.75.75 0 000-1.5H8.75V4z" /></svg>
            <p className="text-xs text-[#374151] leading-relaxed">
              <span className="font-semibold text-[#1746A2]">TCS records, not disburses.</span> Contributions are collected through your approved digital payment provider and settled directly to your organization's settlement account. Use this screen to record payouts you have made and track recipient confirmation. TCS does not hold or transfer funds on your behalf.
            </p>
          </div>

          {disputed.length > 0 && (
            <div>
              <Alert type="error">
                {disputed.length} payout{disputed.length > 1 ? 's have' : ' has'} an active dispute. Please resolve before the next cycle round.
              </Alert>
            </div>
          )}

          <Section title="Ready to record" items={ready} />
          <Section title="In progress — collecting contributions" items={inProgress} />
          <Section title="Sent — awaiting confirmation" items={sent} />
          <Section title="Disputes" items={disputed} />
          <Section title="Upcoming" items={upcoming} />
          <Section title="Confirmed" items={confirmed} />

          {payouts.length === 0 && (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <div className="text-4xl mb-4">💰</div>
              <p className="text-sm font-bold text-[#374151] mb-1">No payouts tracked yet</p>
              <p className="text-sm text-[#9CA3AF]">Payouts appear here once a cycle round is underway.</p>
            </div>
          )}
        </div>
      </div>
    </OwnerShell>
  )
}
