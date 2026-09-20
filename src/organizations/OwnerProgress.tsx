/** Presentation only: workflow transitions remain controlled by each screen. */
export function OwnerProgress({current}:{current:number}) {
 return <ol className="owner-workflow" aria-label="Group preparation progress">{['Setup','Recruitment & commitments','Positions','Rules','Readiness','Activation'].map((label,index)=><li key={label} aria-current={index===current?'step':undefined}>{index+1}. {label}</li>)}</ol>
}
