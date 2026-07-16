import { useState, useEffect } from 'react'
import { Button, Alert } from '../ui'
import { AppShell } from './AppShell'
import { getGroup } from './data'
import type { View, NavMeta } from '../../App'

interface Props {
  navigate: (v: View, meta?: NavMeta) => void
  groupId?: string
  roundId?: string
  confirmMode?: 'auto' | 'pending'
}

// ── Auto-confirm path ────────────────────────────────────────────────────────

function AutoConfirm({ navigate, g, round }: { navigate: (v: View, meta?: NavMeta) => void; g: any; round: any }) {
  const [step, setStep] = useState<'processing' | 'confirmed'>('processing')

  useEffect(() => {
    const t = setTimeout(() => setStep('confirmed'), 2200)
    return () => clearTimeout(t)
  }, [])

  return (
    <div className="max-w-lg mx-auto px-6 py-12 text-center">
      {step === 'processing' ? (
        <>
          <div className="flex justify-center mb-8">
            <div className="w-20 h-20 rounded-2xl bg-[#EEF2FF] flex items-center justify-center">
              <svg className="animate-spin w-10 h-10 text-[#1746A2]" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
              </svg>
            </div>
          </div>
          <h1 className="display-font text-xl font-bold text-[#0D1117] mb-2">Recording your contribution…</h1>
          <p className="text-sm text-[#6B7280]">This usually takes just a moment. Please do not close this page.</p>
        </>
      ) : (
        <>
          <div className="flex justify-center mb-8">
            <div className="relative">
              <div className="absolute inset-0 rounded-full bg-[#ECFDF5] animate-ping opacity-20 scale-125" />
              <div className="relative w-20 h-20 rounded-2xl bg-[#ECFDF5] border-2 border-[#A7F3D0] flex items-center justify-center">
                <svg className="w-10 h-10 text-[#059669]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
            </div>
          </div>

          <h1 className="display-font text-2xl font-bold text-[#0D1117] mb-2">Contribution recorded!</h1>
          <p className="text-[#6B7280] text-sm leading-relaxed mb-8">
            Your Round {round.roundNumber} contribution of <strong className="text-[#0D1117]">₦{round.amount.toLocaleString()}</strong> to <strong className="text-[#0D1117]">{g.name}</strong> has been confirmed and recorded.
          </p>

          {/* Receipt */}
          <div className="bg-[#F8FAFF] rounded-2xl border border-[#E2E6F0] p-5 mb-7 text-left">
            <p className="text-[10px] font-bold text-[#9CA3AF] uppercase tracking-widest mb-4">Contribution receipt</p>
            {[
              { label: 'Group', value: g.name },
              { label: 'Round', value: `${round.roundNumber} of ${g.totalRounds}` },
              { label: 'Amount', value: `₦${round.amount.toLocaleString()}` },
              { label: 'Date', value: '1 Aug 2025' },
              { label: 'Reference', value: `TCS0000${round.roundNumber}88` },
              { label: 'Payout to', value: round.payoutRecipient },
            ].map((row, i, arr) => (
              <div key={i} className={`flex justify-between py-2.5 ${i < arr.length - 1 ? 'border-b border-[#E2E6F0]' : ''}`}>
                <p className="text-xs text-[#6B7280]">{row.label}</p>
                <p className="text-xs font-semibold text-[#0D1117]">{row.value}</p>
              </div>
            ))}
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <Button size="lg" className="flex-1" onClick={() => navigate('contribution-schedule', { groupId: g.id })}>
              Back to schedule
            </Button>
            <Button variant="secondary" size="lg" className="flex-1" onClick={() => navigate('dashboard')}>
              Dashboard
            </Button>
          </div>
        </>
      )}
    </div>
  )
}

// ── Pending-verification path ────────────────────────────────────────────────

