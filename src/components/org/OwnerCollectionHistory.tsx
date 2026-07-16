import { useState } from 'react'
import { OwnerShell } from './OwnerShell'
import { COLLECTION_HISTORY, type CollectionPeriod } from './data'
import type { View, NavMeta } from '../../App'

interface Props { navigate: (v: View, meta?: NavMeta) => void }

// Synthesised transaction detail rows for the expanded panel
const MOCK_TRANSACTIONS: Record<string, { memberName: string; status: string; principal: number; fee: number; confirmedAt: string; providerRef: string; failureReason?: string }[]> = {
  ch1: [
    { memberName: 'Chioma Obi',        status: 'Paid',    principal: 50000, fee: 750, confirmedAt: '16 Jun 2025, 9:04 AM',  providerRef: 'GTB/2025/06/001234' },
    { memberName: 'Babatunde Oke',     status: 'Paid',    principal: 50000, fee: 750, confirmedAt: '17 Jun 2025, 10:21 AM', providerRef: 'UBA/2025/06/009871' },
    { memberName: 'Fatimah Kano',      status: 'Paid',    principal: 50000, fee: 750, confirmedAt: '18 Jun 2025, 2:14 PM',  providerRef: 'ZNB/2025/06/003456' },
    { memberName: 'Sunday Eze',        status: 'Paid',    principal: 50000, fee: 750, confirmedAt: '19 Jun 2025, 8:55 AM',  providerRef: 'FBN/2025/06/007788' },
    { memberName: 'Adaeze Okonkwo',    status: 'Paid',    principal: 50000, fee: 750, confirmedAt: '20 Jun 2025, 4:30 PM',  providerRef: 'GTB/2025/06/005566' },
    { memberName: 'Maryam Nwobi',      status: 'Paid',    principal: 50000, fee: 750, confirmedAt: '21 Jun 2025, 11:02 AM', providerRef: 'ACC/2025/06/002233' },
    { memberName: 'Tunde Lawal',       status: 'Paid',    principal: 50000, fee: 750, confirmedAt: '22 Jun 2025, 9:45 AM',  providerRef: 'GTB/2025/06/008899' },
    { memberName: 'Chukwuemeka Osei',  status: 'Paid',    principal: 50000, fee: 750, confirmedAt: '24 Jun 2025, 3:17 PM',  providerRef: 'ZNB/2025/06/001199' },
    { memberName: 'Emeka Okafor',      status: 'Paid',    principal: 50000, fee: 750, confirmedAt: '25 Jun 2025, 1:08 PM',  providerRef: 'GTB/2025/06/004455' },
    { memberName: 'Halima Ibrahim',    status: 'Paid',    principal: 50000, fee: 750, confirmedAt: '26 Jun 2025, 10:22 AM', providerRef: 'UBA/2025/06/013344' },
    { memberName: 'Grace Fasanya',     status: 'Paid',    principal: 50000, fee: 750, confirmedAt: '27 Jun 2025, 2:45 PM',  providerRef: 'FBN/2025/06/018877' },
    { memberName: 'James Adeyemi',     status: 'Paid',    principal: 50000, fee: 750, confirmedAt: '28 Jun 2025, 10:30 AM', providerRef: 'UBA/2025/06/006677' },
  ],
  ch3: [
    { memberName: 'Chioma Obi',        status: 'Paid',    principal: 50000, fee: 750, confirmedAt: '18 May 2025, 9:14 AM',  providerRef: 'GTB/2025/05/001234' },
    { memberName: 'Babatunde Oke',     status: 'Paid',    principal: 50000, fee: 750, confirmedAt: '19 May 2025, 10:21 AM', providerRef: 'UBA/2025/05/009871' },
    { memberName: 'Fatimah Kano',      status: 'Paid',    principal: 50000, fee: 750, confirmedAt: '20 May 2025, 2:14 PM',  providerRef: 'ZNB/2025/05/003456' },
    { memberName: 'Sunday Eze',        status: 'Paid',    principal: 50000, fee: 750, confirmedAt: '21 May 2025, 8:55 AM',  providerRef: 'FBN/2025/05/007788' },
    { memberName: 'Adaeze Okonkwo',    status: 'Paid',    principal: 50000, fee: 750, confirmedAt: '22 May 2025, 4:30 PM',  providerRef: 'GTB/2025/05/005566' },
    { memberName: 'Maryam Nwobi',      status: 'Paid',    principal: 50000, fee: 750, confirmedAt: '22 May 2025, 11:02 AM', providerRef: 'ACC/2025/05/002233' },
    { memberName: 'Tunde Lawal',       status: 'Paid',    principal: 50000, fee: 750, confirmedAt: '24 May 2025, 9:45 AM',  providerRef: 'GTB/2025/05/008899' },
    { memberName: 'Chukwuemeka Osei',  status: 'Paid',    principal: 50000, fee: 750, confirmedAt: '26 May 2025, 3:17 PM',  providerRef: 'ZNB/2025/05/001199' },
    { memberName: 'Emeka Okafor',      status: 'Paid',    principal: 50000, fee: 750, confirmedAt: '28 May 2025, 1:08 PM',  providerRef: 'GTB/2025/05/004455' },
    { memberName: 'Halima Ibrahim',    status: 'Paid',    principal: 50000, fee: 750, confirmedAt: '29 May 2025, 10:22 AM', providerRef: 'UBA/2025/05/013344' },
    { memberName: 'Grace Fasanya',     status: 'Overdue', principal: 50000, fee: 0,   confirmedAt: '—',                     providerRef: '—', failureReason: 'No payment received within grace period. Default charge applied.' },
    { memberName: 'James Adeyemi',     status: 'Paid',    principal: 50000, fee: 750, confirmedAt: '3 Jun 2025, 10:30 AM',  providerRef: 'UBA/2025/06/001123' },
  ],
}

