import { businessTimestamp } from '../settings/service'
﻿import { useState } from "react"
import { useGroups } from "../groups/GroupContext"
import { useOrganization } from "../organizations/OrganizationContext"
import { useClient } from "../clients/ClientContext"
import { cycleOf, financiallyCommenced, accepted } from "../groups/model"
import { DIRECTORY } from "../groups/seeds"
import { MemberAcceptance } from "../groups/MemberAcceptance"
import { OwnerShell } from "../components/org/OwnerShell"
import { ClientShell, type ClientPageProps } from "../clients/ClientShell"
import { Button, Alert } from "../components/ui"
import { LifecycleHistory } from "./LifecycleHistory"
import { LIFECYCLE_DEMOS, type LifecycleDemo } from "./seeds"
import { emptyLifecycle } from "./model"
import { money } from "../rounds/model"
export function LifecycleDemos() {
  const { createLifecycleDemo } = useGroups(),
    [scenario, setScenario] = useState<LifecycleDemo>(LIFECYCLE_DEMOS[0])
  return (
    <details className="bg-[#EEF2FF] border rounded-xl p-4 mb-5">
      <summary className="font-semibold cursor-pointer">
        Lifecycle demo scenarios
      </summary>
      <p className="text-sm my-3">
        Separate Groups with labelled contribution, payout, regularization and
        recovery sample facts. No money is moved.
      </p>
      <select
        aria-label="Lifecycle scenario"
        className="border rounded p-2 mr-3"
        value={scenario}
        onChange={(e) => setScenario(e.target.value as LifecycleDemo)}
      >
        {LIFECYCLE_DEMOS.map((d) => (
          <option key={d}>{d}</option>
        ))}
      </select>
      <Button size="sm" onClick={() => createLifecycleDemo(scenario)}>
        Add lifecycle demo
      </Button>
    </details>
  )
}
export function LifecycleWorkspace({
  navigate,
  member = false,
}: ClientPageProps & { member?: boolean }) {
  const {
      group,
      error,
      lifecycle,
      continueCycle,
      amendment,
      reviewRecovery,
      eligible,
      act,
      reference,
    } = useGroups(),
    { organization } = useOrganization(),
    { client } = useClient()
  const [selected, setSelected] = useState(""),
    [reason, setReason] = useState(""),
    [confirmed, setConfirmed] = useState(false),
    [days, setDays] = useState(7),
    [amount, setAmount] = useState(""),
    [evidence, setEvidence] = useState(""),
    [absorption, setAbsorption] = useState("0"),
    [incoming, setIncoming] = useState(DIRECTORY[4].id)
  if (!group || !organization || !client)
    return <p className="p-6">Choose a Group to inspect its lifecycle.</p>
  if(!member&&organization.ownerMemberId!==client.id)return <Alert type="error">Organization Owner access required.</Alert>
  const current = cycleOf(group),
    c = group.cycles.find((c) => c.id === selected) || (member?[...group.cycles].reverse().find(c=>c.participants.some(p=>p.id===client.id)):undefined) || current,
    l = group.lifecycle || emptyLifecycle(),
    owner = !member && organization.ownerMemberId === client.id,
    memberId = member ? client.id : undefined
  const visible = group.cycles.filter(
    (c) =>
      owner ||
      c.participants.some((p) => p.id === client.id) ||
      c.activationHistory?.some((h) =>
        h.snapshot.participants.some((p) => p.id === client.id),
      ),
  )
  const allowed = owner || visible.some((v) => v.id === c.id),
    live = c.id === current.id,
    me = c.participants.find((p) => p.id === client.id),
    exits = l.exits.filter(
      (e) => e.cycleId === c.id && (!member || e.memberId === client.id),
    ),
    replacements = l.replacements.filter(
      (r) =>
        r.cycleId === c.id &&
        (!member ||
          r.incomingMemberId === client.id ||
          r.outgoingMemberId === client.id),
    )
  const panel = "bg-white border border-[#E2E6F0] rounded-xl p-5 space-y-3"
  const body = (
    <div className="p-5 lg:p-8 space-y-5">
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-2xl font-bold">{group.name} · Lifecycle</h1>
        <Button
          size="sm"
          variant="secondary"
          onClick={() => navigate(member ? "my-groups" : "owner-groups")}
        >
          All Groups
        </Button>
        {current.status === "activated" && (
          <Button
            size="sm"
            onClick={() => navigate(member ? "group-detail" : "owner-cycles")}
          >
            Active Cycle
          </Button>
        )}
      </div>
      {owner && <LifecycleDemos />}
      {error && <Alert type="error">{error}</Alert>}
      {l.termination && (
        <Alert type="info">
          Group {l.termination.status.replace(/-/g, " ")}.{" "}
          {l.termination.reason} Historical Cycles remain visible.
        </Alert>
      )}
      <label className="block text-sm">
        Cycle record{" "}
        <select
          aria-label="Cycle history"
          className="border rounded p-2 ml-3"
          value={c.id}
          onChange={(e) => {
            setSelected(e.target.value)
            setConfirmed(false)
          }}
        >
          {visible.map((v) => (
            <option key={v.id} value={v.id}>
              Cycle {v.number} · {v.status}
            </option>
          ))}
        </select>
      </label>
      {!allowed ? (
        <Alert type="error">
          This Cycle does not contain your participation.
        </Alert>
      ) : (
        <>
          <LifecycleHistory group={group} cycle={c} memberId={memberId} />
          {c.activationHistory?.map((h, i) => (
            <details key={i} className={panel}>
              <summary>Prior activation {h.at} · retained snapshot</summary>
              <p>
                {h.snapshot.terms.name} · {h.snapshot.terms.amount} per position
                · {h.snapshot.terms.frequency}
              </p>
              {h.snapshot.positions.map((p) => (
                <p key={p.n}>
                  Position {p.n}:{" "}
                  {p.holders
                    .map(
                      (holder) =>
                        (h.snapshot.participants.find(
                          (m) => m.id === holder.memberId,
                        )?.name || holder.memberId) +
                        " (" +
                        holder.fraction +
                        ")",
                    )
                    .join(", ")}
                </p>
              ))}
            </details>
          ))}
          {live && (
            <>
              {c.continuation && (
                <section className={panel}>
                  <h2 className="font-bold">
                    {c.continuation.mode === "rollover"
                      ? "Rollover"
                      : "Start Fresh"}{" "}
                    · preparation required
                  </h2>
                  <p>
                    Every proposed Member must explicitly reconfirm. Deadline:{" "}
                    {c.continuation.reconfirmationDeadline}. No silence-based
                    acceptance.
                  </p>
                  {owner && (
                    <>
                      <Button onClick={() => navigate("owner-group-setup")}>
                        Prepare Cycle
                      </Button>{" "}
                      <Button onClick={() => navigate("owner-group-rules")}>
                        Member commitments
                      </Button>
                      <Button
                        variant="secondary"
                        onClick={() =>
                          reference(c.continuation!.reconfirmationDeadline)
                        }
                      >
                        Demo: advance to reconfirmation deadline
                      </Button>
                      <p className="text-sm">
                        After the window, remove non-responsive Members from the
                        draft and recruit replacements.
                      </p>
                      {c.participants
                        .filter(
                          (p) => p.status === "approved" && !accepted(c, p),
                        )
                        .map((p) => (
                          <div key={p.id}>
                            {p.name} · pending{" "}
                            <Button
                              size="sm"
                              disabled={
                                Date.parse(
                                  c.continuation!.referenceAt ||
                                    businessTimestamp(),
                                ) <
                                Date.parse(
                                  c.continuation!.reconfirmationDeadline,
                                )
                              }
                              onClick={() => act({ type: "remove", id: p.id })}
                            >
                              Remove after window
                            </Button>
                          </div>
                        ))}
                    </>
                  )}
                  {member && me && c.status === "draft" && (
                    <MemberAcceptance key={c.id + me.revision} member={me} />
                  )}
                </section>
              )}
              {member &&
                me &&
                me.status === "approved" &&
                ["draft", "activated"].includes(c.status) &&
                !exits.some(
                  (e) => e.status !== "declined" && e.kind === "early-exit",
                ) && (
                  <section className={panel}>
                    <h2 className="font-bold">
                      {financiallyCommenced(c)
                        ? "Request Early Exit"
                        : "Withdraw before financial commencement"}
                    </h2>
                    {l.payoutFacts.some(
                      (p) =>
                        p.cycleId === c.id &&
                        p.memberId === client.id &&
                        p.status === "received-demo",
                    ) ? (
                      <p>
                        Payout already received. Normal exit and replacement are
                        unavailable; remaining contribution principal stays
                        owed.
                      </p>
                    ) : (
                      <>
                        <p>
                          {financiallyCommenced(c)
                            ? "Organization approval is required. Recognized principal remains tracked separately from penalties and other obligations."
                            : "No Organization approval is required. Your positions will be released and this Cycle will return to preparation."}
                        </p>
                        <input
                          aria-label="Member exit reason"
                          className="border rounded p-2 w-full"
                          value={reason}
                          onChange={(e) => setReason(e.target.value)}
                          placeholder="Reason"
                        />
                        <label className="block">
                          <input
                            type="checkbox"
                            checked={confirmed}
                            onChange={(e) => setConfirmed(e.target.checked)}
                          />{" "}
                          I confirm this participation change.
                        </label>
                        <Button
                          disabled={!confirmed}
                          onClick={() =>
                            lifecycle({
                              type: financiallyCommenced(c)
                                ? "request-exit"
                                : "withdraw",
                              memberId: client.id,
                              reason,
                            })
                          }
                        >
                          {financiallyCommenced(c)
                            ? "Submit Early Exit request"
                            : "Confirm withdrawal"}
                        </Button>
                      </>
                    )}
                  </section>
                )}
              {owner &&
                exits
                  .filter((e) => e.status === "requested")
                  .map((e) => (
                    <section key={e.id} className={panel}>
                      <h2 className="font-bold">Early Exit approval</h2>
                      <p>
                        {e.reason} · recognized principal{" "}
                        {money(e.recognizedContributionsMinor)}. Approval
                        creates a vacancy and an Organization settlement
                        responsibility.
                      </p>
                      <Button
                        onClick={() =>
                          lifecycle({ type: "approve-exit", id: e.id })
                        }
                      >
                        Approve Early Exit
                      </Button>
                    </section>
                  ))}
              {owner &&
                exits
                  .filter(
                    (e) =>
                      e.kind === "early-exit" &&
                      e.status === "approved" &&
                      !replacements.some((r) => r.exitId === e.id),
                  )
                  .map((e) => (
                    <section key={e.id} className={panel}>
                      <h2 className="font-bold">
                        Vacated Positions{" "}
                        {e.positions.map((p) => p.n).join(", ")}
                      </h2>
                      <p>
                        Remaining Members continue. The original payout
                        structure and history remain retained; the vacancy's
                        funding requirement is unresolved until regularized.
                        Exit settlement remains the Organization's
                        responsibility.
                      </p>
                      <select
                        aria-label="Replacement Member"
                        className="border p-2 rounded"
                        value={incoming}
                        onChange={(e) => setIncoming(e.target.value)}
                      >
                        {DIRECTORY.filter(
                          (p) => !c.participants.some((m) => m.id === p.id),
                        ).map((p) => (
                          <option
                            key={p.id}
                            value={p.id}
                            disabled={!eligible(p.id)}
                          >
                            {p.name}
                            {eligible(p.id)
                              ? ""
                              : " · not eligible for new commitments"}
                          </option>
                        ))}
                      </select>
                      <Button
                        onClick={() => {
                          const p = DIRECTORY.find((p) => p.id === incoming)!
                          lifecycle({
                            type: "replace",
                            id: e.id,
                            incoming: {
                              ...p,
                              status: "approved",
                              equivalent: e.positions.reduce(
                                (s, p) =>
                                  s +
                                  p.holders.reduce((v, h) => v + h.fraction, 0),
                                0,
                              ),
                              revision: 0,
                              acceptances: [],
                              reminderSent: false,
                            },
                          })
                        }}
                      >
                        Propose replacement
                      </Button>
                    </section>
                  ))}
              {member &&
                replacements
                  .filter(
                    (r) => r.incomingMemberId === client.id && !r.acceptance,
                  )
                  .map((r) => (
                    <section key={r.id} className={panel}>
                      <h2 className="font-bold">
                        Review replacement commitment
                      </h2>
                      <p>
                        {r.terms.frequency} · {money(r.terms.amount * 100)} per
                        full position · Positions{" "}
                        {r.positions.map((p) => p.n).join(", ")} · required
                        historical regularization{" "}
                        {money(r.regularizationRequiredMinor)}.
                      </p>
                      <p>
                        Organization fee:{" "}
                        {r.terms.feeEnabled ? r.terms.feeValue : 0}{" "}
                        {r.terms.feeType === "percentage" ? "%" : "NGN"} per
                        full position. Opening day {r.terms.contributionOpenDay}
                        ; contribution window {r.terms.contributionWindowDays}{" "}
                        days; grace {r.terms.gracePeriodDays} days;{" "}
                        {r.terms.timezone}. Daily penalty:{" "}
                        {r.terms.dailyPenaltyRateBps ?? 0} bps/day (simple required-principal basis). Positions:{" "}
                        {r.positions
                          .map(
                            (p) =>
                              p.n +
                              " (" +
                              p.holders.map((h) => h.fraction).join(",") +
                              ")",
                          )
                          .join(", ")}
                        .
                      </p>
                      <p className="whitespace-pre-line">{r.terms.rules}</p>
                      <p>
                        Acceptance and satisfied regularization are both
                        required. Handover begins at the next eligible Round;
                        historical obligations remain with the outgoing Member.
                      </p>
                      <label>
                        <input
                          type="checkbox"
                          checked={confirmed}
                          onChange={(e) => setConfirmed(e.target.checked)}
                        />{" "}
                        I accept these Cycle terms and Positions.
                      </label>
                      <Button
                        disabled={!confirmed}
                        onClick={() =>
                          lifecycle({
                            type: "accept-replacement",
                            id: r.id,
                            memberId: client.id,
                          })
                        }
                      >
                        Accept replacement commitment
                      </Button>
                    </section>
                  ))}
              {owner && c.status === "activated" && (
                <section className={panel}>
                  <h2 className="font-bold">Rotation completion</h2>
                  <p>
                    All scheduled Rounds must conclude and every payout Position
                    outcome must be resolved. Recovery, exit settlement and
                    disputes may continue separately. Completion does not start
                    another Cycle.
                  </p>
                  <Button onClick={() => lifecycle({ type: "complete" })}>
                    Confirm rotation completion
                  </Button>
                </section>
              )}
              {owner &&
                ["completed", "completed-with-recovery"].includes(c.status) &&
                (!l.termination || l.termination.status === "rejected") && (
                  <section className={panel}>
                    <h2 className="font-bold">Choose the next Cycle</h2>
                    <p>
                      Rollover proposes the previous configuration and eligible
                      roster. Start Fresh opens a new draft. Both retain this
                      Cycle and require readiness and explicit Member
                      acceptance.
                    </p>
                    <label>
                      Reconfirmation window (days){" "}
                      <input
                        aria-label="Reconfirmation days"
                        className="border p-2 w-20 rounded"
                        type="number"
                        min="1"
                        max="90"
                        value={days}
                        onChange={(e) => setDays(Number(e.target.value))}
                      />
                    </label>
                    <div className="flex gap-3">
                      <Button
                        onClick={() => {
                          if (continueCycle("rollover", days)) setSelected("")
                        }}
                      >
                        Rollover
                      </Button>
                      <Button
                        variant="secondary"
                        onClick={() => {
                          if (continueCycle("fresh", days)) setSelected("")
                        }}
                      >
                        Start Fresh
                      </Button>
                    </div>
                  </section>
                )}
              {owner && c.status === "activated" && financiallyCommenced(c) && (
                <section className={panel}>
                  <h2 className="font-bold">Controlled Cycle Amendment</h2>
                  <p>
                    Exceptional proposal only. Affected Members must consent
                    before TCS review; accepted Cycle terms stay unchanged.
                  </p>
                  <input
                    aria-label="Proposed contribution amount"
                    className="border rounded p-2"
                    type="number"
                    placeholder="Proposed full-position contribution"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                  />
                  <textarea
                    aria-label="Amendment reason"
                    className="border rounded p-2 w-full"
                    placeholder="Reason for exceptional change"
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                  />
                  <Button onClick={() => amendment(reason, Number(amount))}>
                    Request amendment
                  </Button>
                </section>
              )}
            </>
          )}
          {l.amendments
            .filter(
              (a) =>
                a.cycleId === c.id &&
                (owner || a.affectedMemberIds.includes(client.id)),
            )
            .map((a) => (
              <section key={a.id} className={panel}>
                <h2 className="font-bold">
                  Amendment · {a.status.replace(/-/g, " ")}
                </h2>
                <p>
                  {a.reason} · proposed contribution{" "}
                  {money(a.proposedTerms.amount * 100)} · {a.consents.length}/
                  {a.affectedMemberIds.length} consents. {a.review?.state || "TCS review remains required."} {a.review?.publicMessage}
                </p>
                {member && !["rejected","effective"].includes(a.status) && c.status === "activated" &&
                  live &&
                  !a.consents.some((s) => s.memberId === client.id) && (
                    <>
                      <label>
                        <input
                          type="checkbox"
                          checked={confirmed}
                          onChange={(e) => setConfirmed(e.target.checked)}
                        />{" "}
                        I consent to this proposed amendment.
                      </label>
                      <Button
                        disabled={!confirmed}
                        onClick={() =>
                          lifecycle({
                            type: "consent-amendment",
                            id: a.id,
                            memberId: client.id,
                          })
                        }
                      >
                        Record my consent
                      </Button>
                    </>
                  )}
              </section>
            ))}
          {owner &&
            l.recoveries
              .filter(
                (r) => r.cycleId === c.id && r.status === "awaiting-review",
              )
              .map((r) => (
                <section key={r.id} className={panel}>
                  <h2 className="font-bold">Recovery review</h2>
                  <p>
                    Review the cleared sample balance before resolving the case
                    and removing the new-commitment restriction. Default history
                    stays retained.
                  </p>
                  <Button onClick={() => reviewRecovery(r.id)}>
                    Review and resolve cleared recovery
                  </Button>
                </section>
              ))}
          {l.disputes
            .filter(
              (d) =>
                d.cycleId === c.id &&
                d.status === "open" &&
                (owner || exits.some((e) => e.settlement.escalatedAt)),
            )
            .map((d) => (
              <Alert key={d.id} type="error">
                Organization case · {d.kind.replace(/-/g, " ")} · {d.reason}
              </Alert>
            ))}
          {l.forceCloseRequests
            .filter(
              (r) =>
                r.cycleId === c.id &&
                (owner || r.affectedMemberIds.includes(client.id)),
            )
            .map((r) => (
              <section key={r.id} className={panel}>
                <h2 className="font-bold">
                  Force Close ·{" "}
                  {r.review?.state || (r.status === "approved-demo" ? "approved seeded outcome" : "pending TCS review")}
                </h2>
                <p>
                  {r.reason}.{" "}
                  {r.review?.publicMessage || (r.status === "approved" || r.status === "approved-demo" ? "Approval retained; outstanding balances remain visible." : "No financial resolution has occurred.")}
                </p>
                {owner && (
                  <>
                    <p>
                      Evidence: {r.evidenceReference}. Proposed absorption:{" "}
                      {money(r.requestedAbsorptionMinor)} (not applied).
                    </p>
                    <p>
                      Principal {money(r.balances.principalMinor)} · penalty{" "}
                      {money(r.balances.penaltyMinor)} · unpaid payout{" "}
                      {money(r.balances.unpaidPayoutMinor)} · exit settlements{" "}
                      {money(r.balances.exitSettlementMinor)} · recovery{" "}
                      {money(r.balances.recoveryMinor)} · disputes{" "}
                      {r.balances.disputes.length}. Recovery may include the
                      same principal; these figures are not additive.
                    </p>
                  </>
                )}
              </section>
            ))}
          {owner && live && (!l.termination || l.termination.status === "rejected") && (
            <details className="owner-exception"><summary>Exceptional closure and termination</summary><div>
              <h2 className="font-bold">Closure boundaries</h2>
              <textarea
                aria-label="Closure reason"
                className="border rounded p-2 w-full"
                placeholder="Reason for closure request"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
              />
              {c.status === "activated" && (
                <>
                  <input
                    aria-label="Evidence reference"
                    className="border rounded p-2"
                    placeholder="Evidence / approval reference"
                    value={evidence}
                    onChange={(e) => setEvidence(e.target.value)}
                  />
                  <label>
                    Proposed absorption (NGN){" "}
                    <input
                      aria-label="Proposed absorption"
                      className="border rounded p-2"
                      type="number"
                      value={absorption}
                      onChange={(e) => setAbsorption(e.target.value)}
                    />
                  </label>
                  <Button
                    onClick={() =>
                      lifecycle({
                        type: "force-close",
                        reason,
                        evidence,
                        absorptionMinor: Number(absorption) * 100,
                      })
                    }
                  >
                    Request Force Close review
                  </Button>
                </>
              )}
              <p>
                Normal termination requires no live financially active Cycle and
                no unresolved financial cases. Otherwise the Group stays pending
                TCS review. Historical records are never deleted.
              </p>
              <label className="block">
                <input
                  type="checkbox"
                  checked={confirmed}
                  onChange={(e) => setConfirmed(e.target.checked)}
                />{" "}
                I confirm the Group termination request.
              </label>
              <Button
                disabled={!confirmed}
                variant="secondary"
                onClick={() => lifecycle({ type: "terminate", reason })}
              >
                Terminate Group / request review
              </Button>
            </div></details>
          )}
        </>
      )}
    </div>
  )
  return member ? (
    <ClientShell navigate={navigate} active="groups">
      <div className="member-financial">{body}</div>
    </ClientShell>
  ) : (
    <OwnerShell navigate={navigate} activeView="owner-groups">
      {body}
    </OwnerShell>
  )
}
