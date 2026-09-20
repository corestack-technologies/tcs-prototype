import type { Organization } from "../organizations/model.ts"
import {
  reconciliationDemo,
  type ReconciliationDemo,
} from "../reconciliation/seeds.ts"
import { lifecycleDemo, type LifecycleDemo } from "../lifecycle/seeds.ts"
import { payoutDemo } from "../payouts/seeds.ts"
import {
  emptyReconciliation,
  type ReconciliationState,
} from "../reconciliation/model.ts"
import { reconcile } from "../reconciliation/service.ts"
import { cycleOf } from "../groups/model.ts"
import type { ThriftGroup } from "../groups/model.ts"
export function operationsDemoWorld(org: Organization) {
  const finance = emptyReconciliation(org.id),
    groups: ThriftGroup[] = []
  const merge = (state: ReconciliationState) => {
    for (const key of [
      "settlements",
      "unmatchedPayments",
      "cases",
      "receivables",
      "history",
      "expectations",
    ] as const)
      (finance[key] as unknown[]).push(...state[key])
    finance.referenceAt = [finance.referenceAt, state.referenceAt]
      .filter((v): v is string => !!v)
      .sort()
      .at(-1)
  }
  const scenarios: ReconciliationDemo[] = [
    "Underpayment exception",
    "Unallocated provider payment",
    "Settlement variance",
    "Manual review required",
    "Late optional payment exception",
    "Advance exception after exit",
    "TCS share awaiting confirmation",
    "TCS share settled",
  ]
  scenarios.forEach((scenario, index) => {
    const demo = reconciliationDemo(
      org,
      `${org.id}-ops-finance-${index}`,
      scenario,
    )
    groups.push(demo.group)
    merge(demo.state)
  })
  const lifecycle: LifecycleDemo[] = [
    "Post-payout default / recovery",
    "Organization exit settlement breach",
    "Amendment consent pending",
    "Force Close pending review",
  ]
  const additional = [
    ...lifecycle.map((scenario, index) =>
      lifecycleDemo(org, `${org.id}-ops-life-${index}`, scenario),
    ),
    payoutDemo(org, `${org.id}-ops-payout-dispute`, "Disputed payout"),
    payoutDemo(
      org,
      `${org.id}-ops-payout-breach`,
      "Organization payout breach",
    ),
  ]
  for (const g of additional) {
    const at =
      g.payouts?.referenceAt ||
      cycleOf(g).active?.referenceAt ||
      g.history.at(-1)!.at
    merge(reconcile(emptyReconciliation(org.id), [g], org, at))
    groups.push(g)
  }
  // Scenario-specific clocks stay on their source records. Do not age unrelated samples
  // through another scenario's future clock or manufacture extra overdue exceptions.
  return { groups, finance }
}
