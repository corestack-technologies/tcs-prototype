import {createServer} from 'vite'
import {createElement as h} from 'react'
import {renderToStaticMarkup as render} from 'react-dom/server'
import assert from 'node:assert/strict'
import {readFileSync} from 'node:fs'
const server=await createServer({server:{middlewareMode:true,hmr:false},appType:'custom'})
try {
 const load=p=>server.ssrLoadModule('/src/'+p)
 const {ClientProvider,useClient}=await load('clients/ClientContext.tsx'),{OrganizationProvider}=await load('organizations/OrganizationContext.tsx'),{AccessProvider}=await load('access/AccessContext.tsx'),{GroupProvider}=await load('groups/GroupContext.tsx'),{seedPersona,demoPersonas}=await load('clients/seeds.ts')
 function Fixture({persona,children}){useClient().client=seedPersona(persona);return h(OrganizationProvider,null,h(GroupProvider,null,children))}
 const wrap=(child,persona='verified')=>h(AccessProvider,null,h(ClientProvider,null,h(Fixture,{persona},child)))
 const paths=['clients/ClientHome','clients/ClientProfile','clients/ClientVerification','rounds/ActiveCycleWorkspace','payments/PaymentWorkspace','payouts/PayoutWorkspace','reports/ReportsWorkspace','components/thrift/DiscoverCommunities','components/thrift/CommunityDetail','components/thrift/JoinRequest','components/thrift/JoinRequestSubmitted','components/thrift/PendingApproval','components/thrift/GroupDetail']
 const pages=await Promise.all(paths.map(async path=>{const name=path.includes('ActiveCycleWorkspace')?'MemberGroups':path.split('/').at(-1);return [name,(await load(path+'.tsx'))[name]]}))
 let checks=0;const previous=globalThis.window
 try{for(const width of [360,390,430,768,1024,1440]){
  globalThis.window={innerWidth:width,location:{pathname:'/'},scrollTo(){}}
  for(const [name,Page] of pages)for(const persona of demoPersonas){const html=render(wrap(h(Page,{navigate(){}}),persona.id));assert.ok(html.length>50,name+' '+persona.id);assert.ok(!html.includes('NaN'),name);checks++}
 }}finally{globalThis.window=previous}
 const home=render(wrap(h(pages[0][1],{navigate(){}})));assert.ok(home.includes('Review your current commitments'));assert.ok(home.includes('Contribution due')||home.includes('Recipient contribution is optional'))
 const profile=render(wrap(h(pages[1][1],{navigate(){}})));for(const label of ['Personal information','Contact information','Identity and account status'])assert.ok(profile.includes(label))
 const discovery=render(wrap(h(pages[7][1],{navigate(){}})));assert.ok(discovery.includes('Search Groups by name or location'));assert.ok(discovery.includes('type="checkbox"'));assert.ok(discovery.includes('aria-pressed='));assert.ok(!discovery.includes('hidden lg:flex flex-col w-56'))
 const css=readFileSync('src/clients/member.css','utf8');for(const rule of ['@media(max-width:639px)','content:attr(data-label)','grid-template-columns:minmax(0,1fr)','font-variant-numeric:tabular-nums','.member-experience'])assert.ok(css.includes(rule))
 checks+=4;console.log(checks+' Member screen/persona and responsive structural checks passed. Six target widths; SSR and CSS contracts only, not browser geometry or interaction QA.')
}finally{await server.close()}
