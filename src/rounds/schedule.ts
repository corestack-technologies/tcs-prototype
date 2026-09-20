import type { Draft } from "../groups/model.ts"
import type { RoundSchedule } from "./model.ts"
import { addDays, calendarDate, localInstant } from "./calendar.ts"
export const scheduleDefaults = {
  Monthly: { openingDay: 20, graceDays: 2 },
  Daily: { windowDays: 1, graceDays: 0 },
  Weekly: { windowDays: 7, graceDays: 1 },
  Biweekly: { windowDays: 14, graceDays: 2 },
} as const
export function schedules(terms: Draft): RoundSchedule[] {
  const start = terms.startDate,
    zone = terms.timezone,
    date = new Date(start + "T00:00:00Z")
  if (
    !Number.isFinite(date.getTime()) ||
    date.toISOString().slice(0, 10) !== start
  )
    throw Error("Invalid approved effective date.")
  const monthly = terms.frequency === "Monthly",
    daily = terms.frequency === "Daily",
    periodDays = terms.frequency === "Biweekly" ? 14 : daily ? 1 : 7
  const window = daily ? 1 : terms.contributionWindowDays
  if (
    !monthly &&
    (!Number.isInteger(window) || window < 1 || window > periodDays)
  )
    throw Error(
      "Approved contribution window must fit its contribution period.",
    )
  if (!Number.isInteger(terms.gracePeriodDays) || terms.gracePeriodDays < 0)
    throw Error("Invalid approved grace period.")
  let first = start
  if (!monthly && !daily) first = addDays(start, (7 - date.getUTCDay()) % 7)
  const firstMonth =
    date.getUTCMonth() +
    (monthly && date.getUTCDate() > terms.contributionOpenDay ? 1 : 0)
  return Array.from({ length: terms.positions }, (_, i) => {
    const periodStart = monthly
      ? calendarDate(date.getUTCFullYear(), firstMonth + i, 1)
      : addDays(first, i * periodDays)
    const d = new Date(periodStart + "T00:00:00Z")
    const opens = monthly
      ? calendarDate(
          d.getUTCFullYear(),
          d.getUTCMonth(),
          terms.contributionOpenDay,
        )
      : periodStart
    const due = monthly
      ? calendarDate(d.getUTCFullYear(), d.getUTCMonth() + 1, 0)
      : addDays(periodStart, window - 1)
    const end = monthly ? due : addDays(periodStart, periodDays - 1),
      late = addDays(due, 1 + (daily ? 0 : terms.gracePeriodDays))
    return {
      periodStart: localInstant(periodStart, zone),
      periodEnd: localInstant(end, zone, 23, 59, 59, 999),
      opensAt: localInstant(opens, zone),
      dueDayStartsAt: localInstant(due, zone),
      dueAt: localInstant(due, zone, 23, 59, 59, 999),
      lateAt: localInstant(late, zone),
      payoutTargetAt: localInstant(late, zone, daily ? 12 : 0),
      timezone: zone,
    }
  })
}
