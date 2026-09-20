import { PenaltyTerms } from '../penalties/PenaltyTerms'
﻿import { useState } from "react"
import { useDraftGroup } from "./GroupContext"
import {
  BASE_RULES,
  assigned,
  memberTerms,
  feePerPosition,
  accepted,
  reconfirmation,
  type Participant,
} from "./model"
import { Button } from "../components/ui"
export function MemberAcceptance({ member }: { member: Participant }) {
  const { cycle, act } = useDraftGroup(),
    [confirmed, setConfirmed] = useState(false)
  const terms = memberTerms(cycle, member.id),
    t = cycle.terms,
    positions = assigned(cycle, member.id)
  const [reviewedTerms] = useState(terms)
  const money = (n: number) => "₦" + n.toLocaleString()
  return (
    <section
      className="rounded-xl border border-[#C7D2FE] bg-[#F8FAFF] p-4 space-y-3 text-sm"
      aria-label={"Prototype Member response for " + member.name}
    >
      <h3 className="font-bold text-[#1746A2]">
        Prototype Member response · {member.name}
      </h3>
      <p>
        This panel simulates this Member reviewing and accepting. Owner
        admission and reminders do not count as acceptance.
      </p>
      {reconfirmation(cycle, member) && (
        <p className="font-bold text-amber-700">
          Reconfirmation required. Earlier acceptance remains in history.
        </p>
      )}
      <dl className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        <div>
          <dt>Contribution</dt>
          <dd>
            {money(t.amount * member.equivalent)} / {t.frequency} Round (
            {member.equivalent} equivalent positions)
          </dd>
        </div>
        <div>
          <dt>Proposed payout position(s)</dt>
          <dd>
            {positions.map((p) => `${p.position} (${p.fraction})`).join(", ") ||
              "Not assigned"}
          </dd>
        </div>
        <div>
          <dt>Scheduled Payout Value</dt>
          <dd>
            {money(t.amount * t.positions * member.equivalent)} across your
            position holdings
          </dd>
        </div>
        <div>
          <dt>Organization fee</dt>
          <dd>
            {t.feeType === "percentage"
              ? `${t.feeValue}%`
              : `${money(t.feeValue)} per full position, proportional for halves`}{" "}
            · {money(feePerPosition(t) * member.equivalent)} total illustrative
            fee, at payout
          </dd>
        </div>
        <div>
          <dt>Planned start / visibility</dt>
          <dd>
            {t.startDate} · {t.visibility}
          </dd>
        </div>
        <div>
          <dt>Schedule terms</dt>
          <dd>
            {t.frequency === "Monthly"
              ? `Opens day ${t.contributionOpenDay}; due month end`
              : t.frequency === "Daily"
                ? "Due at the end of the assigned day"
                : `${t.contributionWindowDays}-day contribution window`}
            ; {t.frequency === "Daily" ? 0 : t.gracePeriodDays} grace days ·{" "}
            {t.timezone}. Illustrative only; no obligations generated.
          </dd>
        </div>
        <div>
          <dt>Daily penalty and Post-Payout Default</dt>
          <dd>
            <PenaltyTerms rate={t.dailyPenaltyRateBps ?? 0} />
          </dd>
        </div>
        <div>
          <dt>Position policy</dt>
          <dd>
            {t.allowSplit ? "Full or half positions" : "Full positions"};{" "}
            {t.multiplePositions === "none"
              ? "one equivalent position maximum"
              : t.multiplePositions === "max"
                ? `maximum ${t.maxPerMember} per Member`
                : "multiple within capacity"}
            .
          </dd>
        </div>
      </dl>
      <p className="whitespace-pre-line">{BASE_RULES}</p>
      <p className="whitespace-pre-line">
        {t.rules === BASE_RULES ? "" : t.rules}
      </p>
      {t.notesToMembers && <p>{t.notesToMembers}</p>}
      <p>
        Scheduled Payout Value is a reference, not a guarantee of the actual
        collected pot. Own-Round contributions are optional. The applicable fee
        remains based on Scheduled Payout Value.
      </p>
      {accepted(cycle, member) ? (
        <p className="font-bold text-emerald-700">
          Accepted by {member.name}.{" "}
          {member.acceptances[member.acceptances.length - 1]?.at}
        </p>
      ) : (
        <>
          <label className="flex gap-2 items-start">
            <input
              type="checkbox"
              checked={confirmed}
              onChange={(e) => setConfirmed(e.target.checked)}
            />
            As {member.name}, I have reviewed and accept my positions,
            commitment, Organization fee and all rules above.
          </label>
          <Button
            size="sm"
            disabled={!confirmed || reviewedTerms !== terms}
            onClick={() =>
              act({
                type: "accept",
                id: member.id,
                actorId: member.id,
                confirmed,
                reviewedTerms,
              })
            }
          >
            Record this Member's acceptance
          </Button>
        </>
      )}
      {member.acceptances.length > 0 && (
        <details>
          <summary>Acceptance history ({member.acceptances.length})</summary>
          {member.acceptances.map((a, i) => (
            <p key={i}>
              {a.at} · Member {member.name} ·{" "}
              {a.revision === member.revision && a.terms === terms
                ? "current"
                : "superseded; reconfirmation required"}
            </p>
          ))}
        </details>
      )}
    </section>
  )
}
