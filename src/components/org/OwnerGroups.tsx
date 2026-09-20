import {PaymentDemos} from '../../payments/PaymentWorkspace'
import {LifecycleDemos} from '../../lifecycle/LifecycleWorkspace'
import {RoundDemos} from '../../rounds/ActiveCycleWorkspace'
import {financiallyCommenced} from '../../groups/model'
import { Button, Badge } from "../ui"
import { OwnerShell } from "./OwnerShell"
import { useState } from "react"
import { useGroups } from "../../groups/GroupContext"
import { useOrganization } from "../../organizations/OrganizationContext"
import {
  cycleOf,
  admitted,
  accepted,
  reserved,
  readiness,
} from "../../groups/model"
import { SCENARIOS, type GroupScenario } from "../../groups/seeds"
import type { View, NavMeta } from "../../App"

interface Props {
  navigate: (v: View, meta?: NavMeta) => void
}

export function OwnerGroups({ navigate }: Props) {
  const { groups, create, select, error, boundary, setBoundary } = useGroups()
  const { organization } = useOrganization()
  const [scenario, setScenario] = useState<GroupScenario>(
    "Recruitment in progress",
  )
  const [limits, setLimits] = useState(boundary)
  const canCreate =
    !!organization && ["approved", "active"].includes(organization.status)
  const OWNER_GROUPS = (organization?.activity.groups || []).map((g) => ({
    ...g,
    color: "#1746A2",
    emoji: "◫",
    cycleStart: "Representative history",
    cycleEnd: organization?.activity.asOf,
    maxMembers: g.members,
    currentRound: g.round,
    totalRounds: g.rounds,
    paidThisRound: g.paid,
    pendingThisRound: g.members - g.paid,
    nextPayoutRecipient:
      organization?.activity.payouts.find((p) => p.groupId === g.id)
        ?.recipient || "No upcoming payout",
    nextPayoutAmount:
      organization?.activity.payouts.find((p) => p.groupId === g.id)?.amount ||
      0,
    nextPayoutDate:
      organization?.activity.payouts.find((p) => p.groupId === g.id)?.dueDate ||
      "—",
  }))
  const begin = () => {
    if (create()) navigate("owner-group-setup")
  }
  const totalMembers = OWNER_GROUPS.reduce((s, g) => s + g.members, 0)

  return (
    <OwnerShell navigate={navigate} activeView="owner-groups">
      {/* Header */}
      <div className="bg-white border-b border-[#E2E6F0] px-6 lg:px-8 py-5 shrink-0">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="display-font text-xl font-bold text-[#0D1117]">
              My groups
            </h1>
            <p className="text-sm text-[#6B7280] mt-0.5">
              {groups.length} preparation Groups · {OWNER_GROUPS.length}{" "}
              historical examples · {totalMembers} historical memberships
            </p>
          </div>
          <Button disabled={!canCreate} onClick={begin}>
            + Set up new group
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-6 lg:px-8 py-6">
        <details className="owner-secondary"><summary>Prototype scenario tools</summary><RoundDemos/><LifecycleDemos/><PaymentDemos/></details>
        {error && (
          <p role="alert" className="text-red-700 mb-4">
            {error}
          </p>
        )}
        <details className="owner-secondary"><summary>Group preparation demo tools</summary><section className="mt-4 space-y-4">
          <h2 className="font-bold text-[#1746A2]">
            Inspect Group preparation
          </h2>
          <p className="text-sm">
            Demo scenarios create separate, editable Groups in this
            Organization. State survives navigation and signing back in during
            this session; a reload resets it.
          </p>
          <div className="flex flex-wrap gap-3">
            <select
              aria-label="Group demo scenario"
              value={scenario}
              onChange={(e) => setScenario(e.target.value as GroupScenario)}
              className="border rounded-lg p-2 bg-white"
            >
              {SCENARIOS.map((v) => (
                <option key={v}>{v}</option>
              ))}
            </select>
            <Button
              size="sm"
              disabled={!canCreate}
              onClick={() => {
                if (create(scenario)) navigate("owner-group-readiness")
              }}
            >
              Add demo Group
            </Button>
          </div>
          <details>
            <summary className="text-sm cursor-pointer">
              Prototype fee configuration for this Organization
            </summary>
            <p className="text-xs mt-2">
              Example TCS configuration controls, not an Owner commercial-policy
              override. Changing these limits recalculates draft readiness.
            </p>
            <div className="flex flex-wrap items-end gap-3 mt-3">
              <label className="text-sm">
                Maximum percentage
                <input
                  type="number"
                  value={limits.maxPercentage}
                  onChange={(e) =>
                    setLimits({
                      ...limits,
                      maxPercentage: Number(e.target.value),
                    })
                  }
                  className="block border rounded p-2 w-32"
                />
              </label>
              <label className="text-sm">
                Maximum flat fee (NGN)
                <input
                  type="number"
                  value={limits.maxFlat}
                  onChange={(e) =>
                    setLimits({ ...limits, maxFlat: Number(e.target.value) })
                  }
                  className="block border rounded p-2 w-40"
                />
              </label>
              <Button
                size="sm"
                variant="secondary"
                onClick={() => setBoundary(limits)}
              >
                Apply demo configuration
              </Button>
            </div>
          </details>
        </section></details>
        <div className="grid lg:grid-cols-2 gap-5 mb-8">
          {groups.map((g) => {
            const c = cycleOf(g),
              checks = organization ? readiness(g, organization, boundary) : [],
              confirmed = admitted(c).filter((m) => accepted(c, m))
            return (
              <article
                key={g.id}
                className="bg-white rounded-xl border border-[#E2E6F0] overflow-hidden"
              >
                <div className="h-1.5 bg-[#1746A2]" />
                <div className="p-6">
                  <div className="flex justify-between gap-3 mb-3">
                    <h2 className="font-bold">{g.name}</h2>
                    <Badge
                      variant={
                        c.status === "activated" ? "verified" : "not-started"
                      }
                    >
                      {c.status.toUpperCase()}
                    </Badge>
                  </div>
                  <p className="text-xs text-[#6B7280]">
                    Cycle {c.number} · {g.visibility} · {c.terms.frequency}
                  </p>
                  <div className="grid grid-cols-3 gap-3 my-4">
                    {[
                      {
                        label: "Reserved",
                        value: reserved(c) + " / " + c.terms.positions,
                      },
                      {
                        label: "Members accepted",
                        value: confirmed.length + " / " + admitted(c).length,
                      },
                      {
                        label: "Contribution",
                        value: "₦" + c.terms.amount.toLocaleString(),
                      },
                    ].map((v) => (
                      <div
                        key={v.label}
                        className="bg-[#F8FAFF] rounded-lg p-3"
                      >
                        <p className="text-xs">{v.label}</p>
                        <p className="font-bold text-sm mt-1">{v.value}</p>
                      </div>
                    ))}
                  </div>
                  <p className="text-sm mb-4">
                    {c.status === "draft"
                      ? checks.every((r) => r.status === "pass")
                        ? "Ready for activation"
                        : checks.filter((r) => r.status === "fail").length +
                          " readiness blockers"
                      : c.status === "activated"
                        ? (financiallyCommenced(c)?"Activated · obligations generated":"Activated · awaiting first Round opening")
                        : c.status.toUpperCase().replace(/-/g," ") + (c.cancellationReason?" · "+c.cancellationReason:"")}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {(c.status === "draft"
                      ? [
                          ["Setup", "owner-group-setup"],
                          ["Recruitment", "owner-group-recruit"],
                          ["Positions", "owner-group-positions"],
                          ["Commitments", "owner-group-rules"],
                          ["Readiness", "owner-group-readiness"],
                          ["Lifecycle / history", "owner-lifecycle"],
                        ] as const
                      : c.status==="activated" ? [["Collections", "owner-collection"], ["Active Cycle", "owner-cycles"], ["Lifecycle / history", "owner-lifecycle"], ["Activation record", "owner-group-activated"]] as const : [["Cycle history", "owner-lifecycle"]] as const
                    ).map(([label, view]) => (
                      <Button
                        key={view}
                        size="sm"
                        variant="secondary"
                        onClick={() => {
                          select(g.id)
                          navigate(view)
                        }}
                      >
                        {label}
                      </Button>
                    ))}
                  </div>
                </div>
              </article>
            )
          })}
        </div>
        {OWNER_GROUPS.length > 0 && (
          <h2 className="font-bold mb-4">
            Existing representative Group activity
          </h2>
        )}
        {OWNER_GROUPS.length === 0 && groups.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-16 h-16 rounded-2xl bg-[#EEF2FF] flex items-center justify-center text-3xl mb-4">
              🏛
            </div>
            <p className="text-sm font-bold text-[#374151] mb-1">
              No groups yet
            </p>
            <p className="text-sm text-[#9CA3AF] mb-6">
              Create your first thrift group to get started.
            </p>
            <Button disabled={!canCreate} onClick={begin}>
              Set up first group
            </Button>
          </div>
        ) : (
          <div className="flex flex-col gap-5">
            {OWNER_GROUPS.map((g) => {
              const cyclePct = Math.round(
                (g.currentRound / g.totalRounds) * 100,
              )
              const paidPct = Math.round((g.paidThisRound / g.members) * 100)

              return (
                <div
                  key={g.id}
                  className="bg-white rounded-xl border border-[#E2E6F0] overflow-hidden"
                >
                  {/* Color accent */}
                  <div className="h-1.5" style={{ background: g.color }} />

                  <div className="p-6">
                    <div className="flex items-start justify-between gap-4 mb-5">
                      <div className="flex items-center gap-4">
                        <div
                          className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl shrink-0"
                          style={{ background: g.color + "18" }}
                        >
                          {g.emoji}
                        </div>
                        <div>
                          <h2 className="display-font text-base font-bold text-[#0D1117]">
                            {g.name}
                          </h2>
                          <p className="text-xs text-[#9CA3AF] mt-0.5">
                            {g.cycleStart} – {g.cycleEnd} · {g.frequency}
                          </p>
                        </div>
                      </div>
                      <Badge
                        variant={
                          g.status === "active" ? "verified" : "not-started"
                        }
                      >
                        {g.status === "active" ? "Active" : g.status}
                      </Badge>
                    </div>

                    {/* Stats grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
                      {[
                        {
                          label: "Members",
                          value: `${g.members}/${g.maxMembers}`,
                        },
                        {
                          label: "Contribution",
                          value: `₦${g.amount.toLocaleString()}`,
                        },
                        {
                          label: "Current round",
                          value: `${g.currentRound} of ${g.totalRounds}`,
                        },
                        {
                          label: "This round",
                          value: `${g.paidThisRound} paid`,
                          alert: g.pendingThisRound > 0,
                        },
                      ].map((s) => (
                        <div
                          key={s.label}
                          className="bg-[#F8FAFF] rounded-lg px-3 py-2.5"
                        >
                          <p className="text-[10px] text-[#9CA3AF] uppercase tracking-wide">
                            {s.label}
                          </p>
                          <p
                            className={`text-sm font-bold mt-0.5 ${
                              s.alert ? "text-[#D97706]" : "text-[#0D1117]"
                            }`}
                          >
                            {s.value}
                          </p>
                        </div>
                      ))}
                    </div>

                    {/* Cycle progress */}
                    <div className="mb-2">
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-[#9CA3AF]">Cycle progress</span>
                        <span className="font-semibold text-[#0D1117]">
                          {cyclePct}%
                        </span>
                      </div>
                      <div className="h-2 bg-[#F1F3F8] rounded-full overflow-hidden">
                        <div
                          className="h-full bg-[#1746A2] rounded-full"
                          style={{ width: `${cyclePct}%` }}
                        />
                      </div>
                    </div>

                    {/* Round contributions progress */}
                    <div className="mb-5">
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-[#9CA3AF]">
                          Round {g.currentRound} contributions
                        </span>
                        <span
                          className={`font-semibold ${
                            g.pendingThisRound > 0
                              ? "text-[#D97706]"
                              : "text-[#059669]"
                          }`}
                        >
                          {g.paidThisRound}/{g.members} confirmed
                        </span>
                      </div>
                      <div className="h-2 bg-[#F1F3F8] rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            paidPct === 100 ? "bg-[#059669]" : "bg-[#D97706]"
                          }`}
                          style={{ width: `${paidPct}%` }}
                        />
                      </div>
                    </div>

                    {/* Next payout */}
                    <div className="bg-[#EEF2FF] rounded-xl px-4 py-3 mb-5">
                      <p className="text-xs text-[#6B7280] mb-0.5">
                        Next payout
                      </p>
                      <p className="text-sm font-bold text-[#1746A2]">
                        {g.nextPayoutRecipient} — ₦
                        {g.nextPayoutAmount.toLocaleString()}
                      </p>
                      <p className="text-xs text-[#9CA3AF]">
                        Due {g.nextPayoutDate}
                      </p>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-wrap gap-2">
                      <p className="text-xs text-[#6B7280]">
                        Historical demo activity. Active Cycle and payment
                        workflows follow in later batches.
                      </p>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </OwnerShell>
  )
}
