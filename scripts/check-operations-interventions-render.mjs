import {createServer} from 'vite'
import {renderToStaticMarkup} from 'react-dom/server'
import {createElement} from 'react'
import assert from 'node:assert/strict'
const server=await createServer({server:{middlewareMode:true,hmr:false},appType:'custom'})
try{
 const {seedSession}=await server.ssrLoadModule('/src/access/seeds.ts')
 const load=p=>server.ssrLoadModule('/src/'+p)
 const [{DecisionPanel},{CaseDetail},{seedPersona,demoPersonas},{seedOrganization},{operationsDemoWorld},{addInterventionDemos},{projectCases},{PayoutCard},{LifecycleHistory},{RevenuePanel},{PublicRestrictions,PublicReview}]=await Promise.all([
 load('operations/DecisionPanel.tsx'),load('operations/OperationsBody.tsx'),load('clients/seeds.ts'),load('organizations/seeds.ts'),load('operations/seeds.ts'),load('operations/interventionSeeds.ts'),load('operations/sources.ts'),load('payouts/PayoutBody.tsx'),load('lifecycle/LifecycleHistory.tsx'),load('reconciliation/RevenuePanel.tsx'),load('operations/PublicStatus.tsx')])
 const org=seedOrganization(seedPersona('verified'),'active'),sources=addInterventionDemos({clients:demoPersonas.map(p=>seedPersona(p.id)),organizations:[org],worlds:[operationsDemoWorld(org)]},org.id),noop=()=>{}
 let count=0
 const check=element=>{const html=renderToStaticMarkup(element);assert.ok(!html.includes('NaN'));assert.ok(!html.includes('undefined'));assert.ok(!html.includes('INTERNAL PRIVATE'));count++;return html}
 for(const personaId of ['ops-analyst','verification-reviewer','finance-reviewer','ops-supervisor']){
  const session=seedSession(personaId)
  for(const item of projectCases(sources,session)){
   const decision=createElement(DecisionPanel,{item,sources,session,onPreview:noop,onDecide:noop})
   const html=check(createElement(CaseDetail,{item,now:'2100-01-10T00:00:00Z',onAction:noop,onSource:noop,onBack:noop,decisionPanel:decision}))
   if(personaId!=='ops-supervisor')assert.ok(!html.includes('value="exceptional-reopen"'))
  }
 }
 for(const g of sources.worlds[0].groups){
  for(const record of g.payouts?.records||[])for(const owner of [true,false])check(createElement(PayoutCard,{group:g,record,owner,onAction:()=>true}))
  for(const cycle of g.cycles)check(createElement(LifecycleHistory,{group:g,cycle}))
 }
 check(createElement(RevenuePanel,{state:sources.worlds[0].finance}))
 for(const m of sources.clients)check(createElement(PublicRestrictions,{records:m.restrictions}))
 for(const o of sources.organizations){check(createElement(PublicRestrictions,{records:o.restrictions}));check(createElement(PublicReview,{review:o.interventionReview}))}
 console.log(count+' Module 5C Operations, party payout, recovery and restriction render checks passed.')
}finally{await server.close()}
