import { hasPermission, requirePermission } from '../access/authorization'
import type { NavMeta, View } from '../App'
import { useAccess } from '../access/AccessContext'
import { InternalDenied, InternalNavigation } from '../access/InternalNavigation'
import { useOperations } from '../operations/OperationsContext'
import { canReport } from './permissions'
import { availableInternalReports } from './internalService'
import { ReportBody } from './ReportsWorkspace'

export function InternalReportsWorkspace({navigate,initialReport}:{navigate:(v:View,meta?:NavMeta)=>void;initialReport?:string}){
 const access=useAccess(),operations=useOperations()
 if(!canReport(access.session))return <InternalDenied navigate={navigate} module="Internal Reports" />
 return <><InternalNavigation navigate={navigate} current="internal-reports" /><main id="internal-main" tabIndex={-1}><ReportBody key={access.session?.personaId} audience="internal" definitions={availableInternalReports(access.session)} report={operations.report} exportReport={operations.exportReport} initialReport={initialReport} openSource={hasPermission(access.session,"operations.case.view") ? row => {requirePermission(access.currentSession(),"operations.case.view");row.source.kind === "process-run" ? navigate("scheduled-processes") : navigate("operations",{caseId:row.source.id})} : undefined}/></main></>
}
