import { DisplayDate } from '../design/foundation'
import { PenaltyLedgerPanel } from '../penalties/PenaltyLedgerPanel'
import { recoveryBalances } from './recovery'
import { PublicReview } from '../operations/PublicStatus'
﻿import type { Cycle, ThriftGroup } from "../groups/model"
import { balances, money } from "../rounds/model"
import { emptyLifecycle } from "./model"
export function LifecycleHistory({
  group,
  cycle,
  memberId,
}: {
  group: ThriftGroup
  cycle: Cycle
  memberId?: string
}) {
  const l = group.lifecycle || emptyLifecycle(),
    terms = cycle.snapshot?.terms || cycle.terms
  const exits = l.exits.filter(
      (e) => e.cycleId === cycle.id && (!memberId || e.memberId === memberId),
    ),
    replacements = l.replacements.filter(
      (r) =>
        r.cycleId === cycle.id &&
        (!memberId ||
          r.outgoingMemberId === memberId ||
          r.incomingMemberId === memberId),
    ),
    recoveries = l.recoveries.filter(
      (r) => r.cycleId === cycle.id && (!memberId || r.memberId === memberId),
    )
  const obligations = (cycle.active?.obligations || []).filter(
      (o) => !memberId || o.memberId === memberId,
    ),
    required = obligations.reduce((s, o) => s + balances(o).required, 0),
    satisfied = obligations.reduce((s, o) => s + balances(o).satisfied, 0)
  const names = (id: string) =>
    cycle.participants.find((p) => p.id === id)?.name || id
  return (
    <div className="space-y-5">
      <PenaltyLedgerPanel group={group} cycle={cycle} memberId={memberId} />
      <section className="bg-white border border-[#E2E6F0] rounded-xl p-5">
        <p className="text-xs font-semibold uppercase text-[#6B7280]">
          Retained Cycle record
        </p>
        <h2 className="text-xl font-bold mt-2">
          {terms.name} · Cycle {cycle.number}
        </h2>
        <p className="mt-2 text-sm">
          {cycle.status === "completed-with-recovery"
            ? "COMPLETED WITH OUTSTANDING RECOVERY"
            : cycle.status.toUpperCase().replace(/-/g, " ")}
          {cycle.completedAt ? " · completed " + cycle.completedAt : ""}
        </p>
        {cycle.status === "force-closed" && <p className="text-sm mt-2">Force Closed <DisplayDate value={cycle.active?.endedAt}/>. Closure approval retained; liabilities remain independently tracked.</p>}
        {cycle.cancelledAt && (
          <p className="text-sm mt-2">
            Cancelled <DisplayDate value={cycle.cancelledAt}/>: {cycle.cancellationReason}
          </p>
        )}
        <div className="grid sm:grid-cols-3 gap-3 mt-5">
          {[
            { label: "Required principal generated", value: money(required) },
            { label: "Satisfied principal", value: money(satisfied) },
            {
              label: "Unpaid principal retained",
              value: money(required - satisfied),
            },
          ].map((r) => (
            <div key={r.label} className="bg-[#F8FAFF] rounded-lg p-3">
              <p className="text-xs">{r.label}</p>
              <p className="font-bold tabular-nums mt-1">{r.value}</p>
            </div>
          ))}
        </div>
        <p className="text-sm mt-4">
          {terms.frequency} · {terms.positions} payout positions · contribution
          ₦{terms.amount.toLocaleString()} per full position. Organization fee:{" "}
          {terms.feeValue}
          {terms.feeType === "percentage" ? "%" : " NGN per full position"}.
        </p>
        <details className="mt-4 text-sm">
          <summary className="cursor-pointer font-semibold">
            Accepted rules and original position holders
          </summary>
          <p className="whitespace-pre-line mt-3">{terms.rules}</p>
          {(cycle.snapshot?.positions || cycle.positions).map((p) => (
            <p key={p.n} className="mt-2">
              Position {p.n}:{" "}
              {p.holders
                .map((h) => names(h.memberId) + " (" + h.fraction + ")")
                .join(", ") || "Unassigned"}
            </p>
          ))}
        </details>
      </section>
      {(cycle.active?.rounds || []).length > 0 && (
        <details className="bg-white border border-[#E2E6F0] rounded-xl p-5">
          <summary className="font-bold cursor-pointer">
            Retained Rounds and obligations
          </summary>
          {cycle.active!.rounds.map((r) => {
            const rows = obligations.filter((o) => o.roundId === r.id)
            return (
              <div key={r.id} className="border-t mt-3 pt-3 text-sm">
                <strong>
                  Round {r.number} · Position {r.position}
                </strong>
                <p>
                  Due {r.schedule.dueAt} · Scheduled Payout Value{" "}
                  {money(r.scheduledPayoutValueMinor)}
                </p>
                {rows.map((o) => {
                  const b = balances(o)
                  return (
                    <p key={o.id} className="mt-1">
                      {names(o.memberId)} · {b.fulfillment} ·{" "}
                      {money(b.outstanding)} outstanding · {money(b.optional)}{" "}
                      optional
                    </p>
                  )
                })}
              </div>
            )
          })}
        </details>
      )}
      {exits.map((e) => (
        <section
          key={e.id}
          className="bg-white border border-[#E2E6F0] rounded-xl p-5"
        >
          <h3 className="font-bold">
            {names(e.memberId)} ·{" "}
            {e.kind === "withdrawal" ? "Withdrawal" : "Early Exit"} · {e.status}
          </h3>
          <p className="text-sm mt-2">
            {e.reason} · requested <DisplayDate value={e.requestedAt}/>
          </p>
          <p className="text-sm mt-2">
            Original positions: {e.positions.map((p) => p.n).join(", ")}.
            Recognized contributions: {money(e.recognizedContributionsMinor)}.
          </p>
          {e.kind === "early-exit" && (
            <p className="text-sm mt-2">
              Exit Settlement Due: {money(e.settlement.dueMinor)} ·{" "}
              {e.settlement.status} · expected{" "}
              {e.settlement.dueAt || e.settlement.timing}. The Organization is
              responsible. {e.settlementConfirmations?.map(r=><span className="block" key={r.id}>Evidenced settlement {money(r.amountMinor)} on {r.at}; original principal retained.</span>)}
              {e.settlement.escalatedAt
                ? " Overdue settlement escalated as an Organization case."
                : ""}
            </p>
          )}
        </section>
      ))}
      {exits.map(e=><PublicReview key={e.id+"-review"} review={e.review}/>)}
      {replacements.map((r) => (
        <section
          key={r.id}
          className="bg-white border border-[#E2E6F0] rounded-xl p-5"
        >
          <h3 className="font-bold">
            Replacement · {names(r.outgoingMemberId)} → {r.incomingName}
          </h3>
          <p className="text-sm mt-2">
            {r.status} · regularization {money(r.regularizationSatisfiedMinor)}{" "}
            of {money(r.regularizationRequiredMinor)} ·{" "}
            {r.acceptance ? "Member accepted" : "Member acceptance required"}
            {r.effectiveAt ? " · effective " + r.effectiveAt : ""}
          </p>
          <p className="text-xs text-[#6B7280] mt-2">
            Original participation remains retained. Regularization is a
            requirement/state; no payment is executed here.
          </p>
        </section>
      ))}
      {recoveries.map((r) => (
        <section
          key={r.id}
          className="bg-white border border-[#E2E6F0] rounded-xl p-5"
        >
          <h3 className="font-bold">
            Post-Payout Default / Recovery · {names(r.memberId)}
          </h3>
          <p className="text-sm mt-2">
            {r.status} · principal {money(r.principalMinor)} · accrued penalty{" "}
            {money(r.penaltyMinor)} · recovered {money(r.recoveredMinor)} ·
            unresolved{" "}
            {money(recoveryBalances(r).outstanding)}
          </p>
          <p className="text-sm mt-2">
            {r.restricted
              ? "Not eligible for new thrift commitments. Existing commitments continue."
              : "Restriction cleared after review; default history remains."}
          </p>
          <p className="text-sm mt-2">
            Due → Grace → Late → Penalty → configurable default threshold →
            formal Post-Payout Default. This demo supplies the formal case; it
            does not silently impose a production threshold.
          </p>
          <p className="text-sm mt-2">Principal outstanding {money(recoveryBalances(r).principalOutstanding)}; penalty outstanding {money(recoveryBalances(r).penaltyOutstanding)}. Recovery applies to principal first, then penalty. {recoveryBalances(r).exception&&<>Recovery exception: excess {money(recoveryBalances(r).excessMinor)} requires review; no negative balance or automatic resolution.</>}</p>
          <PublicReview review={r.review}/>
          <p className="text-xs mt-2 text-[#6B7280]">
            Recovery continues independently of the fixed Cycle completion date.
            Penalty growth stops when the Cycle ends.
          </p>
        </section>
      ))}
      {l.payoutFacts
        .filter(
          (p) =>
            p.cycleId === cycle.id && (!memberId || p.memberId === memberId),
        )
        .map((p, i) => (
          <section
            key={"payout-" + i}
            className="bg-white border rounded-xl p-4 text-sm"
          >
            <strong>
              Payout Position {p.position} · {names(p.memberId)}
            </strong>
            <p>
              {p.status.replace(/-/g, " ")} · {money(p.entitlementMinor)} ·{" "}
              {p.at || "Unresolved"}
            </p>
            <p>{p.status.includes("demo")?"Seeded outcome only; no payout execution.":"Organization-recorded payout outcome; transfer and recipient response retained separately."}</p>
          </section>
        ))}
      {(group.payouts?.records||[]).filter(p=>p.cycleId===cycle.id&&(!memberId||p.memberId===memberId)).map(p=><section key={p.id} className="bg-white border rounded-xl p-5"><h3 className="font-bold">Payout record · Position {p.position} · {p.beneficiaryName}</h3><p className="text-sm mt-2">{p.status.replace(/-/g,' ')} · completion {p.completedAt||'outstanding'} · normal finalization {p.finalizedAt||'pending'}</p>{p.instructions.map(i=><p key={i.id} className="text-sm mt-3">Instruction {i.at}: scheduled entitlement {money(i.entitlementMinor)} · attributable collection {money(i.attributableCollectionMinor)} · Organization Fee {money(i.feeMinor)} · net {money(i.netMinor)} · {i.bank.bankName} / {i.bank.accountNumber} / {i.bank.resolvedName}</p>)}{p.installments.map(i=><p key={i.id} className="text-sm mt-3">Transfer {money(i.amountMinor)} · {i.at} · {i.reference} · {i.status.replace(/-/g,' ')} · {i.confirmedAt||i.autoCompletedAt||'awaiting response'}</p>)}{p.disputes.map(d=><p key={d.id} className="text-sm mt-2">Open payout dispute: {d.reason}</p>)}</section>)}
      {!memberId && (
        <details className="bg-white border border-[#E2E6F0] rounded-xl p-5">
          <summary className="font-bold cursor-pointer">
            Group lifecycle timeline
          </summary>
          {group.history.map((h, i) => (
            <p key={i} className="text-sm border-t mt-3 pt-3">
              {h.at} · {h.action}
              <span className="block text-xs text-[#6B7280] mt-1">
                {h.actor}
              </span>
            </p>
          ))}
        </details>
      )}
    </div>
  )
}
