import { useState } from 'react'
import { Button, Alert } from '../ui'
import type { View, NavMeta } from '../../App'

interface Props { navigate: (v: View, meta?: NavMeta) => void }

interface EligibleMember {
  id: string
  name: string
  email: string
  joinDate: string
  contributionScore: number
  groupsActive: number
  roundsCompleted: number
  isEligible: boolean
  eligibilityGrantedDate?: string
  appliedDate?: string
  applicationStatus?: 'pending' | 'approved' | 'rejected' | 'info-required'
}

interface AuditEntry {
  date: string
  action: string
  member: string
  by: string
  note: string
}

const MEMBERS: EligibleMember[] = [
  { id: 'm1', name: 'Adaeze Okonkwo', email: 'adaeze@tcs.ng', joinDate: 'Jan 2024', contributionScore: 98, groupsActive: 2, roundsCompleted: 24, isEligible: true, eligibilityGrantedDate: 'Jun 1, 2025', appliedDate: 'Jul 2, 2025', applicationStatus: 'approved' },
  { id: 'm2', name: 'Chukwuemeka Osei', email: 'c.osei@email.ng', joinDate: 'Mar 2024', contributionScore: 95, groupsActive: 1, roundsCompleted: 16, isEligible: true, eligibilityGrantedDate: 'Jul 5, 2026', appliedDate: 'Jul 11, 2026', applicationStatus: 'pending' },
  { id: 'm3', name: 'Ngozi Adeyemi', email: 'ngozi.a@gmail.com', joinDate: 'Feb 2024', contributionScore: 91, groupsActive: 1, roundsCompleted: 12, isEligible: true, eligibilityGrantedDate: 'Jul 1, 2026', appliedDate: 'Jul 10, 2026', applicationStatus: 'info-required' },
  { id: 'm4', name: 'Babajide Lawson', email: 'b.lawson@zenithng.com', joinDate: 'May 2024', contributionScore: 88, groupsActive: 2, roundsCompleted: 10, isEligible: false },
  { id: 'm5', name: 'Fatima Aliyu', email: 'f.aliyu@outlook.com', joinDate: 'Apr 2024', contributionScore: 85, groupsActive: 1, roundsCompleted: 8, isEligible: false },
  { id: 'm6', name: 'Emeka Nwachukwu', email: 'e.nwachukwu@gmail.com', joinDate: 'Jun 2024', contributionScore: 79, groupsActive: 1, roundsCompleted: 6, isEligible: false },
]

const AUDIT: AuditEntry[] = [
  { date: 'Jul 5, 2026', action: 'Eligibility granted', member: 'Chukwuemeka Osei', by: 'Reviewer (TCS)', note: 'Met all criteria after 16 completed rounds with 95% on-time rate.' },
  { date: 'Jul 1, 2026', action: 'Eligibility granted', member: 'Ngozi Adeyemi', by: 'Reviewer (TCS)', note: 'Granted after manual review of 12-round contribution record.' },
  { date: 'Jun 1, 2025', action: 'Eligibility granted', member: 'Adaeze Okonkwo', by: 'System (auto)', note: 'Automatically met eligibility threshold: 20+ rounds, 90%+ on-time.' },
  { date: 'Jul 2, 2025', action: 'Organization approved', member: 'Adaeze Okonkwo', by: 'Reviewer (TCS)', note: 'Application reviewed and approved. Organization activated.' },
  { date: 'Jul 11, 2026', action: 'Application submitted', member: 'Chukwuemeka Osei', by: 'Chukwuemeka Osei', note: 'Surulere Women Ajo Circle application submitted.' },
]

const scoreColor = (s: number) => s >= 90 ? 'text-[#059669]' : s >= 75 ? 'text-[#D97706]' : 'text-[#DC2626]'

