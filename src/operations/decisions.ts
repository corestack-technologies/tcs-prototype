import { authoritySnapshot } from '../access/authorization.ts'
import { reconcileEvidencedPayout } from '../reconciliation/evidencedRevenue.ts'
import { applyIntervention } from './interventions.ts'
import { finishAmendmentApproval } from '../lifecycle/amendment.ts'
import type { OperationsSources } from './sources.ts'
import { projectCases } from './sources.ts'
import { locateReview } from './locate.ts'
import { permittedActions, type DecisionInput, type DecisionRecord, type SourceReview } from './review.ts'
import { requireInternal, money, type InternalSession, type OperationsCase, type CaseStatus } from './model.ts'
import { allocationChoices, applyAllocation } from './allocation.ts'
import { confirmRevenuePayment } from '../reconciliation/revenue.ts'
import { reconcile, financialClearance, groupFinancialBlockers } from '../reconciliation/service.ts'
import { unresolved } from '../lifecycle/service.ts'
import { contactComplete, profileErrors } from '../clients/model.ts'
import { canApply, organizationFormErrors } from '../organizations/model.ts'
export interface DecisionPreview { caseId:string; reviewerId:string; input:DecisionInput; version:string; effect:string; before:Record<string,unknown>; after:Record<string,unknown> }
const version=(s:OperationsSources)=>JSON.stringify(s)
function facts(s:OperationsSources,c:OperationsCase):Record<string,unknown>{
 const x=locateReview(s,c)
 return {adjustment:x.f?.adjustment,payout:x.payout?{status:x.payout.status,disputes:x.payout.disputes,breach:x.payout.breach}:undefined,recovery:x.recovery,exit:x.exit,memberRestrictions:x.member?.restrictions,organizationRestrictions:x.org?.restrictions,sourceStatus:x.target?.review?.state || c.sourceStatus,verification:x.kind==='kyc'?x.member?.verification.status:undefined,organization:x.org?.status,settlementAccount:x.kind==='account'?x.org?.settlement:undefined,proposedAccount:x.account?.proposed,accountRequestStatus:x.account?.status,manual:x.manual?{id:x.manual.id,status:x.manual.status,amountMinor:x.manual.amountMinor,allocatedMinor:x.manual.allocatedMinor,source:x.manual.source}:undefined,payment:x.group?.payments?.transactions.find(t=>t.id===x.f?.transactionId),settlement:x.settlement?{id:x.settlement.id,status:x.settlement.status,grossMinor:x.settlement.grossMinor,netMinor:x.settlement.netMinor,varianceMinor:x.settlement.varianceMinor,links:x.settlement.reconciliationLinks}:undefined,revenue:x.revenue?{status:x.revenue.status,paymentStatus:x.revenue.paymentStatus,amountMinor:x.revenue.amountMinor,payments:x.revenue.payments.map(p=>({id:p.id,amountMinor:p.amountMinor,status:p.status}))}:undefined,amendment:x.amendment?{status:x.amendment.status,currentTerms:x.amendment.currentTerms,proposedTerms:x.amendment.proposedTerms,consents:x.amendment.consents}:undefined,forceClose:x.force?{status:x.force.status,balances:x.force.balances,requestedAbsorptionMinor:x.force.requestedAbsorptionMinor}:undefined,cycle:x.group?.cycles.find(cycle=>cycle.id===c.cycleId)?.status,termination:x.termination?.status}
}
function authorize(s:OperationsSources,c:OperationsCase,input:DecisionInput,actor:InternalSession){
 if(!permittedActions(c,actor).includes(input.action))throw Error('This internal user cannot take that decision on this case.')
 const x=locateReview(s,c)
 if(!x.target)throw Error('The source review record is unavailable.')
 if(x.org&&x.world?.finance&&x.org.id!==x.world.finance.organizationId)throw Error('Tenant mismatch.')
 const financial=['accept-manual','allocate','correct-link','confirm-match','confirm-receipt'].includes(input.action)
 if((financial||['reject','not-confirmed','request-information','escalate-provider','resolution-required','recommend'].includes(input.action)||['force-close','amendment','termination'].includes(x.kind||''))&&input.reason.trim().length<10)throw Error('Record a meaningful reason of at least 10 characters.')
 if(financial&&(!input.evidenceConfirmed||!input.evidence?.some(e=>e.trim())))throw Error('Identify and acknowledge the evidence relied upon before confirming this financial decision.')
 if(['approve','accept-manual','confirm-receipt','allocate','correct-link'].includes(input.action)){
  const review=x.target.review
  if(review?.approvalPolicy==='independent'&&[review.initiatingActor,review.recommendedBy].includes(actor.personaId))throw Error('Independent approval requires a different authorized reviewer.')
  if(x.manual&&[x.manual.actorId,x.org?.ownerMemberId].includes(actor.personaId))throw Error('The benefiting Owner cannot approve this manual claim.')
 }
}
function perform(sources:OperationsSources,caseId:string,input:DecisionInput,actor:InternalSession|null,at:string,recordId:string){
 requireInternal(actor)
 if(!Number.isFinite(Date.parse(at)))throw Error('Valid decision time required.')
 const s=structuredClone(sources),c=projectCases(s,actor).find(c=>c.id===caseId)
 if(!c)throw Error('Reopen the source case.')
 authorize(s,c,input,actor)
 let x=locateReview(s,c)
 const before=structuredClone(facts(s,c)),prior=x.target!.review
 const latest=prior?.decisions.at(-1)
 if(latest&&Date.parse(at)<Date.parse(latest.at))throw Error('Decision time cannot precede prior review.')
 let status:CaseStatus='Resolved',state='',effect='',message: string|undefined
 const action=input.action,kind=x.kind
 if(kind==='intervention'){
  const result=applyIntervention(s,c,input,actor,at,recordId);status=result.status;state=result.state;effect=result.effect;message=result.message;x=locateReview(s,c)
 }else if(action==='request-information'){
  status='Awaiting Information';state='Information required';message=input.reason.trim();effect='Request information from the relevant Member or Organization; retain the source record and its financial balances.'
  if(kind==='kyc'){x.member!.verification.status='information-required';x.member!.verification.note=message}
  if(kind==='organization'){x.org!.status='information-required';x.org!.application.note=message}
  if(kind==='account')x.account!.status='information-required'
  if(kind==='amendment')x.amendment!.status='information-required'
  if(kind==='force-close')x.force!.status='information-required'
  if(kind==='termination')x.termination!.status='information-required'
 }else if(action==='recommend'){
  status='Awaiting Approval';state='Independent approval required';effect='Record a recommendation for a different authorized approver. No business outcome is executed.'
 }else if(['resolution-required','keep-open','escalate-provider'].includes(action)){
  status=action==='escalate-provider'?'Awaiting External Action':'In Review';state=action==='resolution-required'?'Resolution required / refund or reallocation review':action==='escalate-provider'?'External provider resolution required':'Exception remains open';effect=state+'. Preserve original amounts and existing allocations.'
  if(x.f)x.f.status=action==='escalate-provider'?'escalated':'under-review'
 }else if(kind==='kyc'){
  if(!['pending','information-required'].includes(x.member!.verification.status))throw Error('Verification is no longer awaiting a decision.')
  if(action==='approve'){
   const m=x.member!
   if(!m.verification.submission||!m.onboardingComplete||!contactComplete(m)||m.accountStatus==='closed'||Object.keys(profileErrors(m.verification.submission.profile)).length||!/^\d{11}$/.test(m.verification.submission.nin)||m.verification.submission.documents.length<2)throw Error('A complete submitted identity, profile, contact confirmation and evidence are required.')
   m.verification.status='verified';m.verification.note='Your verification was approved.';state='Verified';effect='Verify this Member. Preserve existing account restrictions, identity and submitted evidence.'
  }else{x.member!.verification.status='rejected';x.member!.verification.note=input.reason;state='Rejected';effect='Reject this verification submission with a reason. Retain the Member identity; do not impose a platform ban.'}
 }else if(kind==='organization'){
  if(!['submitted','pending','information-required'].includes(x.org!.status))throw Error('Application is no longer awaiting a decision.')
  if(action==='approve'){
   const owner=s.clients.find(m=>m.id===x.org!.ownerMemberId),app=x.org!.application
   if(!owner||!canApply(owner)||!app.snapshot||Object.keys(organizationFormErrors(app.snapshot)).length||!app.snapshot.declarationAccepted)throw Error('A complete submitted application and eligible verified Owner are required.')
   x.org!.status='approved';x.org!.application.note='Application approved. Complete settlement setup and Owner activation.';state='Approved — setup required';effect='Approve this existing Organization application. Its Owner completes the established settlement setup and activation flow.'
  }else{x.org!.status='declined';x.org!.application.note=input.reason;state='Declined';effect='Decline the existing application with a reason; retain applicant and application history.'}
 }else if(kind==='account'){
  if(x.account!.effectiveAt||x.account!.status==='rejected')throw Error('This account request is final.')
  if(action==='approve'){
   if(x.account!.proposed.validation!=='demo-resolved'||x.account!.proposed.confirmation!=='owner-confirmed')throw Error('Validated, Owner-confirmed account details are required.')
   x.account!.status='approved';x.account!.approvedAt=at;status='Awaiting External Action';state='Approved — awaiting provider update';effect='Approve the settlement-account request. Keep the current effective account until a separate confirmed provider update.'
  }else{x.account!.status='rejected';state='Rejected';effect='Reject the proposed account change. The effective settlement account remains unchanged.'}
 }else if(kind==='manual'){
  if(x.manual!.status!=='review-required')throw Error('This manual receipt already has a final outcome.')
  if(action==='accept-manual'){
   const target=input.targetId || allocationChoices(s,c)[0]?.id
   if(!target)throw Error('No safe intended obligation is available. Request information or retain the claim for controlled resolution.')
   const selected=applyAllocation(s,c,target,at,recordId);state='Manual/offline — Organization confirmed / TCS reviewed';effect=`Recognize and allocate ${money(selected.amountMinor)} to ${selected.label}. Preserve the manual/offline source; no provider confirmation is created.`
  }else{x.manual!.status='rejected';state='Cannot verify manual claim';effect='Reject the claim without satisfying the obligation. Preserve the Organization-recorded claim.';if(x.f)x.f.status='resolved'}
 }else if(kind==='payment'){
  if(action!=='allocate')throw Error('No monetary disposition is defined for this exception.')
  const selected=applyAllocation(s,c,input.targetId||'',at,recordId);state='Payment allocation reviewed';effect=`Allocate ${money(selected.amountMinor)} to ${selected.label}. Preserve the original provider confirmation and audit the target.`
 }else if(kind==='settlement'){
  if(!x.settlement||!x.finance||!x.org||!x.world)throw Error('This exception has no settlement batch to relink; request provider information.')
  if(action==='correct-link'){
   const line=x.settlement.lines.find(l=>l.providerReference===input.settlementLineReference)
   const tx=x.world.groups.flatMap(g=>g.payments?.transactions||[]).find(t=>t.id===input.targetId&&t.organizationId===x.org!.id)
   if(!line||!tx||tx.provider!==x.settlement.provider||Date.parse(tx.confirmedAt)>Date.parse(x.settlement.settledAt)||line.grossMinor>tx.amountMinor)throw Error('Choose a compatible confirmed transaction from this Organization and provider.')
   ;(x.settlement.reconciliationLinks??=[]).push({providerReference:line.providerReference,transactionId:tx.id,decisionId:recordId,at,actor:actor.personaId,reason:input.reason})
  }
  x.world.finance=reconcile(x.finance,x.world.groups,x.org,[at,x.finance.referenceAt||at].sort().at(-1)!)
  x=locateReview(s,c)
  if(action==='confirm-match'&&x.settlement!.status!=='matched')throw Error('Amounts and transaction coverage still do not reconcile. Keep the exception open or escalate; do not force a balance.')
  const matched=x.settlement!.status==='matched'
  status=matched?'Resolved':'In Review';state=matched?'Reconciled':'Link corrected — exception remains';effect=matched?'Reconcile the settlement using evidenced transaction links. Preserve provider amounts, fees and account snapshots.':'Record the corrected link. The remaining variance or unmatched coverage stays unresolved.'
 }else if(kind==='revenue'){
  if(action==='confirm-receipt'){
   const r=x.revenue!,payment=r.payments.find(p=>p.status==='awaiting-confirmation')
   if(!payment)throw Error('No exact awaiting-confirmation payment is available.')
   x.world!.finance=confirmRevenuePayment(x.finance!,x.org!.id,r.id,payment.id,actor,[at,x.finance!.referenceAt||at].sort().at(-1)!)
   x=locateReview(s,c);state='Settled';effect=`Confirm ${money(r.amountMinor)} received by TCS and settle this revenue-share obligation. Recalculate Organization clearance from all remaining obligations.`
  }else{status='In Review';state='Payment not confirmed';message=input.reason;effect='Record that receipt could not be confirmed. Preserve the payment claim, exact amount due and applicable restrictions.'}
 }else if(kind==='amendment'){
  if(action==='approve'){
   if(['approved-awaiting-consent','approved-awaiting-application','rejected'].includes(x.amendment!.status))throw Error('The amendment already has an approval or rejection.')
   const a=x.amendment!
   state=finishAmendmentApproval(x.group!,a,at);status=a.status==='effective'?'Resolved':'Awaiting External Action';effect=a.status==='effective'?'Apply the consented non-financial text change. Preserve activation snapshots and financial history.':'Approve the amendment request. Preserve current financial terms and history until required consent and an explicit effective-Round and financial-impact rule exist.'
  }else{x.amendment!.status='rejected';state='Rejected';effect='Reject the amendment request; preserve current and proposed terms without applying changes.'}
 }else if(kind==='force-close'){
  if(action==='approve'){
   const f=x.force!,cycle=x.group!.cycles.find(c=>c.id===f.cycleId)
   if(!cycle?.active||cycle.status!=='activated')throw Error('Only the requested active Cycle can be Force Closed.')
   if(f.requestedAbsorptionMinor!==0)throw Error('Nonzero absorption requires exact liability records, Members and per-liability amounts before execution. Aggregate absorption cannot be applied.')
   if(!input.evidenceConfirmed||!input.evidence?.length)throw Error('Acknowledge the closure evidence and retained liabilities.')
   f.status='approved';cycle.status='force-closed';cycle.completedAt=at;cycle.active.endedAt=at;cycle.active.penaltyEnabled=false;x.group!.currentCycleId=null
   state='Force Closed — liabilities retained';effect='Force Close the Cycle and stop new penalty growth. Preserve all unpaid obligations, payouts, exit settlements, defaults and disputes. No money is marked paid and no principal is waived.'
  }else{x.force!.status='rejected';state='Rejected';effect='Reject Force Close. Keep the Cycle and all obligations intact.'}
 }else if(kind==='termination'){
  if(action==='approve'){
   if(x.group!.cycles.some(c=>c.status==='activated')||unresolved(x.group!))throw Error('Unresolved financial matters block direct termination. Complete Force Close or the applicable financial resolution first.')
   x.termination!.status='terminated';state='Terminated';effect='Terminate the cleared Group while retaining all historical Cycles and financial records.'
  }else{x.termination!.status='rejected';state='Rejected';effect='Reject the termination request without deleting Group history.'}
 }
 if(!effect)throw Error('No permitted source effect is defined for this decision.')
 const review:SourceReview={...(kind==='intervention'?x.target!.review:prior),caseStatus:status,state,publicMessage:message,decisions:[...(prior?.decisions||[])]}
 if(action==='recommend'){review.approvalPolicy='independent';review.recommendedBy=actor.personaId;review.initiatingActor=actor.personaId}
 x.target!.review=review
 if(x.manual&&x.f)x.f.review=review
 if(x.f&&status==='Resolved')x.f.status='resolved'
 else if(x.f&&kind==='intervention')x.f.status=status==='Awaiting External Action'?'escalated':'under-review'
 const updatedCase=projectCases(s,actor).find(row=>row.id===caseId)||c
 const after=structuredClone(facts(s,updatedCase))
 const decision:DecisionRecord={id:recordId,caseId,action,reviewerId:actor.personaId,reviewerName:authoritySnapshot(actor).name,authority:authoritySnapshot(actor),at,reason:input.reason.trim(),comments:input.comments?.trim()||'',evidence:input.evidence||[],before,after,effect,policy:c.policy,initiatingActor:review.recommendedBy||x.manual?.actorId||x.org?.ownerMemberId}
 review.decisions.push(decision)
 // Public source history records the decision identity and effect, not internal comments.
 const event={at,actor:actor.personaId,action:`Operations decision ${recordId}: ${effect}`}
 if(kind==='kyc')x.member!.history.push(event)
 else if(['organization','account'].includes(kind!))x.org!.history.push(event)
 else {if(x.group)x.group.history.push(event);if(x.f)x.f.history.push(event);if(x.revenue)x.revenue.history.push(event)}
 if(kind==='intervention'&&x.finance&&x.payout&&x.org)reconcileEvidencedPayout(x.finance,x.payout,x.org)
 if(kind==='intervention'&&x.exit?.settlement.status==='resolved'&&x.org?.clearance&&action==='confirm-exit-settlement')x.org.clearance.exitSettlements=Math.max(0,x.org.clearance.exitSettlements-1)
 if(x.finance&&x.world&&x.org){
  const clearance=financialClearance(x.world.finance!,x.world.groups)
  x.org.commercialRestricted=clearance.restricted
  if(x.org.clearance){x.org.clearance.reconciliationCases=clearance.cases;x.org.clearance.tcsReceivableCases=clearance.unpaidTcs;x.org.clearance.activeCycles=x.world.groups.filter(g=>g.cycles.some(c=>c.status==='activated')).length}
  x.world.groups.forEach(g=>{g.reconciliationBlockers=groupFinancialBlockers(x.world!.finance!,g);g.commercialCommencementRestricted=clearance.restricted})
 }
 return {sources:s,decision}
}
export function previewDecision(s:OperationsSources,caseId:string,input:DecisionInput,actor:InternalSession|null,at:string):DecisionPreview{
 const trial=perform(s,caseId,input,actor,at,'preview')
 return {caseId,reviewerId:actor!.personaId,input:structuredClone(input),version:version(s),effect:trial.decision.effect,before:trial.decision.before,after:trial.decision.after}
}
export function executeDecision(s:OperationsSources,preview:DecisionPreview,actor:InternalSession|null,at:string){
 requireInternal(actor)
 if(preview.reviewerId!==actor.personaId)throw Error('The active reviewer changed. Preview this decision again.')
 if(preview.version!==version(s))throw Error('Source state changed after preview. Review the updated case and preview again.')
 return perform(s,preview.caseId,preview.input,actor,at,'DEC-'+crypto.randomUUID())
}
