import type { PenaltyLedger } from '../penalties/model.ts'
import { validatePenaltyRate, PROTOTYPE_DAILY_PENALTY_CEILING_BPS } from '../penalties/policy.ts'
import { businessClock } from '../settings/service.ts'
import type {ManualContribution, FinancePolicy} from "../reconciliation/model.ts"
import type {PayoutState} from '../payouts/model.ts'
import type {PaymentRecords} from '../payments/model.ts'
import type {GroupLifecycle} from '../lifecycle/model.ts'
import type { ActiveCycle } from '../rounds/model.ts'
﻿import type { Organization } from "../organizations/model.ts"
export type Visibility = "Private" | "Invite Only" | "Public"
export type Frequency = "Daily" | "Weekly" | "Biweekly" | "Monthly"
export type FeeType = "flat" | "percentage"
export interface Draft {
  name: string
  description: string
  currency: "NGN"
  visibility: Visibility
  amount: number
  frequency: Frequency
  positions: number
  startDate: string
  contributionOpenDay: number
  gracePeriodDays: number
  timezone: string
  contributionWindowDays: number
  allowSplit: boolean
  splitParts: number
  multiplePositions: "none" | "max" | "unlimited"
  maxPerMember: number
  feeEnabled: boolean
  feeType: FeeType
  feeValue: number
  dailyPenaltyRateBps?: number
  defaultChargeEnabled: boolean
  defaultChargeType: FeeType
  defaultChargeValue: number
  defaultChargeCapEnabled: boolean
  defaultChargeCap: number
  defaultChargeWaivable: boolean
  recipientPolicy: "optional"
  rules: string
  notesToMembers: string
}
export const BASE_RULES = `Contributions follow the agreed schedule. Partial receipts do not settle an outstanding obligation.
Your own contribution in your payout Round is optional: skipping it creates no lateness, default or penalty.
Only full (1.0) and half (0.5) positions are supported. Payout order must be finalized before activation.
The Organization fee applies at payout, based on Scheduled Payout Value, not on the actual collected pot.
Material draft changes require affected Members to reconfirm. After activation participation is protected; departure requires an approved lifecycle.
Withdrawal, Early Exit and disputes follow TCS rules. An Owner cannot self-approve a beneficial exception.`
export const defaultDraft = (): Draft => ({
  name: "",
  description: "",
  currency: "NGN",
  visibility: "Private",
  amount: 50000,
  frequency: "Monthly",
  positions: 12,
  startDate: "",
  contributionOpenDay: 20,
  gracePeriodDays: 2,
  timezone: "Africa/Lagos",
  contributionWindowDays: 7,
  allowSplit: false,
  splitParts: 2,
  multiplePositions: "none",
  maxPerMember: 2,
  feeEnabled: true,
  feeType: "percentage",
  feeValue: 2,
  dailyPenaltyRateBps: 0,
  defaultChargeEnabled: false,
  defaultChargeType: "percentage",
  defaultChargeValue: 5,
  defaultChargeCapEnabled: false,
  defaultChargeCap: 5000,
  defaultChargeWaivable: true,
  recipientPolicy: "optional",
  rules: BASE_RULES,
  notesToMembers: "",
})
export interface FeeBoundary {
  maxPercentage: number
  maxFlat: number
}
// Example commercial configuration, stored per Organization demo world; not a product-wide rate.
export const exampleFeeBoundary = (): FeeBoundary => ({
  maxPercentage: 10,
  maxFlat: 100000,
})
export type Fraction = 1 | 0.5
export interface Position {
  n: number
  holders: { memberId: string ; fraction: Fraction }[]
}
export interface Acceptance {
  at: string
  actorId: string
  terms: string
  revision: number
}
export interface Participant {
  id: string
  name: string
  initials: string
  email: string
  verified: boolean
  groupsCompleted: number
  onTimeRate: number
  source: "invitation" | "public-request"
  status: "pending" | "approved" | "rejected"
  equivalent: number
  revision: number
  acceptances: Acceptance[]
  reminderSent: boolean
}
export interface Cycle {
  active?: ActiveCycle
  completedAt?: string
  continuation?: {mode:"rollover"|"fresh";fromCycleId:string;reconfirmationDeadline:string;referenceAt?:string}
  activationHistory?: {at:string;snapshot:NonNullable<Cycle["snapshot"]>}[]
  id: string
  number: number
  status: "draft" | "activated" | "cancelled" | "completed" | "completed-with-recovery" | "force-closed"
  terms: Draft
  participants: Participant[]
  positions: Position[]
  orderFinalized: boolean
  financial: {
    obligations: number
    payments: number
    allocations: number
    payouts: number
    postings: number
  }
  activatedAt?: string
  cancelledAt?: string
  cancellationReason?: string
  snapshot?: { penaltyCeilingBps?: number; terms: Draft ; participants: Participant[] ; positions: Position[] }
}
export interface ThriftGroup {
  penalties?: PenaltyLedger
  manualContributions?: ManualContribution[]
  manualPolicy?: FinancePolicy
  reconciliationBlockers?: number
  commercialCommencementRestricted?: boolean
  payouts?:PayoutState
  payments?:PaymentRecords
  lifecycle?: GroupLifecycle
  id: string
  organizationId: string
  name: string
  description: string
  visibility: Visibility
  currentCycleId: string | null
  cycles: Cycle[]
  history: { at: string ; action: string ; actor: string }[]
}
export const cycleOf = (g: ThriftGroup) => g.cycles[g.cycles.length - 1]
const now = () => new Date().toISOString()
function assert(ok: unknown, message: string): asserts ok {
  if (!ok) throw new Error(message)
}
export function newGroup(org: Organization, id: string): ThriftGroup {
  assert(
    ["approved", "active"].includes(org.status),
    "An approved, unrestricted Organization is required.",
  )
  return {
    id,
    organizationId: org.id,
    name: "Untitled Group",
    description: "",
    visibility: "Private",
    currentCycleId: null,
    cycles: [
      {
        id: `${id}-cycle-1`,
        number: 1,
        status: "draft",
        terms: defaultDraft(),
        participants: [],
        positions: Array.from({ length: 12 }, (_, i) => ({
          n: i + 1,
          holders: [],
        })),
        orderFinalized: false,
        financial: {
          obligations: 0,
          payments: 0,
          allocations: 0,
          payouts: 0,
          postings: 0,
        },
      },
    ],
    history: [
      {
        at: now(),
        action: "Group and first draft Cycle created",
        actor: org.ownerMemberId,
      },
    ],
  }
}
export const admitted = (c: Cycle) =>
  c.participants.filter((p) => p.status === "approved")
