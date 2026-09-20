import type { ThriftGroup } from '../groups/model.ts'
import type { PenaltyAccrual } from './model.ts'
import { allocateRecovery } from '../reports/recoveryAllocation.ts'
import { minor } from '../payments/model.ts'
export function penaltyBalance(g:ThriftGroup,a:PenaltyAccrual){
 const cycle=g.cycles.find(c=>c.id===a.cycleId),linked=cycle?allocateRecovery(g,cycle).allocations.find(p=>p.kind==='penalty'&&p.sourceId===a.id):undefined
 const waived=linked?.waivedMinor??(g.penalties?.waivers.filter(w=>w.accrualId===a.id).reduce((n,w)=>minor(n+w.amountMinor),0)||0),paid=linked?.appliedMinor||0
 return {accrued:a.amountMinor,waived,paid,outstanding:minor(Math.max(0,a.amountMinor-waived-paid))}
}
export const cyclePenaltyOutstanding=(g:ThriftGroup,cycleId:string)=>(g.penalties?.accruals.filter(a=>a.cycleId===cycleId).reduce((n,a)=>minor(n+penaltyBalance(g,a).outstanding),0)||0)