function PendingConfirm({ navigate, g, round }: { navigate: (v: View, meta?: NavMeta) => void; g: any; round: any }) {
  const [ref, setRef] = useState('')
  const [note, setNote] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!ref.trim()) { setError('Please enter your gateway transaction ID.'); return }
    setError('')
    setSubmitting(true)
    setTimeout(() => { setSubmitting(false); setSubmitted(true) }, 1600)
  }

  if (submitted) {
    return (
      <div className="max-w-lg mx-auto px-6 py-12 text-center">
        <div className="flex justify-center mb-8">
          <div className="w-20 h-20 rounded-2xl bg-[#FFFBEB] border-2 border-[#FDE68A] flex items-center justify-center">
            <svg className="w-10 h-10 text-[#D97706]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
        </div>
        <h1 className="display-font text-2xl font-bold text-[#0D1117] mb-2">Transaction ID submitted</h1>
        <p className="text-[#6B7280] text-sm leading-relaxed mb-7">
          Your transaction ID <strong className="font-mono text-[#0D1117]">{ref}</strong> has been logged. The Organization Owner will review the exception and update your contribution status.
        </p>

        <div className="bg-[#FFFBEB] rounded-xl border border-[#FDE68A] p-5 mb-7 text-left">
          <p className="text-xs font-bold text-[#92400E] uppercase tracking-wide mb-3">What happens next</p>
          {[
            { step: 'Transaction ID received', done: true, detail: 'Your transaction ID has been logged as an exception.' },
            { step: 'Organization Owner review', done: false, active: true, detail: `${g.coordinator.name} will review the exception and resolve it.` },
            { step: 'Contribution confirmed', done: false, detail: "Your Round " + round.roundNumber + " contribution will be marked as confirmed once resolved." },
          ].map((s, i, arr) => (
            <div key={i} className="flex gap-3 mb-3 last:mb-0">
              <div className="flex flex-col items-center">
                <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${s.done ? 'bg-[#059669]' : s.active ? 'bg-[#D97706]' : 'bg-[#E2E6F0]'}`}>
                  {s.done ? <svg className="w-3 h-3 text-white" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2"><path d="M2 6l2.5 2.5L10 3" strokeLinecap="round" /></svg> : s.active ? <div className="w-2 h-2 rounded-full bg-white" /> : null}
                </div>
                {i < arr.length - 1 && <div className="w-px flex-1 min-h-[16px] mt-0.5 bg-[#E2E6F0]" />}
              </div>
              <div className="pb-2">
                <p className={`text-xs font-semibold ${s.done ? 'text-[#059669]' : s.active ? 'text-[#92400E]' : 'text-[#9CA3AF]'}`}>{s.step}</p>
                <p className="text-xs text-[#9CA3AF] mt-0.5">{s.detail}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="flex gap-3">
          <Button size="lg" className="flex-1" onClick={() => navigate('contribution-schedule', { groupId: g.id })}>View schedule</Button>
          <Button variant="secondary" size="lg" className="flex-1" onClick={() => navigate('dashboard')}>Dashboard</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-lg mx-auto px-6 py-8">
      <div className="mb-6">
        <h1 className="display-font text-xl font-bold text-[#0D1117] mb-1">Contribution exception</h1>
        <p className="text-sm text-[#6B7280]">Your contribution was not automatically confirmed by the payment gateway. Enter your gateway transaction ID so the Organization Owner can review the exception.</p>
      </div>

      <div className="bg-[#F8FAFF] rounded-xl border border-[#E2E6F0] px-5 py-4 mb-5 flex items-center gap-4">
        <div className="w-10 h-10 rounded-xl bg-[#EEF2FF] flex items-center justify-center text-xl shrink-0">{g.emoji}</div>
        <div>
          <p className="text-sm font-bold text-[#0D1117]">{g.name}</p>
          <p className="text-xs text-[#6B7280]">Round {round.roundNumber} · ₦{round.amount.toLocaleString()} · Due {round.dueDate}</p>
        </div>
      </div>

      {error && <div className="mb-4 rounded-xl border border-[#FECACA] bg-[#FEF2F2] px-4 py-3 text-xs text-[#991B1B]">{error}</div>}

      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-semibold text-[#0D1117]">Gateway transaction ID <span className="text-[#DC2626]">*</span></label>
          <input
            value={ref}
            onChange={e => setRef(e.target.value)}
            placeholder="e.g. FBN/TXN/2025/08/0012345678"
            className="w-full px-3.5 py-2.5 text-sm bg-white border border-[#E2E6F0] rounded-[10px] text-[#0D1117] placeholder:text-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#1746A2] font-mono"
          />
          <p className="text-xs text-[#6B7280]">Found in your mobile banking app, SMS receipt, or payment gateway confirmation.</p>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-semibold text-[#0D1117]">Additional note <span className="text-[#9CA3AF] font-normal">(optional)</span></label>
          <textarea
            value={note}
            onChange={e => setNote(e.target.value)}
            rows={3}
            placeholder="e.g. Paid via GTBank mobile app on 1 Aug 2025 at 10:30 AM"
            className="w-full px-3.5 py-2.5 text-sm bg-white border border-[#E2E6F0] rounded-[10px] text-[#0D1117] placeholder:text-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#1746A2] resize-none"
          />
        </div>

        <Alert type="warning">
          Contributions are normally confirmed automatically. This form is only for exception cases where automatic confirmation did not complete. The Organization Owner ({g.coordinator.name}) will review and resolve the exception.
        </Alert>

        <Button type="submit" size="lg" loading={submitting} className="w-full">
          Submit transaction ID
        </Button>
        <button type="button" onClick={() => navigate('contribution-detail', { groupId: g.id, roundId: round.id })} className="text-sm text-[#6B7280] hover:text-[#0D1117] text-center">
          Cancel
        </button>
      </form>
    </div>
  )
}

// ── Shell ────────────────────────────────────────────────────────────────────

export function PaymentConfirmation({ navigate, groupId, roundId, confirmMode = 'auto' }: Props) {
  const g = getGroup(groupId)
  const round = g.rounds.find(r => r.id === roundId) ?? g.rounds[7]

  return (
    <AppShell navigate={navigate} activeView="my-groups">
      <div className="bg-white border-b border-[#E2E6F0] px-6 lg:px-8 py-3.5 flex items-center gap-3 shrink-0">
        <button onClick={() => navigate('contribution-detail', { groupId: g.id, roundId: round.id })} className="flex items-center gap-1.5 text-sm text-[#6B7280] hover:text-[#0D1117] font-medium">
          <svg className="w-4 h-4" viewBox="0 0 16 16" fill="currentColor"><path d="M9.78 11.78a.75.75 0 01-1.06 0L4.47 7.53a.75.75 0 010-1.06l4.25-4.25a.75.75 0 111.06 1.06L6.06 7l3.72 3.72a.75.75 0 010 1.06z" /></svg>
          Round {round.roundNumber} details
        </button>
        <span className="text-[#E2E6F0]">/</span>
        <span className="text-sm font-semibold text-[#0D1117]">
          {confirmMode === 'auto' ? 'Record contribution' : 'Report exception'}
        </span>
      </div>
      <div className="flex-1 overflow-y-auto">
        {confirmMode === 'auto'
          ? <AutoConfirm navigate={navigate} g={g} round={round} />
          : <PendingConfirm navigate={navigate} g={g} round={round} />}
      </div>
    </AppShell>
  )
}
