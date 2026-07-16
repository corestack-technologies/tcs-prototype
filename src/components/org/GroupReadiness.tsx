import { useState } from 'react'
import { Button } from '../ui'
import { OwnerShell } from './OwnerShell'
import type { View, NavMeta } from '../../App'

interface Props { navigate: (v: View, meta?: NavMeta) => void }

type CheckStatus = 'pass' | 'fail' | 'warning'

interface CheckItem {
  id: string
  label: string
  description: string
  status: CheckStatus
  required: boolean
  detail?: string
  action?: string
  actionView?: View
}

const CHECKS: CheckItem[] = [
  {
    id: 'settlement',
    label: 'Settlement account configured',
    description: "Your organization has an approved and active designated settlement account for receiving contributions.",
    status: 'pass',
    required: true,
    detail: 'GTBank · •••• 4521 (verified)',
  },
  {
    id: 'equiv-committed',
    label: 'Total equivalent position capacity fully committed',
    description: 'The sum of all approved member commitments equals the total number of payout positions.',
    status: 'pass',
    required: true,
    detail: '12 of 12 equivalent positions committed',
  },
  {
    id: 'positions-fully-allocated',
    label: 'Every payout position fully allocated',
    description: 'Each position has members assigned whose combined commitment totals exactly one full position.',
    status: 'fail',
    required: true,
    detail: '2 positions are partially filled (positions 6, 8). A position is complete only when total assigned commitment = 1.',
    action: 'Fix positions',
    actionView: 'owner-group-positions',
  },
  {
    id: 'no-partial-unfilled',
    label: 'No partial or over-allocated positions',
    description: 'No position may have a total commitment greater than one full position or less than one full position.',
    status: 'fail',
    required: true,
    detail: 'Positions 6 and 8 have incomplete assignment (½ filled, ½ remaining).',
    action: 'Fix positions',
    actionView: 'owner-group-positions',
  },
  {
    id: 'commitments-calculated',
    label: "Every participant's commitment calculated",
    description: 'Every approved member has a confirmed position assignment, contribution amount, and payout entitlement on record.',
    status: 'pass',
    required: true,
    detail: 'All 8 members have confirmed commitment details',
  },
  {
    id: 'rules-acknowledged',
    label: 'All members have acknowledged rules and commitment',
    description: 'Every active participant must confirm both the group rules and their personalized financial commitment before launch. This cannot be bypassed.',
    status: 'fail',
    required: true,
    detail: '4 of 8 members have acknowledged. 4 members are still pending.',
    action: 'Send reminders',
    actionView: 'owner-group-rules',
  },
  {
    id: 'schedule',
    label: 'Contribution schedule generated',
    description: 'The full payout schedule has been generated and is ready for review.',
    status: 'pass',
    required: true,
    detail: 'Aug 1, 2026 → Jul 31, 2027 · 12 rounds',
  },
  {
    id: 'start-date',
    label: 'Cycle start date valid',
    description: 'The start date is set and at least 3 days in the future.',
    status: 'pass',
    required: true,
    detail: 'August 1, 2026',
  },
  {
    id: 'validation',
    label: 'No blocking validation errors',
    description: 'The group configuration has passed all required validation checks.',
    status: 'pass',
    required: true,
    detail: 'Configuration checks passed',
  },
]

const statusConfig: Record<CheckStatus, { icon: string; color: string; badge: string; bg: string }> = {
  pass: { icon: '✓', color: 'text-[#059669]', badge: 'bg-[#ECFDF5] text-[#065F46]', bg: 'bg-[#ECFDF5] border-[#A7F3D0]' },
  fail: { icon: '✗', color: 'text-[#DC2626]', badge: 'bg-[#FEF2F2] text-[#991B1B]', bg: 'bg-[#FEF2F2] border-[#FECACA]' },
  warning: { icon: '!', color: 'text-[#D97706]', badge: 'bg-[#FFFBEB] text-[#92400E]', bg: 'bg-[#FFFBEB] border-[#FDE68A]' },
}

