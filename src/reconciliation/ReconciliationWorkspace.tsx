import { businessTimestamp } from '../settings/service'
import { useState } from "react"
import { useGroups } from "../groups/GroupContext"
import { useClient } from "../clients/ClientContext"
import { useOrganization } from "../organizations/OrganizationContext"
import { OwnerShell } from "../components/org/OwnerShell"
import { Button, Alert } from "../components/ui"
import type { ClientPageProps } from "../clients/ClientShell"
import {
  RECONCILIATION_DEMOS,
  settlementFor,
  type ReconciliationDemo,
} from "./seeds"
import { emptyReconciliation } from "./model"
import { ReconciliationBody } from "./ReconciliationBody"
export function ReconciliationWorkspace({ navigate }: ClientPageProps) {
  const { organization } = useOrganization(),
    { client } = useClient(),
    {
      groups,
      group,
      select,
      finance,
      error,
      createReconciliationDemo,
      receiveDemoSettlement,
      financeReference,
      recordManual,
      handoffCase,
      recordRevenuePayment,
    } = useGroups()
  const [scenario, setScenario] = useState<ReconciliationDemo>(
      RECONCILIATION_DEMOS[0],
    ),
    [at, setAt] = useState(""),
    [inputError, setInputError] = useState("")
  if (!organization || client?.id !== organization.ownerMemberId)
    return <Alert type="error">Organization Owner access required.</Alert>
  const state = finance || emptyReconciliation(organization.id)
  return (
    <OwnerShell navigate={navigate} activeView="owner-reconciliation">
      <div className="max-w-6xl mx-auto p-4 sm:p-6 space-y-5">
        <div className="flex flex-wrap gap-3">
          <Button
            size="sm"
            variant="secondary"
            onClick={() => navigate("owner-collection")}
          >
            Collections
          </Button>
          <Button
            size="sm"
            variant="secondary"
            onClick={() => navigate("owner-payouts")}
          >
            Payouts
          </Button>
          <Button
            size="sm"
            variant="secondary"
            onClick={() => navigate("owner-settings")}
          >
            Settlement account & settings
          </Button>
        </div>
        {error && <Alert type="error">{error}</Alert>}
        {inputError && <Alert type="error">{inputError}</Alert>}
        <details className="bg-[#EEF2FF] border rounded-xl p-4">
          <summary className="font-semibold cursor-pointer">
            Prototype reconciliation scenarios
          </summary>
          <p className="text-sm mt-2">
            Deterministic provider events only. No bank connectivity. Seeded
            costs, manual permissions and timing windows are explicit demo
            policy.
          </p>
          <div className="flex flex-wrap gap-3 mt-3">
            <select
              aria-label="Reconciliation demo"
              className="border rounded p-2"
              value={scenario}
              onChange={(e) =>
                setScenario(e.target.value as ReconciliationDemo)
              }
            >
              {RECONCILIATION_DEMOS.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
            <Button
              size="sm"
              onClick={() => createReconciliationDemo(scenario)}
            >
              Add reconciliation demo
            </Button>
          </div>
          <div className="flex gap-3 mt-3">
            <input
              aria-label="Financial reference time"
              className="border rounded p-2"
              placeholder="Reference time, ISO UTC"
              value={at}
              onChange={(e) => setAt(e.target.value)}
            />
            <Button
              size="sm"
              variant="secondary"
              onClick={() => financeReference(at)}
            >
              Advance reference time
            </Button>
          </div>
          {group && (
            <Button
              className="mt-3"
              size="sm"
              variant="secondary"
              onClick={() => {
                try {
                  const event = settlementFor(
                    organization,
                    [group],
                    "DEMO-" + group.id,
                    state.referenceAt || businessTimestamp(),
                  )
                  receiveDemoSettlement(event)
                  setInputError("")
                } catch (e) {
                  setInputError(
                    e instanceof Error
                      ? e.message
                      : "Unable to simulate settlement.",
                  )
                }
              }}
            >
              Simulate provider settlement for selected Group
            </Button>
          )}
        </details>
        <label className="block text-sm">
          Group context
          <select
            className="border rounded-lg p-2 ml-2"
            value={group?.id || ""}
            onChange={(e) => select(e.target.value)}
          >
            <option value="">Select Group</option>
            {groups.map((g) => (
              <option key={g.id} value={g.id}>
                {g.name}
              </option>
            ))}
          </select>
        </label>
        <ReconciliationBody
          organization={organization}
          groups={groups}
          state={state}
          selected={group || undefined}
          onManual={recordManual}
          onRevenuePayment={recordRevenuePayment}
          onHandoff={handoffCase}
        />
      </div>
    </OwnerShell>
  )
}
