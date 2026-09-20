import { waivePenalty } from '../penalties/service'
import { previewProcess, executeProcess, type ProcessPreview } from '../processes/service'
import { diagnostics, type Diagnostics } from '../processes/diagnostics'
import type { Run } from '../processes/model'
import { actualTimestamp, businessTimestamp, settingsAccess } from '../settings/service'
import { protectedHistory } from '../settings/history'
import { requireBusinessReportAccess } from '../reports/permissions'
import type { ReportFilters, ReportResult } from '../reports/model'
import { recoveryRestriction } from '../operations/restrictions'
import { decisionDemoWorld } from '../operations/decisionSeeds'
import { operationsDemoWorld } from '../operations/seeds'
import { requireInternal, type InternalSession } from '../operations/model'
import type { Organization } from '../organizations/model'
import {recordRevenuePayment,type RevenuePaymentInput} from "../reconciliation/revenue"
import { emptyReconciliation, type ReconciliationState, type ProviderSettlement } from "../reconciliation/model"
import { reconcile, receiveSettlement, financialClearance, groupFinancialBlockers } from "../reconciliation/service"
import { reconciliationDemo, type ReconciliationDemo } from "../reconciliation/seeds"
import { recordManual, type ManualInput } from "../reconciliation/manual"
import {chooseOptional} from "../payments/optional"
import {evaluatePayouts,payoutTransition,payoutClearance,type PayoutAction} from '../payouts/service'
import {payoutDemo,type PayoutDemo} from '../payouts/seeds'
import type {BankDirectory} from '../payouts/model'
import {
  startAttempt,
  checkAttempt,
  paymentClearance,
  type PaymentChoice,
} from "../payments/service"
import { paymentDemo, type PaymentDemo } from "../payments/seeds"
import { useClient } from "../clients/ClientContext"
import { lifecycleTransition, type LifecycleAction } from "../lifecycle/service"
import {
  nextCycle,
  requestAmendment,
  resolveRecovery,
} from "../lifecycle/continuation"
import { lifecycleDemo, type LifecycleDemo } from "../lifecycle/seeds"
import { advanceReference } from "../rounds/service"
import { roundDemo, type RoundDemo } from "../rounds/seeds"
import type { Frequency } from "./model"
import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { useOrganization } from "../organizations/OrganizationContext"
import {
  cycleOf,
  newGroup,
  transition,
  exampleFeeBoundary,
  type ThriftGroup,
  type Action,
  type FeeBoundary,
} from "./model"
import { seedGroup, type GroupScenario } from "./seeds"
interface World {
  finance?: ReconciliationState
  groups: ThriftGroup[]
  selected: string | null
  boundary: FeeBoundary
  error?: string
}
interface ContextValue {
  waivePenalty: (id:string,amountMinor:number,reason:string)=>boolean
 processPreview: (actor:InternalSession|null,reason:string,retryOf?:string)=>ProcessPreview
 processExecute: (actor:InternalSession|null,preview:ProcessPreview)=>Run
 diagnostics: (actor:InternalSession|null)=>Diagnostics

 protectedThrough: (actor: InternalSession | null) => string
  reportingWorlds: (actor: InternalSession | null) => {groups:ThriftGroup[];finance?:ReconciliationState}[]
  report: (id: string, filters?: ReportFilters) => ReportResult
  replaceOperationsWorlds: (actor: InternalSession | null, expected: {groups:ThriftGroup[];finance?:ReconciliationState}[], next: {groups:ThriftGroup[];finance?:ReconciliationState}[]) => void
  operationsWorlds: (actor: InternalSession | null) => { groups: ThriftGroup[]; finance?: ReconciliationState }[]
  ensureDecisionDemo: (actor: InternalSession | null, org: Organization) => void
  ensureOperationsDemo: (actor: InternalSession | null, org: Organization) => void
  recordRevenuePayment:(id:string,input:RevenuePaymentInput)=>boolean
  finance: ReconciliationState | null
  createReconciliationDemo: (scenario:ReconciliationDemo)=>boolean
  receiveDemoSettlement: (event:ProviderSettlement)=>boolean
  financeReference: (at:string)=>boolean
  handoffCase: (id:string,reason:string)=>boolean
  recordManual: (input:ManualInput)=>boolean
  payout:(action:PayoutAction)=>boolean
  createPayoutDemo:(scenario:PayoutDemo)=>boolean
  payoutBanks:BankDirectory
  chooseOptional: (cycleId:string, roundId:string, choice:"contribute"|"skip")=>boolean
  pay: (choice: PaymentChoice) => boolean
  checkPayment: (attemptId: string) => boolean
  createPaymentDemo: (scenario: PaymentDemo) => boolean

