import type { OperationsSources } from './sources.ts'
import type { OperationsCase } from './model.ts'
import { locateReview } from './locate.ts'
import { balances } from '../rounds/model.ts'
import { effectiveCycle } from '../lifecycle/handover.ts'
import { emptyPayments } from '../payments/model.ts'
export interface AllocationChoice { id:string; label:string; groupId:string; cycleId:string; obligationId:string; amountMinor:number }
export function allocationChoices(s:OperationsSources,c:OperationsCase):AllocationChoice[]{
 const x=locateReview(s,c),f=x.f
 const transaction=x.group?.payments?.transactions.find(t=>t.id===f?.transactionId)
 const unmatched=x.finance?.unmatchedPayments.find(t=>t.providerReference===f?.sourceReference)
 const memberId=x.manual?.memberId || transaction?.memberId || unmatched?.memberId
 const amount=x.manual?.amountMinor || transaction?.unallocatedMinor || unmatched?.amountMinor || 0
 const paidAt=x.manual?.paidAt || transaction?.confirmedAt || unmatched?.confirmedAt
 if(!memberId||!amount||!paidAt||!x.world||!x.org)return []
 if(!x.manual&&!['Amount Mismatch','Unallocated Payment'].includes(c.type))return []
 return x.world.groups.flatMap(g=>{
  if(g.organizationId!==x.org!.id)return []
  // Existing instruction ownership is retained; imported unmatched confirmations can
  // only be linked to an exact Member identity in this Organization.
  if((transaction||x.manual)&&g.id!==x.group?.id)return []
  return g.cycles.flatMap(cycle=>{
   if(cycle.status!=='activated'||!cycle.active||cycle.active.endedAt)return []
   if((transaction&&cycle.id!==transaction.cycleId)||(x.manual&&cycle.id!==x.manual.cycleId))return []
   if(g.lifecycle?.recoveries.some(r=>r.cycleId===cycle.id&&r.memberId===memberId&&r.status!=='resolved'))return []
   if(g.lifecycle?.exits.some(e=>e.cycleId===cycle.id&&e.memberId===memberId&&e.status==='approved'))return []
   return cycle.active.obligations.flatMap(o=>{
    const round=cycle.active!.rounds.find(r=>r.id===o.roundId)
    if(o.memberId!==memberId||o.groupId!==g.id||o.cycleId!==cycle.id||!round||Date.parse(paidAt)<Date.parse(round.schedule.opensAt))return []
    if(x.manual&&o.roundId!==x.manual.roundId)return []
    const operational=effectiveCycle(g,cycle,round)
    if(!(operational.snapshot?.positions||operational.positions).some(p=>p.holders.some(h=>h.memberId===memberId)))return []
    // 5B accepts required principal only; optional/advance disposition remains controlled.
    const available=balances(o).outstanding
    const partial=['allowed','demo-only'].includes(cycle.active!.contributionPolicy?.partial||'')
    if(amount>available||amount<=0||(!partial&&amount!==available))return []
    if(transaction){const a=g.payments?.attempts.find(a=>a.id===transaction.attemptId);if(!a||a.intent==='advance'||a.targets.some(t=>t.kind==='optional')||!a.targets.some(t=>t.obligationId===o.id))return []}
    return [{id:o.id,label:`${g.name} · Cycle ${cycle.number} · Round ${round.number} · ${memberId}`,groupId:g.id,cycleId:cycle.id,obligationId:o.id,amountMinor:amount}]
   })
  })
 })
}
export function applyAllocation(s:OperationsSources,c:OperationsCase,targetId:string,at:string,decisionId:string){
 const selected=allocationChoices(s,c).find(t=>t.id===targetId)
 if(!selected)throw Error('The selected allocation is no longer eligible. Partial, Member, tenant, lifecycle and obligation rules must all hold.')
 const x=locateReview(s,c),g=x.world!.groups.find(g=>g.id===selected.groupId)!,cycle=g.cycles.find(c=>c.id===selected.cycleId)!,o=cycle.active!.obligations.find(o=>o.id===targetId)!,round=cycle.active!.rounds.find(r=>r.id===o.roundId)!
 const p=g.payments??=emptyPayments()
 let transaction=x.group?.payments?.transactions.find(t=>t.id===x.f?.transactionId)
 const unmatched=x.finance?.unmatchedPayments.find(t=>t.providerReference===x.f?.sourceReference)
 const manual=x.manual
 if(!manual&&!transaction){
  if(!unmatched)throw Error('Original provider confirmation is unavailable.')
  const id=unmatched.provider+':'+unmatched.providerReference
  if(x.world!.groups.some(g=>g.payments?.transactions.some(t=>t.id===id)))throw Error('This provider payment is already linked.')
  transaction={...unmatched,id,groupId:g.id,cycleId:cycle.id,roundId:o.roundId,receivedAt:at,status:'confirmed',allocationStatus:'unallocated',allocatedMinor:0,unallocatedMinor:unmatched.amountMinor}
  p.transactions.push(transaction)
  // Keep the original unmatched provider event as immutable audit evidence. The
  // linked transaction and resolved handoff prevent replay from allocating twice.
 }
 const reference=manual?.id || transaction!.id,paidAt=manual?.paidAt || transaction!.confirmedAt
 let remaining=selected.amountMinor
 for(const component of o.components){const amount=Math.min(remaining,component.requiredMinor-component.requiredSatisfiedMinor);if(!amount)continue
  p.allocations.push({id:decisionId+'-'+p.allocations.length,transactionId:reference,organizationId:g.organizationId,groupId:g.id,cycleId:cycle.id,roundId:o.roundId,memberId:o.memberId,obligationId:o.id,componentId:component.id,kind:'required',amountMinor:amount,confirmedAt:paidAt,timeliness:Date.parse(paidAt)<=Date.parse(round.schedule.dueAt)?'on-time':Date.parse(paidAt)<Date.parse(round.schedule.lateAt)?'grace':'late',...(manual?{source:'organization-confirmed-manual' as const}:{})})
  component.requiredSatisfiedMinor+=amount;remaining-=amount
 }
 if(remaining)throw Error('Allocation was not fully accounted for.')
 if(manual){manual.status='allocated';manual.allocatedMinor=selected.amountMinor}else{transaction!.allocatedMinor+=selected.amountMinor;transaction!.unallocatedMinor-=selected.amountMinor;transaction!.allocationStatus=transaction!.unallocatedMinor?'partially-allocated':'allocated'}
 cycle.financial.allocations=p.allocations.filter(a=>a.cycleId===cycle.id).length
 cycle.financial.payments=p.transactions.filter(t=>t.cycleId===cycle.id).length+(g.manualContributions?.filter(m=>m.cycleId===cycle.id&&m.status==='allocated').length||0)
 if(x.f){x.f.status='resolved';x.f.groupId=g.id;x.f.cycleId=cycle.id;x.f.roundId=o.roundId;x.f.obligationId=o.id;x.f.transactionId=reference}
 return selected
}
