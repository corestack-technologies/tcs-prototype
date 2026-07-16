// ── Shared thrift data for Epic 3 ─────────────────────────────────────────────

export type RoundStatus =
  | 'upcoming'           // collection window not yet open
  | 'open'               // window open, not yet paid
  | 'partial'            // partially paid within window
  | 'paid'               // fully paid
  | 'grace-period'       // past normal deadline, within grace, unpaid/partial
  | 'overdue'            // past grace, unpaid/partial — default charge applies
  | 'settled-by-policy'  // outstanding settled by group policy
  | 'missed' | 'pending-verification' | 'skipped' // legacy
export type GroupStatus = 'active' | 'completed' | 'upcoming'

export interface Round {
  id: string
  roundNumber: number
  // Collection window
  openDate?: string          // display: when payment window opens
  openDateISO?: string
  dueDate: string            // display: normal deadline (last day of window)
  dueDateISO: string
  gracePeriodEnd?: string    // display
  gracePeriodEndISO?: string
  // Amounts
  amount: number             // total obligation this round
  amountPaid: number         // cumulative paid so far (supports partial)
  processingFeePct: number   // gateway fee %, applied to amount being paid now
  status: RoundStatus
  // Post-payment
  paidDate?: string
  reference?: string         // TCS internal reference
  providerRef?: string       // gateway-assigned reference (system record)
  // Default charge (when overdue)
  defaultCharge?: number
  // Payout info
  payoutRecipient?: string
  payoutAmount?: number
  isMyPayout?: boolean
}

export interface Member {
  initials: string
  name: string
  position: number
  status: 'paid' | 'pending' | 'overdue' | 'open'
  isMe?: boolean
}

export interface Group {
  id: string
  name: string
  status: GroupStatus
  color: string
  emoji: string
  coordinator: { name: string; initials: string }
  members: number
  maxMembers: number
  amount: number
  frequency: 'Weekly' | 'Monthly' | 'Biweekly'
  myPosition: number
  cycleStart: string
  cycleEnd: string
  totalRounds: number
  completedRounds: number
  nextDueDate: string
  nextDueDateISO: string
  daysUntilDue: number
  myPayoutDate: string
  myPayoutEstimate: number
  rules: string[]
  rounds: Round[]
  memberList: Member[]
  joinedDate: string
  description: string
}

// ── Round helper ──────────────────────────────────────────────────────────────

const r = (
  n: number, due: string, dueISO: string, status: RoundStatus,
  opts: Partial<Round> = {}
): Round => {
  const isPaid = status === 'paid'
  const month = parseInt(dueISO.slice(5, 7), 10)
  const openM = month === 1 ? 12 : month - 1
  const openY = month === 1 ? parseInt(dueISO.slice(0, 4)) - 1 : parseInt(dueISO.slice(0, 4))
  const openDay = 20
  return {
    id: `r${n}`,
    roundNumber: n,
    openDate: `${openDay} ${['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][openM - 1]} ${openY}`,
    openDateISO: `${openY}-${String(openM).padStart(2,'0')}-${openDay}`,
    dueDate: due,
    dueDateISO: dueISO,
    gracePeriodEnd: due.replace(/^(\d+) /, m => String(parseInt(m) + 4) + ' '),
    gracePeriodEndISO: dueISO,
    amount: 20000,
    amountPaid: isPaid ? 20000 : 0,
    processingFeePct: 1.5,
    status,
    reference: isPaid ? `TCS${String(n).padStart(5, '0')}${1000 + n * 97}` : undefined,
    paidDate: isPaid ? due : undefined,
    ...opts,
  }
}

// ── Group 1: Lagos Mainland Ajo ───────────────────────────────────────────────

