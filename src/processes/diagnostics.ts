import type { InternalSession } from '../access/model.ts'
import { settingsAccess, calendarDate, businessClock, platformSettings, type SettingsState, actualTimestamp } from '../settings/service.ts'
import { protectedHistory } from '../settings/history.ts'
import { processState, successful, needsAttention, processEligible, type ProcessState, type ProcessWorld } from './model.ts'
export function diagnostics(session:InternalSession|null,worlds:ProcessWorld[],state:ProcessState=processState,settings:SettingsState=platformSettings,at=actualTimestamp()){
 settingsAccess(session,'settings.diagnostics.view')
 const clock=businessClock(settings,at),latest=state.runs.filter(successful).at(-1),attention=state.runs.filter(r=>needsAttention(r,state.runs)).at(-1),through=protectedHistory(worlds)
 const eligible=worlds.flatMap(w=>w.groups).filter(processEligible)
 const pendingRounds=eligible.reduce((n,g)=>n+g.cycles.filter(c=>c.status==='activated').reduce((n,c)=>n+(c.active?.rounds.filter(r=>Date.parse(r.schedule.opensAt)<=Date.parse(clock.businessTimestamp)&&!(c.active?.generatedRoundIds||[]).includes(r.id)).length||0),0),0)
 const evaluatedThrough=state.runs.filter(r=>successful(r)&&r.environment===clock.environment).map(r=>r.businessDate).sort().at(-1)
 const catchUp=!evaluatedThrough||evaluatedThrough<clock.businessDate||pendingRounds>0
 return {clock,latest:latest?{id:latest.id,status:latest.status,businessDate:latest.businessDate,completedAt:latest.completedAt}:null,attention:attention?{id:attention.id,status:attention.status,completedAt:attention.completedAt}:null,catchUp,pendingRounds,environmentGroups:eligible.length,protectedThrough:through,warnings:[...(clock.mode==='CONTROLLED'&&clock.businessDate>calendarDate(clock.actualTimestamp)?['Controlled Business Date is ahead of the actual date.']:[]),...(through>clock.businessDate?['Future business records remain preserved. Reset to Real Time does not repair or erase them.']:[]),...(catchUp?['Lifecycle evaluation may require catch-up through the effective Business Date.']:[]),...(attention?['A failed or partially failed run requires attention in Operations.']:[])],persistence:'In-memory prototype only. Reload/reseed clears the dataset and run history together; no cross-browser or durable persistence.',sourceReadiness:'Configuration history and Scheduled Process Run History use implemented source models; empty histories remain empty. No live provider or infrastructure health monitoring exists.'}
}
export type Diagnostics=ReturnType<typeof diagnostics>
