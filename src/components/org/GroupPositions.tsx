import { useState } from 'react'
import { Button, Alert } from '../ui'
import { OwnerShell } from './OwnerShell'
import type { View, NavMeta } from '../../App'

interface Props { navigate: (v: View, meta?: NavMeta) => void }

// Group config
const GROUP = {
  positions: 12,
  amount: 50000,
  allowSplit: true,
  splitParts: 2,       // each position can be split into 2 equal halves
  maxPerMember: 2,
}

// Commitment fraction within a single position slot: 1 = full, 0.5 = half
type Fraction = 1 | 0.5

interface Holder {
  memberId: string
  fraction: Fraction
}

interface Position {
  n: number
  holders: Holder[]
}

// totalCommitment for a position: sum of fractions
function totalCommitment(pos: Position): number {
  return pos.holders.reduce((s, h) => s + h.fraction, 0)
}

type PosStatus = 'empty' | 'partial' | 'complete' | 'over'

function posStatus(pos: Position): PosStatus {
  const t = totalCommitment(pos)
  if (t === 0) return 'empty'
  if (t < 1) return 'partial'
  if (t === 1) return 'complete'
  return 'over'
}

interface ApprovedMember {
  id: string
  name: string
  initials: string
  // equivalent positions committed from recruitment
  equivCommitted: number
  // positions currently assigned on board
  assignedPositions: number[]
  equivAssigned: number
}

const APPROVED: ApprovedMember[] = [
  { id: 'm1', name: 'Babajide Lawson',   initials: 'BL', equivCommitted: 2,   assignedPositions: [], equivAssigned: 0 },
  { id: 'm2', name: 'Fatima Aliyu',      initials: 'FA', equivCommitted: 1,   assignedPositions: [], equivAssigned: 0 },
  { id: 'm3', name: 'Amaka Eze',         initials: 'AE', equivCommitted: 1,   assignedPositions: [], equivAssigned: 0 },
  { id: 'm4', name: 'Tunde Adewale',     initials: 'TA', equivCommitted: 1,   assignedPositions: [], equivAssigned: 0 },
  { id: 'm5', name: 'Chukwuemeka Osei',  initials: 'CO', equivCommitted: 0.5, assignedPositions: [], equivAssigned: 0 },
  { id: 'm6', name: 'Ngozi Adeyemi',     initials: 'NA', equivCommitted: 0.5, assignedPositions: [], equivAssigned: 0 },
  { id: 'm7', name: 'Samuel Ojo',        initials: 'SO', equivCommitted: 1,   assignedPositions: [], equivAssigned: 0 },
  { id: 'm8', name: 'Chisom Okafor',     initials: 'CO2', equivCommitted: 1,  assignedPositions: [], equivAssigned: 0 },
]

// Pre-seed some assignments for visual interest
const SEED_POSITIONS: Position[] = Array.from({ length: GROUP.positions }, (_, i) => {
  const n = i + 1
  const holders: Holder[] = []
  if (n === 1) holders.push({ memberId: 'm1', fraction: 1 })
  if (n === 2) holders.push({ memberId: 'm1', fraction: 1 })
  if (n === 3) holders.push({ memberId: 'm2', fraction: 1 })
  if (n === 4) { holders.push({ memberId: 'm5', fraction: 0.5 }); holders.push({ memberId: 'm6', fraction: 0.5 }) }
  if (n === 5) holders.push({ memberId: 'm3', fraction: 1 })
  if (n === 6) holders.push({ memberId: 'm5', fraction: 0.5 }) // partial
  return { n, holders }
})

const SEED_MEMBERS: ApprovedMember[] = APPROVED.map(m => {
  let assigned = 0
  const positions: number[] = []
  SEED_POSITIONS.forEach(p => {
    p.holders.forEach(h => {
      if (h.memberId === m.id) { assigned += h.fraction; positions.push(p.n) }
    })
  })
  return { ...m, assignedPositions: positions, equivAssigned: assigned }
})

function fractionLabel(f: Fraction) { return f === 1 ? 'Individual' : 'Shared' }

const posStatusConfig = {
  empty: { label: 'Empty', border: 'border-dashed border-[#E2E6F0]', bg: 'bg-white', numColor: 'text-[#9CA3AF]', badge: 'bg-[#F1F3F8] text-[#9CA3AF]' },
  partial: { label: 'Partial', border: 'border-[#FDE68A]', bg: 'bg-[#FFFBEB]', numColor: 'text-[#D97706]', badge: 'bg-[#FEF3C7] text-[#92400E]' },
  complete: { label: 'Complete', border: 'border-[#A7F3D0]', bg: 'bg-[#ECFDF5]', numColor: 'text-[#059669]', badge: 'bg-[#D1FAE5] text-[#065F46]' },
  over: { label: 'Over-allocated', border: 'border-[#FECACA]', bg: 'bg-[#FEF2F2]', numColor: 'text-[#DC2626]', badge: 'bg-[#FEE2E2] text-[#991B1B]' },
}

