import { DisplayDate } from '../design/foundation'
import {RevenuePanel} from "./RevenuePanel"
import type {RevenuePaymentInput} from "./revenue"
import { useState } from "react"
import type { Organization } from "../organizations/model"
import type { ThriftGroup } from "../groups/model"
import { cycleOf } from "../groups/model"
import { money, balances } from "../rounds/model"
import { parsePaymentAmount } from "../payments/model"
import type { ReconciliationState } from "./model"
import type { ManualInput } from "./manual"
import { Button, Alert } from "../components/ui"
import { OrganizationBrand } from "../organizations/OrganizationBrand"
const panel = "bg-white rounded-2xl border border-[#E2E6F0] p-5 sm:p-6"
const status = (value: string) =>
  ({
    "partially-matched": "Partially matched",
    "review-required": "Review required",
    "under-review": "Under review",
    "late-optional": "Late optional contribution",
    "amount-mismatch": "Amount mismatch",
  })[value] || value.replace(/-/g, " ")
export function ReconciliationBody({
  organization,
  groups,
  state,
  selected,
  onManual,
  onRevenuePayment,
  onHandoff,
}: {
  organization: Organization
  groups: ThriftGroup[]
  state: ReconciliationState
  selected?: ThriftGroup
  onRevenuePayment?: (id:string,input:RevenuePaymentInput)=>boolean
  onManual?: (input: ManualInput) => boolean
  onHandoff?: (id: string, reason: string) => boolean
}) {
  const [note, setNote] = useState("")
  if (
    state.organizationId !== organization.id ||
    groups.some((g) => g.organizationId !== organization.id)
  )
    return (
      <Alert type="error">Organization financial records are isolated.</Alert>
    )
  const open = state.cases.filter((c) => c.status !== "resolved"),
    gross = state.expectations.reduce((s, e) => s + e.grossMinor, 0),
    pending = state.expectations.reduce(
      (s, e) => s + e.grossMinor - e.matchedGrossMinor,
      0,
    )
  const fees = state.settlements.reduce((s, b) => s + b.processingFeeMinor, 0),
    net = state.settlements.reduce((s, b) => s + b.netMinor, 0),
    due = state.receivables
      .filter((r) => r.status !== "settled")
      .reduce((s, r) => s + r.amountMinor, 0)
  return (
    <div className="space-y-5">
      <header className={panel}>
        <OrganizationBrand form={organization.form} />
        <h1 className="text-2xl font-bold mt-5">Settlement & reconciliation</h1>
        <p className="text-sm mt-2 text-[#536174]">
          Confirmed contributions, provider settlement and items needing
          attention.
        </p>
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mt-5">
          {[
            ["Gross confirmed", gross],
            ["Awaiting matched settlement · gross", pending],
            ["Provider processing cost", fees],
            ["Net settlement reported", net],
            ["TCS share outstanding", due],
          ].map(([label, value]) => (
            <div key={String(label)}>
              <p className="text-xs text-[#536174]">{label}</p>
              <p className="text-xl font-bold mt-1">{money(Number(value))}</p>
            </div>
          ))}
        </div>
        <p className="text-sm mt-4">
          Provider costs are Organization operating expenses. They do not reduce
          Member contributions, Round collection or payout entitlement. Normal
          pending settlement does not block payout readiness.
        </p>
      </header>
      {state.receivables.some((r) => r.status === "restricted") && (
        <Alert type="warning">
          New Group activation and new financial commencement are restricted by
          unpaid TCS revenue share. Existing contributions, payouts and
          lifecycle actions continue.
        </Alert>
      )}
      <section className={panel}>
        <h2 className="text-xl font-bold">
          Items requiring attention · {open.length}
        </h2>
        {!open.length && (
          <p className="text-sm mt-3">
            No reconciliation cases currently require review.
          </p>
        )}
        {open.map((c) => (
          <details key={c.id} className="border-t mt-4 pt-4">
            <summary className="cursor-pointer font-semibold">
              {status(c.kind)} · {money(c.amountMinor)} · {status(c.status)}
            </summary>
            <p className="text-sm mt-3">{c.reason}</p>
            <p className="text-sm mt-2">
              {groups.find((g) => g.id === c.groupId)?.name ||
                organization.form.name}
              {c.memberId
                ? " · Member " +
                  (groups
                    .flatMap((g) => g.cycles.flatMap((c) => c.participants))
                    .find((m) => m.id === c.memberId)?.name || c.memberId)
                : ""}
            </p>
            <p className="text-xs break-all mt-2">
              Case {c.id} · {c.createdAt}
              {c.sourceReference ? " · Reference " + c.sourceReference : ""}
            </p>
            {c.evidence && (
              <p className="text-sm mt-2">Evidence: {c.evidence.name}</p>
            )}
            <details className="text-xs mt-3">
              <summary>Linked financial context and audit</summary>
              {[
                c.cycleId,
                c.roundId,
                c.transactionId,
                c.settlementId,
                c.payoutId,
                c.obligationId,
                c.lifecycleId,
              ]
                .filter(Boolean)
                .map((id, i) => (
                  <p key={i} className="break-all mt-1">
                    {id}
                  </p>
                ))}
              {c.history.map((h, i) => (
                <p key={i} className="mt-2">
                  {h.at} · {h.actor} · {h.action}
                  {h.reason ? " · " + h.reason : ""}
                  {h.before
                    ? " · " + status(h.before) + " → " + status(h.after || "")
                    : ""}
                </p>
              ))}
            </details>
            {onHandoff && (
              <div className="flex gap-2 mt-3">
                <input
                  aria-label="Operations handoff context"
                  className="border rounded-lg p-2 flex-1"
                  placeholder="Context for Operations"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                />
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => {
                    if (onHandoff(c.id, note)) setNote("")
                  }}
                >
                  Submit context
                </Button>
              </div>
            )}
          </details>
        ))}
        <p className="text-xs mt-4 text-[#536174]">
          Cases retain their original money records for Operations. No refund,
          reallocation or internal approval is performed here.
        </p>
      </section>
      <section className={panel}>
        <h2 className="text-xl font-bold">Provider settlements</h2>
        {!state.settlements.length && (
          <p className="text-sm mt-3">
            No provider settlement records received yet.
          </p>
        )}
        {state.settlements.map((b) => (
          <details key={b.id} className="border-t mt-4 pt-4">
            <summary className="cursor-pointer font-semibold">
              {money(b.netMinor)} · {status(b.status)} · {b.settledAt}
            </summary>
            <div className="grid sm:grid-cols-2 gap-2 text-sm mt-3">
              <p>Gross {money(b.grossMinor)}</p>
              <p>Provider fee {money(b.processingFeeMinor)}</p>
              <p>
                Other deductions {money(b.otherDeductionsMinor)}{" "}
                {b.deductionReason}
              </p>
              <p>
                Expected net from reported deductions{" "}
                {money(
                  b.grossMinor - b.processingFeeMinor - b.otherDeductionsMinor,
                )}
              </p>
              <p>Actual net {money(b.netMinor)}</p>
              <p>Variance {money(b.varianceMinor)}</p>
            </div>
            <p className="text-sm mt-3">
              Settlement destination at the time: {b.destination.bankName} ·{" "}
              {b.destination.accountNumber} · {b.destination.resolvedName}
            </p>
            <p className="text-xs mt-2 break-all">
              {b.provider} · {b.reference} · {b.lines.length} payment references
              · {b.matchedTransactionIds.length} matched transactions
            </p>
            <div className="text-xs mt-3">
              {b.history.map((h, i) => (
                <p key={i}>
                  {h.at} · {h.action} · {status(h.after || "")}
                </p>
              ))}
            </div>
          </details>
        ))}
      </section>
      <section className={panel}>
        <h2 className="text-xl font-bold">Expected settlement</h2>
        <p className="text-sm mt-2">
          Expected cost is shown only where an explicit provider policy is
          available.
        </p>
        {state.expectations.map((e) => (
          <div key={e.transactionId} className="border-t mt-3 pt-3 text-sm">
            <p className="font-semibold">
              {money(e.grossMinor)} · {status(e.status)}
            </p>
            <p>
              Expected provider fee{" "}
              {e.expectedFeeMinor === undefined
                ? "Not configured"
                : money(e.expectedFeeMinor)}{" "}
              · expected net{" "}
              {e.expectedNetMinor === undefined
                ? "Not configured"
                : money(e.expectedNetMinor)}
            </p>
            <p>
              Gross matched {money(e.matchedGrossMinor)}
              {e.dueAt
                ? " · Expected by " + e.dueAt
                : " · Settlement timing not configured"}
            </p>
            <p className="text-xs break-all mt-1">{e.providerReference}</p>
            <p className="text-sm mt-2">
              Contribution allocated {money(groups.flatMap(g => g.payments?.transactions || []).find(t => t.id === e.transactionId)?.allocatedMinor || 0)}
              {" · Provider confirmed "}<DisplayDate value={e.confirmedAt}/>
            </p>
          </div>
        ))}
      </section>
      {groups.some(g => g.manualContributions?.length) && (
        <section className={panel}>
          <h2 className="text-xl font-bold">Manual/offline receipts</h2>
          {groups.flatMap(g => (g.manualContributions || []).map(m => (
            <div key={m.id} className="border-t mt-3 pt-3 text-sm">
              <p className="font-semibold">{money(m.amountMinor)} · {m.status === "allocated" ? "Organization confirmed" : "Review required"}</p>
              <p>{g.name} · {g.cycles.flatMap(c => c.participants).find(p => p.id === m.memberId)?.name} · <DisplayDate value={m.paidAt}/></p>
              <p>{m.channel === "ordinary-bank-transfer" ? "Direct Organization bank transfer" : m.channel === "cash" ? "Cash" : "Approved offline rail"} · Reference {m.reference}</p>
              <p>Allocated {money(m.allocatedMinor)} · Evidence {m.evidence.name}</p>
              <p>{m.reason} · Recorded by {m.actorId} at <DisplayDate value={m.recordedAt}/></p>
              <p>Organization-confirmed manual source; no provider settlement is implied.</p>
            </div>
          )))}
        </section>
      )}
      {selected &&
        onManual &&
        (selected.manualPolicy || state.policy)?.manual !== "off" &&
        (selected.manualPolicy || state.policy) && (
          <ManualForm
            key={selected.id}
            group={selected}
            at={state.referenceAt!}
            onRecord={onManual}
          />
        )}
      <RevenuePanel state={state} onRecord={onRevenuePayment}/>
      {state.cases.some((c) => c.status === "resolved") && (
        <section className={panel}>
          <h2 className="font-bold">Resolved reconciliation history</h2>
          {state.cases
            .filter((c) => c.status === "resolved")
            .map((c) => (
              <p key={c.id} className="text-sm mt-2">
                {status(c.kind)} · {money(c.amountMinor)} · {c.reason} ·{" "}
                {c.history.at(-1)?.action}
              </p>
            ))}
        </section>
      )}
    </div>
  )
}
function ManualForm({
  group,
  at,
  onRecord,
}: {
  group: ThriftGroup
  at: string
  onRecord: (input: ManualInput) => boolean
}) {
  const c = cycleOf(group),
    obligations = c.active?.obligations || [],
    [target, setTarget] = useState(
      obligations.find((o) => balances(o).outstanding > 0)?.id || "",
    ),
    [amount, setAmount] = useState(""),
    [reason, setReason] = useState(""),
    [reference, setReference] = useState(""),
    [channel, setChannel] = useState<ManualInput["channel"]>(
      "ordinary-bank-transfer",
    ),
    [evidence, setEvidence] = useState<ManualInput["evidence"]>(),
    [error, setError] = useState("")
  const [paidAt, setPaidAt] = useState(at.slice(0, -1)),
    o = obligations.find((o) => o.id === target)
  return (
    <details className={panel}>
      <summary className="font-bold cursor-pointer">
        Record permitted manual/offline receipt
      </summary>
      <p className="text-sm mt-3">
        This Group has explicit demo permission. Ordinary bank transfers and
        cash are Organization-confirmed receipts, not provider verification.
        Review-required and Owner-benefiting receipts do not satisfy obligations
        before independent review.
      </p>
      {error && <Alert type="error">{error}</Alert>}
      <div className="grid sm:grid-cols-2 gap-3 my-4">
        <label className="text-sm">
          Contribution
          <select
            className="block border rounded p-2 w-full"
            value={target}
            onChange={(e) => setTarget(e.target.value)}
          >
            {obligations.map((o) => (
              <option key={o.id} value={o.id}>
                {c.participants.find((m) => m.id === o.memberId)?.name} · Round{" "}
                {c.active?.rounds.find((r) => r.id === o.roundId)?.number} ·
                Required {money(balances(o).outstanding)}
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm">
          Amount (NGN)
          <input
            className="block border rounded p-2 w-full"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
        </label>
        <label className="text-sm">
          Payment date/time (UTC)
          <input
            type="datetime-local"
            step="0.001"
            className="block border rounded p-2 w-full"
            value={paidAt}
            onChange={(e) => setPaidAt(e.target.value)}
          />
        </label>
        <label className="text-sm">
          Channel
          <select
            className="block border rounded p-2 w-full"
            value={channel}
            onChange={(e) =>
              setChannel(e.target.value as ManualInput["channel"])
            }
          >
            <option value="ordinary-bank-transfer">
              Ordinary Organization bank transfer
            </option>
            <option value="cash">Cash</option>
            <option value="approved-offline">Approved offline rail</option>
          </select>
        </label>
        <label className="text-sm">
          Reference / receipt number
          <input
            className="block border rounded p-2 w-full"
            value={reference}
            onChange={(e) => setReference(e.target.value)}
          />
        </label>
        <label className="text-sm">
          Reason for manual receipt
          <input
            className="block border rounded p-2 w-full"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          />
        </label>
        <label className="text-sm">
          Evidence / receipt
          <input
            type="file"
            className="block mt-2"
            onChange={(e) => {
              const f = e.target.files?.[0]
              setEvidence(
                f
                  ? { name: f.name, type: f.type, size: f.size, file: f }
                  : undefined,
              )
            }}
          />
        </label>
      </div>
      <Button
        onClick={() => {
          try {
            if (!o || !evidence)
              throw Error("Select an obligation and attach evidence.")
            onRecord({
              cycleId: c.id,
              roundId: o.roundId,
              memberId: o.memberId,
              amountMinor: parsePaymentAmount(amount),
              paidAt: new Date(paidAt + "Z").toISOString(),
              reference,
              reason,
              evidence,
              channel,
            })
            setError("")
          } catch (e) {
            setError(e instanceof Error ? e.message : "Check receipt details.")
          }
        }}
      >
        Record Organization receipt
      </Button>
    </details>
  )
}
