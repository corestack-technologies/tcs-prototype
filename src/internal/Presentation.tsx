import type { ReactNode } from 'react'
export function InternalFacts({items}:{items:{label:string;value:ReactNode}[]}){return <dl className="internal-facts">{items.map(item=><div key={item.label}><dt>{item.label}</dt><dd>{item.value}</dd></div>)}</dl>}
export function AuditValue({value}:{value:unknown}){
 if(value===null||value===undefined)return <span>Not recorded</span>
 if(Array.isArray(value))return value.length?<ul>{value.map((v,i)=><li key={i}><AuditValue value={v}/></li>)}</ul>:<span>None</span>
 if(typeof value==='object')return <dl>{Object.entries(value).map(([key,v])=><div key={key}><dt>{key.replace(/([a-z])([A-Z])/g,'$1 $2').replace(/[_-]/g,' ')}</dt><dd>{v&&typeof v==='object'?<details><summary>View details</summary><AuditValue value={v}/></details>:<AuditValue value={v}/>}</dd></div>)}</dl>
 return <span>{typeof value==='boolean'?(value?'Yes':'No'):String(value)||'None'}</span>
}
