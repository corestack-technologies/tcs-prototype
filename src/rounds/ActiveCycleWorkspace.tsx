import { PageHeader, EmptyState, StatusBadge } from '../design/foundation'
import { formatMoneyMinor, formatDate } from '../design/format'
import { effectiveReferenceAt } from '../rounds/model'
import { businessTimestamp } from '../settings/service'
import {LifecycleWorkspace} from '../lifecycle/LifecycleWorkspace'
﻿import { useEffect, useState } from "react"
import { useGroups } from "../groups/GroupContext"
import { cycleOf, financiallyCommenced, type Frequency } from "../groups/model"
import { useOrganization } from "../organizations/OrganizationContext"
import { useClient } from "../clients/ClientContext"
import { ClientShell, type ClientPageProps } from "../clients/ClientShell"
import { OwnerShell } from "../components/org/OwnerShell"
import { Button, Alert } from "../components/ui"
import { CycleCancellation } from "../groups/GroupUI"
import { ActiveCycleBody, dateLabel } from "./ActiveCycleBody"
import { ROUND_DEMOS, type RoundDemo } from "./seeds"
import { currentRound } from "./model"
export function RoundDemos() {
  const { createRoundDemo, error } = useGroups(),
    [frequency, setFrequency] = useState<Frequency>("Monthly"),
    [demo, setDemo] = useState<RoundDemo>("Open")
  return (
    <details className="bg-[#EEF2FF] border border-[#C7D2FE] rounded-xl p-4 mb-5">
      <summary className="font-semibold cursor-pointer">
        Active Cycle demo scenarios
      </summary>
      <p className="text-sm mt-3">
        Each example creates a separate Group with approved demo terms. Partial
        fulfillment is a seeded policy example, not a normal Group capability or
        a payment. Dates and reference time are reproducible.
      </p>
      <div className="flex flex-wrap gap-3 mt-3">
        <select
          aria-label="Demo frequency"
          value={frequency}
          onChange={(e) => {
            setFrequency(e.target.value as Frequency)
            if (e.target.value === "Daily" && demo === "Grace") setDemo("Open")
          }}
          className="border rounded-lg p-2"
        >
          {["Daily", "Weekly", "Biweekly", "Monthly"].map((f) => (
            <option key={f}>{f}</option>
          ))}
        </select>
        <select
          aria-label="Active Cycle demo"
          value={demo}
          onChange={(e) => setDemo(e.target.value as RoundDemo)}
          className="border rounded-lg p-2"
        >
          {ROUND_DEMOS.map((d) => (
            <option key={d} disabled={frequency === "Daily" && d === "Grace"}>
              {d}
            </option>
          ))}
        </select>
        <Button size="sm" onClick={() => createRoundDemo(frequency, demo)}>
          Add separate demo
        </Button>
      </div>
      {error && (
        <p role="alert" className="text-red-700 mt-3">
          {error}
        </p>
      )}
    </details>
  )
}
export function ActiveCycleWorkspace({
  navigate,
  member = false,
}: {
  navigate: ClientPageProps["navigate"]
  member?: boolean
}) {
  const { waivePenalty, group, reference, error } = useGroups(),
    { organization } = useOrganization(),
    { client } = useClient()
  const cycle = group ? cycleOf(group) : null,
    [at, setAt] = useState(""),
    [preview, setPreview] = useState("")
  useEffect(() => {
    if (cycle?.status === "activated" && !cycle.active)
      reference(businessTimestamp())
  }, [cycle?.id, cycle?.status, !!cycle?.active])
  const owner = organization?.ownerMemberId === client?.id,
    actualMember = cycle?.participants.some(
      (p) => p.id === client?.id,
    )
  if(group&&cycle&&cycle.status!=="activated")return <LifecycleWorkspace navigate={navigate} member={member}/>
  let content
  if (!group || !cycle || !organization)
    content = (
      <div className="p-6">
        <h1 className="text-xl font-bold mb-4">Choose an activated Group</h1>
        <Button onClick={() => navigate(member ? "my-groups" : "owner-groups")}>Open Groups</Button>
      </div>
    )
  else if (cycle.status !== "activated")
    content = (
      <div className="p-6">
        <Alert type="info">
          This Cycle is {cycle.status}. Active Round processing is unavailable.
        </Alert>
        <Button onClick={() => navigate(member ? "my-groups" : "owner-groups")}>
          Return to Groups
        </Button>
      </div>
    )
  else if (member && !actualMember)
    content = (
      <Alert type="warning">
        This Member does not participate in the selected Cycle.
      </Alert>
    )
  else if (!cycle.active)
    content = <p className="p-6">Preparing the approved Round schedule…</p>
  else {
    const active = cycle.active,
      round = currentRound(active)
    content = (
      <div className="max-w-5xl mx-auto space-y-5 p-4 sm:p-6">
        <div className="flex flex-wrap gap-3">
          <Button
            size="sm"
            variant="secondary"
            onClick={() => navigate(member ? "my-groups" : "owner-groups")}
          >
            Back to Groups
          </Button>
          {owner && (
            <Button
              size="sm"
              variant="secondary"
              onClick={() => navigate(member ? "owner-cycles" : "group-detail")}
            >
              {member ? "Organization view" : "My Member view"}
            </Button>
          )}
        </div>
        {!member && <RoundDemos />}
        <section className="bg-white border border-[#E2E6F0] rounded-xl p-4 text-sm">
          <p>
            <strong>{active.timeSource==='ENVIRONMENT'?'Environment Business Date:':'Scenario reference time:'}</strong>{" "}
            {dateLabel(effectiveReferenceAt(active), active.rounds[0].schedule.timezone)}{" "}
            ·{" "}
            {financiallyCommenced(cycle)
              ? "Financial commencement reached; normal cancellation is unavailable."
              : "Waiting for first opening; normal cancellation remains available."}
          </p>
          {active.demo && (
            <p className="mt-2">
              Demo: {active.demo}. Fulfillment and prior history are sample
              records, not provider transactions.
            </p>
          )}
          {!member && active.timeSource!=='ENVIRONMENT' && (
            <details className="mt-3">
              <summary className="cursor-pointer font-semibold">
                Inspect time progression
              </summary>
              <p className="mt-2">
                This prototype control advances reference time. TCS
                automatically generates obligations at each opening; it cannot
                undo commencement. Use a separate demo for earlier states.
              </p>
              <div className="flex flex-wrap gap-2 mt-3">
                <input
                  aria-label="Reference time (UTC ISO format)"
                  value={at}
                  onChange={(e) => setAt(e.target.value)}
                  placeholder="2099-09-20T00:00:00Z"
                  className="border rounded p-2"
                />
                <Button size="sm" onClick={() => reference(at)}>
                  Advance reference time
                </Button>
                {round &&
                  [
                    ["Opening", round.schedule.opensAt],
                    ["Due day", round.schedule.dueDayStartsAt],
                    [
                      "Grace",
                      new Date(
                        Date.parse(round.schedule.dueAt) + 1,
                      ).toISOString(),
                    ],
                    ["Late", round.schedule.lateAt],
                  ].map(([label, value]) => (
                    <Button
                      key={label}
                      size="sm"
                      variant="secondary"
                      disabled={
                        Date.parse(value) < Date.parse(effectiveReferenceAt(active))
                      }
                      onClick={() => reference(value)}
                    >
                      {label}
                    </Button>
                  ))}
              </div>
            </details>
          )}
        </section>
        {error && <Alert type="error">{error}</Alert>}
        {!member && (
          <label className="block text-sm">
            View obligations as
            <select
              aria-label="Obligation perspective"
              value={preview}
              onChange={(e) => setPreview(e.target.value)}
              className="border rounded-lg p-2 ml-3"
            >
              <option value="">Organization overview</option>
              {cycle
                .snapshot!.participants.filter((p) => p.status === "approved")
                .map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} · Member preview
                  </option>
                ))}
            </select>
          </label>
        )}
        {preview && !member && (
          <Alert type="info">
            Prototype Member preview. You remain signed in as the Organization
            Owner.
          </Alert>
        )}
        <Button onClick={()=>navigate(member?"member-lifecycle":"owner-lifecycle")}>Lifecycle, exit and Cycle history</Button>
        <Button onClick={()=>navigate(member?"member-payments":"owner-collection",{roundId:round?.id})}>{member?"Contribute / payment history":"Contribution collection"}</Button>
        <Button onClick={()=>navigate(member?"member-payouts":"owner-payouts")}>Payouts and recipient confirmation</Button>
        <ActiveCycleBody
          key={cycle.id + (member ? "member" : preview)}
          group={group}
          cycle={cycle}
          active={active}
          organization={organization}
          onWaive={!member && !preview && owner ? waivePenalty : undefined}
          memberId={member ? client!.id : preview || undefined}
        />
        {!member && <CycleCancellation />}
      </div>
    )
  }
  return member ? (
    <ClientShell navigate={navigate} active="groups">
      <div className="member-financial">{content}</div>
    </ClientShell>
  ) : (
    <OwnerShell navigate={navigate} activeView="owner-groups">
      {content}
    </OwnerShell>
  )
}
export function MemberGroups({ navigate }: ClientPageProps) {
  const { groups, select } = useGroups(),
    { client } = useClient()
  const mine = groups.filter((g) =>
    g.cycles.some(c=>c.participants.some((p) => p.id === client?.id)),
  )
  const card = (g: typeof mine[number]) => {
    const c=cycleOf(g),r=c.active?currentRound(c.active):null
    const participation=[...g.cycles].reverse().find(cycle=>cycle.participants.some(p=>p.id===client?.id))
    return <article key={g.id} className="member-card bg-white p-5"><div className="flex flex-wrap items-start justify-between gap-3"><h2 className="text-lg font-semibold">{g.name}</h2><StatusBadge status={c.status.replace(/-/g,' ')}/></div><p className="mt-2 text-sm text-[var(--tcs-text-muted)]">Cycle {c.number}{r?' / Round '+r.number:''} / {c.terms.frequency}</p><dl className="member-summary my-4"><div><dt className="text-xs">Contribution per full Position</dt><dd className="mt-1 font-semibold">{formatMoneyMinor(c.terms.amount*100)}</dd></div><div><dt className="text-xs">Planned start</dt><dd className="mt-1 font-semibold">{formatDate(c.terms.startDate)}</dd></div></dl>{participation?.id!==c.id&&<p className="mb-3 text-sm">Your participation is in Cycle {participation?.number}. Open your Cycle to review its history.</p>}<Button onClick={()=>{select(g.id);navigate('member-lifecycle',{groupId:g.id})}}>Open my Cycle</Button></article>
  }
  const historical=(g:typeof mine[number])=>['completed','cancelled','force-closed'].includes(cycleOf(g).status)
  return <ClientShell navigate={navigate} active="groups"><PageHeader title="My Groups" description="Your current participation, upcoming Cycles and history."/><div className="grid gap-5 md:grid-cols-2">{mine.filter(g=>!historical(g)).map(card)}</div>{!mine.length&&<EmptyState title="No Groups yet" description="Your participation will appear here when it is recorded. You can review available Groups and their terms." action={<Button variant="secondary" onClick={()=>navigate('discover')}>Explore Groups</Button>}/>} {!!mine.filter(historical).length&&<details className="member-history"><summary>Past Cycles and recovery ({mine.filter(historical).length})</summary><div className="mt-4 grid gap-5 md:grid-cols-2">{mine.filter(historical).map(card)}</div></details>}</ClientShell>
}
