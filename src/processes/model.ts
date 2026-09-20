import type { AuthoritySnapshot } from '../access/model.ts'
import type { Environment, Mode } from '../settings/service.ts'
import type { ThriftGroup } from '../groups/model.ts'
import type { Organization } from '../organizations/model.ts'
import type { ReconciliationState } from '../reconciliation/model.ts'
import type { BankDirectory } from '../payouts/model.ts'
export const processDefinition = {
 key:'DAILY_LIFECYCLE_PROCESS', name:'Daily lifecycle evaluation', domain:'Thrift / Payouts / Finance', financial:true, safeToRetry:true, availability:'Available',
 description:'Evaluate existing lifecycle rules through the effective Business Date. No provider calls or automatic Recovery payments.',
 steps:[
  {key:'ROUNDS_AND_OBLIGATIONS',name:'Round opening, obligations and advance reservations',order:1,financial:true,description:'Generate every opened Round using its original schedule, evaluate handovers and release valid advance reservations.'},
  {key:'PENALTY_ACCRUAL',name:'Daily required-principal penalty accrual',order:2,financial:true,description:'Accrue simple daily penalties at the accepted rate on dated outstanding required principal only.'},
  {key:'PAYOUT_LIFECYCLE',name:'Payout readiness and configured windows',order:3,financial:true,description:'Evaluate readiness, confirmation/dispute/evidence windows and configured Organization payout breach rules.'},
  {key:'POST_PAYOUT_DEFAULT',name:'Post-Payout Default and Recovery',order:4,financial:true,description:'Evaluate seven full calendar days after grace expiry and link eligible unpaid principal to Recovery.'},
  {key:'FINANCIAL_RECONCILIATION',name:'Reconciliation and recognized revenue share',order:5,financial:true,description:'Reconcile recorded financial facts and recognize share after completed installments. Evaluate only configured timing windows.'},
 ]
} as const
export type StepKey=typeof processDefinition.steps[number]['key']
export type Status='RUNNING'|'COMPLETED'|'COMPLETED_WITH_NO_CHANGES'|'PARTIAL_FAILURE'|'FAILED'
export interface Counts {evaluated:number;changed:number;skipped:number;failed:number}
export interface StepResult extends Counts {key:StepKey;name:string;status:Status;startedAt:string;completedAt:string;errors:string[];notes:string[]}
export interface Run extends Counts {id:string;definition:typeof processDefinition;startedAt:string;completedAt:string;businessDate:string;businessTimestamp:string;mode:Mode;environment:Environment;actor:AuthoritySnapshot;trigger:'MANUAL';reason:string;status:Status;steps:StepResult[];retryOf?:string;errors:string[]}
export interface ProcessState {runs:readonly Run[];revision:number;running:boolean}
export const createProcessState=():ProcessState=>({runs:[],revision:0,running:false})
export const processState=createProcessState()
export interface ProcessWorld {groups:ThriftGroup[];finance?:ReconciliationState}
export interface ProcessSources {worlds:ProcessWorld[];organizations:Organization[];banks:BankDirectory}
export const counts=():Counts=>({evaluated:0,changed:0,skipped:0,failed:0})
export const processEligible=(g:ThriftGroup)=>g.cycles.some(c=>!!c.active)&&g.cycles.every(c=>!c.active||c.active.timeSource==='ENVIRONMENT')
export const successful=(r:Run)=>r.status==='COMPLETED'||r.status==='COMPLETED_WITH_NO_CHANGES'
export const failed=(r:Run)=>r.status==='FAILED'||r.status==='PARTIAL_FAILURE'

export function needsAttention(run:Run,runs:readonly Run[]){return failed(run)&&!runs.some(candidate=>{if(!successful(candidate))return false;let parent=candidate.retryOf;const seen=new Set<string>();while(parent&&!seen.has(parent)){if(parent===run.id)return true;seen.add(parent);parent=runs.find(r=>r.id===parent)?.retryOf}return false})}
