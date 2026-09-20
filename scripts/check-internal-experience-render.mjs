import {createServer} from 'vite'
import {createElement as h} from 'react'
import {renderToStaticMarkup as render} from 'react-dom/server'
import assert from 'node:assert/strict'
import {readFileSync} from 'node:fs'
const server=await createServer({server:{middlewareMode:true,hmr:false},appType:'custom'})
try{
 const load=p=>server.ssrLoadModule('/src/'+p)
 const {AccessProvider}=await load('access/AccessContext.tsx'),{ClientProvider}=await load('clients/ClientContext.tsx'),{OrganizationProvider}=await load('organizations/OrganizationContext.tsx'),{GroupProvider}=await load('groups/GroupContext.tsx'),{OperationsProvider}=await load('operations/OperationsContext.tsx'),{default:App}=await load('App.tsx'),{AuditValue,InternalFacts}=await load('internal/Presentation.tsx')
 const wrap=(id,child)=>h(AccessProvider,{initialUserId:id},[ClientProvider,OrganizationProvider,GroupProvider,OperationsProvider].reduceRight((child,P)=>h(P,null,child),child))
 const paths=['/operations','/access-management','/access-management/security','/reports/internal','/settings','/settings/diagnostics','/operations/scheduled-processes']
 const ids=['ops-analyst','finance-reviewer','ops-supervisor','access-admin','settings-admin','settings-viewer','runtime-manager','date-manager','suspended-user']
 const previous=globalThis.window;let count=0
 try{for(const width of [360,390,430,768,1024,1440])for(const path of paths)for(const id of ids){globalThis.window={innerWidth:width,location:{pathname:path},scrollTo(){}};const html=render(wrap(id,h(App)));assert.ok(html.includes('internal-main'),path);assert.ok(html.includes('Internal navigation'));assert.ok(html.includes('Demo user selection'));assert.ok(!html.includes('NaN'));count++}}finally{globalThis.window=previous}
 const audit=render(h(AuditValue,{value:{enabled:false,count:0,roles:['Reviewer'],nested:{reference:'original-1'}}}));for(const value of ['No','0','Reviewer','original-1','View details'])assert.ok(audit.includes(value));assert.ok(!audit.includes('<pre'))
 assert.ok(render(h(InternalFacts,{items:[{label:'Business Date',value:'2026-09-19'}]})).includes('<dt>Business Date</dt>'))
 const css=readFileSync('src/internal/internal.css','utf8');for(const rule of ['#internal-main','@media(max-width:639px)','@media(min-width:1024px)','font-variant-numeric:tabular-nums','overflow-wrap:anywhere'])assert.ok(css.includes(rule))
 console.log((count+3)+' Internal route/persona and responsive structural checks passed. Six widths; SSR/CSS contracts only, not browser layout or interaction QA.')
}finally{await server.close()}
