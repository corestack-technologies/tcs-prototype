import {changeAccess,type AccessAction} from './service.ts'
import {effectivePermissions} from './authorization.ts'
import type {InternalSession,AccessEvent} from './model.ts'
export interface AccessPreview {actorId:string;version:string;action:AccessAction;reason:string;event?:AccessEvent;impacts:{name:string;gained:string[];lost:string[]}[]}
export function previewAccessChange(s:InternalSession,action:AccessAction,reason:string):AccessPreview{
 const next=structuredClone(s.access),trial={...s,access:next},count=next.history.length
 changeAccess(trial,action,reason)
 const event=next.history.length>count?next.history.at(-1):undefined
 const impacts=next.users.map(u=>{
  const old=effectivePermissions({...s,personaId:u.id}),after=effectivePermissions({...trial,personaId:u.id})
  return {name:u.name,gained:after.filter(p=>!old.includes(p)),lost:old.filter(p=>!after.includes(p))}
 }).filter(i=>i.gained.length||i.lost.length)
 return {actorId:s.personaId,version:JSON.stringify(s.access),action:structuredClone(action),reason,event,impacts}
}
export function applyAccessPreview(s:InternalSession,p:AccessPreview){
 if(p.actorId!==s.personaId||p.version!==JSON.stringify(s.access))throw Error('Access state or acting user changed. Preview again.')
 changeAccess(s,p.action,p.reason)
}
