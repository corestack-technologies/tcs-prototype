import type { SourceReview } from './review.ts'
export type { InternalSession } from '../access/model.ts'
import type { InternalSession, AuthoritySnapshot } from '../access/model.ts'
import { requirePermission, authoritySnapshot, availableReviewers } from '../access/authorization.ts'
export function requireInternal(session:InternalSession|null):asserts session is InternalSession { requirePermission(session,'operations.case.view') }
export function triagePermission(action:TriageAction){return action.type==='source-view'?'operations.case.view':action.type==='note'?'operations.case.note':action.type==='status'&&action.status==='Escalated'?'operations.case.escalate':'operations.case.assign'}
export type CaseStatus = "New" | "Assigned" | "In Review" | "Awaiting Information" | "Awaiting External Action" | "Awaiting Approval" | "Escalated" | "Resolved" | "Closed"
export type Priority = "Normal" | "High" | "Critical"
export interface CaseEvent {
  at: string
  actor: string
  action: string
  reason?: string
  before?: string
  after?: string
  authority?: AuthoritySnapshot
  origin: "Source" | "Internal"
}
export interface Evidence {
  name: string
  detail?: string
  file?: File
}
export interface ContextField {
  label: string
  value: string
}
export interface OperationsCase {
  disputeProcesses?: import("../payouts/model.ts").PayoutDispute[]
  review?: SourceReview
  id: string
  reference: string
  type: string
  category: "Reviews" | "Financial Exceptions" | "Disputes / Escalations"
  module: "Clients" | "Organizations" | "Thrift" | "Payments"
  organizationId?: string
  organization?: string
  memberId?: string
  member?: string
  groupId?: string
  cycleId?: string
  roundId?: string
  referenceAt?: string
  amountMinor?: number
  reason: string
  createdAt: string
  sourceStatus: string
  status: CaseStatus
  priority: Priority
  assignee?: string
  related?: {
    paymentId?: string
    settlementId?: string
    payoutId?: string
    applicationId?: string
    lifecycleId?: string
    obligationId?: string
  }
  source: { id: string; label: string; kind: string }
  context: ContextField[]
  financial: ContextField[]
  evidence: Evidence[]
  timeline: CaseEvent[]
  policy: string
  nextAction: string
  resolvedAt?: string
}
export interface Triage {
  status?: CaseStatus
  priority?: Priority
  assignee?: string
  timeline: CaseEvent[]
}
export type TriageAction = { type: "assign"; assignee: string } | {
  type: "priority"
  priority: Priority
} | { type: "note"; text: string } | {
  type: "status"
  status: "In Review" | "Awaiting Information" | "Awaiting External Action" | "Awaiting Approval" | "Escalated"
  text: string
} | { type: "source-view" }
export const isResolved = (c: OperationsCase) =>
  c.status === "Resolved" || c.status === "Closed"
export const money = (minor: number) =>
  new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 2,
  }).format(minor / 100)
export const human = (value: string) => value.replace(/[-_]/g, " ")
export const caseClock = (c: OperationsCase, now: string) =>
  [now, c.referenceAt, c.createdAt]
    .filter((v): v is string => !!v)
    .sort((a, b) => Date.parse(a) - Date.parse(b))
    .at(-1)!
export function ageHours(c: OperationsCase, now: string) {
  return Math.max(
    0,
    (Date.parse(c.resolvedAt || caseClock(c, now)) - Date.parse(c.createdAt)) /
      3600000,
  )
}
export function ageLabel(c: OperationsCase, now: string) {
  const h = ageHours(c, now)
  return `${isResolved(c) ? "Duration" : "Open for"} ${
    h >= 24 ? Math.floor(h / 24) + " days" : Math.floor(h) + " hours"
  }`
}
export function applyTriage(
  c: OperationsCase,
  previous: Triage | undefined,
  action: TriageAction,
  session: InternalSession | null,
  at: string,
): Triage {
  requireInternal(session)
  requirePermission(session,triagePermission(action))
  if (!Number.isFinite(Date.parse(at)))
    throw Error("A valid timestamp is required.")
  if (isResolved(c) && action.type !== "source-view")
    throw Error("Resolved history is read-only.")
  const next: Triage = {
    ...previous,
    timeline: [...(previous?.timeline || [])],
  }
  let description = "",
    reason: string | undefined,
    before: string | undefined,
    after: string | undefined
  if (action.type === "assign") {
    if (
      action.assignee &&
      !availableReviewers(session).some((p) => p.id === action.assignee)
    )
      throw Error("Choose an active internal reviewer.")
    before = c.assignee || "Unassigned"
    after = action.assignee || "Unassigned"
    next.assignee = action.assignee
    if (c.status === "New" || c.status === "Assigned")
      next.status = action.assignee ? "Assigned" : "New"
    description = "Assignment changed"
  } else if (action.type === "priority") {
    if (!["Normal", "High", "Critical"].includes(action.priority))
      throw Error("Invalid priority.")
    before = c.priority
    after = action.priority
    next.priority = action.priority
    description = "Priority changed"
  } else if (action.type === "note") {
    if (!action.text.trim()) throw Error("Enter an internal note.")
    description = "Internal note"
    reason = action.text.trim()
  } else if (action.type === "status") {
    if (
      ![
        "In Review",
        "Awaiting Information",
        "Awaiting External Action",
        "Awaiting Approval",
        "Escalated",
      ].includes(action.status)
    )
      throw Error("Final decisions are outside Module 5A.")
    if (!action.text.trim())
      throw Error("Record the reason or information requested.")
    before = c.status
    after = action.status
    next.status = action.status
    description = "Triage status changed"
    reason = action.text.trim()
  } else description = "Viewed linked source record"
  if (before !== undefined && before === after) return next
  next.timeline.push({
    at,
    actor: authoritySnapshot(session).name,
    authority: authoritySnapshot(session),
    action: description,
    reason,
    before,
    after,
    origin: "Internal",
  })
  return next
}
export interface CaseFilters {
  view?: string
  search?: string
  status?: string
  priority?: string
  module?: string
  type?: string
  organizationId?: string
  assignment?: string
  olderThanHours?: number
}
export function filterCases(
  cases: OperationsCase[],
  f: CaseFilters,
  session: InternalSession | null,
  now: string,
) {
  requireInternal(session)
  return cases
    .filter((c) => {
      if (f.view === "History / Resolved" ? !isResolved(c) : isResolved(c))
        return false
      if (f.view === "My Queue" && c.assignee !== session.personaId)
        return false
      if (
        ["Reviews", "Financial Exceptions", "Disputes / Escalations"].includes(
          f.view || "",
        ) &&
        c.category !== f.view
      )
        return false
      if (
        (f.status && c.status !== f.status) ||
        (f.priority && c.priority !== f.priority) ||
        (f.module && c.module !== f.module) ||
        (f.type && c.type !== f.type) ||
        (f.organizationId && c.organizationId !== f.organizationId)
      )
        return false
      if (
        (f.assignment === "unassigned" && c.assignee) ||
        (f.assignment === "assigned" && !c.assignee)
      )
        return false
      if (f.olderThanHours && ageHours(c, now) < f.olderThanHours) return false
      return [
        c.reference,
        c.type,
        c.organization,
        c.member,
        c.reason,
        c.source.id,
      ]
        .join(" ")
        .toLowerCase()
        .includes((f.search || "").trim().toLowerCase())
    })
    .sort(
      (a, b) =>
        ({ Critical: 0, High: 1, Normal: 2 })[a.priority] -
          { Critical: 0, High: 1, Normal: 2 }[b.priority] ||
        a.createdAt.localeCompare(b.createdAt),
    )
}