export const reserved = (c: Cycle) =>
  admitted(c).reduce((s, p) => s + p.equivalent, 0)
export const assigned = (c: Cycle, id: string) =>
  c.positions.flatMap((p) =>
    p.holders
      .filter((h) => h.memberId === id)
      .map((h) => ({ position: p.n, fraction: h.fraction })),
  )
export const memberLimit = (t: Draft) =>
  t.multiplePositions === "none"
    ? 1
    : t.multiplePositions === "max"
      ? Math.min(t.maxPerMember, t.positions)
      : t.positions
export function memberTerms(c: Cycle, id: string): string {
  const { name: _name, description: _description, ...terms } = c.terms
  return JSON.stringify({
    terms,
    equivalent: c.participants.find((p) => p.id === id)?.equivalent,
    positions: assigned(c, id),
  })
}
export const accepted = (c: Cycle, p: Participant) =>
  p.status === "approved" &&
  p.acceptances.some(
    (a) => a.revision === p.revision && a.terms === memberTerms(c, p.id),
  )
export const reconfirmation = (c: Cycle, p: Participant) =>
  p.acceptances.length > 0 && !accepted(c, p)
export function configurationErrors(t: Draft, boundary: FeeBoundary): string[] {
  const errors: string[] = []
  if (!t.name.trim()) errors.push("Enter a Group name.")
  if (!Number.isFinite(t.amount) || t.amount <= 0)
    errors.push("Contribution amount must be positive.")
  if (!Number.isInteger(t.positions) || t.positions < 2 || t.positions > 100)
    errors.push("Choose 2 to 100 positions for this prototype.")
  if (!["Daily", "Weekly", "Biweekly", "Monthly"].includes(t.frequency))
    errors.push("Choose a supported frequency.")
  if (!["Private", "Invite Only", "Public"].includes(t.visibility))
    errors.push("Choose a visibility mode.")
  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(t.startDate) ||
    !Number.isFinite(Date.parse(t.startDate)) ||
    new Date(t.startDate).toISOString().slice(0, 10) !== t.startDate ||
    t.startDate < businessClock().businessDate
  )
    errors.push("Choose a valid planned start date today or later.")
  if (t.splitParts !== 2 || t.recipientPolicy !== "optional")
    errors.push(
      "Only halves are supported; recipient own-Round contributions remain optional.",
    )
  if (
    !["none", "max", "unlimited"].includes(t.multiplePositions) ||
    !Number.isFinite(memberLimit(t)) ||
    memberLimit(t) < 1
  )
    errors.push("Choose a valid multiple-position limit.")
  if (
    !t.feeEnabled ||
    !Number.isFinite(t.feeValue) ||
    t.feeValue <= 0 ||
    t.feeValue >
      (t.feeType === "percentage" ? boundary.maxPercentage : boundary.maxFlat)
  )
    errors.push(
      "A positive Organization fee within this demo configuration is required.",
    )
  if (feePerPosition(t) >= t.amount * t.positions)
    errors.push("Organization fee must be below Scheduled Payout Value.")
  if (
    !Number.isFinite(t.gracePeriodDays) ||
    t.gracePeriodDays < 0 ||
    !Number.isInteger(t.gracePeriodDays) ||
    t.contributionOpenDay < 1 ||
    t.contributionOpenDay > 28 ||
    !Number.isInteger(t.contributionOpenDay) ||
    t.contributionWindowDays < 1 ||
    !Number.isInteger(t.contributionWindowDays)
  )
    errors.push("Review the contribution window and grace settings.")
  try { validatePenaltyRate(t.dailyPenaltyRateBps ?? 0) } catch (error) { errors.push((error as Error).message) }
  if (!t.rules.trim()) errors.push("Group rules are required.")
  return errors
}
export const feePerPosition = (t: Draft) =>
  t.feeType === "flat"
    ? t.feeValue
    : (t.amount * t.positions * t.feeValue) / 100
