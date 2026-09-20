import { hasPermission } from '../access/authorization.ts'
import type { CaseStatus, InternalSession, OperationsCase } from './model.ts'
import { requireInternal } from './model.ts'
export type InterventionAction = 'member-upheld' | 'organization-accepted' | 'partial-receipt' | 'record-response' | 'submit-appeal' | 'finalize-dispute' | 'exceptional-reopen' | 'restrict-member' | 'suspend-member' | 'restrict-organization' | 'suspend-organization' | 'release-restriction' | 'escalate-supervisor' | 'escalate-legal' | 'escalate-protection' | 'confirm-exit-settlement'
export type DecisionAction = InterventionAction | 'approve' | 'reject' | 'request-information' | 'accept-manual' | 'allocate' | 'correct-link' | 'confirm-match' | 'escalate-provider' | 'keep-open' | 'resolution-required' | 'confirm-receipt' | 'not-confirmed' | 'recommend'
export interface DecisionRecord {
  authority?: import("../access/model.ts").AuthoritySnapshot
  id: string
  caseId: string
  action: DecisionAction
  reviewerId: string
  reviewerName: string
  at: string
  reason: string
  comments: string
  evidence: string[]
  before: Record<string,unknown>
  after: Record<string,unknown>
  effect: string
  policy: string
  initiatingActor?: string
}
export interface SourceReview {
  caseStatus: CaseStatus
  state: string
  publicMessage?: string
  decisions: DecisionRecord[]
  approvalPolicy?: 'normal' | 'independent'
  initiatingActor?: string
  evidenceRequests?: import("./interventionModel.ts").EvidenceRequest[]
  escalations?: {at:string;actor:string;destination:string;reason:string}[]
  recommendedBy?: string
}
export interface DecisionInput {
  disputeId?: string
  requestId?: string
  party?: "Member" | "Organization"
  amountMinor?: number
  evidenceHours?: number
  appealHours?: number
  action: DecisionAction
  reason: string
  comments?: string
  evidence?: string[]
  targetId?: string
  settlementLineReference?: string
  evidenceConfirmed?: boolean
}
export type ReviewKind = 'kyc' | 'organization' | 'account' | 'manual' | 'payment' | 'settlement' | 'revenue' | 'amendment' | 'force-close' | 'termination' | 'intervention'
export function reviewKind(c:OperationsCase):ReviewKind|undefined {
  if(['Fee / Revenue Share Adjustment Required','Payout Dispute','Organization Payout Breach','Post-Payout Recovery','Exit Settlement Breach','Member Restriction Review','Organization Suspension Review','Lifecycle Escalation','Legal / Compliance Review'].includes(c.type))return 'intervention'
  if(c.type==='Member KYC Review')return 'kyc'
  if(c.type==='Organization Application Review')return 'organization'
  if(c.type==='Settlement Account Change Review')return 'account'
  if(c.type==='Manual Contribution Review')return 'manual'
  if(['Amount Mismatch','Unallocated Payment','Advance Payment Exception','Late Optional Contribution','Payment Exception'].includes(c.type))return 'payment'
  if(['Settlement Variance','Settlement Exception'].includes(c.type))return 'settlement'
  if(c.type.startsWith('TCS Revenue Share'))return 'revenue'
  if(c.type==='Cycle Amendment Request')return 'amendment'
  if(c.type==='Force Close Request')return 'force-close'
  if(c.type==='Group Termination Review')return 'termination'
}
export function permittedActions(c:OperationsCase,session:InternalSession|null):DecisionAction[]{
  requireInternal(session)
  if(reviewKind(c)==='intervention')return interventionActions(c,session)
  if(['Resolved','Closed'].includes(c.status))return []
  const kind=reviewKind(c);if(!kind)return []
  if(['account','amendment'].includes(kind)&&c.review?.decisions.some(d=>d.action==='approve'))return []
  const map:Partial<Record<ReviewKind,Partial<Record<DecisionAction,string>>>>={
   kyc:{approve:'clients.verification.approve',reject:'clients.verification.reject','request-information':'clients.verification.request_information'},
   organization:{approve:'organizations.application.approve',reject:'organizations.application.reject','request-information':'organizations.application.request_information'},
   account:{approve:'organizations.settlement_account.review',reject:'organizations.settlement_account.review','request-information':'organizations.settlement_account.review'},
   manual:{'accept-manual':'payments.manual_contribution.review',reject:'payments.manual_contribution.review','request-information':'payments.manual_contribution.review'},
   revenue:{'confirm-receipt':'revenue_share.confirm','not-confirmed':'revenue_share.confirm','request-information':'revenue_share.confirm'},
   payment:{allocate:'payments.exception.review','resolution-required':'payments.exception.review','request-information':'payments.exception.review'},
   settlement:{'correct-link':'payments.reconciliation.correct','confirm-match':'payments.reconciliation.correct','request-information':'payments.exception.review','escalate-provider':'payments.exception.review','keep-open':'payments.exception.review'},
   amendment:{approve:'thrift.amendment.review',reject:'thrift.amendment.review','request-information':'thrift.amendment.review',recommend:'thrift.force_close.recommend'},
   'force-close':{approve:'thrift.force_close.approve',reject:'thrift.force_close.approve','request-information':'thrift.force_close.recommend',recommend:'thrift.force_close.recommend'},
   termination:{approve:'thrift.termination.review',reject:'thrift.termination.review','request-information':'thrift.termination.review',recommend:'thrift.force_close.recommend'},
  }
  return (Object.entries(map[kind]||{}) as [DecisionAction,string][]).filter(([action,p])=>hasPermission(session,p)&&!(action==='allocate'&&!['Amount Mismatch','Unallocated Payment'].includes(c.type))).map(([action])=>action)

}
export const decisionLabels:Record<DecisionAction,string>={'member-upheld':'Uphold Member claim','organization-accepted':'Accept Organization evidence','partial-receipt':'Confirm partial receipt','record-response':'Record party evidence response','submit-appeal':'Record one party appeal','finalize-dispute':'Finalize expired appeal window','exceptional-reopen':'Exceptionally reopen finalized dispute','restrict-member':'Restrict Member new activity','suspend-member':'Suspend Member new activity','restrict-organization':'Restrict Organization new activity','suspend-organization':'Suspend Organization new activity','release-restriction':'Release applicable resolved restriction','escalate-supervisor':'Escalate to Supervisor','escalate-legal':'Escalate to Legal / Compliance','escalate-protection':'Escalate to Member Protection','confirm-exit-settlement':'Confirm evidenced Exit Settlement',approve:'Approve',reject:'Reject / cannot verify','request-information':'Request information','accept-manual':'Accept manual contribution',allocate:'Apply safe allocation','correct-link':'Correct reconciliation link','confirm-match':'Confirm match / reconciled','escalate-provider':'Escalate to provider','keep-open':'Keep exception open','resolution-required':'Refund or reallocation review required','confirm-receipt':'Confirm TCS receipt','not-confirmed':'Mark payment not confirmed',recommend:'Recommend independent approval'}

