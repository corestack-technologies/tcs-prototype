import { useState, useEffect } from 'react'
import { Button } from '../ui'
import { AppShell } from './AppShell'
import { getGroup } from './data'
import type { View, NavMeta } from '../../App'

interface Props {
  navigate: (v: View, meta?: NavMeta) => void
  groupId?: string
  roundId?: string
  payAmount?: number
}

type GatewayState =
  | 'redirecting'
  | 'gateway'       // mock gateway page — member selects outcome
  | 'processing'
  | 'success'
  | 'pending'
  | 'failed'
  | 'abandoned'
  | 'unavailable'

function Spinner({ className = 'w-10 h-10' }: { className?: string }) {
  return (
    <svg className={`animate-spin ${className}`} viewBox="0 0 24 24" fill="none">
      <circle className="opacity-20" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-80" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
    </svg>
  )
}

// ── Redirecting ──────────────────────────────────────────────────────────────

function Redirecting({ onDone }: { onDone: () => void }) {
  useEffect(() => {
    const t = setTimeout(onDone, 2500)
    return () => clearTimeout(t)
  }, [onDone])

  return (
    <div className="max-w-lg mx-auto px-6 py-16 text-center">
      <div className="flex justify-center mb-8">
        <div className="w-20 h-20 rounded-2xl bg-[#EEF2FF] flex items-center justify-center">
          <Spinner className="w-10 h-10 text-[#1746A2]" />
        </div>
      </div>
      <h1 className="display-font text-xl font-bold text-[#0D1117] mb-2">Redirecting to secure checkout…</h1>
      <p className="text-sm text-[#6B7280]">You are being redirected to the payment gateway. Do not close this page.</p>
      <div className="mt-6 flex items-center justify-center gap-2 text-xs text-[#9CA3AF]">
        <svg className="w-4 h-4 text-[#059669]" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" /></svg>
        Secure connection · Payments processed by your digital payment provider
      </div>
    </div>
  )
}

// ── Mock Gateway ─────────────────────────────────────────────────────────────

function MockGateway({ amount, onOutcome }: { amount: number; onOutcome: (o: 'success' | 'failed' | 'abandoned' | 'pending' | 'unavailable') => void }) {
  const fee = Math.round(amount * 0.015)
  const total = amount + fee

  return (
    <div className="max-w-lg mx-auto px-6 py-8">
      {/* Gateway header */}
      <div className="bg-[#0D1117] rounded-2xl px-5 py-4 mb-6 flex items-center justify-between">
        <div>
          <p className="text-[10px] text-[#9CA3AF] uppercase tracking-widest">Secure Checkout</p>
          <p className="text-white font-bold text-sm mt-0.5">Digital Payment Gateway</p>
        </div>
        <svg className="w-5 h-5 text-[#059669]" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" /></svg>
      </div>

      <div className="bg-white rounded-xl border border-[#E2E6F0] p-5 mb-5">
        <p className="text-[10px] font-bold text-[#9CA3AF] uppercase tracking-widest mb-3">Payment summary</p>
        <div className="flex justify-between py-2 border-b border-[#F1F3F8]">
          <p className="text-sm text-[#6B7280]">Contribution principal</p>
          <p className="text-sm font-semibold text-[#0D1117]">₦{amount.toLocaleString()}</p>
        </div>
        <div className="flex justify-between py-2 border-b border-[#F1F3F8]">
          <p className="text-sm text-[#6B7280]">Processing fee (1.5%)</p>
          <p className="text-sm font-semibold text-[#0D1117]">₦{fee.toLocaleString()}</p>
        </div>
        <div className="flex justify-between py-3">
          <p className="text-sm font-bold text-[#0D1117]">Total</p>
          <p className="text-sm font-bold text-[#1746A2]">₦{total.toLocaleString()}</p>
        </div>
      </div>

      <div className="bg-[#FFFBEB] rounded-xl border border-[#FDE68A] px-4 py-3 mb-5">
        <p className="text-xs font-semibold text-[#92400E]">Demo mode — select a payment outcome:</p>
      </div>

      <div className="flex flex-col gap-2.5">
        <button
          onClick={() => onOutcome('success')}
          className="w-full py-3 px-4 rounded-xl bg-[#059669] text-white text-sm font-bold hover:bg-[#047857] transition-colors"
        >
          ✓ Complete payment successfully
        </button>
        <button
          onClick={() => onOutcome('pending')}
          className="w-full py-3 px-4 rounded-xl bg-[#D97706] text-white text-sm font-bold hover:bg-[#B45309] transition-colors"
        >
          ⏳ Payment pending (gateway not yet confirmed)
        </button>
        <button
          onClick={() => onOutcome('failed')}
          className="w-full py-3 px-4 rounded-xl bg-[#DC2626] text-white text-sm font-bold hover:bg-[#B91C1C] transition-colors"
        >
          ✕ Payment failed (insufficient funds / declined)
        </button>
        <button
          onClick={() => onOutcome('unavailable')}
          className="w-full py-3 px-4 rounded-xl bg-white border border-[#E2E6F0] text-[#6B7280] text-sm font-semibold hover:bg-[#F4F6FA] transition-colors"
        >
          ⚠ Provider temporarily unavailable
        </button>
        <button
          onClick={() => onOutcome('abandoned')}
          className="w-full py-3 px-4 rounded-xl bg-white border border-[#E2E6F0] text-[#6B7280] text-sm font-semibold hover:bg-[#F4F6FA] transition-colors"
        >
          ← Abandon / go back
        </button>
      </div>
    </div>
  )
}