export function allocationValid(c: Cycle, complete = false): boolean {
  if (
    c.positions.length !== c.terms.positions ||
    new Set(c.positions.map((p) => p.n)).size !== c.positions.length
  )
    return false
  return (
    c.positions.every(
      (p) =>
        p.n >= 1 &&
        p.n <= c.terms.positions &&
        new Set(p.holders.map((h) => h.memberId)).size === p.holders.length &&
        p.holders.every(
          (h) =>
            [1, 0.5].includes(h.fraction) &&
            (c.terms.allowSplit || h.fraction === 1) &&
            admitted(c).some((m) => m.id === h.memberId),
        ) &&
        p.holders.reduce((s, h) => s + h.fraction, 0) <= 1 &&
        (!complete || p.holders.reduce((s, h) => s + h.fraction, 0) === 1),
    ) &&
    admitted(c).every(
      (m) =>
        m.verified &&
        m.equivalent > 0 &&
        m.equivalent * 2 === Math.floor(m.equivalent * 2) &&
        (c.terms.allowSplit || Number.isInteger(m.equivalent)) &&
        m.equivalent <= memberLimit(c.terms) &&
        assigned(c, m.id).reduce((s, h) => s + h.fraction, 0) <= m.equivalent &&
        (!complete ||
          assigned(c, m.id).reduce((s, h) => s + h.fraction, 0) ===
            m.equivalent),
    ) &&
    reserved(c) <= c.terms.positions
  )
}
export interface ReadinessCheck {
  id: string
  label: string
  description: string
  status: "pass" | "fail"
  required: boolean
  detail: string
  action: string
  actionView: "owner-group-setup" | "owner-group-recruit" | "owner-group-positions" | "owner-group-rules" | "owner-settings" | "org-activation"
}
export function readiness(
  g: ThriftGroup,
  org: Organization,
  boundary: FeeBoundary,
): ReadinessCheck[] {
  const c = cycleOf(g),
    errors = configurationErrors(c.terms, boundary),
    members = admitted(c),
    confirmed = members.filter((p) => accepted(c, p)),
    reconfirm = members.filter((p) => reconfirmation(c, p))
  const rows: [string, string, boolean, string, ReadinessCheck["actionView"]][] =
    [
      [
        "organization",
        "Organization eligible",
        g.organizationId === org.id &&
          org.status === "active" &&
          !org.commercialRestricted &&
          !org.restrictions?.some(r=>r.reviewStatus==='active') &&
          !!org.settlement &&
          org.settlement.confirmation === "owner-confirmed",
        `${org.form.name}: ${org.commercialRestricted ? "New activation restricted by unpaid TCS revenue share" : org.status}. An active Organization and confirmed settlement account are required.`,
        org.status === "approved" || !org.settlement
          ? "org-activation"
          : "owner-settings",
      ],
      [
        "configuration",
        "Group and Cycle setup complete",
        !errors.length,
        errors.join(" ") ||
          "Contribution terms, positive fee and Group rules are valid.",
        "owner-group-setup",
      ],
      [
        "capacity",
        "Position capacity fully reserved",
        members.length > 0 && reserved(c) === c.terms.positions,
        `${reserved(c)} of ${c.terms.positions} equivalent positions reserved by ${members.length} Members.`,
        "owner-group-recruit",
      ],
      [
        "allocation",
        "All positions valid and fully assigned",
        allocationValid(c, true),
        "Each payout position must total 1.0 and match admitted Member commitments.",
        "owner-group-positions",
      ],
      [
        "acceptance",
        "Member commitments and rules accepted",
        members.length > 0 && confirmed.length === members.length,
        `${confirmed.length} of ${members.length} accepted; ${reconfirm.length} require reconfirmation.`,
        "owner-group-rules",
      ],
      [
        "order",
        "Payout order finalized",
        c.orderFinalized && allocationValid(c, true),
        "Finalize the complete proposed payout order before activation.",
        "owner-group-positions",
      ],
      [
        "lifecycle",
        "Draft available for activation",
        c.status === "draft" && !financiallyCommenced(c),
        `Cycle ${c.number}: ${c.status}. Activation creates no financial obligations.`,
        "owner-group-setup",
      ],
    ]
  return rows.map(([id, label, pass, detail, actionView]) => ({
    id,
    label,
    description: detail,
    status: pass ? "pass" : "fail",
    required: true,
    detail,
    action: "Review",
    actionView,
  }))
}
export const financiallyCommenced = (c: Cycle) =>
  Object.values(c.financial).some((n) => n !== 0)
