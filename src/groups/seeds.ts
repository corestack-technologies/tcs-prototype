import {
  newGroup,
  cycleOf,
  transition,
  memberTerms,
  type ThriftGroup,
  type FeeBoundary,
  type Participant,
} from "./model.ts"
import type { Organization } from "../organizations/model.ts"
export const DIRECTORY: Omit<Participant, "status" | "equivalent" | "revision" | "acceptances" | "reminderSent">[] =
  [
    ["c1", "Chukwuemeka Osei", "CO", "c.osei@email.ng"],
    ["c2", "Ngozi Adeyemi", "NA", "ngozi.a@gmail.com"],
    ["c3", "Babajide Lawson", "BL", "b.lawson@zenith.com"],
    ["c4", "Fatima Aliyu", "FA", "f.aliyu@outlook.com"],
    ["c5", "Samuel Ojo", "SO", "s.ojo@gmail.com"],
    ["c6", "Amaka Eze", "AE", "amaka.e@company.ng"],
    ["c7", "Tunde Adewale", "TA", "t.adewale@corp.ng"],
    ["c8", "Chisom Okafor", "CO", "chisom.o@gmail.com"],
  ].map(([id, name, initials, email], i) => ({
    id,
    name,
    initials,
    email,
    verified: true,
    source: "invitation",
    groupsCompleted: i % 4,
    onTimeRate: 90 + i,
  }))
export const SCENARIOS = [
  "New draft",
  "Recruitment in progress",
  "Positions incomplete",
  "Commitments pending",
  "Reconfirmation required",
  "Ready for activation",
  "Activated · no financial activity",
  "Cancelled",
] as const
export type GroupScenario = typeof SCENARIOS[number]
export function seedGroup(
  org: Organization,
  id: string,
  scenario: GroupScenario,
  boundary: FeeBoundary,
): ThriftGroup {
  let g = newGroup(org, id)
  if (scenario === "New draft") return g
  const apply = (action: Parameters<typeof transition>[3]) => {
    g = transition(g, org, boundary, action)
  }
  const start = new Date()
  start.setDate(start.getDate() + 14)
  apply({
    type: "terms",
    terms: {
      ...cycleOf(g).terms,
      name: `Premium Monthly Circle · ${scenario}`,
      positions: 3,
      dailyPenaltyRateBps: 5,
      allowSplit: true,
      multiplePositions: "max",
      maxPerMember: 2,
      startDate: start.toISOString().slice(0, 10),
      visibility: "Public",
    },
  })
  for (const member of DIRECTORY.slice(0, 4)) apply({ type: "recruit", member })
  if (scenario === "Recruitment in progress") {
    apply({ type: "admit", id: "c1", equivalent: 1 })
    return g
  }
  for (const [i, equivalent] of [1, 1, 0.5, 0.5].entries())
    apply({ type: "admit", id: `c${i + 1}`, equivalent })
  apply({ type: "assign", id: "c1", position: 1, fraction: 1 })
  apply({ type: "assign", id: "c2", position: 2, fraction: 1 })
  apply({ type: "assign", id: "c3", position: 3, fraction: 0.5 })
  if (scenario === "Positions incomplete") return g
  apply({ type: "assign", id: "c4", position: 3, fraction: 0.5 })
  apply({ type: "finalize" })
  if (scenario === "Commitments pending") return g
  for (const p of cycleOf(g).participants)
    apply({
      type: "accept",
      id: p.id,
      actorId: p.id,
      confirmed: true,
      reviewedTerms: memberTerms(cycleOf(g), p.id),
    })
  if (scenario === "Reconfirmation required") {
    apply({ type: "terms", terms: { ...cycleOf(g).terms, amount: 60000 } })
    return g
  }
  if (
    scenario === "Activated · no financial activity" ||
    scenario === "Cancelled"
  )
    apply({ type: "activate", confirmed: true })
  if (scenario === "Cancelled")
    apply({
      type: "cancel",
      confirmed: true,
      reason:
        "Members requested a different start date before financial commencement.",
    })
  return g
}
