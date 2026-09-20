export type UserStatus = "Pending" | "Active" | "Suspended" | "Deactivated"
export interface InternalUser {
  security?: { locked:boolean; lockedAt?:string; lockReason?:string; failedAttempts:number; lastFailureAt?:string; lastSuccessAt?:string; unlockedAt?:string }
  id: string
  name: string
  identifier: string
  status: UserStatus
  roleIds: string[]
  createdAt: string
  createdBy: string
  activatedAt?: string
  suspendedAt?: string
  deactivatedAt?: string
  reason?: string
}
export interface Role {
  id: string
  name: string
  purpose: string
  active: boolean
  baseline: boolean
  permissions: string[]
}
export interface AuthoritySnapshot {
  userId: string
  name: string
  roles: { id: string; name: string }[]
  permissions: string[]
}
export interface AccessEvent {
  id: string
  action: string
  actor: AuthoritySnapshot
  target: string
  at: string
  reason: string
  before: unknown
  after: unknown
  privileged: boolean
}
export interface AccessState {
  security?: { sessions:SecuritySession[]; events:SecurityEvent[] }
  users: InternalUser[]
  roles: Role[]
  history: AccessEvent[]
}
export interface SecuritySession {
 id:string
 userId:string
 status:'Active'|'Expired'|'Revoked'
 createdAt:string
 lastActivityAt:string
 expiresAt:string
 device:string
 network:string
 trust:'Trusted demo device'|'New device'|'Untrusted demo device'
 revokedAt?:string
 revokedBy?:string
 reason?:string
 auditId?:string
}
export interface SecurityEvent {
 id:string
 type:string
 userId?:string
 actor?:AuthoritySnapshot
 at:string
 result:string
 reason:string
 context?:string
 sessionId?:string
 accessChangeId?:string
 before?:unknown
 after?:unknown
}
// personaId is retained as the stable historical actor ID, never as authority.
export interface InternalSession {
  kind: "tcs-internal"
  personaId: string
  access: AccessState
}
const groups: Record<string, Record<string, string>> = {
  Settings: {
 'settings.view':'View platform Settings',
 'settings.runtime_controls.manage':'Manage runtime controls',
 'settings.business_date.view':'View Business Date',
 'settings.business_date.manage':'Manage non-production Business Date',
 'settings.audit.view':'View configuration history',
 'settings.diagnostics.view':'View read-only system diagnostics',
 },
  'Scheduled Processes': {
 'operations.process.view':'View scheduled processes and run history',
 'operations.process.run':'Execute prototype lifecycle processes',
 'operations.process.retry':'Retry failed prototype lifecycle runs',
 },
  Reports: {
    'reports.platform.view': 'View platform overview and growth reports',
    'reports.operations.view': 'View Operations oversight reports',
    'reports.financial.view': 'View platform financial reports',
    'reports.access_audit.view': 'View Access Audit reports',
    'reports.security.view': 'View prototype security reports',
  },
  Security: {
    'security.overview.view':'View security overview',
    'security.sessions.view':'View simulated sessions',
    'security.sessions.revoke':'Revoke simulated sessions',
    'security.events.view':'View security events',
    'security.accounts.locked.view':'View locked internal accounts',
    'security.accounts.unlock':'Unlock internal accounts',
  },
  Operations: {
    "operations.case.view": "View cases",
    "operations.case.assign": "Assign and triage cases",
    "operations.case.note": "Add internal notes",
    "operations.case.escalate": "Escalate cases",
  },
  Clients: {
    "clients.verification.review": "Review verification",
    "clients.verification.approve": "Approve verification",
    "clients.verification.reject": "Reject verification",
    "clients.verification.request_information":
      "Request verification information",
  },
  Organizations: {
    "organizations.application.review": "Review applications",
    "organizations.application.approve": "Approve applications",
    "organizations.application.reject": "Reject applications",
    "organizations.application.request_information":
      "Request application information",
    "organizations.settlement_account.review":
      "Review settlement account changes",
  },
  Payments: {
    "payments.manual_contribution.review": "Review manual contributions",
    "payments.exception.review": "Review payment exceptions",
    "payments.reconciliation.correct": "Correct reconciliation",
    "revenue_share.confirm": "Confirm TCS Revenue Share receipt",
  },
  Thrift: {
    "thrift.amendment.review": "Decide Cycle amendments",
    "thrift.force_close.recommend": "Recommend lifecycle intervention",
    "thrift.force_close.approve": "Approve Force Close",
    "thrift.termination.review": "Decide Group termination",
  },
  "Disputes and intervention": {
    "disputes.review": "Investigate financial disputes and recovery",
    "disputes.decide": "Decide evidenced payout outcomes",
    "disputes.appeal_review": "Decide independent appeals",
    "cases.exceptional_reopen": "Exceptionally reopen disputes",
    "restrictions.member.apply": "Apply or release Member restrictions",
    "restrictions.organization.apply":
      "Apply or release Organization restrictions",
  },
  "Access Management": {
    "access.users.view": "View internal users",
    "access.users.maintain": "Maintain internal users",
    "access.roles.view": "View roles and permission catalogue",
    "access.roles.maintain": "Maintain roles and permissions",
    "access.assignments.maintain": "Maintain user role assignments",
  },
}
export const catalogue = Object.entries(groups).flatMap(([domain, entries]) =>
  Object.entries(entries).map(([key, label]) => ({
    key,
    label,
    domain,
    description: `Allows an authorized internal user to ${label.charAt(0).toLowerCase() + label.slice(1)}; applicable source and independence rules still apply.`,
  })),
)
export const sensitivePermissions = [
 'settings.runtime_controls.manage', 'settings.business_date.manage', 'operations.process.run', 'operations.process.retry',
  'security.sessions.revoke',
  'security.accounts.unlock',
  "access.users.maintain",
  "access.roles.maintain",
  "access.assignments.maintain",
  "thrift.force_close.approve",
  "cases.exceptional_reopen",
  "restrictions.organization.apply",
  "restrictions.member.apply",
  "disputes.appeal_review",
  "revenue_share.confirm",
]
export const privilegedRole = (r: Role) =>
  r.permissions.some((p) => sensitivePermissions.includes(p))
