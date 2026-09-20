import { PenaltyLedgerPanel, type WaivePenalty } from '../penalties/PenaltyLedgerPanel'
import { effectiveReferenceAt } from '../rounds/model'
import {effectiveCycle} from '../lifecycle/handover'
﻿import { useState } from "react"
import { Badge, Alert } from "../components/ui"
import { OrganizationBrand } from "../organizations/OrganizationBrand"
import type { Organization } from "../organizations/model"
import type { Cycle, ThriftGroup } from "../groups/model"
import { BASE_RULES } from "../groups/model"
import {
  generateObligations,
  toMinor,
  balances,
  collection,
  currentRound,
  money,
  obligationState,
  timing,
  type ActiveCycle,
  type Obligation,
  type Round,
} from "./model"
export function dateLabel(at: string, timezone: string) {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: timezone,
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(at))
}
function Numbers({ items }: { items: { label: string ; value: string }[] }) {
  return (
    <dl className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {items.map((i) => (
        <div key={i.label} className="bg-[#F8FAFF] rounded-xl px-4 py-3">
          <dt className="text-xs text-[#6B7280] mb-1">{i.label}</dt>
          <dd className="text-lg font-bold tabular-nums text-[#0D1117]">
            {i.value}
          </dd>
        </div>
      ))}
    </dl>
  )
}
function ObligationCard({
  obligation,
  round,
  active,
  name,
}: {
  obligation: Obligation
  round: Round
  active: ActiveCycle
  name: string
}) {
  const b = obligationState(obligation, round, active)
  return (
    <article className="bg-white border border-[#E2E6F0] rounded-xl p-5">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <h3 className="font-bold">{name}</h3>
        <div className="flex flex-wrap gap-2">
          <Badge
            variant={
              b.outstanding === 0 ? "verified" : b.late ? "rejected" : "pending"
            }
          >
            {b.fulfillment}
          </Badge>
          {b.outstanding > 0 && (
            <Badge variant={b.late ? "rejected" : "info"}>{b.timing}</Badge>
          )}
        </div>
      </div>
      <Numbers
        items={[
          { label: "Required contribution", value: money(b.required) },
          { label: "Satisfied", value: money(b.satisfied) },
          { label: "Outstanding required", value: money(b.outstanding) },
          { label: "Optional recipient amount", value: money(b.optional) },
        ]}
      />
      {b.optional > 0 && (
        <p className="text-sm text-[#536174] mt-4">
          Your contribution for the position receiving this Round is optional.{" "}
          {b.optionalMade
            ? money(b.optionalMade) + " represented as contributed."
            : "Skipping it creates no debt, lateness or penalty."}
          {b.required > 0
            ? " Your other position holdings remain required."
            : ""}
        </p>
      )}
      {b.penaltyEligible && (
        <p className="text-sm text-red-700 mt-3">
          Outstanding required contributions are late. Penalty eligibility
          begins {dateLabel(round.schedule.lateAt, round.schedule.timezone)}. Daily charges and any reductions appear in the penalty ledger and reports.
        </p>
      )}
      <details className="mt-4 text-sm">
        <summary className="cursor-pointer font-semibold">
          Position basis
        </summary>
        <ul className="mt-3 space-y-2">
          {obligation.components.map((c) => (
            <li key={c.id}>
              Position {c.position} · {c.fraction === 1 ? "full" : "half"} ·{" "}
              {c.requiredMinor
                ? money(c.requiredMinor) + " required"
                : money(c.optionalMinor) + " optional recipient contribution"}
            </li>
          ))}
        </ul>
      </details>
    </article>
  )
}
export function ActiveCycleBody({
  group,
  cycle,
  active: storedActive,
  onWaive,
  organization,
  memberId,
}: {
  group: ThriftGroup
  cycle: Cycle
  active: ActiveCycle
  onWaive?: WaivePenalty
  organization: Organization
  memberId?: string
}) {
  const active = {
    ...storedActive,
    obligations: storedActive.rounds.flatMap((r) =>
      storedActive.obligations.some((o) => o.roundId === r.id)
        ? storedActive.obligations.filter((o) => o.roundId === r.id)
        : generateObligations(group.id, effectiveCycle(group,cycle,r), [r]),
    ),
  }
  const [tab, setTab] =
      useState<"overview" | "schedule" | "positions" | "rules">("overview"),
    [selected, setSelected] = useState<string | null>(null)
  const current = currentRound(active),
    round =
      active.rounds.find((r) => r.id === selected) ||
      current ||
      active.rounds[0]
  if (!round) return <Alert type="info">No Round schedule is available.</Alert>
  const members = cycle.participants,
    names = (id: string) => members.find((p) => p.id === id)?.name || "Member",
    totals = collection(round, active)
  const vacancies=(group.lifecycle?.exits||[]).filter(e=>e.cycleId===cycle.id&&e.kind==="early-exit"&&e.status==="approved"&&!group.lifecycle?.replacements.some(r=>r.exitId===e.id&&r.effectiveAt&&Date.parse(r.effectiveAt)<=Date.parse(round.schedule.opensAt)))
  const relevant = active.obligations.filter(
    (o) => o.roundId === round.id && (!memberId || o.memberId === memberId),
  )
  const holdings = cycle.snapshot!.positions.flatMap((p) =>
    p.holders
      .filter((h) => h.memberId === memberId)
      .map((h) => ({ position: p.n, fraction: h.fraction })),
  )
  const state = timing(round.schedule, effectiveReferenceAt(active))
  return (
    <div className="text-[#0D1117]">
      <PenaltyLedgerPanel group={group} cycle={cycle} memberId={memberId} onWaive={onWaive} />
      <header className="bg-white border border-[#E2E6F0] rounded-2xl overflow-hidden mb-6">
        <div className="h-1.5 bg-[#1746A2]" />
        <div className="p-5 sm:p-6">
          <OrganizationBrand form={organization.form} />
          <div className="flex flex-wrap justify-between items-start gap-4 mt-5">
            <div>
              <h1 className="display-font text-2xl font-bold">{group.name}</h1>
              <p className="text-[#6B7280] mt-1">
                Cycle {cycle.number} ·{" "}
                {current
                  ? "Current Round " +
                    current.number +
                    " of " +
                    active.rounds.length
                  : "Prior Round history"}{" "}
                · {cycle.snapshot!.terms.frequency}
              </p>
            </div>
            <Badge variant="verified">Active Cycle</Badge>
          </div>
          <div className="mt-5">
            <div className="flex justify-between text-xs mb-2">
              <span>Prior Rounds represented as resolved</span>
              <span>
                {active.resolvedRoundIds.length} / {active.rounds.length}
              </span>
            </div>
            <div className="h-2.5 bg-[#F1F3F8] rounded-full overflow-hidden">
              <div
                className="h-full bg-[#1746A2] rounded-full"
                style={{
                  width:
                    (active.resolvedRoundIds.length / active.rounds.length) *
                      100 +
                    "%",
                }}
              />
            </div>
          </div>
        </div>
        <nav
          aria-label="Active Cycle sections"
          className="flex overflow-x-auto border-t border-[#E2E6F0] px-3"
        >
          {(["overview", "schedule", "positions", "rules"] as const).map(
            (t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                aria-current={tab === t ? "page" : undefined}
                className={
                  "px-4 py-3 text-sm font-semibold whitespace-nowrap border-b-2 " +
                  (tab === t
                    ? "border-[#1746A2] text-[#1746A2]"
                    : "border-transparent text-[#6B7280]")
                }
              >
                {t === "overview"
                  ? "Current Round"
                  : t === "schedule"
                    ? "Contribution schedule"
                    : t === "positions"
                      ? "Payout positions"
                      : "Group rules"}
              </button>
            ),
          )}
        </nav>
      </header>
      {tab === "overview" && (
        <div className="space-y-5">
          {!storedActive.obligations.some((o) => o.roundId === round.id) && (
            <Alert type="info">
              Upcoming contribution preview. Obligations are generated
              automatically when this Round opens; these projected amounts are
              not yet payable debt.
            </Alert>
          )}
          <div className="flex flex-wrap justify-between items-center gap-3">
            <h2 className="text-xl font-bold">
              Round {round.number}
              {round.id === current?.id ? " · current" : ""}
            </h2>
            <label className="text-sm">
              Inspect Round{" "}
              <select
                aria-label="Inspect Round"
                value={round.id}
                onChange={(e) => setSelected(e.target.value)}
                className="ml-2 rounded-lg border p-2"
              >
                {active.rounds.map((r) => (
                  <option key={r.id} value={r.id}>
                    Round {r.number}
                    {active.resolvedRoundIds.includes(r.id)
                      ? " · prior demo history"
                      : r.id === current?.id
                        ? " · current"
                        : ""}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <section className="border border-[#C7D2FE] bg-[#EEF2FF] rounded-xl p-5">
            <div className="flex flex-wrap justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-[#1746A2]">
                  Payout Position {round.position}
                </p>
                <h3 className="font-bold mt-1">
                  {round.beneficiaries
                    .map(
                      (b) =>
                        names(b.memberId) +
                        (b.fraction === 0.5 ? " · half share" : ""),
                    )
                    .join(" & ")}
                </h3>
              </div>
              <Badge variant="info">Schedule · {state}</Badge>
            </div>
            <p className="text-sm mt-3">
              Opens {dateLabel(round.schedule.opensAt, round.schedule.timezone)}{" "}
              · Due {dateLabel(round.schedule.dueAt, round.schedule.timezone)}
            </p>
            <p className="text-sm mt-1">
              {Date.parse(round.schedule.lateAt) >
              Date.parse(round.schedule.dueAt) + 1
                ? "Grace ends before " +
                  dateLabel(round.schedule.lateAt, round.schedule.timezone)
                : "No grace period"}{" "}
              · Payout target{" "}
              {dateLabel(
                round.schedule.payoutTargetAt,
                round.schedule.timezone,
              )}
            </p>
          </section>
          {!memberId && (
            <section className="bg-white border border-[#E2E6F0] rounded-xl p-5">
              <Numbers
                items={[
                  {
                    label: "Scheduled Payout Value",
                    value: money(round.scheduledPayoutValueMinor),
                  },
                  {
                    label: "Required Round collection",
                    value: money(totals.required),
                  },
                  {
                    label: "Actual collected · demo",
                    value: money(totals.collected),
                  },
                  {
                    label: "Outstanding required",
                    value: money(totals.outstanding),
                  },
                ]}
              />
              <div className="mt-5 flex flex-wrap justify-between gap-2 text-sm">
                <strong>
                  {totals.satisfiedMembers} of {totals.requiredMembers} required
                  contributions satisfied
                </strong>
                <span className="tabular-nums">
                  {money(totals.satisfied)} / {money(totals.required)}
                </span>
              </div>
              <div className="h-2 bg-[#F1F3F8] rounded-full mt-2">
                <div
                  className="h-full rounded-full bg-[#059669]"
                  style={{
                    width: totals.required
                      ? (totals.satisfied / totals.required) * 100 + "%"
                      : "100%",
                  }}
                />
              </div>
              <p className="text-sm mt-4">
                Optional recipient amount: {money(totals.optional)} · Optional
                contribution made: {money(totals.optionalMade)}. Unpaid optional
                amounts are not outstanding debt and do not reduce SPV.
              </p>
            </section>
          )}
          {vacancies.length>0&&<p className="text-amber-700 font-semibold">Vacated Positions remain historically retained. Their funding requirements need separate regularization; reduced active membership does not reduce the scheduled payout value.</p>}
        {totals.ready && !vacancies.length ? (
            <Alert type="success">
              Required collections are satisfied — ready for payout review. The
              scheduled target does not prevent early readiness. Beneficiary,
              penalty and other payout checks remain separate; payout execution
              is not available here.
            </Alert>
          ) : (
            <Alert type="info">
              {state === "Upcoming"
                ? "This Round has not opened."
                : money(totals.outstanding) +
                  " in required contributions remains outstanding."}{" "}
              Optional recipient contributions never block collection readiness.
            </Alert>
          )}
          {memberId && (
            <Numbers
              items={[
                {
                  label: "My payout positions",
                  value: holdings
                    .map(
                      (h) =>
                        "#" + h.position + (h.fraction === 0.5 ? " (½)" : ""),
                    )
                    .join(", "),
                },
                {
                  label: "Base full-position amount",
                  value: money(
                    round.scheduledPayoutValueMinor / active.rounds.length,
                  ),
                },
              ]}
            />
          )}
          <div className="space-y-4">
            {relevant
              .sort((a, b) => balances(b).outstanding - balances(a).outstanding)
              .map((o) => (
                <ObligationCard
                  key={o.id}
                  obligation={o}
                  round={round}
                  active={active}
                  name={memberId ? "My contribution" : names(o.memberId)}
                />
              ))}
          </div>
        </div>
      )}
      {tab === "schedule" && (
        <section className="space-y-3">
          <h2 className="text-xl font-bold mb-4">
            {memberId ? "My contribution schedule" : "Round schedule"}
          </h2>
          {active.rounds.map((r) => {
            const o = active.obligations.find(
                (o) => o.roundId === r.id && o.memberId === memberId,
              ),
              b = o ? obligationState(o, r, active) : null,
              isRecipient = r.beneficiaries.some((v) => v.memberId === memberId)
            return (
              <button
                key={r.id}
                onClick={() => {
                  setSelected(r.id)
                  setTab("overview")
                }}
                className="w-full text-left bg-white border border-[#E2E6F0] rounded-xl p-5 hover:border-[#1746A2]"
              >
                <div className="flex flex-wrap justify-between gap-3">
                  <strong>
                    Round {r.number} · Position {r.position}
                    {isRecipient ? " · my payout" : ""}
                  </strong>
                  <Badge variant={b?.late ? "rejected" : "info"}>
                    {active.resolvedRoundIds.includes(r.id)
                      ? "Prior · demo history"
                      : r.id === current?.id
                        ? "Current"
                        : timing(r.schedule, effectiveReferenceAt(active))}
                  </Badge>
                </div>
                <p className="text-sm text-[#6B7280] mt-2">
                  Due {dateLabel(r.schedule.dueAt, r.schedule.timezone)} ·{" "}
                  {r.beneficiaries.map((v) => names(v.memberId)).join(" & ")}
                </p>
                {b && (
                  <p className="text-sm mt-2 tabular-nums">
                    {money(b.required)} required · {money(b.outstanding)}{" "}
                    outstanding · {money(b.optional)} optional · {b.fulfillment}
                  </p>
                )}
              </button>
            )
          })}
        </section>
      )}
      {tab === "positions" && (
        <section className="grid sm:grid-cols-2 gap-4">
          {active.rounds.map((r) => (
            <article
              key={r.id}
              className="bg-white rounded-xl border border-[#E2E6F0] p-5"
            >
              <h2 className="font-bold text-lg">
                Position {r.position} · Round {r.number}
              </h2>
              {r.beneficiaries.map((b) => (
                <p key={b.memberId} className="mt-3 text-sm">
                  {names(b.memberId)} · {b.fraction === 1 ? "full" : "half"} ·
                  Scheduled entitlement{" "}
                  <strong className="tabular-nums">
                    {money(b.entitlementMinor)}
                  </strong>
                </p>
              ))}
              <p className="text-sm text-[#6B7280] mt-3">
                Target{" "}
                {dateLabel(r.schedule.payoutTargetAt, r.schedule.timezone)}
              </p>
            </article>
          ))}
        </section>
      )}
      {tab === "rules" && (
        <section className="bg-white rounded-xl border border-[#E2E6F0] p-5 text-sm space-y-4">
          <h2 className="font-bold text-xl">Accepted Cycle rules</h2>
          <p className="whitespace-pre-line">{BASE_RULES}</p>
          {cycle.snapshot!.terms.rules !== BASE_RULES && (
            <p className="whitespace-pre-line">{cycle.snapshot!.terms.rules}</p>
          )}
          <p>
            Organization fee:{" "}
            {cycle.snapshot!.terms.feeType === "percentage"
              ? cycle.snapshot!.terms.feeValue +
                "% of Scheduled Payout Entitlement"
              : money(toMinor(cycle.snapshot!.terms.feeValue)) +
                " per full payout position, proportional for halves"}
            . This remains the reference when optional recipient contributions
            are skipped; fees are not collected here.
          </p>
          <p>{cycle.snapshot!.terms.notesToMembers}</p>
          <p>
            Contribution availability follows the accepted policy. Review Payments for permitted contribution or advance actions, recorded allocations and exceptions. An advance reservation does not create a future obligation.
          </p>
        </section>
      )}
    </div>
  )
}
