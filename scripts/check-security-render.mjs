import {createServer} from 'vite'
import {createElement as h} from 'react'
import {renderToStaticMarkup} from 'react-dom/server'
import assert from 'node:assert/strict'
const server=await createServer({server:{middlewareMode:true,hmr:false},appType:'custom'})
try{
 const load=p=>server.ssrLoadModule('/src/'+p)
 const {AccessProvider}=await load('access/AccessContext.tsx'),{AccessWorkspace}=await load('access/AccessWorkspace.tsx'),{SecurityWorkspace,UserSecurity}=await load('access/SecurityWorkspace.tsx'),{PrivilegedPreview}=await load('access/PrivilegedPreview.tsx'),{seedAccess,seedSession}=await load('access/seeds.ts'),{changeSecurity}=await load('access/security.ts'),{previewAccessChange}=await load('access/preview.ts')
 const state=seedAccess(),admin=seedSession('access-admin',state),wrap=(id,child)=>renderToStaticMarkup(h(AccessProvider,{initialState:state,initialUserId:id},child))
 let count=0
 for(const [view,expected] of [['Overview','Active simulated sessions'],['Sessions','Revoke all user sessions'],['Security Events','Login Failure'],['Locked Accounts','Unlock security condition']]){
  const html=wrap('access-admin',h(SecurityWorkspace,{initialView:view}));assert.ok(html.includes(expected));assert.ok(html.includes('No real tokens'));count++
 }
 for(const id of ['ops-supervisor','finance-reviewer','locked-user','suspended-user','deactivated-user','pending-user']){
  assert.ok(wrap(id,h(SecurityWorkspace)).includes('Access denied.'));assert.ok(wrap(id,h(AccessWorkspace,{navigate:()=>{},initialTab:'Security'})).includes('Access denied.'));count+=2
 }
 assert.ok(wrap('access-admin',h(UserSecurity,{userId:'locked-user'})).includes('Security Locked'));assert.equal(wrap('finance-reviewer',h(UserSecurity,{userId:'locked-user'})),'');count+=2
 changeSecurity(admin,{type:'revoke',sessionId:'session-finance-mobile'},'Device retirement evidence reviewed','2026-09-16T12:00:00Z')
 assert.ok(wrap('access-admin',h(SecurityWorkspace,{initialView:'Sessions'})).includes('Device retirement evidence reviewed'))
 assert.ok(wrap('access-admin',h(SecurityWorkspace,{initialView:'Security Events'})).includes('Linked access audit'));count+=2
 const preview=previewAccessChange(admin,{type:'assign',id:'finance-reviewer',roleId:'supervisor'},'Operational coverage reviewed')
 const html=renderToStaticMarkup(h(PrivilegedPreview,{preview,state,onApply:()=>{},onCancel:()=>{}}));for(const text of ['Before','After','Will gain:','Approve Force Close','Chidi','Operational coverage reviewed'])assert.ok(html.includes(text));count++
 const {default:App}=await load('App.tsx'),{ClientProvider}=await load('clients/ClientContext.tsx'),{OrganizationProvider}=await load('organizations/OrganizationContext.tsx'),{GroupProvider}=await load('groups/GroupContext.tsx'),{OperationsProvider}=await load('operations/OperationsContext.tsx'),previous=globalThis.window
 try{
  globalThis.window={location:{pathname:'/access-management/security'}}
  for(const id of ['access-admin','ops-supervisor','locked-user','pending-user','suspended-user','deactivated-user']){
   const tree=[ClientProvider,OrganizationProvider,GroupProvider,OperationsProvider].reduceRight((child,P)=>h(P,null,child),h(App)),html=wrap(id,tree)
   assert.equal(html.includes('Access denied.'),id!=='access-admin');assert.equal(html.includes('Security Administration'),id==='access-admin');count++
  }
 }finally{if(previous===undefined)delete globalThis.window;else globalThis.window=previous}
 console.log(count+' Security views, user-detail, privileged preview and direct-route render checks passed.')
}finally{await server.close()}