export const GROUP_MAINLAND: Group = {
  id: 'g1',
  name: 'Lagos Mainland Ajo',
  status: 'active',
  color: '#1746A2',
  emoji: '🏘',
  coordinator: { name: 'Chioma Obi', initials: 'CO' },
  members: 12,
  maxMembers: 12,
  amount: 20000,
  frequency: 'Monthly',
  myPosition: 5,
  cycleStart: 'Jan 2025',
  cycleEnd: 'Dec 2025',
  totalRounds: 12,
  completedRounds: 6,
  nextDueDate: '1 Aug 2025',
  nextDueDateISO: '2025-08-01',
  daysUntilDue: 3,
  myPayoutDate: 'May 2025',
  myPayoutEstimate: 240000,
  joinedDate: '15 Dec 2024',
  description: 'A trusted monthly thrift group for professionals on Lagos Mainland. Running since 2023 with 100% payout success.',
  rules: [
    'Contributions are due by midnight on the 1st of every month.',
    'Members must notify the coordinator at least 3 days before a due date if they anticipate a delay.',
    'One missed contribution results in a formal warning.',
    'Two missed contributions result in removal from the group.',
    'Position swaps require coordinator approval at least 7 days in advance.',
    'Payouts are sent within 24 hours of the collection deadline.',
    'Late contributions attract a ₦500 administrative fee.',
  ],
  memberList: [
    { initials: 'CO', name: 'Chioma Obi', position: 1, status: 'paid' },
    { initials: 'BO', name: 'Babatunde Oke', position: 2, status: 'paid' },
    { initials: 'FK', name: 'Fatimah Kano', position: 3, status: 'paid' },
    { initials: 'SE', name: 'Sunday Eze', position: 4, status: 'paid' },
    { initials: 'AO', name: 'Adaeze Okonkwo', position: 5, status: 'paid', isMe: true },
    { initials: 'MN', name: 'Maryam Nwobi', position: 6, status: 'pending' },
    { initials: 'TL', name: 'Tunde Lawal', position: 7, status: 'paid' },
    { initials: 'GF', name: 'Grace Fasanya', position: 8, status: 'paid' },
    { initials: 'EO', name: 'Emeka Okafor', position: 9, status: 'paid' },
    { initials: 'HI', name: 'Halima Ibrahim', position: 10, status: 'overdue' },
    { initials: 'JA', name: 'James Adeyemi', position: 11, status: 'paid' },
    { initials: 'NK', name: 'Ngozi Kalu', position: 12, status: 'paid' },
  ],
  rounds: [
    r(1, '1 Jan 2025', '2025-01-01', 'paid', { payoutRecipient: 'Chioma Obi', payoutAmount: 240000, paidDate: '1 Jan 2025', reference: 'TCS0000112' }),
    r(2, '1 Feb 2025', '2025-02-01', 'paid', { payoutRecipient: 'Babatunde Oke', payoutAmount: 240000, paidDate: '1 Feb 2025', reference: 'TCS0000248' }),
    r(3, '1 Mar 2025', '2025-03-01', 'paid', { payoutRecipient: 'Fatimah Kano', payoutAmount: 240000, paidDate: '1 Mar 2025', reference: 'TCS0000391' }),
    r(4, '1 Apr 2025', '2025-04-01', 'paid', { payoutRecipient: 'Sunday Eze', payoutAmount: 240000, paidDate: '2 Apr 2025', reference: 'TCS0000445' }),
    r(5, '1 May 2025', '2025-05-01', 'paid', { payoutRecipient: 'Adaeze Okonkwo', payoutAmount: 240000, isMyPayout: true, paidDate: '1 May 2025', reference: 'TCS0000502' }),
    r(6, '1 Jun 2025', '2025-06-01', 'paid', { payoutRecipient: 'Maryam Nwobi', payoutAmount: 240000, paidDate: '3 Jun 2025', reference: 'TCS0000618' }),
    r(7, '1 Jul 2025', '2025-07-01', 'paid', { payoutRecipient: 'Tunde Lawal', payoutAmount: 240000, paidDate: '1 Jul 2025', reference: 'TCS0000724' }),
    r(8, '31 Jul 2025', '2025-07-31', 'partial', {
      openDate: '15 Jul 2025', openDateISO: '2025-07-15',
      gracePeriodEnd: '5 Aug 2025', gracePeriodEndISO: '2025-08-05',
      amountPaid: 8000,
      payoutRecipient: 'Grace Fasanya', payoutAmount: 240000,
    }),
    r(9, '1 Sep 2025', '2025-09-01', 'upcoming', { payoutRecipient: 'Emeka Okafor', payoutAmount: 240000 }),
    r(10, '1 Oct 2025', '2025-10-01', 'upcoming', { payoutRecipient: 'Halima Ibrahim', payoutAmount: 240000 }),
    r(11, '1 Nov 2025', '2025-11-01', 'upcoming', { payoutRecipient: 'James Adeyemi', payoutAmount: 240000 }),
    r(12, '1 Dec 2025', '2025-12-01', 'upcoming', { payoutRecipient: 'Ngozi Kalu', payoutAmount: 240000 }),
  ],
}

// ── Group 2: Surulere Women's Thrift ─────────────────────────────────────────

const rS = (n: number, due: string, dueISO: string, status: RoundStatus, opts: Partial<Round> = {}): Round => ({
  ...r(n, due, dueISO, status, { ...opts, amount: opts.amount ?? 15000, amountPaid: opts.amountPaid ?? (status === 'paid' ? 15000 : 0) }),
  id: `s${n}`,
  amount: opts.amount ?? 15000,
})