export function OrgEligibility({ navigate }: Props) {
  const [tab, setTab] = useState<'members' | 'audit'>('members')
  const [grantTarget, setGrantTarget] = useState<string | null>(null)
  const [grantNote, setGrantNote] = useState('')
  const [granted, setGranted] = useState<string[]>([])
  const [alert, setAlert] = useState<string | null>(null)

  const doGrant = (id: string) => {
    setGranted(g => [...g, id])
    setGrantTarget(null)
    setGrantNote('')
    setAlert(`Eligibility granted to ${MEMBERS.find(m => m.id === id)?.name}.`)
    setTimeout(() => setAlert(null), 4000)
  }

  return (
    <div className="min-h-screen bg-[#F4F6FA] flex flex-col">
      {/* Top bar */}
      <div className="bg-white border-b border-[#E2E6F0] px-6 lg:px-10 py-4 flex items-center gap-4 shrink-0">
        <button
          onClick={() => navigate('org-review-queue')}
          className="flex items-center gap-1.5 text-sm text-[#6B7280] hover:text-[#0D1117] font-medium"
        >
          <svg className="w-4 h-4" viewBox="0 0 16 16" fill="currentColor"><path d="M9.78 11.78a.75.75 0 01-1.06 0L4.47 7.53a.75.75 0 010-1.06l4.25-4.25a.75.75 0 111.06 1.06L6.06 7l3.72 3.72a.75.75 0 010 1.06z" /></svg>
          Application queue
        </button>
        <span className="text-[#E2E6F0]">/</span>
        <span className="text-sm font-semibold text-[#0D1117]">Eligibility management</span>
      </div>

      <div className="flex-1 px-6 lg:px-10 py-6">
        <div className="max-w-4xl mx-auto">

          {alert && <div className="mb-5"><Alert type="success">{alert}</Alert></div>}

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <h1 className="display-font text-2xl font-bold text-[#0D1117]">Eligibility management</h1>
              <p className="text-sm text-[#6B7280] mt-0.5">Control which members are eligible to apply for an organization</p>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            {[
              { label: 'Eligible members', value: MEMBERS.filter(m => m.isEligible).length + granted.length, color: 'text-[#059669]' },
              { label: 'Applied', value: MEMBERS.filter(m => m.appliedDate).length, color: 'text-[#1746A2]' },
              { label: 'Not yet eligible', value: MEMBERS.filter(m => !m.isEligible && !granted.includes(m.id)).length, color: 'text-[#6B7280]' },
            ].map(s => (
              <div key={s.label} className="bg-white rounded-xl border border-[#E2E6F0] px-5 py-4 text-center">
                <p className="text-xs text-[#9CA3AF] font-medium mb-1">{s.label}</p>
                <p className={`display-font text-3xl font-bold ${s.color}`}>{s.value}</p>
              </div>
            ))}
          </div>

          {/* Tabs */}
          <div className="flex gap-1 p-1 bg-white rounded-xl border border-[#E2E6F0] w-fit mb-5">
            {([['members', 'Members'], ['audit', 'Approval audit']] as const).map(([v, l]) => (
              <button
                key={v}
                onClick={() => setTab(v)}
                className={`px-4 py-1.5 text-sm font-semibold rounded-lg transition-colors ${tab === v ? 'bg-[#1746A2] text-white' : 'text-[#6B7280] hover:text-[#0D1117]'}`}
              >
                {l}
              </button>
            ))}
          </div>

          {tab === 'members' && (
            <div className="bg-white rounded-xl border border-[#E2E6F0] overflow-hidden">
              <div className="hidden sm:grid grid-cols-[1fr_90px_110px_120px_130px] px-5 py-3 border-b border-[#F1F3F8] bg-[#F8FAFF]">
                {['Member', 'Score', 'Rounds', 'Status', ''].map(h => (
                  <p key={h} className="text-xs font-bold text-[#9CA3AF] uppercase tracking-wide">{h}</p>
                ))}
              </div>

              {MEMBERS.map((m, i) => {
                const isGranted = m.isEligible || granted.includes(m.id)
                const isGranting = grantTarget === m.id
                return (
                  <div key={m.id}>
                    <div className={`flex flex-col sm:grid sm:grid-cols-[1fr_90px_110px_120px_130px] items-start sm:items-center gap-2 sm:gap-0 px-5 py-4 ${i < MEMBERS.length - 1 && !isGranting ? 'border-b border-[#F1F3F8]' : ''}`}>
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-8 h-8 rounded-full bg-[#EEF2FF] flex items-center justify-center text-[#1746A2] text-xs font-bold shrink-0">
                          {m.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-[#0D1117] truncate">{m.name}</p>
                          <p className="text-xs text-[#9CA3AF] truncate">{m.email}</p>
                        </div>
                      </div>
                      <p className={`text-sm font-bold ${scoreColor(m.contributionScore)}`}>{m.contributionScore}%</p>
                      <p className="text-sm text-[#374151]">{m.roundsCompleted} rounds</p>
                      <div>
                        {isGranted ? (
                          <span className="text-xs font-semibold text-[#059669] bg-[#ECFDF5] px-2.5 py-1 rounded-full">Eligible</span>
                        ) : (
                          <span className="text-xs font-semibold text-[#9CA3AF] bg-[#F1F3F8] px-2.5 py-1 rounded-full">Not eligible</span>
                        )}
                        {m.applicationStatus && (
                          <p className="text-[10px] text-[#9CA3AF] mt-0.5 capitalize">{m.applicationStatus === 'info-required' ? 'Info req.' : m.applicationStatus}</p>
                        )}
                      </div>
                      <div className="flex justify-end">
                        {!isGranted && (
                          <button
                            onClick={() => setGrantTarget(m.id)}
                            className="text-sm font-semibold text-[#1746A2] hover:underline"
                          >
                            Grant eligibility
                          </button>
                        )}
                        {isGranted && m.eligibilityGrantedDate && (
                          <p className="text-xs text-[#9CA3AF]">Since {m.eligibilityGrantedDate}</p>
                        )}
                      </div>
                    </div>

                    {isGranting && (
                      <div className="mx-5 mb-4 bg-[#EEF2FF] rounded-xl border border-[#C7D2FE] px-5 py-4 flex flex-col gap-3">
                        <p className="text-sm font-semibold text-[#0D1117]">Grant eligibility to {m.name}</p>
                        <p className="text-xs text-[#6B7280]">This will allow the member to apply for an organization. The grant is logged in the audit trail.</p>
                        <textarea
                          value={grantNote}
                          onChange={e => setGrantNote(e.target.value)}
                          rows={2}
                          placeholder="Optional: note your reason for granting eligibility…"
                          className="w-full px-3 py-2 text-sm border border-[#C7D2FE] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1746A2] bg-white"
                        />
                        <div className="flex gap-2">
                          <Button size="sm" variant="primary" onClick={() => doGrant(m.id)}>Confirm grant</Button>
                          <button
                            onClick={() => { setGrantTarget(null); setGrantNote('') }}
                            className="px-4 py-2 text-sm font-semibold text-[#6B7280] hover:text-[#0D1117]"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}

          {tab === 'audit' && (
            <div className="bg-white rounded-xl border border-[#E2E6F0] overflow-hidden">
              <div className="px-5 py-3.5 border-b border-[#F1F3F8] bg-[#F8FAFF]">
                <p className="text-sm font-bold text-[#0D1117]">Approval audit trail</p>
                <p className="text-xs text-[#9CA3AF] mt-0.5">Immutable log of all eligibility and approval decisions</p>
              </div>
              <div className="divide-y divide-[#F1F3F8]">
                {AUDIT.map((entry, i) => (
                  <div key={i} className="px-5 py-4 flex gap-4">
                    <div className="w-1.5 h-1.5 rounded-full bg-[#1746A2] shrink-0 mt-2" />
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-0.5">
                        <p className="text-sm font-semibold text-[#0D1117]">{entry.action}</p>
                        <p className="text-xs text-[#9CA3AF]">{entry.date}</p>
                      </div>
                      <p className="text-sm text-[#374151]">{entry.member} · {entry.by}</p>
                      {entry.note && <p className="text-xs text-[#9CA3AF] mt-1 leading-relaxed">{entry.note}</p>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
