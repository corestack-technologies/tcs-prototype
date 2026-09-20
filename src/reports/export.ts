import type { ReportResult, ReportFilters } from './model.ts'
import type { InternalSession } from '../access/model.ts'
import { generateInternalReport, type InternalReportSources } from './internalService.ts'

// Low-level formatter receives an already-authorized projection, never raw source objects.
// Export entry points regenerate the projection under current authorization.
export function reportCsv(report: ReportResult, actor = report.actor || 'Authenticated workspace actor') {
 const cell=(v:unknown)=>{
  let text=v===null||v===undefined?'Not available':String(v)
  if(typeof v!=='number'&&(/^[\t\r\n]/.test(text)||/^\s*[=+@-]/.test(text)))text="'"+text
  return '"'+text.replace(/"/g,'""')+'"'
 }
 const line=(values:unknown[])=>values.map(cell).join(',')
 const metadata=[['Report',report.definition.name],['Generated at',report.generatedAt],['Actor',actor],['Filters',JSON.stringify(report.filters)],['Row count',report.rows.length],['Reference dates',report.references.join('; ')||'Not recorded'],['Currency / units','NGN / integer minor units (kobo)'],['Notices',report.notices.join('; ')]]
 return '\uFEFF'+[...metadata.map(line),'',line([...report.definition.columns.map(c=>c.label),'Source kind','Source ID']),...report.rows.map(r=>line([...report.definition.columns.map(c=>r.values[c.key]??null),r.source.kind,r.source.id]))].join('\r\n')+'\r\n'
}
export function exportInternalReport(sources:InternalReportSources,session:InternalSession|null,id:string,filters:ReportFilters={},at?:string){
 return reportCsv(generateInternalReport(sources,session,id,filters,at))
}
export function downloadCsv(csv:string,name:string){
 const url=URL.createObjectURL(new Blob([csv],{type:'text/csv;charset=utf-8'})),link=document.createElement('a')
 link.href=url;link.download=name.replace(/[^a-z0-9-]/gi,'-')+'.csv';link.click();setTimeout(()=>URL.revokeObjectURL(url),0)
}
