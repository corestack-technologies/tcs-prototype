import type { InternalSession } from "../access/model.ts"
import { currentUser, requirePermission } from "../access/authorization.ts"
export type Mode = "REAL_TIME" | "CONTROLLED"
export type Environment = "Prototype / UAT Simulation" | "Production"
export interface Change {
  id: string
  category: "Business Date" | "Runtime Control"
  action: string
  before: string
  after: string
  actor: string
  actorId: string
  reason: string
  at: string
  environment: Environment
  priorMode?: Mode
  priorDate?: string
  newMode?: Mode
  newDate?: string
  key?: string
  previousValue?: string
  newValue?: string
}
export interface SettingsState {
  environment: Environment
  mode: Mode
  controlledDate: string | null
  revision: number
  history: readonly Change[]
  verificationMode: "EMAIL" | "PHONE" | "BOTH"
}
export const createSettings = (
  environment: Environment = "Prototype / UAT Simulation",
): SettingsState => ({
  environment,
  mode: "REAL_TIME",
  controlledDate: null,
  revision: 0,
  history: [],
  verificationMode: "BOTH",
})
export const platformSettings = createSettings()
export const actualTimestamp = () => new Date().toISOString()
export function calendarDate(at: string) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Africa/Lagos",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(at))
}
export function businessClock(
  state = platformSettings,
  actual = actualTimestamp(),
) {
  const date =
    state.environment === "Production" || state.mode === "REAL_TIME"
      ? calendarDate(actual)
      : state.controlledDate!
  return {
    actualTimestamp: actual,
    businessDate: date,
    mode: state.environment === "Production" ? "REAL_TIME" as Mode : state.mode,
    environment: state.environment,
    businessTimestamp:
      state.mode === "CONTROLLED" && state.environment !== "Production"
        ? date + "T00:00:00+01:00"
        : actual,
  }
}
/** Explicit scenario reference takes precedence only for deterministic scenario calls. */
export const businessTimestamp = (scenarioReference?: string) =>
  scenarioReference || businessClock().businessTimestamp
