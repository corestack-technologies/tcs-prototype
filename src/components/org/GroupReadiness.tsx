import { OwnerProgress } from '../../organizations/OwnerProgress'
import { useState } from "react"
import { Button } from "../ui"
import { OwnerShell } from "./OwnerShell"
import { useDraftGroup } from "../../groups/GroupContext"
import { useOrganization } from "../../organizations/OrganizationContext"
import { readiness } from "../../groups/model"
import { CycleCancellation } from "../../groups/GroupUI"
import type { View, NavMeta } from "../../App"

interface Props {
  navigate: (v: View, meta?: NavMeta) => void
}

type CheckStatus = "pass" | "fail" | "warning"

const statusConfig: Record<CheckStatus, {
  icon: string
  color: string
  badge: string
  bg: string
}> = {
  pass: {
    icon: "✓",
    color: "text-[#059669]",
    badge: "bg-[#ECFDF5] text-[#065F46]",
    bg: "bg-[#ECFDF5] border-[#A7F3D0]",
  },
  fail: {
    icon: "✗",
    color: "text-[#DC2626]",
    badge: "bg-[#FEF2F2] text-[#991B1B]",
    bg: "bg-[#FEF2F2] border-[#FECACA]",
  },
  warning: {
    icon: "!",
    color: "text-[#D97706]",
    badge: "bg-[#FFFBEB] text-[#92400E]",
    bg: "bg-[#FFFBEB] border-[#FDE68A]",
  },
}

