import {
  cycleOf,
  exampleFeeBoundary,
  type ThriftGroup,
} from "../groups/model.ts"
import type { Organization } from "../organizations/model.ts"
import { DIRECTORY } from "../groups/seeds.ts"
import { roundDemo } from "../rounds/seeds.ts"
import { advanceReference } from "../rounds/service.ts"
import { lifecycleTransition } from "./service.ts"
import { nextCycle, requestAmendment } from "./continuation.ts"
import { emptyLifecycle } from "./model.ts"
import { evaluateHandovers } from "./handover.ts"
export const LIFECYCLE_DEMOS = [
  "Withdrawal before commencement",
  "Early Exit requested",
  "Vacancy / settlement due",
  "Replacement awaiting consent",
  "Replacement regularized / handover",
  "Post-payout default / recovery",
  "Ready to complete",
  "Completed",
  "Completed with recovery",
  "Recovery cleared / review due",
  "Rollover / reconfirmation",
  "Start Fresh",
  "Amendment consent pending",
  "Force Close pending review",
  "Force Closed / retained liabilities",
  "Exit settlement resolved sample",
  "Organization payout breach",
  "Terminated history",
  "Organization exit settlement breach",
] as const
export type LifecycleDemo = typeof LIFECYCLE_DEMOS[number]
export function lifecycleDemo(
  org: Organization,
  id: string,
  scenario: LifecycleDemo,
): ThriftGroup {
  let g = roundDemo(
    org,
    id,
    exampleFeeBoundary(),
    "Monthly",
    scenario === "Withdrawal before commencement"
      ? "Upcoming"
      : "Collection ready · optional made",
  )
  g.lifecycle = emptyLifecycle()
  let c = cycleOf(g),
    at = c.active!.referenceAt
  const apply = (
    a: Parameters<typeof lifecycleTransition>[3],
    actor = org.ownerMemberId,
  ) => {
    g = lifecycleTransition(g, actor, org.ownerMemberId, a, at)
    c = cycleOf(g)
  }
  if (scenario === "Withdrawal before commencement") {
    apply({
      type: "withdraw",
      memberId: org.ownerMemberId,
      reason: "Plans changed before contributions open",
    })
    return g
  }
  if (
    [
      "Early Exit requested",
      "Vacancy / settlement due",
      "Replacement awaiting consent",
      "Replacement regularized / handover",
      "Organization exit settlement breach",
      "Exit settlement resolved sample",
    ].includes(scenario)
  ) {
    apply({
      type: "request-exit",
      memberId: org.ownerMemberId,
      reason: "Relocation before receiving a payout",
    })
    if (scenario !== "Early Exit requested")
      apply({ type: "approve-exit", id: g.lifecycle!.exits[0].id })
    if (scenario.startsWith("Replacement")) {
      const incoming = {
        ...DIRECTORY[4],
        equivalent: 2,
        status: "approved" as const,
        revision: 0,
        acceptances: [],
        reminderSent: false,
      }
      apply({ type: "replace", id: g.lifecycle!.exits[0].id, incoming })
      if (scenario === "Replacement regularized / handover") {
        apply(
          {
            type: "accept-replacement",
            id: g.lifecycle!.replacements[0].id,
            memberId: incoming.id,
          },
          incoming.id,
        )
        const r = g.lifecycle!.replacements[0]
        r.regularizationSatisfiedMinor = r.regularizationRequiredMinor
        r.demoFinancialState = true
        evaluateHandovers(g, at)
        g = advanceReference(g, r.effectiveAt!)
        c = cycleOf(g)
      }
    }
    if (scenario === "Exit settlement resolved sample") {
      g.lifecycle!.exits[0].settlement.status = "resolved"
    }
    if (scenario === "Organization exit settlement breach") {
      const e = g.lifecycle!.exits[0]
      e.settlement.dueAt = at
      e.settlement.escalatedAt = at
      g.lifecycle!.disputes.push({
        id: id + "-breach",
        cycleId: c.id,
        kind: "exit-settlement",
        exitId: e.id,
        status: "open",
        reason:
          "Seeded overdue Organization exit settlement, separate from Member default",
      })
    }
  } else if (scenario === "Amendment consent pending")
    g = requestAmendment(
      g,
      org,
      "Exceptional contribution correction proposed for Member consent",
      { ...c.terms, amount: 110000 },
      at,
    )
  else if (
    scenario === "Force Close pending review" ||
    scenario === "Force Closed / retained liabilities"
  ) {
    g.lifecycle!.payoutFacts = c.active!.rounds[0].beneficiaries.map((b) => ({
      cycleId: c.id,
      position: 1,
      memberId: b.memberId,
      status: "unpaid",
      entitlementMinor: b.entitlementMinor,
    }))
    apply({
      type: "force-close",
      reason: "Exceptional breakdown requires controlled TCS resolution",
      evidence: "DEMO-EVIDENCE-001",
      absorptionMinor: 0,
    })
    if (scenario === "Force Closed / retained liabilities") {
      c.status = "force-closed"
      c.active!.endedAt = at
      g.currentCycleId = null
      g.lifecycle!.forceCloseRequests[0].status = "approved-demo"
      g.lifecycle!.forceCloseRequests[0].evidenceReference =
        "SEEDED-TCS-APPROVAL-001"
      g.history.push({
        at,
        actor: "Seeded TCS approval",
        action:
          "Representative Force Closed outcome. Outstanding liabilities retained; Group not terminated.",
      })
    }
  } else {
    at = new Date(
      Date.parse(c.active!.rounds.at(-1)!.schedule.dueAt) + 1,
    ).toISOString()
    g = advanceReference(g, at)
    c = cycleOf(g)
    const recovery = [
      "Post-payout default / recovery",
      "Completed with recovery",
      "Recovery cleared / review due",
    ].includes(scenario)
    for (const o of c.active!.obligations)
      for (const component of o.components)
        component.requiredSatisfiedMinor =
          recovery &&
          o.memberId === org.ownerMemberId &&
          o.roundId !== c.active!.rounds[0].id
            ? 0
            : component.requiredMinor
    c.active!.resolvedRoundIds = c.active!.rounds.map((r) => r.id)
    g.lifecycle!.payoutFacts = c.active!.rounds.flatMap((r) =>
      r.beneficiaries.map((b) => ({
        cycleId: c.id,
        position: r.position,
        memberId: b.memberId,
        status: "received-demo" as const,
        entitlementMinor: b.entitlementMinor,
        at,
      })),
    )
    if (scenario === "Organization payout breach") {
      g.lifecycle!.payoutFacts[0].status = "breach-demo"
      g.lifecycle!.disputes.push({
        id: id + "-payout-breach",
        cycleId: c.id,
        kind: "organization-payout-breach",
        status: "open",
        reason:
          "Seeded payout non-payment formally recorded as an Organization breach; rotation outcome resolved into this independent case.",
      })
    }
    if (recovery) {
      const principal = c
        .active!.obligations.filter((o) => o.memberId === org.ownerMemberId)
        .reduce(
          (s, o) =>
            s +
            o.components.reduce(
              (n, p) => n + p.requiredMinor - p.requiredSatisfiedMinor,
              0,
            ),
          0,
        )
      g.lifecycle!.recoveries.push({
        id: id + "-recovery",
        cycleId: c.id,
        memberId: org.ownerMemberId,
        principalMinor: principal,
        penaltyMinor: 100000,
        recoveredMinor:
          scenario === "Recovery cleared / review due" ? principal + 100000 : 0,
        status:
          scenario === "Recovery cleared / review due"
            ? "awaiting-review"
            : "open",
        restricted: true,
        openedAt: at,
        reviewStatus: "pending",
        reason:
          "Seeded formal post-payout default; configurable threshold represented by this demo case",
        demoFinancialState: true,
      })
    }
    if (
      !["Post-payout default / recovery", "Ready to complete"].includes(
        scenario,
      )
    )
      apply({ type: "complete" })
    if (scenario === "Rollover / reconfirmation")
      g = nextCycle(g, org, "rollover", at)
    if (scenario === "Start Fresh") g = nextCycle(g, org, "fresh", at)
    if (scenario === "Terminated history")
      apply({
        type: "terminate",
        reason: "Arrangement concluded with all financial matters cleared",
      })
  }
  cycleOf(g).active &&
    (cycleOf(g).active!.demo =
      "Module 3C: " + scenario + " — seeded financial facts only")
  g.history.push({
    at,
    actor: "Prototype scenario",
    action:
      scenario +
      ". Financial satisfaction, payouts and case balances are labelled sample facts; no money moved.",
  })
  return g
}