function PeriodCard({ period }: { period: CollectionPeriod }) {
  const [expanded, setExpanded] = useState(false)
  const transactions = MOCK_TRANSACTIONS[period.id] ?? []
  const pctColor = period.completionPct === 100 ? 'text-[#059669]' : period.completionPct >= 80 ? 'text-[#1746A2]' : 'text-[#D97706]'

  return (
    <div className={`bg-white rounded-xl border overflow-hidden transition-all ${expanded ? 'border-[#1746A2]' : 'border-[#E2E6F0]'}`}>
      {/* Summary row */}
      <div
        className="flex items-center gap-4 px-5 py-4 cursor-pointer hover:bg-[#F8FAFF] transition-colors"
        onClick={() => setExpanded(e => !e)}
      >
        <span className="text-xl shrink-0">{period.emoji}</span>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-[#0D1117]">{period.groupName}</p>
          <p className="text-xs text-[#6B7280] mt-0.5">Round {period.roundNumber} of {period.totalRounds} · {period.openDate} – {period.gracePeriodEnd}</p>
        </div>

        {/* Stats */}
        <div className="hidden sm:flex items-center gap-6 shrink-0">
          <div className="text-right">
            <p className="text-xs text-[#9CA3AF]">Expected</p>
            <p className="text-sm font-bold text-[#0D1117]">₦{(period.expectedPrincipal / 1000).toFixed(0)}k</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-[#9CA3AF]">Confirmed</p>
            <p className="text-sm font-bold text-[#059669]">₦{(period.confirmedPrincipal / 1000).toFixed(0)}k</p>
          </div>
          {period.outstandingPrincipal > 0 && (
            <div className="text-right">
              <p className="text-xs text-[#9CA3AF]">Outstanding</p>
              <p className="text-sm font-bold text-[#DC2626]">₦{(period.outstandingPrincipal / 1000).toFixed(0)}k</p>
            </div>
          )}
          {(period.defaultChargesTotal ?? 0) > 0 && (
            <div className="text-right">
              <p className="text-xs text-[#9CA3AF]">Default charges</p>
              <p className="text-sm font-bold text-[#D97706]">₦{(period.defaultChargesTotal ?? 0).toLocaleString()}</p>
            </div>
          )}
          <div className="text-right">
            <p className={`text-lg font-bold display-font ${pctColor}`}>{period.completionPct}%</p>
            <p className="text-xs text-[#9CA3AF]">complete</p>
          </div>
        </div>

        {/* Complete badge */}
        <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-[#ECFDF5] text-[#059669] shrink-0">
          Complete
        </span>

        <svg className={`w-4 h-4 text-[#9CA3AF] transition-transform shrink-0 ${expanded ? 'rotate-180' : ''}`} viewBox="0 0 16 16" fill="currentColor">
          <path d="M3.22 6.22a.75.75 0 011.06 0L8 9.94l3.72-3.72a.75.75 0 111.06 1.06l-4.25 4.25a.75.75 0 01-1.06 0L3.22 7.28a.75.75 0 010-1.06z" />
        </svg>
      </div>

      {/* Expanded detail */}
      {expanded && (
        <div className="border-t border-[#F1F3F8]">
          {/* Period summary */}
          <div className="px-5 py-4 grid grid-cols-2 sm:grid-cols-4 gap-4 bg-[#F8FAFF]">
            {[
              { label: 'Payment window', value: `${period.openDate} – ${period.normalDeadline}` },
              { label: 'Grace period ended', value: period.gracePeriodEnd },
              { label: 'Collection complete', value: period.completionDate ?? '—' },
              { label: 'Ready for payout', value: period.readyForPayoutDate ?? '—' },
            ].map(row => (
              <div key={row.label}>
                <p className="text-[10px] text-[#9CA3AF] uppercase tracking-wide mb-0.5">{row.label}</p>
                <p className="text-xs font-semibold text-[#0D1117]">{row.value}</p>
              </div>
            ))}
          </div>

          {/* Transaction table */}
          {transactions.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-[#F1F3F8]">
                    {['Member', 'Status', 'Principal', 'Processing fee', 'Confirmed', 'Provider reference'].map(h => (
                      <th key={h} className="text-left px-5 py-2.5 text-[10px] font-bold text-[#9CA3AF] uppercase tracking-wide whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((tx, i) => (
                    <tr key={i} className={`border-b border-[#F1F3F8] last:border-0 ${tx.status === 'Overdue' ? 'bg-[#FEF2F2]/40' : ''}`}>
                      <td className="px-5 py-3 font-semibold text-[#0D1117] whitespace-nowrap">{tx.memberName}</td>
                      <td className="px-5 py-3 whitespace-nowrap">
                        {tx.status === 'Paid'
                          ? <span className="text-[#059669] font-bold">✓ Paid</span>
                          : <span className="text-[#DC2626] font-bold">✕ {tx.status}</span>}
                      </td>
                      <td className="px-5 py-3 font-semibold text-[#0D1117]">₦{tx.principal.toLocaleString()}</td>
                      <td className="px-5 py-3 text-[#6B7280]">{tx.fee > 0 ? `₦${tx.fee.toLocaleString()}` : '—'}</td>
                      <td className="px-5 py-3 text-[#6B7280] whitespace-nowrap">{tx.confirmedAt}</td>
                      <td className="px-5 py-3 font-mono text-[#6B7280] whitespace-nowrap">
                        {tx.providerRef === '—'
                          ? <span className="text-[#9CA3AF]">—</span>
                          : tx.providerRef}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 border-[#E2E6F0] bg-[#F8FAFF]">
                    <td className="px-5 py-3 font-bold text-[#0D1117]">Total</td>
                    <td className="px-5 py-3"></td>
                    <td className="px-5 py-3 font-bold text-[#0D1117]">₦{period.confirmedPrincipal.toLocaleString()}</td>
                    <td className="px-5 py-3 font-bold text-[#0D1117]">₦{transactions.reduce((s, t) => s + t.fee, 0).toLocaleString()}</td>
                    <td colSpan={2}></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}

          {transactions.length === 0 && (
            <div className="px-5 py-6 text-sm text-[#9CA3AF] text-center">Transaction detail not available for this period.</div>
          )}
        </div>
      )}
    </div>
  )
}

export function OwnerCollectionHistory({ navigate }: Props) {
  const allPeriods = COLLECTION_HISTORY

  return (
    <OwnerShell navigate={navigate} activeView="owner-collection">
      <div className="bg-white border-b border-[#E2E6F0] px-6 lg:px-8 py-5 shrink-0">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('owner-collection')} className="flex items-center gap-1.5 text-sm text-[#6B7280] hover:text-[#0D1117] font-medium">
            <svg className="w-4 h-4" viewBox="0 0 16 16" fill="currentColor"><path d="M9.78 11.78a.75.75 0 01-1.06 0L4.47 7.53a.75.75 0 010-1.06l4.25-4.25a.75.75 0 111.06 1.06L6.06 7l3.72 3.72a.75.75 0 010 1.06z" /></svg>
            Collection Operations
          </button>
          <span className="text-[#E2E6F0]">/</span>
          <h1 className="display-font text-base font-bold text-[#0D1117]">Collection history</h1>
        </div>
        <p className="text-sm text-[#6B7280] mt-1">{allPeriods.length} completed collection period{allPeriods.length !== 1 ? 's' : ''}</p>
      </div>

      <div className="flex-1 overflow-y-auto px-6 lg:px-8 py-6">
        <div className="max-w-4xl">

          {/* Summary bar */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            {[
              { label: 'Total expected', value: `₦${(allPeriods.reduce((s, p) => s + p.expectedPrincipal, 0) / 1000000).toFixed(1)}M` },
              { label: 'Total confirmed', value: `₦${(allPeriods.reduce((s, p) => s + p.confirmedPrincipal, 0) / 1000000).toFixed(1)}M` },
              { label: 'Default charges', value: `₦${allPeriods.reduce((s, p) => s + (p.defaultChargesTotal ?? 0), 0).toLocaleString()}` },
            ].map(s => (
              <div key={s.label} className="bg-white rounded-xl border border-[#E2E6F0] px-5 py-4 text-center">
                <p className="text-xs text-[#9CA3AF] uppercase tracking-wide mb-1">{s.label}</p>
                <p className="display-font text-xl font-bold text-[#0D1117]">{s.value}</p>
              </div>
            ))}
          </div>

          {allPeriods.length === 0 ? (
            <div className="text-center py-16 text-[#9CA3AF] text-sm">No completed collection periods yet.</div>
          ) : (
            <div className="flex flex-col gap-3">
              {allPeriods.map(period => <PeriodCard key={period.id} period={period} />)}
            </div>
          )}
        </div>
      </div>
    </OwnerShell>
  )
}
