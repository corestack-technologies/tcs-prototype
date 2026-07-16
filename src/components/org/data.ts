// ── TCS Organization / Owner workspace sample data ────────────────────────────

export type OrgStatus = 'active' | 'suspended' | 'pending'
export type JoinRequestStatus = 'pending' | 'approved' | 'declined'
export type VerificationStatus = 'pending' | 'verified' | 'rejected'
export type PayoutStatus = 'in-progress' | 'ready' | 'dispatched' | 'upcoming'

export interface OrgGroup {
  id: string
  name: string
  emoji: string
  color: string
  status: 'active' | 'completed' | 'paused'
  members: number
  maxMembers: number
  amount: number
  frequency: 'Weekly' | 'Biweekly' | 'Monthly'
  cycleStart: string
  cycleEnd: string
  totalRounds: number
  currentRound: number
  paidThisRound: number
  pendingThisRound: number
  nextPayoutDate: string
  nextPayoutRecipient: string
  nextPayoutAmount: number
  description: string
  rules: string[]
}

export interface JoinRequest {
  id: string
  name: string
  initials: string
  groupId: string
  groupName: string
  requestedAt: string
  occupation: string
  employer: string
  referredBy: string | null
  status: JoinRequestStatus
}

export interface VerificationItem {
  id: string
  memberName: string
  memberInitials: string
  groupId: string
  groupName: string
  roundNumber: number
  amount: number
  submittedAt: string
  reference: string
  note: string
  status: VerificationStatus
}

export interface PayoutItem {
  id: string
  recipientName: string
  recipientInitials: string
  groupId: string
  groupName: string
  roundNumber: number
  payoutAmount: number
  dueDate: string
  contributionsPaid: number
  contributionsTotal: number
  status: PayoutStatus
}

export interface ActivityItem {
  id: string
  type: 'join_request' | 'contribution' | 'payout' | 'member_approved' | 'member_declined' | 'cycle_started' | 'group_created'
  message: string
  time: string
}

export interface CycleMember {
  name: string
  initials: string
  position: number
  status: 'paid' | 'pending' | 'overdue'
  isPayoutRecipient?: boolean
}

export interface ActiveCycle {
  groupId: string
  groupName: string
  emoji: string
  cycleNumber: number
  currentRound: number
  totalRounds: number
  startDate: string
  endDate: string
  membersCount: number
  totalContributed: number
  nextRoundDue: string
  amount: number
  members: CycleMember[]
}

// ── Organization ───────────────────────────────────────────────────────────────

export const ORGANIZATION = {
  id: 'org1',
  name: 'Adaeze Thrift Network',
  tagline: 'Building wealth, one contribution at a time',
  description: 'A trusted community savings organization serving professionals and families across Lagos. We operate with full transparency, digital records, and a commitment to financial empowerment.',
  type: 'Community Savings Group',
  location: 'Lagos Island, Lagos State',
  status: 'active' as OrgStatus,
  owner: { name: 'Adaeze Okonkwo', initials: 'AO', email: 'adaeze@tcs.ng', phone: '+234 801 234 5678' },
  createdAt: 'January 2025',
  memberCount: 20,
  groupCount: 2,
  totalCyclesCompleted: 1,
  totalDisbursed: 7200000,
}

// ── Owner groups ───────────────────────────────────────────────────────────────

