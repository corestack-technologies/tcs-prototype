import {authoritySnapshot,requirePermission} from './authorization.ts'
import type {InternalSession,SecuritySession,SecurityEvent} from './model.ts'
export const securityViewPermissions=['security.overview.view','security.sessions.view','security.events.view','security.accounts.locked.view']
export function sessionStatus(s:SecuritySession,at=new Date().toISOString()){return s.status==='Active'&&Date.parse(s.expiresAt)<=Date.parse(at)?'Expired':s.status}
export function securitySessions(s:InternalSession,at=new Date().toISOString()){
 requirePermission(s,'security.sessions.view')
 return structuredClone((s.access.security?.sessions||[]).map(r=>({...r,status:sessionStatus(r,at)})))
}
export function lockedAccounts(s:InternalSession){requirePermission(s,'security.accounts.locked.view');return structuredClone(s.access.users.filter(u=>u.security?.locked))}
export function securityEvents(s:InternalSession):SecurityEvent[]{
 requirePermission(s,'security.events.view')
 return projectSecurityEvents(s)
}
export function securityReportEvents(s:InternalSession):SecurityEvent[]{
 requirePermission(s,'reports.security.view')
 return projectSecurityEvents(s)
}
function projectSecurityEvents(s:InternalSession):SecurityEvent[]{
 const linked=s.access.history.filter(e=>e.privileged||['User Suspended','User Reactivated','User Deactivated','Account Unlocked','Session Revoked','All Sessions Revoked'].includes(e.action)).map(e=>({id:'access-'+e.id,type:e.privileged&&!['Session Revoked','All Sessions Revoked','Account Unlocked'].includes(e.action)?'Privileged '+e.action:e.action,userId:s.access.users.some(u=>u.id===e.target)?e.target:undefined,actor:e.actor,at:e.at,result:e.action,reason:e.reason,accessChangeId:e.id,before:e.before,after:e.after,context:'Access change target: '+e.target}))
 return structuredClone([...(s.access.security?.events||[]),...linked].sort((a,b)=>b.at.localeCompare(a.at)))
}
export function securityOverview(s:InternalSession){requirePermission(s,'security.overview.view');return {activeUsers:s.access.users.filter(u=>u.status==='Active').length,activeSessions:(s.access.security?.sessions||[]).filter(r=>sessionStatus(r)==='Active').length,locked:s.access.users.filter(u=>u.security?.locked).length,suspended:s.access.users.filter(u=>u.status==='Suspended').length,revoked:(s.access.security?.sessions||[]).filter(r=>r.status==='Revoked').length,failedLogins:(s.access.security?.events||[]).filter(e=>e.type==='Login Failure').length}}
export type SecurityAction={type:'revoke';sessionId:string}|{type:'revoke-all';userId:string}|{type:'unlock';userId:string}
export function changeSecurity(s:InternalSession,action:SecurityAction,reason:string,at=new Date().toISOString()){
 if(!['revoke','revoke-all','unlock'].includes(action.type))throw Error('Unknown security action.')
 requirePermission(s,action.type==='unlock'?'security.accounts.unlock':'security.sessions.revoke')
 if(reason.trim().length<10)throw Error('Provide a meaningful reason of at least 10 characters.')
 if(!Number.isFinite(Date.parse(at)))throw Error('Valid actual timestamp required.')
 const next=structuredClone(s.access),actor=authoritySnapshot(s),id=crypto.randomUUID()
 const session=action.type==='revoke'?next.security?.sessions.find(r=>r.id===action.sessionId):undefined
 const userId=action.type==='revoke'?session?.userId:action.userId,u=next.users.find(u=>u.id===userId)
 if(!u)throw Error('Internal user or session not found.')
 let before:unknown,after:unknown,label:string
 if(action.type==='unlock'){
  if(!u.security?.locked)throw Error('This internal account is not locked.')
  if(u.security.lockedAt&&Date.parse(at)<Date.parse(u.security.lockedAt))throw Error('Unlock cannot precede the lock.')
  before=structuredClone(u.security);u.security.locked=false;u.security.unlockedAt=at;after=u.security;label='Account Unlocked'
 }else{
  if(u.id===s.personaId)throw Error('For prototype safety, another authorized administrator must revoke your sessions. Your current demonstration remains available.')
  const sessions=action.type==='revoke'?(session?[session]:[]):(next.security?.sessions||[]).filter(r=>r.userId===u.id&&sessionStatus(r,at)==='Active')
  if(!sessions.length||sessions.some(r=>sessionStatus(r,at)!=='Active'))throw Error('Select currently Active sessions; expired and revoked records are historical.')
  if(sessions.some(r=>Date.parse(at)<Date.parse(r.lastActivityAt)))throw Error('Revocation cannot precede session activity.')
  before=structuredClone(sessions)
  for(const r of sessions){r.status='Revoked';r.revokedAt=at;r.revokedBy=actor.userId;r.reason=reason.trim();r.auditId=id}
  after=sessions;label=action.type==='revoke'?'Session Revoked':'All Sessions Revoked'
 }
 next.history.push({id,action:label,target:u.id,actor,at,reason:reason.trim(),before:structuredClone(before),after:structuredClone(after),privileged:true})
 Object.assign(s.access,next)
}