export const controls = [
  {
    key: "CLIENT_VERIFICATION_MODE",
    name: "Contact verification mode",
    description:
      "Required contact channels for future onboarding eligibility. Identity/KYC decisions remain unchanged.",
    valueType: "Enum",
    allowed: ["EMAIL", "PHONE", "BOTH"],
    scope: "Environment / platform",
    environments: ["Prototype / UAT Simulation", "Production"],
    sensitivity: "Governed, no secrets",
  },
] as const
export function contactsVerified(
  contacts: { email: boolean; phone: boolean },
  state = platformSettings,
) {
  return state.verificationMode === "EMAIL"
    ? contacts.email
    : state.verificationMode === "PHONE"
      ? contacts.phone
      : contacts.email && contacts.phone
}
export type Request = { category: "Business Date"; mode: Mode; date?: string } | {
  category: "Runtime Control"
  key: string
  value: string
}
export interface Preview {
  request: Request
  reason: string
  revision: number
  actorId: string
  before: string
  after: string
  action: string
  direction: string
  warnings: string[]
  protectedThrough: string
  actualDate: string
}
function validDate(date: string) {
  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(date) ||
    !Number.isFinite(Date.parse(date)) ||
    new Date(date).toISOString().slice(0, 10) !== date
  )
    throw Error("Select a valid calendar date.")
}
export function settingsAccess(
  session: InternalSession | null,
  permission = "settings.view",
) {
  requirePermission(session, "settings.view")
  requirePermission(session, permission)
}
export function readHistory(
  session: InternalSession | null,
  state = platformSettings,
) {
  settingsAccess(session, "settings.audit.view")
  return state.history
    .filter(
      (e) =>
        e.category !== "Business Date" ||
        (!!session &&
          session.access.roles.some(
            (r) =>
              r.active &&
              currentUser(session)?.roleIds.includes(r.id) &&
              r.permissions.includes("settings.business_date.view"),
          )),
    )
    .map((e) => ({ ...e }))
}
export function previewChange(
  session: InternalSession | null,
  request: Request,
  reason: string,
  protectedThrough = "",
  state = platformSettings,
  actual = actualTimestamp(),
): Preview {
  settingsAccess(
    session,
    request.category === "Business Date"
      ? "settings.business_date.manage"
      : "settings.runtime_controls.manage",
  )
  if (request.category === "Business Date")
    settingsAccess(session, "settings.business_date.view")
  if (!reason.trim()) throw Error("A reason is required.")
  const clock = businessClock(state, actual),
    warnings: string[] = []
  let before: string,
    after: string,
    action: string,
    direction = "Value change"
  if (request.category === "Business Date") {
    if (state.environment === "Production")
      throw Error("Business Date control is non-production only.")
    if (!["REAL_TIME", "CONTROLLED"].includes(request.mode))
      throw Error("Invalid mode.")
    const date =
      request.mode === "REAL_TIME" ? calendarDate(actual) : request.date || ""
    validDate(date)
    before = clock.mode + " / " + clock.businessDate
    after = request.mode + " / " + date
    direction =
      date > clock.businessDate
        ? "Forward"
        : date < clock.businessDate
          ? "Backward"
          : "Same date"
    if (
      request.mode === "CONTROLLED" &&
      protectedThrough &&
      date < protectedThrough
    )
      throw Error(
        "Rewind rejected: protected processed history through " +
          protectedThrough +
          ". Reset/reseed the test dataset to return to an earlier scenario.",
      )
    if (
      request.mode === "CONTROLLED" &&
      state.mode === "CONTROLLED" &&
      date <= clock.businessDate
    )
      throw Error("Advance must select a future Business Date.")
    if (protectedThrough)
      warnings.push(
        "Processed history is protected through " + protectedThrough + ".",
      )
    if (request.mode === "REAL_TIME" && protectedThrough > date)
      warnings.push(
        "Existing business records remain preserved and may contain dates later than the current Real-Time Business Date. Reset/reseed for an earlier scenario.",
      )
    action =
      request.mode === "REAL_TIME"
        ? "RESET_TO_REAL_TIME"
        : state.mode === "REAL_TIME"
          ? "ENABLE_CONTROLLED"
          : "ADVANCE"
  } else {
    if (
      request.key !== "CLIENT_VERIFICATION_MODE" ||
      !["EMAIL", "PHONE", "BOTH"].includes(request.value)
    )
      throw Error("Unknown control or invalid allowed value.")
    before = state.verificationMode
    after = request.value
    action = request.key
  }
  if (before === after) throw Error("No configuration change selected.")
  return {
    request: { ...request },
    reason: reason.trim(),
    revision: state.revision,
    actorId: currentUser(session)!.id,
    before,
    after,
    action,
    direction,
    warnings,
    protectedThrough,
    actualDate: calendarDate(actual),
  }
}
export function applyChange(
  session: InternalSession | null,
  preview: Preview,
  confirmed: boolean,
  protectedThrough = "",
  state = platformSettings,
  actual = actualTimestamp(),
) {
  if (!confirmed) throw Error("Confirmation is required.")
  const fresh = previewChange(
    session,
    preview.request,
    preview.reason,
    protectedThrough,
    state,
    actual,
  )
  if (JSON.stringify(fresh) !== JSON.stringify(preview))
    throw Error("Configuration, actor, date or history changed. Preview again.")
  const event: Change = Object.freeze({
    id: "configuration-" + (state.revision + 1),
    category: preview.request.category,
    action: preview.action,
    before: preview.before,
    after: preview.after,
    actor: currentUser(session)!.name,
    actorId: preview.actorId,
    reason: preview.reason,
    at: actual,
    environment: state.environment,
    ...(preview.request.category === "Business Date"
      ? {
          priorMode: state.mode,
          priorDate: businessClock(state, actual).businessDate,
          newMode: preview.request.mode,
          newDate:
            preview.request.mode === "REAL_TIME"
              ? calendarDate(actual)
              : preview.request.date,
        }
      : {
          key: preview.request.key,
          previousValue: preview.before,
          newValue: preview.after,
        }),
  })
  if (preview.request.category === "Business Date") {
    state.mode = preview.request.mode
    state.controlledDate =
      state.mode === "CONTROLLED" ? preview.request.date! : null
  } else
    state.verificationMode = (preview.request
      .value as SettingsState["verificationMode"])
  state.history = Object.freeze([...state.history, event])
  state.revision++
  return event
}
