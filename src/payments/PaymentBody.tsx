import { formatDate } from '../design/format'
import { DisplayDate } from '../design/foundation'
import { effectiveReferenceAt } from '../rounds/model'
import {optionalDecision} from "./optional"
﻿import { useState } from "react"
import type { ThriftGroup } from "../groups/model"
import { cycleOf } from "../groups/model"
import type { Organization } from "../organizations/model"
import { OrganizationBrand } from "../organizations/OrganizationBrand"
import {
  balances,
  collection,
  currentRound,
  money,
  timing,
  generateObligations,
} from "../rounds/model"
import { effectiveCycle } from "../lifecycle/handover"
import { Button, Alert } from "../components/ui"
import {
  paymentRecords,
  parsePaymentAmount,
  type PaymentTransaction,
} from "./model"
import { advanceRound, type PaymentChoice } from "./service"
const panel = "bg-white border border-[#E2E6F0] rounded-2xl p-5 sm:p-6"
export function PaymentReceipt({
  group,
  transaction,
}: {
  group: ThriftGroup
  transaction: PaymentTransaction
}) {
  const p = paymentRecords(group),
    t = transaction,
    c = group.cycles.find((c) => c.id === t.cycleId)!,
    a = p.allocations.filter((a) => a.transactionId === t.id),
    round = c.active?.rounds.find((r) => r.id === t.roundId),
    o = c.active?.obligations.find(
      (o) => o.memberId === t.memberId && o.roundId === t.roundId,
    )
  return (
    <section className={panel} aria-label="Contribution receipt">
      <p className="text-xs uppercase tracking-wide text-[#536174]">
        Prototype payment receipt
      </p>
      <h2 className="text-xl font-bold mt-2">
        {t.allocationStatus === "exception"
          ? "Payment received · attention needed"
          : t.holdReason
            ? "Advance payment confirmed"
            : "Contribution confirmed"}
      </h2>
      <p className="text-3xl font-bold tabular-nums my-4">
        {money(t.amountMinor)}
      </p>
      <p>
        {group.name} · Cycle {c.number} · Round {round?.number}
      </p>
      <p className="text-sm mt-3">Successful payment: <DisplayDate value={t.confirmedAt}/></p>
      <p className="text-sm break-all">
        Payment reference: {t.providerReference}
      </p>
      <p className="text-sm mt-3">
        Applied to contributions: {money(t.allocatedMinor)}
        {t.unallocatedMinor > 0
          ? " · Not yet applied: " + money(t.unallocatedMinor)
          : ""}
      </p>
      {t.holdReason && (
        <Alert type="info">
          Your advance payment is confirmed and reserved against the earliest
          eligible future scheduled contribution in Round {round?.number} opens.
          No future obligation has been generated or satisfied early.
        </Alert>
      )}
      {t.allocationStatus === "exception" && (
        <Alert type="warning">
          The provider confirmed this payment, but it needs allocation review.
          Your obligation has not been falsely marked paid. No retry is needed
          for these received funds.
        </Alert>
      )}
      <div className="space-y-2 my-4">
        {a.map((row) => (
          <p key={row.id} className="text-sm">
            Position{" "}
            {o?.components.find((p) => p.id === row.componentId)?.position ||
              c.active?.obligations
                .find((o) => o.id === row.obligationId)
                ?.components.find((p) => p.id === row.componentId)
                ?.position}{" "}
            ·{" "}
            {row.kind === "optional"
              ? "Voluntary own-payout contribution"
              : "Required contribution"}{" "}
            · {money(row.amountMinor)} ·{" "}
            {row.timeliness === "optional"
              ? "Optional — never late"
              : row.timeliness === "on-time"
                ? "On time"
                : row.timeliness === "grace"
                  ? "Within grace"
                  : "Late"}
          </p>
        ))}
      </div>
      {o && (
        <p className="text-sm font-semibold">
          Remaining required contribution for this Round:{" "}
          {money(balances(o).outstanding)}
        </p>
      )}
      <p className="text-sm mt-4">
        Successful contribution recognition is preserved.
      </p>
      <p className="text-xs mt-4 text-[#536174]">
        Funds follow the Organization/provider settlement arrangement. TCS
        records and coordinates contributions; it is not the receiving bank.
        This is a prototype record.
      </p>
    </section>
  )
}
export function PaymentBody({
  group,
  organization,
  memberId,
  readOnly = false,
  initialRoundId,
  onPay,
  onCheck,
  onOptional,
}: {
  group: ThriftGroup
  organization: Organization
  memberId?: string
  readOnly?: boolean
  initialRoundId?: string
  onOptional?: (cycleId:string, roundId:string, choice:"contribute"|"skip")=>boolean
  onPay?: (choice: PaymentChoice) => boolean
  onCheck?: (id: string) => boolean
}) {
  const [cycleId, setCycleId] = useState(""),
    [roundId, setRoundId] = useState(initialRoundId || ""),
    [receipt, setReceipt] = useState(""),
    [partial, setPartial] = useState(""),
    [inputError, setInputError] = useState("")
  const c =
      group.cycles.find((c) => c.id === cycleId) ||
      (memberId
        ? [...group.cycles]
            .reverse()
            .find((c) => c.participants.some((p) => p.id === memberId))
        : undefined) ||
      cycleOf(group),
    active = c.active,
    r =
      active?.rounds.find((r) => r.id === roundId) ||
      (active
        ? currentRound(active) || active.rounds[active.rounds.length - 1]
        : undefined),
    p = paymentRecords(group)
  const decision = r && memberId ? optionalDecision(group,c.id,r.id,memberId) : undefined
  const owned = (id: string) => !memberId || id === memberId,
    attempts = p.attempts.filter(
      (a) => a.cycleId === c.id && owned(a.memberId),
    ),
    transactions = p.transactions.filter(
      (t) => t.cycleId === c.id && owned(t.memberId),
    ),
    exceptionIds = new Set(transactions.map((t) => t.id)),
    exceptions = p.exceptions.filter((e) => exceptionIds.has(e.transactionId)),
    chosen = transactions.find((t) => t.id === receipt)
  const live = c.status === "activated" && !active?.endedAt,
    obligation = active?.obligations.find(
      (o) => o.memberId === memberId && o.roundId === r?.id,
    ),
    b = obligation ? balances(obligation) : undefined,
    optional =
      obligation?.components.reduce(
        (s, p) => s + p.optionalMinor - p.optionalSatisfiedMinor,
        0,
      ) || 0,
    total = r && active ? collection(r, active) : undefined
  const pending = attempts.find(
      (a) =>
        (a.roundId === r?.id || a.intent === "advance") &&
        ["created", "awaiting-payment", "provider-pending"].includes(a.status),
    ),
    account = p.accounts.find((a) => a.id === pending?.accountId),
    roundExceptions = transactions.filter(
      (t) => t.roundId === r?.id && t.allocationStatus === "exception",
    ),
    holding = transactions.find((t) => t.holdReason),
    next = memberId ? advanceRound(group, c.id, memberId) : undefined,
    nextAmount = next
      ? generateObligations(group.id, effectiveCycle(group, c, next), [next])
          .filter((o) => o.memberId === memberId)
          .reduce((s, o) => s + balances(o).outstanding, 0)
      : 0
  const vacancies = (group.lifecycle?.exits || []).filter(
    (e) =>
      e.cycleId === c.id &&
      e.kind === "early-exit" &&
      e.status === "approved" &&
      !group.lifecycle?.replacements.some(
        (rep) =>
          rep.exitId === e.id &&
          rep.effectiveAt &&
          r &&
          Date.parse(rep.effectiveAt) <= Date.parse(r.schedule.opensAt),
      ),
  )
  const priorRecognized =
    (active?.obligations || [])
      .filter((o) => owned(o.memberId))
      .reduce((sum, o) => sum + balances(o).collected, 0) -
    transactions.reduce((sum, t) => sum + t.allocatedMinor, 0)
  const pay = (includeOptional: boolean, amountMinor?: number) =>
    onPay?.({ cycleId: c.id, roundId: r!.id, includeOptional, amountMinor })
  return (
    <div className="space-y-5">
      {inputError && <Alert type="error">{inputError}</Alert>}
      <header className={panel}>
        <OrganizationBrand form={organization.form} />
        <h1 className="text-2xl font-bold mt-5">
          {memberId ? "My contributions" : "Contribution collection"}
        </h1>
        <p className="text-[#536174] mt-1">{group.name}</p>
        <div className="flex flex-wrap gap-3 mt-4">
          <label className="text-sm">
            Cycle{" "}
            <select
              aria-label="Payment Cycle"
              className="border rounded-lg p-2 ml-2"
              value={c.id}
              onChange={(e) => {
                setCycleId(e.target.value)
                setRoundId("")
                setReceipt("")
                setPartial("")
              }}
            >
              {group.cycles
                .filter(
                  (c) =>
                    !memberId || c.participants.some((p) => p.id === memberId),
                )
                .map((c) => (
                  <option key={c.id} value={c.id}>
                    Cycle {c.number} · {c.status}
                  </option>
                ))}
            </select>
          </label>
          {r && (
            <label className="text-sm">
              Round{" "}
              <select
                aria-label="Payment Round"
                className="border rounded-lg p-2 ml-2"
                value={r.id}
                onChange={(e) => {
                  setRoundId(e.target.value)
                  setPartial("")
                }}
              >
                {active!.rounds.map((r) => (
                  <option key={r.id} value={r.id}>
                    Round {r.number} · {timing(r.schedule, effectiveReferenceAt(active!))}
                  </option>
                ))}
              </select>
            </label>
          )}
        </div>
      </header>
      {!live && (
        <Alert type="info">
          This Cycle is {c.status}. Retained payment history is available;
          normal contribution allocation is closed.
        </Alert>
      )}
      {chosen && <PaymentReceipt group={group} transaction={chosen} />}
      {memberId && r && (
        <section className={panel}>
          <div className="flex justify-between gap-3">
            <h2 className="font-semibold">
              Cycle {c.number} · Round {r.number}
            </h2>
            <span className="text-sm text-[#536174]">
              {timing(r.schedule, effectiveReferenceAt(active!))}
            </span>
          </div>
          <p className="text-sm mt-2 text-[#536174]">
            Due <DisplayDate value={r.schedule.dueAt}/> · {r.schedule.timezone}
          </p>
          {b ? (
            <>
              <p className="mt-6 text-sm">
                {b.outstanding
                  ? "Required now"
                  : "No required contribution outstanding this Round"}
              </p>
              <p className="text-4xl font-bold tabular-nums mt-1">
                {money(b.outstanding)}
              </p>
              <p className="text-sm mt-2 text-[#536174]">
                Required {money(b.required)} · already satisfied{" "}
                {money(b.satisfied)}
              </p>
              {obligation!.components
                .filter((p) => p.requiredMinor > 0)
                .map((p) => (
                  <p key={p.id} className="text-sm mt-2">
                    Position {p.position} ({p.fraction} share):{" "}
                    {money(p.requiredMinor - p.requiredSatisfiedMinor)}{" "}
                    outstanding
                  </p>
                ))}
              {b.optional > 0 && (
                <div className="rounded-xl bg-[#F8FAFF] p-4 mt-4">
                  <p className="font-semibold">
                    Optional own-payout contribution: {money(optional)}
                  </p>
                  <p className="text-sm mt-1">
                    You may skip this. It is not debt, never becomes late, and
                    does not block required collection readiness.
                  </p>
                  <p className="text-sm mt-2">Choice: {decision?.choice || "Not yet selected"}{decision?.lockedAt ? " · Final since " + decision.lockedAt : " · Final when payout execution begins for you"}</p>
                  {decision?.lockedAt && <p className="text-sm mt-2">Confirmed at payout cutoff: {money(decision.confirmedMinorAtCutoff || 0)}. The unpaid optional amount is not due. Later funds require payment exception resolution.</p>}
                  {!readOnly && live && !decision?.lockedAt && onOptional && <div className="mt-3 space-y-2">{(["contribute", "skip"] as const).map(value => <label key={value} className="block text-sm"><input type="radio" name={"optional-"+r.id} checked={decision?.choice === value} onChange={()=>onOptional(c.id,r.id,value)} /> {value === "contribute" ? "I will contribute in my payout Round" : "I will skip my contribution this Round"}</label>)}</div>}
                </div>
              )}
              {roundExceptions.length > 0 && (
                <Alert type="warning">
                  A received payment for this Round needs attention. Review its
                  receipt before making another contribution.
                </Alert>
              )}
              {!readOnly && live && !pending && (
                <div className="flex flex-wrap gap-3 mt-5">
                  {b.outstanding > 0 && (
                    <Button onClick={() => pay(false)}>
                      Pay required amount · {money(b.outstanding)}
                    </Button>
                  )}
                  {optional > 0 && decision?.choice === "contribute" && !decision.lockedAt && (
                    <Button variant="secondary" onClick={() => pay(true)}>
                      {b.outstanding
                        ? "Include optional · total "
                        : "Contribute voluntarily · "}
                      {money(b.outstanding + optional)}
                    </Button>
                  )}
                </div>
              )}
              {!readOnly &&
                live &&
                !pending &&
                b.outstanding > 0 &&
                ["allowed", "demo-only"].includes(
                  active!.contributionPolicy?.partial || "",
                ) && (
                  <details className="mt-5 text-sm">
                    <summary className="cursor-pointer font-semibold">
                      Contribute part of the required amount
                    </summary>
                    <p className="mt-2">
                      Partial contributions are explicitly enabled for this
                      Cycle
                      {active!.contributionPolicy?.partial === "demo-only"
                        ? " as a seeded policy scenario"
                        : ""}
                      . The remainder stays outstanding.
                    </p>
                    <label className="block mt-3">
                      Amount (NGN){" "}
                      <input
                        aria-label="Partial contribution amount"
                        type="number"
                        min="0.01"
                        step="0.01"
                        className="border rounded p-2"
                        value={partial}
                        onChange={(e) => setPartial(e.target.value)}
                      />
                    </label>
                    <Button
                      size="sm"
                      onClick={() => {
                        try {
                          setInputError("")
                          pay(false, parsePaymentAmount(partial))
                        } catch (e) {
                          setInputError(
                            e instanceof Error
                              ? e.message
                              : "Choose a valid amount.",
                          )
                        }
                      }}
                    >
                      Continue with partial amount
                    </Button>
                  </details>
                )}
            </>
          ) : (
            <p className="mt-4 text-sm">
              No payable obligation has been generated for you in this Round.
              Future obligations are created when their Round opens.
            </p>
          )}
        </section>
      )}
      {memberId && pending && (
        <section className={panel}>
          <h2 className="text-xl font-bold">
            {pending.status === "provider-pending"
              ? "Payment confirming"
              : "Collection instructions"}
          </h2>
          <p className="text-2xl font-bold my-4">
            {money(pending.expectedMinor)}
          </p>
          {account && (
            <div className="rounded-xl bg-[#F8FAFF] p-4 text-sm space-y-2">
              <p>{account.bankName}</p>
              <p className="font-bold">{account.accountNumber}</p>
              <p>{account.accountName}</p>
              <p>
                Prototype account only. Do not transfer real money. This
                Member–Organization account stays consistent across this
                Organization's Groups.
              </p>
            </div>
          )}
          <p className="text-sm mt-4">
            {pending.status === "provider-pending"
              ? "The provider has not confirmed success yet. Your outstanding contribution is unchanged."
              : "After completing the provider payment, check its confirmation here."}
          </p>
          {!readOnly && (
            <Button className="mt-4" onClick={() => onCheck?.(pending.id)}>
              Check payment confirmation
            </Button>
          )}
        </section>
      )}
      {memberId &&
        live &&
        next &&
        b?.outstanding === 0 &&
        !holding &&
        !pending && (
          <section className={panel}>
            <h2 className="font-semibold">
              Contribute ahead · Round {next.number}
            </h2>
            <p className="text-sm mt-2">
              Advance contributions are explicitly enabled for this Cycle.{" "}
              {money(nextAmount)} will remain confirmed but unallocated until
              the Round opens on <DisplayDate value={next.schedule.opensAt}/>. The opening obligation
              and actual Member ownership determine allocation.
            </p>
            {!readOnly && (
              <Button
                variant="secondary"
                className="mt-4"
                onClick={() =>
                  onPay?.({
                    cycleId: c.id,
                    roundId: next.id,
                    includeOptional: false,
                    advance: true,
                  })
                }
              >
                View advance instructions · {money(nextAmount)}
              </Button>
            )}
          </section>
        )}
      {memberId && holding && (
        <Alert type="info">
          Advance contribution {money(holding.amountMinor)} confirmed and
          reserved for its scheduled contribution. Waiting for its Round opening
          before allocation.
        </Alert>
      )}
      {!memberId && r && total && (
        <>
          <section className={panel}>
            <h2 className="text-xl font-bold">Round {r.number} collection</h2>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 my-5">
              {[
                { label: "Required collected", value: total.satisfied },
                { label: "Required outstanding", value: total.outstanding },
                { label: "Optional contributed", value: total.optionalMade },
                { label: "Total collected", value: total.collected },
              ].map((v) => (
                <div key={v.label}>
                  <p className="text-xs text-[#536174]">{v.label}</p>
                  <p className="text-xl font-bold tabular-nums mt-1">
                    {money(v.value)}
                  </p>
                </div>
              ))}
            </div>
            <p className="text-sm">
              {total.satisfiedMembers} of {total.requiredMembers} required
              contributions satisfied · required collection{" "}
              {money(total.required)}.
            </p>
            <p className="font-semibold mt-3">
              {timing(r.schedule, effectiveReferenceAt(active!)) === "Upcoming"
                ? "Round has not opened"
                : total.ready && !vacancies.length
                  ? "Ready for payout"
                  : "Required collection / vacancy resolution outstanding"}
            </p>
            <p className="text-xs mt-2 text-[#536174]">
              Optional own-payout contributions do not block readiness. Payouts use this same confirmed collection.
            </p>
            {vacancies.length > 0 && (
              <Alert type="warning">
                Vacated Positions retain their original funding requirements and
                settlement history.
              </Alert>
            )}
          </section>
          {exceptions.length > 0 && (
            <section className={panel}>
              <h2 className="font-bold">Payments needing attention</h2>
              {exceptions.map((e) => (
                <div key={e.id} className="border-t pt-3 mt-3 text-sm">
                  <strong>{money(e.amountMinor)} · received, not failed</strong>
                  <p>{e.reason}</p>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => setReceipt(e.transactionId)}
                  >
                    View payment detail
                  </Button>
                </div>
              ))}
              <p className="text-xs mt-4">
                Controlled exception resolution and reconciliation follow in a
                later module. Normal confirmed contributions require no
                Organization approval.
              </p>
            </section>
          )}
          <section className={panel}>
            <h2 className="font-bold">Members still outstanding</h2>
            {active!.obligations
              .filter((o) => o.roundId === r.id && balances(o).outstanding > 0)
              .map((o) => (
                <div
                  key={o.id}
                  className="flex justify-between gap-4 border-t py-3 mt-2 text-sm"
                >
                  <span>
                    {c.participants.find((p) => p.id === o.memberId)?.name}
                  </span>
                  <strong>{money(balances(o).outstanding)}</strong>
                </div>
              ))}
            {total.outstanding === 0 && (
              <p className="text-sm mt-3">
                All generated required contributions for this Round are
                satisfied.
              </p>
            )}
          </section>
        </>
      )}
      {(group.manualContributions || []).filter(m=>m.cycleId===c.id && owned(m.memberId)).map(m=><section key={m.id} className={panel}><h2 className="font-bold">Manual/offline contribution</h2><p>{money(m.amountMinor)} · {m.review?.state || (m.status === "allocated" ? "Organization confirmed" : m.status === "rejected" ? "Claim could not be verified" : "Contribution requires review")}</p><p className="text-sm"><DisplayDate value={m.paidAt}/> · {m.channel === "ordinary-bank-transfer" ? "Direct Organization bank transfer" : m.channel === "cash" ? "Cash" : "Approved offline rail"}</p><p className="text-sm">Reference {m.reference} · {m.evidence.name}. This is not a provider-confirmed payment.</p></section>)}
      <section className={panel}>
        <h2 className="font-bold">Optional contribution choice history</h2>
        {(p.optionalDecisions || []).filter(d=>d.cycleId===c.id && owned(d.memberId)).map((d,i)=><p key={i} className="text-sm mt-2">{c.participants.find(m=>m.id===d.memberId)?.name} · Round {active?.rounds.find(r=>r.id===d.roundId)?.number} · {d.choice} · {d.at}{d.lockedAt ? " · Final since " + formatDate(d.lockedAt) + " · Confirmed at cutoff " + money(d.confirmedMinorAtCutoff || 0) : ""}</p>)}
      </section>
      <section className={panel}>
        <h2 className="text-xl font-bold">
          {memberId ? "My payment history" : "Confirmed contributions"}
        </h2>
        {priorRecognized > 0 && (
          <p className="text-sm rounded-xl bg-[#F8FAFF] p-4 mt-4">
            Earlier recognized contributions:{" "}
            <strong>{money(priorRecognized)}</strong>. These remain in the
            retained Cycle contribution history; no new provider transaction is
            implied.
          </p>
        )}
        {!transactions.length && (
          <p className="text-sm text-[#536174] mt-3">
            No provider-confirmed contribution payments in this Cycle yet.
          </p>
        )}
        <div className="space-y-3 mt-4">
          {[...transactions].reverse().map((t) => (
            <button
              key={t.id}
              className="w-full border rounded-xl p-4 text-left hover:bg-[#F8FAFF]"
              onClick={() => setReceipt(t.id)}
            >
              <div className="flex justify-between gap-3">
                <strong>{money(t.amountMinor)}</strong>
                <span className="text-sm">
                  {t.holdReason
                    ? "Waiting for Round opening"
                    : t.allocationStatus === "exception"
                      ? "Received · needs attention"
                      : "Confirmed"}
                </span>
              </div>
              <p className="text-sm mt-2">
                {!memberId
                  ? (c.participants.find((p) => p.id === t.memberId)?.name ||
                      "Member") + " · "
                  : ""}
                Round {active?.rounds.find((r) => r.id === t.roundId)?.number} ·{" "}
                <DisplayDate value={t.confirmedAt}/>
              </p>
              <p className="text-xs mt-2 text-[#536174]">
                Applied {money(t.allocatedMinor)}
              </p>
            </button>
          ))}
        </div>
      </section>
      {attempts.some((a) => a.status !== "confirmed") && (
        <section className={panel}>
          <h2 className="font-semibold">
            {memberId ? "Payment attempts" : "Pending / unsuccessful attempts"}
          </h2>
          {attempts
            .filter((a) => a.status !== "confirmed")
            .map((a) => (
              <div key={a.id} className="border-t pt-3 mt-3 text-sm">
                <strong>
                  {money(a.expectedMinor)} · {a.status.replace(/-/g, " ")}
                </strong>
                <p>
                  Round {active?.rounds.find((r) => r.id === a.roundId)?.number}{" "}
                  · <DisplayDate value={a.createdAt}/>
                  {!memberId
                    ? " · " +
                      c.participants.find((p) => p.id === a.memberId)?.name
                    : ""}
                </p>
                {["failed", "expired"].includes(a.status) && (
                  <p>
                    No contribution was satisfied by this attempt. You can try
                    again using the contribution action above.
                  </p>
                )}
              </div>
            ))}
        </section>
      )}
    </div>
  )
}
