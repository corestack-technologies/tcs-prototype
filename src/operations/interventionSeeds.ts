import { seedSession } from '../access/seeds.ts'
﻿import type { OperationsSources } from './sources.ts'
import { projectCases } from './sources.ts'
import { previewDecision, executeDecision } from './decisions.ts'
import { payoutDemo } from '../payouts/seeds.ts'
import { lifecycleDemo } from '../lifecycle/seeds.ts'
import { emptyReconciliation } from '../reconciliation/model.ts'
import { reconcile } from '../reconciliation/service.ts'
import { resolveRecovery } from '../lifecycle/continuation.ts'
import { syncRecoveryRecords, recoveryRestriction } from './restrictions.ts'
import type { DecisionInput } from './review.ts'
export function addInterventionDemos(sources:OperationsSources,organizationId:string):OperationsSources {
 let s=structuredClone(sources)
 const org=s.organizations.find(o=>o.id===organizationId),world=s.worlds.find(w=>w.groups.some(g=>g.organizationId===organizationId))
 if(!org||!world)throw Error('Load the shared Operations foundation first.')
 if(world.groups.some(g=>g.id===org.id+'-ops-5c-evidence'))return s
 const at='2100-01-01T00:00:00.000Z',later='2100-01-10T00:00:00.000Z'
 const add=(g:ReturnType<typeof payoutDemo>)=>{world.groups.push(g);const f=reconcile(emptyReconciliation(org.id),[g],org,g.payouts?.referenceAt||g.cycles[0].active!.referenceAt);world.finance??=emptyReconciliation(org.id);for(const key of ['cases','receivables','settlements','history','expectations','unmatchedPayments'] as const)(world.finance[key] as unknown[]).push(...f[key])}
 for(const suffix of ['evidence','upheld','accepted','partial','appeal','final','reopened']){
  const g=payoutDemo(org,org.id+'-ops-5c-'+suffix,'Disputed payout');g.name='5C payout: '+suffix;add(g)
 }
 for(const [suffix,scenario] of [['partial-recovery','Completed with recovery'],['resolved-recovery','Recovery cleared / review due']] as const){
  let g=lifecycleDemo(org,org.id+'-ops-5c-'+suffix,scenario)
  const r=g.lifecycle!.recoveries[0]
  if(suffix==='partial-recovery'){r.recoveredMinor=Math.floor(r.principalMinor/4);g.history.push({at,actor:'Prototype scenario',action:'Explicit sample aggregate partial recovery retained; no provider transaction created and no principal/penalty allocation inferred.'})}
  else g=resolveRecovery(g,org,r.id,at)
  syncRecoveryRecords(g);g.name='5C '+suffix;add(g)
 }
 const decide=(suffix:string,action:DecisionInput['action'],personaId='finance-reviewer',patch:Partial<DecisionInput>={},time=at)=>{
  const session=seedSession(personaId),c=projectCases(s,session).find(c=>c.groupId===org.id+'-ops-5c-'+suffix&&c.type==='Payout Dispute')!
  const input:DecisionInput={action,reason:'Prototype scenario: inspected party statement and bank evidence',evidence:['DEMO-5C-'+suffix],evidenceConfirmed:true,party:'Organization',...patch}
  s=executeDecision(s,previewDecision(s,c.id,input,session,time),session,time).sources
 }
 decide('evidence','request-information','finance-reviewer',{evidenceHours:72})
 decide('upheld','member-upheld')
 decide('accepted','organization-accepted')
 decide('partial','partial-receipt','finance-reviewer',{amountMinor:10000});decide('partial','finalize-dispute','finance-reviewer',{},later)
 for(const suffix of ['appeal','final','reopened']){decide(suffix,'member-upheld');decide(suffix,'submit-appeal')}
 decide('final','organization-accepted','ops-supervisor')
 decide('reopened','organization-accepted','ops-supervisor');decide('reopened','exceptional-reopen','ops-supervisor',{},later)
 const supervisor=seedSession('ops-supervisor')
 const intervene=(type:string,action:DecisionInput['action'])=>{
  const c=projectCases(s,supervisor).find(c=>c.organizationId===org.id&&c.type===type&&c.status!=='Resolved')!
  const input:DecisionInput={action,reason:'Prototype serious source case reviewed; new activity restriction protects existing arrangements',evidence:['DEMO-5C-INTERVENTION'],evidenceConfirmed:true}
  s=executeDecision(s,previewDecision(s,c.id,input,supervisor,later),supervisor,later).sources
 }
 intervene('Organization Payout Breach','restrict-organization')
 intervene('Post-Payout Recovery','suspend-member')
 const legal=s.organizations.find(o=>o.id===org.id)!
 legal.interventionReview={caseStatus:'In Review',state:'Owner incapacity: legal review required',publicMessage:'Prototype reported Owner incapacity. Preserve ownership and existing arrangements pending externally validated Legal / Compliance review.',decisions:[]}
 legal.history.push({at:later,actor:'Prototype scenario',action:'Reported Owner incapacity submitted for controlled legal review; no succession outcome presumed.'})
 const c=projectCases(s,supervisor).find(c=>c.organizationId===org.id&&c.type==='Legal / Compliance Review')!
 const input:DecisionInput={action:'escalate-legal',reason:'Reported Owner incapacity requires externally validated legal procedure; preserve ownership and liabilities',evidence:['DEMO-LEGAL-REPORT'],evidenceConfirmed:true}
 s=executeDecision(s,previewDecision(s,c.id,input,supervisor,later),supervisor,later).sources
 for(const g of s.worlds.flatMap(w=>w.groups))for(const r of g.lifecycle?.recoveries||[]){const m=s.clients.find(m=>m.id===r.memberId);if(m){m.restrictions??=[];const record=recoveryRestriction(g,r);if(!m.restrictions.some(v=>v.id===record.id))m.restrictions.push(record)}}
 return s
}
