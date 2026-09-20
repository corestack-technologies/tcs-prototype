import {createServer} from 'vite'
import {createElement as h} from 'react'
import {renderToStaticMarkup as render} from 'react-dom/server'
import assert from 'node:assert/strict'
import {readFileSync} from 'node:fs'
const server=await createServer({server:{middlewareMode:true,hmr:false},appType:'custom'})
try{
 const load=p=>server.ssrLoadModule('/src/'+p)
 const {ClientProvider,useClient}=await load('clients/ClientContext.tsx'),{OrganizationProvider,useOrganization}=await load('organizations/OrganizationContext.tsx'),{GroupProvider,useGroups}=await load('groups/GroupContext.tsx'),{AccessProvider}=await load('access/AccessContext.tsx'),{seedPersona}=await load('clients/seeds.ts'),{seedOrganization}=await load('organizations/seeds.ts'),{seedGroup,SCENARIOS}=await load('groups/seeds.ts'),{exampleFeeBoundary}=await load('groups/model.ts')
 const client=seedPersona('verified'),organization=seedOrganization(client,'active'),boundary=exampleFeeBoundary()
 function ClientFixture({children}){useClient().client=client;return h(OrganizationProvider,null,children)}
 function OrgFixture({children,org}){useOrganization().organization=org;return h(GroupProvider,null,children)}
 function GroupFixture({children,group}){const c=useGroups();c.group=group;c.groups=group?[group]:[];return children}
 const wrap=(child,group,org=organization)=>h(AccessProvider,null,h(ClientProvider,null,h(ClientFixture,null,h(OrgFixture,{org},h(GroupFixture,{group},child)))))
 const names=['OwnerDashboard','OwnerProfile','OwnerGroups','GroupSetupWizard','GroupRecruitment','GroupPositions','GroupRulesReview','GroupReadiness','GroupActivated','OwnerJoinRequests','OrgApplication','OrgReviewStatus','OrgActivation']
 const pages=await Promise.all(names.map(async name=>[name,(await load('components/org/'+name+'.tsx'))[name]]))
 const nav=()=>{};let count=0;const previous=globalThis.window
 try{for(const width of [360,390,430,768,1024,1440]){globalThis.window={innerWidth:width,location:{pathname:'/'},scrollTo(){}};for(const scenario of SCENARIOS){const group=seedGroup(organization,'owner-render-'+scenario,scenario,boundary);for(const [name,Page] of pages){const html=render(wrap(h(Page,{navigate:nav}),group));assert.ok(html.length>60,name);assert.ok(!html.includes('NaN'),name+' '+scenario);count++}}}}finally{globalThis.window=previous}
 for(const state of ['draft','submitted','pending','information-required','approved','restricted','suspended','declined']){const org=seedOrganization(client,state);for(const name of ['OrgApplication','OrgReviewStatus','OrgActivation','OwnerDashboard']){const Page=pages.find(([n])=>n===name)[1];assert.ok(render(wrap(h(Page,{navigate:nav}),undefined,org)).length>50);count++}}
 const group=seedGroup(organization,'ready-render','Ready for activation',boundary)
 const html=render(wrap(h(pages.find(([n])=>n==='OwnerDashboard')[1],{navigate:nav}),group));assert.ok(html.includes('Current workspace attention'));assert.ok(html.includes('Draft Cycles to prepare'))
 const ready=render(wrap(h(pages.find(([n])=>n==='GroupReadiness')[1],{navigate:nav}),group));assert.ok(ready.includes('Group preparation progress'));assert.ok(ready.includes('aria-current="step"'))
 const groups=render(wrap(h(pages.find(([n])=>n==='OwnerGroups')[1],{navigate:nav}),group));assert.ok(groups.includes('<summary>Prototype scenario tools</summary>'));assert.ok(!groups.includes('<details open'))
 const css=readFileSync('src/organizations/owner.css','utf8');for(const rule of ['@media(max-width:639px)','@media(min-width:1280px)','content:attr(data-label)','.organization-experience','.owner-exception'])assert.ok(css.includes(rule))
 console.log((count+4)+' Organization route/scenario and responsive structural checks passed; six widths. SSR/CSS only, not browser geometry or interaction QA.')
}finally{await server.close()}
