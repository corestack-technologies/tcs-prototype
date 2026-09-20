import { Button } from '../ui'
import { OwnerShell } from './OwnerShell'
import { OwnerProgress } from '../../organizations/OwnerProgress'
import { PageHeader, DisplayDate } from '../../design/foundation'
import { formatMoneyMinor } from '../../design/format'
import { useDraftGroup } from '../../groups/GroupContext'
import { admitted, financiallyCommenced } from '../../groups/model'
import { CycleCancellation } from '../../groups/GroupUI'
import type { View, NavMeta } from '../../App'
export function GroupActivated({navigate}:{navigate:(view:View,meta?:NavMeta)=>void}) {
 const {group,cycle}=useDraftGroup()
 return <OwnerShell navigate={navigate} activeView="owner-groups"><OwnerProgress current={5}/><PageHeader title={group.name} description={cycle.status==='cancelled'?'Cancelled Cycle; the record is retained.':'Your Cycle record and next steps.'}/><section className="owner-card p-5 sm:p-7"><h2 className="text-lg font-semibold">Cycle {cycle.number}: {cycle.status.replace(/-/g,' ')}</h2><p className="mt-3 text-sm leading-6">Agreed participants, positions and terms remain protected. Activation does not begin financial participation before the scheduled opening and obligation generation.</p><dl className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 my-6">{[
 ['Positions',String(cycle.terms.positions)],['Members',String(admitted(cycle).length)],['Contribution per full Position',formatMoneyMinor(cycle.terms.amount*100)],['Frequency',cycle.terms.frequency],['Obligations',String(cycle.financial.obligations)],['Financial activity',financiallyCommenced(cycle)?'Commenced':'Awaiting opening']
 ].map(([label,value])=><div key={label}><dt>{label}</dt><dd className="mt-1 font-semibold">{value}</dd></div>)}<div><dt>Planned start</dt><dd><DisplayDate value={cycle.terms.startDate}/></dd></div><div><dt>Organization fee</dt><dd>{cycle.terms.feeType==='percentage'?cycle.terms.feeValue+'%':formatMoneyMinor(cycle.terms.feeValue*100)}</dd></div></dl><div className="flex flex-wrap gap-3">{cycle.status==='activated'&&<Button onClick={()=>navigate('owner-cycles')}>Open Active Cycle &amp; Rounds</Button>}<Button variant="secondary" onClick={()=>navigate('owner-dashboard')}>Go to Organization Dashboard</Button><Button variant="ghost" onClick={()=>navigate('owner-groups')}>View my groups</Button></div></section><details className="owner-secondary"><summary>Accepted Positions, rules and history</summary><div className="space-y-3 mt-4 text-sm">{cycle.positions.map(p=><p key={p.n}>Position {p.n}: {p.holders.map(h=>(cycle.participants.find(m=>m.id===h.memberId)?.name||'Member')+' ('+(h.fraction===.5?'half Position / 0.5':'full Position / 1.0')+')').join(', ')||'Unassigned'}</p>)}<p className="whitespace-pre-line">{cycle.terms.rules}</p>{group.history.map((event,i)=><p key={i}><DisplayDate value={event.at}/> / {event.action} / {event.actor}</p>)}</div></details><CycleCancellation/></OwnerShell>
}