export const GROUP_SURULERE: Group = {
  id: 'g2',
  name: "Surulere Women's Thrift",
  status: 'active',
  color: '#059669',
  emoji: '💚',
  coordinator: { name: 'Funmi Adeyemi', initials: 'FA' },
  members: 8,
  maxMembers: 8,
  amount: 15000,
  frequency: 'Monthly',
  myPosition: 2,
  cycleStart: 'Feb 2025',
  cycleEnd: 'Sep 2025',
  totalRounds: 8,
  completedRounds: 7,
  nextDueDate: '5 Aug 2025',
  nextDueDateISO: '2025-08-05',
  daysUntilDue: 7,
  myPayoutDate: 'Mar 2025',
  myPayoutEstimate: 120000,
  joinedDate: '20 Jan 2025',
  description: "Women-only savings and contribution group based in Surulere. Running for 3 years with 100% payout success.",
  rules: [
    'Open to women only.',
    'Contributions due on the 5th of each month.',
    'Members must be TCS-verified.',
    'Late payments attract a ₦200 fee after 48 hours.',
    'Any swap must be agreed by both parties and approved by Funmi.',
  ],
  memberList: [
    { initials: 'FA', name: 'Funmi Adeyemi', position: 1, status: 'paid' },
    { initials: 'AO', name: 'Adaeze Okonkwo', position: 2, status: 'paid', isMe: true },
    { initials: 'CN', name: 'Chisom Nwachukwu', position: 3, status: 'paid' },
    { initials: 'BJ', name: 'Bukola James', position: 4, status: 'paid' },
    { initials: 'RO', name: 'Remi Oluwafemi', position: 5, status: 'paid' },
    { initials: 'YI', name: 'Yetunde Igwe', position: 6, status: 'paid' },
    { initials: 'AK', name: 'Amaka Kelechi', position: 7, status: 'pending' },
    { initials: 'SK', name: 'Shade Kolawole', position: 8, status: 'upcoming' as any },
  ],
  rounds: [
    rS(1, '5 Feb 2025', '2025-02-05', 'paid', { payoutRecipient: 'Funmi Adeyemi', payoutAmount: 120000, paidDate: '5 Feb 2025', reference: 'TCS0000155' }),
    rS(2, '5 Mar 2025', '2025-03-05', 'paid', { payoutRecipient: 'Adaeze Okonkwo', payoutAmount: 120000, isMyPayout: true, paidDate: '5 Mar 2025', reference: 'TCS0000237' }),
    rS(3, '5 Apr 2025', '2025-04-05', 'paid', { payoutRecipient: 'Chisom Nwachukwu', payoutAmount: 120000, paidDate: '6 Apr 2025', reference: 'TCS0000319' }),
    rS(4, '5 May 2025', '2025-05-05', 'paid', { payoutRecipient: 'Bukola James', payoutAmount: 120000, paidDate: '5 May 2025', reference: 'TCS0000402' }),
    rS(5, '5 Jun 2025', '2025-06-05', 'paid', { payoutRecipient: 'Remi Oluwafemi', payoutAmount: 120000, paidDate: '5 Jun 2025', reference: 'TCS0000518' }),
    rS(6, '5 Jul 2025', '2025-07-05', 'paid', { payoutRecipient: 'Yetunde Igwe', payoutAmount: 120000, paidDate: '5 Jul 2025', reference: 'TCS0000605' }),
    rS(7, '5 Aug 2025', '2025-08-05', 'open', {
      openDate: '20 Jul 2025', openDateISO: '2025-07-20',
      gracePeriodEnd: '9 Aug 2025', gracePeriodEndISO: '2025-08-09',
      amountPaid: 0, payoutRecipient: 'Amaka Kelechi', payoutAmount: 120000,
    }),
    rS(8, '5 Sep 2025', '2025-09-05', 'upcoming', { payoutRecipient: 'Shade Kolawole', payoutAmount: 120000 }),
  ],
}

// ── Group 3: Completed group ──────────────────────────────────────────────────

