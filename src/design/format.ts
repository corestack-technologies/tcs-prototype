/** Display only: never use formatted strings as financial or lifecycle input. */
export function formatDate(value: string, timeZone = 'Africa/Lagos'): string {
  if (!value) return 'Not recorded'
  const dateOnly = /^\d{4}-\d{2}-\d{2}$/.test(value)
  const date = new Date(dateOnly ? value + 'T12:00:00Z' : value)
  if (!Number.isFinite(date.getTime())) return value
  return new Intl.DateTimeFormat('en-GB', { timeZone: dateOnly ? 'UTC' : timeZone, day:'numeric', month:'short', year:'numeric', ...(dateOnly ? {} : {hour:'2-digit',minute:'2-digit',hour12:true,timeZoneName:'short' as const}) }).format(date)
}
export function formatMoneyMinor(value: number): string {
  if (!Number.isFinite(value)) return 'Not available'
  return new Intl.NumberFormat('en-NG',{style:'currency',currency:'NGN',minimumFractionDigits:0,maximumFractionDigits:2}).format(Object.is(value,-0)?0:value/100)
}
