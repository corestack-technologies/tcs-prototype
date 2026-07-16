import { useState } from 'react'
import { Button, Badge, Alert } from '../ui'
import { AppShell } from './AppShell'
import { getGroup } from './data'
import type { View, NavMeta } from '../../App'

interface Props {
  navigate: (v: View, meta?: NavMeta) => void
  groupId?: string
  roundId?: string
}

const STATUS_CONFIG: Record<string, { label: string; bg: string; border: string; iconBg: string; textColor: string; subColor: string }> = {
  upcoming:           { label: 'Upcoming',             bg: 'bg-[#F8FAFF]',   border: 'border-[#C7D2FE]', iconBg: 'bg-[#EEF2FF]',   textColor: 'text-[#1E40AF]', subColor: 'text-[#3B82F6]' },
  open:               { label: 'Open for payment',     bg: 'bg-[#EFF6FF]',   border: 'border-[#BFDBFE]', iconBg: 'bg-[#DBEAFE]',   textColor: 'text-[#1E40AF]', subColor: 'text-[#2563EB]' },
  partial:            { label: 'Partially paid',       bg: 'bg-[#FFFBEB]',   border: 'border-[#FDE68A]', iconBg: 'bg-[#FEF3C7]',   textColor: 'text-[#92400E]', subColor: 'text-[#D97706]' },
  paid:               { label: 'Contribution recorded',bg: 'bg-[#ECFDF5]',   border: 'border-[#A7F3D0]', iconBg: 'bg-[#D1FAE5]',   textColor: 'text-[#065F46]', subColor: 'text-[#059669]' },
  'grace-period':     { label: 'Grace period',         bg: 'bg-[#FFF7ED]',   border: 'border-[#FDBA74]', iconBg: 'bg-[#FFEDD5]',   textColor: 'text-[#9A3412]', subColor: 'text-[#EA580C]' },
  overdue:            { label: 'Overdue',              bg: 'bg-[#FEF2F2]',   border: 'border-[#FECACA]', iconBg: 'bg-[#FEE2E2]',   textColor: 'text-[#991B1B]', subColor: 'text-[#DC2626]' },
  'settled-by-policy':{ label: 'Settled by policy',   bg: 'bg-[#F0FDF4]',   border: 'border-[#BBF7D0]', iconBg: 'bg-[#DCFCE7]',   textColor: 'text-[#14532D]', subColor: 'text-[#16A34A]' },
}

