import { useState } from 'react'
import { Button, Alert } from '../ui'
import { OwnerShell } from './OwnerShell'
import type { View, NavMeta } from '../../App'

interface Props { navigate: (v: View, meta?: NavMeta) => void }

// Group configuration (would come from wizard in production)
const GROUP = {
  name: 'Victoria Island Monthly Ajo',
  positions: 12,
  amount: 50000,
  frequency: 'Monthly' as const,
  allowSplit: true,
  splitParts: 2,        // each position can be split into 2 equal parts (½ position each)
  multiplePositions: 'max' as const,
  maxPerMember: 2,
}

// Commitment type
type CommitmentType = 'full' | 'half'  // expandable for quarter in future

interface Commitment {
  fullPositions: number     // number of complete positions
  partialUnits: number      // number of equal parts (each = 1/splitParts of a position)
  equivalentPositions: number  // fullPositions + partialUnits / splitParts
  contributionPerRound: number
  payoutEntitlements: number   // total payout entitlement
}

function buildCommitment(fullPos: number, partUnits: number): Commitment {
  const equiv = fullPos + partUnits / GROUP.splitParts
  const contrib = GROUP.amount * fullPos + (GROUP.amount / GROUP.splitParts) * partUnits
  const payout = GROUP.amount * GROUP.positions * fullPos + (GROUP.amount * GROUP.positions / GROUP.splitParts) * partUnits
  return {
    fullPositions: fullPos,
    partialUnits: partUnits,
    equivalentPositions: equiv,
    contributionPerRound: contrib,
    payoutEntitlements: payout,
  }
}

function fmtCommitment(c: Commitment): string {
  const parts: string[] = []
  if (c.fullPositions > 0) parts.push(`${c.fullPositions} full position${c.fullPositions !== 1 ? 's' : ''}`)
  if (c.partialUnits > 0) parts.push(`${c.partialUnits} × Shared Position`)
  return parts.join(' + ') || '—'
}

function fmt(n: number) { return `₦${n.toLocaleString()}` }

interface Candidate {
  id: string
  name: string
  initials: string
  email: string
  groupsCompleted: number
  onTimeRate: number
  status: 'pending' | 'approved' | 'rejected'
  commitment?: Commitment
}

const INITIAL: Candidate[] = [
  { id: 'c1', name: 'Chukwuemeka Osei', initials: 'CO', email: 'c.osei@email.ng', groupsCompleted: 3, onTimeRate: 97, status: 'pending' },
  { id: 'c2', name: 'Ngozi Adeyemi', initials: 'NA', email: 'ngozi.a@gmail.com', groupsCompleted: 2, onTimeRate: 91, status: 'pending' },
  { id: 'c3', name: 'Babajide Lawson', initials: 'BL', email: 'b.lawson@zenith.com', groupsCompleted: 5, onTimeRate: 99, status: 'approved', commitment: buildCommitment(2, 0) },
  { id: 'c4', name: 'Fatima Aliyu', initials: 'FA', email: 'f.aliyu@outlook.com', groupsCompleted: 1, onTimeRate: 85, status: 'approved', commitment: buildCommitment(1, 0) },
  { id: 'c5', name: 'Samuel Ojo', initials: 'SO', email: 's.ojo@gmail.com', groupsCompleted: 4, onTimeRate: 93, status: 'pending' },
  { id: 'c6', name: 'Amaka Eze', initials: 'AE', email: 'amaka.e@company.ng', groupsCompleted: 2, onTimeRate: 88, status: 'approved', commitment: buildCommitment(1, 0) },
  { id: 'c7', name: 'Tunde Adewale', initials: 'TA', email: 't.adewale@corp.ng', groupsCompleted: 6, onTimeRate: 100, status: 'approved', commitment: buildCommitment(0, 2) },
  { id: 'c8', name: 'Chisom Okafor', initials: 'CO2', email: 'chisom.o@gmail.com', groupsCompleted: 0, onTimeRate: 0, status: 'pending' },
]

const INVITE_CODE = 'TCS-VIA-8472'
const INVITE_LINK = 'tcs.ng/join/victoria-island-monthly-ajo'

