import { hasPermission } from '../access/authorization.ts'
import { permittedActions } from './review.ts'
import type { OperationsSources } from './sources.ts'
import type { OperationsCase, InternalSession, CaseStatus } from './model.ts'
import type { DecisionInput, SourceReview } from './review.ts'
import { locateReview } from './locate.ts'
import { newDisputeProcess, restrictionScope, type RestrictionRecord, type EvidenceRequest } from './interventionModel.ts'
import { evaluatePayouts } from '../payouts/service.ts'
import { payoutTotals } from '../payouts/math.ts'
import { minor } from '../payments/model.ts'
const plus=(at:string,hours:number)=>new Date(Date.parse(at)+hours*3600000).toISOString()
const windowHours=(n:number|undefined,fallback:number)=>{const v=n??fallback;if(!Number.isInteger(v)||v<1||v>8760)throw Error('Choose a prototype policy window from 1 to 8760 hours.');return v}
export function applyIntervention(s:OperationsSources,c:OperationsCase,input:DecisionInput,actor:InternalSession,at:string,id:string){
 if(!permittedActions(c,actor).includes(input.action))throw Error('Access denied for this intervention.')
 const x=locateReview(s,c),action=input.action
 if(input.reason.trim().length<10)throw Error('Record a meaningful reason of at least 10 characters.')
 const evidence=()=>{if(!input.evidenceConfirmed||!input.evidence?.some(e=>e.trim()))throw Error('Inspect and acknowledge the supporting evidence.');return [...input.evidence]}
 if(actor.personaId===x.org?.ownerMemberId&&['member-upheld','organization-accepted','partial-receipt','confirm-exit-settlement','release-restriction'].includes(action))throw Error('The benefiting Owner cannot decide their own financial exception.')
 const existing=x.target!.review
 const review:SourceReview=structuredClone(existing||{caseStatus:c.status,state:c.sourceStatus,decisions:[]})
 x.target!.review=review
 let status:CaseStatus=review.caseStatus,state=review.state,effect=''
 const d=x.payout?.disputes.find(d=>d.id===input.disputeId)||(x.payout?.disputes.length===1?x.payout.disputes[0]:undefined)
 const process=d?(d.process??=newDisputeProcess()):undefined
 const requests=process?.requests||(review.evidenceRequests??=[])
 for(const request of requests)if(!request.responses.length&&!request.missedAt&&Date.parse(at)>Date.parse(request.deadline))request.missedAt=at
 if(['member-upheld','organization-accepted','partial-receipt'].includes(action)){
  if(!d||!process||!x.payout)throw Error('Select the original payout dispute.')
  if(!['investigation','appeal-pending','exceptionally-reopened'].includes(process.stage))throw Error('The initial decision is retained. Use the one appeal or authorized exceptional reopening.')
  if(process.stage==='appeal-pending'&&process.resolutions[0].reviewerId===actor.personaId)throw Error('A different authorized reviewer must decide the appeal.')
  if(requests.some(r=>!r.responses.length&&Date.parse(at)<=Date.parse(r.deadline)))throw Error('The requested evidence window remains open.')
  if(requests.some(r=>r.missedAt&&!r.responses.length)&&!process.policy.decideOnAvailableEvidence)throw Error('Policy does not permit deciding without the requested evidence.')
  const refs=evidence(),installment=x.payout.installments.find(i=>i.id===d.installmentId)!
  const received=action==='organization-accepted'?installment.amountMinor:action==='member-upheld'?0:minor(input.amountMinor??NaN)
  if(action==='partial-receipt'&&(received<=0||received>=installment.amountMinor))throw Error('Partial receipt must be positive and less than the disputed installment.')
  const phase=process.stage==='appeal-pending'?'appeal':process.stage==='exceptionally-reopened'?'exceptional':'initial'
  process.resolutions.push({id,at,reviewerId:actor.personaId,outcome:action as 'member-upheld'|'organization-accepted'|'partial-receipt',receivedMinor:received,reason:input.reason,evidence:refs,phase})
  if(phase==='initial'){
   process.policy.appealHours=windowHours(input.appealHours,process.policy.appealHours)
   process.appealDeadline=plus(at,process.policy.appealHours);process.stage='appeal-available'
  }else{
   process.stage='final';process.finalizedAt=at;d.status='resolved'
   if(phase==='appeal'){process.appeal!.outcomeId=id;process.appeal!.reviewerId=actor.personaId;process.appeal!.finalizedAt=at}
  }
  state=action==='member-upheld'?'Member claim upheld; Organization payout remains due':action==='partial-receipt'?'Partial receipt established; remaining payout due':'Organization evidence accepted; no Member confirmation recorded'
  status=process.stage==='final'?'Resolved':'Awaiting External Action'
  effect=state+'. Preserve original transfers and obligations; retain one appeal and all evidence. No money movement is executed. Once final, recognize fees and TCS share against evidenced receipt, with separate adjustment review for differences from prior postings.'
 }else if(action==='submit-appeal'){
  if(!process||process.stage!=='appeal-available'||process.appeal)throw Error('Only one appeal is permitted after the initial decision.')
  if(Date.parse(at)>Date.parse(process.appealDeadline!))throw Error('The configured appeal window has expired.')
  if(!input.party)throw Error('Identify the appealing party.')
  process.appeal={at,actor:actor.personaId,party:input.party,reason:input.reason,evidence:evidence()};process.stage='appeal-pending';status='Awaiting Approval';state='One appeal pending independent review';effect='Retain the original decision and record the identified party appeal for a different authorized reviewer.'
 }else if(action==='finalize-dispute'){
  if(!process||process.stage!=='appeal-available'||process.appeal||Date.parse(at)<=Date.parse(process.appealDeadline!))throw Error('Finalization requires an expired appeal window without an appeal.')
  process.stage='final';process.finalizedAt=at;d!.status='resolved';status='Resolved';state='Dispute final; appeal window expired';effect='Finalize normal dispute processing. Preserve the original decision, evidence and any outstanding Organization payout liability.'
 }else if(action==='exceptional-reopen'){
  if(!hasPermission(actor,'cases.exceptional_reopen')||!process||process.stage!=='final')throw Error('Supervisor authority and a finalized dispute are required.')
  evidence();process.reopenings.push({at,actor:actor.personaId,reason:input.reason,previousFinalizedAt:process.finalizedAt!});process.stage='exceptionally-reopened';d!.status='open';status='In Review';state='Exceptionally reopened by Supervisor';effect='Reopen investigation exceptionally, retaining prior final decisions and the consumed appeal. No financial history is erased.'
 }else if(action==='request-information'){
  if(!input.party)throw Error('Identify the party requested to respond.')
  if(process?.stage==='final')throw Error('Final dispute evidence is read-only until exceptional reopening.')
  const hours=windowHours(input.evidenceHours,process?.policy.evidenceHours||72)
  if(process)process.policy.evidenceHours=hours
  requests.push({id,party:input.party,requested:input.reason,at,deadline:plus(at,hours),responses:[]})
  status='Awaiting Information';state='Party evidence requested';effect=`Request ${input.party} evidence by ${plus(at,hours)}. Preserve the case if the deadline is missed; no notification or external integration is claimed.`
 }else if(action==='record-response'){
  const request=requests.find(r=>r.id===input.requestId)
  if(!request||request.party!==input.party)throw Error('Select the evidence request and responding party.')
  if(process?.stage==='final')throw Error('Final dispute evidence is read-only.')
  request.responses.push({at,actor:actor.personaId,statement:input.reason,evidence:evidence()})
  status='In Review';state='Party evidence received';effect='Record the identified party response and evidence, including any missed deadline. No financial outcome is inferred.'
 }else if(action.startsWith('escalate-')){
  const destination=action==='escalate-provider'?'External Provider / Bank':action==='escalate-supervisor'?'Supervisor':action==='escalate-legal'?'Legal / Compliance':'Member Protection'
  ;(review.escalations??=[]).push({at,actor:actor.personaId,destination,reason:input.reason})
  status=action==='escalate-supervisor'?'Escalated':'Awaiting External Action';state=destination+' review required';effect='Escalate to '+destination+'. Preserve liabilities, ownership and all active arrangements. External validation is required; no bank reversal, next-of-kin payout or ownership transfer is executed.'
 }else if(['restrict-member','suspend-member','restrict-organization','suspend-organization'].includes(action)){
  if(!hasPermission(actor,action.includes('member')?'restrictions.member.apply':'restrictions.organization.apply'))throw Error('Restriction authority is required.')
  evidence()
  const member=action.endsWith('-member'),target=member?x.member:x.org
  if(!target)throw Error('The affected source account must exist in the shared directory.')
  if(['Resolved','Closed'].includes(c.status))throw Error('A resolved matter cannot justify a new restriction.')
  const records=target.restrictions??=[]
  if(records.some(r=>r.sourceCaseId===c.id&&r.reviewStatus==='active'))throw Error('An applicable restriction already exists; preserve its history.')
  records.push({id,targetId:target.id,target:member?'Member':'Organization',type:action.startsWith('suspend')?'suspension':'new-activity',sourceCaseId:c.id,reason:input.reason,startedAt:at,authority:actor.personaId,scope:restrictionScope,reviewStatus:'active'})
  status='In Review';state=member?'Member new activity restricted':'Organization new activity restricted';effect=state+'. '+restrictionScope
 }else if(action==='release-restriction'){
  
  evidence()
  const records=[...(x.member?.restrictions||[]),...(x.org?.restrictions||[])]
  const r=records.find(r=>r.id===input.targetId&&r.sourceCaseId===c.id&&r.reviewStatus==='active')
  if(!r)throw Error('Choose an active restriction attached to this case.')
  if(!hasPermission(actor,r.target==='Member'?'restrictions.member.apply':'restrictions.organization.apply'))throw Error('Permission for this restriction target is required.')
  const cleared=x.recovery?x.recovery.status==='resolved':x.exit?x.exit.settlement.status==='resolved':x.payout?payoutTotals(x.payout).outstanding===0&&!!x.payout.finalizedAt&&x.payout.status.startsWith('completed-')&&x.payout.disputes.every(d=>d.status==='resolved'):false
  if(!cleared)throw Error('The underlying source is unresolved. Legal or exceptional account release requires an externally validated procedure.')
  release(r,at,actor.personaId,input.reason);status='Resolved';state='Applicable restriction released';effect='Release this resolved case restriction only. Retain all independent restrictions, commercial clearance and historical default.'
 }else if(action==='confirm-exit-settlement'){
  if(!x.exit||x.exit.settlement.status!=='due')throw Error('Select an unresolved Exit Settlement.')
  const refs=evidence(),value=minor(input.amountMinor??NaN)
  const settled=(x.exit.settlementConfirmations||[]).reduce((n,r)=>n+r.amountMinor,0)
  if(value!==x.exit.settlement.dueMinor-settled)throw Error('Confirmation requires the exact remaining Exit Settlement amount; partial application requires a defined process.')
  ;(x.exit.settlementConfirmations??=[]).push({id,at,actor:actor.personaId,amountMinor:value,reason:input.reason,evidence:refs})
  x.exit.settlement.status='resolved'
  // Link only this settlement; other Members and liabilities remain untouched.
  for(const linked of x.group?.lifecycle?.disputes||[])if(linked.exitId===x.exit.id)linked.status='resolved'
  status='Resolved';state='Exit Settlement evidenced and resolved';effect='Confirm the exact evidenced Organization settlement through controlled review. Preserve original principal, replacement records and settlement due amount; no TCS payment is made.'
 }else if(action==='keep-open'){
  status='In Review';state='Oversight remains open';effect='Retain the source liability and restriction. Recovery resolution requires cleared funds followed by Organization review; a payment claim does not release debt.'
 }
 if(!effect)throw Error('No controlled intervention effect is defined.')
 if(x.payout&&x.group&&x.world){
  for(const disputed of x.payout.disputes){const linked=x.group.lifecycle?.disputes.find(l=>l.id===disputed.installmentId+'-dispute');if(linked)linked.status=disputed.status==='resolved'?'resolved':'open'}
  const evaluated=evaluatePayouts(x.group,at,x.group.payouts?.demoBanks||{})
  x.world.groups=x.world.groups.map(g=>g.id===evaluated.id?evaluated:g)
  if(status==='Resolved'&&(payoutTotals(x.payout).outstanding>0||x.payout.disputes.some(d=>d.status!=='resolved'))){status='Awaiting External Action';state+='; Organization liability remains open'}
 }
 return {status,state,effect,message:input.reason}
}
function release(r:RestrictionRecord,at:string,actor:string,reason:string){r.reviewStatus='released';r.releasedAt=at;r.releasedBy=actor;r.removalReason=reason}
export function recordMissedDeadlines(requests:EvidenceRequest[],at:string){for(const r of requests)if(!r.responses.length&&!r.missedAt&&Date.parse(at)>Date.parse(r.deadline))r.missedAt=at}