export function GroupReadiness({ navigate }: Props) {
  const { group, cycle, act, boundary } = useDraftGroup()
  const { organization } = useOrganization()
  const CHECKS = readiness(group, organization!, boundary)
  const [confirmed, setConfirmed] = useState(false)

  const requiredPassed = CHECKS.filter((c) => c.required).every(
    (c) => c.status === "pass",
  )
  const passCount = CHECKS.filter((c) => c.status === "pass").length
  const warnCount = 0
  const failCount = CHECKS.filter((c) => c.status === "fail").length
  const failedRequired = CHECKS.filter((c) => c.required && c.status === "fail")

  const launch = () => {
    if (act({ type: "activate", confirmed })) navigate("owner-group-activated")
  }

  return (
    <OwnerShell navigate={navigate} activeView="owner-groups"><OwnerProgress current={4}/>
      {/* Breadcrumb */}
      <div className="bg-white border-b border-[#E2E6F0] px-6 lg:px-8 py-3.5 flex items-center gap-3 shrink-0">
        <button
          onClick={() => navigate("owner-group-rules")}
          className="flex items-center gap-1.5 text-sm text-[#6B7280] hover:text-[#0D1117] font-medium"
        >
          <svg className="w-4 h-4" viewBox="0 0 16 16" fill="currentColor">
            <path d="M9.78 11.78a.75.75 0 01-1.06 0L4.47 7.53a.75.75 0 010-1.06l4.25-4.25a.75.75 0 111.06 1.06L6.06 7l3.72 3.72a.75.75 0 010 1.06z" />
          </svg>
          Rules review
        </button>
        <span className="text-[#E2E6F0]">/</span>
        <span className="text-sm font-semibold text-[#0D1117]">
          Launch readiness
        </span>
        <span className="ml-auto text-xs text-[#9CA3AF]">Step 5 of 6</span>
      </div>

      <div className="flex-1 overflow-y-auto px-6 lg:px-8 py-6">
        <div className="max-w-3xl mx-auto flex flex-col gap-6">
          {/* Header */}
          <div>
            <h1 className="display-font text-2xl font-bold text-[#0D1117] mb-1">
              Launch readiness check
            </h1>
            <p className="text-sm text-[#6B7280]">
              All required gates must pass before you can launch the cycle.
              Rules acknowledgment and full position allocation cannot be
              bypassed.
            </p>
          </div>

          {/* Summary row */}
          <div className="grid grid-cols-3 gap-4">
            {[
              {
                label: "Passed",
                value: passCount,
                color: "text-[#059669]",
                bg: "bg-[#ECFDF5] border-[#A7F3D0]",
              },
              {
                label: "Warnings",
                value: warnCount,
                color: "text-[#D97706]",
                bg: "bg-[#FFFBEB] border-[#FDE68A]",
              },
              {
                label: "Blocked",
                value: failCount,
                color: "text-[#DC2626]",
                bg: "bg-[#FEF2F2] border-[#FECACA]",
              },
            ].map((s) => (
              <div
                key={s.label}
                className={`rounded-xl border px-5 py-4 text-center ${s.bg}`}
              >
                <p className={`display-font text-3xl font-bold ${s.color}`}>
                  {s.value}
                </p>
                <p className="text-xs font-semibold text-[#6B7280] mt-0.5">
                  {s.label}
                </p>
              </div>
            ))}
          </div>

          {/* Checklist */}
          <div className="flex flex-col gap-3">
            {CHECKS.map((check) => {
              const cfg = statusConfig[check.status]
              return (
                <div
                  key={check.id}
                  className={`rounded-xl border p-5 ${cfg.bg}`}
                >
                  <div className="flex items-start gap-4">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-black shrink-0 ${cfg.badge}`}
                    >
                      {cfg.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-col sm:flex-row sm:items-center gap-1.5 mb-0.5">
                        <p className="text-sm font-bold text-[#0D1117]">
                          {check.label}
                        </p>
                        <span
                          className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full w-fit ${
                            check.required
                              ? "bg-white/60 text-[#DC2626]"
                              : "bg-white/60 text-[#9CA3AF]"
                          }`}
                        >
                          {check.required ? "Required" : "Optional"}
                        </span>
                      </div>
                      <p className="text-xs text-[#6B7280] leading-relaxed">
                        {check.description}
                      </p>
                      {check.detail && (
                        <p
                          className={`text-xs font-semibold mt-1.5 ${cfg.color}`}
                        >
                          {check.detail}
                        </p>
                      )}
                    </div>
                    {check.action && check.actionView && (
                      <button
                        onClick={() => navigate(check.actionView!)}
                        className="text-xs font-semibold text-[#1746A2] hover:underline shrink-0"
                      >
                        {check.action}
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>

          {/* Launch section */}
          <div
            className={`rounded-2xl border-2 p-6 ${
              requiredPassed
                ? "border-[#059669] bg-[#ECFDF5]"
                : "border-[#FECACA] bg-[#FEF2F2]"
            }`}
          >
            {requiredPassed ? (
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <p className="display-font text-lg font-bold text-[#059669]">
                    Ready to launch
                  </p>
                  <p className="text-sm text-[#374151] mt-0.5">
                    All required gates have passed. Planned start:{" "}
                    <strong>{cycle.terms.startDate}</strong>. Activation
                    protects the agreed terms; it does not create Rounds,
                    obligations or payments.
                  </p>
                </div>
                <label className="flex gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={confirmed}
                    onChange={(e) => setConfirmed(e.target.checked)}
                  />
                  I confirm activation and protection of the agreed
                  participants, positions and terms.
                </label>
                <Button
                  size="lg"
                  variant="success"
                  disabled={!confirmed}
                  onClick={launch}
                  className="shrink-0"
                >
                  🚀 Launch cycle
                </Button>
              </div>
            ) : (
              <div>
                <p className="display-font text-lg font-bold text-[#DC2626] mb-1">
                  Not ready to launch
                </p>
                <p className="text-sm text-[#374151] mb-3">
                  {failedRequired.length} required gate
                  {failedRequired.length !== 1 ? "s" : ""} must be resolved
                  before you can launch:
                </p>
                <ul className="flex flex-col gap-1.5 mb-4">
                  {failedRequired.map((c) => (
                    <li
                      key={c.id}
                      className="flex items-start gap-2 text-xs text-[#991B1B]"
                    >
                      <span className="font-bold shrink-0">✗</span>
                      <span>{c.label}</span>
                    </li>
                  ))}
                </ul>
                <Button
                  size="lg"
                  disabled
                  className="opacity-40 cursor-not-allowed"
                >
                  Launch cycle
                </Button>
              </div>
            )}
          </div>

          <CycleCancellation />
          {/* Cycle overview */}
          <div className="bg-white rounded-xl border border-[#E2E6F0] overflow-hidden">
            <div className="px-5 py-3.5 border-b border-[#F1F3F8] bg-[#F8FAFF]">
              <p className="text-sm font-bold text-[#0D1117]">Cycle overview</p>
            </div>
            <div className="divide-y divide-[#F1F3F8]">
              {[
                { label: "Group name", value: group.name },
                {
                  label: "Cycle",
                  value: "Cycle " + cycle.number + " · " + cycle.status,
                },
                {
                  label: "Total positions",
                  value: String(cycle.terms.positions),
                },
                {
                  label: "Contribution per full position",
                  value:
                    "₦" +
                    cycle.terms.amount.toLocaleString() +
                    " / " +
                    cycle.terms.frequency +
                    " Round",
                },
                {
                  label: "Scheduled Payout Value per full position",
                  value:
                    "₦" +
                    (
                      cycle.terms.amount * cycle.terms.positions
                    ).toLocaleString(),
                },
                {
                  label: "Planned start",
                  value: cycle.terms.startDate || "Not set",
                },
                {
                  label: "Financial commencement",
                  value: "Not commenced · no obligations generated",
                },
              ].map((r) => (
                <div
                  key={r.label}
                  className="flex justify-between px-5 py-3.5 gap-4"
                >
                  <p className="text-sm text-[#6B7280]">{r.label}</p>
                  <p className="text-sm font-semibold text-[#0D1117] text-right">
                    {r.value}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </OwnerShell>
  )
}