// ── Processing ──────────────────────────────────────────────────────────────

function Processing() {
  return (
    <div className="max-w-lg mx-auto px-6 py-16 text-center">
      <div className="flex justify-center mb-8">
        <div className="relative">
          <div className="absolute inset-0 rounded-full bg-[#EEF2FF] animate-ping opacity-30 scale-125" />
          <div className="relative w-20 h-20 rounded-2xl bg-[#EEF2FF] flex items-center justify-center">
            <Spinner className="w-10 h-10 text-[#1746A2]" />
          </div>
        </div>
      </div>
      <h1 className="display-font text-xl font-bold text-[#0D1117] mb-2">Payment processing…</h1>
      <p className="text-sm text-[#6B7280]">Your payment is being processed. Please wait — do not close this page.</p>
    </div>
  )
}

// ── Success ──────────────────────────────────────────────────────────────────

function Success({ navigate, g, round, payAmount }: { navigate: (v: View, meta?: NavMeta) => void; g: any; round: any; payAmount: number }) {
  const fee = Math.round(payAmount * 0.015)
  const newPaid = (round.amountPaid ?? 0) + payAmount
  const isFullyPaid = newPaid >= round.amount
  const providerRef = `GTB/2025/${new Date().getMonth() + 1 < 10 ? '0' : ''}${new Date().getMonth() + 1}/${Date.now().toString().slice(-6)}`

  return (
    <div className="max-w-lg mx-auto px-6 py-12 text-center">
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

      <h1 className="display-font text-2xl font-bold text-[#0D1117] mb-2">
        {isFullyPaid ? 'Contribution recorded!' : 'Partial payment confirmed!'}
      </h1>
      <p className="text-[#6B7280] text-sm leading-relaxed mb-8">
        {isFullyPaid
          ? `Your Round ${round.roundNumber} contribution of ₦${round.amount.toLocaleString()} to ${g.name} is now fully confirmed.`
          : `₦${payAmount.toLocaleString()} recorded. ₦${(round.amount - newPaid).toLocaleString()} remains outstanding for Round ${round.roundNumber}.`}
      </p>

      {/* Receipt */}
      <div className="bg-[#F8FAFF] rounded-2xl border border-[#E2E6F0] p-5 mb-7 text-left">
        <p className="text-[10px] font-bold text-[#9CA3AF] uppercase tracking-widest mb-4">Payment receipt</p>
        {[
          { label: 'Group', value: g.name },
          { label: 'Round', value: `${round.roundNumber} of ${g.totalRounds}` },
          { label: 'Amount paid now', value: `₦${payAmount.toLocaleString()}` },
          { label: 'Processing fee', value: `₦${fee.toLocaleString()}` },
          { label: 'Total charged', value: `₦${(payAmount + fee).toLocaleString()}` },
          { label: 'Cumulative paid', value: `₦${newPaid.toLocaleString()} of ₦${round.amount.toLocaleString()}` },
          { label: 'Provider reference', value: <span className="font-mono text-xs">{providerRef}</span> },
          { label: 'Confirmed', value: new Date().toLocaleString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) },
        ].map((row: any, i, arr) => (
          <div key={i} className={`flex justify-between items-start py-2.5 ${i < arr.length - 1 ? 'border-b border-[#E2E6F0]' : ''}`}>
            <p className="text-xs text-[#6B7280]">{row.label}</p>
            <p className="text-xs font-semibold text-[#0D1117] text-right max-w-[180px]">{row.value}</p>
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
    </div>
  )
}

// ── Pending ──────────────────────────────────────────────────────────────────

function Pending({ navigate, g }: { navigate: (v: View, meta?: NavMeta) => void; g: any }) {
  return (
    <div className="max-w-lg mx-auto px-6 py-12 text-center">
      <div className="flex justify-center mb-8">
        <div className="w-20 h-20 rounded-2xl bg-[#FFFBEB] border-2 border-[#FDE68A] flex items-center justify-center">
          <svg className="w-10 h-10 text-[#D97706]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      </div>
      <h1 className="display-font text-xl font-bold text-[#0D1117] mb-2">Payment pending</h1>
      <p className="text-[#6B7280] text-sm leading-relaxed mb-7">
        Your payment has been submitted but the gateway has not yet confirmed it. This usually resolves within a few minutes. Your contribution status will update automatically once confirmed.
      </p>
      <div className="bg-[#FFFBEB] rounded-xl border border-[#FDE68A] p-5 mb-7 text-left">
        <p className="text-xs font-bold text-[#92400E] mb-2">What to do</p>
        <ul className="text-xs text-[#92400E] space-y-1.5 list-disc list-inside">
          <li>Check your bank or payment app for transaction confirmation.</li>
          <li>If your bank debited the amount, your contribution will be confirmed automatically.</li>
          <li>If this persists beyond 24 hours, contact your Organization Owner.</li>
        </ul>
      </div>
      <div className="flex gap-3">
        <Button size="lg" className="flex-1" onClick={() => navigate('contribution-schedule', { groupId: g.id })}>
          View schedule
        </Button>
        <Button variant="secondary" size="lg" className="flex-1" onClick={() => navigate('dashboard')}>
          Dashboard
        </Button>
      </div>
    </div>
  )
}

// ── Failed ───────────────────────────────────────────────────────────────────

function Failed({ navigate, g, round, payAmount, onRetry }: { navigate: (v: View, meta?: NavMeta) => void; g: any; round: any; payAmount: number; onRetry: () => void }) {
  return (
    <div className="max-w-lg mx-auto px-6 py-12 text-center">
      <div className="flex justify-center mb-8">
        <div className="w-20 h-20 rounded-2xl bg-[#FEF2F2] border-2 border-[#FECACA] flex items-center justify-center">
          <svg className="w-10 h-10 text-[#DC2626]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M6 18L18 6M6 6l12 12" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      </div>
      <h1 className="display-font text-xl font-bold text-[#0D1117] mb-2">Payment failed</h1>
      <p className="text-[#6B7280] text-sm leading-relaxed mb-2">
        Your payment of ₦{payAmount.toLocaleString()} was not completed. No amount has been charged and your contribution is unchanged.
      </p>
      <p className="text-xs text-[#9CA3AF] mb-7">Reason: Insufficient funds or card declined by issuer.</p>
      <div className="flex flex-col gap-3">
        <Button size="lg" className="w-full" onClick={onRetry}>
          Retry payment
        </Button>
        <Button variant="secondary" size="lg" className="w-full" onClick={() => navigate('contribution-detail', { groupId: g.id, roundId: round.id })}>
          Back to contribution
        </Button>
      </div>
    </div>
  )
}

// ── Abandoned ────────────────────────────────────────────────────────────────

function Abandoned({ navigate, g, round }: { navigate: (v: View, meta?: NavMeta) => void; g: any; round: any }) {
  return (
    <div className="max-w-lg mx-auto px-6 py-12 text-center">
      <div className="flex justify-center mb-8">
        <div className="w-20 h-20 rounded-2xl bg-[#F4F6FA] border-2 border-[#E2E6F0] flex items-center justify-center">
          <svg className="w-10 h-10 text-[#6B7280]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M10 19l-7-7m0 0l7-7m-7 7h18" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      </div>
      <h1 className="display-font text-xl font-bold text-[#0D1117] mb-2">Payment abandoned</h1>
      <p className="text-[#6B7280] text-sm leading-relaxed mb-7">
        You returned from the payment gateway without completing payment. No amount was charged. Your contribution for Round {round.roundNumber} remains outstanding.
      </p>
      <div className="flex flex-col gap-3">
        <Button size="lg" className="w-full" onClick={() => navigate('contribution-detail', { groupId: g.id, roundId: round.id })}>
          Back to contribution
        </Button>
        <Button variant="secondary" size="lg" className="w-full" onClick={() => navigate('contribution-schedule', { groupId: g.id })}>
          View schedule
        </Button>
      </div>
    </div>
  )
}

// ── Unavailable ──────────────────────────────────────────────────────────────

function Unavailable({ navigate, g, round, onRetry }: { navigate: (v: View, meta?: NavMeta) => void; g: any; round: any; onRetry: () => void }) {
  return (
    <div className="max-w-lg mx-auto px-6 py-12 text-center">
      <div className="flex justify-center mb-8">
        <div className="w-20 h-20 rounded-2xl bg-[#FFF7ED] border-2 border-[#FDBA74] flex items-center justify-center">
          <svg className="w-10 h-10 text-[#EA580C]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      </div>
      <h1 className="display-font text-xl font-bold text-[#0D1117] mb-2">Payment provider temporarily unavailable</h1>
      <p className="text-[#6B7280] text-sm leading-relaxed mb-7">
        The payment gateway is currently experiencing issues. No amount was charged. Please try again in a few minutes. Your contribution deadline remains {round.dueDate}.
      </p>
      <div className="flex flex-col gap-3">
        <Button size="lg" className="w-full" onClick={onRetry}>
          Try again
        </Button>
        <Button variant="secondary" size="lg" className="w-full" onClick={() => navigate('contribution-detail', { groupId: g.id, roundId: round.id })}>
          Back to contribution
        </Button>
      </div>
    </div>
  )
}

// ── Shell ────────────────────────────────────────────────────────────────────

export function PaymentGateway({ navigate, groupId, roundId, payAmount: initialPayAmount }: Props) {
  const g = getGroup(groupId)
  const round = g.rounds.find(r => r.id === roundId) ?? g.rounds[7]
  const payAmount = initialPayAmount ?? (round.amount - (round.amountPaid ?? 0))

  const [state, setState] = useState<GatewayState>('redirecting')

  const handleOutcome = (outcome: 'success' | 'failed' | 'abandoned' | 'pending' | 'unavailable') => {
    if (outcome === 'success' || outcome === 'failed') {
      setState('processing')
      setTimeout(() => setState(outcome), 1800)
    } else {
      setState(outcome)
    }
  }

  const handleRetry = () => setState('redirecting')

  const breadcrumb = {
    redirecting: 'Checkout',
    gateway: 'Checkout',
    processing: 'Processing',
    success: 'Payment confirmed',
    pending: 'Payment pending',
    failed: 'Payment failed',
    abandoned: 'Payment abandoned',
    unavailable: 'Provider unavailable',
  }[state]

  return (
    <AppShell navigate={navigate} activeView="my-groups">
      <div className="bg-white border-b border-[#E2E6F0] px-6 lg:px-8 py-3.5 flex items-center gap-3 shrink-0">
        <button
          onClick={() => navigate('contribution-detail', { groupId: g.id, roundId: round.id })}
          className="flex items-center gap-1.5 text-sm text-[#6B7280] hover:text-[#0D1117] font-medium"
        >
          <svg className="w-4 h-4" viewBox="0 0 16 16" fill="currentColor"><path d="M9.78 11.78a.75.75 0 01-1.06 0L4.47 7.53a.75.75 0 010-1.06l4.25-4.25a.75.75 0 111.06 1.06L6.06 7l3.72 3.72a.75.75 0 010 1.06z" /></svg>
          Round {round.roundNumber}
        </button>
        <span className="text-[#E2E6F0]">/</span>
        <span className="text-sm font-semibold text-[#0D1117]">{breadcrumb}</span>
      </div>

      <div className="flex-1 overflow-y-auto">
        {state === 'redirecting'  && <Redirecting onDone={() => setState('gateway')} />}
        {state === 'gateway'      && <MockGateway amount={payAmount} onOutcome={handleOutcome} />}
        {state === 'processing'   && <Processing />}
        {state === 'success'      && <Success navigate={navigate} g={g} round={round} payAmount={payAmount} />}
        {state === 'pending'      && <Pending navigate={navigate} g={g} />}
        {state === 'failed'       && <Failed navigate={navigate} g={g} round={round} payAmount={payAmount} onRetry={handleRetry} />}
        {state === 'abandoned'    && <Abandoned navigate={navigate} g={g} round={round} />}
        {state === 'unavailable'  && <Unavailable navigate={navigate} g={g} round={round} onRetry={handleRetry} />}
      </div>
    </AppShell>
  )
}