export const OWNER_GROUPS: OrgGroup[] = [
  {
    id: 'og1',
    name: 'Victoria Island Professional Circle',
    emoji: '🏛',
    color: '#1746A2',
    status: 'active',
    members: 12,
    maxMembers: 12,
    amount: 50000,
    frequency: 'Monthly',
    cycleStart: 'Jan 2025',
    cycleEnd: 'Dec 2025',
    totalRounds: 12,
    currentRound: 7,
    paidThisRound: 9,
    pendingThisRound: 3,
    nextPayoutDate: '1 Aug 2025',
    nextPayoutRecipient: 'Chukwuemeka Osei',
    nextPayoutAmount: 600000,
    description: 'A monthly savings circle for professionals in Victoria Island and Ikoyi. Contributions are made on the 1st of each month.',
    rules: [
      'Contributions must be made on or before the 1st of each month.',
      'Late contributions attract a ₦2,000 administrative charge.',
      'Members must provide advance notice of at least 5 days for schedule changes.',
      'Payout recipients must confirm receipt within 24 hours.',
      'A member may not leave the group mid-cycle without a replacement.',
    ],
  },
  {
    id: 'og2',
    name: 'Lekki Savings Club',
    emoji: '🌊',
    color: '#059669',
    status: 'active',
    members: 8,
    maxMembers: 10,
    amount: 25000,
    frequency: 'Monthly',
    cycleStart: 'Mar 2025',
    cycleEnd: 'Oct 2025',
    totalRounds: 8,
    currentRound: 5,
    paidThisRound: 6,
    pendingThisRound: 2,
    nextPayoutDate: '5 Aug 2025',
    nextPayoutRecipient: 'Funmi Adesanya',
    nextPayoutAmount: 200000,
    description: 'A growing savings club for Lekki residents and entrepreneurs. Open for up to 10 members.',
    rules: [
      'Contributions due on the 5th of each month.',
      'Three consecutive missed contributions result in removal.',
      'New members must be referred by an existing member.',
      'Payout position is determined by lottery before cycle start.',
    ],
  },
]

export const getOwnerGroup = (id?: string): OrgGroup =>
  OWNER_GROUPS.find(g => g.id === id) ?? OWNER_GROUPS[0]

// ── Join requests ──────────────────────────────────────────────────────────────

export const JOIN_REQUESTS: JoinRequest[] = [
  { id: 'jr1', name: 'Olumide Bakare', initials: 'OB', groupId: 'og1', groupName: 'Victoria Island Professional Circle', requestedAt: '28 Jul 2025', occupation: 'Software Engineer', employer: 'MTN Nigeria', referredBy: 'Tunde Lawal', status: 'pending' },
  { id: 'jr2', name: 'Chiamaka Nze', initials: 'CN', groupId: 'og2', groupName: 'Lekki Savings Club', requestedAt: '27 Jul 2025', occupation: 'Pharmacist', employer: 'HealthPlus Nigeria', referredBy: null, status: 'pending' },
  { id: 'jr3', name: 'Rotimi Ajayi', initials: 'RA', groupId: 'og1', groupName: 'Victoria Island Professional Circle', requestedAt: '25 Jul 2025', occupation: 'Chartered Accountant', employer: 'KPMG Nigeria', referredBy: 'Grace Fasanya', status: 'pending' },
]

// ── Verification queue ─────────────────────────────────────────────────────────

export const VERIFICATION_QUEUE: VerificationItem[] = [
  { id: 'vq1', memberName: 'Emeka Okafor', memberInitials: 'EO', groupId: 'og1', groupName: 'Victoria Island Professional Circle', roundNumber: 7, amount: 50000, submittedAt: '1 Aug 2025, 9:14 AM', reference: 'GTB/2025/08/00234567', note: '', status: 'pending' },
  { id: 'vq2', memberName: 'Halima Ibrahim', memberInitials: 'HI', groupId: 'og1', groupName: 'Victoria Island Professional Circle', roundNumber: 7, amount: 50000, submittedAt: '1 Aug 2025, 10:41 AM', reference: 'ZNB/TXN/2025/0012834', note: 'Transferred from my Zenith savings account', status: 'pending' },
  { id: 'vq3', memberName: 'Tobi Mensah', memberInitials: 'TM', groupId: 'og2', groupName: 'Lekki Savings Club', roundNumber: 5, amount: 25000, submittedAt: '31 Jul 2025, 4:22 PM', reference: 'FBN/TXN/2025/07/0098432', note: '', status: 'pending' },
]

// ── Upcoming payouts ───────────────────────────────────────────────────────────

