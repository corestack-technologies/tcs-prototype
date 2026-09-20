import { createServer } from 'vite'
import { createElement as h } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import assert from 'node:assert/strict'
const server=await createServer({server:{middlewareMode:true,hmr:false},appType:'custom'})
try {
 const load=p=>server.ssrLoadModule('/src/'+p)
 const {seedPersona}=await load('clients/seeds.ts'),{seedOrganization}=await load('organizations/seeds.ts'),{roundDemo}=await load('rounds/seeds.ts'),{advanceReference}=await load('rounds/service.ts'),{cycleOf,exampleFeeBoundary}=await load('groups/model.ts'),{accruePenalties,evaluatePostPayoutDefaults,waivePenalty}=await load('penalties/service.ts'),{PenaltyLedgerPanel}=await load('penalties/PenaltyLedgerPanel.tsx'),{ActiveCycleBody}=await load('rounds/ActiveCycleBody.tsx'),{PenaltyTerms}=await load('penalties/PenaltyTerms.tsx'),{emptyLifecycle}=await load('lifecycle/model.ts')
 const organization=seedOrganization(seedPersona('verified'),'active'),actual='2026-09-17T12:00:00.000Z'
 let g=roundDemo(organization,'penalty-render',exampleFeeBoundary(),'Monthly','Upcoming'),c=cycleOf(g),at=c.active.rounds[0].schedule.lateAt
 c.terms.dailyPenaltyRateBps=5;c.snapshot.terms.dailyPenaltyRateBps=5
 g=advanceReference(g,at);g=accruePenalties(g,at,actual);c=cycleOf(g)
 const a=g.penalties.accruals.find(a=>a.memberId!==organization.ownerMemberId),other=g.penalties.accruals.find(p=>p.memberId!==a.memberId)
 let count=0
 for(const editable of [false,true]){const html=renderToStaticMarkup(h(PenaltyLedgerPanel,{group:g,cycle:c,onWaive:editable?()=>true:undefined}));for(const text of ['Daily penalty ledger','5','Accrued','waived','outstanding','Principal basis'])assert.ok(html.includes(text));assert.equal(html.includes('Reduce penalty'),editable);count++}
 let html=renderToStaticMarkup(h(PenaltyLedgerPanel,{group:g,cycle:c,memberId:a.memberId}));assert.ok(html.includes(c.participants.find(p=>p.id===a.memberId).name));assert.ok(!html.includes(c.participants.find(p=>p.id===other.memberId).name));assert.ok(!html.includes('Reduce penalty'));count++
 g=waivePenalty(g,organization,organization.ownerMemberId,a.id,1000,'Approved documented reduction',actual);c=cycleOf(g)
 html=renderToStaticMarkup(h(PenaltyLedgerPanel,{group:g,cycle:c,memberId:a.memberId}));assert.ok(html.includes('Approved documented reduction'));assert.ok(html.includes(actual));assert.ok(html.includes('Original accrual retained'));count++
 at=new Date(Date.parse(at)+7*86400000).toISOString();(g.lifecycle??=emptyLifecycle()).payoutFacts.push({cycleId:c.id,position:2,memberId:a.memberId,status:'received-recorded',entitlementMinor:40000000,at});g=evaluatePostPayoutDefaults(g,at,actual);c=cycleOf(g)
 html=renderToStaticMarkup(h(PenaltyLedgerPanel,{group:g,cycle:c,memberId:a.memberId}));assert.ok(html.includes('Post-Payout Default'));assert.ok(html.includes('Historical default retained'));count++
 html=renderToStaticMarkup(h(ActiveCycleBody,{group:g,cycle:c,active:c.active,organization,memberId:a.memberId}));assert.ok(html.includes('Daily penalty ledger'));assert.ok(!html.includes('no penalty amount is accrued here'));count++
 const empty=structuredClone(g);delete empty.penalties;html=renderToStaticMarkup(h(PenaltyLedgerPanel,{group:empty,cycle:cycleOf(empty)}));assert.ok(html.includes('No daily penalty accrual recorded'));count++
 for(const rate of [0,5,10]){html=renderToStaticMarkup(h(PenaltyTerms,{rate}));assert.ok(html.includes('bps/day'));assert.ok(html.includes('seven full calendar days'));assert.ok(html.includes('10 bps/day'));count++}
 console.log(count+' financial regularization ledger, authority, privacy, audit, default, empty-state and Member disclosure render checks passed.')
}finally{await server.close()}
