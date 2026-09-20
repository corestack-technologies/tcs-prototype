// Prototype policy; review before production. A daily-rate ceiling, never an accrued-balance cap.
export const PROTOTYPE_DAILY_PENALTY_CEILING_BPS = 10
export interface PenaltyPlatformPolicy { maxDailyPenaltyRateBps:number|null }
export const penaltyPolicy=():PenaltyPlatformPolicy=>({maxDailyPenaltyRateBps:PROTOTYPE_DAILY_PENALTY_CEILING_BPS})
export function validatePenaltyRate(rate:number,policy=penaltyPolicy()){
 if(!Number.isSafeInteger(rate)||rate<0)throw Error('Daily penalty rate must be a non-negative integer in basis points.')
 if(rate>0&&(policy.maxDailyPenaltyRateBps===null||rate>policy.maxDailyPenaltyRateBps))throw Error('Daily penalty rate exceeds the configured platform ceiling, or that ceiling is not yet configured.')
}
export function dailyPenalty(principal:number,rate:number){
 if(!Number.isSafeInteger(principal)||principal<0||!Number.isSafeInteger(rate)||rate<0)throw Error('Invalid integer penalty basis or rate.')
 const result=(BigInt(principal)*BigInt(rate)+5000n)/10000n
 if(result>BigInt(Number.MAX_SAFE_INTEGER))throw Error('Penalty exceeds safe minor-unit limits.')
 return Number(result)
}
