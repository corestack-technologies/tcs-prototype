import {createServer} from 'vite'
import {createElement as h} from 'react'
import {renderToStaticMarkup} from 'react-dom/server'
import assert from 'node:assert/strict'
const server=await createServer({server:{middlewareMode:true,hmr:false},appType:'custom'})
try{
 const {AccessProvider}=await server.ssrLoadModule('/src/access/AccessContext.tsx')
 const {AccessWorkspace}=await server.ssrLoadModule('/src/access/AccessWorkspace.tsx')
 const {seedAccess}=await server.ssrLoadModule('/src/access/seeds.ts')
 const {changeAccess}=await server.ssrLoadModule('/src/access/service.ts')
 const {InternalNavigation}=await server.ssrLoadModule('/src/access/InternalNavigation.tsx')
 const state=seedAccess(),admin={kind:'tcs-internal',personaId:'access-admin',access:state}
 changeAccess(admin,{type:'status',id:'ops-analyst',status:'Suspended'},'Temporary staffing reassignment')
 const render=(id,props={})=>renderToStaticMarkup(h(AccessProvider,{initialState:state,initialUserId:id},h(AccessWorkspace,{navigate:()=>{},...props})))
 for(const [tab,selected,expected] of [['Users','','Create internal user'],['Users','finance-reviewer','Effective permissions'],['Roles','','Create role'],['Roles','finance','Affected users'],['Permission Catalogue','','revenue_share.confirm'],['Access Audit','','User Suspended']]){
  const html=render('access-admin',{initialTab:tab,initialSelected:selected});assert.ok(html.includes(expected),tab+': '+expected);assert.ok(!html.includes('Access denied.'));assert.ok(!html.includes('undefined'))
 }
 for(const id of [undefined,'ops-supervisor','finance-reviewer','suspended-user','deactivated-user','pending-user']){
  const html=render(id);assert.ok(html.includes('Access denied.'));assert.ok(!html.includes('Create internal user'))
 }
 const nav=id=>renderToStaticMarkup(h(AccessProvider,{initialState:state,initialUserId:id},h(InternalNavigation,{navigate:()=>{}})))
 assert.ok(nav('access-admin').includes('>Access Management</button>'));assert.ok(!nav('access-admin').includes('>Operations</button>'))
 assert.ok(nav('ops-supervisor').includes('>Operations</button>'));assert.ok(!nav('ops-supervisor').includes('>Access Management</button>'))
 console.log('14 Access Management directory/detail/catalogue/audit, page-denial and navigation render scenarios passed.')
 const {default:App}=await server.ssrLoadModule('/src/App.tsx')
 const providers=await Promise.all(['/src/clients/ClientContext.tsx','/src/organizations/OrganizationContext.tsx','/src/groups/GroupContext.tsx','/src/operations/OperationsContext.tsx'].map(p=>server.ssrLoadModule(p)))
 const wrappers=[providers[0].ClientProvider,providers[1].OrganizationProvider,providers[2].GroupProvider,providers[3].OperationsProvider]
 const previousWindow=globalThis.window
 try{
  for(const path of ['/access-management','/operations'])for(const id of ['access-admin','ops-supervisor','pending-user','suspended-user','deactivated-user']){
   globalThis.window={location:{pathname:path}}
   const child=wrappers.reduceRight((child,Provider)=>h(Provider,null,child),h(App))
   const html=renderToStaticMarkup(h(AccessProvider,{initialState:seedAccess(),initialUserId:id},child))
   const allowed=path==='/access-management'?id==='access-admin':id==='ops-supervisor'
   assert.equal(html.includes('Access denied.'),!allowed,path+' '+id)
   assert.equal(html.includes(path==='/access-management'?'Create internal user':'Operations overview'),allowed,path+' '+id)
  }
 }finally{if(previousWindow===undefined)delete globalThis.window;else globalThis.window=previousWindow}
 console.log('10 direct App route authorization scenarios passed, including Pending, Suspended and Deactivated users.')
}finally{await server.close()}