export type Action = { type: "terms" ; terms: Draft } | {
  type: "recruit"
  member: Omit<Participant, "status" | "equivalent" | "revision" | "acceptances" | "reminderSent">
} | { type: "admit" ; id: string ; equivalent: number } | {
  type: "remove" | "readd" | "remind"
  id: string
} | { type: "assign" ; position: number ; id: string ; fraction: Fraction } | {
  type: "unassign"
  position: number
  id: string
} | { type: "finalize" } | {
  type: "accept"
  id: string
  actorId: string
  confirmed: boolean
  reviewedTerms: string
} | { type: "activate" ; confirmed: boolean } | {
  type: "cancel"
  confirmed: boolean
  reason: string
}
export function transition(
  group: ThriftGroup,
  org: Organization,
  boundary: FeeBoundary,
  action: Action,
): ThriftGroup {
  assert(
    group.organizationId === org.id,
    "This Group belongs to another Organization.",
  )
  if(group.lifecycle?.termination)throw Error("This Group is terminated or pending termination review.")
  const g = structuredClone(group),
    c = cycleOf(g),
    prior = new Map(c.participants.map((p) => [p.id, memberTerms(c, p.id)]))
  if (action.type === "cancel") {
    assert(
      ["draft", "activated"].includes(c.status) && !financiallyCommenced(c),
      "Normal cancellation is unavailable after financial commencement or cancellation.",
    )
    assert(
      !["closed", "suspended"].includes(org.status),
      "This Organization cannot perform normal management actions.",
    )
    assert(
      action.confirmed && action.reason.trim().length >= 5,
      "Confirm cancellation and give a meaningful reason.",
    )
    c.status = "cancelled"
    c.cancelledAt = now()
    c.cancellationReason = action.reason.trim()
  } else {
    assert(
      c.status === "draft",
      "Activated and cancelled Cycle records are protected.",
    )
    assert(
      ["approved", "active"].includes(org.status),
      "This Organization cannot prepare new activity.",
    )
    if (action.type === "terms") {
      assert(
        Number.isInteger(action.terms.positions) &&
          action.terms.positions >= 2 &&
          action.terms.positions <= 100,
        "Use 2 to 100 positions in this prototype.",
      )
      assert(
        action.terms.splitParts === 2 &&
          action.terms.recipientPolicy === "optional",
        "Only halves and optional recipient contributions are supported.",
      )
      assert(
        !c.positions.some(
          (p) => p.n > action.terms.positions && p.holders.length,
        ),
        "Unassign affected positions before reducing capacity.",
      )
      validatePenaltyRate(action.terms.dailyPenaltyRateBps ?? 0)
      c.terms = structuredClone(action.terms)
      c.positions = Array.from(
        { length: c.terms.positions },
        (_, i) =>
          c.positions.find((p) => p.n === i + 1) || { n: i + 1, holders: [] },
      )
      assert(
        allocationValid(c),
        "Remove or adjust existing commitments/assignments before changing this position policy or capacity.",
      )
      g.name = c.terms.name || "Untitled Group"
      g.description = c.terms.description
      g.visibility = c.terms.visibility
    } else if (action.type === "recruit") {
      assert(
        action.member.verified,
        "Only verified demo Members may request participation.",
      )
      assert(
        action.member.source !== "public-request" || g.visibility === "Public",
        "Public requests are available only to public/discoverable Groups.",
      )
      assert(
        !c.participants.some((p) => p.id === action.member.id),
        "This Member is already listed. Use re-add for a removed Member.",
      )
      c.participants.push({
        ...action.member,
        status: "pending",
        equivalent: 0,
        revision: 0,
        acceptances: [],
        reminderSent: false,
      })
    } else if (action.type === "admit") {
      const p = c.participants.find((p) => p.id === action.id)
      assert(p && p.status !== "rejected", "Select an available Member.")
      p.status = "approved"
      p.equivalent = action.equivalent
      assert(
        allocationValid(c),
        "This commitment exceeds capacity, the Member limit or the full/half position policy.",
      )
    } else if (
      action.type === "remove" ||
      action.type === "readd" ||
      action.type === "remind"
    ) {
      const p = c.participants.find((p) => p.id === action.id)
      assert(p, "Member not found.")
      if (action.type === "remind") p.reminderSent = true
      else {
        p.status = action.type === "remove" ? "rejected" : "pending"
        p.equivalent = 0
        p.revision++
        c.positions.forEach(
          (pos) =>
            (pos.holders = pos.holders.filter((h) => h.memberId !== p.id)),
        )
        c.orderFinalized = false
      }
    } else if (action.type === "assign" || action.type === "unassign") {
      const p = c.positions.find((p) => p.n === action.position)
      assert(p, "Position not found.")
      if (action.type === "assign")
        p.holders.push({ memberId: action.id, fraction: action.fraction })
      else p.holders = p.holders.filter((h) => h.memberId !== action.id)
      assert(
        allocationValid(c),
        "Assignment exceeds a position, Member commitment or split policy.",
      )
      c.orderFinalized = false
    } else if (action.type === "finalize") {
      assert(
        allocationValid(c, true),
        "Complete every position before finalizing order.",
      )
      c.orderFinalized = true
    } else if (action.type === "accept") {
      const p = c.participants.find((p) => p.id === action.id)
      assert(
        p &&
          p.status === "approved" &&
          p.id === action.actorId &&
          action.confirmed,
        "The participating Member must explicitly accept.",
      )
      assert(
        assigned(c, p.id).reduce((s, h) => s + h.fraction, 0) ===
          p.equivalent && p.equivalent > 0,
        "Assign all of this Member’s positions before acceptance.",
      )
      assert(
        !configurationErrors(c.terms, boundary).length,
        "Complete valid terms before Member acceptance.",
      )
      assert(
        action.reviewedTerms === memberTerms(c, p.id),
        "Terms changed while being reviewed. Review them again.",
      )
      p.acceptances.push({
        at: now(),
        actorId: p.id,
        terms: action.reviewedTerms,
        revision: p.revision,
      })
      p.reminderSent = false
    } else if (action.type === "activate") {
      assert(action.confirmed, "Confirm activation.")
      assert(
        readiness(g, org, boundary).every((r) => r.status === "pass"),
        "Resolve every readiness blocker before activation.",
      )
      c.snapshot = structuredClone({
        penaltyCeilingBps: PROTOTYPE_DAILY_PENALTY_CEILING_BPS,
        terms: c.terms,
        participants: c.participants,
        positions: c.positions,
      })
      c.status = "activated"
      c.activatedAt = now()
      g.currentCycleId = c.id
    }
  }
  for (const p of c.participants)
    if (prior.has(p.id) && prior.get(p.id) !== memberTerms(c, p.id)) {
      p.revision++
      p.reminderSent = false
    }
  if (
    action.type === "terms" &&
    cycleOf(group).terms.positions !== c.terms.positions
  )
    c.orderFinalized = false
  g.history.push({
    at: now(),
    action:
      action.type === "cancel"
        ? `Cycle cancelled: ${action.reason.trim()}`
        : action.type === "terms"
          ? "Updated draft terms"
          : action.type === "recruit"
            ? `Recruited ${action.member.name} via ${action.member.source}`
            : "id" in action
              ? `${action.type}: ${c.participants.find((p) => p.id === action.id)?.name || action.id}${
                  "position" in action ? " · position " + action.position : ""
                }`
              : action.type,
    actor: action.type === "accept" ? action.actorId : org.ownerMemberId,
  })
  return g
}