export const UPCOMING_PAYOUTS: PayoutItem[] = [
  { id: 'up1', recipientName: 'Chukwuemeka Osei', recipientInitials: 'CO', groupId: 'og1', groupName: 'Victoria Island Professional Circle', roundNumber: 7, payoutAmount: 600000, dueDate: '1 Aug 2025', contributionsPaid: 9, contributionsTotal: 12, status: 'in-progress' },
  { id: 'up2', recipientName: 'Funmi Adesanya', recipientInitials: 'FA', groupId: 'og2', groupName: 'Lekki Savings Club', roundNumber: 5, payoutAmount: 200000, dueDate: '5 Aug 2025', contributionsPaid: 6, contributionsTotal: 8, status: 'in-progress' },
  { id: 'up3', recipientName: 'James Adeyemi', recipientInitials: 'JA', groupId: 'og1', groupName: 'Victoria Island Professional Circle', roundNumber: 8, payoutAmount: 600000, dueDate: '1 Sep 2025', contributionsPaid: 0, contributionsTotal: 12, status: 'upcoming' },
]

// ── Active cycles ──────────────────────────────────────────────────────────────

export const ACTIVE_CYCLES: ActiveCycle[] = [
  {
    groupId: 'og1',
    groupName: 'Victoria Island Professional Circle',
    emoji: '🏛',
    cycleNumber: 1,
    currentRound: 7,
    totalRounds: 12,
    startDate: 'Jan 2025',
    endDate: 'Dec 2025',
    membersCount: 12,
    totalContributed: 4200000,
    nextRoundDue: '1 Aug 2025',
    amount: 50000,
    members: [
      { name: 'Chioma Obi', initials: 'CO2', position: 1, status: 'paid' },
      { name: 'Babatunde Oke', initials: 'BO', position: 2, status: 'paid' },
      { name: 'Fatimah Kano', initials: 'FK', position: 3, status: 'paid' },
      { name: 'Sunday Eze', initials: 'SE', position: 4, status: 'paid' },
      { name: 'Adaeze Okonkwo', initials: 'AO', position: 5, status: 'paid' },
      { name: 'Maryam Nwobi', initials: 'MN', position: 6, status: 'paid' },
      { name: 'Tunde Lawal', initials: 'TL', position: 7, status: 'paid', isPayoutRecipient: true },
      { name: 'Chukwuemeka Osei', initials: 'CO', position: 8, status: 'pending' },
      { name: 'Emeka Okafor', initials: 'EO', position: 9, status: 'paid' },
      { name: 'Halima Ibrahim', initials: 'HI', position: 10, status: 'paid' },
      { name: 'Grace Fasanya', initials: 'GF', position: 11, status: 'pending' },
      { name: 'James Adeyemi', initials: 'JA', position: 12, status: 'pending' },
    ],
  },
  {
    groupId: 'og2',
    groupName: 'Lekki Savings Club',
    emoji: '🌊',
    cycleNumber: 1,
    currentRound: 5,
    totalRounds: 8,
    startDate: 'Mar 2025',
    endDate: 'Oct 2025',
    membersCount: 8,
    totalContributed: 800000,
    nextRoundDue: '5 Aug 2025',
    amount: 25000,
    members: [
      { name: 'Funmi Adeyemi', initials: 'FA2', position: 1, status: 'paid' },
      { name: 'Adaeze Okonkwo', initials: 'AO', position: 2, status: 'paid' },
      { name: 'Chisom Nwachukwu', initials: 'CN', position: 3, status: 'paid' },
      { name: 'Bukola James', initials: 'BJ', position: 4, status: 'paid' },
      { name: 'Funmi Adesanya', initials: 'FA', position: 5, status: 'paid', isPayoutRecipient: true },
      { name: 'Tobi Mensah', initials: 'TM', position: 6, status: 'pending' },
      { name: 'Amaka Kelechi', initials: 'AK', position: 7, status: 'paid' },
      { name: 'Shade Kolawole', initials: 'SK', position: 8, status: 'pending' },
    ],
  },
]