// Commitment options to present during approval
const COMMITMENT_OPTIONS: { label: string; sub: string; commitment: Commitment }[] = [
  { label: '1 Individual Position', sub: `Pay ${fmt(GROUP.amount)}/round · Receive ${fmt(GROUP.amount * GROUP.positions)}`, commitment: buildCommitment(1, 0) },
  ...(GROUP.allowSplit ? [
    { label: `1 Shared Position (${GROUP.splitParts} participants)`, sub: `Pay ${fmt(GROUP.amount / GROUP.splitParts)}/round · Receive ${fmt((GROUP.amount * GROUP.positions) / GROUP.splitParts)}`, commitment: buildCommitment(0, 1) },
  ] : []),
  ...(GROUP.multiplePositions !== 'none' ? [
    { label: '2 Individual Positions', sub: `Pay ${fmt(GROUP.amount * 2)}/round · Two payout entitlements`, commitment: buildCommitment(2, 0) },
    ...(GROUP.allowSplit ? [
      { label: '1 Individual + 1 Shared Position', sub: `Pay ${fmt(GROUP.amount + GROUP.amount / GROUP.splitParts)}/round · 1 full + 1 shared payout entitlement`, commitment: buildCommitment(1, 1) },
    ] : []),
  ] : []),
]

export function GroupRecruitment({ navigate }: Props) {
  const [candidates, setCandidates] = useState<Candidate[]>(INITIAL)
  const [approvingId, setApprovingId] = useState<string | null>(null)
  const [pendingCommitment, setPendingCommitment] = useState<Commitment | null>(null)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteSent, setInviteSent] = useState<string[]>([])
  const [copied, setCopied] = useState<'link' | 'code' | null>(null)
  const [tab, setTab] = useState<'requests' | 'approved'>('requests')

  const approved = candidates.filter(c => c.status === 'approved')
  const pending = candidates.filter(c => c.status === 'pending')

  // Equivalent positions committed
  const totalEquiv = approved.reduce((s, c) => s + (c.commitment?.equivalentPositions ?? 0), 0)
  const remainingEquiv = GROUP.positions - totalEquiv
  const pct = Math.min(100, Math.round((totalEquiv / GROUP.positions) * 100))

  const fullCommitted = approved.filter(c => (c.commitment?.fullPositions ?? 0) > 0)
    .reduce((s, c) => s + (c.commitment?.fullPositions ?? 0), 0)
  const partialCommitted = approved.filter(c => (c.commitment?.partialUnits ?? 0) > 0)
    .reduce((s, c) => s + (c.commitment?.partialUnits ?? 0), 0)

  const beginApprove = (id: string) => {
    setApprovingId(id)
    setPendingCommitment(COMMITMENT_OPTIONS[0].commitment)
  }

  const confirmApprove = (id: string) => {
    if (!pendingCommitment) return
    setCandidates(cs => cs.map(c => c.id === id ? { ...c, status: 'approved', commitment: pendingCommitment! } : c))
    setApprovingId(null)
    setPendingCommitment(null)
  }

  const decline = (id: string) => {
    setCandidates(cs => cs.map(c => c.id === id ? { ...c, status: 'rejected' } : c))
    if (approvingId === id) { setApprovingId(null); setPendingCommitment(null) }
  }

  const sendInvite = () => {
    if (!inviteEmail.trim()) return
    setInviteSent(s => [...s, inviteEmail.trim()])
    setInviteEmail('')
  }

  const copy = (type: 'link' | 'code') => { setCopied(type); setTimeout(() => setCopied(null), 2000) }

  const rateColor = (r: number) => r >= 95 ? 'text-[#059669]' : r >= 80 ? 'text-[#D97706]' : 'text-[#DC2626]'

  return (
    <OwnerShell navigate={navigate} activeView="owner-groups">
      {/* Breadcrumb */}
      <div className="bg-white border-b border-[#E2E6F0] px-6 lg:px-8 py-3.5 flex items-center gap-3 shrink-0">
        <button onClick={() => navigate('owner-group-setup')} className="flex items-center gap-1.5 text-sm text-[#6B7280] hover:text-[#0D1117] font-medium">
          <svg className="w-4 h-4" viewBox="0 0 16 16" fill="currentColor"><path d="M9.78 11.78a.75.75 0 01-1.06 0L4.47 7.53a.75.75 0 010-1.06l4.25-4.25a.75.75 0 111.06 1.06L6.06 7l3.72 3.72a.75.75 0 010 1.06z" /></svg>
          Group setup
        </button>
        <span className="text-[#E2E6F0]">/</span>
        <span className="text-sm font-semibold text-[#0D1117]">Recruit members</span>
        <div className="ml-auto flex items-center gap-2">
          <span className="text-xs text-[#9CA3AF]">Step 2 of 6</span>
          <Button size="sm" onClick={() => navigate('owner-group-positions', { groupId: 'new' })}>
            Continue to positions →
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-6 lg:px-8 py-6">
        <div className="max-w-4xl mx-auto flex flex-col gap-6">

          {/* Capacity header */}
          <div className="bg-white rounded-2xl border border-[#E2E6F0] p-5">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-4">
              <div>
                <p className="text-xs text-[#9CA3AF] font-medium mb-0.5">Recruiting for</p>
                <p className="display-font text-lg font-bold text-[#0D1117]">{GROUP.name}</p>
                <p className="text-sm text-[#6B7280] mt-0.5">{GROUP.positions} positions · {fmt(GROUP.amount)}/round · {GROUP.frequency}</p>
                {GROUP.allowSplit && <p className="text-xs text-[#1746A2] mt-0.5">Shared positions allowed — up to {GROUP.splitParts} participants per position</p>}
              </div>
              <div className="flex flex-col items-end gap-1">
                <div className="flex items-baseline gap-1.5">
                  <span className="display-font text-2xl font-bold text-[#1746A2]">{totalEquiv.toFixed(totalEquiv % 1 === 0 ? 0 : 1)}</span>
                  <span className="text-sm text-[#9CA3AF]">/ {GROUP.positions} equivalent positions</span>
                </div>
                <div className="w-52 h-2.5 bg-[#F1F3F8] rounded-full overflow-hidden">
                  <div className={`h-full rounded-full transition-all ${pct >= 100 ? 'bg-[#059669]' : pct >= 70 ? 'bg-[#1746A2]' : 'bg-[#D97706]'}`} style={{ width: `${pct}%` }} />
                </div>
                <div className="flex gap-4 text-xs text-[#9CA3AF]">
                  <span>{approved.length} participant{approved.length !== 1 ? 's' : ''}</span>
                  <span>{fullCommitted} full · {partialCommitted} partial unit{partialCommitted !== 1 ? 's' : ''}</span>
                  <span className={remainingEquiv <= 0 ? 'text-[#059669] font-semibold' : ''}>{remainingEquiv > 0 ? `${remainingEquiv} remaining` : 'Full'}</span>
                </div>
              </div>
            </div>

            {/* Position fill visualization */}
            <div className="pt-4 border-t border-[#F1F3F8]">
              <p className="text-xs font-semibold text-[#9CA3AF] uppercase tracking-wide mb-2.5">Equivalent position capacity</p>
              <div className="flex flex-wrap gap-1.5">
                {Array.from({ length: GROUP.positions }, (_, i) => {
                  const pos = i + 1
                  const cumulative = i  // positions filled before this one
                  const filled = totalEquiv >= pos
                  const partial = !filled && totalEquiv > cumulative
                  return (
                    <div key={i} title={`Position ${pos}`}
                      className={`w-7 h-7 rounded-lg flex items-center justify-center text-[10px] font-bold transition-colors ${filled ? 'bg-[#1746A2] text-white' : partial ? 'bg-[#DBEAFE] text-[#1746A2]' : 'bg-[#F1F3F8] text-[#9CA3AF]'}`}>
                      {pos}
                    </div>
                  )
                })}
              </div>
              <div className="flex gap-4 mt-2 text-xs text-[#9CA3AF]">
                <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-[#1746A2] inline-block" /> Committed</span>
                <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-[#DBEAFE] inline-block" /> Partially committed</span>
                <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-[#F1F3F8] inline-block" /> Available</span>
              </div>
            </div>
          </div>

          <div className="grid lg:grid-cols-[1fr_320px] gap-6">

            {/* Tabs + requests */}
            <div className="flex flex-col gap-4">
              <div className="flex gap-1 p-1 bg-white rounded-xl border border-[#E2E6F0] w-fit">
                {([['requests', `Join requests (${pending.length})`], ['approved', `Approved (${approved.length})`]] as const).map(([v, l]) => (
                  <button key={v} onClick={() => setTab(v)}
                    className={`px-4 py-1.5 text-sm font-semibold rounded-lg transition-colors ${tab === v ? 'bg-[#1746A2] text-white' : 'text-[#6B7280] hover:text-[#0D1117]'}`}>
                    {l}
                  </button>
                ))}
              </div>

              <div className="bg-white rounded-xl border border-[#E2E6F0] overflow-hidden">
                {tab === 'requests' && (
                  pending.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                      <div className="text-3xl mb-3">📭</div>
                      <p className="text-sm font-semibold text-[#374151]">No pending requests</p>
                      <p className="text-xs text-[#9CA3AF] mt-1">Invite members using the panel on the right.</p>
                    </div>
                  ) : (
                    <div className="divide-y divide-[#F1F3F8]">
                      {pending.map(c => (
                        <div key={c.id}>
                          <div className="px-5 py-4 flex items-center gap-4">
                            <div className="w-9 h-9 rounded-full bg-[#EEF2FF] flex items-center justify-center text-xs font-bold text-[#1746A2] shrink-0">{c.initials}</div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-semibold text-[#0D1117] truncate">{c.name}</p>
                              <p className="text-xs text-[#9CA3AF] truncate">{c.email}</p>
                            </div>
                            <div className="text-right hidden sm:block shrink-0">
                              <p className="text-xs text-[#9CA3AF]">{c.groupsCompleted} group{c.groupsCompleted !== 1 ? 's' : ''}</p>
                              <p className={`text-xs font-semibold ${rateColor(c.onTimeRate)}`}>{c.onTimeRate > 0 ? `${c.onTimeRate}% on-time` : 'No history'}</p>
                            </div>
                            <div className="flex gap-2 shrink-0">
                              <button onClick={() => beginApprove(c.id)} className="px-3 py-1.5 text-xs font-bold text-[#059669] border border-[#A7F3D0] bg-[#ECFDF5] rounded-lg hover:bg-[#D1FAE5] transition-colors">
                                Approve
                              </button>
                              <button onClick={() => decline(c.id)} className="px-3 py-1.5 text-xs font-bold text-[#DC2626] border border-[#FECACA] bg-[#FEF2F2] rounded-lg hover:bg-[#FEE2E2] transition-colors">
                                Decline
                              </button>
                            </div>
                          </div>

                          {/* Commitment picker — shown inline when approving */}
                          {approvingId === c.id && (
                            <div className="mx-5 mb-4 bg-[#EEF2FF] rounded-xl border border-[#C7D2FE] px-5 py-4">
                              <p className="text-sm font-bold text-[#0D1117] mb-1">Set member commitment</p>
                              <p className="text-xs text-[#6B7280] mb-3">Select the position commitment for {c.name}. This determines their contribution per round and payout entitlement.</p>
                              <div className="flex flex-col gap-2 mb-4">
                                {COMMITMENT_OPTIONS.map((opt, i) => (
                                  <button
                                    key={i}
                                    type="button"
                                    onClick={() => setPendingCommitment(opt.commitment)}
                                    className={`text-left px-4 py-3 rounded-xl border-2 transition-colors ${pendingCommitment?.equivalentPositions === opt.commitment.equivalentPositions && pendingCommitment?.fullPositions === opt.commitment.fullPositions && pendingCommitment?.partialUnits === opt.commitment.partialUnits ? 'border-[#1746A2] bg-white' : 'border-[#C7D2FE] bg-white/60 hover:bg-white'}`}
                                  >
                                    <p className="text-sm font-semibold text-[#0D1117]">{opt.label}</p>
                                    <p className="text-xs text-[#6B7280] mt-0.5">{opt.sub}</p>
                                  </button>
                                ))}
                              </div>
                              {pendingCommitment && (
                                <div className="bg-white rounded-lg border border-[#C7D2FE] px-4 py-3 mb-3 text-xs text-[#374151]">
                                  <span className="font-semibold">Commitment summary:</span> {fmtCommitment(pendingCommitment)} · {fmt(pendingCommitment.contributionPerRound)}/round · Payout entitlement: {fmt(pendingCommitment.payoutEntitlements)}
                                </div>
                              )}
                              <div className="flex gap-2">
                                <Button size="sm" variant="success" onClick={() => confirmApprove(c.id)}>Confirm approval</Button>
                                <button onClick={() => { setApprovingId(null); setPendingCommitment(null) }} className="px-4 py-2 text-sm font-semibold text-[#6B7280] hover:text-[#0D1117]">Cancel</button>
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )
                )}

                {tab === 'approved' && (
                  approved.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                      <div className="text-3xl mb-3">👥</div>
                      <p className="text-sm font-semibold text-[#374151]">No approved members yet</p>
                    </div>
                  ) : (
                    <div className="divide-y divide-[#F1F3F8]">
                      {approved.map(c => (
                        <div key={c.id} className="px-5 py-4 flex items-center gap-4">
                          <div className="w-9 h-9 rounded-full bg-[#ECFDF5] flex items-center justify-center text-xs font-bold text-[#059669] shrink-0">{c.initials}</div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-[#0D1117] truncate">{c.name}</p>
                            {c.commitment && (
                              <p className="text-xs text-[#6B7280]">{fmtCommitment(c.commitment)} · {fmt(c.commitment.contributionPerRound)}/round</p>
                            )}
                          </div>
                          <div className="text-right shrink-0">
                            {c.commitment && (
                              <p className="text-xs font-semibold text-[#1746A2]">{c.commitment.equivalentPositions === 1 ? '1' : c.commitment.equivalentPositions.toFixed(1)} equiv. pos.</p>
                            )}
                            <p className="text-[10px] text-[#059669] font-semibold">Approved</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )
                )}
              </div>
            </div>

            {/* Invite panel */}
            <div className="flex flex-col gap-4">
              <div className="bg-white rounded-xl border border-[#E2E6F0] overflow-hidden">
                <div className="px-5 py-3.5 border-b border-[#F1F3F8] bg-[#F8FAFF]">
                  <p className="text-sm font-bold text-[#0D1117]">Invite a TCS member</p>
                </div>
                <div className="px-5 py-4 flex flex-col gap-3">
                  <input type="email" value={inviteEmail} onChange={e => setInviteEmail(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && sendInvite()}
                    placeholder="member@email.com"
                    className="w-full px-3.5 py-2.5 text-sm bg-white border border-[#E2E6F0] rounded-[10px] text-[#0D1117] placeholder:text-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#1746A2]" />
                  <Button size="sm" onClick={sendInvite} className="w-full">Send invitation</Button>
                  {inviteSent.map(e => (
                    <p key={e} className="text-xs text-[#059669] flex items-center gap-1.5">
                      <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 16 16" fill="currentColor"><path d="M13.78 4.22a.75.75 0 010 1.06l-7.25 7.25a.75.75 0 01-1.06 0L2.22 9.28a.75.75 0 011.06-1.06L6 10.94l6.72-6.72a.75.75 0 011.06 0z" /></svg>
                      Invited: {e}
                    </p>
                  ))}
                </div>
              </div>

              <div className="bg-white rounded-xl border border-[#E2E6F0] overflow-hidden">
                <div className="px-5 py-3.5 border-b border-[#F1F3F8] bg-[#F8FAFF]">
                  <p className="text-sm font-bold text-[#0D1117]">Invitation link</p>
                </div>
                <div className="px-5 py-4">
                  <div className="flex items-center gap-2 bg-[#F8FAFF] rounded-lg border border-[#E2E6F0] px-3 py-2">
                    <p className="text-xs font-mono text-[#374151] flex-1 truncate">{INVITE_LINK}</p>
                    <button onClick={() => copy('link')} className="text-xs font-bold text-[#1746A2] hover:underline shrink-0">{copied === 'link' ? '✓ Copied' : 'Copy'}</button>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl border border-[#E2E6F0] overflow-hidden">
                <div className="px-5 py-3.5 border-b border-[#F1F3F8] bg-[#F8FAFF]">
                  <p className="text-sm font-bold text-[#0D1117]">Invitation code</p>
                </div>
                <div className="px-5 py-4">
                  <div className="flex items-center justify-between bg-[#EEF2FF] rounded-xl border border-[#C7D2FE] px-4 py-3">
                    <p className="display-font text-xl font-bold tracking-widest text-[#1746A2]">{INVITE_CODE}</p>
                    <button onClick={() => copy('code')} className="text-xs font-bold text-[#1746A2] hover:underline">{copied === 'code' ? '✓ Copied' : 'Copy'}</button>
                  </div>
                </div>
              </div>

              {pct >= 100 && <Alert type="success">All equivalent positions are filled. You can proceed to assign payout positions.</Alert>}
            </div>
          </div>
        </div>
      </div>
    </OwnerShell>
  )
}