export function GroupReadiness({ navigate }: Props) {
  const [launching, setLaunching] = useState(false)

  const requiredPassed = CHECKS.filter(c => c.required).every(c => c.status === 'pass')
  const passCount = CHECKS.filter(c => c.status === 'pass').length
  const warnCount = CHECKS.filter(c => c.status === 'warning').length
  const failCount = CHECKS.filter(c => c.status === 'fail').length
  const failedRequired = CHECKS.filter(c => c.required && c.status === 'fail')

  const launch = () => {
    setLaunching(true)
    setTimeout(() => navigate('owner-group-activated', { groupId: 'new' }), 1400)
  }

  return (
    <OwnerShell navigate={navigate} activeView="owner-groups">
      {/* Breadcrumb */}
      <div className="bg-white border-b border-[#E2E6F0] px-6 lg:px-8 py-3.5 flex items-center gap-3 shrink-0">
        <button onClick={() => navigate('owner-group-rules')} className="flex items-center gap-1.5 text-sm text-[#6B7280] hover:text-[#0D1117] font-medium">
          <svg className="w-4 h-4" viewBox="0 0 16 16" fill="currentColor"><path d="M9.78 11.78a.75.75 0 01-1.06 0L4.47 7.53a.75.75 0 010-1.06l4.25-4.25a.75.75 0 111.06 1.06L6.06 7l3.72 3.72a.75.75 0 010 1.06z" /></svg>
          Rules review
        </button>
        <span className="text-[#E2E6F0]">/</span>
        <span className="text-sm font-semibold text-[#0D1117]">Launch readiness</span>
        <span className="ml-auto text-xs text-[#9CA3AF]">Step 5 of 6</span>
      </div>

      <div className="flex-1 overflow-y-auto px-6 lg:px-8 py-6">
        <div className="max-w-3xl mx-auto flex flex-col gap-6">

          {/* Header */}
          <div>
            <h1 className="display-font text-2xl font-bold text-[#0D1117] mb-1">Launch readiness check</h1>
            <p className="text-sm text-[#6B7280]">All required gates must pass before you can launch the cycle. Rules acknowledgment and full position allocation cannot be bypassed.</p>
          </div>

          {/* Summary row */}
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: 'Passed', value: passCount, color: 'text-[#059669]', bg: 'bg-[#ECFDF5] border-[#A7F3D0]' },
              { label: 'Warnings', value: warnCount, color: 'text-[#D97706]', bg: 'bg-[#FFFBEB] border-[#FDE68A]' },
              { label: 'Blocked', value: failCount, color: 'text-[#DC2626]', bg: 'bg-[#FEF2F2] border-[#FECACA]' },
            ].map(s => (
              <div key={s.label} className={`rounded-xl border px-5 py-4 text-center ${s.bg}`}>
                <p className={`display-font text-3xl font-bold ${s.color}`}>{s.value}</p>
                <p className="text-xs font-semibold text-[#6B7280] mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>

          {/* Checklist */}
          <div className="flex flex-col gap-3">
            {CHECKS.map(check => {
              const cfg = statusConfig[check.status]
              return (
                <div key={check.id} className={`rounded-xl border p-5 ${cfg.bg}`}>
                  <div className="flex items-start gap-4">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-black shrink-0 ${cfg.badge}`}>
                      {cfg.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-col sm:flex-row sm:items-center gap-1.5 mb-0.5">
                        <p className="text-sm font-bold text-[#0D1117]">{check.label}</p>
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full w-fit ${check.required ? 'bg-white/60 text-[#DC2626]' : 'bg-white/60 text-[#9CA3AF]'}`}>
                          {check.required ? 'Required' : 'Optional'}
                        </span>
                      </div>
                      <p className="text-xs text-[#6B7280] leading-relaxed">{check.description}</p>
                      {check.detail && <p className={`text-xs font-semibold mt-1.5 ${cfg.color}`}>{check.detail}</p>}
                    </div>
                    {check.action && check.actionView && (
                      <button onClick={() => navigate(check.actionView!)} className="text-xs font-semibold text-[#1746A2] hover:underline shrink-0">
                        {check.action}
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>

          {/* Launch section */}
          <div className={`rounded-2xl border-2 p-6 ${requiredPassed ? 'border-[#059669] bg-[#ECFDF5]' : 'border-[#FECACA] bg-[#FEF2F2]'}`}>
            {requiredPassed ? (
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <p className="display-font text-lg font-bold text-[#059669]">Ready to launch</p>
                  <p className="text-sm text-[#374151] mt-0.5">
                    All required gates have passed. The cycle will begin on <strong>August 1, 2026</strong>.
                    {warnCount > 0 && ` (${warnCount} non-critical warning${warnCount !== 1 ? 's' : ''})`}
                  </p>
                </div>
                <Button size="lg" variant="success" loading={launching} onClick={launch} className="shrink-0">
                  🚀 Launch cycle
                </Button>
              </div>
            ) : (
              <div>
                <p className="display-font text-lg font-bold text-[#DC2626] mb-1">Not ready to launch</p>
                <p className="text-sm text-[#374151] mb-3">
                  {failedRequired.length} required gate{failedRequired.length !== 1 ? 's' : ''} must be resolved before you can launch:
                </p>
                <ul className="flex flex-col gap-1.5 mb-4">
                  {failedRequired.map(c => (
                    <li key={c.id} className="flex items-start gap-2 text-xs text-[#991B1B]">
                      <span className="font-bold shrink-0">✗</span>
                      <span>{c.label}</span>
                    </li>
                  ))}
                </ul>
                <Button size="lg" disabled className="opacity-40 cursor-not-allowed">Launch cycle</Button>
              </div>
            )}
          </div>

          {/* Cycle overview */}
          <div className="bg-white rounded-xl border border-[#E2E6F0] overflow-hidden">
            <div className="px-5 py-3.5 border-b border-[#F1F3F8] bg-[#F8FAFF]">
              <p className="text-sm font-bold text-[#0D1117]">Cycle overview</p>
            </div>
            <div className="divide-y divide-[#F1F3F8]">
              {[
                { label: 'Group name', value: 'Victoria Island Monthly Ajo' },
                { label: 'Total positions', value: '12' },
                { label: 'Contribution per full position', value: '₦50,000 / month' },
                { label: 'Gross payout per full position', value: '₦600,000' },
                { label: 'Cycle start', value: 'August 1, 2026' },
                { label: 'Collection window', value: '7 days per round' },
                { label: 'First contribution due', value: 'August 8, 2026' },
                { label: 'First payout date', value: 'August 11, 2026' },
                { label: 'Estimated cycle end', value: 'July 31, 2027' },
              ].map(r => (
                <div key={r.label} className="flex justify-between px-5 py-3.5 gap-4">
                  <p className="text-sm text-[#6B7280]">{r.label}</p>
                  <p className="text-sm font-semibold text-[#0D1117] text-right">{r.value}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </OwnerShell>
  )
}
