import type { RecoveryCase } from './model.ts'
import { minor } from '../payments/model.ts'
/** Original aggregate recovered amount is retained. Allocation is derived, principal first. */
export function recoveryBalances(r:RecoveryCase){
 const principal=minor(r.principalMinor),penalty=minor(r.penaltyMinor),recovered=minor(r.recoveredMinor)
 const waived=minor((r.penaltyWaivers||[]).reduce((n,w)=>n+w.amountMinor,0))
 const validWaivers=(r.penaltyWaivers||[]).every(w=>w.reason.trim().length>=10&&w.evidence.length>0&&!!w.authority&&Number.isFinite(Date.parse(w.at)))
 const principalRecovered=Math.min(principal,recovered)
 const penaltyRecovered=Math.min(penalty,Math.max(0,recovered-principal))
 const overpayment=Math.max(0,recovered-principal-Math.max(0,penalty-waived))
 const exception=!validWaivers||waived>penalty||overpayment>0
 const principalOutstanding=principal-principalRecovered,penaltyOutstanding=Math.max(0,penalty-penaltyRecovered-waived)
 return {principalRecovered,penaltyRecovered,principalOutstanding,penaltyOutstanding,penaltyWaived:waived,outstanding:minor(principalOutstanding+penaltyOutstanding),excessMinor:overpayment,exception,cleared:!exception&&principalOutstanding===0&&penaltyOutstanding===0}
}
