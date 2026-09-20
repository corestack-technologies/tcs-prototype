import test from 'node:test'
import { emptyPayments } from '../src/payments/model.ts'
import assert from 'node:assert/strict'
import { generateReport } from '../src/reports/service.ts'
import { allocateRecovery } from '../src/reports/recoveryAllocation.ts'
import { reportCatalogue } from '../src/reports/catalogue.ts'
import { seedPersona } from '../src/clients/seeds.ts'
import { seedOrganization, } from '../src/organizations/seeds.ts'
import { paymentDemo, PAYMENT_DEMOS } from '../src/payments/seeds.ts'
import { payoutDemo, PAYOUT_DEMOS } from '../src/payouts/seeds.ts'
import { lifecycleDemo, LIFECYCLE_DEMOS } from '../src/lifecycle/seeds.ts'
import { reconciliationDemo, RECONCILIATION_DEMOS } from '../src/reconciliation/seeds.ts'
import { balances } from '../src/rounds/model.ts'
import { recoveryBalances } from '../src/lifecycle/recovery.ts'
import { finalRecognition } from '../src/reconciliation/evidencedRevenue.ts'
import { operationsDemoWorld } from '../src/operations/seeds.ts'
import { projectCases } from '../src/operations/sources.ts'
import { previewDecision, executeDecision } from '../src/operations/decisions.ts'
import { seedSession } from '../src/access/seeds.ts'
const org = seedOrganization(seedPersona('verified'), 'active')
const member = {kind:'member',memberId:org.ownerMemberId}, owner = {kind:'organization',memberId:org.ownerMemberId,organizationId:org.id}
const at = '2100-01-01T00:00:00.000Z'
const directory = o => ({id:o.id,name:o.form.name,ownerMemberId:o.ownerMemberId,workspace:true})
const sources = (groups,finance) => ({organizations:[directory(org)],worlds:[{groups,finance}]})
const report = (g,id,filters={},finance) => generateReport(sources([g],finance),id.startsWith('member-')?member:owner,id,filters,at)
const total = (r,k) => r.summaries.find(s=>s.key===k)?.value
function assertTotals(r) { assert.equal(new Set(r.rows.map(row=>row.id)).size,r.rows.length,'No duplicate report rows'); for(const s of r.summaries) assert.equal(s.value,r.rows.reduce((n,r)=>n+Number(r.values[s.key]||0),0),s.label) }

