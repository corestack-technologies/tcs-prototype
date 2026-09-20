import {releaseAdvance} from '../payments/service.ts'
import {effectiveCycle,evaluateHandovers} from '../lifecycle/handover.ts'
﻿import { cycleOf, type ThriftGroup } from "../groups/model.ts"
import {
  generateRounds,
  generateObligations,
  type ActiveCycle,
} from "./model.ts"
import { schedules } from "./schedule.ts"
// Reference time is monotonic for a real record: inspecting an earlier time cannot undo commencement.
export function advanceReference(
  group: ThriftGroup,
  referenceAt: string,
  initializeOnly = false,
): ThriftGroup {
  if (!Number.isFinite(Date.parse(referenceAt)))
    throw Error("Choose a valid reference time.")
  const g = structuredClone(group),
    c = cycleOf(g)
  if (c.status !== "activated" || !c.snapshot) return g
  const prior = c.active
  if (prior && Date.parse(referenceAt) < Date.parse(prior.referenceAt))
    throw Error(
      "Reference time cannot move backwards for this record. Add a separate demo to inspect an earlier state.",
    )
  const rounds =
    prior?.rounds || generateRounds(g.id, c, schedules(c.snapshot.terms))
  const active: ActiveCycle = prior || {
    generatedAt: referenceAt,
    referenceAt,
    penaltyEnabled: (c.snapshot.terms.dailyPenaltyRateBps ?? 0) > 0 || c.snapshot.terms.defaultChargeEnabled,
    rounds,
    obligations: [],
    resolvedRoundIds: [],
    contributionPolicy: { partial: "unconfigured", advance: "unconfigured" },
  }
  if(initializeOnly){if(prior)throw Error('Cycle is already initialized.');active.timeSource='ENVIRONMENT';c.active=active;return g}
  active.referenceAt = referenceAt
  active.generatedRoundIds??=[...new Set(active.obligations.map(o=>o.roundId))]
  const opened = rounds.filter(
    (r) =>
      Date.parse(r.schedule.opensAt) <= Date.parse(referenceAt) &&
      !active.generatedRoundIds!.includes(r.id),
  )
  if (opened.length && !c.financial.obligations && g.commercialCommencementRestricted) throw Error("Unpaid TCS share restricts new financial commencement. Existing active contributions and payouts continue.")
  if (opened.length) {
    for(const round of opened){
      const effective=effectiveCycle(g,c,round)
      const holders=effective.snapshot!.positions.find(p=>p.n===round.position)!.holders
      round.beneficiaries=holders.map(h=>({...h,entitlementMinor:round.scheduledPayoutValueMinor*h.fraction}))
      active.obligations.push(...generateObligations(g.id,effective,[round]))
    }
    active.generatedRoundIds.push(...opened.map(r=>r.id))
    c.financial.obligations = active.obligations.length
    g.history.push({
      at: referenceAt,
      actor: "TCS · reference-time evaluation",
      action: `Generated obligations for Round${
        opened.length > 1 ? "s" : ""
      } ${opened.map((r) => r.number).join(", ")}`,
    })
  }
  c.active = active
  evaluateHandovers(g,referenceAt)
  releaseAdvance(g,referenceAt)
  return g
}
