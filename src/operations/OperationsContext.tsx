import { generateInternalReport } from '../reports/internalService'
import { exportInternalReport } from '../reports/export'
import { businessReportPermissions } from '../reports/permissions'
import { hasAnyPermission } from '../access/authorization'
import type { ReportFilters } from '../reports/model'
import { useAccess } from '../access/AccessContext'
import { canAccessModule, requirePermission } from '../access/authorization'
import { addInterventionDemos } from './interventionSeeds'
import { applyPrototypeSettlementUpdate } from '../organizations/service'
import { previewDecision, executeDecision, type DecisionPreview } from './decisions'
import type { DecisionInput } from './review'
import { createContext, useContext, useState, type ReactNode } from "react"
import { useClient } from "../clients/ClientContext"
import { useOrganization } from "../organizations/OrganizationContext"
import { useGroups } from "../groups/GroupContext"
import {
  applyTriage,
  caseClock,
  requireInternal,
  type Triage,
  type TriageAction,
} from "./model"
import { projectCases } from "./sources"
function useOperationsState() {
  const clients = useClient(),
    organizations = useOrganization(),
    groups = useGroups()
  const access=useAccess(),session=canAccessModule(access.session,'operations')?access.session:null
  const [triage, setTriage] = useState<Record<string, Triage>>({})
  const sources = session
    ? {
        clients: clients.operationsClients(session),
        organizations: organizations.operationsOrganizations(session),
        worlds: groups.operationsWorlds(session),
      }
    : { clients: [], organizations: [], worlds: [] }
  const cases = session ? projectCases(sources, session, triage) : []
  const reportingSources = () => hasAnyPermission(access.currentSession(),businessReportPermissions)
    ? {clients:clients.reportingClients(access.currentSession()),organizations:organizations.reportingOrganizations(access.currentSession()),worlds:groups.reportingWorlds(access.currentSession()),triage}
    : {clients:[],organizations:[],worlds:[],triage:{}}
  return {
    report: (id:string,filters:ReportFilters={}) => generateInternalReport(reportingSources(),access.currentSession(),id,filters),
    exportReport: (id:string,filters:ReportFilters={}) => exportInternalReport(reportingSources(),access.currentSession(),id,filters),
    session,
    sources,
    cases,
    enter: (id = 'ops-analyst') => access.select(id),
    leave: () => access.select(null),
    preview: (id:string,input:DecisionInput) => {
      const c=cases.find(c=>c.id===id);if(!c)throw Error('Reopen the case.')
      const at=[caseClock(c,new Date().toISOString()),...sources.worlds.map(w=>w.finance?.referenceAt||'')].sort().at(-1)!
      return previewDecision(sources,id,input,session,at)
    },
    decide: (preview:DecisionPreview) => {
      requireInternal(session)
      const c=cases.find(c=>c.id===preview.caseId);if(!c)throw Error('Reopen the case.')
      const at=[caseClock(c,new Date().toISOString()),...sources.worlds.map(w=>w.finance?.referenceAt||'')].sort().at(-1)!
      const result=executeDecision(sources,preview,session,at)
      // The pure service validates the complete transaction before synchronous,
      // batched provider replacement. No asynchronous work runs between stores.
      clients.replaceOperationsClients(session,sources.clients,result.sources.clients)
      organizations.replaceOperationsOrganizations(session,sources.organizations,result.sources.organizations)
      groups.replaceOperationsWorlds(session,sources.worlds,result.sources.worlds)
    },
    act: (id: string, action: TriageAction) => {
      requireInternal(session)
      const c = cases.find((c) => c.id === id)
      if (!c) throw Error("Reopen the case from the current queue.")
      const next = applyTriage(
        c,
        triage[id],
        action,
        session,
        caseClock(c, new Date().toISOString()),
      )
      setTriage((previous) => ({ ...previous, [id]: next }))
    },
    providerUpdateDemo:(caseId:string)=>{
      requireInternal(session)
      requirePermission(session,'organizations.settlement_account.review')
      const item=cases.find(c=>c.id===caseId&&c.type==='Settlement Account Change Review')
      const org=sources.organizations.find(o=>o.id===item?.organizationId),change=org?.settlementChanges.find(c=>c.id===item?.source.id)
      if(!org||!change)throw Error('Reopen the settlement account request.')
      const value=applyPrototypeSettlementUpdate(org,{kind:'prototype-provider-update-confirmed',requestId:change.id,reference:'DEMO-PROVIDER-'+change.id,at:[new Date().toISOString(),change.approvedAt||''].sort().at(-1)!})
      organizations.replaceOperationsOrganizations(session,sources.organizations,[value])
    },
    loadInterventionDemo:()=>{
      requireInternal(session)
      const org=sources.organizations.find(o=>o.id.includes('verified')&&o.status==='active')||sources.organizations.find(o=>o.status==='active')
      if(!org)throw Error('Load shared Operations scenarios first.')
      const result=addInterventionDemos(sources,org.id)
      clients.replaceOperationsClients(session,sources.clients,result.clients)
      organizations.replaceOperationsOrganizations(session,sources.organizations,result.organizations)
      groups.replaceOperationsWorlds(session,sources.worlds,result.worlds)
    },
    loadDecisionDemo:()=>{
      requireInternal(session)
      const member=sources.clients.find(c=>c.personaId==='verified');if(!member)throw Error('Verified demo Member unavailable.')
      const org=organizations.ensureOperationsDemo(session,member)
      groups.ensureOperationsDemo(session,org)
      organizations.ensureDecisionDemo(session,member)
      groups.ensureDecisionDemo(session,org)
    },
    loadDemo: () => {
      requireInternal(session)
      const member = sources.clients.find((c) => c.personaId === "verified")
      if (!member) throw Error("Verified demo Member is unavailable.")
      const org = organizations.ensureOperationsDemo(session, member)
      groups.ensureOperationsDemo(session, org)
    },
  }
}
const Context = createContext<ReturnType<typeof useOperationsState> | null>(
  null,
)
export function OperationsProvider({ children }: { children: ReactNode }) {
  const value = useOperationsState()
  return <Context.Provider value={value}>{children}</Context.Provider>
}
export function useOperations() {
  const value = useContext(Context)
  if (!value) throw Error("OperationsProvider is required")
  return value
}