export const GROUP_COMPLETED: Group = {
  id: 'g3',
  name: 'Yaba Tech Thrift 2024',
  status: 'completed',
  color: '#7C3AED',
  emoji: '💻',
  coordinator: { name: 'Seun Bello', initials: 'SB' },
  members: 10,
  maxMembers: 10,
  amount: 10000,
  frequency: 'Monthly',
  myPosition: 3,
  cycleStart: 'Jan 2024',
  cycleEnd: 'Oct 2024',
  totalRounds: 10,
  completedRounds: 10,
  nextDueDate: '—',
  nextDueDateISO: '2024-10-01',
  daysUntilDue: -1,
  myPayoutDate: 'Mar 2024',
  myPayoutEstimate: 100000,
  joinedDate: '20 Dec 2023',
  description: 'Completed 10-month thrift cycle for Yaba tech workers. All payouts successfully made.',
  rules: [],
  memberList: [],
  rounds: Array.from({ length: 10 }, (_, i) =>
    ({
      id: `y${i + 1}`,
      roundNumber: i + 1,
      dueDate: `1 ${['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct'][i]} 2024`,
      dueDateISO: `2024-${String(i + 1).padStart(2, '0')}-01`,
      amount: 10000,
      amountPaid: 10000,
      processingFeePct: 1.5,
      status: 'paid' as RoundStatus,
      paidDate: `1 ${['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct'][i]} 2024`,
      reference: `TCS000${String(i + 1).padStart(4, '0')}`,
      isMyPayout: i === 2,
      payoutRecipient: i === 2 ? 'Adaeze Okonkwo' : `Member ${i + 1}`,
      payoutAmount: 100000,
    })
  ),
  joinedDate2: '20 Dec 2023',
} as any

// ── Master group list ─────────────────────────────────────────────────────────

export const ALL_GROUPS: Group[] = [GROUP_MAINLAND, GROUP_SURULERE, GROUP_COMPLETED]

export function getGroup(id: string | undefined): Group {
  return ALL_GROUPS.find(g => g.id === id) ?? GROUP_MAINLAND
}

// ── Cross-group contribution history ─────────────────────────────────────────

export interface HistoryEntry {
  id: string
  groupId: string
  groupName: string
  roundNumber: number
  amount: number
  status: RoundStatus
  dueDate: string
  paidDate?: string
  reference?: string
  isMyPayout?: boolean
  payoutAmount?: number
}

export const CONTRIBUTION_HISTORY: HistoryEntry[] = [
  { id: 'h1', groupId: 'g1', groupName: 'Lagos Mainland Ajo', roundNumber: 7, amount: 20000, status: 'paid', dueDate: '1 Jul 2025', paidDate: '1 Jul 2025', reference: 'TCS0000724' },
  { id: 'h2', groupId: 'g2', groupName: "Surulere Women's Thrift", roundNumber: 6, amount: 15000, status: 'paid', dueDate: '5 Jul 2025', paidDate: '5 Jul 2025', reference: 'TCS0000605' },
  { id: 'h3', groupId: 'g1', groupName: 'Lagos Mainland Ajo', roundNumber: 6, amount: 20000, status: 'paid', dueDate: '1 Jun 2025', paidDate: '3 Jun 2025', reference: 'TCS0000618' },
  { id: 'h4', groupId: 'g2', groupName: "Surulere Women's Thrift", roundNumber: 5, amount: 15000, status: 'paid', dueDate: '5 Jun 2025', paidDate: '5 Jun 2025', reference: 'TCS0000518' },
  { id: 'h5', groupId: 'g1', groupName: 'Lagos Mainland Ajo', roundNumber: 5, amount: 20000, status: 'paid', dueDate: '1 May 2025', paidDate: '1 May 2025', reference: 'TCS0000502', isMyPayout: true, payoutAmount: 240000 },
  { id: 'h6', groupId: 'g2', groupName: "Surulere Women's Thrift", roundNumber: 2, amount: 15000, status: 'paid', dueDate: '5 Mar 2025', paidDate: '5 Mar 2025', reference: 'TCS0000237', isMyPayout: true, payoutAmount: 120000 },
  { id: 'h7', groupId: 'g1', groupName: 'Lagos Mainland Ajo', roundNumber: 4, amount: 20000, status: 'paid', dueDate: '1 Apr 2025', paidDate: '2 Apr 2025', reference: 'TCS0000445' },
  { id: 'h8', groupId: 'g2', groupName: "Surulere Women's Thrift", roundNumber: 4, amount: 15000, status: 'paid', dueDate: '5 May 2025', paidDate: '5 May 2025', reference: 'TCS0000402' },
  { id: 'h9', groupId: 'g1', groupName: 'Lagos Mainland Ajo', roundNumber: 3, amount: 20000, status: 'paid', dueDate: '1 Mar 2025', paidDate: '1 Mar 2025', reference: 'TCS0000391' },
  { id: 'h10', groupId: 'g3', groupName: 'Yaba Tech Thrift 2024', roundNumber: 3, amount: 10000, status: 'paid', dueDate: '1 Mar 2024', paidDate: '1 Mar 2024', reference: 'TCS0000030', isMyPayout: true, payoutAmount: 100000 },
]
