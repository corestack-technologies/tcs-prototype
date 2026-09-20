import { processAccess } from '../processes/service'
import { requireBusinessReportAccess } from '../reports/permissions'
import { hasWorkspace } from './model'
import type { ReportSources, ReportFilters, ReportResult } from '../reports/model'
import { generateReport } from '../reports/service'
import { requireInternal, type InternalSession } from '../operations/model'
import { fullName, type Client } from '../clients/model'
import { createContext, useContext, useState, type ReactNode } from "react"
import { useClient } from "../clients/ClientContext"
import type { Organization } from "./model"
import type { OrganizationScenario } from "./seeds"
import { OrganizationSession } from "./session"

interface OrganizationContextValue {
 processOrganizations: (actor: InternalSession | null) => Organization[]
  reportingOrganizations: (actor: InternalSession | null) => Organization[]
  generateBusinessReport: (id: string, filters: ReportFilters, worlds: ReportSources["worlds"]) => ReportResult
  replaceOperationsOrganizations: (actor: InternalSession | null, expected: Organization[], next: Organization[]) => void
  operationsOrganizations: (actor: InternalSession | null) => Organization[]
  ensureDecisionDemo: (actor: InternalSession | null, member: Client) => void
  ensureOperationsDemo: (actor: InternalSession | null, member: Client) => Organization
  organization: Organization | null
  scenario: OrganizationScenario
  startApplication: () => void
  selectScenario: (scenario: OrganizationScenario) => void
  updateOrganization: (transform: (org: Organization) => Organization) => void
}
const Context = createContext<OrganizationContextValue | null>(null)
export function OrganizationProvider({ children }: { children: ReactNode }) {
  const { client, authenticatedMember } = useClient()
  // Each demo is an explicitly separate world with one Organization per Member.
  const [session] = useState(() => new OrganizationSession())
  const [, refresh] = useState(0)
  const scenario = session.scenario(client)
  const organization = session.current(client)
  const change = () => refresh((value) => value + 1)
  return (
    <Context.Provider
      value={{
        processOrganizations: actor => {processAccess(actor);return session.all()},
        reportingOrganizations: actor => { requireBusinessReportAccess(actor); return session.all() },
        generateBusinessReport: (id, filters, worlds) => {
          const member = authenticatedMember(), currentOrganization = session.current(member)
          const actor = member ? id.startsWith('organization-')
            ? {kind:'organization' as const,memberId:member.id,organizationId:currentOrganization?.id || ''}
            : {kind:'member' as const,memberId:member.id} : null
          const result = generateReport({worlds,organizations:session.all().map(o => ({id:o.id,name:o.form.name,ownerMemberId:o.ownerMemberId,workspace:hasWorkspace(o)}))}, actor, id, filters)
          return {...result,actor:member ? fullName(member)+" ("+member.id+")" : undefined}
        },
        replaceOperationsOrganizations: (actor, expected, next) => { requireInternal(actor); session.replaceOperations(expected,next); change() },
        operationsOrganizations: actor => { requireInternal(actor); return session.all() },
        ensureDecisionDemo: (actor,member) => { requireInternal(actor);session.ensureDecisionDemo(member);change() },
        ensureOperationsDemo: (actor, member) => { requireInternal(actor); const org=session.ensureOperationsDemo(member); change(); return org },
        organization,
        scenario,
        startApplication: () => {
          if (!client) throw new Error("Sign in as a Member first.")
          session.start(client)
          change()
        },
        selectScenario: (next) => {
          if (!client) throw new Error("Sign in as a Member first.")
          session.select(client, next)
          change()
        },
        updateOrganization: (transform) => {
          if (!client || !organization)
            throw new Error("No Organization is selected for this Member.")
          session.update(client, organization.id, transform)
          change()
        },
      }}
    >
      {children}
    </Context.Provider>
  )
}
export function useOrganization() {
  const value = useContext(Context)
  if (!value) throw new Error("OrganizationProvider is required")
  return value
}
