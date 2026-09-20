import { balances } from '../rounds/model.ts'
﻿import { paymentDemo } from '../payments/seeds.ts'
import { reconciliationDemo } from '../reconciliation/seeds.ts'
import { recordManual } from '../reconciliation/manual.ts'
import { receivePayment, reconcile } from '../reconciliation/service.ts'
import { emptyReconciliation, demoFinancePolicy } from '../reconciliation/model.ts'
import { cycleOf } from '../groups/model.ts'
import { advanceReference } from '../rounds/service.ts'
import type { Organization } from '../organizations/model.ts'
export function decisionDemoWorld(org:Organization){
 const groups=[],finance=emptyReconciliation(org.id)
 const merge=(s:typeof finance)=>{for(const key of ['settlements','unmatchedPayments','cases','receivables','history','expectations'] as const)(finance[key] as unknown[]).push(...s[key]);finance.referenceAt=[finance.referenceAt,s.referenceAt].filter((v):v is string=>!!v).sort().at(-1)}
 for(const [index,scenario] of (['Unmatched settlement','TCS share payment exception'] as const).entries()){const demo=reconciliationDemo(org,org.id+'-ops-5b-'+index,scenario);groups.push(demo.group);merge(demo.state)}
 let g=paymentDemo(org,org.id+'-ops-5b-manual','Awaiting contribution')
 g=advanceReference(g,cycleOf(g).active!.rounds[1].schedule.opensAt)
 let c=cycleOf(g),at=c.active!.referenceAt
 g=recordManual(g,org,org.ownerMemberId,{...demoFinancePolicy(),manual:'organization-confirmed'},{cycleId:c.id,roundId:c.active!.rounds[1].id,memberId:org.ownerMemberId,amountMinor:balances(c.active!.obligations.find(o=>o.memberId===org.ownerMemberId&&o.roundId===c.active!.rounds[1].id)!).outstanding,paidAt:at,channel:'ordinary-bank-transfer',reference:'OWNER-MANUAL-5B',reason:'Owner made a direct bank payment requiring independent TCS review',evidence:{name:'owner-bank-receipt.pdf',type:'application/pdf',size:100}},at)
 groups.push(g);merge(reconcile(emptyReconciliation(org.id),[g],org,at))
 g=paymentDemo(org,org.id+'-ops-5b-unallocated','Awaiting contribution');c=cycleOf(g);at=c.active!.referenceAt
 const received=receivePayment(emptyReconciliation(org.id),[g],org,{organizationId:org.id,memberId:'c2',provider:'prototype-provider',providerReference:'UNMATCHED-5B-C2',attemptId:'missing-5b-attempt',currency:'NGN',amountMinor:10000000,confirmedAt:at,settlement:'pending'},at)
 groups.push(g);merge(received.state)
 return {groups,finance}
}
