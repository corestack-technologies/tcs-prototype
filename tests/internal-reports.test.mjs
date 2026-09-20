import test from 'node:test'
import assert from 'node:assert/strict'
import { generateInternalReport, availableInternalReports, auditState } from '../src/reports/internalService.ts'
import { internalCatalogue } from '../src/reports/internalCatalogue.ts'
import { exportInternalReport, reportCsv } from '../src/reports/export.ts'
import { generateReport } from '../src/reports/service.ts'
import { seedAccess, seedSession } from '../src/access/seeds.ts'
import { changeAccess } from '../src/access/service.ts'
import { changeSecurity } from '../src/access/security.ts'
import { seedPersona, demoPersonas } from '../src/clients/seeds.ts'
import { seedOrganization } from '../src/organizations/seeds.ts'
import { operationsDemoWorld } from '../src/operations/seeds.ts'
import { addInterventionDemos } from '../src/operations/interventionSeeds.ts'
import { projectCases } from '../src/operations/sources.ts'
import { reconciliationDemo, RECONCILIATION_DEMOS } from '../src/reconciliation/seeds.ts'
const at='2100-01-10T00:00:00.000Z'
const org=seedOrganization(seedPersona('verified'),'active')
const base=()=>({clients:demoPersonas.map(p=>seedPersona(p.id)),organizations:[org],worlds:[operationsDemoWorld(org)],triage:{}})
const state=()=>{const s=seedAccess(),admin=seedSession('access-admin',s);changeAccess(admin,{type:'assign',id:'ops-analyst',roleId:'verification'},'Training coverage approved','2026-09-16T12:00:00Z');changeSecurity(admin,{type:'revoke',sessionId:'session-finance-mobile'},'Retired demonstration device','2026-09-16T12:00:00Z');return s}
let sharedInterventions
const interventions=()=>sharedInterventions??=addInterventionDemos(base(),org.id)
const report=(sources,id,filters={},session=seedSession('ops-supervisor'))=>generateInternalReport(sources,session,'internal-'+id,filters,at)
const total=(r,key)=>r.summaries.find(s=>s.key===key)?.value
function totals(r){assert.equal(new Set(r.rows.map(r=>r.id)).size,r.rows.length);for(const m of r.summaries)assert.equal(m.value,r.rows.reduce((n,r)=>n+Number(r.values[m.key]||0),0),m.label)}
for(const d of internalCatalogue.filter(d=>d.availability==='Available'))test(d.name+' source projection, filtered totals and reproducibility',()=>{
 const s=interventions(),access=state(),session=seedSession(d.category==='Configuration'?'settings-admin':d.category==='Access & Security'?'access-admin':'ops-supervisor',access),before=structuredClone({s,access})
 const r=generateInternalReport(s,session,d.id,{},at);totals(r);assert.deepEqual(generateInternalReport(s,session,d.id,{},at),r);assert.deepEqual({s,access},before)
 if(r.rows.length){const filtered=generateInternalReport(s,session,d.id,{search:r.rows[0].source.id},at);assert.ok(filtered.rows.length);totals(filtered)}
})
test('exact report permissions, role-appropriate catalogue and no Member/Owner access',()=>{
 const s=base()
 for(const actor of [null,{kind:'member',memberId:org.ownerMemberId},{kind:'organization',memberId:org.ownerMemberId,organizationId:org.id},seedSession('pending-user'),seedSession('suspended-user'),seedSession('deactivated-user'),seedSession('locked-user')])for(const d of internalCatalogue.filter(d=>d.availability==='Available'))assert.throws(()=>generateInternalReport(s,actor,d.id))
 const admin=seedSession('access-admin');assert.deepEqual(availableInternalReports(admin).map(d=>d.id),['internal-access','internal-security'])
 assert.throws(()=>report(s,'financial',{},admin));assert.throws(()=>report(s,'overview',{},admin));assert.throws(()=>report(s,'access',{},seedSession('ops-supervisor')))
 assert.ok(availableInternalReports(seedSession('ops-analyst')).every(d=>d.permission==='reports.operations.view'))
 const session=seedSession('ops-analyst');session.access.roles.find(r=>r.id==='analyst').permissions=['reports.financial.view-extra','reports.financial','reports.*'];assert.throws(()=>report(s,'financial',{},session))
})
test('report-only Role works without granting Operations decision or queue authority',()=>{
 const session=seedSession('ops-analyst');session.access.roles.find(r=>r.id==='analyst').permissions=['reports.operations.view']
 assert.ok(report(base(),'cases',{},session).rows.length);assert.throws(()=>projectCases(base(),session))
})
test('Role and permission removal, suspension and lock immediately deny generation and export',()=>{
 for(const mutate of [s=>s.users.find(u=>u.id==='finance-reviewer').roleIds=[],s=>s.roles.find(r=>r.id==='finance').permissions=[],s=>s.users.find(u=>u.id==='finance-reviewer').status='Suspended',s=>s.users.find(u=>u.id==='finance-reviewer').security={locked:true,failedAttempts:5}]){
  const access=state(),session=seedSession('finance-reviewer',access),s=base();report(s,'revenue',{},session);mutate(access);assert.throws(()=>report(s,'revenue',{},session));assert.throws(()=>exportInternalReport(s,session,'internal-revenue',{},at))
 }
})
test('platform counts trace to unique source records and metric drill-down',()=>{
 const s=base(),r=report(s,'overview');assert.equal(total(r,'members'),s.clients.length);assert.equal(total(r,'organizations'),s.organizations.length);assert.equal(total(r,'groups'),s.worlds[0].groups.length)
 assert.equal(total(r,'activeCases'),projectCases(s,seedSession('ops-supervisor')).filter(c=>!['Resolved','Closed'].includes(c.status)).length)
 const drill=report(s,'overview',{metric:'activeCases'});assert.equal(drill.rows.length,total(r,'activeCases'));totals(drill)
 assert.throws(()=>report(s,'overview',{metric:'privateNotes'}))
})
test('growth preserves unavailable dates rather than inventing trend history',()=>{
 const s=base();s.clients[0].history=[];const r=report(s,'growth'),row=r.rows.find(r=>r.memberId===s.clients[0].id);assert.equal(row.date,'');assert.equal(row.values.status,'Date unavailable');assert.ok(!report(s,'growth',{from:'2000-01-01'}).rows.some(r=>r.id===row.id))
})
test('platform Cycle reports do not expose financial data via hidden service fields',()=>{
 const r=report(base(),'cycles');assert.ok(r.rows.length);for(const row of r.rows){assert.ok(!('outstanding' in row.values));assert.ok(!('Recorded payout (minor)' in row.detail))}
})
for(const scenario of RECONCILIATION_DEMOS)test('financial source scenario '+scenario,()=>{
 const {group,state}=reconciliationDemo(org,'internal-'+scenario,scenario),s={clients:[],organizations:[org],worlds:[{groups:[group],finance:state}]}
 for(const id of ['financial','revenue','payments','reconciliation','payouts','recovery','exits'])totals(report(s,id))
 const revenue=report(s,'revenue');assert.equal(total(revenue,'due'),state.receivables.reduce((n,r)=>n+r.amountMinor,0))
 const r7a=generateReport({organizations:[{id:org.id,name:org.form.name,ownerMemberId:org.ownerMemberId,workspace:true}],worlds:s.worlds},{kind:'organization',memberId:org.ownerMemberId,organizationId:org.id},'organization-revenue',{},at)
 assert.equal(total(revenue,'outstanding'),total(r7a,'outstanding'))
 if(scenario==='TCS share awaiting confirmation')assert.ok(revenue.rows.every(r=>r.values.aging==='Awaiting TCS Confirmation'))
 if(scenario==='TCS share settled')assert.equal(total(revenue,'outstanding'),0)
 if(scenario==='Settlement variance')assert.equal(total(report(s,'reconciliation'),'variance'),state.settlements.reduce((n,r)=>n+r.varianceMinor,0))
})
test('evidence adjustments remain separate from original fee/revenue postings',()=>{
 const s=interventions(),fee=report(s,'financial'),revenue=report(s,'revenue')
 assert.ok(fee.rows.some(r=>r.detail['Recognition adjustment']!==undefined));assert.ok(revenue.rows.some(r=>r.values.adjustment!==0));assert.ok(revenue.rows.some(r=>r.detail['Financial review'].includes('original posting preserved')))
})
test('Operations age, filters and triage share the Module 5 source; private notes excluded',()=>{
 const s=base(),c=projectCases(s,seedSession('ops-supervisor'))[0];s.triage[c.id]={assignee:'ops-analyst',status:'Awaiting External Action',priority:'High',timeline:[{at,actor:'Ada',action:'Internal note',reason:'SECRET-PRIVATE-NOTE',origin:'Internal'}]}
 const r=report(s,'cases',{assignee:'Ada',status:'Awaiting External Action',priority:'High'});assert.ok(r.rows.some(r=>r.source.id===c.id));assert.ok(r.rows.every(r=>r.values.ageHours>=0));assert.ok(!JSON.stringify(r).includes('SECRET-PRIVATE-NOTE'));assert.ok(r.notices.some(n=>n.includes('SLA')))
})
test('Access Audit and Security events filter correctly and correlate administrative actions',()=>{
 const access=state(),session=seedSession('access-admin',access),s=base(),a=report(s,'access',{},session),security=report(s,'security',{},session)
 assert.equal(a.rows.length,access.history.length);assert.ok(security.rows.some(r=>r.values.type==='Session Revoked'&&r.values.correlation))
 assert.equal(report(s,'access',{type:'Role Assigned'},session).rows.length,1);assert.ok(report(s,'security',{type:'Login Failure'},session).rows.length)
 assert.ok(security.rows.every(r=>r.source.kind==='security-event'));assert.ok(a.rows.every(r=>r.source.kind==='access-audit'));assert.ok(!auditState({token:'SECRET',bank:{accountNumber:'SECRET'},status:'Active'}).includes('SECRET'))
})
test('material activity preserves historical authority and conditionally excludes Access Audit',()=>{
 const s=interventions(),access=state(),supervisor=seedSession('ops-supervisor',access),r=report(s,'activity',{},supervisor)
 assert.ok(r.rows.length);assert.ok(r.rows.every(r=>r.source.kind!=='access-audit'));const before=structuredClone(r.rows)
 access.roles.find(r=>r.id==='finance').permissions=[];assert.deepEqual(report(s,'activity',{},supervisor).rows,before)
})
test('a security event and its derived access correlation are not duplicated',()=>{
 const access=state(),session=seedSession('access-admin',access),e=access.history.find(e=>e.action==='Session Revoked')
 access.security.events.push({id:'explicit-correlated-security-event',type:'Session Revoked',at:e.at,actor:e.actor,userId:e.target,result:'Revoked',reason:e.reason,sessionId:'session-finance-mobile',accessChangeId:e.id})
 const result=report(base(),'security',{},session);assert.equal(result.rows.filter(r=>r.values.correlation===e.id).length,1)
})
test('CSV exports exactly filtered rows with metadata, source IDs, escaping and formula protection',()=>{
 const s=base(),session=seedSession('ops-supervisor'),r=report(s,'cases',{priority:'High'},session),csv=exportInternalReport(s,session,'internal-cases',{priority:'High'},at)
 assert.ok(csv.includes('"Row count","'+r.rows.length+'"'));assert.ok(csv.includes('"Actor","Dami (ops-supervisor)"'));assert.ok(csv.includes('"priority""'));for(const row of r.rows)assert.ok(csv.includes(row.source.id))
 const row=r.rows[0]||report(s,'cases').rows[0],fake={...r,rows:[{...row,values:{...row.values,reference:'=HYPERLINK("bad")'}}]}
 assert.ok(reportCsv(fake).includes("'=HYPERLINK("));assert.ok(!csv.includes('bankDetails'));assert.throws(()=>exportInternalReport(s,seedSession('access-admin'),'internal-financial',{},at))
})
test('CSV metric drill-down and tenant filters do not expand source scope',()=>{
 const s=base(),r=report(s,'financial',{organizationId:'missing'});assert.equal(r.rows.length,0);assert.ok(r.summaries.every(s=>s.value===0))
 const session=seedSession('ops-supervisor'),d=report(s,'overview',{metric:'members'},session),csv=exportInternalReport(s,session,'internal-overview',{metric:'members'},at)
 assert.equal(d.rows.length,s.clients.length);assert.ok(csv.includes('"Row count","'+s.clients.length+'"'))
})
function parseCsv(csv){
 const rows=[];let row=[],field='',quoted=false
 for(let i=csv.charCodeAt(0)===0xFEFF?1:0;i<csv.length;i++){
  const c=csv[i]
  if(c==='"'){if(quoted&&csv[i+1]==='"'){field+='"';i++}else quoted=!quoted}
  else if(c===','&&!quoted){row.push(field);field=''}
  else if(c==='\r'&&csv[i+1]==='\n'&&!quoted){row.push(field);rows.push(row);row=[];field='';i++}
  else field+=c
 }
 return rows
}
test('CSV round-trip preserves every visible filtered cell, Unicode, commas, quotes and newlines',()=>{
 const s=base(),session=seedSession('ops-supervisor'),r=report(s,'revenue',{},session),csv=exportInternalReport(s,session,'internal-revenue',{},at)
 const parsed=parseCsv(csv),header=parsed.findIndex(row=>row.at(-1)==='Source ID')
 assert.deepEqual(parsed.slice(header+1),r.rows.map(row=>[...r.definition.columns.map(c=>String(row.values[c.key]??'Not available')),row.source.kind,row.source.id]))
 const fixture={...r,definition:{...r.definition,columns:[{key:'name',label:'Name',type:'text'}]},rows:[{...r.rows[0],source:{kind:'test',id:'id'},values:{name:'Naira ₦, "receipt"\nsecond line'}}]}
 assert.equal(parseCsv(reportCsv(fixture)).at(-1)[0],'Naira ₦, "receipt"\nsecond line')
 for(const value of ['=HYPERLINK("x")','+cmd','-cmd','@SUM(A1)',' \t=SUM(A1)','\rcommand']){fixture.rows[0].values.name=value;assert.equal(parseCsv(reportCsv(fixture)).at(-1)[0],"'"+value)}
})
test('reports and exports omit KYC documents, accounts, review comments and session secrets',()=>{
 const s=structuredClone(interventions()),access=state(),p=s.worlds[0].groups.flatMap(g=>g.payouts?.records||[]).find(p=>p.installments.length)
 s.clients[0].identity.nin='SECRET-KYC';s.clients[0].bankDetails={accountNumber:'SECRET-BANK'}
 p.installments[0].notes='SECRET-INTERNAL';p.installments[0].bank.accountNumber='SECRET-ACCOUNT'
 for(const d of internalCatalogue.filter(d=>d.availability==='Available')){
  const session=seedSession(d.category==='Configuration'?'settings-admin':d.category==='Access & Security'?'access-admin':'ops-supervisor',access)
  assert.ok(!JSON.stringify(generateInternalReport(s,session,d.id,{},at)).includes('SECRET-'),d.id)
  assert.ok(!exportInternalReport(s,session,d.id,{},at).includes('SECRET-'),d.id)
 }
})
test('planned reports deny generation/export and never invent Module 8 records',()=>{
 for(const d of internalCatalogue.filter(d=>d.availability!=='Available')){assert.throws(()=>report(base(),d.id.slice(9)),/awaiting source/);assert.throws(()=>exportInternalReport(base(),seedSession('ops-supervisor'),d.id))}
})
