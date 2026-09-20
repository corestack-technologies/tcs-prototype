import { InternalFacts } from '../internal/Presentation'
import { DisplayDate } from '../design/foundation'
import { formatDate } from '../design/format'
﻿import { useEffect, useState } from 'react'
import type { View } from '../App'
import { useAccess } from '../access/AccessContext'
import { hasPermission } from '../access/authorization'
import { InternalDenied, InternalNavigation } from '../access/InternalNavigation'
import { useGroups } from '../groups/GroupContext'
import type { Diagnostics } from './diagnostics'
export function DiagnosticsBody({data}:{data:Diagnostics}){
 return <main id="internal-main" tabIndex={-1} className="max-w-5xl mx-auto p-6 space-y-5"><h1 className="text-2xl font-bold">Settings / System Diagnostics</h1><p>Read-only environment and lifecycle status. Process execution is in Operations / Scheduled Processes.</p><section className="internal-card p-5"><h2 className="text-lg font-semibold">Environment and business time</h2><InternalFacts items={[{label:'Environment',value:data.clock.environment},{label:'Actual time',value:<DisplayDate value={data.clock.actualTimestamp}/>},{label:'Business Date',value:<DisplayDate value={data.clock.businessDate}/>},{label:'Mode',value:data.clock.mode},{label:'Environment Groups',value:data.environmentGroups},{label:'Opened Rounds awaiting generation',value:data.pendingRounds}]}/></section><section className="internal-card p-5 space-y-3"><h2 className="text-lg font-semibold">Lifecycle processing</h2><p>Last successful lifecycle run: {data.latest?data.latest.id+' / '+data.latest.status+' / '+formatDate(data.latest.completedAt)+' / Business Date '+data.latest.businessDate:'No successful runs recorded'}</p><p>Most recent unresolved failed / partial run: {data.attention?data.attention.id+' / '+data.attention.status:'None'}</p><p>{data.catchUp?'Catch-up / backlog evaluation required.':'Lifecycle processing is current through the effective Business Date. Same-date new data can still require evaluation.'}</p><p>Protected source history through: {data.protectedThrough||'No significant source history'}</p>{data.warnings.map(w=><p key={w} className="bg-amber-50 border rounded-lg p-3">{w}</p>)}</section><section className="internal-card p-5 space-y-3"><h2 className="text-xl font-semibold">Prototype scope and source readiness</h2><p>{data.persistence}</p><p>{data.sourceReadiness}</p></section></main>

}
export function DiagnosticsWorkspace({navigate}:{navigate:(v:View)=>void}){
 const a=useAccess(),g=useGroups(),[,refresh]=useState(0)
 useEffect(()=>{const timer=setInterval(()=>refresh(v=>v+1),1000);return()=>clearInterval(timer)},[])
 if(!hasPermission(a.session,'settings.view')||!hasPermission(a.session,'settings.diagnostics.view'))return <InternalDenied navigate={navigate} module="System Diagnostics"/>
 return <><InternalNavigation navigate={navigate} current="settings" /><DiagnosticsBody data={g.diagnostics(a.currentSession())}/></>
}