function interventionActions(c:OperationsCase,session:InternalSession):DecisionAction[]{
 const supervisor=hasPermission(session,'cases.exceptional_reopen')
 if(!hasPermission(session,'disputes.review')&&!hasPermission(session,'restrictions.member.apply')&&!hasPermission(session,'restrictions.organization.apply'))return []
 const a:DecisionAction[]=[]
 if(c.disputeProcesses?.length){
  const ds=c.disputeProcesses
  if(ds.some(d=>!d.process||['investigation','exceptionally-reopened'].includes(d.process.stage)||d.process.stage==='appeal-pending'&&d.process.resolutions[0]?.reviewerId!==session.personaId))a.push('member-upheld','organization-accepted','partial-receipt')
  if(ds.some(d=>d.process?.stage==='appeal-available'))a.push('submit-appeal','finalize-dispute')
  if(supervisor&&ds.some(d=>d.process?.stage==='final'))a.push('exceptional-reopen')
 }
 if(!['Resolved','Closed'].includes(c.status))a.push('request-information','record-response','escalate-supervisor','escalate-provider','escalate-legal','escalate-protection','keep-open')
 if(c.type==='Exit Settlement Breach'&&c.status!=='Resolved')a.push('confirm-exit-settlement')
 if(hasPermission(session,'restrictions.member.apply')||hasPermission(session,'restrictions.organization.apply')){
  if(c.type==='Post-Payout Recovery'||c.type==='Member Restriction Review')a.push('restrict-member','suspend-member')
  if(['Organization Payout Breach','Exit Settlement Breach','Organization Suspension Review','Legal / Compliance Review'].includes(c.type)||c.type==='Payout Dispute'&&c.context.some(f=>f.label==='Organization breach'&&f.value==='Open'))a.push('restrict-organization','suspend-organization')
  a.push('release-restriction')
 }
 return a.filter(action=>{
  if(['member-upheld','organization-accepted','partial-receipt'].includes(action))return hasPermission(session,'disputes.decide')&&(!c.disputeProcesses?.some(d=>d.process?.stage==='appeal-pending')||hasPermission(session,'disputes.appeal_review'))
  if(action==='exceptional-reopen')return hasPermission(session,'cases.exceptional_reopen')
  if(['restrict-member','suspend-member'].includes(action))return hasPermission(session,'restrictions.member.apply')
  if(['restrict-organization','suspend-organization'].includes(action))return hasPermission(session,'restrictions.organization.apply')
  if(action==='release-restriction')return hasPermission(session,c.memberId&&['Post-Payout Recovery','Member Restriction Review'].includes(c.type)?'restrictions.member.apply':'restrictions.organization.apply')
  return hasPermission(session,'disputes.review')
 })
}
