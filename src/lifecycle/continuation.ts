import { recoveryBalances } from './recovery.ts'
import { syncRecoveryRecords } from '../operations/restrictions.ts'
import { effectiveCycle } from "./handover.ts"
import { toMinor } from "../rounds/model.ts"
import {
  cycleOf,
  defaultDraft,
  type ThriftGroup,
  type Cycle,
} from "../groups/model.ts"
import type { Organization } from "../organizations/model.ts"
import { emptyLifecycle } from "./model.ts"
export function nextCycle(
  group: ThriftGroup,
  org: Organization,
  mode: "rollover" | "fresh",
  at: string,
  reconfirmationDays = 7,
): ThriftGroup {
  if (group.organizationId !== org.id || (org.status !== "active" || org.restrictions?.some(r=>r.reviewStatus==='active')))
    throw Error("An active owning Organization is required.")
  if (group.lifecycle?.termination && group.lifecycle.termination.status !== "rejected")
    throw Error(
      "Continuation is unavailable while termination is pending or effective.",
    )
  const previous = cycleOf(group)
  if (!["completed", "completed-with-recovery"].includes(previous.status))
    throw Error("Complete the current Cycle before choosing continuation.")
  if (
    !Number.isInteger(reconfirmationDays) ||
    reconfirmationDays < 1 ||
    reconfirmationDays > 90
  )
    throw Error("Choose a demo reconfirmation window from 1 to 90 days.")
  const g = structuredClone(group),
    number = previous.number + 1
  const terms =
    mode === "rollover"
      ? structuredClone(previous.snapshot?.terms || previous.terms)
      : {
          ...defaultDraft(),
          name: group.name,
          description: group.description,
          visibility: group.visibility,
        }
  terms.startDate = ""
  const exited = new Set(
    (group.lifecycle?.exits || [])
      .filter((e) => e.cycleId === previous.id && e.kind === "early-exit" && e.status === "approved")
      .map((e) => e.memberId),
  )
  const participants =
    mode === "rollover"
      ? structuredClone(
          previous.participants.filter(
            (p) => p.status === "approved" && !exited.has(p.id),
          ),
        ).map((p) => ({
          ...p,
          acceptances: [],
          revision: 0,
          reminderSent: false,
        }))
      : []
  const lastRound = previous.active?.rounds[previous.active.rounds.length - 1]
  const operational = lastRound
    ? effectiveCycle(group, previous, lastRound)
    : previous
  const positions =
    mode === "rollover"
      ? structuredClone(
          operational.snapshot?.positions || previous.positions,
        ).map((p) => ({
          ...p,
          holders: p.holders.filter((h) =>
            participants.some((m) => m.id === h.memberId),
          ),
        }))
      : Array.from({ length: terms.positions }, (_, i) => ({
          n: i + 1,
          holders: [],
        }))
  const deadline = new Date(
    Date.parse(at) + reconfirmationDays * 86400000,
  ).toISOString()
  const cycle: Cycle = {
    id: `${g.id}-cycle-${number}`,
    number,
    status: "draft",
    terms,
    participants,
    positions,
    orderFinalized: false,
    financial: {
      obligations: 0,
      payments: 0,
      allocations: 0,
      payouts: 0,
      postings: 0,
    },
    continuation: {
      mode,
      fromCycleId: previous.id,
      reconfirmationDeadline: deadline,
      referenceAt: at,
    },
  }
  g.cycles.push(cycle)
  g.currentCycleId = null
  g.history.push({
    at,
    actor: org.ownerMemberId,
    action: `${
      mode === "rollover" ? "Rollover" : "Start Fresh"
    } created Cycle ${number}; prior Cycle retained; every Member must reconfirm by ${deadline}.`,
  })
  return g
}
export function resolveRecovery(
  group: ThriftGroup,
  org: Organization,
  id: string,
  at: string,
): ThriftGroup {
  if (group.organizationId !== org.id)
    throw Error("This case belongs to another Organization.")
  const g = structuredClone(group),
    r = g.lifecycle?.recoveries.find((r) => r.id === id)
  if (!r || r.status === "resolved")
    throw Error("Select an unresolved recovery case.")
  if (!recoveryBalances(r).cleared)
    throw Error(
      "Outstanding recovery must be cleared before Organization review can resolve it. No recovery payments are processed here.",
    )
  r.status = "resolved"
  r.reviewStatus = "reviewed"
  r.restricted = false
  r.resolvedAt = at
  r.resolvedBy = org.ownerMemberId
  syncRecoveryRecords(g)
  g.history.push({
    at,
    actor: org.ownerMemberId,
    action: `Recovery ${id} reviewed and resolved. Historical default and Cycle completion date retained.`,
  })
  return g
}
export function requestAmendment(
  group: ThriftGroup,
  org: Organization,
  reason: string,
  proposedTerms: Cycle["terms"],
  at: string,
): ThriftGroup {
  if (group.organizationId !== org.id)
    throw Error("This Group belongs to another Organization.")
  const g = structuredClone(group),
    c = cycleOf(g)
  if (c.status !== "activated" || !c.financial.obligations)
    throw Error(
      "Use preparation for draft changes. Amendment requests apply after financial commencement.",
    )
  toMinor(proposedTerms.amount)
  if (proposedTerms.amount <= 0)
    throw Error("Proposed contribution must be positive.")
  if (reason.trim().length < 10)
    throw Error("Explain the exceptional change and its reason.")
  if (JSON.stringify(c.terms) === JSON.stringify(proposedTerms))
    throw Error("Describe a material proposed change.")
  g.lifecycle ??= emptyLifecycle()
  g.lifecycle.amendments.push({
    id: `${c.id}-amendment-${g.lifecycle.amendments.length + 1}`,
    cycleId: c.id,
    reason: reason.trim(),
    requestedAt: at,
    currentTerms: structuredClone(c.terms),
    proposedTerms: structuredClone(proposedTerms),
    affectedMemberIds: c.participants
      .filter((p) => p.status === "approved")
      .map((p) => p.id),
    consents: [],
    status: "awaiting-consent",
  })
  g.history.push({
    at,
    actor: org.ownerMemberId,
    action:
      "Exceptional Cycle Amendment requested. Current terms remain unchanged; Member consent and TCS review are required.",
  })
  return g
}
