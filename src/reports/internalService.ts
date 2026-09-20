import { readRuns } from '../processes/service.ts'
import { platformSettings, readHistory, settingsAccess } from '../settings/service.ts'
import { securityReportEvents } from '../access/security.ts'
import type { InternalSession } from '../access/model.ts'
import { currentUser, hasPermission, requirePermission } from '../access/authorization.ts'
import { fullName } from '../clients/model.ts'
import { ageHours, isResolved, type Triage } from '../operations/model.ts'
import { projectReportingCases, type OperationsSources } from '../operations/sources.ts'
import { generateReport } from './service.ts'
import { internalCatalogue } from './internalCatalogue.ts'
import type { Cell, ReportFilters, ReportResult, ReportRow } from './model.ts'

export interface InternalReportSources extends OperationsSources { triage?: Record<string, Triage> }
const sum = (values: number[]) => values.reduce((a,b) => { if (!Number.isSafeInteger(b) || !Number.isSafeInteger(a+b)) throw Error('Unsafe report money total.'); return a+b },0)
const elapsed = (start: string, end: string) => Number.isFinite(Date.parse(start)) && Number.isFinite(Date.parse(end)) ? Math.max(0,Math.floor((Date.parse(end)-Date.parse(start))/3600000)) : null
const ageBand = (hours: number | null) => hours === null ? 'Unavailable' : hours < 24 ? 'Under 1 day' : hours < 168 ? '1–7 days' : '7+ days'
const restricted = (v: { restrictions?: { reviewStatus: string }[] }) => v.restrictions?.some(r=>r.reviewStatus==='active') ? 'Active restriction' : 'None'
export function availableInternalReports(session: InternalSession | null) { return internalCatalogue.filter(d => hasPermission(session,d.permission!) && (d.category!=='Scheduled Processes'||hasPermission(session,'operations.process.view')) && (d.category!=='Configuration'||hasPermission(session,'settings.view')&&hasPermission(session,'settings.audit.view')&&(d.id!=='internal-business-date'||hasPermission(session,'settings.business_date.view')))) }

/** Readable allowlist, not JSON serialization of arbitrary audit source objects. */
export function auditState(value: unknown): string {
 if (value === null || value === undefined) return 'Not recorded'
 if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') return String(value)
 if (Array.isArray(value)) return value.filter(v=>typeof v==='string').join(', ') || 'Structured state retained in source audit'
 if (typeof value !== 'object') return 'Not recorded'
 const record=value as Record<string,unknown>,parts:string[]=[]
 for(const k of ['id','name','status','active','roleIds','permissions','locked','failedAttempts']) if(k in record)parts.push(k+': '+auditState(record[k]))
 return parts.join('; ') || 'Structured state retained in source audit'
}

