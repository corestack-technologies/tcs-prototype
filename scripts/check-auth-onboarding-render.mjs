import { createServer } from 'vite'
import { createElement as h } from 'react'
import { renderToStaticMarkup as render } from 'react-dom/server'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
const server=await createServer({server:{middlewareMode:true,hmr:false},appType:'custom'})
try {
 const load=p=>server.ssrLoadModule('/src/'+p)
 const {Login,DemoAccounts}=await load('components/Login.tsx'),{Signup}=await load('components/Signup.tsx')
 const {ClientProvider,useClient}=await load('clients/ClientContext.tsx'),{OrganizationProvider}=await load('organizations/OrganizationContext.tsx'),{AccessProvider}=await load('access/AccessContext.tsx'),{seedPersona,demoPersonas}=await load('clients/seeds.ts')
 const pages=await Promise.all(['ClientContact','ClientOnboarding','ClientVerification','ClientSubmission'].map(async name=>[name,(await load('clients/'+name+'.tsx'))[name]]))
 function Fixture({persona,children}){useClient().client=seedPersona(persona);return h(OrganizationProvider,null,children)}
 const wrap=(child,persona='new')=>h(AccessProvider,null,h(ClientProvider,null,h(Fixture,{persona},child)))
 const nav=()=>{};let checks=0
 const previousWindow=globalThis.window
 for(const width of [360,390,430,768,1024,1440]){
  globalThis.window={innerWidth:width,location:{pathname:"/"},scrollTo(){}}
  const html=render(wrap(h(Login,{navigate:nav})))
  assert.ok(html.includes('Welcome back')&&html.includes('Use demo account'))
  assert.ok(!html.includes('new@tcs.ng')&&!html.includes('role="dialog"'))
  for(const label of ['Internal access','Operations','Access Management','Organization review']) assert.ok(!html.includes(label), 'No standalone tooling: '+label)
  assert.ok(html.includes('Show password')&&html.includes('current-password'))
  const signup=render(wrap(h(Signup,{navigate:nav})))
  for(const content of ['About you','Sign-in details','given-name','new-password','Account setup progress','Create account'])assert.ok(signup.includes(content))
  for(const [name,Page] of pages)for(const persona of demoPersonas){const output=render(wrap(h(Page,{navigate:nav}),persona.id));assert.ok(output.length>100,name+persona.id);assert.ok(!output.includes('NaN')&&!output.includes('undefined'));checks++}
  checks+=2
 }
 globalThis.window=previousWindow
 const demo=render(h(DemoAccounts,{onSelect:nav,onOrganization:nav,onInternal:nav}));for(const p of demoPersonas){assert.ok(demo.includes(p.email));assert.ok(demo.includes(p.label));checks++}
 for(const group of ['Member demos','Organization demos','TCS Internal demos','Onboarding','Verification','Existing Member','Operations','Access Management','Verification review','Organization review'])assert.ok(demo.includes(group))
 const otp=render(wrap(h(pages[0][1],{navigate:nav})));for(const expected of ['Demo verification helper','one-time-code','inputMode="numeric"','maxLength="6"','Confirm email'])assert.ok(otp.includes(expected),expected)
 assert.ok(otp.indexOf('Demo verification helper')<otp.indexOf('246810'))
 const css=readFileSync('src/auth/auth.css','utf8');for(const rule of ['@media(min-width:1024px)','@media(min-width:768px)','grid-template-columns:minmax(0,.95fr) minmax(0,1.05fr)','.auth-hero{display:none}','overflow-wrap:anywhere','max-height:25vh'])assert.ok(css.includes(rule),rule)
 console.log((checks+2)+' auth/onboarding render and structural checks passed. Six target widths covered by CSS contracts; SSR is not browser geometry or interaction testing.')
}finally{await server.close()}
