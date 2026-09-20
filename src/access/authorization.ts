import {
  catalogue,
  type InternalSession,
  type AuthoritySnapshot,
} from "./model.ts"
export function currentUser(s: InternalSession | null | undefined) {
  return s?.kind === "tcs-internal"
    ? s.access?.users.find((u) => u.id === s.personaId)
    : undefined
}
export function effectivePermissions(
  s: InternalSession | null | undefined,
): string[] {
  const u = currentUser(s)
  if (!u || u.status !== "Active" || u.security?.locked) return []
  return [
    ...new Set(
      s!.access.roles
        .filter((r) => r.active && u.roleIds.includes(r.id))
        .flatMap((r) => r.permissions)
        .filter((p) => catalogue.some((c) => c.key === p)),
    ),
  ].sort()
}
export const isInternalUserActive = (s: InternalSession | null | undefined) =>
  currentUser(s)?.status === "Active" && !currentUser(s)?.security?.locked
export const hasPermission = (
  s: InternalSession | null | undefined,
  p: string,
) => effectivePermissions(s).includes(p)
export const hasAnyPermission = (
  s: InternalSession | null | undefined,
  ps: string[],
) => ps.some((p) => hasPermission(s, p))
export const canPerformAction = hasPermission
export function canAccessModule(
  s: InternalSession | null | undefined,
  module: string,
) {
  return module === "scheduled-processes" ? hasPermission(s,"operations.process.view") : module === "settings" ? hasPermission(s,"settings.view") : module === "operations"
    ? hasPermission(s, "operations.case.view")
    : module === "access-management"
      ? hasAnyPermission(s, ["access.users.view", "access.roles.view", "security.overview.view", "security.sessions.view", "security.events.view", "security.accounts.locked.view"])
      : module === "security" ? hasAnyPermission(s,["security.overview.view","security.sessions.view","security.events.view","security.accounts.locked.view"]) : false
}
export function requirePermission(
  s: InternalSession | null | undefined,
  p: string,
): asserts s is InternalSession {
  if (!hasPermission(s, p))
    throw Error(
      "Access denied: " +
        p +
        " permission and an active internal user are required.",
    )
}
export function authoritySnapshot(s: InternalSession): AuthoritySnapshot {
  const u = currentUser(s)
  if (!u || u.status !== "Active")
    throw Error("An active internal user is required.")
  return {
    userId: u.id,
    name: u.name,
    roles: s.access.roles
      .filter((r) => r.active && u.roleIds.includes(r.id))
      .map((r) => ({ id: r.id, name: r.name })),
    permissions: effectivePermissions(s),
  }
}
export const availableReviewers = (s: InternalSession) =>
  s.access.users
    .filter((u) =>
      hasPermission({ ...s, personaId: u.id }, "operations.case.view"),
    )
    .map((u) => ({ id: u.id, name: u.name }))