export function generateInternalReport(s: InternalReportSources, session: InternalSession | null, id: string, filters: ReportFilters = {}, at = new Date().toISOString()): ReportResult {
 const d=internalCatalogue.find(d=>d.id===id)
 if(!d)throw Error('Access denied: unknown internal report.')
 requirePermission(session,d.permission!)
 if(d.category==='Scheduled Processes')requirePermission(session,'operations.process.view')
 if(d.category==='Configuration'){settingsAccess(session,'settings.audit.view');if(id==='internal-business-date')settingsAccess(session,'settings.business_date.view')}
 if(d.availability!=='Available')throw Error('Report planned: awaiting source module.')
 if(!Number.isFinite(Date.parse(at)))throw Error('Invalid report timestamp.')
 for(const value of [filters.from,filters.to])if(value&&(!/^\d{4}-\d{2}-\d{2}$/.test(value)||!Number.isFinite(Date.parse(value))))throw Error('Invalid report date filter.')
 if(filters.from&&filters.to&&filters.from>filters.to)throw Error('From date must not follow To date.')
 const rows:ReportRow[]=[],seen=new Set<string>(),references=new Set<string>(),notices=new Set<string>()
 const kind=id.slice(9), user=currentUser(session)!
 const orgName=(id:string)=>s.organizations.find(o=>o.id===id)?.form.name||id
 const memberName=(id:string)=>{const m=s.clients.find(m=>m.id===id);return m?fullName(m):id}
 const add=(sourceKind:string,sourceId:string,date:string,values:Record<string,Cell>,detail:Record<string,Cell>={},scope:Partial<Pick<ReportRow,'organizationId'|'groupId'|'cycleId'|'roundId'|'memberId'>>={})=>{
  const key=sourceKind+':'+(scope.organizationId||'')+':'+sourceId
  if(seen.has(key))return
  seen.add(key)
  rows.push({id:key,date,organizationId:'',groupId:'',cycleId:'',roundId:'',memberId:'',...scope,values:{organization:scope.organizationId?orgName(scope.organizationId):'',member:scope.memberId?memberName(scope.memberId):'',date,...values},detail,source:{kind:sourceKind,id:sourceId}})
 }
 if(kind==='business-date'||kind==='runtime-controls')for(const e of readHistory(session,platformSettings))if(e.category===(kind==='business-date'?'Business Date':'Runtime Control'))add('configuration',e.id,e.at,{actor:e.actor,type:e.action,before:e.before,after:e.after,reason:e.reason,environment:e.environment},{'Actor ID':e.actorId})
 if(kind==='process-runs')for(const r of readRuns(session))add('process-run',r.id,r.startedAt,{reference:r.id,type:r.definition.key,businessDate:r.businessDate,trigger:r.trigger,actor:r.actor.name,completedAt:r.completedAt,status:r.status,evaluated:r.evaluated,changed:r.changed,failures:r.failed,retryOf:r.retryOf||'None',failedOnly:['FAILED','PARTIAL_FAILURE'].includes(r.status)?'Yes':'No',runs:1,successful:r.status==='COMPLETED'?1:0,noop:r.status==='COMPLETED_WITH_NO_CHANGES'?1:0,partial:r.status==='PARTIAL_FAILURE'?1:0,failed:r.status==='FAILED'?1:0},{'Reason':r.reason,'Environment':r.environment,'Mode':r.mode,'Step results':r.steps.map(s=>s.name+': '+s.status+' / changed '+s.changed+' / failed '+s.failed).join('; '),'Errors':r.errors.join('; ')||'None'})
 const needsCases=['overview','payments','cases','activity','exits'].includes(kind)
 const cases=needsCases?projectReportingCases(s,session,s.triage||{}):[]
 const groups=s.worlds.flatMap(w=>w.groups)
 const scopeCase=(c:typeof cases[number])=>({organizationId:c.organizationId||'',groupId:c.groupId||'',cycleId:c.cycleId||'',roundId:c.roundId||'',memberId:c.memberId||''})
 // Reuse the approved 7A projections, inside this already-authorized cross-tenant read.
 // This does not sign in as an Owner or grant any action/tenant authority.
 const business=(reportId:string)=>s.organizations.flatMap(org=>{
  const result=generateReport({organizations:[{id:org.id,name:org.form.name,ownerMemberId:org.ownerMemberId,workspace:true}],worlds:s.worlds},{kind:'organization',memberId:org.ownerMemberId,organizationId:org.id},reportId,{},at)
  for(const ref of result.references)references.add(ref)
  for(const n of result.notices)notices.add(n)
  return result.rows
 })
 const adopt=(row:ReportRow,values:Record<string,Cell>={},detail:Record<string,Cell>={})=>add(row.source.kind,row.source.id,row.date,{...row.values,...values},{...row.detail,...detail},row)
 if(kind==='overview'){
  for(const m of s.clients)add('member',m.id,m.history.find(h=>/account created/i.test(h.action))?.at||'',{entity:fullName(m),type:'Member',status:m.accountStatus,members:1,verified:m.verification.status==='verified'?1:0,restricted:m.accountStatus==='suspended'||restricted(m)!=='None'?1:0},{},{memberId:m.id})
  for(const o of s.organizations)add('organization',o.id,o.application.submittedAt||'',{entity:o.form.name,type:'Organization',status:o.status,organizations:1,activeOrganizations:['approved','active'].includes(o.status)?1:0},{},{organizationId:o.id})
  for(const g of groups){add('group',g.id,g.history[0]?.at||'',{entity:g.name,type:'Group',status:'Recorded',groups:1},{},{organizationId:g.organizationId,groupId:g.id});for(const c of g.cycles)add('cycle',c.id,c.activatedAt||'',{entity:g.name+' / Cycle '+c.number,type:'Cycle',status:c.status,activeCycles:c.status==='activated'?1:0,completedCycles:c.status.startsWith('completed')?1:0,forceClosed:c.status==='force-closed'?1:0},{},{organizationId:g.organizationId,groupId:g.id,cycleId:c.id})}
  for(const c of cases)if(!isResolved(c))add('case',c.id,c.createdAt,{entity:c.reference,type:'Operations case',status:c.status,activeCases:1,paymentExceptions:c.category==='Financial Exceptions'&&c.module==='Payments'&&!c.type.startsWith('TCS')?1:0,disputes:c.type==='Payout Dispute'?1:0,defaults:c.type==='Post-Payout Recovery'?1:0,breaches:c.type==='Organization Payout Breach'?1:0},{'Case type':c.type},scopeCase(c))
  notices.add('Metrics count different source record types and are not additive. Select a metric to see its records.')
 }
 if(kind==='growth'){
  for(const m of s.clients){
   const registration=m.history.find(h=>/account created/i.test(h.action)),verification=m.history.find(h=>/identity verified/i.test(h.action)),decision=m.verification.review?.decisions.find(x=>x.action==='approve')
   for(const [type,date] of [['Member registration',registration?.at],...(m.verification.status==='verified'||verification||decision?[['Member verified',decision?.at||verification?.at]]:[])] as [string,string|undefined][])add('growth',m.id+':'+type,date||'',{entity:fullName(m),type,status:date?'Dated source event':'Date unavailable',events:1},{'Current verification state':m.verification.status},{memberId:m.id})
  }
  for(const o of s.organizations){
   const approved=o.application.review?.decisions.find(x=>x.action==='approve')?.at||o.history.find(h=>h.after==='approved')?.at
   const events:[string,string|undefined][]=[]
   if(o.application.submittedAt||o.status!=='draft')events.push(['Organization application',o.application.submittedAt])
   if(approved||['approved','active','restricted','suspended','closure-pending','closed'].includes(o.status))events.push(['Organization approved',approved])
   if(o.activatedAt)events.push(['Organization activated',o.activatedAt])
   for(const [type,date] of events)add('growth',o.id+':'+type,date||'',{entity:o.form.name,type,status:date?'Dated source event':'Date unavailable',events:1},{'Current Organization state':o.status},{organizationId:o.id})
  }
  notices.add('Undated events are retained as unavailable, excluded by date-range filters, and never assigned an invented historical date. Counts are source events, not unique people across event types.')
 }
 if(kind==='cycles')for(const row of business('organization-cycles')){
  const g=groups.find(g=>g.id===row.groupId&&g.organizationId===row.organizationId),c=g?.cycles.find(c=>c.id===row.cycleId)
  add(row.source.kind,row.source.id,row.date,Object.fromEntries(d.columns.map(col=>[col.key,row.values[col.key]??null])), {'Group created':g?.history.find(h=>/created/i.test(h.action))?.at||'Not recorded','Cycle activated':c?.activatedAt||'Not recorded','Cycle completed':c?.completedAt||'Not recorded','Cycle cancelled':c?.cancelledAt||'Not recorded'}, {organizationId:row.organizationId,groupId:row.groupId,cycleId:row.cycleId})
 }
 const mappings:Record<string,string>={revenue:'organization-revenue',payouts:'organization-payouts',recovery:'organization-recovery',exits:'organization-exits'}
 if(mappings[kind])for(const row of business(mappings[kind])){
  const org=s.organizations.find(o=>o.id===row.organizationId)!,world=s.worlds.find(w=>w.finance?.organizationId===org.id)
  if(kind==='payouts'){
   if(['Completed','Scheduled'].includes(String(row.values.status))&&!Number(row.values.outstanding))continue
   if(row.source.kind==='scheduled-payout')continue
   adopt(row,{dispute:row.detail.Dispute||'None',restriction:restricted(org)})
  }else if(kind==='revenue'){
   const r=world?.finance?.receivables.find(r=>r.id===row.source.id)
   if(!r)continue
   const aging=r.paymentStatus==='settled'?'Settled':r.paymentStatus==='exception'?'Payment Exception':r.paymentStatus==='awaiting-confirmation'?'Awaiting TCS Confirmation':['overdue','restricted'].includes(r.status)?'Overdue':r.dueAt?'Current':'Due date unavailable'
   adopt(row,{shareRate:r.sharePercent,aging,restriction:r.status==='restricted'?'Commercially restricted':restricted(org)},{'Payout':r.payoutId,'Installment':r.installmentId,'Original due date':r.dueAt||null,'Age hours':elapsed(r.dueAt,world?.finance?.referenceAt||at),'Aging basis':'Source state and configured due/overdue dates; no new threshold'})
  }else if(kind==='exits'){
   const linked=cases.filter(c=>c.groupId===row.groupId&&c.cycleId===row.cycleId&&c.memberId===row.memberId&&c.type.includes('Exit Settlement'))
   adopt(row,{ageHours:elapsed(row.date,[at,...references].sort().at(-1)!),restriction:restricted(org)},{'Operations case':linked.map(c=>c.reference).join(', ')||'None'})
  }else adopt(row)
 }
 if(kind==='financial'){
  for(const row of business('organization-collections'))adopt(row,{type:'Contribution obligation',principal:row.values.outstanding,penalty:row.values.penaltyOutstanding})
  for(const row of business('organization-payouts'))adopt(row,{type:row.source.kind==='scheduled-payout'?'Scheduled payout projection':'Payout execution',payoutOutstanding:row.values.outstanding})
  for(const row of business('organization-fees'))adopt(row,{type:'Organization fee installment',feePosted:row.values.recordedFee,feeRecognized:row.values.recognized,feeAdjustment:row.values.adjustment},{'Recognition adjustment':row.values.adjustment})
  for(const row of business('organization-revenue'))adopt(row,{type:'Posted TCS share',shareDue:row.values.due,shareConfirmed:row.values.confirmed,shareOutstanding:row.values.outstanding,shareAdjustment:row.values.adjustment},{'Share adjustment':row.values.adjustment})
  notices.add('Contributions and payouts are Member/Organization activity, not Corestack-owned funds. TCS share postings and their adjustment requirements remain separate. Scheduled payout rows are projections, not executed transfers.')
 }
 if(kind==='cases'||kind==='payments')for(const c of cases){
  if(kind==='payments'&&!(c.module==='Payments'&&c.category==='Financial Exceptions'&&!c.type.startsWith('TCS Revenue')))continue
  const g=groups.find(g=>g.id===c.groupId&&g.organizationId===c.organizationId),transaction=g?.payments?.transactions.find(t=>t.id===c.related?.paymentId||t.id===c.source.id)
  const hours=Math.floor(ageHours(c,at)),assignee=session.access.users.find(u=>u.id===c.assignee)
  add('case',c.id,c.createdAt,{reference:c.reference,type:c.type,module:c.module,priority:c.priority,assignee:assignee?.name||c.assignee||'Unassigned',assigneeId:c.assignee||'',team:assignee?.roleIds.some(r=>user.roleIds.includes(r))?'My roles':'Other / unassigned',ageHours:hours,age:ageBand(hours),status:c.status,amount:c.amountMinor??null,source:c.source.kind,allocation:transaction?.allocationStatus||c.sourceStatus,lastActivity:[c.createdAt,...c.timeline.map(t=>t.at),...(c.review?.decisions.map(d=>d.at)||[])].sort().at(-1)!,awaiting:c.status.startsWith('Awaiting')?c.status:'None',group:g?.name||c.groupId||'',cycle:c.cycleId||''},{'Source record':c.source.id,'Source status':c.sourceStatus,'Resolution':c.resolvedAt||'Unresolved','Age basis':isResolved(c)?'Duration to recorded resolution':'Elapsed source/reference time; no SLA breach inferred'},scopeCase(c))
  if(c.referenceAt)references.add(c.referenceAt)
 }
 if(kind==='cases')notices.add('My roles uses shared Role membership of the current assignee; no separate team model or SLA is configured.')
 if(kind==='reconciliation')for(const world of s.worlds)if(world.finance)for(const settlement of world.finance.settlements){
  const f=world.finance,expectations=f.expectations.filter(e=>settlement.matchedTransactionIds.includes(e.transactionId)),complete=expectations.length===new Set(settlement.matchedTransactionIds).size&&expectations.length>0
  add('settlement',settlement.id,settlement.settledAt,{organization:orgName(f.organizationId),reference:settlement.reference,provider:settlement.provider,linked:new Set(settlement.matchedTransactionIds).size,expectedGross:complete?sum(expectations.map(e=>e.grossMinor)):null,gross:settlement.grossMinor,fees:settlement.processingFeeMinor,deductions:settlement.otherDeductionsMinor,expectedNet:complete&&expectations.every(e=>e.expectedNetMinor!==undefined)?sum(expectations.map(e=>e.expectedNetMinor!)):null,actualNet:settlement.netMinor,variance:settlement.varianceMinor,status:settlement.status},{'Related financial cases':f.cases.filter(c=>c.settlementId===settlement.id).map(c=>c.id+': '+c.status).join('; ')||'None','Original provider gross (minor)':settlement.grossMinor,'Expected amounts basis':'Linked full-transaction expectations only; they can recur across partial settlements and are not totaled across settlement rows. Missing expectations are unavailable, not zero.'},{organizationId:f.organizationId})
  if(f.referenceAt)references.add(f.referenceAt)
 }
 if(kind==='disputes')for(const g of groups)for(const p of g.payouts?.records||[])for(const dispute of p.disputes){
  const process=dispute.process,i=p.installments.find(i=>i.id===dispute.installmentId)
  add('dispute',dispute.id,dispute.at,{organization:orgName(g.organizationId),group:g.name,cycle:p.cycleId,member:memberName(p.memberId),reference:dispute.id,amount:i?.amountMinor??null,type:'Payout dispute',initialDecision:process?.resolutions.find(r=>r.phase==='initial')?.outcome||'Not decided',appeal:process?.appeal?process.appeal.finalizedAt?'Finalized':'Submitted':'Not submitted',appealReviewer:process?.appeal?.reviewerId||'None',deadline:process?.requests.map(r=>r.party+': '+r.deadline+(r.missedAt?' / missed':'')).join('; ')||'Not configured',reopened:process?.reopenings.length?'Yes':'No',status:process?.stage||dispute.status},{'Resolution history':process?.resolutions.map(r=>r.at+': '+r.phase+' / '+r.outcome+' / received '+r.receivedMinor+' kobo / reviewer '+r.reviewerId).join('; ')||'None','Reopening history':process?.reopenings.map(r=>r.at+' / '+r.actor+' / previous final '+r.previousFinalizedAt).join('; ')||'None','Organization responsibility':'No Corestack reimbursement action is provided.'},{organizationId:g.organizationId,groupId:g.id,cycleId:p.cycleId,roundId:p.roundId,memberId:p.memberId})
 }
 if(kind==='disputes')for(const g of groups)for(const dispute of g.lifecycle?.disputes||[]){
  if(g.payouts?.records.some(p=>p.disputes.some(d=>d.id===dispute.id||d.installmentId+'-dispute'===dispute.id)))continue
  const exit=g.lifecycle?.exits.find(e=>e.id===dispute.exitId)
  add('lifecycle-dispute',dispute.id,'',{organization:orgName(g.organizationId),group:g.name,cycle:dispute.cycleId,member:exit?memberName(exit.memberId):'',reference:dispute.id,type:dispute.kind,amount:exit?.settlement.dueMinor??null,initialDecision:dispute.review?.decisions[0]?.action||'Not recorded',appeal:'No appeal process recorded',appealReviewer:'None',deadline:'Not configured',reopened:'Not recorded',status:dispute.status},{'Date basis':'Dispute creation timestamp is not recorded on this legacy source. No historical date inferred.'},{organizationId:g.organizationId,groupId:g.id,cycleId:dispute.cycleId,memberId:exit?.memberId||''})
 }
 if(kind==='access'||kind==='activity'&&hasPermission(session,'reports.access_audit.view'))for(const e of session.access.history){
  const snapshot=e.after&&typeof e.after==='object'?e.after:e.before
  const targetName=snapshot&&typeof snapshot==='object'&&'name' in snapshot&&typeof snapshot.name==='string'?snapshot.name:''
  add('access-audit',e.id,e.at,{actor:e.actor.name,target:e.target,type:e.action,before:auditState(e.before),after:auditState(e.after),reason:e.reason,privileged:e.privileged?'Yes':'No',authority:e.actor.roles.map(r=>r.name).join(', ')},{'Target at event':targetName||e.target,'Historical permissions':e.actor.permissions.join(', ')})
 }
 if(kind==='security'){
  const events=securityReportEvents(session),correlated=new Set<string>()
  for(const e of events){
   if(e.accessChangeId&&correlated.has(e.accessChangeId))continue
   if(e.accessChangeId)correlated.add(e.accessChangeId)
   const u=session.access.users.find(u=>u.id===e.userId),ss=session.access.security?.sessions.find(s=>s.id===e.sessionId)
   add('security-event',e.id,e.at,{user:u?.name||e.userId||'Unknown user',target:e.userId||'',type:e.type,context:e.context||ss?.device||'Not recorded',result:e.result,actor:e.actor?.name||'Prototype authentication',session:e.sessionId||'',reason:e.reason,correlation:e.accessChangeId||''},{'Context':'Simulated prototype security; no real tokens or production-security claims.','Correlation':'Linked Access Audit events are not duplicated in this report.'})
  }
  notices.add('Simulated prototype security events only. Access Audit and Security Events are separate event streams; linked business actions must not be counted twice.')
 }
 if(kind==='activity')for(const c of cases)for(const decision of c.review?.decisions||[])add('decision',decision.id,decision.at,{actor:decision.authority?.name||decision.reviewerName,target:c.source.id,type:decision.action,authority:decision.authority?.roles.map(r=>r.name).join(', ')||'Historical authority not recorded',organization:c.organization||'',member:c.member||'',group:c.groupId||'',cycle:c.cycleId||''},{'Case reference':c.reference,'Policy basis':decision.policy,'Original authority permissions':decision.authority?.permissions.join(', ')||'Not recorded'},scopeCase(c))
 const dimension=(r:ReportRow,k:string)=>k in r?String(r[k as keyof ReportRow]):String(r.values[k]??'')
 const options:ReportResult['options']={}
 for(const key of d.filters)options[key]=[...new Map(rows.map(r=>[dimension(r,key),String(r.values[key==='organizationId'?'organization':key==='groupId'?'group':key==='cycleId'?'cycle':key]||dimension(r,key))])).entries()].filter(([value])=>!!value).map(([value,label])=>({value,label}))
 if(filters.metric&&!d.columns.some(c=>c.key===filters.metric&&c.total))throw Error('Unknown report metric.')
 const filtered=rows.filter(r=>(!filters.metric||Number(r.values[filters.metric]||0)!==0)&&d.filters.every(k=>!filters[k as keyof ReportFilters]||dimension(r,k)===filters[k as keyof ReportFilters])&&(!filters.from||r.date.slice(0,10)>=filters.from)&&(!filters.to||!!r.date&&r.date.slice(0,10)<=filters.to)&&(!filters.search||[...Object.values(r.values),r.source.id].join(' ').toLowerCase().includes(filters.search.toLowerCase())))
 filtered.sort((a,b)=>filters.sort==='outstanding'?Number(b.values.outstanding||0)-Number(a.values.outstanding||0)||a.id.localeCompare(b.id):(filters.sort==='oldest'?1:-1)*a.date.localeCompare(b.date)||a.id.localeCompare(b.id))
 const summaries=d.columns.filter(c=>c.total).map(c=>({key:c.key,label:c.label,type:c.type,value:c.type==='money'?sum(filtered.map(r=>Number(r.values[c.key]||0))):filtered.reduce((n,r)=>n+Number(r.values[c.key]||0),0)}))
 if(filtered.some(r=>d.columns.some(c=>c.type==='money'&&r.values[c.key]===null)))notices.add('Unavailable financial values are not established zeroes. Totals include known amounts only.')
 if(filtered.some(r=>!r.date))notices.add('Some records have no source date. Date filters exclude those records.')
 return {definition:d,rows:filtered,summaries,options,filters:{...filters},generatedAt:at,actor:user.name+' ('+user.id+')',references:[...references].sort(),notices:[...notices],empty:'No matching source records. Load existing scenarios in their source workspace or adjust filters.',export:{version:1,currency:'NGN',moneyUnit:'minor',reportId:id,columns:d.columns,filters:{...filters}}}
}
