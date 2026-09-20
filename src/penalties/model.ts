export interface PenaltyAccrual {
 id:string;cycleId:string;roundId:string;obligationId:string;componentId:string;memberId:string;position:number;
 accrualDate:string;businessAt:string;principalBasisMinor:number;dailyRateBps:number;amountMinor:number;status:'ACCRUED';recordedAt:string
}
export interface PenaltyWaiver {id:string;accrualId:string;amountMinor:number;actor:string;reason:string;at:string}
export interface DefaultEvent {id:string;cycleId:string;memberId:string;obligationId:string;thresholdAt:string;businessAt:string;recordedAt:string;principalOutstandingMinor:number;recoveryId:string;status:'POST_PAYOUT_DEFAULT'}
export interface PenaltyLedger {accruals:PenaltyAccrual[];waivers:PenaltyWaiver[];defaults:DefaultEvent[]}
export const emptyPenalties=():PenaltyLedger=>({accruals:[],waivers:[],defaults:[]})
