import { OwnerProgress } from '../../organizations/OwnerProgress'
import { DisplayDate } from '../../design/foundation'
import { useState } from "react"
import { Button, Alert } from "../ui"
import { OwnerShell } from "./OwnerShell"
import { useDraftGroup } from "../../groups/GroupContext"
import {
  admitted,
  assigned,
  accepted,
  reconfirmation,
  memberTerms,
  BASE_RULES,
} from "../../groups/model"
import { MemberAcceptance } from "../../groups/MemberAcceptance"
import type { View, NavMeta } from "../../App"

interface Props {
  navigate: (v: View, meta?: NavMeta) => void
}

function fmt(n: number) {
  return `₦${n.toLocaleString()}`
}

interface MemberCommitment {
  id: string
  name: string
  initials: string
  email: string
  // Commitment details
  positionAssignments: { position: number ; fraction: 1 | 0.5 }[]
  contributionPerRound: number
  payoutEntitlement: number
  acknowledgedAt: string | null
  reminderSent: boolean
}

function posLabel(p: { position: number ; fraction: 1 | 0.5 }) {
  return `Position ${p.position} — ${
    p.fraction === 1 ? "Individual Position" : "Shared Position"
  }`
}

export function GroupRulesReview({ navigate }: Props) {
  const { cycle, act } = useDraftGroup()
  const GROUP = {
    ...cycle.terms,
    collectionWindow: cycle.terms.contributionWindowDays,
  }
  const RULES =
    BASE_RULES +
    "\n\n" +
    (cycle.terms.rules === BASE_RULES ? "" : cycle.terms.rules)
  const NOTICES = [
    GROUP.visibility + " recruitment.",
    "Organization fee is disclosed in each Member response below and applied at payout using Scheduled Payout Value.",
    "Recipient own-Round contributions are optional with no lateness, default or penalty.",
    "This is a prototype: reminders are local records, not sent messages.",
  ]
  const members: MemberCommitment[] = admitted(cycle).map((p) => ({
    ...p,
    positionAssignments: assigned(cycle, p.id),
    contributionPerRound: GROUP.amount * p.equivalent,
    payoutEntitlement: GROUP.amount * GROUP.positions * p.equivalent,
    acknowledgedAt: accepted(cycle, p)
      ? p.acceptances[p.acceptances.length - 1].at
      : null,
  }))
  const [showRules, setShowRules] = useState(false)
  const [allReminderSent, setAllReminderSent] = useState(false)
  const [expanded, setExpanded] = useState<string | null>(null)

  const acknowledged = members.filter((m) => m.acknowledgedAt !== null)
  const pending = members.filter((m) => m.acknowledgedAt === null)
  const pct = members.length
    ? Math.round((acknowledged.length / members.length) * 100)
    : 0
  const allAcknowledged = members.length > 0 && pending.length === 0

  const sendReminder = (id: string) => act({ type: "remind", id })
  const sendAllReminders = () => {
    for (const m of pending) sendReminder(m.id)
    setAllReminderSent(true)
  }

  return (
    <OwnerShell navigate={navigate} activeView="owner-groups"><OwnerProgress current={3}/>
      {/* Breadcrumb */}
      <div className="bg-white border-b border-[#E2E6F0] px-6 lg:px-8 py-3.5 flex items-center gap-3 shrink-0">
        <button
          onClick={() => navigate("owner-group-positions")}
          className="flex items-center gap-1.5 text-sm text-[#6B7280] hover:text-[#0D1117] font-medium"
        >
          <svg className="w-4 h-4" viewBox="0 0 16 16" fill="currentColor">
            <path d="M9.78 11.78a.75.75 0 01-1.06 0L4.47 7.53a.75.75 0 010-1.06l4.25-4.25a.75.75 0 111.06 1.06L6.06 7l3.72 3.72a.75.75 0 010 1.06z" />
          </svg>
          Assign positions
        </button>
        <span className="text-[#E2E6F0]">/</span>
        <span className="text-sm font-semibold text-[#0D1117]">
          Rules review
        </span>
        <div className="ml-auto flex items-center gap-2">
          <span className="text-xs text-[#9CA3AF]">Step 4 of 6</span>
          <Button
            size="sm"
            onClick={() => navigate("owner-group-readiness", undefined)}
          >
            Continue →
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-6 lg:px-8 py-6">
        <div className="max-w-4xl mx-auto flex flex-col gap-5">
          {allAcknowledged && (
            <Alert type="success">
              All members have acknowledged the rules and their commitment. You
              can continue to launch readiness.
            </Alert>
          )}
          {allReminderSent && !allAcknowledged && (
            <Alert type="info">
              Demo reminders recorded to {pending.length} member
              {pending.length !== 1 ? "s" : ""}.
            </Alert>
          )}

          {/* Progress header */}
          <div className="bg-white rounded-2xl border border-[#E2E6F0] p-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
              <div>
                <p className="display-font text-lg font-bold text-[#0D1117]">
                  Rules & commitment acknowledgment
                </p>
                <p className="text-sm text-[#6B7280] mt-0.5">
                  Each member must confirm their personalized commitment and
                  group rules before launch
                </p>
              </div>
              <div className="text-right">
                <p className="display-font text-3xl font-bold text-[#1746A2]">
                  {acknowledged.length}
                  <span className="text-[#9CA3AF] text-xl">
                    /{members.length}
                  </span>
                </p>
                <p className="text-xs text-[#9CA3AF]">acknowledged</p>
              </div>
            </div>
            <div className="h-2.5 bg-[#F1F3F8] rounded-full overflow-hidden mb-2">
              <div
                className={`h-full rounded-full transition-all ${
                  pct === 100 ? "bg-[#059669]" : "bg-[#1746A2]"
                }`}
                style={{ width: `${pct}%` }}
              />
            </div>
            <div className="flex items-center justify-between">
              <p className="text-xs text-[#9CA3AF]">{pct}% complete</p>
              {pending.length > 0 && (
                <button
                  onClick={sendAllReminders}
                  className="text-xs font-semibold text-[#1746A2] hover:underline"
                >
                  Record demo reminder to all ({pending.length})
                </button>
              )}
            </div>
          </div>

          <div className="grid lg:grid-cols-[1fr_300px] gap-5">
            {/* Member acknowledgment list */}
            <div>
              <p className="text-sm font-bold text-[#0D1117] mb-3">
                Member status · select a Member to review and simulate
                acceptance
              </p>
              <div className="bg-white rounded-xl border border-[#E2E6F0] overflow-hidden">
                <div className="divide-y divide-[#F1F3F8]">
                  {members.map((m) => {
                    const isOpen = expanded === m.id
                    return (
                      <div key={m.id}>
                        <div
                          className="flex items-center gap-3 px-5 py-4 cursor-pointer hover:bg-[#F8FAFF] transition-colors"
                          role="button"
                          tabIndex={0}
                          aria-expanded={isOpen}
                          aria-label={"Review commitment for " + m.name}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" || e.key === " ") {
                              e.preventDefault()
                              setExpanded(isOpen ? null : m.id)
                            }
                          }}
                          onClick={() => setExpanded(isOpen ? null : m.id)}
                        >
                          <div
                            className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                              m.acknowledgedAt
                                ? "bg-[#ECFDF5] text-[#059669]"
                                : "bg-[#F1F3F8] text-[#6B7280]"
                            }`}
                          >
                            {m.acknowledgedAt ? "✓" : m.initials}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-[#0D1117] truncate">
                              {m.name}
                            </p>
                            <p className="text-xs text-[#9CA3AF] truncate">
                              {m.positionAssignments.map(posLabel).join(" · ")}{" "}
                              · {fmt(m.contributionPerRound)}/round
                            </p>
                          </div>
                          <div className="text-right shrink-0 ml-2">
                            {m.acknowledgedAt ? (
                              <div>
                                <p className="text-xs font-semibold text-[#059669]">
                                  Confirmed
                                </p>
                                <p className="text-[10px] text-[#9CA3AF]">
                                  <DisplayDate value={m.acknowledgedAt}/>
                                </p>
                              </div>
                            ) : (
                              <p className="text-xs font-semibold text-[#D97706]">
                                {reconfirmation(
                                  cycle,
                                  cycle.participants.find(
                                    (p) => p.id === m.id,
                                  )!,
                                )
                                  ? "Reconfirm"
                                  : "Pending"}
                              </p>
                            )}
                          </div>
                          <svg
                            className={`w-4 h-4 text-[#9CA3AF] transition-transform ml-2 shrink-0 ${
                              isOpen ? "rotate-180" : ""
                            }`}
                            viewBox="0 0 16 16"
                            fill="currentColor"
                          >
                            <path d="M4.427 9.427l3.396 3.396a.25.25 0 00.354 0l3.396-3.396A.25.25 0 0011.396 9H4.604a.25.25 0 00-.177.427z" />
                          </svg>
                        </div>

                        {/* Expanded: personalized commitment detail */}
                        {isOpen && (
                          <div className="mx-5 mb-4 bg-[#F8FAFF] border border-[#E2E6F0] rounded-xl overflow-hidden">
                            <div className="px-4 py-3 border-b border-[#E2E6F0] bg-[#EEF2FF]">
                              <p className="text-xs font-bold text-[#1746A2]">
                                Personalized commitment — {m.name}
                              </p>
                            </div>
                            <div className="divide-y divide-[#E2E6F0]">
                              {[
                                {
                                  label: "Position assignment",
                                  value: m.positionAssignments
                                    .map(posLabel)
                                    .join(", "),
                                },
                                {
                                  label: "Contribution per round",
                                  value: fmt(m.contributionPerRound),
                                },
                                {
                                  label: "Scheduled Payout Value",
                                  value: fmt(m.payoutEntitlement),
                                },
                                {
                                  label: "Collection frequency",
                                  value: GROUP.frequency,
                                },
                                {
                                  label: "Schedule",
                                  value:
                                    GROUP.frequency === "Monthly"
                                      ? `Opens day ${GROUP.contributionOpenDay}; due month end`
                                      : GROUP.frequency === "Daily"
                                        ? "Due end of assigned day"
                                        : `${GROUP.collectionWindow}-day contribution window`,
                                },
                                {
                                  label: "Cycle start date",
                                  value: GROUP.startDate,
                                },
                              ].map((r) => (
                                <div
                                  key={r.label}
                                  className="flex justify-between px-4 py-2.5 gap-3"
                                >
                                  <p className="text-xs text-[#6B7280]">
                                    {r.label}
                                  </p>
                                  <p className="text-xs font-semibold text-[#0D1117] text-right">
                                    {r.value}
                                  </p>
                                </div>
                              ))}
                            </div>
                            <MemberAcceptance
                              key={
                                m.id +
                                memberTerms(cycle, m.id) +
                                cycle.participants.find((p) => p.id === m.id)!
                                  .revision
                              }
                              member={
                                cycle.participants.find((p) => p.id === m.id)!
                              }
                            />
                            <div className="px-4 py-3 border-t border-[#E2E6F0] flex items-center justify-between">
                              <p className="text-xs text-[#6B7280]">
                                {m.acknowledgedAt
                                  ? `Acknowledged ${m.acknowledgedAt}`
                                  : m.reminderSent
                                    ? "Demo reminder recorded — awaiting acknowledgment"
                                    : "Awaiting acknowledgment"}
                              </p>
                              {!m.acknowledgedAt &&
                                (m.reminderSent ? (
                                  <span className="text-xs text-[#9CA3AF]">
                                    Demo reminder recorded
                                  </span>
                                ) : (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      sendReminder(m.id)
                                    }}
                                    className="text-xs font-semibold text-[#1746A2] hover:underline"
                                  >
                                    Record demo reminder
                                  </button>
                                ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>

            {/* Rules sidebar */}
            <div className="flex flex-col gap-4">
              <div className="bg-white rounded-xl border border-[#E2E6F0] overflow-hidden">
                <button
                  onClick={() => setShowRules((v) => !v)}
                  className="w-full flex items-center justify-between px-5 py-4 border-b border-[#F1F3F8] hover:bg-[#F8FAFF] transition-colors"
                >
                  <p className="text-sm font-bold text-[#0D1117]">
                    Group rules
                  </p>
                  <svg
                    className={`w-4 h-4 text-[#9CA3AF] transition-transform ${
                      showRules ? "rotate-180" : ""
                    }`}
                    viewBox="0 0 16 16"
                    fill="currentColor"
                  >
                    <path d="M4.427 9.427l3.396 3.396a.25.25 0 00.354 0l3.396-3.396A.25.25 0 0011.396 9H4.604a.25.25 0 00-.177.427z" />
                  </svg>
                </button>
                {showRules && (
                  <div className="px-5 py-4">
                    <pre className="text-xs text-[#374151] leading-relaxed whitespace-pre-wrap font-sans">
                      {RULES}
                    </pre>
                  </div>
                )}
              </div>

              <div className="bg-white rounded-xl border border-[#E2E6F0] overflow-hidden">
                <div className="px-5 py-4 border-b border-[#F1F3F8] bg-[#F8FAFF]">
                  <p className="text-sm font-bold text-[#0D1117]">
                    Important notices
                  </p>
                </div>
                <div className="px-5 py-4 flex flex-col gap-2.5">
                  {NOTICES.map((n, i) => (
                    <div
                      key={i}
                      className="flex gap-2.5 text-xs text-[#374151] leading-relaxed"
                    >
                      <span className="text-[#9CA3AF] shrink-0 font-semibold">
                        {i + 1}.
                      </span>
                      <span>{n}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-[#F8FAFF] rounded-xl border border-[#E2E6F0] px-4 py-4 text-xs text-[#6B7280] leading-relaxed">
                <p className="font-semibold text-[#0D1117] mb-1">
                  What a member acknowledges
                </p>
                They confirm they have read the group rules AND their
                personalized commitment: position(s), contribution per round,
                and Scheduled Payout Value. This acknowledgment is timestamped
                and forms part of the pre-launch audit record. Launch is blocked
                until all members acknowledge.
              </div>
            </div>
          </div>
        </div>
      </div>
    </OwnerShell>
  )
}
