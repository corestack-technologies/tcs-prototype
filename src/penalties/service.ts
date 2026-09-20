import type { Cycle, ThriftGroup } from '../groups/model.ts'
import type { Obligation, ObligationComponent } from '../rounds/model.ts'
import { balances } from '../rounds/model.ts'
import { addDays, localInstant } from '../rounds/calendar.ts'
import { minor } from '../payments/model.ts'
import { emptyLifecycle } from '../lifecycle/model.ts'
import { syncRecoveryRecords } from '../operations/restrictions.ts'
import { allocateRecovery } from '../reports/recoveryAllocation.ts'
import { actualTimestamp } from '../settings/service.ts'
import { dailyPenalty, validatePenaltyRate, penaltyPolicy, type PenaltyPlatformPolicy } from './policy.ts'
import { emptyPenalties } from './model.ts'
import { penaltyBalance } from './balances.ts'
import { finalRecognition } from '../reconciliation/evidencedRevenue.ts'
import type { Organization } from '../organizations/model.ts'
const dateAt=(at:string,zone:string)=>new Intl.DateTimeFormat('en-CA',{timeZone:zone,year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date(at))
const valid=(at:string)=>{if(!Number.isFinite(Date.parse(at)))throw Error('A valid financial evaluation timestamp is required.')}
/** Reconstruct principal from dated recognized allocations, never from exception money or penalties. */
export function principalAt(g:ThriftGroup,c:Cycle,o:Obligation,component:ObligationComponent,at:string){
 const allocations=(g.payments?.allocations||[]).filter(a=>a.obligationId===o.id&&a.componentId===component.id&&a.kind==='required')
 const known=allocations.reduce((n,a)=>minor(n+a.amountMinor),0)
 if(known!==component.requiredSatisfiedMinor)throw Error('Dated principal allocation history is required for penalty catch-up; reseed untraceable legacy examples.')
 let satisfied=allocations.filter(a=>Date.parse(a.businessAt||a.confirmedAt)<=Date.parse(at)).reduce((n,a)=>minor(n+a.amountMinor),0)
 const cases=(g.lifecycle?.recoveries||[]).filter(r=>r.cycleId===c.id&&r.memberId===o.memberId&&(r.obligationIds?.includes(o.id)||!r.obligationIds))
 for(const r of cases){
  if(!r.recoveredMinor)continue
  if(!r.recoveryPayments||r.recoveryPayments.reduce((n,p)=>minor(n+p.amountMinor),0)!==r.recoveredMinor)throw Error('Dated Recovery receipt history is required for penalty catch-up; aggregate history is preserved.')
  const temporal=structuredClone(g),tc=temporal.cycles.find(x=>x.id===c.id)!,tr=temporal.lifecycle!.recoveries.find(x=>x.id===r.id)!
  tr.recoveryPayments=r.recoveryPayments.filter(p=>Date.parse(p.businessAt)<=Date.parse(at))
  tr.recoveredMinor=tr.recoveryPayments.reduce((n,p)=>minor(n+p.amountMinor),0)
  const projection=allocateRecovery(temporal,tc)
  if(projection.cases.find(x=>x.caseId===r.id)?.issue)throw Error('Recovery source allocation requires review before accrual.')
  let amount=projection.allocations.find(a=>a.caseId===r.id&&a.kind==='principal'&&a.obligationId===o.id)?.appliedMinor||0
  for(const part of [...o.components].sort((a,b)=>a.position-b.position||a.id.localeCompare(b.id))){const debt=part.requiredMinor-part.requiredSatisfiedMinor,take=Math.min(amount,debt);if(part.id===component.id)satisfied+=take;amount-=take}
 }
 return minor(Math.max(0,component.requiredMinor-satisfied))
}
function attachPenaltySources(g:ThriftGroup,c:Cycle){
 for(const r of g.lifecycle?.recoveries.filter(r=>r.cycleId===c.id&&r.regularizedDefault&&r.status!=='resolved')||[]){
  r.obligationIds??=[]
  for(const o of c.active?.obligations.filter(o=>o.memberId===r.memberId)||[])if(!r.obligationIds.includes(o.id)&&balances(o).required&&!g.lifecycle?.recoveries.some(other=>other!==r&&other.obligationIds?.includes(o.id))){r.obligationIds.push(o.id);r.principalMinor=minor(r.principalMinor+balances(o).outstanding)}
  r.penaltyObligations??=[]
  for(const a of g.penalties?.accruals.filter(a=>a.cycleId===c.id&&a.memberId===r.memberId&&r.obligationIds?.includes(a.obligationId))||[])if(!r.penaltyObligations.some(p=>p.id===a.id)){
   r.penaltyObligations.push({id:a.id,dueAt:a.businessAt,amountMinor:a.amountMinor,obligationId:a.obligationId});r.penaltyMinor=minor(r.penaltyMinor+a.amountMinor)
   for(const w of g.penalties?.waivers.filter(w=>w.accrualId===a.id)||[])(r.penaltyWaivers??=[]).push({id:w.id,penaltyId:a.id,amountMinor:w.amountMinor,at:w.at,authority:w.actor,reason:w.reason,evidence:['Penalty waiver '+w.id]})
  }
 }
}
export function accruePenalties(group:ThriftGroup,at:string,actual=actualTimestamp(),policy:PenaltyPlatformPolicy=penaltyPolicy()):ThriftGroup{
 valid(at);valid(actual);const g=structuredClone(group)
 for(const c of g.cycles){
  if(!c.active||!c.snapshot)continue
  const rate=c.snapshot.terms.dailyPenaltyRateBps??0
  // Snapshot rate was checked at activation. A later ceiling reduction does not rewrite committed terms.
  if(!Number.isSafeInteger(rate)||rate<0)throw Error('Invalid snapshotted penalty rate.')
  if(rate===0)continue
  validatePenaltyRate(rate,c.snapshot.penaltyCeilingBps===undefined?policy:{maxDailyPenaltyRateBps:c.snapshot.penaltyCeilingBps})
  const end=c.active.endedAt||c.completedAt
  for(const o of c.active.obligations){
   const round=c.active.rounds.find(r=>r.id===o.roundId)
   if(!round||c.active.generatedRoundIds&&!c.active.generatedRoundIds.includes(round.id)||Date.parse(round.schedule.opensAt)>Date.parse(at))continue
   const first=dateAt(round.schedule.lateAt,round.schedule.timezone),last=dateAt(at,round.schedule.timezone)
   for(let day=first;day<=last;day=addDays(day,1)){
    const instant=localInstant(day,round.schedule.timezone)
    if(Date.parse(instant)<Date.parse(round.schedule.lateAt)||Date.parse(instant)>Date.parse(at)||end&&Date.parse(instant)>=Date.parse(end))continue
    for(const component of o.components){
     if(!component.requiredMinor)continue
     const id=component.id+':penalty:'+day
     if(g.penalties?.accruals.some(a=>a.id===id))continue
     const basis=principalAt(g,c,o,component,instant)
     if(!basis)continue
     const amount=dailyPenalty(basis,rate)
     ;(g.penalties??=emptyPenalties()).accruals.push({id,cycleId:c.id,roundId:o.roundId,obligationId:o.id,componentId:component.id,memberId:o.memberId,position:component.position,accrualDate:day,businessAt:instant,principalBasisMinor:basis,dailyRateBps:rate,amountMinor:amount,status:'ACCRUED',recordedAt:actual})
    }
   }
  }
  attachPenaltySources(g,c)
 }
 g.penalties?.accruals.sort((a,b)=>a.businessAt.localeCompare(b.businessAt)||a.id.localeCompare(b.id))
 return g
}
function receivedBenefit(g:ThriftGroup,c:Cycle,memberId:string,at:string){
 const records=g.payouts?.records.filter(p=>p.cycleId===c.id&&p.memberId===memberId)||[]
 if(records.length)return records.some(p=>p.installments.some(i=>{
   const disputed=p.disputes.some(d=>d.installmentId===i.id),final=disputed?finalRecognition(p,i.id):undefined
   const recognizedAt=disputed?final?.at:i.status==='member-confirmed'?i.confirmedAt:i.status==='window-elapsed'?i.autoCompletedAt:undefined
   return !!recognizedAt&&Date.parse(recognizedAt)<=Date.parse(at)&&(disputed?(final?.receivedMinor||0):i.amountMinor)>0
  }))
 return g.lifecycle?.payoutFacts.some(p=>p.cycleId===c.id&&p.memberId===memberId&&['received-recorded','completed-recorded','received-demo'].includes(p.status)&&!!p.at&&Date.parse(p.at)<=Date.parse(at))||false
}
export function evaluatePostPayoutDefaults(group:ThriftGroup,at:string,actual=actualTimestamp()):ThriftGroup{
 valid(at);valid(actual);const g=structuredClone(group)
 for(const c of g.cycles){
  if(!c.active)continue
  attachPenaltySources(g,c)
  const projection=allocateRecovery(g,c)
  for(const o of c.active.obligations){
   const r=c.active.rounds.find(r=>r.id===o.roundId)
   if(!r||c.active.generatedRoundIds&&!c.active.generatedRoundIds.includes(r.id))continue
   const threshold=localInstant(addDays(dateAt(r.schedule.lateAt,r.schedule.timezone),7),r.schedule.timezone)
   if(Date.parse(at)<Date.parse(threshold)||!balances(o).outstanding||!receivedBenefit(g,c,o.memberId,at))continue
   if(g.lifecycle?.recoveries.some(x=>x.cycleId===c.id&&x.memberId===o.memberId&&(x.status!=='resolved'||!x.obligationIds||x.obligationIds.includes(o.id))))continue
   if(projection.allocations.some(a=>a.obligationId===o.id&&a.outstandingMinor===0))continue
   if(g.payments?.transactions.some(t=>t.cycleId===c.id&&t.memberId===o.memberId&&t.allocationStatus==='exception')||g.manualContributions?.some(m=>m.cycleId===c.id&&m.memberId===o.memberId&&m.status==='review-required'))continue
   const id=c.id+':post-payout-default:'+o.id,l=(g.lifecycle??=emptyLifecycle()),principal=c.active.obligations.filter(x=>x.memberId===o.memberId&&balances(x).required&&!l.recoveries.some(r=>r.cycleId===c.id&&r.obligationIds?.includes(x.id)))
   l.recoveries.push({id,cycleId:c.id,memberId:o.memberId,regularizedDefault:true,recordedAt:actual,obligationIds:principal.map(x=>x.id),principalMinor:principal.reduce((n,x)=>minor(n+balances(x).outstanding),0),penaltyMinor:0,penaltyObligations:[],recoveredMinor:0,status:'open',restricted:true,openedAt:at,reviewStatus:'pending',reason:'Required principal remains outstanding after seven full calendar days following grace expiry, after receipt of payout.'})
   ;(g.penalties??=emptyPenalties()).defaults.push({id,cycleId:c.id,memberId:o.memberId,obligationId:o.id,thresholdAt:threshold,businessAt:at,recordedAt:actual,principalOutstandingMinor:balances(o).outstanding,recoveryId:id,status:'POST_PAYOUT_DEFAULT'})
   g.history.push({at:actual,actor:'TCS lifecycle process',action:'POST_PAYOUT_DEFAULT '+id+'; business threshold '+threshold+'; historical event retained.'})
   attachPenaltySources(g,c)
  }
 }
 syncRecoveryRecords(g)
 return g
}
export function waivePenalty(group:ThriftGroup,organization:Organization,actorId:string,accrualId:string,amountMinor:number,reason:string,actual=actualTimestamp()){
 if(group.organizationId!==organization.id||actorId!==organization.ownerMemberId)throw Error('Organization Owner authority is required.')
 valid(actual);minor(amountMinor)
 if(!amountMinor||reason.trim().length<10)throw Error('Provide a positive penalty reduction and a reason of at least 10 characters.')
 const g=structuredClone(group),a=g.penalties?.accruals.find(a=>a.id===accrualId)
 if(!a||a.memberId===actorId)throw Error('An Owner cannot approve a penalty exception benefiting themselves; independent TCS review is required.')
 if(amountMinor>penaltyBalance(g,a).outstanding)throw Error('Reduction exceeds unpaid penalty; principal cannot be waived.')
 const w={id:crypto.randomUUID(),accrualId,amountMinor,actor:actorId,reason:reason.trim(),at:actual}
 g.penalties!.waivers.push(w)
 for(const r of g.lifecycle?.recoveries||[])if(r.penaltyObligations?.some(p=>p.id===a.id))(r.penaltyWaivers??=[]).push({id:w.id,penaltyId:a.id,amountMinor,at:actual,authority:actorId,reason:w.reason,evidence:['Penalty waiver '+w.id]})
 g.history.push({at:actual,actor:actorId,action:'Penalty reduced by '+amountMinor+' kobo for '+a.id+'. Reason: '+w.reason})
 return g
}
