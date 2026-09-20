export interface RestrictionRecord {
  id: string
  targetId: string
  target: 'Member' | 'Organization'
  type: 'new-activity' | 'suspension' | 'post-payout-default'
  sourceCaseId: string
  reason: string
  startedAt: string
  authority: string
  scope: string
  reviewStatus: 'active' | 'released'
  releasedAt?: string
  releasedBy?: string
  removalReason?: string
}
export interface EvidenceRequest {
  id: string
  party: 'Member' | 'Organization'
  requested: string
  at: string
  deadline: string
  responses: { at: string; actor: string; statement: string; evidence: string[] }[]
  missedAt?: string
}
export interface DisputeResolution {
  id: string
  at: string
  reviewerId: string
  outcome: 'member-upheld' | 'organization-accepted' | 'partial-receipt'
  receivedMinor: number
  reason: string
  evidence: string[]
  phase: 'initial' | 'appeal' | 'exceptional'
}
export interface DisputeProcess {
  policy: { source: 'prototype-policy'; evidenceHours: number; appealHours: number; decideOnAvailableEvidence: boolean }
  requests: EvidenceRequest[]
  resolutions: DisputeResolution[]
  appeal?: { at: string; actor: string; party: 'Member' | 'Organization'; reason: string; evidence: string[]; outcomeId?: string; reviewerId?: string; finalizedAt?: string }
  appealDeadline?: string
  finalizedAt?: string
  reopenings: { at: string; actor: string; reason: string; previousFinalizedAt: string }[]
  stage: 'investigation' | 'appeal-available' | 'appeal-pending' | 'final' | 'exceptionally-reopened'
}
export const demoDisputePolicy = { source: 'prototype-policy' as const, evidenceHours: 72, appealHours: 168, decideOnAvailableEvidence: true }
export const newDisputeProcess = (): DisputeProcess => ({ policy: { ...demoDisputePolicy }, requests: [], resolutions: [], reopenings: [], stage: 'investigation' })
export const activeRestrictions = (value: { restrictions?: RestrictionRecord[] }) => (value.restrictions || []).filter(r => r.reviewStatus === 'active')
export const restrictionScope = 'New commitments only; existing contributions, payouts, recovery, disputes and essential account actions remain available.'
