import {
  newGroup,
  cycleOf,
  transition,
  memberTerms,
  type FeeBoundary,
  type Frequency,
} from "../groups/model.ts"
import type { Organization } from "../organizations/model.ts"
import { DIRECTORY } from "../groups/seeds.ts"
import { advanceReference } from "./service.ts"
import { schedules } from "./schedule.ts"
export const ROUND_DEMOS = [
  "Upcoming",
  "Open",
  "Due",
  "Grace",
  "Late / partial",
  "Collection ready · optional skipped",
  "Collection ready · optional made",
  "Half recipients · prior history",
] as const
export type RoundDemo = typeof ROUND_DEMOS[number]
export function roundDemo(
  org: Organization,
  id: string,
  boundary: FeeBoundary,
  frequency: Frequency,
  scenario: RoundDemo,
  demoFee?: { feeEnabled: boolean; feeType: "flat" | "percentage"; feeValue: number },
) {
  let g = newGroup(org, id)
  const apply = (a: Parameters<typeof transition>[3]) => {
    g = transition(g, org, boundary, a)
  }
  apply({
    type: "terms",
    terms: {
      ...cycleOf(g).terms,
      ...demoFee,
      name: `${frequency} Circle · ${scenario}`,
      startDate: "2099-09-10",
      positions: 4,
      amount: 100000,
      defaultChargeEnabled: scenario === "Late / partial",
      allowSplit: true,
      multiplePositions: "max",
      maxPerMember: 2,
      frequency,
      contributionWindowDays: frequency === "Biweekly" ? 14 : 7,
      gracePeriodDays:
        frequency === "Daily" ? 0 : frequency === "Weekly" ? 1 : 2,
    },
  })
  const roster = [
    {
      ...DIRECTORY[0],
      id: org.ownerMemberId,
      name: "Organization Owner · participating Member",
    },
    ...DIRECTORY.slice(1, 4),
  ]
  for (const [i, member] of roster.entries()) {
    apply({ type: "recruit", member })
    apply({ type: "admit", id: member.id, equivalent: [2, 1, 0.5, 0.5][i] })
  }
  for (const [position, index, fraction] of [
    [1, 0, 1],
    [2, 1, 1],
    [3, 0, 1],
    [4, 2, 0.5],
    [4, 3, 0.5],
  ] as const)
    apply({ type: "assign", position, id: roster[index].id, fraction })
  apply({ type: "finalize" })
  for (const m of roster)
    apply({
      type: "accept",
      id: m.id,
      actorId: m.id,
      confirmed: true,
      reviewedTerms: memberTerms(cycleOf(g), m.id),
    })
  apply({ type: "activate", confirmed: true })
  const dates = schedules(cycleOf(g).snapshot!.terms),
    last = scenario === "Half recipients · prior history" ? 3 : 0,
    s = dates[last]
  let reference =
    scenario === "Upcoming"
      ? new Date(Date.parse(s.opensAt) - 1).toISOString()
      : scenario === "Due"
        ? s.dueDayStartsAt
        : scenario === "Grace"
          ? new Date(Date.parse(s.dueAt) + 1).toISOString()
          : scenario === "Late / partial"
            ? s.lateAt
            : s.opensAt
  if (frequency === "Daily" && scenario === "Grace") reference = s.lateAt
  g = advanceReference(g, reference)
  const c = cycleOf(g),
    active = c.active!
  active.demo =
    frequency === "Daily" && scenario === "Grace"
      ? "Daily has no grace; showing Late boundary"
      : scenario
  if (scenario === "Late / partial")
    active.contributionPolicy = {
      partial: "demo-only",
      advance: "unconfigured",
    }
  if (last)
    active.resolvedRoundIds = active.rounds.slice(0, last).map((r) => r.id)
  for (const o of active.obligations) {
    const round = active.rounds.find((r) => r.id === o.roundId)!
    for (const component of o.components) {
      if (
        round.number <= last ||
        scenario.startsWith("Collection ready") ||
        last
      )
        component.requiredSatisfiedMinor = component.requiredMinor
      else if (scenario === "Late / partial" && o.memberId === roster[0].id)
        component.requiredSatisfiedMinor = component.requiredMinor / 2
      if (scenario === "Collection ready · optional made")
        component.optionalSatisfiedMinor = component.optionalMinor
    }
  }
  g.history.push({
    at: reference,
    actor: "Prototype scenario",
    action: `Seeded obligation fulfillment: ${scenario}. No provider transaction or payout was performed.`,
  })
  return g
}
