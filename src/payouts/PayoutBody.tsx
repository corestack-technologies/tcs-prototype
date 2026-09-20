import { formatDate } from '../design/format'
import { DisplayDate } from '../design/foundation'
import { finalRecognition } from '../reconciliation/evidencedRevenue'
import {optionalDecision} from "../payments/optional"
﻿import { useState } from "react"
import type { ThriftGroup } from "../groups/model"
import { cycleOf } from "../groups/model"
import type { Organization } from "../organizations/model"
import { OrganizationBrand } from "../organizations/OrganizationBrand"
import { money, collection } from "../rounds/model"
import { Button, Alert } from "../components/ui"
import { parsePaymentAmount } from "../payments/model"
import { payoutTotals, payoutAmounts, payoutReady } from "./math"
import type { PayoutRecord, BankDirectory, PayoutPolicy } from "./model"
import type { PayoutAction } from "./service"
const panel = "bg-white rounded-2xl border border-[#E2E6F0] p-5 sm:p-6"
const statusLabel = (p: PayoutRecord) =>
  p.status === "completed-window-elapsed"
    ? "Completed — confirmation window elapsed"
    : p.status === "completed-member-confirmed"
      ? "Completed — Member confirmed"
      : p.status.replace(/-/g, " ")
export function PayoutCard({
  group,
  record,
  owner,
  onAction,
}: {
  group: ThriftGroup
  record: PayoutRecord
  owner: boolean
  onAction?: (a: PayoutAction) => boolean
}) {
  const [amount, setAmount] = useState(""),
    [reference, setReference] = useState(""),
    [partial, setPartial] = useState(false),
    [reason, setReason] = useState(""),
    [plan, setPlan] = useState(""),
    [completion, setCompletion] = useState(""),
    [evidence, setEvidence] = useState<File | null>(null),
    [ack, setAck] = useState(false),
    [problem, setProblem] = useState(""),
    [error, setError] = useState("")
  const p = record,
    i = p.instructions[p.instructions.length - 1],
    totals = payoutTotals(p),
    c = group.cycles.find((c) => c.id === p.cycleId)!,
    r = c.active!.rounds.find((r) => r.id === p.roundId)!,
    at = group.payouts!.referenceAt!,
    [transferAt, setTransferAt] = useState(
      new Date(at).toISOString().slice(0, -1),
    ),
    live = c.status === "activated"
  const submit = () => {
    try {
      setError("")
      onAction?.({
        type: "record",
        payoutId: p.id,
        instructionId: i.id,
        amountMinor: parsePaymentAmount(amount),
        transferredAt: new Date(transferAt + "Z").toISOString(),
        reference,
        notes: reason,
        partial,
        partialReason: reason,
        completionPlan: plan,
        expectedCompletionAt: completion
          ? new Date(completion + "Z").toISOString()
          : undefined,
        evidence: evidence
          ? {
              name: evidence.name,
              type: evidence.type,
              size: evidence.size,
              file: evidence,
            }
          : undefined,
        acknowledged: ack,
      })
    } catch (e) {
      setError(e instanceof Error ? e.message : "Check the transfer details.")
    }
  }
  return (
    <article className={panel}>
      <div className="flex flex-wrap justify-between gap-3">
        <div>
          <h2 className="font-bold text-xl">{p.beneficiaryName}</h2>
          {optionalDecision(group,c.id,r.id,p.memberId)?.lockedAt && <p className="text-sm">Confirmed optional amount at execution: {money(optionalDecision(group,c.id,r.id,p.memberId)?.confirmedMinorAtCutoff || 0)}. Later funds do not increase this payout.</p>}
          <p className="text-sm">Optional contribution: {optionalDecision(group,c.id,r.id,p.memberId)?.choice || "Member choice pending"}{optionalDecision(group,c.id,r.id,p.memberId)?.lockedAt ? " · Final — payout execution begun" : ""}</p>
          <p className="text-sm text-[#536174] mt-1">
            Cycle {c.number} · Round {r.number} · Position {p.position} (
            {p.fraction} share)
          </p>
        </div>
        <span className="text-sm font-semibold">{statusLabel(p)}</span>
      </div>
      <p className="text-sm mt-3">Scheduled payout target: <DisplayDate value={p.targetAt}/></p>
      {i ? (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 my-5">
            {[
              { label: "Scheduled Payout Value", value: i.scheduledValueMinor },
              {
                label: "Your scheduled entitlement",
                value: i.entitlementMinor,
              },
              {
                label: "Actual Round collection",
                value: i.actualRoundCollectionMinor,
              },
              {
                label: "Collection attributable to you",
                value: i.attributableCollectionMinor,
              },
              { label: "Organization Fee", value: i.feeMinor },
              { label: "Net payout due", value: i.netMinor },
            ].map((v) => (
              <div key={v.label}>
                <p className="text-xs text-[#536174]">{v.label}</p>
                <p className="text-lg font-bold tabular-nums mt-1">
                  {money(v.value)}
                </p>
              </div>
            ))}
          </div>
          <div className="rounded-xl bg-[#F8FAFF] p-4">
            <p className="text-xs font-semibold">
              BENEFICIARY BANK · INSTRUCTION SNAPSHOT
            </p>
            <p className="font-semibold mt-2">
              {i.bank.bankName} · {i.bank.accountNumber}
            </p>
            <p className="text-sm">{i.bank.resolvedName}</p>
            <p className="text-xs mt-2">
              Prepared <DisplayDate value={i.at}/>. Bank details on recorded transfers never change.
            </p>
          </div>
          {i.status === "stale" && (
            <Alert type="warning">
              This instruction is stale. {i.staleReason} A newly validated
              instruction is required before another transfer is recorded.
            </Alert>
          )}
          <div className="flex flex-wrap gap-6 my-5">
            <div>
              <p className="text-sm">Organization-recorded transfers</p>
              <strong className="text-xl tabular-nums">
                {money(totals.paid)}
              </strong>
            </div>
            <div>
              <p className="text-sm">Outstanding payout balance</p>
              <strong className="text-xl tabular-nums">
                {money(totals.outstanding)}
              </strong>
            </div>
          </div>
          {owner && (
            <p className="text-xs text-[#536174]">
              Original recorded Organization Fee across installments:{" "}
              {money(totals.recognizedFee)}. TCS share attributable to that fee:{" "}
              {money(totals.tcsShare)}; no additional Member fee or
              revenue-share settlement.
            </p>
          )}
        </>
      ) : (
        <Alert type="info">
          An instruction needs validated Member bank details and any applicable
          financial policy. No transfer can be recorded against incomplete
          details.
        </Alert>
      )}
      {p.installments.map(t=>{const outcome=finalRecognition(p,t.id);return outcome?<p key={outcome.id} className="text-sm mt-3 rounded-lg bg-blue-50 p-3">Final Operations evidence: received {money(outcome.receivedMinor)}. Organization Fee recognized {money(outcome.organizationFeeMinor)}; TCS share {money(outcome.tcsShareMinor)}. Original transfer and postings remain retained; differences require financial adjustment review.</p>:null})}
      {p.calculationChanged && (
        <Alert type="warning">{p.calculationChanged}</Alert>
      )}
      {p.breach && (
        <Alert type="warning">
          Organization payout breach · {money(p.breach.amountMinor)} outstanding
          when identified. Due boundary <DisplayDate value={p.breach.dueAt}/>. Breach age:{" "}
          {Math.max(
            0,
            Math.floor((Date.parse(at) - Date.parse(p.breach.dueAt)) / 3600000),
          )}{" "}
          hours. {p.breach.status} case {p.breach.caseId}; no TCS reimbursement is implied.
        </Alert>
      )}
      {p.review?.publicMessage&&<Alert type="info">Operations: {p.review.publicMessage}</Alert>}
      {p.disputes.map((d) => (
        <Alert type="warning" key={d.id}>
          Payout dispute · {d.reason} · reported <DisplayDate value={d.at}/>. Preserved for
          controlled review. {d.process&&<span className="block mt-2">{d.process.stage}. {d.process.resolutions.at(-1)?.outcome}: evidenced received {money(d.process.resolutions.at(-1)?.receivedMinor||0)}. {d.process.appealDeadline&&<>Appeal deadline <DisplayDate value={d.process.appealDeadline}/>.</>} {d.process.finalizedAt&&<>Finalized <DisplayDate value={d.process.finalizedAt}/>.</>}</span>}
        </Alert>
      ))}
      {onAction&&p.disputes.map(d=><PartyDisputeInput key={d.id} dispute={d} owner={owner} payoutId={p.id} onAction={onAction}/>)}
      {owner && live && onAction && (
        <>
          <Button
            size="sm"
            variant="secondary"
            className="mt-4"
            onClick={() =>
              onAction?.({ type: "refresh-instruction", payoutId: p.id })
            }
          >
            Refresh validated bank instruction
          </Button>
          {i &&
            totals.outstanding > 0 &&
            !p.disputes.some(d=>d.status!=='resolved') &&
            !p.installments.some((t) => t.amountException) && (
              <details className="mt-5 border-t pt-4">
                <summary className="font-bold cursor-pointer">
                  Record transfer from Organization bank
                </summary>
                <p className="text-sm my-3">
                  Transfer outside TCS using your Organization bank. TCS only
                  records it. Paying before provider settlement uses
                  Organization liquidity and leaves that risk with the
                  Organization.
                </p>
                {!p.policy && (
                  <Alert type="info">
                    Configure the prototype confirmation and dispute policy
                    before recording.
                  </Alert>
                )}
                {error && <Alert type="error">{error}</Alert>}
                <div className="grid sm:grid-cols-2 gap-3">
                  <label className="text-sm">
                    Amount transferred (NGN)
                    <input
                      aria-label={"Transfer amount " + p.id}
                      className="block w-full border rounded-lg p-2 mt-1"
                      type="number"
                      min="0.01"
                      step="0.01"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                    />
                  </label>
                  <label className="text-sm">
                    Actual transfer date/time (UTC)
                    <input
                      className="block w-full border rounded-lg p-2 mt-1"
                      type="datetime-local"
                      step="0.001"
                      value={transferAt}
                      onChange={(e) => setTransferAt(e.target.value)}
                    />
                  </label>
                  <label className="text-sm">
                    Bank transfer reference
                    <input
                      className="block w-full border rounded-lg p-2 mt-1"
                      value={reference}
                      onChange={(e) => setReference(e.target.value)}
                    />
                  </label>
                  <label className="text-sm">
                    Transfer receipt / evidence
                    <input
                      className="block w-full mt-2 text-sm"
                      type="file"
                      accept="image/*,.pdf,.txt"
                      onChange={(e) => setEvidence(e.target.files?.[0] || null)}
                    />
                  </label>
                </div>
                <label className="block text-sm mt-4">
                  <input
                    type="checkbox"
                    checked={partial}
                    onChange={(e) => setPartial(e.target.checked)}
                  />{" "}
                  Controlled Partial Payout
                </label>
                <label className="block text-sm mt-3">
                  {partial ? "Reason / authorizer context" : "Notes"}
                  <textarea
                    className="block w-full border rounded-lg p-2 mt-1"
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                  />
                </label>
                {partial && (
                  <>
                    <label className="block text-sm mt-3">
                      Completion plan
                      <input
                        className="block w-full border rounded-lg p-2 mt-1"
                        value={plan}
                        onChange={(e) => setPlan(e.target.value)}
                      />
                    </label>
                    <label className="block text-sm mt-3">
                      Expected completion (UTC)
                      <input
                        className="block border rounded-lg p-2 mt-1"
                        type="datetime-local"
                        value={completion}
                        onChange={(e) => setCompletion(e.target.value)}
                      />
                    </label>
                    <p className="text-xs mt-2">
                      Your Organization identity is recorded as the authorizing
                      actor. Reason, evidence and completion plan are required.
                    </p>
                  </>
                )}
                <label className="block text-sm my-4">
                  <input
                    type="checkbox"
                    checked={ack}
                    onChange={(e) => setAck(e.target.checked)}
                  />{" "}
                  I transferred externally and verified the beneficiary/account
                  snapshot above.
                </label>
                <Button
                  disabled={!ack || !p.policy || i.status === "stale"}
                  onClick={submit}
                >
                  Record transfer
                </Button>
              </details>
            )}
        </>
      )}
      <div className="mt-5 space-y-4">
        {p.installments.map((t) => (
          <section key={t.id} className="border rounded-xl p-4">
            <h3 className="font-bold">
              {money(t.amountMinor)} · {t.status.replace(/-/g, " ")}
            </h3>
            <p className="text-sm mt-2">
              Transfer <DisplayDate value={t.at}/> ·{" "}
              {Date.parse(t.at) < Date.parse(p.targetAt)
                ? "Early payout"
                : Date.parse(t.at) === Date.parse(p.targetAt)
                  ? "On target"
                  : "After target"}
            </p>
            <p className="text-sm break-all">Reference: {t.reference}</p>
            <p className="text-sm mt-2">
              {t.bank.bankName} · {t.bank.accountNumber} · {t.bank.resolvedName}
            </p>
            {t.evidence && (
              <p className="text-xs mt-2">
                Evidence: {t.evidence.name}. Evidence alone does not prove
                receipt.
              </p>
            )}
            {t.partial && (
              <p className="text-sm mt-2">
                Partial payout: {t.partialReason}. Plan: {t.completionPlan} ·
                expected <DisplayDate value={t.expectedCompletionAt}/>.
              </p>
            )}
            {t.amountException && (
              <Alert type="warning">
                Payout amount exception: {t.amountException} The recorded
                transfer is retained for resolution.
              </Alert>
            )}
            <p className="text-sm mt-2">
              {t.status === "member-confirmed"
                ? "Member confirmed " + t.confirmedAt
                : t.status === "window-elapsed"
                  ? "Completed because confirmation window elapsed; no Member confirmation was recorded."
                  : "Recipient confirmation deadline: " + formatDate(t.confirmationDueAt)}
            </p>
            {t.disputeClosesAt && (
              <p className="text-sm mt-2">
                {t.finalizedAt
                  ? "Normal dispute window closed"
                  : "Dispute window remains open until"}{" "}
                <DisplayDate value={t.disputeClosesAt}/>
              </p>
            )}
            {!owner &&
              onAction &&
              ["awaiting-confirmation", "window-elapsed"].includes(t.status) &&
              !t.finalizedAt && (
                <div className="space-y-3 mt-4">
                  <label className="block text-sm">
                    <input
                      type="checkbox"
                      checked={ack}
                      onChange={(e) => setAck(e.target.checked)}
                    />{" "}
                    I am responding about my own receipt of this transfer.
                  </label>
                  {t.status === "awaiting-confirmation" &&
                    !t.amountException && (
                      <Button
                        disabled={!ack}
                        onClick={() =>
                          onAction({
                            type: "confirm",
                            payoutId: p.id,
                            installmentId: t.id,
                            acknowledged: ack,
                          })
                        }
                      >
                        Confirm receipt · {money(t.amountMinor)}
                      </Button>
                    )}
                  <label className="block text-sm">
                    Report a problem
                    <input
                      className="block w-full border rounded-lg p-2 mt-1"
                      placeholder="Not received, wrong amount/account, or another issue"
                      value={problem}
                      onChange={(e) => setProblem(e.target.value)}
                    />
                  </label>
                  <Button
                    variant="secondary"
                    disabled={!ack}
                    onClick={() =>
                      onAction({
                        type: "dispute",
                        payoutId: p.id,
                        installmentId: t.id,
                        acknowledged: ack,
                        reason: problem,
                      })
                    }
                  >
                    Report payout problem
                  </Button>
                </div>
              )}
          </section>
        ))}
      </div>
    </article>
  )
}
export function PayoutBody({
  group,
  organization,
  memberId,
  banks,
  onAction,
}: {
  group: ThriftGroup
  organization: Organization
  memberId?: string
  banks: BankDirectory
  onAction?: (action: PayoutAction) => boolean
}) {
  const [cycleId, setCycleId] = useState(""),
    c =
      group.cycles.find((c) => c.id === cycleId) ||
      (memberId
        ? [...group.cycles]
            .reverse()
            .find((c) => c.participants.some((p) => p.id === memberId))
        : undefined) ||
      cycleOf(group),
    owner = !memberId,
    records = (group.payouts?.records || []).filter(
      (p) => p.cycleId === c.id && (!memberId || p.memberId === memberId),
    )
  const [hours, setHours] = useState(48),
    [disputeHours, setDisputeHours] = useState(168),
    [breachHours, setBreachHours] = useState(48),
    [share, setShare] = useState(10)
  return (
    <div className="space-y-5">
      <header className={panel}>
        <OrganizationBrand form={organization.form} />
        <h1 className="text-2xl font-bold mt-5">
          {memberId ? "My payouts" : "Organization payouts"}
        </h1>
        <p className="text-sm mt-2">
          {group.name} · Organization-performed bank transfers
        </p>
        <label className="block text-sm mt-4">
          Cycle{" "}
          <select
            aria-label="Payout Cycle"
            className="border rounded p-2"
            value={c.id}
            onChange={(e) => setCycleId(e.target.value)}
          >
            {group.cycles
              .filter(
                (c) => owner || c.participants.some((p) => p.id === memberId),
              )
              .map((c) => (
                <option key={c.id} value={c.id}>
                  Cycle {c.number} · {c.status}
                </option>
              ))}
          </select>
        </label>
      </header>
      {owner && !group.payouts?.records.some((p) => p.cycleId === c.id && p.installments.length) && (
        <details className={panel}>
          <summary className="font-semibold cursor-pointer">
            Prototype payout policy · configurable GCT values
          </summary>
          <p className="text-sm mt-3">
            These are explicit demo values, not fixed constitutional deadlines.
            Each transfer retains its policy and confirmation deadlines.
          </p>
          <div className="grid sm:grid-cols-2 gap-3 my-4">
            {[
              {
                label: "Confirmation window (hours)",
                value: hours,
                set: setHours,
              },
              {
                label: "Post-timeout dispute window (hours)",
                value: disputeHours,
                set: setDisputeHours,
              },
              {
                label: "Payout breach delay (hours)",
                value: breachHours,
                set: setBreachHours,
              },
              {
                label: "TCS share of Organization Fee (%)",
                value: share,
                set: setShare,
              },
            ].map((f) => (
              <label key={f.label} className="text-sm">
                {f.label}
                <input
                  type="number"
                  className="block border rounded p-2 w-full"
                  value={f.value}
                  onChange={(e) => f.set(Number(e.target.value))}
                />
              </label>
            ))}
          </div>
          <Button
            onClick={() =>
              onAction?.({
                type: "policy",
                policy: {
                  ...group.payouts?.policy,
                  source: "prototype-policy",
                  confirmationHours: hours,
                  disputeHours,
                  breachHours,
                  tcsSharePercent: share,
                } as PayoutPolicy,
              })
            }
          >
            Use explicit prototype policy
          </Button>
        </details>
      )}
      {records.map((p) => (
        <PayoutCard
          key={p.id}
          group={group}
          record={p}
          owner={owner}
          onAction={onAction}
        />
      ))}
      {(c.active?.rounds || [])
        .filter(
          (r) =>
            !records.some((p) => p.roundId === r.id) &&
            (!memberId || r.beneficiaries.some((b) => b.memberId === memberId)),
        )
        .map((r) => {
          const ready = payoutReady(group, c, r)
          let blocker = ""
          try {
            for (const b of r.beneficiaries)
              payoutAmounts(group, c, r, b.memberId, group.payouts?.policy)
          } catch (e) {
            blocker = e instanceof Error ? e.message : ""
          }
          return (
            <section key={r.id} className={panel}>
              <h2 className="font-bold">
                Round {r.number} · Position {r.position}
              </h2>
              <p className="text-sm mt-2">
                {ready
                  ? "Ready for payout"
                  : "Upcoming / required collection outstanding"}{" "}
                · SPV {money(r.scheduledPayoutValueMinor)} · actual collected{" "}
                {money(collection(r, c.active!).collected)}
              </p>
              <p className="text-sm mt-2">Target <DisplayDate value={r.schedule.payoutTargetAt}/></p>
              {blocker && <p className="text-sm mt-2">{blocker}</p>}
              {r.beneficiaries.some((b) => !banks[b.memberId]) && (
                <p className="text-sm mt-2">
                  Validated beneficiary bank details are required.
                </p>
              )}
            </section>
          )
        })}
      {!c.active && (
        <Alert type="info">
          This Cycle has no active payout schedule. Retained history remains
          available.
        </Alert>
      )}
      {owner && (
        <details className={panel}>
          <summary className="font-semibold cursor-pointer">
            Payout timeline
          </summary>
          {group.history
            .filter((h) =>
              /payout|transfer|recipient|instruction|dispute/i.test(h.action),
            )
            .map((h, i) => (
              <p key={i} className="border-t mt-3 pt-3 text-sm">
                {h.at} · {h.action}
              </p>
            ))}
        </details>
      )}
    </div>
  )
}