// ── Collection operations ──────────────────────────────────────────────────────

export type ContribStatus = 'paid' | 'partial' | 'outstanding' | 'overdue' | 'settled-by-policy'
export type CollectionPeriodStatus = 'open' | 'grace-period' | 'complete' | 'overdue'

export interface CollectionMember {
  id: string; name: string; initials: string
  obligation: number; amountPaid: number
  status: ContribStatus
  confirmedAt?: string; providerRef?: string
  defaultCharge?: number; note?: string
}

export interface CollectionPeriod {
  id: string; groupId: string; groupName: string; emoji: string
  roundNumber: number; totalRounds: number
  openDate: string; normalDeadline: string; gracePeriodEnd: string
  expectedPrincipal: number; confirmedPrincipal: number; outstandingPrincipal: number
  completionPct: number; status: CollectionPeriodStatus
  members: CollectionMember[]
  recentPayments: { memberName: string; memberInitials: string; amount: number; confirmedAt: string; providerRef: string }[]
  completionDate?: string; readyForPayoutDate?: string; defaultChargesTotal?: number
}

export const COLLECTION_PERIODS: CollectionPeriod[] = [
  {
    id: 'cp1', groupId: 'og1', groupName: 'Victoria Island Professional Circle', emoji: '🏛',
    roundNumber: 8, totalRounds: 12,
    openDate: '15 Jul 2025', normalDeadline: '31 Jul 2025', gracePeriodEnd: '5 Aug 2025',
    expectedPrincipal: 600000, confirmedPrincipal: 430000, outstandingPrincipal: 170000,
    completionPct: 72, status: 'open',
    members: [
      { id: 'm1', name: 'Chioma Obi', initials: 'CO', obligation: 50000, amountPaid: 50000, status: 'paid', confirmedAt: '17 Jul 2025, 9:04 AM', providerRef: 'GTB/2025/07/001234' },
      { id: 'm2', name: 'Babatunde Oke', initials: 'BO', obligation: 50000, amountPaid: 50000, status: 'paid', confirmedAt: '18 Jul 2025, 10:21 AM', providerRef: 'UBA/2025/07/009871' },
      { id: 'm3', name: 'Fatimah Kano', initials: 'FK', obligation: 50000, amountPaid: 50000, status: 'paid', confirmedAt: '19 Jul 2025, 2:14 PM', providerRef: 'ZNB/2025/07/003456' },
      { id: 'm4', name: 'Sunday Eze', initials: 'SE', obligation: 50000, amountPaid: 50000, status: 'paid', confirmedAt: '20 Jul 2025, 8:55 AM', providerRef: 'FBN/2025/07/007788' },
      { id: 'm5', name: 'Adaeze Okonkwo', initials: 'AO', obligation: 50000, amountPaid: 30000, status: 'partial', confirmedAt: '22 Jul 2025, 4:30 PM', providerRef: 'GTB/2025/07/005566', note: 'First partial payment' },
      { id: 'm6', name: 'Maryam Nwobi', initials: 'MN', obligation: 50000, amountPaid: 50000, status: 'paid', confirmedAt: '20 Jul 2025, 11:02 AM', providerRef: 'ACC/2025/07/002233' },
      { id: 'm7', name: 'Tunde Lawal', initials: 'TL', obligation: 50000, amountPaid: 50000, status: 'paid', confirmedAt: '21 Jul 2025, 9:45 AM', providerRef: 'GTB/2025/07/008899' },
      { id: 'm8', name: 'Chukwuemeka Osei', initials: 'CO2', obligation: 50000, amountPaid: 0, status: 'outstanding' },
      { id: 'm9', name: 'Emeka Okafor', initials: 'EO', obligation: 50000, amountPaid: 50000, status: 'paid', confirmedAt: '23 Jul 2025, 3:17 PM', providerRef: 'ZNB/2025/07/001199' },
      { id: 'm10', name: 'Halima Ibrahim', initials: 'HI', obligation: 50000, amountPaid: 50000, status: 'paid', confirmedAt: '22 Jul 2025, 1:08 PM', providerRef: 'GTB/2025/07/004455' },
      { id: 'm11', name: 'Grace Fasanya', initials: 'GF', obligation: 50000, amountPaid: 0, status: 'outstanding' },
      { id: 'm12', name: 'James Adeyemi', initials: 'JA', obligation: 50000, amountPaid: 50000, status: 'paid', confirmedAt: '25 Jul 2025, 10:30 AM', providerRef: 'UBA/2025/07/006677' },
    ],
    recentPayments: [
      { memberName: 'James Adeyemi', memberInitials: 'JA', amount: 50000, confirmedAt: '25 Jul 2025, 10:30 AM', providerRef: 'UBA/2025/07/006677' },
      { memberName: 'Emeka Okafor', memberInitials: 'EO', amount: 50000, confirmedAt: '23 Jul 2025, 3:17 PM', providerRef: 'ZNB/2025/07/001199' },
      { memberName: 'Adaeze Okonkwo', memberInitials: 'AO', amount: 30000, confirmedAt: '22 Jul 2025, 4:30 PM', providerRef: 'GTB/2025/07/005566' },
      { memberName: 'Halima Ibrahim', memberInitials: 'HI', amount: 50000, confirmedAt: '22 Jul 2025, 1:08 PM', providerRef: 'GTB/2025/07/004455' },
      { memberName: 'Tunde Lawal', memberInitials: 'TL', amount: 50000, confirmedAt: '21 Jul 2025, 9:45 AM', providerRef: 'GTB/2025/07/008899' },
    ],
  },
  {
    id: 'cp2', groupId: 'og2', groupName: 'Lekki Savings Club', emoji: '🌊',
    roundNumber: 6, totalRounds: 8,
    openDate: '20 Jul 2025', normalDeadline: '5 Aug 2025', gracePeriodEnd: '9 Aug 2025',
    expectedPrincipal: 200000, confirmedPrincipal: 175000, outstandingPrincipal: 25000,
    completionPct: 88, status: 'open',
    members: [
      { id: 'n1', name: 'Funmi Adeyemi', initials: 'FA2', obligation: 25000, amountPaid: 25000, status: 'paid', confirmedAt: '22 Jul 2025, 8:44 AM', providerRef: 'GTB/2025/07/010011' },
      { id: 'n2', name: 'Adaeze Okonkwo', initials: 'AO', obligation: 25000, amountPaid: 25000, status: 'paid', confirmedAt: '23 Jul 2025, 9:00 AM', providerRef: 'GTB/2025/07/012233' },
      { id: 'n3', name: 'Chisom Nwachukwu', initials: 'CN', obligation: 25000, amountPaid: 25000, status: 'paid', confirmedAt: '21 Jul 2025, 11:30 AM', providerRef: 'FBN/2025/07/009944' },
      { id: 'n4', name: 'Bukola James', initials: 'BJ', obligation: 25000, amountPaid: 25000, status: 'paid', confirmedAt: '20 Jul 2025, 2:55 PM', providerRef: 'UBA/2025/07/005588' },
      { id: 'n5', name: 'Funmi Adesanya', initials: 'FA', obligation: 25000, amountPaid: 25000, status: 'paid', confirmedAt: '20 Jul 2025, 4:12 PM', providerRef: 'ACC/2025/07/003322' },
      { id: 'n6', name: 'Tobi Mensah', initials: 'TM', obligation: 25000, amountPaid: 25000, status: 'paid', confirmedAt: '24 Jul 2025, 3:05 PM', providerRef: 'ZNB/2025/07/007766' },
      { id: 'n7', name: 'Amaka Kelechi', initials: 'AK', obligation: 25000, amountPaid: 25000, status: 'paid', confirmedAt: '24 Jul 2025, 5:19 PM', providerRef: 'GTB/2025/07/014455' },
      { id: 'n8', name: 'Shade Kolawole', initials: 'SK', obligation: 25000, amountPaid: 0, status: 'outstanding' },
    ],
    recentPayments: [
      { memberName: 'Amaka Kelechi', memberInitials: 'AK', amount: 25000, confirmedAt: '24 Jul 2025, 5:19 PM', providerRef: 'GTB/2025/07/014455' },
      { memberName: 'Tobi Mensah', memberInitials: 'TM', amount: 25000, confirmedAt: '24 Jul 2025, 3:05 PM', providerRef: 'ZNB/2025/07/007766' },
      { memberName: 'Adaeze Okonkwo', memberInitials: 'AO', amount: 25000, confirmedAt: '23 Jul 2025, 9:00 AM', providerRef: 'GTB/2025/07/012233' },
    ],
  },
]

