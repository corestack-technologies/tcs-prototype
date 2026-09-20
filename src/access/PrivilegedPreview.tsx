import { Dialog } from '../design/foundation'
import type {AccessPreview} from './preview'
import {catalogue,type AccessState} from './model'
export function PrivilegedPreview({preview,state,onApply,onCancel}:{preview:AccessPreview;state:AccessState;onApply:()=>void;onCancel:()=>void}){
 const label=(key:string)=>catalogue.find(p=>p.key===key)?.label||key
 const summarize=(value:unknown)=>{
  if(!value||typeof value!=='object')return 'Not present'
  const v=value as {roleIds?:string[];permissions?:string[];name?:string;status?:string;active?:boolean}
  if(v.roleIds)return `${v.name} · ${v.status} · Roles: ${v.roleIds.map(id=>state.roles.find(r=>r.id===id)?.name||id).join(', ')||'None'}`
  return `${v.name} · ${v.active?'Active':'Inactive'} · ${v.permissions?.length||0} permissions`
 }
 const action=preview.action,role='roleId'in action?state.roles.find(r=>r.id===action.roleId)?.name:'id'in action?state.roles.find(r=>r.id===action.id)?.name:undefined
 return <Dialog label="Privileged access preview" onClose={onCancel}><section className="rounded-xl border border-amber-300 bg-amber-50 p-5" aria-label="Privileged access preview"><h2 className="font-bold">Review sensitive access change</h2><p className="text-sm mt-2">{preview.event?.action} · {role||state.users.find(u=>u.id===preview.event?.target)?.name||'New internal user'}</p>{'permission'in action&&<p className="text-sm mt-2">Permission: {label(action.permission)}</p>}<dl className="grid sm:grid-cols-2 gap-4 mt-4 text-sm"><div><dt className="font-semibold">Before</dt><dd>{summarize(preview.event?.before)}</dd></div><div><dt className="font-semibold">After</dt><dd>{summarize(preview.event?.after)}</dd></div></dl><p className="text-sm mt-3">Reason: {preview.reason}</p>{preview.impacts.map(i=><div key={i.name} className="mt-4 text-sm"><strong>{i.name}</strong>{i.gained.length>0&&<p>Will gain: {i.gained.map(label).join('; ')}</p>}{i.lost.length>0&&<p>Will lose: {i.lost.map(label).join('; ')}</p>}</div>)}{!preview.impacts.length&&<p className="text-sm mt-3">No currently usable permission changes. Inactive or locked users remain denied; assigned access becomes usable only when lifecycle and security allow.</p>}<p className="text-xs mt-3">Current state will be checked again. Operations independence rules still apply.</p><div className="flex gap-3 mt-4"><button className="rounded-lg bg-blue-800 text-white px-4 py-2 text-sm" onClick={onApply}>Apply sensitive change</button><button className="rounded-lg border px-4 py-2 text-sm" onClick={onCancel}>Cancel</button></div></section></Dialog>
}
