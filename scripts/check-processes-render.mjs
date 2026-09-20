import { createServer } from 'vite'
import { createElement as h } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import assert from 'node:assert/strict'
const server=await createServer({server:{middlewareMode:true,hmr:false},appType:'custom'})
try{
 const load=p=>server.ssrLoadModule('/src/'+p)
 const {AccessProvider,useAccess}=await load('access/AccessContext.tsx'),{ClientProvider}=await load('clients/ClientContext.tsx'),{OrganizationProvider}=await load('organizations/OrganizationContext.tsx'),{GroupProvider,useGroups}=await load('groups/GroupContext.tsx'),{OperationsProvider}=await load('operations/OperationsContext.tsx'),{default:App}=await load('App.tsx')
 const {RunDetail,ProcessConfirmation}=await load('processes/ScheduledProcessesWorkspace.tsx'),{DiagnosticsBody}=await load('processes/DiagnosticsWorkspace.tsx'),{diagnostics}=await load('processes/diagnostics.ts'),{seedSession}=await load('access/seeds.ts'),{previewProcess,executeProcess}=await load('processes/service.ts'),{createProcessState}=await load('processes/model.ts'),{createSettings}=await load('settings/service.ts')
 const wrap=(id,child)=>h(AccessProvider,{initialUserId:id},[ClientProvider,OrganizationProvider,GroupProvider,OperationsProvider].reduceRight((child,P)=>h(P,null,child),child))
 const previous=globalThis.window;let count=0
 try{
 for(const path of ['/operations/scheduled-processes','/settings/diagnostics']){
 globalThis.window={location:{pathname:path}}
 for(const id of [undefined,'ops-analyst','finance-reviewer','ops-supervisor','access-admin','settings-admin','settings-viewer','date-manager','pending-user','suspended-user']){
 const html=renderToStaticMarkup(wrap(id,h(App))),allowed=path.includes('diagnostics')?['settings-admin','settings-viewer'].includes(id):['ops-analyst','finance-reviewer','ops-supervisor'].includes(id)
 assert.equal(html.includes('Access denied.'),!allowed,id+' '+path)
 if(allowed&&path.includes('scheduled')){assert.ok(html.includes('No process runs have been recorded yet.'));assert.ok(html.includes('No failed runs require attention.'));assert.equal(html.includes('Preview lifecycle run'),['finance-reviewer','ops-supervisor'].includes(id))}
 if(allowed&&path.includes('diagnostics')){assert.ok(html.includes('In-memory prototype'));assert.ok(!html.includes('Confirm and execute'));assert.ok(!html.includes('Process reason'))}count++
 }}
 const sources={worlds:[],organizations:[],banks:{}},state=createProcessState(),settings=createSettings(),session=seedSession('ops-supervisor'),at='2026-09-17T12:00:00.000Z',preview=previewProcess(session,sources,'Inspect lifecycle',undefined,state,settings,at)
 let html=renderToStaticMarkup(h(ProcessConfirmation,{preview,confirm:()=>{},cancel:()=>{}}));assert.ok(html.includes('Confirm and execute'));assert.ok(html.includes('potential')||html.includes('Potential'));count++
 const run=executeProcess(session,sources,preview,true,{state,settings,now:()=>at});html=renderToStaticMarkup(h(RunDetail,{run,runs:state.runs}));assert.ok(html.includes('COMPLETED_WITH_NO_CHANGES'));assert.ok(html.includes('Actual start'));assert.ok(html.includes('Skipped / no-op'));count++
 const failed={...run,id:'failed-preview',status:'PARTIAL_FAILURE',failed:1,steps:run.steps.map((s,i)=>i?{...s,status:'FAILED',failed:1,errors:['Review source history before retrying.']}:s)},retry={...run,id:'retry-preview',retryOf:failed.id}
 html=renderToStaticMarkup(h(RunDetail,{run:failed,runs:[failed,retry]}));assert.ok(html.includes('PARTIAL_FAILURE'));assert.ok(html.includes('retry-preview'));assert.ok(html.includes('Review source history'));count++
 html=renderToStaticMarkup(h(DiagnosticsBody,{data:diagnostics(seedSession('settings-admin'),[],state,settings,at)}));assert.ok(html.includes('current through the effective Business Date'));count++
 function Probe(){const a=useAccess(),g=useGroups(),p=g.processPreview(a.currentSession(),'Verify live authority');a.select('access-admin');assert.throws(()=>g.processExecute(a.currentSession(),p),/denied/);return h('p',null,'Live authority verified')}
 assert.ok(renderToStaticMarkup(wrap('ops-supervisor',h(Probe))).includes('Live authority verified'));count++
 }finally{globalThis.window=previous}
 console.log(count+' Scheduled Processes, preview, result, failure/retry detail, Diagnostics and live-authority render checks passed.')
}finally{await server.close()}
