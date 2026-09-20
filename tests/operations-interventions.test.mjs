import { seedSession } from '../src/access/seeds.ts'
﻿import test from 'node:test'
import assert from 'node:assert/strict'
import {seedPersona,demoPersonas} from '../src/clients/seeds.ts'
import {seedOrganization} from '../src/organizations/seeds.ts'
import {operationsDemoWorld} from '../src/operations/seeds.ts'
import {projectCases} from '../src/operations/sources.ts'
import {previewDecision,executeDecision} from '../src/operations/decisions.ts'
import {payoutTotals} from '../src/payouts/math.ts'
import {evaluatePayouts,payoutClearance} from '../src/payouts/service.ts'
import {reconcile} from '../src/reconciliation/service.ts'
import {resolveRecovery} from '../src/lifecycle/continuation.ts'
import {recoveryRestriction} from '../src/operations/restrictions.ts'
import {canApply,canStartNewActivity} from '../src/organizations/model.ts'
const finance=seedSession('finance-reviewer'),supervisor=seedSession('ops-supervisor'),at='2100-01-01T00:00:00.000Z',later='2100-01-10T00:00:00.000Z'
export function setup(){const org=seedOrganization(seedPersona('verified'),'active');return {clients:demoPersonas.map(p=>seedPersona(p.id)),organizations:[org],worlds:[operationsDemoWorld(org)]}}
const row=(s,type='Payout Dispute')=>projectCases(s,supervisor).find(c=>c.type===type)
const payout=s=>s.worlds[0].groups.flatMap(g=>g.payouts?.records||[]).find(p=>p.disputes.length)
const input=action=>({action,reason:'Evidence inspected and source facts established',evidence:['BANK-5C-EVIDENCE'],evidenceConfirmed:true,party:'Member'})
function decide(s,action,patch={},actor=finance,time=at,c=row(s)){const p=previewDecision(s,c.id,{...input(action),...patch},actor,time);return executeDecision(s,p,actor,time).sources}
for(const action of ['member-upheld','organization-accepted','partial-receipt'])test(action+' preserves original transfer and records evidenced receipt',()=>{
 const s=setup(),original=structuredClone(payout(s)),next=decide(s,action,{amountMinor:10000}),p=payout(next)
 assert.deepEqual(p.installments,original.installments);assert.deepEqual(payout(s),original)
 assert.equal(p.disputes[0].process.stage,'appeal-available');assert.equal(p.disputes[0].process.resolutions.length,1)
 assert.equal(payoutTotals(p).received,action==='member-upheld'?0:action==='organization-accepted'?original.installments[0].amountMinor:10000)
 assert.notEqual(p.status,'completed-member-confirmed');assert.equal(p.installments[0].confirmedBy,undefined)
 assert.deepEqual(next.worlds[0].finance.receivables,s.worlds[0].finance.receivables)
 assert.throws(()=>decide(next,action,{amountMinor:10000}))
})
test('one appeal uses a different reviewer and preserves original audit',()=>{
 let s=decide(setup(),'member-upheld');const original=structuredClone(payout(s).review.decisions[0])
 s=decide(s,'submit-appeal');assert.throws(()=>decide(s,'submit-appeal'));assert.throws(()=>decide(s,'organization-accepted'))
 s=decide(s,'organization-accepted',{},supervisor)
 const p=payout(s);assert.equal(p.disputes[0].process.stage,'final');assert.equal(p.disputes[0].process.appeal.reviewerId,'ops-supervisor');assert.equal(p.status,'completed-operations-evidence');assert.deepEqual(p.review.decisions[0],original)
 assert.throws(()=>decide(s,'submit-appeal'));assert.throws(()=>decide(s,'exceptional-reopen'))
 s=decide(s,'exceptional-reopen',{},supervisor);assert.equal(payout(s).disputes[0].process.reopenings.length,1)
 s=decide(s,'partial-receipt',{amountMinor:10000},supervisor);assert.equal(payout(s).status,'partially-paid');assert.equal(payout(s).disputes[0].process.resolutions.length,3);assert.throws(()=>decide(s,'submit-appeal'))
})
test('evidence windows retain requests, missed deadline, responses and immutable decisions',()=>{
 let s=decide(setup(),'request-information',{party:'Organization',evidenceHours:24})
 assert.throws(()=>decide(s,'organization-accepted'))
 const request=payout(s).disputes[0].process.requests[0]
 s=decide(s,'record-response',{party:'Organization',requestId:request.id},finance,later)
 assert.ok(payout(s).disputes[0].process.requests[0].missedAt)
 s=decide(s,'organization-accepted',{},finance,later)
 assert.equal(payout(s).disputes[0].process.requests[0].responses.length,1)
 assert.throws(()=>decide(s,'finalize-dispute',{},finance,later))
 s=decide(s,'finalize-dispute',{},finance,'2100-02-01T00:00:00.000Z');assert.equal(payout(s).disputes[0].status,'resolved')
})
test('financial decisions require evidence, reason and valid partial amount',()=>{for(const patch of [{reason:''},{evidence:[]},{evidenceConfirmed:false},{amountMinor:-1},{amountMinor:0},{amountMinor:1.5}])assert.throws(()=>decide(setup(),'partial-receipt',{amountMinor:10000,...patch}))})
test('final outcome survives payout reevaluation and retains one case',()=>{
 let s=decide(setup(),'organization-accepted');s=decide(s,'finalize-dispute',{},finance,later)
 const g=s.worlds[0].groups.find(g=>g.payouts?.records.some(p=>p.disputes.length)),n=evaluatePayouts(g,later,g.payouts.demoBanks)
 assert.equal(n.payouts.records.find(p=>p.disputes.length).status,'completed-operations-evidence');assert.equal(payoutClearance([n]),0)
 s.worlds[0].groups=s.worlds[0].groups.map(v=>v.id===g.id?n:v);s.worlds[0].finance=reconcile(s.worlds[0].finance,s.worlds[0].groups,s.organizations[0],later)
 assert.equal(row(s).status,'Resolved');const cases=projectCases(s,supervisor);assert.equal(new Set(cases.map(c=>c.id)).size,cases.length)
})
test('recovery preserves original debt and Organization release history',()=>{
 const s=setup(),c=row(s,'Post-Payout Recovery'),g=s.worlds[0].groups.find(g=>g.id===c.groupId),r=g.lifecycle.recoveries[0],org=s.organizations[0]
 assert.throws(()=>resolveRecovery(g,org,r.id,at));const partial=structuredClone(g);partial.lifecycle.recoveries[0].recoveredMinor=10000;assert.throws(()=>resolveRecovery(partial,org,r.id,at));assert.equal(recoveryRestriction(partial,partial.lifecycle.recoveries[0]).reviewStatus,'active')
 const cleared=structuredClone(g);cleared.lifecycle.recoveries[0].recoveredMinor=r.principalMinor+r.penaltyMinor;const completion=cleared.cycles[0].completedAt
 const n=resolveRecovery(cleared,org,r.id,at);assert.equal(n.lifecycle.recoveries[0].restricted,false);assert.equal(n.lifecycle.recoveries[0].principalMinor,r.principalMinor);assert.equal(n.cycles[0].completedAt,completion);assert.equal(n.lifecycle.recoveries[0].restrictions[0].reviewStatus,'released')
})
test('Organization restriction blocks only new activity and cannot release unresolved breach',()=>{
 const s=setup(),c=row(s,'Organization Payout Breach');assert.throws(()=>decide(s,'restrict-organization',{},finance,at,c))
 const next=decide(s,'suspend-organization',{},supervisor,at,c),org=next.organizations[0],r=org.restrictions[0]
 assert.equal(canStartNewActivity(org),false);assert.equal(org.status,s.organizations[0].status);assert.deepEqual(next.worlds[0].groups.map(g=>g.cycles),s.worlds[0].groups.map(g=>g.cycles))
 assert.throws(()=>decide(next,'release-restriction',{targetId:r.id},supervisor,at,projectCases(next,supervisor).find(v=>v.id===c.id)))
})
test('default Member restriction blocks Organization application without clearing financial records',()=>{
 const s=setup(),c=row(s,'Post-Payout Recovery'),next=decide(s,'suspend-member',{},supervisor,at,c),m=next.clients.find(m=>m.id===c.memberId)
 assert.equal(canApply(m),false);assert.equal(m.accountStatus,'active');assert.deepEqual(next.worlds[0].groups.find(g=>g.id===c.groupId).cycles,s.worlds[0].groups.find(g=>g.id===c.groupId).cycles)
})
test('Exit Settlement confirmation is exact, additive and tenant scoped',()=>{
 const s=setup(),c=row(s,'Exit Settlement Breach'),g=s.worlds[0].groups.find(g=>g.id===c.groupId),e=g.lifecycle.exits[0]
 assert.throws(()=>decide(s,'confirm-exit-settlement',{amountMinor:1},finance,at,c))
 const next=decide(s,'confirm-exit-settlement',{amountMinor:e.settlement.dueMinor},finance,at,c),result=next.worlds[0].groups.find(g=>g.id===g.id&&g.id===c.groupId).lifecycle.exits[0]
 assert.equal(result.settlement.status,'resolved');assert.equal(result.settlement.dueMinor,e.settlement.dueMinor);assert.equal(result.settlementConfirmations.length,1);assert.deepEqual(result.positions,e.positions)
})
import {recoveryBalances} from '../src/lifecycle/recovery.ts'
import {reconcileEvidencedPayout,finalRecognition} from '../src/reconciliation/evidencedRevenue.ts'
import {addInterventionDemos} from '../src/operations/interventionSeeds.ts'
import {payoutTransition} from '../src/payouts/service.ts'
import {startAttempt} from '../src/payments/service.ts'
import {roundDemo} from '../src/rounds/seeds.ts'
import {cycleOf,exampleFeeBoundary,readiness} from '../src/groups/model.ts'
import {proportion,percent} from '../src/payouts/math.ts'
test('principal-first allocation preserves aggregate totals and rejects excess or invalid waiver',()=>{
 const base={principalMinor:20000000,penaltyMinor:3000000,recoveredMinor:15000000}
 assert.deepEqual(recoveryBalances(base),{principalRecovered:15000000,penaltyRecovered:0,principalOutstanding:5000000,penaltyOutstanding:3000000,penaltyWaived:0,outstanding:8000000,excessMinor:0,exception:false,cleared:false})
 assert.equal(recoveryBalances({...base,recoveredMinor:22000000}).penaltyOutstanding,1000000)
 assert.equal(recoveryBalances({...base,recoveredMinor:24000000}).excessMinor,1000000)
 assert.equal(recoveryBalances({...base,recoveredMinor:24000000}).cleared,false)
 assert.equal(base.recoveredMinor,15000000)
 const valid={...base,recoveredMinor:20000000,penaltyWaivers:[{id:'w',amountMinor:3000000,at,authority:'Approved external policy review',reason:'Approved penalty-only waiver retained',evidence:['WAIVER-RECORD']}]}
 assert.equal(recoveryBalances(valid).cleared,true)
 assert.equal(recoveryBalances({...valid,recoveredMinor:15000000}).cleared,false)
 assert.equal(recoveryBalances({...valid,penaltyWaivers:[{...valid.penaltyWaivers[0],evidence:[]}]}).cleared,false)
})
for(const action of ['member-upheld','partial-receipt','organization-accepted'])test('final economic recognition '+action+' uses evidenced amount and preserves original postings',()=>{
 const initial=setup(),original=structuredClone(payout(initial)),oldFinance=initial.worlds[0].finance
 let s=decide(initial,action,{amountMinor:10000})
 assert.equal(s.worlds[0].finance.payoutRecognitions,undefined)
 s=decide(s,'finalize-dispute',{},finance,later)
 const p=payout(s),f=s.worlds[0].finance,recognition=f.payoutRecognitions.find(r=>r.payoutId===p.id)
 assert.ok(recognition);assert.equal(recognition.basis,'Final Operations evidence')
 assert.equal(recognition.organizationFeeMinor,proportion(p.calculation.feeMinor,recognition.receivedMinor,p.calculation.netMinor))
 assert.equal(recognition.tcsShareMinor,percent(recognition.organizationFeeMinor,p.policy.tcsSharePercent))
 assert.deepEqual(p.installments,original.installments)
 const newReceivable=f.receivables.find(r=>r.payoutId===p.id)
 if(action==='member-upheld')assert.equal(newReceivable,undefined)
 else {assert.equal(newReceivable.amountMinor,recognition.tcsShareMinor);assert.equal(newReceivable.organizationFeeMinor,recognition.organizationFeeMinor)}
 assert.deepEqual(f.receivables.filter(r=>r.payoutId!==p.id),oldFinance.receivables)
 const snapshot=structuredClone(f);reconcileEvidencedPayout(f,p,s.organizations[0]);assert.deepEqual(f,snapshot)
})
test('existing revenue posting remains byte-for-byte with an auditable difference after changed final evidence',()=>{
 let s=decide(setup(),'organization-accepted');s=decide(s,'finalize-dispute',{},finance,later)
 const original=structuredClone(s.worlds[0].finance.receivables.find(r=>r.payoutId===payout(s).id))
 s=decide(s,'exceptional-reopen',{},supervisor,later);s=decide(s,'partial-receipt',{amountMinor:10000},supervisor,later)
 const f=s.worlds[0].finance,p=payout(s),adjustment=f.cases.find(c=>c.adjustment?.decisionId===p.disputes[0].process.resolutions.at(-1).id)
 assert.deepEqual(f.receivables.find(r=>r.id===original.id),original)
 assert.ok(adjustment);assert.equal(adjustment.adjustment.tcsShareDifferenceMinor,finalRecognition(p,p.installments[0].id).tcsShareMinor-original.amountMinor)
 assert.equal(projectCases(s,supervisor).find(c=>c.source.id===p.id&&c.type==='Fee / Revenue Share Adjustment Required').status,'New')
 assert.ok(!JSON.stringify(adjustment).includes('refund executed'))
})
test('party submissions enforce beneficiary and Organization identities, one appeal and retained response',()=>{
 let s=decide(setup(),'request-information',{party:'Member'}),p=payout(s),g=s.worlds[0].groups.find(g=>g.id===p.groupId),org=s.organizations[0],d=p.disputes[0],request=d.process.requests[0]
 const a={type:'evidence-response',payoutId:p.id,disputeId:d.id,requestId:request.id,statement:'Beneficiary statement and receipt evidence',evidence:['PARTY-EVIDENCE'],party:'Member'}
 assert.throws(()=>payoutTransition(g,org.id,org.ownerMemberId,'foreign-member',a,at,g.payouts.demoBanks))
 const next=payoutTransition(g,org.id,org.ownerMemberId,p.memberId,a,at,g.payouts.demoBanks)
 assert.equal(next.payouts.records.find(v=>v.id===p.id).disputes[0].process.requests[0].responses.length,1)
 assert.equal(d.process.requests[0].responses.length,0)
})
test('suspended new activity does not stop payment of existing obligations',()=>{
 const org=seedOrganization(seedPersona('verified'),'active'),g=roundDemo(org,'5c-existing-payment',exampleFeeBoundary(),'Monthly','Open'),c=cycleOf(g)
 const next=startAttempt(g,org.id,org.form.name,org.ownerMemberId,{cycleId:c.id,roundId:c.active.rounds[0].id,provider:'demo-bank-transfer'},c.active.referenceAt)
 assert.ok(next.payments.attempts.length)
 const restricted={...org,restrictions:[{id:'r',reviewStatus:'active',type:'suspension'}]}
 assert.equal(canStartNewActivity(restricted),false)
 assert.ok(readiness(g,restricted,exampleFeeBoundary()).some(r=>r.id==='organization'&&!r.ok))
})
test('shared intervention demos retain legal boundary and loading twice is idempotent',()=>{
 const initial=setup(),s=addInterventionDemos(initial,initial.organizations[0].id),cases=projectCases(s,supervisor)
 assert.ok(cases.some(c=>c.type==='Legal / Compliance Review'&&c.status==='Awaiting External Action'))
 assert.ok(cases.some(c=>c.type==='Post-Payout Recovery'&&c.status==='Resolved'))
 assert.equal(new Set(cases.map(c=>c.id)).size,cases.length)
 assert.deepEqual(addInterventionDemos(s,s.organizations[0].id),s)
 assert.equal(s.organizations[0].ownerMemberId,initial.organizations[0].ownerMemberId)
})
test('later Organization transfer can settle the retained balance with proportional fee basis',()=>{
 let s=decide(setup(),'member-upheld');s=decide(s,'finalize-dispute',{},finance,later)
 const p=payout(s),g=s.worlds[0].groups.find(g=>g.id===p.groupId),org=s.organizations[0],i=p.instructions.at(-1)
 const next=payoutTransition(g,org.id,org.ownerMemberId,org.ownerMemberId,{type:'record',payoutId:p.id,instructionId:i.id,amountMinor:payoutTotals(p).outstanding,transferredAt:later,reference:'NEW-EXTERNAL-REMEDIAL-TRANSFER',notes:'New external transfer after dispute finalization',partial:false,acknowledged:true},later,g.payouts.demoBanks)
 const added=next.payouts.records.find(v=>v.id===p.id).installments.at(-1)
 assert.equal(added.feeRecognizedMinor,p.calculation.feeMinor);assert.equal(added.tcsShareMinor,percent(p.calculation.feeMinor,p.policy.tcsSharePercent));assert.deepEqual(next.payouts.records.find(v=>v.id===p.id).installments[0],p.installments[0])
})
