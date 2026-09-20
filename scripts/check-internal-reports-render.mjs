import { createServer } from 'vite'
import { createElement as h } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import assert from 'node:assert/strict'
const server=await createServer({server:{middlewareMode:true,hmr:false},appType:'custom'})
try{
 const load=p=>server.ssrLoadModule('/src/'+p)
 const {ReportBody}=await load('reports/ReportsWorkspace.tsx'),{InternalReportsWorkspace}=await load('reports/InternalReportsWorkspace.tsx')
 const {internalCatalogue}=await load('reports/internalCatalogue.ts'),{generateInternalReport,availableInternalReports}=await load('reports/internalService.ts')
 const {seedAccess,seedSession}=await load('access/seeds.ts'),{seedPersona,demoPersonas}=await load('clients/seeds.ts'),{seedOrganization}=await load('organizations/seeds.ts')
 const {operationsDemoWorld}=await load('operations/seeds.ts'),{addInterventionDemos}=await load('operations/interventionSeeds.ts')
 const org=seedOrganization(seedPersona('verified'),'active'),sources=addInterventionDemos({clients:demoPersonas.map(p=>seedPersona(p.id)),organizations:[org],worlds:[operationsDemoWorld(org)]},org.id)
 let count=0
 for(const d of internalCatalogue.filter(d=>d.availability==='Available')){
  const session=seedSession(d.category==='Configuration'?'settings-admin':d.category==='Access & Security'?'access-admin':'ops-supervisor'),report=(id,filters)=>generateInternalReport(sources,session,id,filters,'2100-01-10T00:00:00.000Z')
  const html=renderToStaticMarkup(h(ReportBody,{audience:'internal',definitions:availableInternalReports(session),report,initialReport:d.id}))
  assert.ok(html.includes(d.name.replaceAll('&','&amp;')));assert.ok(html.includes('Download CSV'));assert.ok(html.includes('Print report'));assert.ok(html.includes('Generated:'));assert.ok(!html.includes('NaN'));assert.ok(!html.includes('undefined'))
  if(report(d.id).rows.length)assert.ok(html.includes('Source record &amp; details'));count++
 }
 for(const userId of ['ops-analyst','finance-reviewer','ops-supervisor','access-admin']){
  const session=seedSession(userId),html=renderToStaticMarkup(h(ReportBody,{audience:'internal',definitions:availableInternalReports(session),report:()=>{throw Error('No generation during catalogue render')}}))
  assert.equal(html.includes('Platform Overview'),userId==='ops-supervisor');assert.equal(html.includes('>Access Audit '),userId==='access-admin');assert.equal(html.includes('Financial Activity'),['finance-reviewer','ops-supervisor'].includes(userId));assert.equal(html.includes('Planned / Awaiting Source Module'),false);count++
 }
 const {AccessProvider,useAccess}=await load('access/AccessContext.tsx'),{ClientProvider}=await load('clients/ClientContext.tsx'),{OrganizationProvider}=await load('organizations/OrganizationContext.tsx'),{GroupProvider}=await load('groups/GroupContext.tsx'),{OperationsProvider,useOperations}=await load('operations/OperationsContext.tsx'),{default:App}=await load('App.tsx')
 const wrap=(id,child)=>h(AccessProvider,{initialState:seedAccess(),initialUserId:id},[ClientProvider,OrganizationProvider,GroupProvider,OperationsProvider].reduceRight((child,P)=>h(P,null,child),child))
 const previous=globalThis.window
 try{
  globalThis.window={location:{pathname:'/reports/internal'}}
  for(const id of [undefined,'ops-analyst','finance-reviewer','ops-supervisor','access-admin','pending-user','suspended-user','deactivated-user','locked-user']){
   const html=renderToStaticMarkup(wrap(id,h(App))),allowed=['ops-analyst','finance-reviewer','ops-supervisor','access-admin'].includes(id)
   assert.equal(html.includes('Access denied.'),!allowed,id);assert.equal(html.includes('Platform Overview'),id==='ops-supervisor');count++
  }
  for(const id of ['ops-analyst','finance-reviewer','ops-supervisor','access-admin']){
   const reportId=id==='access-admin'?'internal-security':id==='finance-reviewer'?'internal-revenue':'internal-cases'
   const html=renderToStaticMarkup(wrap(id,h(InternalReportsWorkspace,{navigate:()=>{},initialReport:reportId})))
   assert.ok(!html.includes('Access denied.'));assert.ok(html.includes('Download CSV'));count++
  }
  function Probe(){
   const access=useAccess(),ops=useOperations()
   assert.ok(ops.report('internal-security').rows.length)
   const retained=ops.exportReport
   access.select(null)
   assert.throws(()=>retained('internal-security'),/denied/)
   access.select('ops-analyst')
   assert.throws(()=>retained('internal-security'),/denied/)
   assert.ok(ops.report('internal-cases'));return h('p',null,'Live report/export authorization passed')
  }
  assert.ok(renderToStaticMarkup(wrap('access-admin',h(Probe))).includes('Live report/export authorization passed'));count++
 }finally{if(previous===undefined)delete globalThis.window;else globalThis.window=previous}
 console.log(count+' internal report, catalogue, role visibility, route and live export-authorization render checks passed.')
}finally{await server.close()}