function PartyDisputeInput({dispute:d,owner,payoutId,onAction}:{dispute:import('./model').PayoutDispute;owner:boolean;payoutId:string;onAction:(a:PayoutAction)=>boolean}){
 const [statement,setStatement]=useState(''),[evidence,setEvidence]=useState(''),[request,setRequest]=useState('')
 const party=owner?'Organization':'Member',process=d.process
 if(!process||process.stage==='final')return null
 const requests=process.requests.filter(r=>r.party===party)
 return <details className="mt-3 border rounded-lg p-3"><summary className="cursor-pointer font-semibold">Evidence and one appeal</summary>
 {requests.map(r=><p key={r.id} className="text-sm mt-2">{r.requested}. Due {r.deadline}. {r.responses.length?'Response retained':r.missedAt?'Deadline missed; case retained':'Awaiting response'}</p>)}
 <label className="block text-sm mt-3">Statement<textarea className="block border rounded p-2 w-full" value={statement} onChange={e=>setStatement(e.target.value)}/></label>
 <label className="block text-sm mt-3">Evidence reference<input className="block border rounded p-2 w-full" value={evidence} onChange={e=>setEvidence(e.target.value)}/></label>
 {!!requests.length&&<><select aria-label="Evidence request" className="border rounded p-2 mt-3" value={request} onChange={e=>setRequest(e.target.value)}><option value="">Choose request</option>{requests.map(r=><option key={r.id} value={r.id}>{r.requested}</option>)}</select><Button size="sm" variant="secondary" onClick={()=>onAction({type:'evidence-response',payoutId,disputeId:d.id,requestId:request,statement,evidence:[evidence],party})}>Submit evidence response</Button></>}
 {process.stage==='appeal-available'&&!process.appeal&&<Button size="sm" variant="secondary" onClick={()=>onAction({type:'appeal',payoutId,disputeId:d.id,statement,evidence:[evidence],party})}>Submit one appeal</Button>}
 </details>
}
