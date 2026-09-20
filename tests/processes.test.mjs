import test from 'node:test'
import assert from 'node:assert/strict'
import { seedSession } from '../src/access/seeds.ts'
import { hasPermission } from '../src/access/authorization.ts'
import { seedPersona } from '../src/clients/seeds.ts'
import { seedOrganization } from '../src/organizations/seeds.ts'
import { roundDemo } from '../src/rounds/seeds.ts'
import { paymentDemo } from '../src/payments/seeds.ts'
import { payoutDemo } from '../src/payouts/seeds.ts'
import { cycleOf,exampleFeeBoundary } from '../src/groups/model.ts'
import { obligationState,balances } from '../src/rounds/model.ts'
import { advanceReference } from '../src/rounds/service.ts'
import { createSettings, previewChange,applyChange } from '../src/settings/service.ts'
import { createProcessState,processState,needsAttention } from '../src/processes/model.ts'
import { previewProcess,executeProcess,readRuns } from '../src/processes/service.ts'
import { diagnostics } from '../src/processes/diagnostics.ts'
import { generateInternalReport,availableInternalReports } from '../src/reports/internalService.ts'
import { exportInternalReport } from '../src/reports/export.ts'
const actual='2026-09-17T12:00:00.000Z',reason='UAT lifecycle evaluation',operator=()=>seedSession('ops-supervisor')
const org=()=>seedOrganization(seedPersona('verified'),'active')
function environment(g){for(const c of g.cycles)if(c.active){c.active.timeSource='ENVIRONMENT';delete c.active.demo}if(g.payouts)delete g.payouts.demo;return g}
function fixture(scenario='Upcoming'){
 const o=org(),g=environment(roundDemo(o,'environment-group',exampleFeeBoundary(),'Monthly',scenario)),settings=createSettings();settings.mode='CONTROLLED';settings.controlledDate='2099-11-21'
 return {sources:{organizations:[o],worlds:[{groups:[g]}],banks:{}},settings,state:createProcessState()}
}
function run(f,retryOf,session=operator(),beforeRecord){const p=previewProcess(session,f.sources,reason,retryOf,f.state,f.settings,actual);return executeProcess(session,f.sources,p,true,{state:f.state,settings:f.settings,now:()=>actual,beforeRecord})}
test('catch-up includes every opened period; same-date rerun is idempotent and new data can process',()=>{
 const f=fixture(),r=run(f),g=f.sources.worlds[0].groups[0],a=cycleOf(g).active
 assert.equal(r.status,'COMPLETED');assert.equal(a.generatedRoundIds.length,3);assert.equal(a.obligations.length,12)
 assert.equal(new Set(a.obligations.map(o=>o.id)).size,12)
 const before=structuredClone(f.sources);const second=run(f);assert.equal(second.status,'COMPLETED_WITH_NO_CHANGES');assert.notEqual(r.id,second.id);assert.deepEqual(f.sources,before)
 f.sources.worlds[0].groups.push(environment(roundDemo(f.sources.organizations[0],'new-on-same-date',exampleFeeBoundary(),'Monthly','Upcoming')))
 assert.equal(run(f).status,'COMPLETED');assert.equal(f.state.runs.length,3)
})
test('Business Date changes alone mutate no source and initialization does not generate obligations',()=>{
 const f=fixture(),g=structuredClone(f.sources.worlds[0].groups[0]);delete cycleOf(g).active
 const initialized=advanceReference(g,'2099-09-21T00:00:00+01:00',true);assert.equal(cycleOf(initialized).active.obligations.length,0)
 const before=structuredClone(f.sources),s=seedSession('settings-admin'),p=previewChange(s,{category:'Business Date',mode:'CONTROLLED',date:'2099-12-21'},reason,'',f.settings,actual)
 applyChange(s,p,true,'',f.settings,actual);assert.deepEqual(f.sources,before);assert.equal(f.state.runs.length,0)
})
test('partial failures preserve earlier work and retry creates a new immutable linked run',()=>{
 const f=fixture(),first=run(f,undefined,operator(),key=>{if(key==='PAYOUT_LIFECYCLE')throw Error('SECRET stack / simulated failure')})
 assert.equal(first.status,'PARTIAL_FAILURE');assert.equal(cycleOf(f.sources.worlds[0].groups[0]).active.obligations.length,12);assert.ok(!JSON.stringify(first).includes('SECRET'))
 const snapshot=structuredClone(first),second=run(f,first.id);assert.equal(second.retryOf,first.id);assert.equal(second.businessDate,first.businessDate);assert.equal(second.steps[0].changed,0);assert.deepEqual(first,snapshot)
 assert.throws(()=>{first.reason='rewrite'},TypeError);assert.equal(needsAttention(first,f.state.runs),false)
 assert.equal(cycleOf(f.sources.worlds[0].groups[0]).active.obligations.length,12)
})
test('total failure and transitive retries retain original failures and original business target',()=>{
 const f=fixture(),fail=()=>{throw Error('controlled failure')},first=run(f,undefined,operator(),fail);assert.equal(first.status,'FAILED')
 const second=run(f,first.id,operator(),fail);f.settings.controlledDate='2099-12-21';f.settings.revision++
 const third=run(f,second.id);assert.equal(third.businessDate,'2099-11-21');assert.equal(third.businessTimestamp,first.businessTimestamp);assert.equal(needsAttention(first,f.state.runs),false)
 assert.equal(cycleOf(f.sources.worlds[0].groups[0]).active.generatedRoundIds.length,3)
})
test('default deny, separate view/run/retry authority, mandatory reason and confirmation',()=>{
 for(const id of ['access-admin','settings-admin','date-manager','ops-analyst','pending-user','suspended-user'])assert.throws(()=>run(fixture(),undefined,seedSession(id)),/denied/)
 for(const s of [null,{kind:'member'},{kind:'organization'}])assert.throws(()=>readRuns(s),/denied/)
 const f=fixture(),finance=seedSession('finance-reviewer');assert.ok(hasPermission(finance,'operations.process.run'));assert.equal(hasPermission(finance,'operations.process.retry'),false)
 const failed=run(f,undefined,operator(),()=>{throw Error('failure')});assert.throws(()=>run(f,failed.id,finance),/denied/)
 assert.throws(()=>previewProcess(operator(),f.sources,'','',f.state,f.settings,actual),/reason/)
 const p=previewProcess(operator(),f.sources,reason,undefined,f.state,f.settings,actual);assert.throws(()=>executeProcess(operator(),f.sources,p,false,{state:f.state,settings:f.settings}),/Confirmation/)
 assert.throws(()=>run(f,'unknown'),/failed/)
})
test('stale preview, revoked permission, production and concurrent invocation are rejected',()=>{
 const f=fixture(),s=operator(),p=previewProcess(s,f.sources,reason,undefined,f.state,f.settings,actual)
 f.sources.worlds[0].groups[0].name='Changed';assert.throws(()=>executeProcess(s,f.sources,p,true,{state:f.state,settings:f.settings,now:()=>actual}),/Preview again/)
 s.access.users.find(u=>u.id===s.personaId).roleIds=[];assert.throws(()=>executeProcess(s,f.sources,p,true,{state:f.state,settings:f.settings}),/denied/)
 f.settings.environment='Production';assert.throws(()=>run(f),/non-production/);f.settings.environment='Prototype / UAT Simulation';f.state.running=true;assert.throws(()=>run(f),/progress/)
})
test('scenario fixtures and mixed-clock histories are preserved; mixed finance is disclosed incomplete',()=>{
 const f=fixture(),demo=roundDemo(f.sources.organizations[0],'isolated',exampleFeeBoundary(),'Monthly','Upcoming'),snapshot=structuredClone(demo)
 f.sources.worlds.push({groups:[demo]});run(f);assert.deepEqual(f.sources.worlds[1].groups[0],snapshot)
 const mixed=fixture();mixed.sources.worlds[0].groups.push(demo);const result=run(mixed);assert.equal(result.status,'PARTIAL_FAILURE');assert.deepEqual(mixed.sources.worlds[0].groups[1],snapshot)
})
test('optional recipient skips never become debt/penalties/defaults; existing partial debt preserved',()=>{
 const f=fixture('Collection ready · optional skipped');f.settings.controlledDate='2099-09-25';run(f)
 const g=f.sources.worlds[0].groups[0],a=cycleOf(g).active,r=a.rounds[0],o=a.obligations.find(o=>o.memberId===r.beneficiaries[0].memberId)
 assert.equal(balances(o).optional,10000000);assert.equal(balances(o).outstanding,0);assert.equal(obligationState(o,r,a).penaltyEligible,false);assert.equal(g.lifecycle?.recoveries.length||0,0)
 const partial=fixture('Late / partial'),before=structuredClone(cycleOf(partial.sources.worlds[0].groups[0]).active.obligations);run(partial)
 for(const o of before)assert.deepEqual(cycleOf(partial.sources.worlds[0].groups[0]).active.obligations.find(n=>n.id===o.id),o)
})
test('advance reservations allocate exactly once without new provider money',()=>{
 const f=fixture(),g=environment(paymentDemo(f.sources.organizations[0],'advance','Advance held until opening'));f.sources.worlds[0].groups=[g];f.settings.controlledDate='2099-10-21'
 const facts=g.payments.transactions.map(t=>[t.id,t.amountMinor,t.confirmedAt,t.providerReference]),count=g.payments.transactions.length
 run(f);const next=f.sources.worlds[0].groups[0];assert.equal(next.payments.transactions.at(-1).allocationStatus,'allocated');assert.equal(next.payments.transactions.length,count)
 assert.deepEqual(next.payments.transactions.map(t=>[t.id,t.amountMinor,t.confirmedAt,t.providerReference]),facts)
 const before=structuredClone(f.sources);run(f);assert.deepEqual(f.sources,before)
})
test('payout timeout preserves evidence and never fabricates Member confirmation; finance follows domain recognition',()=>{
 const f=fixture(),g=environment(payoutDemo(f.sources.organizations[0],'timeout','Transfer awaiting confirmation'));f.sources.worlds[0].groups=[g];f.sources.banks=g.payouts.demoBanks
 const i=g.payouts.records[0].installments[0],transfer=i.transferredAt;f.settings.controlledDate='2099-09-25'
 const r=run(f),next=f.sources.worlds[0].groups[0].payouts.records[0].installments[0]
 assert.equal(r.status,'COMPLETED');assert.equal(next.status,'window-elapsed');assert.equal(next.transferredAt,transfer);assert.equal(next.confirmedAt,undefined)
 assert.ok(f.sources.worlds[0].finance.receivables.length>0);const before=structuredClone(f.sources);run(f);assert.deepEqual(f.sources,before)
})
test('actual run timestamps/security remain actual; Real Time execution works',()=>{
 const f=fixture(),s=operator(),before=structuredClone(s.access);const r=run(f,undefined,s)
 assert.equal(r.startedAt,actual);assert.equal(r.completedAt,actual);assert.equal(r.businessDate,'2099-11-21');assert.deepEqual(s.access,before)
 const real=fixture();real.settings=createSettings();real.sources.worlds=[];assert.equal(run(real).mode,'REAL_TIME')
})
test('diagnostics require exact authority and disclose catch-up, future records, failure and persistence',()=>{
 const f=fixture(),s=seedSession('settings-admin');assert.equal(diagnostics(s,f.sources.worlds,f.state,f.settings,actual).catchUp,true)
 assert.throws(()=>diagnostics(seedSession('access-admin'),[],f.state,f.settings),/denied/)
 run(f);let d=diagnostics(s,f.sources.worlds,f.state,f.settings,actual);assert.equal(d.catchUp,false);assert.equal(d.pendingRounds,0);assert.ok(d.persistence.includes('In-memory'))
 f.settings.mode='REAL_TIME';d=diagnostics(s,f.sources.worlds,f.state,f.settings,actual);assert.ok(d.warnings.some(w=>w.includes('Future business records')))
})
test('process report and CSV use filtered source totals and require reporting plus process access',()=>{
 Object.assign(processState,createProcessState());const f=fixture();f.state=processState;run(f);run(f);const sources={clients:[],organizations:[],worlds:[]},s=operator()
 const r=generateInternalReport(sources,s,'internal-process-runs',{status:'COMPLETED_WITH_NO_CHANGES'},actual)
 assert.equal(r.rows.length,1);assert.equal(r.summaries.find(s=>s.key==='runs').value,1);assert.equal(r.summaries.find(s=>s.key==='noop').value,1)
 assert.ok(exportInternalReport(sources,s,'internal-process-runs',{businessDate:'2099-11-21'},actual).includes('DAILY_LIFECYCLE_PROCESS'))
 assert.throws(()=>generateInternalReport(sources,seedSession('settings-admin'),'internal-process-runs'),/denied/)
 assert.ok(!availableInternalReports(seedSession('verification-reviewer')).some(d=>d.id==='internal-process-runs'))
 Object.assign(processState,createProcessState())
})
import { lifecycleTransition } from '../src/lifecycle/service.ts'
test('an ineligible advance remains an exception through scheduled catch-up and no Recovery money is fabricated',()=>{
 const f=fixture(),o=f.sources.organizations[0],id=o.ownerMemberId
 let g=paymentDemo(o,'exit-advance-process','Advance held until opening'),at=cycleOf(g).active.referenceAt
 g=lifecycleTransition(g,id,id,{type:'request-exit',memberId:id,reason:'Relocation before payout'},at)
 g=lifecycleTransition(g,id,id,{type:'approve-exit',id:g.lifecycle.exits[0].id},at)
 f.sources.worlds[0].groups=[environment(g)];f.settings.controlledDate='2099-10-21'
 const transaction=g.payments.transactions.at(-1),exit=structuredClone(g.lifecycle.exits[0]);run(f)
 const next=f.sources.worlds[0].groups[0],retained=next.payments.transactions.find(t=>t.id===transaction.id)
 assert.equal(retained.allocationStatus,'exception');assert.equal(retained.allocatedMinor,0);assert.equal(retained.unallocatedMinor,transaction.unallocatedMinor)
 assert.deepEqual(next.lifecycle.exits[0],exit);assert.equal(next.lifecycle.recoveries.length,0)
})
