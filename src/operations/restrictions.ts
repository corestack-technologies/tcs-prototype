import { recoveryBalances } from '../lifecycle/recovery.ts'
﻿import type { ThriftGroup } from '../groups/model.ts'
import type { RecoveryCase } from '../lifecycle/model.ts'
import type { RestrictionRecord } from './interventionModel.ts'
import { restrictionScope } from './interventionModel.ts'
export function recoveryRestriction(group:ThriftGroup,r:RecoveryCase):RestrictionRecord {
 return {id:'restriction:'+r.id,targetId:r.memberId,target:'Member',type:'post-payout-default',sourceCaseId:`finance:${group.organizationId}:recovery:${r.id}`,reason:'Formal Post-Payout Default / Recovery; no new commitments until Organization resolution.',startedAt:r.openedAt,authority:'TCS source policy',scope:restrictionScope,reviewStatus:r.status==='resolved'&&recoveryBalances(r).cleared?'released':'active',...(r.status==='resolved'&&recoveryBalances(r).cleared?{releasedAt:r.resolvedAt,releasedBy:r.resolvedBy||'Organization review (legacy record)',removalReason:'Outstanding cleared and Organization resolved Recovery; history retained.'}:{})}
}
export function syncRecoveryRecords(group:ThriftGroup){
 for(const r of group.lifecycle?.recoveries||[]){
  const record=recoveryRestriction(group,r);r.restrictions??=[]
  const old=r.restrictions.find(v=>v.id===record.id)
  if(!old)r.restrictions.push(record)
  else if(r.status==='resolved'&&recoveryBalances(r).cleared&&old.reviewStatus==='active')Object.assign(old,{reviewStatus:'released',releasedAt:r.resolvedAt,releasedBy:r.resolvedBy||'Organization review (legacy record)',removalReason:record.removalReason})
  if(r.status==='resolved'&&recoveryBalances(r).cleared&&r.review){r.review.caseStatus='Resolved';r.review.state='Recovery cleared and resolved by Organization; historical default retained'}
 }
}
