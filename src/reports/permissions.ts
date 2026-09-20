import { hasAnyPermission } from '../access/authorization.ts'
import type { InternalSession } from '../access/model.ts'
export const reportPermissions = ['reports.platform.view', 'reports.operations.view', 'reports.financial.view', 'reports.access_audit.view', 'reports.security.view']
export const businessReportPermissions = reportPermissions.slice(0, 3)
export const canReport = (session: InternalSession | null) => hasAnyPermission(session, reportPermissions)
export function requireBusinessReportAccess(session: InternalSession | null): asserts session is InternalSession {
  if (!hasAnyPermission(session, businessReportPermissions)) throw Error('Access denied: business reporting permission required.')
}