function StatusIcon({ status }: { status: string }) {
  if (status === 'paid' || status === 'settled-by-policy') return (
    <svg className="w-7 h-7 text-[#059669]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
      <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
  if (status === 'overdue') return (
    <svg className="w-7 h-7 text-[#DC2626]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
  if (status === 'grace-period') return (
    <svg className="w-7 h-7 text-[#EA580C]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
  if (status === 'partial') return (
    <svg className="w-7 h-7 text-[#D97706]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 8v4m0 4h.01" strokeLinecap="round" />
      <circle cx="12" cy="12" r="10" />
    </svg>
  )
  return (
    <svg className="w-7 h-7 text-[#1746A2]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" strokeLinecap="round" />
    </svg>
  )
}

export function ContributionDetail({ navigate, groupId, roundId }: Props) {
  const g = getGroup(groupId)
  const round = g.rounds.find(r => r.id === roundId) ?? g.rounds[7]

  const status = round.status
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG['upcoming']

  const outstanding = round.amount - (round.amountPaid ?? 0)
  const isUpcoming = status === 'upcoming'
  const isPayable = ['open', 'partial', 'grace-period'].includes(status)
  const isOverdue = status === 'overdue'
  const isPaid = status === 'paid'
  const isSettled = status === 'settled-by-policy'

  // Partial payment amount state
  const [payAmount, setPayAmount] = useState(outstanding)
  const fee = Math.round(payAmount * (round.processingFeePct ?? 1.5) / 100)
  const totalPayable = payAmount + fee

  const paidPct = round.amount > 0 ? Math.round(((round.amountPaid ?? 0) / round.amount) * 100) : 0

  const refNumber = round.reference ?? `TCS-${round.roundNumber.toString().padStart(5, '0')}`

  return (
    <AppShell navigate={navigate} activeView="my-groups">
      {/* Breadcrumb */}
      <div className="bg-white border-b border-[#E2E6F0] px-6 lg:px-8 py-3.5 flex items-center gap-3 shrink-0">
        <button onClick={() => navigate('contribution-schedule', { groupId: g.id })} className="flex items-center gap-1.5 text-sm text-[#6B7280] hover:text-[#0D1117] font-medium">
          <svg className="w-4 h-4" viewBox="0 0 16 16" fill="currentColor"><path d="M9.78 11.78a.75.75 0 01-1.06 0L4.47 7.53a.75.75 0 010-1.06l4.25-4.25a.75.75 0 111.06 1.06L6.06 7l3.72 3.72a.75.75 0 010 1.06z" /></svg>
          Schedule
        </button>
        <span className="text-[#E2E6F0]">/</span>
        <span className="text-sm font-semibold text-[#0D1117]">Round {round.roundNumber}</span>
      </div>

      <div className="flex-1 overflow-y-auto px-6 lg:px-8 py-7">
        <div className="max-w-2xl">

          {/* Status hero */}
          <div className={`rounded-2xl p-6 mb-6 ${cfg.bg} border ${cfg.border}`}>
            <div className="flex items-center gap-4">
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 ${cfg.iconBg}`}>
                <StatusIcon status={status} />
              </div>
              <div>
                <p className={`text-lg font-bold display-font ${cfg.textColor}`}>{cfg.label}</p>
                <p className={`text-sm ${cfg.subColor}`}>
                  {isPaid && `Paid on ${round.paidDate}`}
                  {isSettled && 'Settled by group policy'}
                  {status === 'partial' && `₦${(round.amountPaid ?? 0).toLocaleString()} of ₦${round.amount.toLocaleString()} paid`}
                  {status === 'open' && `Payment window open · due ${round.dueDate}`}
                  {status === 'upcoming' && `Payment opens ${round.openDate ?? '—'}`}
                  {status === 'grace-period' && `Normal deadline passed · grace ends ${round.gracePeriodEnd}`}
                  {isOverdue && `Grace period ended · default charge may apply`}
                </p>
              </div>
            </div>
            {/* Payment progress bar for partial/open */}
            {(status === 'partial' || status === 'open') && (
              <div className="mt-4">
                <div className="h-2 bg-white/60 rounded-full overflow-hidden">
                  <div className="h-full bg-[#D97706] rounded-full transition-all" style={{ width: `${paidPct}%` }} />
                </div>
                <p className="text-xs text-right mt-1 text-[#92400E]">{paidPct}% paid</p>
              </div>
            )}
          </div>

          {/* Contribution period details */}
          <div className="bg-white rounded-xl border border-[#E2E6F0] p-5 mb-4">
            <p className="text-xs font-bold text-[#9CA3AF] uppercase tracking-wide mb-4">Contribution period</p>
            <div className="flex flex-col">
              {[
                { label: 'Group', value: g.name },
                { label: 'Round', value: `${round.roundNumber} of ${g.totalRounds}` },
                { label: 'Payout recipient', value: round.payoutRecipient ?? '—' },
                round.openDate && { label: 'Payment window opens', value: round.openDate },
                { label: 'Normal deadline', value: round.dueDate },
                round.gracePeriodEnd && { label: 'Grace period ends', value: round.gracePeriodEnd },
                { label: 'Status', value: <StatusBadge status={status} /> },
              ].filter(Boolean).map((row: any, i: number, arr: any[]) => (
                <div key={i} className={`flex items-start justify-between gap-4 py-3 ${i < arr.length - 1 ? 'border-b border-[#F1F3F8]' : ''}`}>
                  <p className="text-sm text-[#6B7280] shrink-0">{row.label}</p>
                  <div className="text-sm font-semibold text-[#0D1117] text-right">{row.value}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Amount breakdown */}
          <div className="bg-white rounded-xl border border-[#E2E6F0] p-5 mb-4">
            <p className="text-xs font-bold text-[#9CA3AF] uppercase tracking-wide mb-4">Amount</p>
            <div className="flex flex-col">
              {[
                { label: 'Contribution obligation', value: `₦${round.amount.toLocaleString()}`, bold: false },
                { label: 'Amount paid', value: `₦${(round.amountPaid ?? 0).toLocaleString()}`, color: 'text-[#059669]', bold: false },
                { label: 'Outstanding', value: `₦${outstanding.toLocaleString()}`, color: outstanding > 0 ? 'text-[#DC2626]' : 'text-[#059669]', bold: true },
              ].map((row: any, i) => (
                <div key={i} className={`flex items-center justify-between py-3 ${i < 2 ? 'border-b border-[#F1F3F8]' : ''}`}>
                  <p className="text-sm text-[#6B7280]">{row.label}</p>
                  <p className={`text-sm ${row.bold ? 'font-bold' : 'font-semibold'} ${row.color ?? 'text-[#0D1117]'}`}>{row.value}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Paid receipt */}
          {(isPaid || isSettled) && (
            <div className="bg-white rounded-xl border border-[#E2E6F0] p-5 mb-4">
              <p className="text-xs font-bold text-[#9CA3AF] uppercase tracking-wide mb-4">Contribution receipt</p>
              <div className="flex flex-col">
                {[
                  { label: 'TCS reference', value: <span className="font-mono text-xs bg-[#F1F3F8] px-2 py-0.5 rounded">{refNumber}</span> },
                  ...(round.providerRef ? [{ label: 'Gateway reference', value: <span className="font-mono text-xs bg-[#F1F3F8] px-2 py-0.5 rounded">{round.providerRef}</span> }] : []),
                  { label: 'Confirmed on', value: round.paidDate ?? '—' },
                ].map((row: any, i, arr) => (
                  <div key={i} className={`flex items-center justify-between py-3 ${i < arr.length - 1 ? 'border-b border-[#F1F3F8]' : ''}`}>
                    <p className="text-sm text-[#6B7280]">{row.label}</p>
                    <div className="text-sm font-semibold text-[#0D1117]">{row.value}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Payout notice */}
          {round.isMyPayout && (
            <Alert type="success" title="This is your payout round" className="mb-4">
              When all contributions for Round {round.roundNumber} are confirmed, ₦{(round.payoutAmount ?? 0).toLocaleString()} will be recorded as your payout. Your Organization will initiate the bank transfer.
            </Alert>
          )}

          {/* Overdue alert */}
          {isOverdue && (
            <Alert type="error" title="Contribution overdue" className="mb-4">
              The grace period has ended. Your balance of ₦{outstanding.toLocaleString()} is overdue.
              {round.defaultCharge ? ` A default charge of ₦${round.defaultCharge.toLocaleString()} has been applied.` : ' Your Organization may apply the configured default charge.'} Contact your Organization Owner to discuss resolution.
            </Alert>
          )}

          {/* Grace period alert */}
          {status === 'grace-period' && (
            <Alert type="warning" title="Normal deadline passed" className="mb-4">
              Your contribution is past the normal deadline but within the grace period (ends {round.gracePeriodEnd}). Pay now to avoid a default charge.
            </Alert>
          )}

          {/* Checkout panel */}
          {isPayable && outstanding > 0 && (
            <div className="bg-white rounded-xl border border-[#E2E6F0] p-5 mb-4">
              <p className="text-xs font-bold text-[#9CA3AF] uppercase tracking-wide mb-4">Pay now</p>

              {outstanding < round.amount && (
                <div className="mb-4">
                  <label className="text-sm font-semibold text-[#0D1117] block mb-1.5">
                    Amount to pay <span className="font-normal text-[#6B7280]">(up to ₦{outstanding.toLocaleString()} outstanding)</span>
                  </label>
                  <div className="flex items-center border border-[#E2E6F0] rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-[#1746A2]">
                    <span className="px-3.5 py-2.5 text-sm font-semibold text-[#6B7280] bg-[#F8FAFF] border-r border-[#E2E6F0]">₦</span>
                    <input
                      type="number"
                      value={payAmount}
                      min={1}
                      max={outstanding}
                      onChange={e => setPayAmount(Math.min(Math.max(1, Number(e.target.value)), outstanding))}
                      className="flex-1 px-3 py-2.5 text-sm text-[#0D1117] font-semibold focus:outline-none bg-white"
                    />
                    <button
                      onClick={() => setPayAmount(outstanding)}
                      className="px-3 py-2.5 text-xs font-bold text-[#1746A2] bg-[#F8FAFF] border-l border-[#E2E6F0] hover:bg-[#EEF2FF] transition-colors"
                    >
                      Pay all
                    </button>
                  </div>
                </div>
              )}

              {/* Fee breakdown */}
              <div className="bg-[#F8FAFF] rounded-xl border border-[#E2E6F0] p-4 mb-4">
                <p className="text-[10px] font-bold text-[#9CA3AF] uppercase tracking-wide mb-3">Payment summary</p>
                {[
                  { label: 'Contribution principal', value: `₦${payAmount.toLocaleString()}` },
                  { label: `Processing fee (${round.processingFeePct ?? 1.5}%)`, value: `₦${fee.toLocaleString()}`, note: 'Borne by member, separate from contribution' },
                  { label: 'Total payable now', value: `₦${totalPayable.toLocaleString()}`, bold: true },
                ].map((row: any, i, arr) => (
                  <div key={i} className={`flex items-start justify-between py-2.5 ${i < arr.length - 1 ? 'border-b border-[#E2E6F0]' : ''}`}>
                    <div>
                      <p className={`text-sm ${row.bold ? 'font-bold text-[#0D1117]' : 'text-[#6B7280]'}`}>{row.label}</p>
                      {row.note && <p className="text-xs text-[#9CA3AF] mt-0.5">{row.note}</p>}
                    </div>
                    <p className={`text-sm ${row.bold ? 'font-bold text-[#0D1117]' : 'font-semibold text-[#0D1117]'}`}>{row.value}</p>
                  </div>
                ))}
              </div>

              <Button
                size="lg"
                className="w-full"
                onClick={() => navigate('payment-gateway', { groupId: g.id, roundId: round.id, payAmount })}
              >
                Continue to Secure Checkout →
              </Button>
              <p className="text-xs text-center text-[#9CA3AF] mt-2">You will be redirected to the payment gateway. Contributions are confirmed automatically on payment.</p>
            </div>
          )}

          {/* Upcoming — disabled state */}
          {isUpcoming && (
            <div className="bg-white rounded-xl border border-[#E2E6F0] p-5">
              <Button size="lg" className="w-full" disabled>
                Continue to Secure Checkout
              </Button>
              <p className="text-sm text-center text-[#6B7280] mt-3">
                Payment opens on <span className="font-semibold text-[#0D1117]">{round.openDate ?? round.dueDate}</span>.
              </p>
            </div>
          )}
        </div>
      </div>
    </AppShell>
  )
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { variant: any; label: string }> = {
    upcoming:            { variant: 'pending',    label: 'Upcoming' },
    open:                { variant: 'pending',    label: 'Open' },
    partial:             { variant: 'pending',    label: 'Partially Paid' },
    paid:                { variant: 'verified',   label: 'Paid' },
    'grace-period':      { variant: 'pending',    label: 'Grace Period' },
    overdue:             { variant: 'rejected',   label: 'Overdue' },
    'settled-by-policy': { variant: 'verified',   label: 'Settled by Policy' },
  }
  const b = map[status] ?? { variant: 'not-started', label: status }
  return <Badge variant={b.variant}>{b.label}</Badge>
}
