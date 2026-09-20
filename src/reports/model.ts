import type { ThriftGroup } from '../groups/model.ts'
import type { ReconciliationState } from '../reconciliation/model.ts'

export type Audience = 'member' | 'organization' | 'internal'
export type ReportActor = { kind: 'member'; memberId: string } | { kind: 'organization'; memberId: string; organizationId: string }
export interface ReportOrganization {
  id: string
  name: string
  ownerMemberId: string
  workspace: boolean
}
export interface ReportSources {
  organizations: ReportOrganization[]
  worlds: { groups: ThriftGroup[]; finance?: ReconciliationState }[]
}
export interface ReportColumn {
  key: string
  label: string
  type: 'text' | 'money' | 'number' | 'date'
  total?: boolean
}
export interface ReportDefinition {
  id: string
  name: string
  category: string
  audience: Audience
  permission?: string
  domain?: string
  sourceDescription?: string
  availability?: 'Available' | 'Planned / Awaiting Source Module'
  visibility: string
  description: string
  dateBasis: string
  filters: string[]
  columns: ReportColumn[]
}
export type Cell = string | number | null
export interface ReportRow {
  id: string
  organizationId: string
  groupId: string
  cycleId: string
  roundId: string
  memberId: string
  date: string
  values: Record<string, Cell>
  detail: Record<string, Cell>
  source: { kind: string; id: string }
}
export interface ReportFilters {
 businessDate?: string
 failedOnly?: string
  metric?: string
  organizationId?: string
  groupId?: string
  cycleId?: string
  roundId?: string
  memberId?: string
  type?: string
  assignee?: string
  priority?: string
  module?: string
  team?: string
  age?: string
  actor?: string
  target?: string
  result?: string
  privileged?: string
  frequency?: string
  status?: string
  position?: string
  from?: string
  to?: string
  search?: string
  sort?: 'newest' | 'oldest' | 'outstanding' | 'member' | 'position'
}
export interface ReportResult {
  definition: ReportDefinition
  rows: ReportRow[]
  summaries: { key: string; label: string; value: number; type: ReportColumn['type'] }[]
  filters: ReportFilters
  options: Record<string, { value: string; label: string }[]>
  generatedAt: string
  actor?: string
  references: string[]
  notices: string[]
  empty: string
  export: { version: 1; currency: 'NGN'; moneyUnit: 'minor'; reportId: string; columns: ReportColumn[]; filters: ReportFilters }
}
