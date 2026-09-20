import test from 'node:test'
import assert from 'node:assert/strict'
import {seedAccess,seedSession} from '../src/access/seeds.ts'
import {hasPermission,canAccessModule,effectivePermissions} from '../src/access/authorization.ts'
import {changeSecurity,securitySessions,securityEvents,securityOverview,lockedAccounts} from '../src/access/security.ts'
import {changeAccess} from '../src/access/service.ts'
import {previewAccessChange,applyAccessPreview} from '../src/access/preview.ts'
const at='2026-09-16T12:00:00Z',reason='Security incident evidence reviewed'
function setup(){const state=seedAccess();return {state,admin:seedSession('access-admin',state),other:seedSession('access-admin-2',state)}}
test('security permissions are exact, separate from Operations and independently gate read services',()=>{
 const {admin,state}=setup();assert.ok(canAccessModule(admin,'security'));assert.equal(canAccessModule(admin,'operations'),false)
 for(const id of ['ops-analyst','verification-reviewer','finance-reviewer','ops-supervisor','pending-user','locked-user']){
  const s=seedSession(id,state);assert.equal(canAccessModule(s,'security'),false);for(const read of [securitySessions,securityEvents,securityOverview,lockedAccounts])assert.throws(()=>read(s))
 }
 assert.equal(hasPermission(admin,'security.sessions'),false);assert.equal(hasPermission(admin,'security.sessions.revoke.extra'),false)
 state.roles.push({id:'sessions-reader',name:'Reader',purpose:'Sessions only',active:true,baseline:false,permissions:['security.sessions.view']});state.users.find(u=>u.id==='ops-analyst').roleIds=['sessions-reader']
 const reader=seedSession('ops-analyst',state);assert.ok(securitySessions(reader).length);assert.throws(()=>securityEvents(reader));assert.throws(()=>changeSecurity(reader,{type:'revoke',sessionId:'session-finance-reviewer'},reason,at))
})
test('single revocation preserves other sessions, records and audit snapshots; replay creates no duplicate event',()=>{
 const {state,admin}=setup(),before=structuredClone(state.security.sessions),count=securityEvents(admin).length
 changeSecurity(admin,{type:'revoke',sessionId:'session-finance-mobile'},reason,at)
 assert.equal(state.security.sessions.length,before.length);assert.equal(state.security.sessions.find(r=>r.id==='session-finance-mobile').status,'Revoked');assert.equal(state.security.sessions.find(r=>r.id==='session-finance-reviewer').status,'Active')
 const e=state.history.at(-1);assert.equal(e.actor.userId,admin.personaId);assert.equal(e.target,'finance-reviewer');assert.equal(e.before[0].status,'Active');assert.equal(e.after[0].status,'Revoked');assert.equal(e.at,at);assert.equal(e.reason,reason)
 assert.equal(securityEvents(admin).length,count+1);const snapshot=JSON.stringify(state)
 assert.throws(()=>changeSecurity(admin,{type:'revoke',sessionId:'session-finance-mobile'},reason,at));assert.equal(JSON.stringify(state),snapshot)
 assert.throws(()=>changeSecurity(admin,{type:'revoke',sessionId:'session-old-expired'},reason,at))
})
test('revoke-all changes only target active sessions and correlates each session to one audit event',()=>{
 const {state,admin}=setup(),others=JSON.stringify(state.security.sessions.filter(r=>r.userId!=='finance-reviewer')),old=JSON.stringify(state.security.sessions.find(r=>r.id==='session-old-revoked'))
 changeSecurity(admin,{type:'revoke-all',userId:'finance-reviewer'},reason,at)
 const e=state.history.at(-1);assert.equal(e.action,'All Sessions Revoked');assert.equal(e.after.length,2);assert.ok(e.after.every(r=>r.auditId===e.id));assert.equal(JSON.stringify(state.security.sessions.find(r=>r.id==='session-old-revoked')),old)
 assert.equal(JSON.stringify(state.security.sessions.filter(r=>r.userId!=='finance-reviewer')),others);assert.equal(securityEvents(admin).filter(e=>e.accessChangeId===state.history.at(-1).id).length,1)
 assert.throws(()=>changeSecurity(admin,{type:'revoke-all',userId:'finance-reviewer'},reason,at))
})
test('own session revocation is clearly blocked; missing reason and missing permission cannot mutate security state',()=>{
 const {state,admin}=setup(),before=JSON.stringify(state)
 for(const action of [{type:'revoke-all',userId:admin.personaId},{type:'revoke',sessionId:'session-access-admin'}])assert.throws(()=>changeSecurity(admin,action,reason,at),/another authorized administrator/)
 assert.throws(()=>changeSecurity(admin,{type:'revoke',sessionId:'session-finance-reviewer'},'',at))
 assert.throws(()=>changeSecurity(seedSession('ops-supervisor',state),{type:'unlock',userId:'locked-user'},reason,at));assert.equal(JSON.stringify(state),before)
})
for(const id of ['locked-user','suspended-user','deactivated-user'])test('unlock retains lifecycle, roles and login history for '+id,()=>{
 const {state,admin}=setup(),s=seedSession(id,state),u=state.users.find(u=>u.id===id),before=structuredClone(u),events=JSON.stringify(state.security.events)
 assert.deepEqual(effectivePermissions(s),[]);changeSecurity(admin,{type:'unlock',userId:id},reason,at)
 const after=state.users.find(u=>u.id===id);assert.equal(after.security.locked,false);assert.equal(after.status,before.status);assert.deepEqual(after.roleIds,before.roleIds);assert.equal(after.security.failedAttempts,5);assert.equal(after.security.lockedAt,before.security.lockedAt);assert.equal(JSON.stringify(state.security.events),events)
 assert.equal(hasPermission(s,'operations.case.view'),id==='locked-user');assert.equal(state.history.at(-1).before.locked,true);assert.equal(state.history.at(-1).after.locked,false)
 assert.throws(()=>changeSecurity(admin,{type:'unlock',userId:id},reason,at))
})
test('locked privileged actor is denied both access and security mutations',()=>{
 const {state,admin}=setup();state.users.find(u=>u.id===admin.personaId).security.locked=true
 assert.equal(canAccessModule(admin,'access-management'),false);assert.throws(()=>changeAccess(admin,{type:'assign',id:'finance-reviewer',roleId:'supervisor'},reason,at));assert.throws(()=>changeSecurity(admin,{type:'unlock',userId:'locked-user'},reason,at))
})
test('last administrator viability excludes locked administrators and protects role permission removal',()=>{
 const {state,admin,other}=setup();state.users.find(u=>u.id===other.personaId).security.locked=true
 for(const action of [{type:'status',id:admin.personaId,status:'Deactivated'},{type:'status',id:admin.personaId,status:'Suspended'},{type:'remove',id:admin.personaId,roleId:'access-admin'},{type:'permission-remove',id:'access-admin',permission:'access.roles.maintain'}])assert.throws(()=>changeAccess(admin,action,reason,at),/at least one/)
})
test('sensitive preview has before/after effects, does not mutate state and rejects stale or different actors',()=>{
 const {state,admin,other}=setup(),before=JSON.stringify(state),p=previewAccessChange(admin,{type:'assign',id:'finance-reviewer',roleId:'supervisor'},reason)
 assert.equal(JSON.stringify(state),before);assert.ok(p.event.privileged);assert.ok(p.impacts.find(i=>i.name==='Chidi').gained.includes('thrift.force_close.approve'))
 assert.throws(()=>applyAccessPreview(other,p),/changed/);applyAccessPreview(admin,p);assert.ok(hasPermission(seedSession('finance-reviewer',state),'thrift.force_close.approve'));assert.throws(()=>applyAccessPreview(admin,p),/changed/)
 const e=state.history.at(-1);assert.ok(securityEvents(admin).some(x=>x.accessChangeId===e.id));assert.equal(securityEvents(admin).filter(x=>x.accessChangeId===e.id).length,1)
 const removed=previewAccessChange(admin,{type:'remove',id:'finance-reviewer',roleId:'supervisor'},reason);assert.ok(removed.impacts[0].lost.includes('thrift.force_close.approve'));applyAccessPreview(admin,removed);assert.equal(state.history.at(-1).action,'Role Removed')
})
test('self-escalation through security assignment or role editing remains blocked',()=>{
 const {state,admin}=setup();assert.throws(()=>previewAccessChange(admin,{type:'assign',id:admin.personaId,roleId:'supervisor'},reason),/Self|self/)
 assert.throws(()=>previewAccessChange(admin,{type:'permission-add',id:'access-admin',permission:'thrift.force_close.approve'},reason),/Self|self/)
 assert.throws(()=>previewAccessChange(admin,{type:'permission-add',id:'analyst',permission:'security.accounts.unlock'},''),/reason/)
 assert.equal(state.history.length,0)
})
test('role permission removal is immediate without automatic session revocation; prior audit remains unchanged',()=>{
 const {state,admin}=setup(),finance=seedSession('finance-reviewer',state),sessions=JSON.stringify(state.security.sessions)
 changeAccess(admin,{type:'remove',id:'finance-reviewer',roleId:'finance'},reason,at);assert.equal(hasPermission(finance,'revenue_share.confirm'),false);assert.equal(JSON.stringify(state.security.sessions),sessions)
 const history=JSON.stringify(state.history),event=JSON.stringify(securityEvents(admin).find(e=>e.accessChangeId===state.history[0].id))
 changeSecurity(admin,{type:'unlock',userId:'locked-user'},reason,at);assert.equal(JSON.stringify(state.history.slice(0,-1)),history);assert.equal(JSON.stringify(securityEvents(admin).find(e=>e.accessChangeId===state.history[0].id)),event)
})
test('last administrator retains directory visibility as well as maintenance authority',()=>{
 const {state,admin}=setup(),before=JSON.stringify(state)
 for(const permission of ['access.users.view','access.roles.view'])assert.throws(()=>changeAccess(admin,{type:'permission-remove',id:'access-admin',permission},reason,at),/at least one/)
 assert.equal(JSON.stringify(state),before)
})
