// Date-only arithmetic uses UTC as a calendar container, independent of the host timezone.
export function calendarDate(
  year: number,
  monthIndex: number,
  day: number,
): string {
  return new Date(Date.UTC(year, monthIndex, day)).toISOString().slice(0, 10)
}
export function addDays(date: string, days: number): string {
  const d = new Date(date + "T00:00:00Z")
  return calendarDate(
    d.getUTCFullYear(),
    d.getUTCMonth(),
    d.getUTCDate() + days,
  )
}
export function localInstant(
  date: string,
  timezone: string,
  hour = 0,
  minute = 0,
  second = 0,
  millisecond = 0,
): string {
  const offsets: Record<string, number> = {
    "Africa/Lagos": 60,
    "Africa/Accra": 0,
    "Africa/Nairobi": 180,
  }
  if (!(timezone in offsets))
    throw Error(
      "This prototype supports the three timezones offered in approved setup: Lagos, Accra and Nairobi.",
    )
  const [year, month, day] = date.split("-").map(Number)
  return new Date(
    Date.UTC(
      year,
      month - 1,
      day,
      hour,
      minute - offsets[timezone],
      second,
      millisecond,
    ),
  ).toISOString()
}
