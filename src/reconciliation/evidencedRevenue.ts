import type { PayoutRecord } from '../payouts/model.ts'
import type { ReconciliationState } from './model.ts'
import type { Organization } from '../organizations/model.ts'
import { proportion, percent } from '../payouts/math.ts'
import { corestackAccount } from './revenue.ts'
export interface EvidencedRecognition {
 id:string
 payoutId:string
 installmentId:string
 decisionId:string
 at:string
 receivedMinor:number
 organizationFeeMinor:number
 tcsShareMinor:number
 basis:'Final Operations evidence'
}
export interface RecognitionAdjustment {
 decisionId:string
 installmentId:string
 previousOrganizationFeeMinor:number
 evidencedOrganizationFeeMinor:number
 organizationFeeDifferenceMinor:number
 previousTcsShareMinor:number
 evidencedTcsShareMinor:number
 tcsShareDifferenceMinor:number
 supersedesCaseId?:string
}
export function finalRecognition(p:PayoutRecord,installmentId:string){
 const calculation=p.calculation||p.instructions.at(-1)
 if(!calculation||!p.policy)return undefined
 let received=0,fee=0,share=0
 for(const i of p.installments){
  const d=p.disputes.find(d=>d.installmentId===i.id),process=d?.process,resolution=process?.resolutions.at(-1)
  const amount=d?(process?.stage==='final'&&resolution?resolution.receivedMinor:0):i.amountMinor
  received+=amount
  const nextFee=proportion(calculation.feeMinor,Math.min(received,calculation.netMinor),calculation.netMinor),nextShare=percent(nextFee,p.policy.tcsSharePercent)
  if(i.id===installmentId){
   if(process?.stage!=='final'||!resolution)return undefined
   return {id:'recognition:'+resolution.id,decisionId:resolution.id,payoutId:p.id,installmentId:i.id,at:process.finalizedAt!,receivedMinor:amount,organizationFeeMinor:nextFee-fee,tcsShareMinor:nextShare-share,basis:'Final Operations evidence' as const}
  }
  fee=nextFee;share=nextShare
 }
}
/** Append recognition and adjustment requirements. Never rewrite an original posting or transfer. */
export function reconcileEvidencedPayout(s:ReconciliationState,p:PayoutRecord,org:Organization){
 for(const i of p.installments){
  const final=finalRecognition(p,i.id)
  if(!final)continue
  s.payoutRecognitions??=[]
  if(s.payoutRecognitions.some(r=>r.id===final.id))continue
  const prior=s.receivables.find(r=>r.installmentId===i.id)
  const priorFee=prior?.organizationFeeMinor??i.feeRecognizedMinor,priorShare=prior?.amountMinor??0
  s.payoutRecognitions.push(final)
  s.history.push({at:final.at,actor:'Operations evidence',action:'Final evidenced payout receipt recorded; Organization Fee '+final.organizationFeeMinor+' kobo; TCS Revenue Share '+final.tcsShareMinor+' kobo. Original records preserved.',reason:final.decisionId})
  if(priorFee!==final.organizationFeeMinor||prior&&priorShare!==final.tcsShareMinor){
   const previous=s.cases.filter(c=>c.adjustment?.installmentId===i.id).at(-1)
   s.cases.push({id:'fee-adjustment:'+final.decisionId,organizationId:org.id,groupId:p.groupId,cycleId:p.cycleId,roundId:p.roundId,memberId:p.memberId,payoutId:p.id,kind:'fee-adjustment',amountMinor:Math.max(Math.abs(final.organizationFeeMinor-priorFee),Math.abs(final.tcsShareMinor-priorShare)),reason:'FEE / REVENUE SHARE ADJUSTMENT REQUIRED: original recognition differs from final evidenced payout. No credit, refund or money movement executed.',createdAt:final.at,status:'review-required',sourceReference:final.decisionId,adjustment:{decisionId:final.decisionId,installmentId:i.id,previousOrganizationFeeMinor:priorFee,evidencedOrganizationFeeMinor:final.organizationFeeMinor,organizationFeeDifferenceMinor:final.organizationFeeMinor-priorFee,previousTcsShareMinor:priorShare,evidencedTcsShareMinor:final.tcsShareMinor,tcsShareDifferenceMinor:final.tcsShareMinor-priorShare,supersedesCaseId:previous?.id},history:[{at:final.at,actor:'TCS',action:'Financial adjustment required; preserve original postings and later outcome',reason:final.decisionId}]})
  }
  if(!prior&&final.tcsShareMinor>0){
   const dueAt=final.at,paymentReference='TCS-'+encodeURIComponent(org.id)+':'+encodeURIComponent(i.id)
   const plus=(h:number)=>new Date(Date.parse(dueAt)+h*3600000).toISOString()
   s.receivables.push({id:'tcs:'+i.id,organizationId:org.id,groupId:p.groupId,cycleId:p.cycleId,payoutId:p.id,installmentId:i.id,recognizedAt:dueAt,dueAt,sharePercent:p.policy!.tcsSharePercent,paymentReference,account:structuredClone(s.revenueAccount||corestackAccount()),paymentStatus:'not-recorded',payments:[],history:[{at:dueAt,actor:'Operations evidence',action:'Revenue share recognized on final evidenced receipt; no Member confirmation claimed',reason:final.decisionId}],organizationFeeMinor:final.organizationFeeMinor,amountMinor:final.tcsShareMinor,overdueAt:s.policy?plus(s.policy.tcsOverdueHours):undefined,restrictedAt:s.policy?plus(s.policy.tcsRestrictedHours):undefined,status:'due'})
  }
 }
}
