import { useState } from 'react'
import { Button, Alert } from '../ui'
import { OwnerShell } from './OwnerShell'
import type { View, NavMeta } from '../../App'

interface Props { navigate: (v: View, meta?: NavMeta) => void }

// Group config (from wizard)
const GROUP = {
  name: 'Victoria Island Monthly Ajo',
  amount: 50000,
  positions: 12,
  frequency: 'Monthly',
  collectionWindow: 7,
  startDate: 'August 1, 2026',
  payoutDelay: 3,
}

function fmt(n: number) { return `₦${n.toLocaleString()}` }

interface MemberCommitment {
  id: string
  name: string
  initials: string
  email: string
  // Commitment details
  positionAssignments: { position: number; fraction: 1 | 0.5 }[]
  contributionPerRound: number
  payoutEntitlement: number
  acknowledgedAt: string | null
  reminderSent: boolean
}

// Derive entitlement: full payout = amount × positions per full position
const GROSS_PER_POS = GROUP.amount * GROUP.positions

const INITIAL_MEMBERS: MemberCommitment[] = [
  {
    id: 'm1', name: 'Babajide Lawson', initials: 'BL', email: 'b.lawson@zenith.com',
    positionAssignments: [{ position: 1, fraction: 1 }, { position: 2, fraction: 1 }],
    contributionPerRound: GROUP.amount * 2,
    payoutEntitlement: GROSS_PER_POS * 2,
    acknowledgedAt: 'Jul 12, 2026 · 9:14 AM', reminderSent: false,
  },
  {
    id: 'm2', name: 'Fatima Aliyu', initials: 'FA', email: 'f.aliyu@outlook.com',
    positionAssignments: [{ position: 3, fraction: 1 }],
    contributionPerRound: GROUP.amount,
    payoutEntitlement: GROSS_PER_POS,
    acknowledgedAt: 'Jul 12, 2026 · 10:02 AM', reminderSent: false,
  },
  {
    id: 'm3', name: 'Amaka Eze', initials: 'AE', email: 'amaka.e@company.ng',
    positionAssignments: [{ position: 5, fraction: 1 }],
    contributionPerRound: GROUP.amount,
    payoutEntitlement: GROSS_PER_POS,
    acknowledgedAt: null, reminderSent: false,
  },
  {
    id: 'm4', name: 'Tunde Adewale', initials: 'TA', email: 't.adewale@corp.ng',
    positionAssignments: [{ position: 7, fraction: 1 }],
    contributionPerRound: GROUP.amount,
    payoutEntitlement: GROSS_PER_POS,
    acknowledgedAt: 'Jul 12, 2026 · 11:30 AM', reminderSent: false,
  },
  {
    id: 'm5', name: 'Chukwuemeka Osei', initials: 'CO', email: 'c.osei@email.ng',
    positionAssignments: [{ position: 4, fraction: 0.5 }],
    contributionPerRound: GROUP.amount / 2,
    payoutEntitlement: GROSS_PER_POS / 2,
    acknowledgedAt: null, reminderSent: false,
  },
  {
    id: 'm6', name: 'Ngozi Adeyemi', initials: 'NA', email: 'ngozi.a@gmail.com',
    positionAssignments: [{ position: 4, fraction: 0.5 }],
    contributionPerRound: GROUP.amount / 2,
    payoutEntitlement: GROSS_PER_POS / 2,
    acknowledgedAt: 'Jul 12, 2026 · 2:45 PM', reminderSent: false,
  },
  {
    id: 'm7', name: 'Samuel Ojo', initials: 'SO', email: 's.ojo@gmail.com',
    positionAssignments: [{ position: 9, fraction: 1 }],
    contributionPerRound: GROUP.amount,
    payoutEntitlement: GROSS_PER_POS,
    acknowledgedAt: null, reminderSent: false,
  },
  {
    id: 'm8', name: 'Chisom Okafor', initials: 'CO2', email: 'chisom.o@gmail.com',
    positionAssignments: [{ position: 11, fraction: 1 }],
    contributionPerRound: GROUP.amount,
    payoutEntitlement: GROSS_PER_POS,
    acknowledgedAt: null, reminderSent: false,
  },
]

