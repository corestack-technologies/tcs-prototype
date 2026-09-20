import { DisplayDate } from '../design/foundation'
import { useState } from "react"
import { Button, Alert } from "../components/ui"
import { money } from "../rounds/model"
import { parsePaymentAmount } from "../payments/model"
import type { ReconciliationState, RevenueReceivable } from "./model"
import type { RevenuePaymentInput } from "./revenue"
export function RevenuePanel({
  state,
  onRecord,
}: {
  state: ReconciliationState
  onRecord?: (id: string, input: RevenuePaymentInput) => boolean
}) {
  return (
    <section
      id="tcs-revenue-share"
      className="bg-white rounded-2xl border border-[#E2E6F0] p-5 sm:p-6"
    >
      <h2 className="text-xl font-bold">TCS Revenue Share / Fees Due</h2>
      <p className="text-sm mt-2">
        Organization → Corestack/TCS. This is the commercial share of the agreed
        Organization Fee, not another Member deduction. Organization Fees cannot
        be individually reduced or waived.
      </p>
      {state.cases.filter(c=>c.kind==='fee-adjustment').map(c=><div key={c.id} className="border border-amber-300 rounded-lg p-3 mt-4 text-sm"><strong>Fee / Revenue Share Adjustment Required</strong><p>{c.reason}</p><p>Fee difference {money(c.adjustment!.organizationFeeDifferenceMinor)}; TCS share difference {money(c.adjustment!.tcsShareDifferenceMinor)}. Original postings retained; no credit or refund executed.</p></div>)}
      {(state.payoutRecognitions||[]).map(r=><p className="text-sm mt-3" key={r.id}>Final Operations evidence: received {money(r.receivedMinor)}, Organization Fee {money(r.organizationFeeMinor)}, TCS share {money(r.tcsShareMinor)}. {r.at}</p>)}
      {!state.receivables.length && (
        <p className="text-sm mt-4">
          No revenue share is due yet. The applicable payout installment must be
          completed and its Organization Fee recognized.
        </p>
      )}
      {state.receivables.map((r) => (
        <div key={r.id} className="border-t mt-5 pt-5">
          {r.review && <p className="text-sm mb-3">{r.review.state}. {r.review.publicMessage}</p>}
          <div className="flex flex-wrap justify-between gap-2">
            <h3 className="text-xl font-bold">{money(r.amountMinor)}</h3>
            <span className="font-semibold text-sm">
              {r.paymentStatus === "awaiting-confirmation"
                ? "Payment recorded — Awaiting TCS confirmation"
                : r.paymentStatus === "exception"
                  ? "Payment exception — Review required"
                  : r.status === "settled"
                    ? "Settled"
                    : r.status === "restricted"
                      ? "Restricted"
                      : r.status === "overdue"
                        ? "Overdue"
                        : "Due"}
            </span>
          </div>
          <p className="text-sm mt-2">
            Organization Fee recognized {money(r.organizationFeeMinor)} · TCS
            share {r.sharePercent}% · Due since <DisplayDate value={r.dueAt}/>
          </p>
          <p className="text-xs mt-1 break-all">
            Group {r.groupId} · Cycle {r.cycleId} · Payout installment{" "}
            {r.installmentId}
          </p>
          <div className="rounded-xl bg-[#F8FAFF] p-4 mt-3 text-sm space-y-1">
            <p className="font-semibold">{r.account.accountName}</p>
            <p>{r.account.bankName}</p>
            <p>
              Account number: <strong>{r.account.accountNumber}</strong>
            </p>
            <p className="break-all">
              Unique payment reference: <strong>{r.paymentReference}</strong>
            </p>
            <p>
              Exact amount due: <strong>{money(r.amountMinor)}</strong>. Any
              bank transfer charge is your Organization's expense and does not
              reduce this amount.
            </p>
            <p className="text-xs">
              Prototype receiving account. Do not transfer real funds.
            </p>
          </div>
          {r.status !== "settled" && (
            <p className="text-sm mt-3">
              Commercial status: {r.status}.{" "}
              {r.overdueAt
                ? "Overdue threshold " + r.overdueAt
                : "Timing thresholds not configured"}
              {r.restrictedAt
                ? " · Restriction threshold " + r.restrictedAt
                : ""}
              . Recording a transfer does not clear these controls before TCS
              confirmation.
            </p>
          )}
          {!r.payments.length && onRecord && r.status !== "settled" && (
            <RevenueForm
              key={r.id}
              receivable={r}
              at={state.referenceAt || r.dueAt}
              onRecord={onRecord}
            />
          )}
          {r.payments.map((p) => (
            <div key={p.id} className="border rounded-xl p-4 mt-4 text-sm">
              <h4 className="font-bold">Organization payment history</h4>
              <p>
                {money(p.amountMinor)} transferred · <DisplayDate value={p.transferredAt}/>
              </p>
              <p>
                Sending bank {p.bankName} · Transfer reference {p.bankReference}
              </p>
              <p>Organization bank charge {money(p.bankChargeMinor)}</p>
              <p>
                Recorded by {p.recordedBy} at <DisplayDate value={p.recordedAt}/>
              </p>
              {p.evidence && <p>Evidence: {p.evidence.name}</p>}
              <p>
                Receiving account snapshot: {p.account.bankName} ·{" "}
                {p.account.accountNumber} · {p.account.accountName}
              </p>
              <p className="font-semibold mt-2">
                {p.status === "confirmed"
                  ? "TCS confirmed receipt"
                  : p.status === "exception"
                    ? "Amount mismatch: controlled review required"
                    : "Awaiting authorized TCS receipt confirmation"}
              </p>
              {p.confirmedAt && (
                <p>
                  Confirmed by {p.confirmedBy} at <DisplayDate value={p.confirmedAt}/>
                </p>
              )}
            </div>
          ))}
          <details className="text-xs mt-4">
            <summary className="cursor-pointer">
              Revenue-share audit history
            </summary>
            {r.history.map((h, i) => (
              <p key={i} className="mt-2 break-all">
                {h.at} · {h.actor} · {h.action} ·{" "}
                {h.before ? h.before + " → " : ""}
                {h.after}
              </p>
            ))}
          </details>
        </div>
      ))}
      <p className="text-xs mt-4 text-[#536174]">
        Only authorized TCS internal users may confirm receipt. Internal
        confirmation tooling belongs to Operations; it is not an Organization
        action.
      </p>
    </section>
  )
}
function RevenueForm({
  receivable: r,
  at,
  onRecord,
}: {
  receivable: RevenueReceivable
  at: string
  onRecord: (id: string, input: RevenuePaymentInput) => boolean
}) {
  const [amount, setAmount] = useState((r.amountMinor / 100).toFixed(2)),
    [charge, setCharge] = useState("0"),
    [date, setDate] = useState(new Date(at).toISOString().slice(0, -1)),
    [bank, setBank] = useState(""),
    [reference, setReference] = useState(""),
    [evidence, setEvidence] = useState<RevenuePaymentInput["evidence"]>(),
    [error, setError] = useState("")
  return (
    <details className="mt-4">
      <summary className="font-semibold cursor-pointer">Record Payment</summary>
      <p className="text-sm mt-2">
        Record the transfer you made from your Organization's bank. This records
        your declaration; it does not confirm Corestack received the funds.
      </p>
      {error && <Alert type="error">{error}</Alert>}
      <div className="grid sm:grid-cols-2 gap-3 my-3">
        {[
          ["Amount transferred (NGN)", amount, setAmount],
          ["Organization bank charge (NGN)", charge, setCharge],
          ["Sending bank", bank, setBank],
          ["Bank transfer reference", reference, setReference],
        ].map(([label, value, set]) => (
          <label key={String(label)} className="text-sm">
            {String(label)}
            <input
              className="block border rounded-lg p-2 w-full"
              value={String(value)}
              onChange={(e) => {
                const change = set as (v: string) => void
                change(e.target.value)
              }}
            />
          </label>
        ))}
        <label className="text-sm">
          Transfer date/time (UTC)
          <input
            type="datetime-local"
            step="0.001"
            className="block border rounded-lg p-2 w-full"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </label>
        <label className="text-sm">
          Transfer evidence (optional)
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
            const input = {
              amountMinor: parsePaymentAmount(amount),
              bankChargeMinor: parsePaymentAmount(charge),
              transferredAt: new Date(date + "Z").toISOString(),
              bankName: bank,
              bankReference: reference,
              evidence,
            }
            onRecord(r.id, input)
            setError("")
          } catch (e) {
            setError(e instanceof Error ? e.message : "Check transfer details.")
          }
        }}
      >
        Record transfer · Await TCS confirmation
      </Button>
    </details>
  )
}