export const COLLECTION_HISTORY: CollectionPeriod[] = [
  {
    id: 'ch1', groupId: 'og1', groupName: 'Victoria Island Professional Circle', emoji: '🏛',
    roundNumber: 7, totalRounds: 12,
    openDate: '15 Jun 2025', normalDeadline: '30 Jun 2025', gracePeriodEnd: '5 Jul 2025',
    expectedPrincipal: 600000, confirmedPrincipal: 600000, outstandingPrincipal: 0,
    completionPct: 100, status: 'complete',
    completionDate: '28 Jun 2025', readyForPayoutDate: '29 Jun 2025', defaultChargesTotal: 0,
    members: [], recentPayments: [],
  },
  {
    id: 'ch2', groupId: 'og2', groupName: 'Lekki Savings Club', emoji: '🌊',
    roundNumber: 5, totalRounds: 8,
    openDate: '20 Jun 2025', normalDeadline: '5 Jul 2025', gracePeriodEnd: '9 Jul 2025',
    expectedPrincipal: 200000, confirmedPrincipal: 200000, outstandingPrincipal: 0,
    completionPct: 100, status: 'complete',
    completionDate: '4 Jul 2025', readyForPayoutDate: '5 Jul 2025', defaultChargesTotal: 0,
    members: [], recentPayments: [],
  },
  {
    id: 'ch3', groupId: 'og1', groupName: 'Victoria Island Professional Circle', emoji: '🏛',
    roundNumber: 6, totalRounds: 12,
    openDate: '15 May 2025', normalDeadline: '31 May 2025', gracePeriodEnd: '5 Jun 2025',
    expectedPrincipal: 600000, confirmedPrincipal: 550000, outstandingPrincipal: 50000,
    completionPct: 92, status: 'complete',
    completionDate: '6 Jun 2025', readyForPayoutDate: '7 Jun 2025', defaultChargesTotal: 2000,
    members: [], recentPayments: [],
  },
]

// ── Recent activity ────────────────────────────────────────────────────────────

export const RECENT_ACTIVITY: ActivityItem[] = [
  { id: 'a1', type: 'join_request', message: 'Olumide Bakare requested to join Victoria Island Professional Circle', time: '2 hours ago' },
  { id: 'a2', type: 'contribution', message: 'Halima Ibrahim completed her contribution for Round 7', time: '3 hours ago' },
  { id: 'a3', type: 'contribution', message: 'Emeka Okafor completed his contribution for Round 7', time: '5 hours ago' },
  { id: 'a4', type: 'join_request', message: 'Chiamaka Nze requested to join Lekki Savings Club', time: '1 day ago' },
  { id: 'a5', type: 'payout', message: 'Payout recorded as sent to Tunde Lawal — ₦600,000 (Round 6, VI Professional Circle)', time: '2 days ago' },
  { id: 'a6', type: 'member_approved', message: 'Tobi Mensah approved and added to Lekki Savings Club', time: '3 days ago' },
  { id: 'a7', type: 'contribution', message: 'All 8 members confirmed for Lekki Savings Club Round 4', time: '5 days ago' },
]
