import { PageHeader } from '../design/foundation'
﻿import { useState } from "react"
import { useGroups } from "../groups/GroupContext"
import { useOrganization } from "../organizations/OrganizationContext"
import { useClient } from "../clients/ClientContext"
import { ClientShell, type ClientPageProps } from "../clients/ClientShell"
import { OwnerShell } from "../components/org/OwnerShell"
import { Button, Alert } from "../components/ui"
import { PayoutBody } from "./PayoutBody"
import { PAYOUT_DEMOS, type PayoutDemo } from "./seeds"
export function PayoutDemos() {
  const { createPayoutDemo } = useGroups(),
    [scenario, setScenario] = useState<PayoutDemo>(PAYOUT_DEMOS[0])
  return (
    <details className="bg-[#EEF2FF] border rounded-xl p-4">
      <summary className="font-semibold cursor-pointer">
        Manual payout demo scenarios
      </summary>
      <p className="text-sm my-3">
        Shared 4A collection records and Organization-recorded external transfer
        examples. TCS sends no money.
      </p>
      <select
        aria-label="Payout demo scenario"
        className="border rounded p-2 max-w-full mr-3"
        value={scenario}
        onChange={(e) => setScenario(e.target.value as PayoutDemo)}
      >
        {PAYOUT_DEMOS.map((d) => (
          <option key={d}>{d}</option>
        ))}
      </select>
      <Button size="sm" onClick={() => createPayoutDemo(scenario)}>
        Add payout demo
      </Button>
    </details>
  )
}
export function PayoutWorkspace({
  navigate,
  owner = false,
}: ClientPageProps & { owner?: boolean }) {
  const { group, groups, select, payout, payoutBanks, reference, error } =
      useGroups(),
    { organization } = useOrganization(),
    { client } = useClient(), [preview,setPreview]=useState("")
  if (!client || !organization)
    return (
      <p className="p-6">
        Choose an Organization and Group to view payout records.
      </p>
    )
  if (owner && organization.ownerMemberId !== client.id)
    return <Alert type="error">Organization Owner access required.</Alert>
  const visible = groups.filter(
      (g) =>
        owner ||
        g.cycles.some((c) => c.participants.some((p) => p.id === client.id)),
    ),
    selected = group && visible.some((g) => g.id === group.id) ? group : null
  const content = (
    <div className="max-w-5xl mx-auto p-4 sm:p-6 space-y-5">{!owner&&<PageHeader title="Your payouts" description="Track entitlement, transfers and receipt confirmation separately."/>}
      <div className="flex flex-wrap gap-3">
        <Button
          size="sm"
          variant="secondary"
          onClick={() => navigate(owner ? "owner-groups" : "my-groups")}
        >
          My Groups
        </Button>
        <Button
          size="sm"
          variant="secondary"
          onClick={() =>
            navigate(owner ? "owner-collection" : "member-payments")
          }
        >
          Contributions
        </Button>
        {organization.ownerMemberId === client.id && (
          <Button
            size="sm"
            variant="secondary"
            onClick={() => navigate(owner ? "member-payouts" : "owner-payouts")}
          >
            {owner ? "My Member payouts" : "Organization payout view"}
          </Button>
        )}
        {!owner && (
          <Button
            size="sm"
            variant="secondary"
            onClick={() => navigate("client-profile")}
          >
            My validated bank details
          </Button>
        )}
      </div>
      {owner && <><section className="owner-card p-5"><h1 className="mb-3">Organization payouts</h1><p className="text-sm text-[var(--tcs-text-muted)]">TCS records the payout. Your Organization makes the bank transfer.</p><ol className="owner-workflow" aria-label="Manual payout sequence">{["Review instruction and bank","Transfer from Organization bank","Record reference and evidence","Await Member confirmation","Review completion or dispute"].map((label,i)=><li key={label}>{i+1}. {label}</li>)}</ol></section><PayoutDemos /></>}
      {error && <Alert type="error">{error}</Alert>}
      <label className="block text-sm">
        Group{" "}
        <select
          aria-label="Payout Group"
          className="border rounded p-2 max-w-full"
          value={selected?.id || ""}
          onChange={(e) => select(e.target.value)}
        >
          <option value="">Choose a Group</option>
          {visible.map((g) => (
            <option key={g.id} value={g.id}>
              {g.name}
            </option>
          ))}
        </select>
      </label>
      {selected ? (
        <>
          {owner && selected.payouts && (
            <details className="bg-[#EEF2FF] border rounded-xl p-4">
              <summary className="font-semibold cursor-pointer">
                Prototype payout reference time
              </summary>
              <p className="text-sm mt-3">{selected.payouts.referenceAt}</p>
              <div className="flex flex-wrap gap-3 mt-3">
                {[
                  ...new Set(
                    selected.payouts.records.flatMap((p) =>
                      p.installments.flatMap((i) =>
                        [i.confirmationDueAt, i.disputeClosesAt].filter(
                          (at): at is string => !!at,
                        ),
                      ),
                    ),
                  ),
                ]
                  .filter(
                    (at) =>
                      Date.parse(at) >
                      Date.parse(selected.payouts!.referenceAt!),
                  )
                  .map((at) => (
                    <Button
                      key={at}
                      size="sm"
                      variant="secondary"
                      onClick={() => reference(at)}
                    >
                      Advance to {at}
                    </Button>
                  ))}
              </div>
            </details>
          )}
          {owner&&<details className="bg-[#EEF2FF] border rounded-xl p-4"><summary className="font-semibold cursor-pointer">Prototype read-only Member perspective</summary><select aria-label="Payout Member preview" className="border rounded p-2 mt-3" value={preview} onChange={e=>setPreview(e.target.value)}><option value="">Organization overview</option>{[...new Map(selected.cycles.flatMap(c=>c.participants.map(p=>[p.id,p] as const))).values()].map(p=><option key={p.id} value={p.id}>{p.name}</option>)}</select><p className="text-xs mt-2">This inspection view cannot confirm receipt for another Member.</p></details>}
          <PayoutBody
            key={selected.id+preview}
            group={selected}
            organization={organization}
            memberId={owner ? preview||undefined : client.id}
            banks={payoutBanks}
            onAction={owner&&preview?undefined:payout}
          />
        </>
      ) : (
        <p className="text-sm">
          Choose a Group with a payout schedule, or inspect a separate demo.
        </p>
      )}
    </div>
  )
  return owner ? (
    <OwnerShell navigate={navigate} activeView="owner-payouts">
      {content}
    </OwnerShell>
  ) : (
    <ClientShell navigate={navigate} active="payouts">
      <div className="member-financial">{content}</div>
    </ClientShell>
  )
}
