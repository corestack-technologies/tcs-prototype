import { seedSecurity } from './securitySeeds.ts'
import { catalogue, type AccessState, type InternalSession } from "./model.ts"
export function seedAccess(): AccessState {
  const triage = catalogue
    .filter((p) => p.domain === "Operations")
    .map((p) => p.key)
  const verification = catalogue
    .filter(
      (p) =>
        p.domain === "Clients" ||
        p.key.startsWith("organizations.application."),
    )
    .map((p) => p.key)
  const finance = [
    ...catalogue.filter((p) => p.domain === "Payments").map((p) => p.key),
    "organizations.settlement_account.review",
    "disputes.review",
    "disputes.decide",
    "disputes.appeal_review",
    "thrift.force_close.recommend",
  ]
  const roles = [
    {
      id: "analyst",
      name: "Operations Analyst",
      purpose: "Case triage, notes and escalation",
      permissions: [...triage, "operations.process.view", "thrift.force_close.recommend", "reports.operations.view"],
    },
    {
      id: "verification",
      name: "Verification Reviewer",
      purpose: "Member verification and Organization applications",
      permissions: [...triage, ...verification, "reports.operations.view"],
    },
    {
      id: "finance",
      name: "Financial Operations Reviewer",
      purpose: "Financial exceptions, receipts and evidenced disputes",
      permissions: [...triage, ...finance, "operations.process.view", "operations.process.run", "reports.operations.view", "reports.financial.view"],
    },
    {
      id: "supervisor",
      name: "Operations Supervisor",
      purpose: "Sensitive operational decisions with independent review",
      permissions: catalogue
        .filter((p) => p.domain !== "Settings" && p.domain !== "Access Management" && p.domain !== "Security" && !["reports.access_audit.view", "reports.security.view"].includes(p.key))
        .map((p) => p.key),
    },
    {
      id: "access-admin",
      name: "Access Administrator",
      purpose: "Internal access administration only",
      permissions: catalogue
        .filter((p) => p.domain === "Access Management" || p.domain === "Security" || ["reports.access_audit.view", "reports.security.view"].includes(p.key))
        .map((p) => p.key),
    },
    ...[
 {id:'settings-admin',name:'Platform Settings Administrator',purpose:'Explicit platform configuration authority',permissions:['settings.view','settings.runtime_controls.manage','settings.business_date.view','settings.business_date.manage','settings.audit.view','settings.diagnostics.view','reports.platform.view']},
 {id:'settings-viewer',name:'Settings Viewer',purpose:'Read-only configuration',permissions:['settings.view','settings.business_date.view','settings.audit.view','settings.diagnostics.view','reports.platform.view']},
 {id:'runtime-manager',name:'Runtime Controls Manager',purpose:'Runtime controls only',permissions:['settings.view','settings.runtime_controls.manage','settings.audit.view']},
 {id:'date-manager',name:'Business Date Manager',purpose:'Non-production Business Date only',permissions:['settings.view','settings.business_date.view','settings.business_date.manage','settings.audit.view']},
 ],
  ].map((r) => ({ ...r, active: true, baseline: true }))
  const at = "2026-01-01T09:00:00Z"
  const users = [
 ["settings-admin", "Kemi", "settings-admin", "Active"],
 ["settings-viewer", "Lara", "settings-viewer", "Active"],
 ["runtime-manager", "Musa", "runtime-manager", "Active"],
 ["date-manager", "Ngozi", "date-manager", "Active"],
    ["ops-analyst", "Ada", "analyst", "Active"],
    ["verification-reviewer", "Bola", "verification", "Active"],
    ["finance-reviewer", "Chidi", "finance", "Active"],
    ["ops-supervisor", "Dami", "supervisor", "Active"],
    ["access-admin", "Evelyn", "access-admin", "Active"],
    ["multi-reviewer", "Femi", "verification,finance", "Active"],
    ["access-admin-2", "Grace", "access-admin", "Active"],
    ["suspended-user", "Hauwa", "finance", "Suspended"],
    ["deactivated-user", "Ife", "analyst", "Deactivated"],
    ["pending-user", "Jide", "analyst", "Pending"],
  ].map(([id, name, roleIds, status]) => ({
    id,
    name,
    identifier: (id.startsWith("settings-") || ["runtime-manager","date-manager"].includes(id) ? id : name.toLowerCase()) + "@corestack.example",
    roleIds: roleIds.split(","),
    status: status as AccessState["users"][number]["status"],
    createdAt: at,
    createdBy: "Prototype seed",
    ...(status !== "Pending" ? { activatedAt: at } : {}),
    ...(status === "Suspended"
      ? { suspendedAt: at, reason: "Seeded suspension scenario" }
      : {}),
    ...(status === "Deactivated"
      ? { deactivatedAt: at, reason: "Seeded departure scenario" }
      : {}),
  }))
  const state:AccessState={users,roles,history:[]}
  seedSecurity(state)
  return state
}
export const seedSession = (
  personaId = "ops-analyst",
  access = seedAccess(),
): InternalSession => ({ kind: "tcs-internal", personaId, access })