export function GroupPositions({ navigate }: Props) {
  const [positions, setPositions] = useState<Position[]>(SEED_POSITIONS)
  const [members, setMembers] = useState<ApprovedMember[]>(SEED_MEMBERS)
  const [selected, setSelected] = useState<number | null>(null)
  // fraction to assign when clicking a member
  const [assignFraction, setAssignFraction] = useState<Fraction>(1)
  const [error, setError] = useState<string | null>(null)

  const completedPositions = positions.filter(p => posStatus(p) === 'complete').length
  const partialPositions = positions.filter(p => posStatus(p) === 'partial').length
  const overPositions = positions.filter(p => posStatus(p) === 'over').length
  const allComplete = completedPositions === GROUP.positions && partialPositions === 0 && overPositions === 0

  const assign = (posN: number, memberId: string, fraction: Fraction) => {
    setError(null)
    const pos = positions.find(p => p.n === posN)!
    const member = members.find(m => m.id === memberId)!
    const newTotal = totalCommitment(pos) + fraction

    if (pos.holders.some(h => h.memberId === memberId)) {
      setError(`${member.name} is already assigned to position ${posN}.`)
      return
    }
    if (newTotal > 1) {
      setError(`Adding a ${fractionLabel(fraction)} position to position ${posN} would exceed its capacity (${(totalCommitment(pos) * 100).toFixed(0)}% already assigned).`)
      return
    }
    const newEquiv = member.equivAssigned + fraction
    if (newEquiv > member.equivCommitted) {
      setError(`${member.name} is being assigned more than their committed equivalent positions (committed: ${member.equivCommitted}).`)
      return
    }

    setPositions(ps => ps.map(p => p.n === posN ? { ...p, holders: [...p.holders, { memberId, fraction }] } : p))
    setMembers(ms => ms.map(m => m.id === memberId ? {
      ...m,
      assignedPositions: [...m.assignedPositions, posN],
      equivAssigned: m.equivAssigned + fraction,
    } : m))
    setSelected(null)
  }

  const remove = (posN: number, memberId: string, fraction: Fraction) => {
    setPositions(ps => ps.map(p => p.n === posN ? { ...p, holders: p.holders.filter(h => h.memberId !== memberId) } : p))
    setMembers(ms => ms.map(m => m.id === memberId ? {
      ...m,
      assignedPositions: m.assignedPositions.filter(n => n !== posN),
      equivAssigned: Math.max(0, m.equivAssigned - fraction),
    } : m))
    setError(null)
  }

  const selPos = selected !== null ? positions.find(p => p.n === selected) : null
  const selRemaining = selPos ? 1 - totalCommitment(selPos) : 0
  const effectiveFraction: Fraction = GROUP.allowSplit && selRemaining === 0.5 ? 0.5 : assignFraction

  return (
    <OwnerShell navigate={navigate} activeView="owner-groups">
      {/* Breadcrumb */}
      <div className="bg-white border-b border-[#E2E6F0] px-6 lg:px-8 py-3.5 flex items-center gap-3 shrink-0">
        <button onClick={() => navigate('owner-group-recruit')} className="flex items-center gap-1.5 text-sm text-[#6B7280] hover:text-[#0D1117] font-medium">
          <svg className="w-4 h-4" viewBox="0 0 16 16" fill="currentColor"><path d="M9.78 11.78a.75.75 0 01-1.06 0L4.47 7.53a.75.75 0 010-1.06l4.25-4.25a.75.75 0 111.06 1.06L6.06 7l3.72 3.72a.75.75 0 010 1.06z" /></svg>
          Recruit members
        </button>
        <span className="text-[#E2E6F0]">/</span>
        <span className="text-sm font-semibold text-[#0D1117]">Assign payout positions</span>
        <div className="ml-auto flex items-center gap-2">
          <span className="text-xs text-[#9CA3AF]">Step 3 of 6</span>
          <Button size="sm" disabled={!allComplete} onClick={() => navigate('owner-group-rules', { groupId: 'new' })}>
            Continue →
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-6 lg:px-8 py-6">
        <div className="max-w-5xl mx-auto flex flex-col gap-5">

          {/* Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { label: 'Total positions', value: GROUP.positions, color: 'text-[#0D1117]' },
              { label: 'Complete', value: completedPositions, color: 'text-[#059669]' },
              { label: 'Partial / empty', value: partialPositions + (GROUP.positions - completedPositions - partialPositions - overPositions), color: partialPositions > 0 ? 'text-[#D97706]' : 'text-[#9CA3AF]' },
              { label: 'Over-allocated', value: overPositions, color: overPositions > 0 ? 'text-[#DC2626]' : 'text-[#9CA3AF]' },
            ].map(s => (
              <div key={s.label} className="bg-white rounded-xl border border-[#E2E6F0] px-5 py-4">
                <p className="text-xs text-[#9CA3AF] font-medium mb-1">{s.label}</p>
                <p className={`display-font text-2xl font-bold ${s.color}`}>{s.value}</p>
              </div>
            ))}
          </div>

          {error && <Alert type="error">{error}</Alert>}
          {allComplete && <Alert type="success">All positions fully allocated. You can continue to rules review.</Alert>}
          {partialPositions > 0 && !error && (
            <div className="bg-[#FFFBEB] border border-[#FDE68A] rounded-xl px-5 py-3 text-sm text-[#92400E]">
              <span className="font-semibold">{partialPositions} position{partialPositions !== 1 ? 's are' : ' is'} partially filled.</span> A position is complete only when its total assigned commitment equals one full position. You cannot launch with partially filled positions.
            </div>
          )}

          <div className="grid lg:grid-cols-[1fr_280px] gap-6 items-start">

            {/* Position board */}
            <div>
              <p className="text-sm font-bold text-[#0D1117] mb-3">Payout positions</p>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {positions.map(pos => {
                  const st = posStatus(pos)
                  const cfg = posStatusConfig[st]
                  const isSelected = selected === pos.n
                  const remaining = 1 - totalCommitment(pos)
                  const canAdd = remaining > 0

                  return (
                    <div
                      key={pos.n}
                      className={`rounded-xl border-2 p-4 transition-all cursor-pointer ${isSelected ? 'border-[#1746A2] bg-[#EEF2FF] shadow-md' : `${cfg.border} ${cfg.bg} hover:opacity-90`}`}
                      onClick={() => canAdd && setSelected(n => n === pos.n ? null : pos.n)}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <span className={`display-font text-xl font-black ${isSelected ? 'text-[#1746A2]' : cfg.numColor}`}>#{pos.n}</span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${isSelected ? 'bg-[#DBEAFE] text-[#1746A2]' : cfg.badge}`}>{cfg.label}</span>
                      </div>

                      {/* Holders */}
                      {pos.holders.length > 0 ? (
                        <div className="flex flex-col gap-1.5 mb-2">
                          {pos.holders.map(h => {
                            const m = members.find(x => x.id === h.memberId)!
                            return (
                              <div key={h.memberId} className="flex items-center gap-2">
                                <div className="w-5 h-5 rounded-full bg-[#1746A2] text-white text-[9px] font-bold flex items-center justify-center shrink-0">{m.initials}</div>
                                <p className="text-xs font-semibold text-[#0D1117] flex-1 truncate">{m.name}</p>
                                <span className="text-[10px] font-bold text-[#6B7280] shrink-0">{fractionLabel(h.fraction)}</span>
                                <button onClick={e => { e.stopPropagation(); remove(pos.n, h.memberId, h.fraction) }} className="text-[#9CA3AF] hover:text-[#DC2626] transition-colors shrink-0">
                                  <svg className="w-3 h-3" viewBox="0 0 16 16" fill="currentColor"><path d="M3.72 3.72a.75.75 0 011.06 0L8 6.94l3.22-3.22a.75.75 0 111.06 1.06L9.06 8l3.22 3.22a.75.75 0 11-1.06 1.06L8 9.06l-3.22 3.22a.75.75 0 01-1.06-1.06L6.94 8 3.72 4.78a.75.75 0 010-1.06z" /></svg>
                                </button>
                              </div>
                            )
                          })}
                          {/* Remaining slot */}
                          {remaining > 0 && (
                            <div className="flex items-center gap-2 border-t border-dashed border-[#FDE68A] pt-1.5 mt-0.5">
                              <div className="w-5 h-5 rounded-full border-2 border-dashed border-[#D97706] shrink-0" />
                              <p className="text-[10px] text-[#D97706] font-semibold">Remaining: {remaining === 0.5 ? 'shared slot' : 'full slot'} — click to assign</p>
                            </div>
                          )}
                        </div>
                      ) : (
                        <p className="text-xs text-[#9CA3AF]">{isSelected ? 'Select a member →' : 'Click to assign'}</p>
                      )}

                      {/* Fill bar */}
                      <div className="h-1 bg-white/60 rounded-full overflow-hidden mt-2">
                        <div className={`h-full rounded-full transition-all ${st === 'complete' ? 'bg-[#059669]' : st === 'partial' ? 'bg-[#D97706]' : st === 'over' ? 'bg-[#DC2626]' : 'bg-transparent'}`}
                          style={{ width: `${Math.min(100, totalCommitment(pos) * 100)}%` }} />
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Member panel */}
            <div className="sticky top-6">
              <p className="text-sm font-bold text-[#0D1117] mb-3">
                {selected ? `Assign to position #${selected}` : 'Approved members'}
              </p>

              {selected && GROUP.allowSplit && selRemaining > 0 && selRemaining < 1 && (
                <div className="bg-[#EEF2FF] border border-[#C7D2FE] rounded-xl px-4 py-3 mb-3 text-xs text-[#374151]">
                  <span className="font-semibold">Remaining slot:</span> Shared position — only a shared-position assignment is valid here.
                </div>
              )}

              {selected && GROUP.allowSplit && selRemaining === 1 && (
                <div className="flex gap-2 mb-3">
                  {([1, 0.5] as Fraction[]).map(f => (
                    <button key={f} type="button" onClick={() => setAssignFraction(f)}
                      className={`flex-1 py-2 text-xs font-bold rounded-lg border-2 transition-colors ${assignFraction === f ? 'border-[#1746A2] bg-[#EEF2FF] text-[#1746A2]' : 'border-[#E2E6F0] bg-white text-[#6B7280]'}`}>
                      {f === 1 ? 'Individual position' : 'Shared position'}
                    </button>
                  ))}
                </div>
              )}

              <div className="bg-white rounded-xl border border-[#E2E6F0] overflow-hidden">
                <div className="divide-y divide-[#F1F3F8]">
                  {members.map(m => {
                    const remaining = m.equivCommitted - m.equivAssigned
                    const alreadyInPos = selPos?.holders.some(h => h.memberId === m.id) ?? false
                    const wouldExceed = remaining < effectiveFraction
                    const canAssign = selected !== null && !alreadyInPos && !wouldExceed && selRemaining > 0

                    return (
                      <div
                        key={m.id}
                        onClick={() => canAssign && selected && assign(selected, m.id, effectiveFraction)}
                        className={`flex items-center gap-3 px-4 py-3 transition-colors ${canAssign ? 'cursor-pointer hover:bg-[#F8FAFF]' : 'opacity-50'}`}
                      >
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${m.equivAssigned > 0 ? 'bg-[#1746A2] text-white' : 'bg-[#F1F3F8] text-[#6B7280]'}`}>
                          {m.initials}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-[#0D1117] truncate">{m.name}</p>
                          <p className="text-xs text-[#9CA3AF]">
                            {m.equivAssigned === 0 ? 'Not yet assigned' : `Pos. ${m.assignedPositions.join(', ')} · ${m.equivAssigned} equiv.`}
                          </p>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-[10px] font-bold text-[#6B7280]">{m.equivAssigned}/{m.equivCommitted}</p>
                          {canAssign && <p className="text-[10px] text-[#059669] font-semibold">← assign</p>}
                        </div>
                      </div>
                    )
                  })}
                </div>
                {selected && (
                  <div className="px-4 py-3 border-t border-[#F1F3F8] bg-[#EEF2FF] flex items-center justify-between">
                    <p className="text-xs font-semibold text-[#1746A2]">Position #{selected} · Assigning {effectiveFraction === 1 ? 'individual' : 'shared'} position</p>
                    <button onClick={() => { setSelected(null); setError(null) }} className="text-xs text-[#9CA3AF] hover:text-[#0D1117]">Cancel</button>
                  </div>
                )}
              </div>

              <div className="mt-3 bg-[#F8FAFF] rounded-xl border border-[#E2E6F0] px-4 py-3 text-xs text-[#6B7280] leading-relaxed">
                <p className="font-semibold text-[#0D1117] mb-1">How positions are completed</p>
                A position is complete only when its total assigned commitment equals one full position. A shared position requires all participant slots to be filled. Members can be assigned to multiple positions up to their approved commitment.
              </div>
            </div>
          </div>
        </div>
      </div>
    </OwnerShell>
  )
}