  lifecycle: (action: LifecycleAction) => boolean
  continueCycle: (mode: "rollover" | "fresh", days: number) => boolean
  amendment: (reason: string, amount: number) => boolean
  reviewRecovery: (id: string) => boolean
  createLifecycleDemo: (scenario: LifecycleDemo) => boolean
  eligible: (id: string) => boolean
  groups: ThriftGroup[]
  group: ThriftGroup | null
  boundary: FeeBoundary
  error: string
  create: (scenario?: GroupScenario) => boolean
  select: (id: string) => void
  act: (a: Action) => boolean
  setBoundary: (b: FeeBoundary) => void
  reference: (at: string) => boolean
  createRoundDemo: (frequency: Frequency, scenario: RoundDemo) => boolean
}
const Context = createContext<ContextValue | null>(null)
export function GroupProvider({ children }: { children: ReactNode }) {
  const { client,payoutBank,eligibleForCommitment,syncRecoveryEligibility } = useClient()
  const { organization, updateOrganization, generateBusinessReport, processOrganizations } = useOrganization()
  const [worlds] = useState(() => new Map<string, World>()),
    [, refresh] = useState(0)
  const world: World = organization
    ? worlds.get(organization.id) || {
        groups: [],
        selected: null,
        boundary: exampleFeeBoundary(),
      }
    : { groups: [], selected: null, boundary: exampleFeeBoundary() }
  if (organization && !worlds.has(organization.id))
    worlds.set(organization.id, world)
  const change = () => {
    world.error = ""
    refresh((v) => v + 1)
  }
  const banksFor=(g:ThriftGroup):BankDirectory=>Object.fromEntries(g.cycles.flatMap(c=>c.participants.map(p=>[p.id,payoutBank(p.id)||g.payouts?.demoBanks?.[p.id]])))
  const group = world.groups.find((g) => g.id === world.selected) || null
  const syncFinance = () => {
    if(!organization)return
    const times=[world.finance?.referenceAt,...world.groups.flatMap(g=>g.cycles.map(c=>c.active?.referenceAt)),...world.groups.map(g=>g.payouts?.referenceAt)].filter((v):v is string=>!!v)
    const at=times.length?new Date(Math.max(...times.map(t=>Date.parse(t)))).toISOString():businessTimestamp()
    const next=reconcile(world.finance||emptyReconciliation(organization.id),world.groups,organization,at)
    world.finance=next
    const restricted=next.receivables.some(r=>r.status==="restricted")
    world.groups=world.groups.map(g=>{const blockers=groupFinancialBlockers(next,g);return g.reconciliationBlockers===blockers&&g.commercialCommencementRestricted===restricted?g:{...g,reconciliationBlockers:blockers,commercialCommencementRestricted:restricted}})
    const clearance=financialClearance(next,world.groups)
    updateOrganization(org=>({...org,commercialRestricted:clearance.restricted,clearance:org.clearance?{...org.clearance,reconciliationCases:clearance.cases,tcsReceivableCases:clearance.unpaidTcs}:null}))
  }
  useEffect(()=>{
    let changed=false
    world.groups=world.groups.map(g=>{if(g.cycles.some(c=>c.active?.timeSource==='ENVIRONMENT'))return g;if(!g.payouts&&cycleOf(g).status!=='activated')return g;const prepared=g.payouts?g:{...g,payouts:{records:[]}};const at=g.payouts?.referenceAt||cycleOf(g).active?.referenceAt||businessTimestamp();const next=evaluatePayouts(prepared,at,banksFor(g));if(JSON.stringify(next)!==JSON.stringify(g)){changed=true;return next}return g})
    if(changed){syncFinance();updateOrganization(org=>({...org,clearance:org.clearance?{...org.clearance,payoutCases:payoutClearance(world.groups)}:null}));refresh(v=>v+1)}
  },[client?.bankDetails,organization?.id,group?.id,world.groups])
  const syncClearance = (delta: number) => {
    if (delta)
      updateOrganization((org) => ({
        ...org,
        clearance: org.clearance
          ? {
              ...org.clearance,
              activeCycles: org.clearance.activeCycles + delta,
            }
          : null,
      }))
  }
  const syncPaymentClearance = () =>
    updateOrganization((org) => ({
      ...org,
      clearance: org.clearance
        ? { ...org.clearance, paymentCases: paymentClearance(world.groups), payoutCases: payoutClearance(world.groups) }
        : null,
    }))
  const run = (fn: () => void) => {
    try {
      fn()
      syncFinance()
      change()
      return true
    } catch (e) {
      world.error =
        e instanceof Error ? e.message : "Unable to complete action."
      refresh((v) => v + 1)
      return false
    }
  }
  const recoveryIndicators=[...worlds.values()].flatMap(w=>w.groups.flatMap(g=>(g.lifecycle?.recoveries||[]).map(r=>recoveryRestriction(g,r))))
  useEffect(()=>{syncRecoveryEligibility(recoveryIndicators)},[JSON.stringify(recoveryIndicators)])
  const eligible = (id: string) =>
    eligibleForCommitment(id) &&
    ![...worlds.values()].some((w) =>
      w.groups.some((g) =>
        g.lifecycle?.recoveries.some(
          (r) => r.memberId === id && r.restricted && r.status !== "resolved",
        ),
      ),
    )
  const mutate = (fn: (g: ThriftGroup, at: string) => ThriftGroup) =>
    run(() => {
      if (!organization || !group) throw Error("Choose a Group first.")
      const stored = world.groups.find((g) => g.id === group.id)!
      const current = stored
      const next = fn(
        current,
        businessTimestamp(cycleOf(current).active?.timeSource !== 'ENVIRONMENT' ? cycleOf(current).active?.referenceAt || cycleOf(current).continuation?.referenceAt : undefined),
      )
      world.groups = world.groups.map((g) => (g.id === current.id ? next : g))
      syncPaymentClearance()
      syncClearance(
        Number(cycleOf(next).status === "activated") -
          Number(cycleOf(current).status === "activated"),
      )
      const counts = (g: ThriftGroup) => ({
        exitSettlements:
          g.lifecycle?.exits.filter(
            (e) =>
              e.status === "approved" &&
              e.settlement.status === "due" &&
              e.settlement.dueMinor > 0,
          ).length || 0,
        recoveryCases:
          g.lifecycle?.recoveries.filter((r) => r.status !== "resolved")
            .length || 0,
        disputes:
          g.lifecycle?.disputes.filter((d) => d.status === "open").length || 0,
      })
      const before = counts(current),
        after = counts(next)
      updateOrganization((org) => ({
        ...org,
        clearance: org.clearance
          ? {
              ...org.clearance,
              exitSettlements: Math.max(
                0,
                org.clearance.exitSettlements +
                  after.exitSettlements -
                  before.exitSettlements,
              ),
              recoveryCases: Math.max(
                0,
                org.clearance.recoveryCases +
                  after.recoveryCases -
                  before.recoveryCases,
              ),
              disputes: Math.max(
                0,
                org.clearance.disputes + after.disputes - before.disputes,
              ),
            }
          : null,
      }))
    })
  const owner = () => {
    if (!organization || client?.id !== organization.ownerMemberId)
      throw Error("Organization Owner access required.")
    return organization
  }
  return (
    <Context.Provider
      value={{
        waivePenalty: (id,amount,reason) => mutate(g => waivePenalty(g,owner(),client!.id,id,amount,reason,actualTimestamp())),
        protectedThrough: actor => { settingsAccess(actor,'settings.business_date.view'); return protectedHistory([...worlds.values()]) },
        processPreview: (actor,reason,retryOf) => previewProcess(actor,{worlds:[...worlds.values()],organizations:processOrganizations(actor),banks:Object.assign({},...[...worlds.values()].flatMap(w=>w.groups.map(banksFor)))},reason,retryOf),
        processExecute: (actor,preview) => {try{return executeProcess(actor,{worlds:[...worlds.values()],organizations:processOrganizations(actor),banks:Object.assign({},...[...worlds.values()].flatMap(w=>w.groups.map(banksFor)))},preview,true)}finally{refresh(v=>v+1)}},
        diagnostics: actor => diagnostics(actor,[...worlds.values()]),
        reportingWorlds: actor => { requireBusinessReportAccess(actor); return [...worlds.values()] },
        report: (id, filters = {}) => generateBusinessReport(id, filters, [...worlds.values()]),
        replaceOperationsWorlds: (actor, expected, next) => {
          requireInternal(actor)
          for(const item of next){const id=item.finance?.organizationId||item.groups[0]?.organizationId;if(!id)continue;const current=worlds.get(id),before=expected.find(w=>(w.finance?.organizationId||w.groups[0]?.organizationId)===id);if(!current||!before||JSON.stringify(current.groups)!==JSON.stringify(before.groups)||JSON.stringify(current.finance)!==JSON.stringify(before.finance)||item.groups.some(g=>g.organizationId!==id))throw Error('Financial source changed; preview again.')}
          for(const item of next){const id=item.finance?.organizationId||item.groups[0]?.organizationId;if(!id)continue;const current=worlds.get(id)!;current.groups=item.groups;current.finance=item.finance}
          refresh(v=>v+1)
        },
        operationsWorlds: actor => { requireInternal(actor); return [...worlds.values()] },
        ensureDecisionDemo: (actor,org) => {
          requireInternal(actor)
          const current=worlds.get(org.id);if(!current)throw Error('Load the shared Operations foundation first.')
          if(current.groups.some(g=>g.id===org.id+'-ops-5b-0'))return
          const demo=decisionDemoWorld(org);current.groups.push(...demo.groups)
          current.finance??=emptyReconciliation(org.id)
          for(const key of ['settlements','unmatchedPayments','cases','receivables','history','expectations'] as const)(current.finance[key] as unknown[]).push(...demo.finance[key])
          const force=current.groups.find(g=>g.lifecycle?.forceCloseRequests.length)
          if(force&&!force.lifecycle!.termination){force.lifecycle!.termination={status:'pending-tcs-review',at:cycleOf(force).active!.referenceAt,reason:'Organization requests termination; unresolved payouts and Force Close remain.'};force.history.push({at:force.lifecycle!.termination.at,actor:org.ownerMemberId,action:'Organization termination request retained for internal review'})}
          refresh(v=>v+1)
        },
        ensureOperationsDemo: (actor, org) => {
          requireInternal(actor)
          const existing=worlds.get(org.id)
          if(existing?.groups.some(g=>g.id===org.id+'-ops-finance-0'))return
          const demo=operationsDemoWorld(org)
          if(existing){
            existing.groups.push(...demo.groups)
            if(existing.finance){
              for(const key of ['settlements','unmatchedPayments','cases','receivables','history','expectations'] as const) (existing.finance[key] as unknown[]).push(...demo.finance[key])
            }else existing.finance=demo.finance
          } else worlds.set(org.id,{...demo,selected:demo.groups[0].id,boundary:exampleFeeBoundary()})
          refresh(v=>v+1)
        },
        finance:world.finance||null,
        recordRevenuePayment:(id,input)=>run(()=>{const org=owner();if(!world.finance)throw Error("No revenue share is due.");world.finance=recordRevenuePayment(world.finance,org,client!.id,id,input,world.finance.referenceAt||businessTimestamp())}),
        createReconciliationDemo:scenario=>run(()=>{const org=owner(),demo=reconciliationDemo(org,org.id+"-group-"+crypto.randomUUID(),scenario);world.groups.push(demo.group);world.selected=demo.group.id;const old=world.finance||emptyReconciliation(org.id);world.finance={...old,policy:old.policy||demo.state.policy,referenceAt:[old.referenceAt,demo.state.referenceAt].filter(Boolean).sort().at(-1),settlements:[...old.settlements,...demo.state.settlements],unmatchedPayments:[...old.unmatchedPayments,...demo.state.unmatchedPayments],cases:[...old.cases,...demo.state.cases],receivables:[...old.receivables,...demo.state.receivables],history:[...old.history,...demo.state.history]};syncClearance(1);syncPaymentClearance()}),
        receiveDemoSettlement:event=>run(()=>{const org=owner();world.finance=receiveSettlement(world.finance||emptyReconciliation(org.id),world.groups,org,event,world.finance?.referenceAt||event.settledAt)}),
        financeReference:at=>run(()=>{const org=owner();world.finance=reconcile(world.finance||emptyReconciliation(org.id),world.groups,org,at)}),
        handoffCase:(id,reason)=>run(()=>{owner();if(reason.trim().length<5)throw Error("Add context for the Operations handoff.");const item=world.finance?.cases.find(c=>c.id===id);if(!item||item.status==="resolved")throw Error("Choose an unresolved case.");const at=world.finance!.referenceAt!;item.history.push({at,actor:client!.id,action:"Organization submitted Operations handoff",reason,before:item.status,after:item.status==="open"?"review-required":item.status});if(item.status==="open")item.status="review-required"}),
        recordManual:input=>mutate((g,at)=>{const org=owner();if(world.groups.some(other=>other.manualContributions?.some(m=>m.reference===input.reference.trim())))throw Error("This Organization manual reference is already recorded.");return recordManual(g,org,client!.id,g.manualPolicy||world.finance?.policy,input,world.finance?.referenceAt||at)}),
        payoutBanks:group?banksFor(group):{},
        payout:action=>mutate((g,at)=>payoutTransition(g,organization!.id,organization!.ownerMemberId,client!.id,action,g.payouts?.demo?g.payouts.referenceAt||at:at,banksFor(g))),
        createPayoutDemo:scenario=>run(()=>{const org=owner();const g=payoutDemo(org,org.id+'-group-'+crypto.randomUUID(),scenario);world.groups.push(g);world.selected=g.id;syncClearance(1);syncPaymentClearance()}),
        chooseOptional:(cycleId,roundId,choice)=>mutate((g,at)=>chooseOptional(g,organization!.id,client!.id,cycleId,roundId,choice,g.payouts?.referenceAt||at)),
        pay: (choice) =>
          mutate((g, at) => {
            if (!client || !organization)
              throw Error("Sign in to pay your contribution.")
            return startAttempt(
              g,
              organization.id,
              organization.form.name,
              client.id,
              choice,
              cycleOf(g).active?.timeSource === "ENVIRONMENT" ? actualTimestamp() : at,
            )
          }),
        checkPayment: (attemptId) =>
          run(() => {
            if (!client || !organization)
              throw Error("Sign in to check your payment.")
            const all = [...worlds.values()].flatMap((w) => w.groups)
            const source = all.find((g) =>
              g.payments?.attempts.some((a) => a.id === attemptId),
            )
            if (!source) throw Error("Choose a payment first.")
            const attempt = source.payments!.attempts.find(
              (a) => a.id === attemptId,
            )!
            const active = source.cycles.find((c) => c.id === attempt.cycleId)?.active
            const at = active?.timeSource === "ENVIRONMENT" ? actualTimestamp() : active?.referenceAt || attempt.updatedAt
            const next = checkAttempt(
              all,
              organization.id,
              client.id,
              attemptId,
              at,
            )
            for (const w of worlds.values())
              w.groups = w.groups.map(
                (g) => next.find((n) => n.id === g.id) || g,
              )
            syncPaymentClearance()
          }),
        createPaymentDemo: (scenario) =>
          run(() => {
            const org = owner()
            const g = paymentDemo(
              org,
              org.id + "-group-" + crypto.randomUUID(),
              scenario,
            )
            world.groups.push(g)
            world.selected = g.id
            syncClearance(1)
            syncPaymentClearance()
          }),
        eligible,
        lifecycle: (action) =>
          mutate((g, at) =>
            lifecycleTransition(
              g,
              client!.id,
              organization!.ownerMemberId,
              action,
              at,
              eligible,
            ),
          ),
        continueCycle: (mode, days) =>
          mutate((g, at) => nextCycle(g, owner(), mode, at, days)),
        amendment: (reason, amount) =>
          mutate((g, at) =>
            requestAmendment(
              g,
              owner(),
              reason,
              { ...cycleOf(g).terms, amount },
              at,
            ),
          ),
        reviewRecovery: (id) =>
          mutate((g, at) => resolveRecovery(g, owner(), id, at)),
        createLifecycleDemo: (scenario) =>
          run(() => {
            const org = owner()
            const g = lifecycleDemo(
              org,
              org.id + "-group-" + crypto.randomUUID(),
              scenario,
            )
            world.groups.push(g)
            world.selected = g.id
            syncClearance(cycleOf(g).status === "activated" ? 1 : 0)
            updateOrganization((o) => ({
              ...o,
              clearance: o.clearance
                ? {
                    ...o.clearance,
                    exitSettlements:
                      o.clearance.exitSettlements +
                      (g.lifecycle?.exits.filter(
                        (e) =>
                          e.status === "approved" &&
                          e.settlement.status === "due" &&
                          e.settlement.dueMinor > 0,
                      ).length || 0),
                    recoveryCases:
                      o.clearance.recoveryCases +
                      (g.lifecycle?.recoveries.filter(
                        (r) => r.status !== "resolved",
                      ).length || 0),
                    disputes:
                      o.clearance.disputes +
                      (g.lifecycle?.disputes.filter((d) => d.status === "open")
                        .length || 0),
                  }
                : null,
            }))
          }),
        groups: world.groups,
        group,
        boundary: world.boundary,
        error: world.error || "",
        create: (scenario) =>
          run(() => {
            if (!organization) throw Error("Select an approved Organization.")
            const id = `${organization.id}-group-${crypto.randomUUID()}`
            const g = scenario
              ? seedGroup(organization, id, scenario, world.boundary)
              : newGroup(organization, id)
            world.groups.push(g)
            world.selected = g.id
            syncClearance(cycleOf(g).status === "activated" ? 1 : 0)
          }),
        select: (id) => {
          if (world.groups.some((g) => g.id === id)) {
            world.selected = id
            change()
          }
        },
        act: (action) =>
          run(() => {
            if (!organization || !group) throw Error("Select a Group first.")
            const current = world.groups.find((g) => g.id === group.id)
            if (!current) throw Error("Group no longer selected.")
            const commitmentId =
              action.type === "recruit"
                ? action.member.id
                : ["admit", "readd", "accept"].includes(action.type)
                  ? "id" in action
                    ? action.id
                    : ""
                  : ""
            if (commitmentId && !eligible(commitmentId))
              throw Error(
                "This Member is currently ineligible for new thrift commitments. Existing commitments continue.",
              )
            if (
              action.type === "activate" &&
              cycleOf(current).participants.some(
                (p) => p.status === "approved" && !eligible(p.id),
              )
            )
              throw Error(
                "An admitted Member is currently ineligible for a new commitment.",
              )
            const evaluated = cycleOf(current).active && cycleOf(current).active!.timeSource !== 'ENVIRONMENT'
              ? advanceReference(current, cycleOf(current).active!.referenceAt)
              : current
            let next = transition(
              evaluated,
              organization,
              world.boundary,
              action,
            )
            if (cycleOf(next).status === "activated" && !cycleOf(next).active)
              { next = advanceReference(next, businessTimestamp(), true); cycleOf(next).active!.timeSource='ENVIRONMENT' }
            world.groups = world.groups.map((g) =>
              g.id === current.id ? next : g,
            )
            syncClearance(
              Number(cycleOf(next).status === "activated") -
                Number(cycleOf(current).status === "activated"),
            )
          }),
        reference: (at) =>
          mutate((g) => {
            const c = cycleOf(g)
            if(c.active?.timeSource==='ENVIRONMENT')throw Error('Environment Business Date is managed in Settings. Scenario reference controls apply only to demo records.')
            if (c.status === "draft" && c.continuation) {
              if (
                !Number.isFinite(Date.parse(at)) ||
                Date.parse(at) < Date.parse(c.continuation.referenceAt || "")
              )
                throw Error("Use a valid forward reference time.")
              const next = structuredClone(g)
              cycleOf(next).continuation!.referenceAt = at
              return next
            }
            const advanced=advanceReference(g, at)
            return g.payouts?evaluatePayouts(advanced,at,banksFor(advanced)):advanced
          }),
        createRoundDemo: (frequency, scenario) =>
          run(() => {
            if (!organization) throw Error("Select an Organization.")
            const g = roundDemo(
              organization,
              organization.id + "-group-" + crypto.randomUUID(),
              world.boundary,
              frequency,
              scenario,
            )
            world.groups.push(g)
            world.selected = g.id
            syncClearance(1)
          }),
        setBoundary: (b) => {
          run(() => {
            if (
              !Number.isFinite(b.maxPercentage) ||
              b.maxPercentage <= 0 ||
              b.maxPercentage >= 100 ||
              !Number.isFinite(b.maxFlat) ||
              b.maxFlat <= 0
            )
              throw Error("Use positive demo limits (percentage below 100).")
            world.boundary = b
          })
        },
      }}
    >
      {children}
    </Context.Provider>
  )
}
export function useGroups() {
  const value = useContext(Context)
  if (!value) throw Error("GroupProvider is required")
  return value
}
export function useDraftGroup() {
  const value = useGroups()
  if (!value.group) throw Error("Select a Group first")
  return { ...value, group: value.group, cycle: cycleOf(value.group) }
}