const RULES = `1. All contributions must be made within the ${GROUP.collectionWindow}-day collection window for each round.
2. Members must submit a valid payment reference after each contribution.
3. Late contributions may result in removal from the group at the Organization Owner's discretion.
4. Payout positions are assigned before the cycle begins and cannot be changed once the cycle is active.
5. Your commitment — position allocation, contribution amount, and payout entitlement — is fixed before cycle launch.
6. Disputes must be raised within 48 hours of the relevant round closing.`

const NOTICES = [
  "This is a private group. All details are confidential to members only.",
  "Contributions are collected through an approved digital payment provider and settled into the organization's designated settlement account.",
  "TCS records and coordinates activity. Your organization manages and controls all funds.",
  "By acknowledging these rules, you confirm you have read and agree to both the group terms and your personalized financial commitment shown above.",
]

function posLabel(p: { position: number; fraction: 1 | 0.5 }) {
  return `Position ${p.position} — ${p.fraction === 1 ? 'Individual Position' : 'Shared Position'}`
}

export function GroupRulesReview({ navigate }: Props) {
  const [members, setMembers] = useState<MemberCommitment[]>(INITIAL_MEMBERS)
  const [showRules, setShowRules] = useState(false)
  const [allReminderSent, setAllReminderSent] = useState(false)
  const [expanded, setExpanded] = useState<string | null>(null)

  const acknowledged = members.filter(m => m.acknowledgedAt !== null)
  const pending = members.filter(m => m.acknowledgedAt === null)
  const pct = Math.round((acknowledged.length / members.length) * 100)
  const allAcknowledged = pending.length === 0

  const sendReminder = (id: string) => setMembers(ms => ms.map(m => m.id === id ? { ...m, reminderSent: true } : m))
  const sendAllReminders = () => {
    setMembers(ms => ms.map(m => m.acknowledgedAt === null ? { ...m, reminderSent: true } : m))
    setAllReminderSent(true)
  }

  return (
    <OwnerShell navigate={navigate} activeView="owner-groups">
      {/* Breadcrumb */}
      <div className="bg-white border-b border-[#E2E6F0] px-6 lg:px-8 py-3.5 flex items-center gap-3 shrink-0">
        <button onClick={() => navigate('owner-group-positions')} className="flex items-center gap-1.5 text-sm text-[#6B7280] hover:text-[#0D1117] font-medium">
          <svg className="w-4 h-4" viewBox="0 0 16 16" fill="currentColor"><path d="M9.78 11.78a.75.75 0 01-1.06 0L4.47 7.53a.75.75 0 010-1.06l4.25-4.25a.75.75 0 111.06 1.06L6.06 7l3.72 3.72a.75.75 0 010 1.06z" /></svg>
          Assign positions
        </button>
        <span className="text-[#E2E6F0]">/</span>
        <span className="text-sm font-semibold text-[#0D1117]">Rules review</span>
        <div className="ml-auto flex items-center gap-2">
          <span className="text-xs text-[#9CA3AF]">Step 4 of 6</span>
          <Button size="sm" onClick={() => navigate('owner-group-readiness', { groupId: 'new' })}>
            Continue →
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-6 lg:px-8 py-6">
        <div className="max-w-4xl mx-auto flex flex-col gap-5">

          {allAcknowledged && <Alert type="success">All members have acknowledged the rules and their commitment. You can continue to launch readiness.</Alert>}
          {allReminderSent && !allAcknowledged && <Alert type="info">Reminders sent to {pending.length} member{pending.length !== 1 ? 's' : ''}.</Alert>}

          {/* Progress header */}
          <div className="bg-white rounded-2xl border border-[#E2E6F0] p-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
              <div>
                <p className="display-font text-lg font-bold text-[#0D1117]">Rules & commitment acknowledgment</p>
                <p className="text-sm text-[#6B7280] mt-0.5">Each member must confirm their personalized commitment and group rules before launch</p>
              </div>
              <div className="text-right">
                <p className="display-font text-3xl font-bold text-[#1746A2]">{acknowledged.length}<span className="text-[#9CA3AF] text-xl">/{members.length}</span></p>
                <p className="text-xs text-[#9CA3AF]">acknowledged</p>
              </div>
            </div>
            <div className="h-2.5 bg-[#F1F3F8] rounded-full overflow-hidden mb-2">
              <div className={`h-full rounded-full transition-all ${pct === 100 ? 'bg-[#059669]' : 'bg-[#1746A2]'}`} style={{ width: `${pct}%` }} />
            </div>
            <div className="flex items-center justify-between">
              <p className="text-xs text-[#9CA3AF]">{pct}% complete</p>
              {pending.length > 0 && (
                <button onClick={sendAllReminders} className="text-xs font-semibold text-[#1746A2] hover:underline">
                  Send reminder to all ({pending.length})
                </button>
              )}
            </div>
          </div>

          <div className="grid lg:grid-cols-[1fr_300px] gap-5">

            {/* Member acknowledgment list */}
            <div>
              <p className="text-sm font-bold text-[#0D1117] mb-3">Member status</p>
              <div className="bg-white rounded-xl border border-[#E2E6F0] overflow-hidden">
                <div className="divide-y divide-[#F1F3F8]">
                  {members.map(m => {
                    const isOpen = expanded === m.id
                    return (
                      <div key={m.id}>
                        <div
                          className="flex items-center gap-3 px-5 py-4 cursor-pointer hover:bg-[#F8FAFF] transition-colors"
                          onClick={() => setExpanded(isOpen ? null : m.id)}
                        >
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${m.acknowledgedAt ? 'bg-[#ECFDF5] text-[#059669]' : 'bg-[#F1F3F8] text-[#6B7280]'}`}>
                            {m.acknowledgedAt ? '✓' : m.initials}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-[#0D1117] truncate">{m.name}</p>
                            <p className="text-xs text-[#9CA3AF] truncate">
                              {m.positionAssignments.map(posLabel).join(' · ')} · {fmt(m.contributionPerRound)}/round
                            </p>
                          </div>
                          <div className="text-right shrink-0 ml-2">
                            {m.acknowledgedAt ? (
                              <div>
                                <p className="text-xs font-semibold text-[#059669]">Confirmed</p>
                                <p className="text-[10px] text-[#9CA3AF]">{m.acknowledgedAt}</p>
                              </div>
                            ) : (
                              <p className="text-xs font-semibold text-[#D97706]">Pending</p>
                            )}
                          </div>
                          <svg className={`w-4 h-4 text-[#9CA3AF] transition-transform ml-2 shrink-0 ${isOpen ? 'rotate-180' : ''}`} viewBox="0 0 16 16" fill="currentColor">
                            <path d="M4.427 9.427l3.396 3.396a.25.25 0 00.354 0l3.396-3.396A.25.25 0 0011.396 9H4.604a.25.25 0 00-.177.427z" />
                          </svg>
                        </div>

                        {/* Expanded: personalized commitment detail */}
                        {isOpen && (
                          <div className="mx-5 mb-4 bg-[#F8FAFF] border border-[#E2E6F0] rounded-xl overflow-hidden">
                            <div className="px-4 py-3 border-b border-[#E2E6F0] bg-[#EEF2FF]">
                              <p className="text-xs font-bold text-[#1746A2]">Personalized commitment — {m.name}</p>
                            </div>
                            <div className="divide-y divide-[#E2E6F0]">
                              {[
                                { label: 'Position assignment', value: m.positionAssignments.map(posLabel).join(', ') },
                                { label: 'Contribution per round', value: fmt(m.contributionPerRound) },
                                { label: 'Expected gross payout entitlement', value: fmt(m.payoutEntitlement) },
                                { label: 'Collection frequency', value: GROUP.frequency },
                                { label: 'Collection window', value: `${GROUP.collectionWindow} days per round` },
                                { label: 'Cycle start date', value: GROUP.startDate },
                              ].map(r => (
                                <div key={r.label} className="flex justify-between px-4 py-2.5 gap-3">
                                  <p className="text-xs text-[#6B7280]">{r.label}</p>
                                  <p className="text-xs font-semibold text-[#0D1117] text-right">{r.value}</p>
                                </div>
                              ))}
                            </div>
                            <div className="px-4 py-3 border-t border-[#E2E6F0] flex items-center justify-between">
                              <p className="text-xs text-[#6B7280]">
                                {m.acknowledgedAt
                                  ? `Acknowledged ${m.acknowledgedAt}`
                                  : m.reminderSent ? 'Reminder sent — awaiting acknowledgment' : 'Awaiting acknowledgment'}
                              </p>
                              {!m.acknowledgedAt && (
                                m.reminderSent ? (
                                  <span className="text-xs text-[#9CA3AF]">Reminder sent</span>
                                ) : (
                                  <button onClick={e => { e.stopPropagation(); sendReminder(m.id) }} className="text-xs font-semibold text-[#1746A2] hover:underline">
                                    Send reminder
                                  </button>
                                )
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>

            {/* Rules sidebar */}
            <div className="flex flex-col gap-4">
              <div className="bg-white rounded-xl border border-[#E2E6F0] overflow-hidden">
                <button
                  onClick={() => setShowRules(v => !v)}
                  className="w-full flex items-center justify-between px-5 py-4 border-b border-[#F1F3F8] hover:bg-[#F8FAFF] transition-colors"
                >
                  <p className="text-sm font-bold text-[#0D1117]">Group rules</p>
                  <svg className={`w-4 h-4 text-[#9CA3AF] transition-transform ${showRules ? 'rotate-180' : ''}`} viewBox="0 0 16 16" fill="currentColor"><path d="M4.427 9.427l3.396 3.396a.25.25 0 00.354 0l3.396-3.396A.25.25 0 0011.396 9H4.604a.25.25 0 00-.177.427z" /></svg>
                </button>
                {showRules && (
                  <div className="px-5 py-4">
                    <pre className="text-xs text-[#374151] leading-relaxed whitespace-pre-wrap font-sans">{RULES}</pre>
                  </div>
                )}
              </div>

              <div className="bg-white rounded-xl border border-[#E2E6F0] overflow-hidden">
                <div className="px-5 py-4 border-b border-[#F1F3F8] bg-[#F8FAFF]">
                  <p className="text-sm font-bold text-[#0D1117]">Important notices</p>
                </div>
                <div className="px-5 py-4 flex flex-col gap-2.5">
                  {NOTICES.map((n, i) => (
                    <div key={i} className="flex gap-2.5 text-xs text-[#374151] leading-relaxed">
                      <span className="text-[#9CA3AF] shrink-0 font-semibold">{i + 1}.</span>
                      <span>{n}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-[#F8FAFF] rounded-xl border border-[#E2E6F0] px-4 py-4 text-xs text-[#6B7280] leading-relaxed">
                <p className="font-semibold text-[#0D1117] mb-1">What a member acknowledges</p>
                They confirm they have read the group rules AND their personalized commitment: position(s), contribution per round, and expected gross payout entitlement. This acknowledgment is timestamped and forms part of the pre-launch audit record. Launch is blocked until all members acknowledge.
              </div>
            </div>
          </div>
        </div>
      </div>
    </OwnerShell>
  )
}
