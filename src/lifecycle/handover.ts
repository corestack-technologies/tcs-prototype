import { cycleOf, type Cycle, type ThriftGroup } from "../groups/model.ts"
import { shareAmount, toMinor, type Round } from "../rounds/model.ts"
// Build an operational view without modifying the accepted activation snapshot.
export function effectiveCycle(
  group: ThriftGroup,
  cycle: Cycle,
  round: Round,
): Cycle {
  const c = structuredClone(cycle),
    l = group.lifecycle
  if (!c.snapshot || !l) return c
  for (const e of l.exits.filter(
    (e) =>
      e.cycleId === c.id &&
      e.kind === "early-exit" &&
      e.status === "approved" &&
      Date.parse(e.approvedAt!) < Date.parse(round.schedule.opensAt),
  )) {
    const replacement = l.replacements.find(
      (r) =>
        r.exitId === e.id &&
        r.effectiveAt &&
        Date.parse(r.effectiveAt) <= Date.parse(round.schedule.opensAt),
    )
    c.snapshot.positions.forEach((p) => {
      p.holders = p.holders.flatMap((h) =>
        h.memberId !== e.memberId
          ? [h]
          : replacement
            ? [{ ...h, memberId: replacement.incomingMemberId }]
            : [],
      )
    })
  }
  const ids = new Set(
    c.snapshot.positions.flatMap((p) => p.holders.map((h) => h.memberId)),
  )
  c.snapshot.participants = c.participants
    .filter((p) => ids.has(p.id))
    .map((p) => ({ ...p, status: "approved" }))
  return c
}
export function evaluateHandovers(group: ThriftGroup, at: string): void {
  const c = cycleOf(group)
  for (const r of group.lifecycle?.replacements || []) {
    if (r.cycleId !== c.id || !r.acceptance || r.effectiveAt) continue
    // Never reuse an already-generated Round, including when reference time equals opening.
    const next = c.active?.rounds.find(
      (round) =>
        Date.parse(round.schedule.opensAt) > Date.parse(at) &&
        !c.active!.obligations.some((o) => o.roundId === round.id),
    )
    if (!next) continue
    r.regularizationRequiredMinor = c
      .active!.rounds.filter((round) => round.number < next.number)
      .reduce(
        (sum, round) =>
          sum +
          r.positions.reduce(
            (s, p) =>
              s +
              (p.n === round.position
                ? 0
                : p.holders.reduce(
                    (v, h) =>
                      v + shareAmount(toMinor(r.terms.amount), h.fraction),
                    0,
                  )),
            0,
          ),
        0,
      )
    if (r.regularizationSatisfiedMinor >= r.regularizationRequiredMinor) {
      r.effectiveAt = next.schedule.opensAt
      r.status = "effective"
      group.history.push({
        at,
        actor: "TCS reference-time evaluation",
        action: `Replacement ${r.id} accepted and regularized; handover scheduled for Round ${next.number} (${r.effectiveAt}). Original obligations retained.`,
      })
    }
  }
}
