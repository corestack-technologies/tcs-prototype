import {
  authoritySnapshot,
  effectivePermissions,
  requirePermission,
} from "./authorization.ts"
import {
  catalogue,
  privilegedRole,
  sensitivePermissions,
  type AccessState,
  type InternalSession,
  type UserStatus,
} from "./model.ts"
export type AccessAction = {
  type: "create-user"
  name: string
  identifier: string
  status: "Pending" | "Active"
  roleIds: string[]
} | { type: "update-user"; id: string; name: string; identifier: string } | {
  type: "status"
  id: string
  status: UserStatus
} | { type: "assign" | "remove"; id: string; roleId: string } | {
  type: "permission-add" | "permission-remove"
  id: string
  permission: string
} | { type: "create-role"; name: string; purpose: string } | {
  type: "update-role"
  id: string
  name: string
  purpose: string
  active: boolean
}
export function changeAccess(
  s: InternalSession,
  action: AccessAction,
  reason = "",
  at = new Date().toISOString(),
) {
  const permission = ["assign", "remove"].includes(action.type)
    ? "access.assignments.maintain"
    : [
          "permission-add",
          "permission-remove",
          "create-role",
          "update-role",
        ].includes(action.type)
      ? "access.roles.maintain"
      : "access.users.maintain"
  requirePermission(s, permission)
  if (!Number.isFinite(Date.parse(at)))
    throw Error("Valid change time required.")
  const actor = authoritySnapshot(s),
    oldPermissions = effectivePermissions(s),
    next: AccessState = structuredClone(s.access)
  let target = "id" in action ? action.id : "",
    before: unknown = null,
    after: unknown = null,
    privileged = false
  const meaningful = () => {
    if (reason.trim().length < 10)
      throw Error("Provide a meaningful reason of at least 10 characters.")
  }
  const identity = (name: string, identifier: string, id?: string) => {
    if (name.trim().length < 2 || identifier.trim().length < 3)
      throw Error("Enter a name and internal identifier.")
    if (
      next.users.some(
        (u) =>
          u.id !== id &&
          u.identifier.toLowerCase() === identifier.trim().toLowerCase(),
      )
    )
      throw Error("Internal identifier already exists.")
  }
  if (action.type === "create-user") {
    identity(action.name, action.identifier)
    if (!["Pending", "Active"].includes(action.status))
      throw Error("New users must be Pending or Active.")
    if (action.roleIds.length)
      requirePermission(s, "access.assignments.maintain")
    if (
      action.roleIds.some(
        (id) => !next.roles.some((r) => r.id === id && r.active),
      )
    )
      throw Error("Choose active roles.")
    privileged = next.roles.some(
      (r) => action.roleIds.includes(r.id) && privilegedRole(r),
    )
    if (privileged) meaningful()
    target = crypto.randomUUID()
    const u = {
      id: target,
      name: action.name.trim(),
      identifier: action.identifier.trim(),
      status: action.status,
      roleIds: [...new Set(action.roleIds)],
      createdAt: at,
      createdBy: actor.userId,
      ...(action.status === "Active" ? { activatedAt: at } : {}),
    }
    next.users.push(u)
    after = u
  } else if (action.type === "create-role") {
    if (action.name.trim().length < 2 || action.purpose.trim().length < 5)
      throw Error("Enter a role name and purpose.")
    if (
      next.roles.some(
        (r) => r.name.toLowerCase() === action.name.trim().toLowerCase(),
      )
    )
      throw Error("Role name already exists.")
    target = crypto.randomUUID()
    const r = {
      id: target,
      name: action.name.trim(),
      purpose: action.purpose.trim(),
      active: true,
      baseline: false,
      permissions: [],
    }
    next.roles.push(r)
    after = r
  } else if (
    action.type === "permission-add" ||
    action.type === "permission-remove" ||
    action.type === "update-role"
  ) {
    const r = next.roles.find((r) => r.id === action.id)
    if (!r) throw Error("Role not found.")
    before = structuredClone(r)
    if (action.type === "update-role") {
      if (r.baseline && !action.active)
        throw Error("Baseline roles cannot be disabled or deleted.")
      if (action.name.trim().length < 2 || action.purpose.trim().length < 5)
        throw Error("Enter a role name and purpose.")
      if (
        next.roles.some(
          (other) =>
            other.id !== r.id &&
            other.name.toLowerCase() === action.name.trim().toLowerCase(),
        )
      )
        throw Error("Role name already exists.")
      privileged = privilegedRole(r)
      r.name = action.name.trim()
      r.purpose = action.purpose.trim()
      r.active = action.active
    } else {
      if (!catalogue.some((p) => p.key === action.permission))
        throw Error("Unknown permission.")
      privileged =
        sensitivePermissions.includes(action.permission) || privilegedRole(r)
      r.permissions =
        action.type === "permission-add"
          ? [...new Set([...r.permissions, action.permission])]
          : r.permissions.filter((p) => p !== action.permission)
    }
    if (privileged) meaningful()
    after = r
  } else {
    const u = next.users.find((u) => u.id === action.id)
    if (!u) throw Error("Internal user not found.")
    before = structuredClone(u)
    if (action.type === "update-user") {
      identity(action.name, action.identifier, u.id)
      u.name = action.name.trim()
      u.identifier = action.identifier.trim()
    } else if (action.type === "status") {
      const allowed: Record<UserStatus, UserStatus[]> = {
        Pending: ["Active", "Deactivated"],
        Active: ["Suspended", "Deactivated"],
        Suspended: ["Active", "Deactivated"],
        Deactivated: [],
      }
      if (!allowed[u.status].includes(action.status))
        throw Error("This lifecycle transition is not available.")
      if (action.status !== "Active") meaningful()
      u.status = action.status
      u.reason = reason.trim()
      if (action.status === "Active") u.activatedAt = at
      if (action.status === "Suspended") u.suspendedAt = at
      if (action.status === "Deactivated") u.deactivatedAt = at
    } else if (action.type === "assign" || action.type === "remove") {
      const r = next.roles.find((r) => r.id === action.roleId)
      if (!r || (action.type === "assign" && !r.active))
        throw Error("Choose an active role.")
      privileged = privilegedRole(r)
      if (privileged) meaningful()
      if (
        action.type === "assign" &&
        u.id === actor.userId &&
        !u.roleIds.includes(r.id)
      )
        throw Error(
          "Self-assignment requires another authorized Access Administrator.",
        )
      u.roleIds =
        action.type === "assign"
          ? [...new Set([...u.roleIds, r.id])]
          : u.roleIds.filter((id) => id !== r.id)
    }
    after = u
  }
  const prospective = { ...s, access: next }
  if (
    effectivePermissions(prospective).some((p) => !oldPermissions.includes(p))
  )
    throw Error(
      "Self-escalation is blocked. Another authorized Access Administrator must make this change.",
    )
  if (
    !next.users.some(
      (u) =>
        u.status === "Active" &&
        [
          "access.users.view",
          "access.roles.view",
          "access.users.maintain",
          "access.roles.maintain",
          "access.assignments.maintain",
        ].every((p) =>
          effectivePermissions({ ...prospective, personaId: u.id }).includes(p),
        ),
    )
  )
    throw Error(
      "Keep at least one active Access Administrator with complete administration permissions.",
    )
  if (JSON.stringify(before) === JSON.stringify(after)) return
  const label =
    action.type === "status"
      ? action.status === "Active" &&
        (before as { status: string }).status === "Suspended"
        ? "User Reactivated"
        : "User " + action.status
      : ({
          "create-user": "User Created",
          "update-user": "User Updated",
          assign: "Role Assigned",
          remove: "Role Removed",
          "permission-add": "Role Permission Added",
          "permission-remove": "Role Permission Removed",
          "create-role": "Role Created",
          "update-role": "Role Updated",
        } as Record<string, string>)[action.type]
  next.history.push({
    id: crypto.randomUUID(),
    action: label,
    actor,
    target,
    at,
    reason: reason.trim(),
    before: structuredClone(before),
    after: structuredClone(after),
    privileged,
  })
  // Keep one live directory reference so existing sessions cannot retain stale authority.
  Object.assign(s.access, next)
}
