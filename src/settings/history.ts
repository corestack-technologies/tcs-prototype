import type { ThriftGroup } from "../groups/model.ts"
import type { ReconciliationState } from "../reconciliation/model.ts"
import { calendarDate } from "./service.ts"
/** Source history, never future schedule/due dates. Conservative across retained scenarios. */
export function protectedHistory(
  worlds: { groups: ThriftGroup[]; finance?: ReconciliationState }[],
) {
  const dates: string[] = []
  const scan = (value: unknown) => {
    if (!value || typeof value !== "object") return
    for (const [key, v] of Object.entries(value)) {
      if (
        typeof v === "string" &&
        [
          "at",
          "businessAt",
          "generatedAt",
          "recordedAt",
          "settledAt",
          "confirmedAt",
          "allocatedAt",
          "completedAt",
          "activatedAt",
          "openedAt",
          "paidAt",
          "transferredAt",
        ].includes(key) &&
        Number.isFinite(Date.parse(v))
      )
        dates.push(calendarDate(v))
      else if (typeof v === "object") scan(v)
    }
  }
  for (const w of worlds) {
    for (const g of w.groups) {
      if (
        g.cycles.some(
          (c) =>
            Object.values(c.financial).some((n) => n > 0) ||
            !!c.active?.obligations.length,
        ) ||
        g.payments?.transactions.length ||
        g.payouts?.records.length ||
        g.lifecycle?.recoveries.length ||
        g.manualContributions?.length
      )
        scan(g)
    }
    if (w.finance) scan(w.finance)
  }
  return dates.sort().at(-1) || ""
}
