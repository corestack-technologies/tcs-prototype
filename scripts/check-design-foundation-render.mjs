import { createServer } from 'vite'
import { createElement as h, lazy } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { readFileSync } from 'node:fs'
import assert from 'node:assert/strict'
const server=await createServer({server:{middlewareMode:true,hmr:false},appType:'custom'})
try {
 const load=p=>server.ssrLoadModule('/src/'+p)
 const {AccessProvider}=await load('access/AccessContext.tsx'),{ClientProvider,useClient}=await load('clients/ClientContext.tsx'),{OrganizationProvider,useOrganization}=await load('organizations/OrganizationContext.tsx'),{GroupProvider}=await load('groups/GroupContext.tsx'),{OperationsProvider}=await load('operations/OperationsContext.tsx'),{default:App}=await load('App.tsx')
 const {seedPersona}=await load('clients/seeds.ts'),{seedOrganization}=await load('organizations/seeds.ts'),{roundDemo}=await load('rounds/seeds.ts'),{cycleOf,exampleFeeBoundary}=await load('groups/model.ts'),{ActiveCycleBody}=await load('rounds/ActiveCycleBody.tsx'),{PaymentBody}=await load('payments/PaymentBody.tsx'),{paymentDemo}=await load('payments/seeds.ts'),{ClientHome}=await load('clients/ClientHome.tsx'),{OwnerDashboard}=await load('components/org/OwnerDashboard.tsx')
 const {Dialog,ResponsiveNavigation,DisplayDate,StatusBadge,LoadingState,EmptyState,WorkspaceBoundary,WorkspaceErrorBoundary}=await load('design/foundation.tsx'),{Field,Input}=await load('components/ui.tsx')
 const organization=seedOrganization(seedPersona('verified'),'active'),group=roundDemo(organization,'responsive-round',exampleFeeBoundary(),'Monthly','Upcoming'),cycle=cycleOf(group),payment=paymentDemo(organization,'responsive-payment','Awaiting contribution')
 const wrap=(id,child)=>h(AccessProvider,{initialUserId:id},[ClientProvider,OrganizationProvider,GroupProvider,OperationsProvider].reduceRight((c,P)=>h(P,null,c),child))
 // These local SSR fixtures provide seeded UI context only; no production provider/authentication behavior is changed.
 function MemberFixture({children}){const c=useClient();c.client=seedPersona('verified');return h(OrganizationProvider,null,children)}
 function OwnerFixture({children}){const o=useOrganization();o.organization=organization;return h(GroupProvider,null,children)}
 const member=child=>h(AccessProvider,null,h(ClientProvider,null,h(MemberFixture,null,h(GroupProvider,null,child))))
 const owner=child=>h(AccessProvider,null,h(ClientProvider,null,h(MemberFixture,null,h(OwnerFixture,null,child))))
 let count=0;const previous=globalThis.window,widths=[360,390,430,768,1024,1440]
 try{
 for(const width of widths){
  const scenarios=[['Auth','/',undefined,null,'Sign in'],['Member','/',undefined,member(h(ClientHome,{navigate:()=>{}})),'Member navigation'],['Organization','/',undefined,owner(h(OwnerDashboard,{navigate:()=>{}})),'Organization navigation'],['Thrift','/',undefined,h(ActiveCycleBody,{group,cycle,active:cycle.active,organization,memberId:organization.ownerMemberId}),'My contribution'],['Payments','/',undefined,h(PaymentBody,{group:payment,organization,memberId:organization.ownerMemberId}),'Cycle 1'],['Operations','/operations','ops-supervisor',null,'Operations overview'],['Access','/access-management','access-admin',null,'Create internal user'],['Reports','/reports/internal','finance-reviewer',null,'Reports'],['Settings','/settings','settings-admin',null,'Business Date']]
  for(const [area,path,id,element,expected] of scenarios){globalThis.window={innerWidth:width,location:{pathname:path},scrollTo(){}};const html=renderToStaticMarkup(element||wrap(id,h(App)));assert.ok(html.includes(expected),area+' '+width+' expected '+expected);assert.ok(!html.includes('NaN')&&!html.includes('undefined'),area+' '+width);assert.ok(!html.includes('Switched to client rendering'),area+' SSR route resolved');count++}
 }
 }finally{globalThis.window=previous}
 let html=renderToStaticMarkup(h(ResponsiveNavigation,{label:'Workspace destinations',currentLabel:'Reports'},h('button',{'aria-current':'page'},'Reports')));assert.ok(html.includes('aria-expanded="false"'));assert.ok(html.includes('aria-controls='));assert.ok(html.includes('aria-current="page"'));assert.ok(html.includes('Reports'));count++
 html=renderToStaticMarkup(h(Dialog,{label:'Confirm financial exception',onClose:()=>{}},h('button',null,'Confirm')));assert.ok(html.includes('role="dialog"'));assert.ok(html.includes('aria-modal="true"'));assert.ok(html.includes('tabindex="-1"'));assert.ok(html.includes('Close Confirm financial exception'));count++
 html=renderToStaticMarkup(h(Field,{label:'Reason',hint:'Explain the change',error:'A reason is required'},h(Input)));const id=html.match(/<input[^>]*\sid="([^"]+)"/)[1];assert.ok(html.includes('for="'+id+'"'));assert.ok(html.includes('aria-invalid="true"'));assert.ok(html.includes('aria-describedby="'+id+'-help"'));count++
 html=renderToStaticMarkup(h(DisplayDate,{value:'2026-09-17T10:38:37.733Z'}));assert.ok(html.toLowerCase().includes('datetime="2026-09-17t10:38:37.733z"'));assert.ok(html.includes('11:38'));count++
 for(const status of ['Active','Pending','Restricted','Suspended','Failed','Overdue','Disputed','Awaiting Confirmation','Force Closed','Partial','Inactive']){assert.ok(renderToStaticMarkup(h(StatusBadge,{status})).includes(status));count++}
 html=renderToStaticMarkup(h(LoadingState));assert.ok(html.includes('aria-busy="true"'));assert.ok(html.includes('role="status"'));count++
 html=renderToStaticMarkup(h(EmptyState,{title:'No records yet',description:'Your first recorded activity will appear here.'}));assert.ok(html.includes('first recorded activity'));count++
 const Pending=lazy(()=>new Promise(()=>{}));html=renderToStaticMarkup(h(WorkspaceBoundary,null,h(Pending)));assert.ok(html.includes('Loading workspace'));count++
 const failedBoundary=new WorkspaceErrorBoundary({children:null,onReturn:()=>{}});failedBoundary.state={failed:true};html=renderToStaticMarkup(failedBoundary.render());assert.ok(html.includes("Return to home"));assert.ok(html.includes("Reloading clears"));assert.ok(!html.includes("stack"));count++
 const css=readFileSync('src/index.css','utf8');for(const rule of ['@media (min-width:768px)','@media (max-width:639px)','min-height:2.75rem','max-height:calc(100dvh - 1rem)','content:attr(data-label)','prefers-reduced-motion','focus-visible','overflow:auto'])assert.ok(css.includes(rule),rule)
 const operations=readFileSync('src/operations/OperationsBody.tsx','utf8');for(const label of ['Case / issue','Organization / Member','Amount','Priority / age','Status / reviewer'])assert.ok(operations.includes('data-label="'+label+'"'))
 count+=2
 console.log(count+' design foundation and representative responsive structural checks passed at '+widths.join(', ')+'px. SSR/CSS contracts only; no browser layout or visual QA claimed.')
}finally{await server.close()}
