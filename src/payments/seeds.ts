import {chooseOptional} from "./optional.ts"
﻿import type { Organization } from "../organizations/model.ts"
import { cycleOf, exampleFeeBoundary } from "../groups/model.ts"
import { roundDemo } from "../rounds/seeds.ts"
import { advanceReference } from "../rounds/service.ts"
import { balances } from "../rounds/model.ts"
import {
  startAttempt,
  confirmPayment,
  checkAttempt,
  advanceRound,
} from "./service.ts"
import { prototypeProvider } from "./provider.ts"
import type { DemoOutcome } from "./model.ts"
export const PAYMENT_DEMOS = [
  "Awaiting contribution",
  "Provider pending",
  "Exact contribution / settlement pending",
  "Failed attempt / retry",
  "Expired attempt / retry",
  "Partial contribution allowed",
  "Underpayment exception",
  "Overpayment exception",
  "Duplicate confirmation",
  "Required + optional included",
  "Optional contribution skipped / ready",
  "Half Position contribution",
  "Multiple Positions",
  "Optional-only recipient",
  "Advance held until opening",
  "Advance released on opening",
  "Settlement settled",
  "Settlement exception",
  "Timely success / delayed confirmation",
] as const
export type PaymentDemo = typeof PAYMENT_DEMOS[number]
export function paymentDemo(
  org: Organization,
  id: string,
  scenario: PaymentDemo,
) {
  let g = roundDemo(org, id, exampleFeeBoundary(), "Monthly", "Open"),
    c = cycleOf(g),
    at = c.active!.referenceAt
  g.name = "Contribution Circle · " + scenario
  c.terms.name = g.name
  c.snapshot!.terms.name = g.name
  c.active!.demo =
    "Module 4A · " + scenario + " · deterministic prototype provider records"
  if (scenario === "Partial contribution allowed")
    c.active!.contributionPolicy = {
      partial: "demo-only",
      advance: "unconfigured",
    }
  const pay = (
    memberId: string,
    includeOptional = false,
    outcome: DemoOutcome = "success",
    amountMinor?: number,
    roundId = c.active!.rounds[0].id,
    advance = false,
  ) => {
    g = startAttempt(
      g,
      org.id,
      org.form.name,
      memberId,
      { cycleId: c.id, roundId, includeOptional, amountMinor, advance },
      at,
      outcome,
    )
    c = cycleOf(g)
    const a = g.payments!.attempts.at(-1)!
    if (
      outcome === "pending" ||
      outcome === "failed" ||
      outcome === "expired"
    ) {
      g = checkAttempt([g], org.id, memberId, a.id, at)[0]
      if (outcome !== "pending")
        g = checkAttempt([g], org.id, memberId, a.id, at)[0]
    } else {
      const event = prototypeProvider.confirmation(a, outcome, at)!
      if (scenario === "Settlement settled") event.settlement = "settled"
      if (scenario === "Settlement exception") event.settlement = "exception"
      const received =
        scenario === "Timely success / delayed confirmation"
          ? new Date(
              Date.parse(c.active!.rounds[0].schedule.dueAt) + 300001,
            ).toISOString()
          : at
      g = confirmPayment([g], org.id, event, received)[0]
      if (scenario === "Duplicate confirmation")
        g = confirmPayment([g], org.id, event, received)[0]
    }
    c = cycleOf(g)
  }
  if (scenario === "Awaiting contribution") return g
  if (scenario === "Multiple Positions") {
    g = advanceReference(g, c.active!.rounds[1].schedule.opensAt)
    c = cycleOf(g)
    at = c.active!.referenceAt
    pay(org.ownerMemberId, false, "success", undefined, c.active!.rounds[1].id)
  } else if (scenario === "Optional-only recipient") {
    g = advanceReference(g, c.active!.rounds[1].schedule.opensAt)
    c = cycleOf(g)
    at = c.active!.referenceAt
    pay("c2", true, "success", undefined, c.active!.rounds[1].id)
  } else if (scenario.startsWith("Advance")) {
    c.active!.contributionPolicy = {
      partial: "unconfigured",
      advance: "demo-only",
    }
    pay(org.ownerMemberId)
    const round = advanceRound(g, c.id, org.ownerMemberId)!
    pay(org.ownerMemberId, false, "success", undefined, round.id, true)
    if (scenario === "Advance released on opening")
      g = advanceReference(g, round.schedule.opensAt)
  } else if (scenario === "Optional contribution skipped / ready") {
    for (const o of [...c.active!.obligations])
      if (balances(o).outstanding) pay(o.memberId)
  } else if (scenario === "Timely success / delayed confirmation") {
    at = new Date(
      Date.parse(c.active!.rounds[0].schedule.dueAt) - 120000,
    ).toISOString()
    pay(org.ownerMemberId)
    g = advanceReference(
      g,
      new Date(
        Date.parse(c.active!.rounds[0].schedule.dueAt) + 300001,
      ).toISOString(),
    )
  } else
    pay(
      scenario === "Half Position contribution" ? "c3" : org.ownerMemberId,
      scenario === "Required + optional included",
      scenario === "Provider pending"
        ? "pending"
        : scenario === "Failed attempt / retry"
          ? "failed"
          : scenario === "Expired attempt / retry"
            ? "expired"
            : scenario === "Underpayment exception"
              ? "underpayment"
              : scenario === "Overpayment exception"
                ? "overpayment"
                : "success",
      scenario === "Partial contribution allowed" ? 4000000 : undefined,
    )
  if (scenario === "Optional contribution skipped / ready") g = chooseOptional(g,org.id,org.ownerMemberId,c.id,c.active!.rounds[0].id,"skip",at)
  return g
}