function recoveryAgingFixture(recoveredMinor = 15000) {
 const g=paymentDemo(org,'aging-allocation','Awaiting contribution'),c=g.cycles[0]
 const templateRound=c.active.rounds[0],templateObligation=c.active.obligations.find(o=>o.memberId===member.memberId)
 c.active.referenceAt='2099-04-15T00:00:00.000Z'
 c.active.rounds=[1,2,3,4,5].map(n=>({...structuredClone(templateRound),id:'aging-round-'+n,number:n,position:n,schedule:{...templateRound.schedule,opensAt:`2099-0${n}-01T00:00:00.000Z`,dueAt:`2099-0${n}-10T00:00:00.000Z`,lateAt:`2099-0${n}-12T00:00:00.000Z`}}))
 c.active.generatedRoundIds=c.active.rounds.slice(0,4).map(r=>r.id)
 c.active.obligations=[1,2,3,4].map(n=>({...structuredClone(templateObligation),id:'aging-obligation-'+n,roundId:'aging-round-'+n,components:[{id:'aging-component-'+n,position:n,fraction:1,requiredMinor:n===4?0:n*10000,requiredSatisfiedMinor:0,optionalMinor:n===4?10000:0,optionalSatisfiedMinor:0}]}))
 g.payments ??= emptyPayments()
 g.payments.optionalDecisions=[{cycleId:c.id,roundId:'aging-round-4',memberId:member.memberId,choice:'skip',at:c.active.referenceAt}]
 g.lifecycle={exits:[],replacements:[],recoveries:[{id:'aging-case',cycleId:c.id,memberId:member.memberId,principalMinor:60000,penaltyMinor:7000,recoveredMinor,status:'open',restricted:true,openedAt:'2099-03-15T00:00:00.000Z',reviewStatus:'pending',reason:'Post-payout default',penaltyObligations:[{id:'penalty-later',obligationId:'aging-obligation-2',dueAt:'2099-02-11T00:00:00.000Z',amountMinor:4000},{id:'penalty-oldest',obligationId:'aging-obligation-1',dueAt:'2099-01-11T00:00:00.000Z',amountMinor:3000}]}],amendments:[],forceCloseRequests:[],payoutFacts:[],disputes:[]}
 return g
}
test('Recovery spans overdue Rounds oldest due first and preserves partial original age',()=>{
 const g=recoveryAgingFixture(),c=g.cycles[0],before=structuredClone(g),r=report(g,'organization-obligations'),principal=r.rows.filter(r=>r.source.kind==='obligation').sort((a,b)=>a.date.localeCompare(b.date))
 assert.deepEqual(principal.map(r=>r.values.recoveryApplied),[10000,5000,0])
 assert.deepEqual(principal.map(r=>r.values.outstanding),[0,15000,30000])
 assert.equal(principal[0].values.status,'CLEARED BY RECOVERY');assert.equal(principal[1].values.status,'PARTIALLY RECOVERED')
 assert.equal(principal[1].date,'2099-02-10T00:00:00.000Z');assert.equal(principal[1].values.days,Math.floor((Date.parse(c.active.referenceAt)-Date.parse(principal[1].date))/86400000))
 assert.equal(total(r,'outstanding'),45000);assert.equal(total(r,'penaltyOutstanding'),7000);assertTotals(r);assert.deepEqual(g,before)
})
test('all principal precedes penalties; penalties are allocated by oldest due, not input order',()=>{
 const g=recoveryAgingFixture(65000),a=allocateRecovery(g,g.cycles[0])
 assert.deepEqual(a.allocations.filter(a=>a.kind==='principal').map(a=>a.appliedMinor),[10000,20000,30000])
 assert.deepEqual(a.allocations.filter(a=>a.kind==='penalty').map(a=>[a.sourceId,a.appliedMinor,a.outstandingMinor]),[['penalty-oldest',3000,0],['penalty-later',2000,2000]])
 const r=report(g,'member-obligations');assert.equal(total(r,'outstanding'),0);assert.equal(total(r,'penaltyOutstanding'),2000);assert.equal(total(r,'penaltyRecoveryApplied'),5000)
})
test('full Recovery retains cleared history and never auto-resolves case or restrictions',()=>{
 const g=recoveryAgingFixture(67000),r=report(g,'organization-obligations')
 const allocations=allocateRecovery(g,g.cycles[0]).allocations
 assert.equal(new Set(allocations.map(a=>`${a.caseId}:${a.kind}:${a.sourceId}`)).size,allocations.length)
 assert.deepEqual(allocateRecovery(g,g.cycles[0]).allocations,allocations)
 assert.equal(total(r,'outstanding'),0);assert.equal(total(r,'penaltyOutstanding'),0);assert.equal(r.rows.length,5)
 assert.ok(r.rows.every(r=>r.values.status==='CLEARED BY RECOVERY'));assert.equal(g.lifecycle.recoveries[0].status,'open');assert.equal(g.lifecycle.recoveries[0].restricted,true)
})
test('Recovery excludes skipped optional and future ungenerated obligations',()=>{
 const g=recoveryAgingFixture(67000),c=g.cycles[0]
 c.active.obligations.push({...structuredClone(c.active.obligations[0]),id:'not-generated',roundId:'aging-round-5'})
 const a=allocateRecovery(g,c);assert.ok(a.allocations.every(a=>!['aging-obligation-4','not-generated'].includes(a.obligationId)))
 const r=report(g,'member-obligations').rows.find(r=>r.source.id==='aging-obligation-4');assert.equal(r.values.optional,'Skipped');assert.equal(r.values.outstanding,0);assert.equal(r.values.recoveryApplied,0)
})
test('equal due dates break ties by Round order then source ID independently of input order',()=>{
 const g=recoveryAgingFixture(12000),c=g.cycles[0]
 c.active.rounds[1].schedule.dueAt=c.active.rounds[0].schedule.dueAt
 c.active.obligations.reverse();c.active.rounds.reverse()
 let a=allocateRecovery(g,c).allocations.filter(a=>a.kind==='principal');assert.equal(a[0].sourceId,'aging-obligation-1');assert.equal(a[1].appliedMinor,2000)
 const second=c.active.obligations.find(o=>o.id==='aging-obligation-2');second.roundId='aging-round-1'
 a=allocateRecovery(g,c).allocations.filter(a=>a.kind==='principal');assert.equal(a[0].sourceId,'aging-obligation-1');assert.equal(a[1].sourceId,'aging-obligation-2')
})
test('excess Recovery remains a payment exception without negative balances or invented transactions',()=>{
 const g=recoveryAgingFixture(70000),before=structuredClone(g),a=allocateRecovery(g,g.cycles[0])
 assert.equal(a.cases[0].issue,'Recovery Payment Exception');assert.equal(a.cases[0].excessMinor,3000)
 assert.equal(a.allocations.reduce((n,a)=>n+a.appliedMinor,0),67000);assert.ok(a.allocations.every(a=>a.outstandingMinor===0))
 const r=report(g,'organization-obligations');assert.ok(r.notices.some(n=>n.includes('Recovery Payment Exception')));assertTotals(r);assert.deepEqual(g,before)
})
test('Recovery cannot cross Member, Organization, Group, Cycle or case boundaries',()=>{
 const g=recoveryAgingFixture(),c=g.cycles[0]
 for(const patch of [{memberId:'other'},{groupId:'other'},{cycleId:'other'}])c.active.obligations.push({...structuredClone(c.active.obligations[0]),id:JSON.stringify(patch),...patch})
 assert.equal(allocateRecovery(g,c).allocations.filter(a=>a.kind==='principal').length,3)
 const other=structuredClone(g);other.id='other-group';other.organizationId='other-org';other.lifecycle.recoveries=[]
 assert.equal(allocateRecovery(other,other.cycles[0]).allocations.length,0);assert.throws(()=>allocateRecovery(other,c))
 const second=structuredClone(c);second.id='other-cycle';g.cycles.push(second);assert.equal(allocateRecovery(g,second).allocations.length,0)
 const r=g.lifecycle.recoveries[0];r.obligationIds=['aging-obligation-1'];r.principalMinor=10000;r.penaltyMinor=0;r.penaltyObligations=[];r.recoveredMinor=15000
 g.lifecycle.recoveries.push({...structuredClone(r),id:'second-case',obligationIds:['aging-obligation-2','aging-obligation-3'],principalMinor:50000,recoveredMinor:1000})
 const a=allocateRecovery(g,c);assert.equal(a.cases.find(x=>x.caseId===r.id).excessMinor,5000);assert.equal(a.allocations.filter(a=>a.caseId==='second-case').reduce((n,a)=>n+a.appliedMinor,0),1000)
})
test('overlapping or invalid case links are explicit exceptions, never double allocation',()=>{
 const g=recoveryAgingFixture();g.lifecycle.recoveries.push({...structuredClone(g.lifecycle.recoveries[0]),id:'overlap'})
 const a=allocateRecovery(g,g.cycles[0]);assert.equal(a.allocations.length,0);assert.ok(a.cases.every(c=>c.issue.includes('Overlapping')))
 g.lifecycle.recoveries.pop();g.lifecycle.recoveries[0].obligationIds=['foreign-obligation'];assert.ok(allocateRecovery(g,g.cycles[0]).cases[0].issue.includes('outside'))
})
test('filtered aging totals reconcile to rows without reallocating Recovery after filtering',()=>{
 const g=recoveryAgingFixture(15000),all=report(g,'organization-obligations'),filtered=report(g,'organization-obligations',{roundId:'aging-round-2'})
 assert.equal(filtered.rows.find(r=>r.source.kind==='obligation').values.recoveryApplied,5000);assert.equal(total(filtered,'outstanding'),15000);assertTotals(filtered)
 assert.equal(total(report(g,'organization-cycles'),'outstanding'),total(all,'outstanding'))
 assert.equal(total(report(g,'organization-rounds'),'outstanding'),total(all,'outstanding'))
})
test('legacy aggregate penalty stays on its case without fabricating a Round charge or due date',()=>{
 const g=recoveryAgingFixture(62000);delete g.lifecycle.recoveries[0].penaltyObligations
 const r=report(g,'organization-obligations'),penalty=r.rows.find(r=>r.source.kind==='recovery-penalty')
 assert.equal(penalty.date,'');assert.equal(penalty.roundId,'');assert.equal(penalty.values.penaltyOutstanding,5000);assert.equal(penalty.values.penaltyRecoveryApplied,2000);assert.equal(penalty.values.days,null)
})
test('ordinary satisfied principal is preserved and only its remaining balance receives Recovery',()=>{
 const g=recoveryAgingFixture(15000),c=g.cycles[0];c.active.obligations[0].components[0].requiredSatisfiedMinor=5000;g.lifecycle.recoveries[0].principalMinor=55000
 const r=report(g,'organization-obligations'),first=r.rows.find(r=>r.source.id==='aging-obligation-1')
 assert.equal(first.values.expected,10000);assert.equal(first.values.satisfied,5000);assert.equal(first.values.recoveryApplied,5000);assert.equal(first.values.outstanding,0)
 assert.equal(r.rows.find(r=>r.source.id==='aging-obligation-2').values.recoveryApplied,10000)
})
test('valid penalty waiver remains separate from payment and excess does not consume waived debt',()=>{
 const g=recoveryAgingFixture(66000),r=g.lifecycle.recoveries[0]
 r.penaltyWaivers=[{id:'waiver',amountMinor:2000,at:'2099-04-01T00:00:00.000Z',authority:'approved-policy',reason:'Approved documented penalty waiver',evidence:['waiver-evidence']}]
 const a=allocateRecovery(g,g.cycles[0]);assert.equal(a.cases[0].excessMinor,1000)
 assert.equal(a.allocations.filter(a=>a.kind==='penalty').reduce((n,a)=>n+a.appliedMinor,0),5000)
 assert.equal(a.allocations.filter(a=>a.kind==='penalty').reduce((n,a)=>n+a.waivedMinor,0),2000)
 assert.ok(a.allocations.every(a=>a.outstandingMinor===0))
})

