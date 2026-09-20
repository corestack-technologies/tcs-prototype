import { accruePenalties, evaluatePostPayoutDefaults } from '../penalties/service.ts'
﻿import { authoritySnapshot, requirePermission } from '../access/authorization.ts'
import type { InternalSession } from '../access/model.ts'
import { businessClock, actualTimestamp, platformSettings, type SettingsState } from '../settings/service.ts'
import { advanceReference } from '../rounds/service.ts'
import { evaluatePayouts } from '../payouts/service.ts'
import { reconcile, groupFinancialBlockers, financialClearance } from '../reconciliation/service.ts'
import { emptyReconciliation } from '../reconciliation/model.ts'
import { processDefinition, processState, processEligible, successful, failed, counts, type ProcessState, type ProcessSources, type Run, type StepKey, type StepResult, type Status } from './model.ts'
export function processAccess(s:InternalSession|null,permission='operations.process.view'){requirePermission(s,'operations.process.view');requirePermission(s,permission)}
export function readRuns(s:InternalSession|null,state=processState){processAccess(s);return state.runs}
export interface ProcessPreview {key:string;reason:string;actorId:string;businessDate:string;mode:string;environment:string;clockRevision:number;runRevision:number;sourceVersion:string;eligibleGroups:number;isolatedGroups:number;catchUp:boolean;warnings:string[];retryOf?:string}
export function previewProcess(s:InternalSession|null,sources:ProcessSources,reason:string,retryOf?:string,state=processState,settings=platformSettings,actual=actualTimestamp()):ProcessPreview{
 processAccess(s,retryOf?'operations.process.retry':'operations.process.run')
 if(settings.environment==='Production')throw Error('Manual prototype execution is non-production only.')
 if(!reason.trim())throw Error('A reason is required.')
 if(state.running)throw Error('A lifecycle run is already in progress.')
 const original=retryOf?state.runs.find(r=>r.id===retryOf):undefined
 if(retryOf&&(!original||!failed(original)))throw Error('Only a failed or partially failed run may be retried.')
 if(original&&original.environment!==settings.environment)throw Error('Retry environment does not match the original run.')
 const clock=businessClock(settings,actual),businessDate=original?.businessDate||clock.businessDate,mode=original?.mode||clock.mode
 const all=sources.worlds.flatMap(w=>w.groups),eligible=all.filter(processEligible),last=state.runs.filter(r=>successful(r)&&r.environment===settings.environment).map(r=>r.businessDate).sort().at(-1)
 const warnings=['Counts are potential Group evaluations, not guaranteed mutations. Execution validates each source.','Scenario-clock records are excluded. No new penalty rates, default thresholds or Recovery payments are inferred.']
 if(!eligible.length)warnings.push('No environment-bound Cycles are available. Activate a normal Cycle; isolated demo fixtures are not converted by this process.')
 if(all.length!==eligible.length)warnings.push('Scenario or mixed-clock Groups remain unchanged. Mixed-clock financial worlds are not reconciled by an environment run.')
 if(eligible.some(g=>g.cycles.some(c=>c.active&&Date.parse(c.active.referenceAt)>Date.parse(original?.businessTimestamp||clock.businessTimestamp))))warnings.push('Future evaluated history exists; affected records may reject backward evaluation. Resetting the clock does not repair the dataset.')
 return {key:processDefinition.key,reason:reason.trim(),actorId:authoritySnapshot(s!).userId,businessDate,mode,environment:settings.environment,clockRevision:settings.revision,runRevision:state.revision,sourceVersion:JSON.stringify(sources),eligibleGroups:eligible.length,isolatedGroups:all.length-eligible.length,catchUp:!last||last<businessDate,warnings,...(retryOf?{retryOf}:{})}
}
function freeze<T>(value:T):T {if(value&&typeof value==='object'){for(const child of Object.values(value))freeze(child);Object.freeze(value)}return value}
function domainState(value:unknown){return JSON.stringify(value,(key,v)=>key==='referenceAt'?undefined:v)}
function status(c:{changed:number;failed:number;evaluated:number},completed=0):Status{return c.failed?(c.changed||completed?'PARTIAL_FAILURE':'FAILED'):c.changed?'COMPLETED':'COMPLETED_WITH_NO_CHANGES'}
export interface ExecutionOptions {state?:ProcessState;settings?:SettingsState;now?:()=>string;beforeRecord?:(key:StepKey,id:string)=>void}
/** Synchronous per-record commits: successful earlier work survives later record/step failures. */
export function executeProcess(s:InternalSession|null,sources:ProcessSources,preview:ProcessPreview,confirmed:boolean,options:ExecutionOptions={}):Run{
 const state=options.state||processState,settings=options.settings||platformSettings,now=options.now||actualTimestamp,startedAt=now()
 if(!confirmed)throw Error('Confirmation is required.')
 const fresh=previewProcess(s,sources,preview.reason,preview.retryOf,state,settings,startedAt)
 if(JSON.stringify(fresh)!==JSON.stringify(preview))throw Error('Actor, Business Date or source state changed. Preview again.')
 const original=preview.retryOf?state.runs.find(r=>r.id===preview.retryOf):undefined,clock=businessClock(settings,startedAt),at=original?.businessTimestamp||clock.businessTimestamp
 const run:Run={id:crypto.randomUUID(),definition:structuredClone(processDefinition),startedAt,completedAt:'',businessDate:preview.businessDate,businessTimestamp:at,mode:original?.mode||clock.mode,environment:settings.environment,actor:authoritySnapshot(s!),trigger:'MANUAL',reason:preview.reason,status:'RUNNING',steps:[],...counts(),...(preview.retryOf?{retryOf:preview.retryOf}:{}),errors:[]}
 const blocked=new Set<string>()
 state.running=true
 try{
 for(const definition of processDefinition.steps){
  const step:StepResult={key:definition.key,name:definition.name,status:'RUNNING',startedAt:now(),completedAt:'',...counts(),errors:[],notes:[]}
  for(const world of sources.worlds){
   if(definition.key==='FINANCIAL_RECONCILIATION'){
    if(!world.groups.some(processEligible)){step.skipped++;continue}
    const worldId=world.finance?.organizationId||world.groups[0]?.organizationId||'Unknown Organization'
    if(world.groups.some(g=>!processEligible(g))){step.evaluated++;step.failed++;step.errors.push('Financial world '+worldId+' contains isolated scenario records. Evaluation is incomplete; use an environment-only test dataset rather than changing scenario history.');continue}
    if(world.groups.some(g=>blocked.has(g.id))){step.skipped++;step.notes.push('Financial evaluation withheld because prerequisite Group evaluation failed.');continue}
    step.evaluated++
    try{
     options.beforeRecord?.(definition.key,worldId)
     const org=sources.organizations.find(o=>o.id===worldId);if(!org)throw Error('Organization source unavailable')
     const before=world.finance||emptyReconciliation(worldId),next=reconcile(before,world.groups,org,at)
     if(domainState(before)!==domainState(next))step.changed++;else step.skipped++
     world.finance=next
     const clearance=financialClearance(next,world.groups);org.commercialRestricted=clearance.restricted
     if(org.clearance){org.clearance.reconciliationCases=clearance.cases;org.clearance.tcsReceivableCases=clearance.unpaidTcs}
     for(const g of world.groups){g.reconciliationBlockers=groupFinancialBlockers(next,g);g.commercialCommencementRestricted=next.receivables.some(r=>r.status==='restricted')}
    }catch{step.failed++;step.errors.push('Financial evaluation could not complete for '+worldId+'. Review source consistency and configured policy before retrying.')}
    continue
   }
   for(let i=0;i<world.groups.length;i++){
    const g=world.groups[i]
    if(!processEligible(g)||blocked.has(g.id)){step.skipped++;continue}
    step.evaluated++
    try{
     options.beforeRecord?.(definition.key,g.id)
     let next
     if(definition.key==='ROUNDS_AND_OBLIGATIONS')next=advanceReference(g,at)
     else if(definition.key==='PENALTY_ACCRUAL')next=accruePenalties(g,at,now())
     else if(definition.key==='POST_PAYOUT_DEFAULT')next=evaluatePostPayoutDefaults(g,at,now())
     else next=evaluatePayouts(g.payouts?g:{...g,payouts:{records:[]}},at,sources.banks)
     if(domainState(g)!==domainState(next))step.changed++;else step.skipped++
     world.groups[i]=next
    }catch{blocked.add(g.id);step.failed++;step.errors.push('Evaluation could not complete for Group '+g.id+'. Review source history, timing and policy; prior completed work is preserved.')}
   }
  }
  step.completedAt=now();step.status=status(step);run.steps.push(step)
  for(const key of ['evaluated','changed','skipped','failed'] as const)run[key]+=step[key]
 }
 run.status=status(run,run.steps.filter(s=>s.evaluated>s.failed).length)
 run.errors=run.steps.flatMap(step=>step.errors)
 run.completedAt=now()
 state.runs=Object.freeze([...state.runs,freeze(run)]);state.revision++
 return run
 }finally{state.running=false}
}
