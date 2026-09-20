import { formatMoneyMinor } from '../design/format'
import { PageHeader } from '../design/foundation'
﻿import { useState } from "react"
import { useGroups } from "../groups/GroupContext"
import { useOrganization } from "../organizations/OrganizationContext"
import { useClient } from "../clients/ClientContext"
import { ClientShell, type ClientPageProps } from "../clients/ClientShell"
import { OwnerShell } from "../components/org/OwnerShell"
import { Button, Alert } from "../components/ui"
import { cycleOf } from "../groups/model"
import { PaymentBody } from "./PaymentBody"
import { PAYMENT_DEMOS, type PaymentDemo } from "./seeds"
export function PaymentDemos() {
  const { createPaymentDemo } = useGroups(),
    [scenario, setScenario] = useState<PaymentDemo>(PAYMENT_DEMOS[0])
  return (
    <details className="bg-[#EEF2FF] border border-[#C7D2FE] rounded-xl p-4 mb-5">
      <summary className="font-semibold cursor-pointer">
        Contribution payment demo scenarios
      </summary>
      <p className="text-sm my-3">
        Separate Groups using the existing personas and obligations. The local
        provider supplies deterministic payment facts; no bank connection or
        real money movement.
      </p>
      <div className="flex flex-wrap gap-3">
        <select
          aria-label="Payment demo scenario"
          className="border rounded-lg p-2 max-w-full"
          value={scenario}
          onChange={(e) => setScenario(e.target.value as PaymentDemo)}
        >
          {PAYMENT_DEMOS.map((d) => (
            <option key={d}>{d}</option>
          ))}
        </select>
        <Button size="sm" onClick={() => createPaymentDemo(scenario)}>
          Add payment demo
        </Button>
      </div>
    </details>
  )
}
export function PaymentWorkspace({
  navigate,
  owner = false,
  roundId,
}: ClientPageProps & { owner?: boolean ; roundId?: string }) {
  const { group, groups, select, pay, chooseOptional, checkPayment, error, reference, finance } =
      useGroups(),
    { organization } = useOrganization(),
    { client } = useClient(),
    [preview, setPreview] = useState("")
  if (!client) return <p className="p-6">Sign in to view contributions.</p>
  if (owner && organization?.ownerMemberId !== client.id)
    return <Alert type="error">Organization Owner access required.</Alert>
  const visible = groups.filter(
      (g) =>
        owner ||
        g.cycles.some((c) => c.participants.some((p) => p.id === client.id)),
    ),
    selected = group && visible.some((g) => g.id === group.id) ? group : null
  const body = (
    <div className="max-w-5xl mx-auto p-4 sm:p-6 space-y-5">{!owner&&<PageHeader title="Contributions & payments" description="Review required contributions, optional choices and the status of your payments."/>}
      {!owner && finance?.unmatchedPayments.filter(t=>t.memberId===client.id).map(t=><Alert key={t.provider+":"+t.providerReference} type="warning">Contribution confirmed · requires review. Received {formatMoneyMinor(t.amountMinor)} · reference {t.providerReference}. No contribution allocation was inferred.</Alert>)}
      <div className="flex flex-wrap gap-3">
        <Button
          variant="secondary"
          size="sm"
          onClick={() => navigate(owner ? "owner-groups" : "my-groups")}
        >
          My Groups
        </Button>
        <Button size="sm" variant="secondary" onClick={()=>navigate(owner?"owner-payouts":"member-payouts")}>Payouts</Button>
        {owner && <Button size="sm" variant="secondary" onClick={()=>navigate("owner-reconciliation")}>Reconciliation</Button>}
        {selected && (
          <Button
            variant="secondary"
            size="sm"
            onClick={() => navigate(owner ? "owner-cycles" : "group-detail")}
          >
            Cycle and obligations
          </Button>
        )}
        {organization?.ownerMemberId === client.id && (
          <Button
            variant="secondary"
            size="sm"
            onClick={() =>
              navigate(owner ? "member-payments" : "owner-collection")
            }
          >
            {owner ? "My Member contributions" : "Organization collection view"}
          </Button>
        )}
      </div>
      {owner && <><PageHeader title="Collections & payments" description="Review required contributions, recognized payments, optional amounts and exceptions separately."/><PaymentDemos /></>}
      {error && <Alert type="error">{error}</Alert>}
      <label className="block text-sm">
        Group{" "}
        <select
          aria-label="Payment Group"
          className="border rounded-lg p-2 ml-2 max-w-full"
          value={selected?.id || ""}
          onChange={(e) => {
            select(e.target.value)
            setPreview("")
          }}
        >
          <option value="">Choose a Group</option>
          {visible.map((g) => (
            <option key={g.id} value={g.id}>
              {g.name}
            </option>
          ))}
        </select>
      </label>
      {!selected || !organization ? (
        <section className="bg-white border rounded-xl p-6">
          <h1 className="text-2xl font-bold">
            {owner ? "Contribution collection" : "My payments"}
          </h1>
          <p className="text-sm mt-3">
            Choose a Group to see contributions and payment history.
            {!visible.length
              ? " No participation is available in the selected Organization."
              : ""}
          </p>
        </section>
      ) : (
        <>
          {owner && (
            <details className="bg-[#EEF2FF] border rounded-xl p-4">
              <summary className="font-semibold cursor-pointer">
                Prototype inspection tools
              </summary>
              <label className="block text-sm mt-3">
                Read-only Member perspective{" "}
                <select
                  aria-label="Payment Member preview"
                  className="border rounded p-2"
                  value={preview}
                  onChange={(e) => setPreview(e.target.value)}
                >
                  <option value="">Organization overview</option>
                  {cycleOf(selected).participants.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </label>
              {cycleOf(selected).active && (
                <div className="mt-3 flex flex-wrap gap-3">
                  {cycleOf(selected)
                    .active!.rounds.filter(
                      (r) =>
                        Date.parse(r.schedule.opensAt) >
                        Date.parse(cycleOf(selected).active!.referenceAt),
                    )
                    .map((r) => (
                      <Button
                        key={r.id}
                        size="sm"
                        variant="secondary"
                        onClick={() => reference(r.schedule.opensAt)}
                      >
                        Advance reference to Round {r.number} opening
                      </Button>
                    ))}
                </div>
              )}
            </details>
          )}
          {preview && owner && (
            <Alert type="info">
              Read-only Member preview. Creating or checking a payment requires
              the actual Member's session.
            </Alert>
          )}
          <PaymentBody
            key={selected.id + (owner ? preview : client.id)}
            group={selected}
            organization={organization}
            memberId={owner ? preview || undefined : client.id}
            readOnly={owner}
            initialRoundId={roundId}
            onPay={pay}
            onOptional={chooseOptional}
            onCheck={checkPayment}
          />
        </>
      )}
    </div>
  )
  return owner ? (
    <OwnerShell navigate={navigate} activeView="owner-collection">
      {body}
    </OwnerShell>
  ) : (
    <ClientShell navigate={navigate} active="payments">
      <div className="member-financial">{body}</div>
    </ClientShell>
  )
}