test('catalogue has distinct Member and Owner scopes and export metadata',()=>{
 assert.equal(reportCatalogue.filter(d=>d.audience==='member').length,4)
 assert.equal(reportCatalogue.filter(d=>d.audience==='organization').length,10)
 const r=report(paymentDemo(org,'meta','Awaiting contribution'),'member-obligations')
 assert.equal(r.generatedAt,at);assert.notEqual(r.references[0],at);assert.equal(r.export.moneyUnit,'minor');assert.deepEqual(r.export.columns,r.definition.columns)
})
test('service denies anonymous, internal, audience mismatch, foreign owner and tenant filters',()=>{
 const s=sources([paymentDemo(org,'isolation','Exact contribution / settlement pending')])
 for(const actor of [null,{kind:'tcs-internal',memberId:member.memberId},{...owner,memberId:'intruder'},{...owner,organizationId:'foreign'},member]) assert.throws(()=>generateReport(s,actor,'organization-cycles'))
 assert.throws(()=>generateReport(s,owner,'member-obligations'))
 assert.throws(()=>generateReport(s,owner,'organization-collections',{organizationId:'foreign'}))
 assert.throws(()=>generateReport(s,member,'member-contributions',{memberId:'someone-else'}))
 assert.throws(()=>generateReport(s,owner,'internal-audit'))
 s.organizations[0].workspace=false;assert.throws(()=>generateReport(s,owner,'organization-cycles'))
})
test('Member sees own records across Organizations; Owner sees only owned Organization; options do not leak',()=>{
 const other=structuredClone(org);other.id='org-foreign';other.ownerMemberId='foreign-owner';other.form.name='Foreign private organization'
 const a=paymentDemo(org,'tenant-a','Required + optional included'),b=paymentDemo(other,'tenant-b','Required + optional included')
 const s={organizations:[directory(org),directory(other)],worlds:[{groups:[a]},{groups:[b]}]}
 for(const d of reportCatalogue){const r=generateReport(s,d.audience==='member'?member:owner,d.id,{},at);for(const row of r.rows)assert.equal(d.audience==='member'?row.memberId:row.organizationId,d.audience==='member'?member.memberId:org.id);assert.ok(!JSON.stringify(r).includes('Foreign private organization'))}
 const participant=b.cycles[0].participants.find(p=>p.id!==other.ownerMemberId)
 const cross=generateReport(s,{kind:'member',memberId:participant.id},'member-participation',{},at)
 assert.ok(cross.rows.length>=1);assert.ok(cross.rows.every(r=>r.memberId===participant.id))
})
for (const scenario of PAYMENT_DEMOS) test('shared payment scenario: '+scenario,()=>{
 const g=paymentDemo(org,'pay-'+scenario,scenario),before=structuredClone(g)
 for(const id of ['member-contributions','member-obligations','organization-collections','organization-payments','organization-rounds','organization-obligations'])assertTotals(report(g,id))
 const r=report(g,'organization-collections'),bs=g.cycles.flatMap(c=>c.active?.obligations||[]).map(balances)
 assert.equal(total(r,'expected'),bs.reduce((n,b)=>n+b.required,0));assert.equal(total(r,'outstanding'),bs.reduce((n,b)=>n+b.outstanding,0));assert.deepEqual(g,before)
 if(scenario==='Half Position contribution')assert.ok(r.rows.some(r=>String(r.values.position).includes('½')))
 if(scenario==='Multiple Positions')assert.ok(r.rows.some(r=>String(r.values.position).includes(',')))
 if(['Underpayment exception','Overpayment exception'].includes(scenario))assert.ok(report(g,'organization-payments').rows.some(r=>r.values.status==='Payment Exception'))
 if(scenario==='Advance held until opening'){const p=report(g,'member-contributions');assert.ok(p.rows.some(r=>r.values.source==='Advance reservation'&&r.values.unallocated>0));assert.ok(!g.cycles[0].active.obligations.some(o=>o.roundId===p.rows.find(r=>r.values.source==='Advance reservation').roundId))}
 if(scenario==='Optional contribution skipped / ready'){const skipped=r.rows.filter(r=>r.values.optional==='Skipped');assert.ok(skipped.length);assert.ok(skipped.every(r=>r.values.outstanding===0&&r.values.stage==='No required debt'))}
})
for(const scenario of PAYOUT_DEMOS)test('shared payout scenario: '+scenario,()=>{
 const g=payoutDemo(org,'payout-'+scenario,scenario),r=report(g,'organization-payouts');assertTotals(r)
 for(const p of g.payouts.records){const row=r.rows.find(r=>r.source.id===p.id);assert.ok(row);assert.equal(row.values.transferred,p.installments.reduce((n,i)=>n+i.amountMinor,0));if(p.disputes.length)assert.equal(row.values.evidenced,0)}
 if(scenario==='Transfer awaiting confirmation'){const row=r.rows.find(r=>r.source.kind==='payout');assert.equal(row.values.evidenced,0);assert.equal(row.values.status,'Awaiting Confirmation');assert.ok(row.detail['Awaiting confirmation (minor)']>0)}
 if(scenario==='Partial payout'){const row=r.rows.find(r=>r.source.kind==='payout');assert.ok(row.values.outstanding>0);assert.ok(row.values.transferred<row.values.net)}
 if(scenario==='Confirmation window elapsed'){const row=r.rows.find(r=>r.source.kind==='payout');assert.equal(row.values.evidenced,0);assert.ok(row.detail['Completed by window (minor)']>0)}
})
for(const scenario of LIFECYCLE_DEMOS)test('shared lifecycle scenario: '+scenario,()=>{
 const g=lifecycleDemo(org,'life-'+scenario,scenario),before=structuredClone(g)
 for(const id of ['organization-cycles','organization-recovery','organization-exits','member-participation'])assertTotals(report(g,id))
 assert.equal(report(g,'organization-cycles').rows.length,g.cycles.length)
 for(const r of g.lifecycle.recoveries){const row=report(g,'organization-recovery').rows.find(x=>x.source.id===r.id),b=recoveryBalances(r);assert.equal(row.values.outstanding,b.outstanding);assert.equal(row.values.recovered,r.recoveredMinor);assert.equal(row.detail['Principal recovered (minor)'],b.principalRecovered)}
 assert.deepEqual(g,before)
})
for(const scenario of RECONCILIATION_DEMOS)test('shared reconciliation scenario: '+scenario,()=>{
 const {group:g,state}=reconciliationDemo(org,'recon-'+scenario,scenario),before=structuredClone({g,state})
 for(const id of ['organization-payments','organization-collections','organization-fees','organization-revenue'])assertTotals(report(g,id,{},state))
 const revenue=report(g,'organization-revenue',{},state);assert.equal(total(revenue,'due'),state.receivables.reduce((n,r)=>n+r.amountMinor,0))
 if(scenario==='Manual review required'){const manual=report(g,'organization-payments',{},state).rows.find(r=>r.source.kind==='manual-payment');assert.equal(manual.values.allocated,0);assert.equal(manual.values.status,'review-required')}
 if(scenario==='TCS share awaiting confirmation')assert.equal(total(revenue,'confirmed'),0)
 if(scenario==='TCS share settled')assert.equal(total(revenue,'outstanding'),0)
 assert.deepEqual({g,state},before)
})
test('principal-first recovery and excess exception retain original aggregate',()=>{
 const g=lifecycleDemo(org,'recover','Post-payout default / recovery'),r=g.lifecycle.recoveries[0];r.principalMinor=20000000;r.penaltyMinor=3000000;r.recoveredMinor=15000000
 let row=report(g,'organization-recovery').rows[0];assert.equal(row.values.principalOutstanding,5000000);assert.equal(row.values.penaltyOutstanding,3000000)
 r.recoveredMinor+=7000000;row=report(g,'organization-recovery').rows[0];assert.equal(row.values.principalOutstanding,0);assert.equal(row.values.penaltyOutstanding,1000000)
 r.recoveredMinor=24000000;row=report(g,'organization-recovery').rows[0];assert.equal(row.values.status,'Financial exception');assert.equal(row.detail['Excess recovery (minor)'],1000000)
})
test('aggregate recovery reduces aging without changing source obligations',()=>{
 const g=lifecycleDemo(org,'aggregate','Post-payout default / recovery'),r=g.lifecycle.recoveries[0]
 r.recoveredMinor=Math.floor(r.principalMinor/2)
 const before=structuredClone(g),after=report(g,'organization-obligations',{memberId:r.memberId})
 assert.equal(total(after,'recoveryApplied'),r.recoveredMinor)
 assert.equal(total(after,'outstanding'),r.principalMinor-r.recoveredMinor)
 assert.deepEqual(g,before)
})
test('Member across two participating Organizations is scoped by Member, not selected tenant',()=>{
 const second=structuredClone(org);second.id='second-owned-org';second.form.name='Second Organization'
 const a=paymentDemo(org,'cross-a','Exact contribution / settlement pending'),b=paymentDemo(second,'cross-b','Exact contribution / settlement pending')
 const s={organizations:[directory(org),directory(second)],worlds:[{groups:[a]},{groups:[b]}]}
 const result=generateReport(s,member,'member-contributions',{},at)
 assert.equal(new Set(result.rows.map(r=>r.organizationId)).size,2)
 assert.ok(result.rows.every(r=>r.memberId===member.memberId));assertTotals(result)
 assert.ok(generateReport(s,owner,'organization-payments',{},at).rows.every(r=>r.organizationId===org.id))
})
test('manual TCS review is explicit and source audit remains private',()=>{
 const {group:g,state}=reconciliationDemo(org,'manual-reviewed','Manual direct bank receipt'),m=g.manualContributions[0]
 m.review={state:'SECRET',caseStatus:'Resolved',decisions:[{action:'accept-manual',comments:'SECRET-NOTE'}]}
 const r=report(g,'organization-payments',{},state).rows.find(r=>r.source.id===m.id)
 assert.equal(r.values.source,'Manual / Organization Confirmed / TCS Reviewed');assert.ok(!JSON.stringify(r).includes('SECRET'))
})
for(const action of ['member-upheld','partial-receipt','organization-accepted'])test('final evidenced payout '+action+' preserves postings and exposes adjustment',()=>{
 const supervisor=seedSession('ops-supervisor'),reviewer=seedSession('finance-reviewer')
 let s={clients:[seedPersona('verified')],organizations:[org],worlds:[operationsDemoWorld(org)]}
 const c=projectCases(s,supervisor).find(c=>c.type==='Payout Dispute')
 const input={action,amountMinor:10000,reason:'Evidenced bank receipt reviewed independently',evidence:['BANK-REPORT-EVIDENCE'],evidenceConfirmed:true,party:'Member'}
 s=executeDecision(s,previewDecision(s,c.id,input,reviewer,at),reviewer,at).sources
 const later='2100-01-10T00:00:00.000Z',finalInput={...input,action:'finalize-dispute'}
 s=executeDecision(s,previewDecision(s,c.id,finalInput,reviewer,later),reviewer,later).sources
 const g=s.worlds[0].groups.find(g=>g.id===c.groupId),p=g.payouts.records.find(p=>p.disputes.length),final=finalRecognition(p,p.installments[0].id)
 const out=report(g,'organization-payouts',{},s.worlds[0].finance).rows.find(r=>r.source.id===p.id)
 assert.equal(out.values.evidenced,final.receivedMinor);assert.equal(out.values.outstanding,Math.max(0,p.calculation.netMinor-final.receivedMinor));assert.ok(out.detail['Receipt basis'].includes('Final Operations evidence'));assert.ok(!out.detail['Receipt basis'].includes('member-confirmed'))
 const fee=report(g,'organization-fees',{},s.worlds[0].finance).rows.find(r=>r.source.id===p.installments[0].id)
 assert.equal(fee.values.recognized,final.organizationFeeMinor);assert.equal(fee.values.recordedFee,p.installments[0].feeRecognizedMinor)
 if(action!=='organization-accepted')assert.equal(fee.values.status,'FEE / REVENUE SHARE ADJUSTMENT REQUIRED')
})
test('filters, source dates, sorting, empty state and totals use identical rows',()=>{
 const g=paymentDemo(org,'filters','Multiple Positions'),all=report(g,'organization-collections'),first=all.rows[0]
 for(const filters of [{memberId:first.memberId},{roundId:first.roundId},{groupId:g.id},{cycleId:first.cycleId},{position:first.values.position},{frequency:first.values.frequency},{status:first.values.status},{search:first.values.member},{from:first.date.slice(0,10),to:first.date.slice(0,10)}]){const r=report(g,'organization-collections',filters);assert.ok(r.rows.length);assertTotals(r)}
 assert.equal(report(g,'organization-collections',{search:'cannot-match-report'}).rows.length,0)
 assert.throws(()=>report(g,'organization-collections',{from:'2100-12-01',to:'2100-01-01'}))
 const r=report(g,'organization-collections',{sort:'outstanding'});assert.ok(r.rows.every((row,i)=>!i||r.rows[i-1].values.outstanding>=row.values.outstanding))
})
test('no bank data, internal notes or reviewer identity appears in report projections',()=>{
 const g=payoutDemo(org,'privacy','Member confirmed'),p=g.payouts.records[0];p.review={state:'SECRET-INTERNAL-NOTE',decisions:[],caseStatus:'Open'};p.installments[0].notes='SECRET-TRANSFER-NOTE';p.installments[0].bank.accountNumber='SECRET-BANK';p.installments[0].actorId='SECRET-ACTOR'
 for(const id of ['member-payouts','organization-payouts','organization-fees','organization-cycles'])assert.ok(!JSON.stringify(report(g,id)).includes('SECRET-'))
})
test('cancelled historical Cycle remains after adding later Cycle; reports do not use currentCycle only',()=>{
 const g=paymentDemo(org,'history','Exact contribution / settlement pending'),old=g.cycles[0],next=structuredClone(old);old.status='cancelled';next.id+='-next';next.number=2;next.status='draft';delete next.active;delete next.snapshot;g.cycles.push(next);g.currentCycleId=next.id
 const r=report(g,'organization-cycles');assert.equal(r.rows.length,2);assert.ok(r.rows.some(r=>r.values.status==='cancelled'));assert.ok(report(g,'member-contributions').rows.length)
})
