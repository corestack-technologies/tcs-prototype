import type { RestrictionRecord } from './interventionModel'
import type { SourceReview } from './review'
export function PublicRestrictions({records}:{records?:RestrictionRecord[]}){
 if(!records?.length)return null
 return <section className="rounded-xl border border-amber-200 bg-amber-50 p-4 my-4 text-sm"><h2 className="font-semibold">Activity eligibility</h2>{records.filter(r=>r.reviewStatus==='active').length?<p className="mt-2">Not currently eligible for new commitments. Existing contributions, payouts, recovery, disputes and essential account actions remain available.</p>:<p className="mt-2">Applicable restrictions released; history retained.</p>}<details className="mt-2"><summary className="cursor-pointer">Restriction history</summary>{records.map(r=><p className="mt-2" key={r.id}>{r.type.replace(/-/g,' ')}: {r.reviewStatus}. Started {r.startedAt}. {r.releasedAt&&<>Released {r.releasedAt}: {r.removalReason}</>}</p>)}</details></section>
}
export function PublicReview({review}:{review?:SourceReview}){
 if(!review)return null
 return <div className="mt-3 text-sm"><p className="font-semibold">Operations: {review.state}</p>{review.publicMessage&&<p className="mt-1">{review.publicMessage}</p>}{review.evidenceRequests?.map(r=><p key={r.id} className="mt-2">Evidence requested from {r.party}: {r.requested}. Deadline {r.deadline}. {r.responses.length?'Response recorded':r.missedAt?'Deadline missed; case retained':'Awaiting response'}</p>)}{review.escalations?.map((e,i)=><p className="mt-2" key={i}>{e.destination}: {e.reason}</p>)}</div>
}
