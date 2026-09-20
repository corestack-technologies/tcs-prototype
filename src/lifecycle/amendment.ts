import type { ThriftGroup } from '../groups/model.ts'
import type { AmendmentRequest } from './model.ts'
// Only presentation text has an unambiguous application rule in this batch.
export function finishAmendmentApproval(group:ThriftGroup,a:AmendmentRequest,at:string){
 const cycle=group.cycles.find(c=>c.id===a.cycleId)
 if(!cycle||cycle.status!=='activated')throw Error('The amendment Cycle is no longer active.')
 const consented=a.affectedMemberIds.every(id=>a.consents.some(s=>s.memberId===id&&s.terms===JSON.stringify(a.proposedTerms)))
 if(!consented){a.status='approved-awaiting-consent';return 'Approved — awaiting required Member consent'}
 const keys=Object.keys(a.proposedTerms) as (keyof typeof a.proposedTerms)[]
 const changes=keys.filter(key=>JSON.stringify(a.currentTerms[key])!==JSON.stringify(a.proposedTerms[key]))
 if(changes.length&&changes.every(key=>key==='name'||key==='description')){
  // Retain activation snapshots, original request terms and every financial record.
  for(const key of changes as ('name'|'description')[]){cycle.terms[key]=a.proposedTerms[key];group[key]=a.proposedTerms[key]}
  a.status='effective';a.effectiveAt=at
  return 'Approved — non-financial amendment effective'
 }
 a.status='approved-awaiting-application'
 return 'Approved — awaiting financial application rule'
}
