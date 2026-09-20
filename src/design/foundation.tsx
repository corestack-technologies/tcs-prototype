import { Component, Suspense, useEffect, useId, useRef, useState, type ReactNode } from 'react'
import { Badge, Button } from '../components/ui'
import { formatDate } from './format'
export function DisplayDate({value,zone}:{value?:string;zone?:string}) {return <time dateTime={value} title={value}>{formatDate(value || "",zone)}</time>}
export function PageHeader({title,description,eyebrow,actions}:{title:string;description?:string;eyebrow?:string;actions?:ReactNode}) {
 return <header className="tcs-page-header"><div className="min-w-0">{eyebrow&&<p className="tcs-label">{eyebrow}</p>}<h1 className="tcs-title">{title}</h1>{description&&<p className="tcs-description">{description}</p>}</div>{actions&&<div className="tcs-actions">{actions}</div>}</header>
}
export function EmptyState({title,description,action}:{title:string;description?:string;action?:ReactNode}) {return <div className="tcs-empty"><h3 className="font-semibold">{title}</h3>{description&&<p className="mt-2 text-sm text-muted-foreground">{description}</p>}{action&&<div className="mt-4">{action}</div>}</div>}
export function LoadingState({label='Loading workspace'}:{label?:string}) {return <section role="status" aria-live="polite" aria-busy="true" className="tcs-container space-y-4"><p className="font-semibold">{label}</p><div aria-hidden="true" className="tcs-skeleton h-8 w-2/3"/><div aria-hidden="true" className="tcs-skeleton h-32"/></section>}
export function StatusBadge({status}:{status:string}) {
 const value=status.toLowerCase(),variant=/inactive|not.started|cancelled|unverified/.test(value)?'not-started':/failed|rejected|declined|restricted|suspended|overdue|disputed|force.closed|^locked$|^security locked$/.test(value)?'rejected':/pending|partial|awaiting|review|information.required/.test(value)?'pending':/active|approved|completed|cleared|verified/.test(value)?'verified':'info'
 return <Badge variant={variant}>{status}</Badge>
}
export function ScrollRegion({label,children}:{label:string;children:ReactNode}) {return <div className="tcs-scroll-region" role="region" aria-label={label} tabIndex={0}>{children}</div>}
export function ResponsiveNavigation({label,currentLabel,children}:{label:string;currentLabel?:string;children:ReactNode}) {
 const [open,setOpen]=useState(false),id=useId(),toggle=useRef<HTMLButtonElement>(null)
 return <div className="tcs-navigation" onKeyDown={e=>{if(e.key==='Escape'){setOpen(false);toggle.current?.focus()}}}>
  <button ref={toggle} type="button" className="tcs-nav-toggle" aria-expanded={open} aria-controls={id} onClick={()=>setOpen(!open)}>{currentLabel||label}<span aria-hidden="true">{open?'Close':'Menu'}</span></button>
  <nav id={id} aria-label={label} className={'tcs-nav-links '+(open?'is-open':'')} onClick={e=>{if((e.target as HTMLElement).closest('button,a'))setOpen(false)}}>{children}</nav>
 </div>
}
export function Dialog({label,onClose,children,drawer=false}:{label:string;onClose:()=>void;children:ReactNode;drawer?:boolean}) {
 const panel=useRef<HTMLDivElement>(null),close=useRef(onClose);close.current=onClose
 useEffect(()=>{
  const before=document.activeElement as HTMLElement|null,overflow=document.body.style.overflow
  document.body.style.overflow='hidden';panel.current?.focus()
  const focusables=()=>Array.from(panel.current?.querySelectorAll<HTMLElement>('button:not(:disabled),a[href],input:not(:disabled),select:not(:disabled),textarea:not(:disabled),summary,[tabindex="0"]')||[]).filter(el=>el.getClientRects().length>0)
  const key=(e:KeyboardEvent)=>{if(e.key==='Escape'){e.preventDefault();e.stopPropagation();close.current()}if(e.key==='Tab'){const elements=focusables(),first=elements[0],last=elements.at(-1);if(!first){e.preventDefault();return}if(e.shiftKey&&(document.activeElement===first||document.activeElement===panel.current)){e.preventDefault();last?.focus()}else if(!e.shiftKey&&(document.activeElement===last||document.activeElement===panel.current)){e.preventDefault();first.focus()}}}
  const contain=(e:FocusEvent)=>{if(panel.current&&!panel.current.contains(e.target as Node))panel.current.focus()}
  document.addEventListener('keydown',key,true);document.addEventListener('focusin',contain)
  return()=>{document.body.style.overflow=overflow;document.removeEventListener('keydown',key,true);document.removeEventListener('focusin',contain);if(before?.isConnected)before.focus()}
 },[])
 return <div className={'tcs-dialog-backdrop '+(drawer?'tcs-drawer-backdrop':'')} onClick={e=>{if(e.target===e.currentTarget)onClose()}}><div ref={panel} role="dialog" aria-modal="true" aria-label={label} tabIndex={-1} className={'tcs-dialog '+(drawer?'tcs-drawer':'')}><div className="flex items-center justify-between gap-3 mb-4"><p className="font-semibold">{label}</p><Button variant="ghost" aria-label={'Close '+label} onClick={onClose}>Close</Button></div>{children}</div></div>
}
export class WorkspaceErrorBoundary extends Component<{children:ReactNode;onReturn?:()=>void},{failed:boolean}> {
 state={failed:false}
 static getDerivedStateFromError(){return {failed:true}}
 render(){return this.state.failed?<div role="alert" className="tcs-container"><EmptyState title="This workspace could not load" description="Your current session is still open. Return to home to continue, or reload this page if the problem persists. Reloading clears this in-memory prototype session." action={<div className="tcs-actions">{this.props.onReturn&&<Button onClick={()=>{this.setState({failed:false});this.props.onReturn?.()}}>Return to home</Button>}<Button variant="secondary" onClick={()=>window.location.reload()}>Reload page</Button></div>}/></div>:this.props.children}
}
export function WorkspaceBoundary({children,onReturn}:{children:ReactNode;onReturn?:()=>void}) {return <WorkspaceErrorBoundary onReturn={onReturn}><Suspense fallback={<LoadingState/>}>{children}</Suspense></WorkspaceErrorBoundary>}
