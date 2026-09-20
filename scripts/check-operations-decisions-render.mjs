import {createServer} from 'vite'
import {renderToStaticMarkup} from 'react-dom/server'
import {createElement} from 'react'
import assert from 'node:assert/strict'
const server=await createServer({server:{middlewareMode:true,hmr:false},appType:'custom'})
try{
 const {seedSession}=await server.ssrLoadModule('/src/access/seeds.ts')
 const {DecisionPanel}=await server.ssrLoadModule('/src/operations/DecisionPanel.tsx')
 const {CaseDetail}=await server.ssrLoadModule('/src/operations/OperationsBody.tsx')
 const {seedPersona,demoPersonas}=await server.ssrLoadModule('/src/clients/seeds.ts')
 const {seedOrganization}=await server.ssrLoadModule('/src/organizations/seeds.ts')
 const {operationsDemoWorld}=await server.ssrLoadModule('/src/operations/seeds.ts')
 const {decisionDemoWorld}=await server.ssrLoadModule('/src/operations/decisionSeeds.ts')
 const {projectCases}=await server.ssrLoadModule('/src/operations/sources.ts')
 const {previewDecision,executeDecision}=await server.ssrLoadModule('/src/operations/decisions.ts')
 const org=seedOrganization(seedPersona('verified'),'active'),world=operationsDemoWorld(org),extra=decisionDemoWorld(org)
 world.groups.push(...extra.groups);for(const k of ['settlements','cases','receivables','expectations','unmatchedPayments','history'])world.finance[k].push(...extra.finance[k])
 const sources={clients:demoPersonas.map(p=>seedPersona(p.id)),organizations:[org,seedOrganization(seedPersona('verified'),'pending'),seedOrganization(seedPersona('verified'),'settlement-pending')],worlds:[world]},noop=()=>{}
 let count=0
 for(const personaId of ['ops-analyst','verification-reviewer','finance-reviewer','ops-supervisor']){
  const session=seedSession(personaId)
  for(const item of projectCases(sources,session)){
   const decision=createElement(DecisionPanel,{item,sources,session,onPreview:noop,onDecide:noop})
   const html=renderToStaticMarkup(createElement(CaseDetail,{item,now:'2100-01-01T00:00:00Z',onAction:noop,onSource:noop,onBack:noop,decisionPanel:decision}))
   assert.ok(html.includes('Controlled decision'));assert.ok(!html.includes('NaN'));assert.ok(!html.includes('undefined'))
   if(personaId==='ops-analyst')assert.ok(!html.includes('value="confirm-receipt"'))
   if(item.type==='Payout Dispute'&&['finance-reviewer','ops-supervisor'].includes(personaId))assert.ok(html.includes('Uphold Member claim'))
   count++
  }
 }
 const session=seedSession('verification-reviewer'),c=projectCases(sources,session).find(c=>c.type==='Member KYC Review'&&c.status==='New'),at='2100-01-01T00:00:00Z'
 const preview=previewDecision(sources,c.id,{action:'approve',reason:'Submitted documents reviewed'},session,at)
 assert.ok(preview.effect.includes('Verify this Member'))
 const result=executeDecision(sources,preview,session,at),item=projectCases(result.sources,session).find(c=>c.id===c.id&&c.id===preview.caseId)
 const html=renderToStaticMarkup(createElement(DecisionPanel,{item,sources:result.sources,session,onPreview:noop,onDecide:noop}))
 assert.ok(html.includes('Decision history'));assert.ok(html.includes(result.decision.id));assert.ok(!html.includes('Preview decision'));count++
 console.log(`${count} Module 5B persona/case decision and resolved-history render checks passed.`)
}finally{await server.close()}
