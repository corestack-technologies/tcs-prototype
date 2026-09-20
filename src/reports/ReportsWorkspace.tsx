import { PageHeader, EmptyState, StatusBadge, DisplayDate } from '../design/foundation'
import { formatDate, formatMoneyMinor } from '../design/format'
import { useState, useRef } from 'react'
import { downloadCsv, reportCsv } from './export'
import type { NavMeta, View } from '../App'
import { ClientShell } from '../clients/ClientShell'
import { OwnerShell } from '../components/org/OwnerShell'
import { useGroups } from '../groups/GroupContext'
import { useClient } from '../clients/ClientContext'
import { useOrganization } from '../organizations/OrganizationContext'
import { hasWorkspace } from '../organizations/model'
import { catalogueFor } from './catalogue'
import type { Audience, Cell, ReportColumn, ReportFilters, ReportResult, ReportDefinition, ReportRow } from './model'


const control = 'w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm'
const display = (value: Cell | undefined, column: ReportColumn) => value === null || value === undefined ? 'Not established' : column.type === 'money' ? formatMoneyMinor(Number(value)) : column.type === 'date' ? formatDate(String(value)) : String(value)
export function ReportTable({ result, openSource }: { result: ReportResult; openSource?: (row:ReportRow)=>void }) {
  const columns = result.definition.columns
  return <section aria-label="Report results" className="space-y-4">
    <p className="text-sm text-slate-600">{result.rows.length} source rows · Select a row’s details to inspect its source references.</p>
    {!result.rows.length ? <EmptyState title={result.empty} description="Adjust your filters or return after activity has been recorded." /> : <div className="space-y-3">{result.rows.map(row => <article key={row.id} className="rounded-xl border border-slate-200 bg-white p-4 sm:p-5">
      <div className="mb-3 flex flex-wrap items-start justify-between gap-2"><h3 className="font-semibold text-slate-900">{row.values.group || row.values.entity || row.values.reference || row.values.type || row.source.kind}{row.values.cycle ? ` / Cycle ${row.values.cycle}` : ''}{row.values.round ? ` · Round ${row.values.round}` : ''}{row.values.member ? ` · ${row.values.member}` : ''}</h3><StatusBadge status={String(row.values.status || "Not established")} /></div>
      <dl className="grid grid-cols-1 min-[390px]:grid-cols-2 gap-x-6 gap-y-3 md:grid-cols-3 xl:grid-cols-4">{columns.filter(c => !['group', 'cycle', 'round', 'member', 'status'].includes(c.key)).map(c => <div key={c.key} className="min-w-0"><dt className="text-xs text-slate-500">{c.label}</dt><dd className="mt-1 break-words text-sm font-medium text-slate-800">{display(row.values[c.key], c)}</dd></div>)}</dl>
      {openSource && row.source.kind === 'case' && <button className="mt-3 text-sm font-semibold text-blue-800" onClick={() => openSource(row)}>Open controlled Operations case</button>}
      <details className="mt-4 border-t border-slate-100 pt-3"><summary className="cursor-pointer text-sm font-semibold text-blue-800">Source record & details</summary><dl className="mt-3 grid gap-3 sm:grid-cols-2"><div><dt className="text-xs text-slate-500">{row.source.kind}</dt><dd className="break-all text-sm">{row.source.id}</dd></div>{Object.entries(row.detail).map(([key, value]) => <div key={key}><dt className="text-xs text-slate-500">{key}</dt><dd className="break-words text-sm">{value === null ? 'Not established' : value === '' ? 'None' : value}</dd></div>)}</dl></details>
    </article>)}</div>}
  </section>
}
export function ReportBody({ audience, report, initialReport, definitions: suppliedDefinitions, exportReport, openSource }: { audience: Audience; report: (id: string, filters?: ReportFilters) => ReportResult; initialReport?: string; definitions?: ReportDefinition[]; exportReport?: (id:string,filters:ReportFilters)=>string; openSource?: (row:ReportRow)=>void }) {
  const definitions = suppliedDefinitions || catalogueFor(audience)
  const [id, setId] = useState(initialReport || ''), [filters, setFilters] = useState<ReportFilters>({}), [, refresh] = useState(0)
  const FilterPanel = audience === "internal" ? "details" : "div"
  const definition = definitions.find(d => d.id === id)
  const resultsRef = useRef<HTMLElement>(null)
  const [metric, setMetric] = useState(''), [exportError, setExportError] = useState('')
  let result: ReportResult | undefined, error = ''
  if (definition) try { result = report(id, {...filters,metric:metric||undefined}) } catch (e) { error = e instanceof Error ? e.message : 'Report unavailable.' }
  const change = (key: keyof ReportFilters, value: string) => setFilters(f => ({ ...f, [key]: value || undefined }))
  const labels: Record<string, string> = { organizationId: 'Organization', groupId: 'Group', cycleId: 'Cycle', roundId: 'Round', memberId: 'Member', frequency: 'Frequency', status: 'Status', position: 'Position / share', type: 'Type', assignee: 'Assignee', priority: 'Priority', module: 'Source module', team: 'Role group', age: 'Elapsed age', actor: 'Actor', target: 'Target', result: 'Result', privileged: 'Privileged change' }
  return <div className="tcs-container space-y-6">
    <PageHeader title="Reports" eyebrow={`${audience === "internal" ? "Internal" : audience === "member" ? "Member" : "Organization"} workspace`} description="Explore the records behind your totals. Reports use the same Groups, payments and lifecycle history as your workspace." />
    {!definition ? <div className="space-y-6">{[...new Set(definitions.map(d => d.category))].map(category => <section key={category}><h2 className="mb-3 text-lg font-semibold">{category}</h2><div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">{definitions.filter(d => d.category === category).map(d => <button key={d.id} disabled={d.availability === 'Planned / Awaiting Source Module'} onClick={() => { setId(d.id); setFilters({}); setMetric('') }} className="rounded-xl border border-slate-200 bg-white p-5 text-left shadow-sm hover:border-blue-400 focus-visible:outline-2 focus-visible:outline-blue-700"><span className="font-semibold text-blue-900">{d.name} →</span><span className="mt-2 block text-sm leading-6 text-slate-600">{d.description}</span>{d.availability === 'Planned / Awaiting Source Module' && <span className="mt-2 block text-xs font-semibold text-amber-800">Planned / Awaiting Source Module</span>}</button>)}</div></section>)}</div> : <>
      <div className="flex flex-wrap items-center justify-between gap-3"><div><button onClick={() => setId('')} className="mb-3 text-sm font-semibold text-blue-800">← All reports</button><h2 className="text-2xl font-semibold">{definition.name}</h2><p className="mt-1 text-sm text-slate-600">{definition.description}</p>{definition.sourceDescription && <p className="mt-2 text-xs text-slate-500">Source: {definition.sourceDescription} / {definition.visibility}</p>}</div><button onClick={() => refresh(v => v + 1)} className="rounded-lg bg-blue-800 px-4 py-2 text-sm font-semibold text-white">Refresh report</button></div>
      <FilterPanel className="rounded-xl border border-slate-200 bg-white p-4">{audience === "internal" && <summary className="font-semibold">Report filters and sorting</summary>}<div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 mt-3">
        {definition.filters.map(key => <label key={key} className="space-y-1 text-xs font-medium">{labels[key]}<select className={control} value={filters[key as keyof ReportFilters] || ''} onChange={e => change(key as keyof ReportFilters, e.target.value)}><option value="">All</option>{result?.options[key]?.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}</select></label>)}
        <label className="space-y-1 text-xs font-medium">From date<input className={control} type="date" value={filters.from || ''} onChange={e => change('from', e.target.value)} /></label>
        <label className="space-y-1 text-xs font-medium">To date<input className={control} type="date" value={filters.to || ''} onChange={e => change('to', e.target.value)} /></label>
        <label className="space-y-1 text-xs font-medium">Search<input className={control} type="search" placeholder="Name or reference" value={filters.search || ''} onChange={e => change('search', e.target.value)} /></label>
        <label className="space-y-1 text-xs font-medium">Sort<select className={control} value={filters.sort || 'newest'} onChange={e => change('sort', e.target.value)}><option value="newest">Newest source date</option><option value="oldest">Oldest / due date</option>{definition.columns.some(c => c.key === 'outstanding') && <option value="outstanding">Highest outstanding</option>}{definition.columns.some(c => c.key === 'member') && <option value="member">Member</option>}{definition.columns.some(c => c.key === 'position') && <option value="position">Payout position</option>}</select></label>
        <button onClick={() => {setFilters({});setMetric('')}} className="text-left text-sm font-semibold text-blue-800">Clear filters</button><p className="text-xs leading-5 text-slate-500 sm:col-span-2">Date filter: {definition.dateBasis}</p>
      </div></FilterPanel>
      {exportError && <p role="alert" className="text-red-800">{exportError}</p>}
      {error && <p role="alert" className="rounded-lg bg-red-50 p-4 text-red-800">{error}</p>}
      {result && <>
        <div className="flex flex-wrap gap-3 print:hidden"><button className="rounded-lg border border-blue-800 px-4 py-2 text-sm font-semibold text-blue-800" onClick={() => { try { downloadCsv(exportReport ? exportReport(id,{...filters,metric:metric||undefined}) : reportCsv(report(id,{...filters,metric:metric||undefined})),id); setExportError('') } catch(e) { setExportError(e instanceof Error ? e.message : 'Export denied.') } }}>Download CSV</button><button className="rounded-lg border border-slate-300 px-4 py-2 text-sm" onClick={() => { try { report(id,{...filters,metric:metric||undefined}); window.print() } catch(e) { setExportError(e instanceof Error ? e.message : 'Print denied.') } }}>Print report</button></div>
        <div className="grid grid-cols-1 min-[390px]:grid-cols-2 gap-3 lg:grid-cols-4">{result.summaries.map(s => <button key={s.key} onClick={() => { setMetric(s.key); resultsRef.current?.scrollIntoView({behavior:"smooth"}) }} className="report-summary rounded-xl border border-slate-200 bg-white p-4 text-left"><p className="text-xs text-slate-500">{s.label}</p><p className="mt-2 break-words text-xl font-semibold">{s.type === 'money' ? formatMoneyMinor(s.value) : s.value}</p><p className="mt-1 text-xs text-slate-400">Inspect contributing rows</p></button>)}</div>
        {result.notices.map(n => <p key={n} className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm leading-6 text-amber-900">{n}</p>)}
        {id === 'organization-collections' && <button className="text-sm font-semibold text-blue-800" onClick={() => { setId('organization-payments'); setFilters({}) }}>Open Payment Register for advances, manual review and exceptions →</button>}
        <section ref={resultsRef}>{metric && <button className="mb-3 text-sm text-blue-800" onClick={() => setMetric('')}>Showing rows contributing to {result.definition.columns.find(c=>c.key===metric)?.label} / Show all filtered rows</button>}<ReportTable result={result} openSource={openSource} /></section>
        <footer className="space-y-1 border-t border-slate-200 pt-4 text-xs leading-5 text-slate-500"><p>Generated: <DisplayDate value={result.generatedAt}/></p>{result.actor && <p>Actor: {result.actor}</p>}<p>Applied filters: {Object.entries(result.filters).filter(([,v])=>v).map(([k,v])=>k+": "+v).join("; ") || "None"}</p><p>Source reference dates: {result.references.join(' · ') || 'No reference date on these records'}</p><p>Live prototype report · Not an immutable financial statement · Amounts displayed in NGN</p></footer>
      </>}
    </>}
  </div>
}
export function ReportsWorkspace({ navigate, owner = false }: { navigate: (view: View, meta?: NavMeta) => void; owner?: boolean }) {
  const { report } = useGroups(), { client } = useClient(), { organization } = useOrganization()
  if (!client || owner && (!organization || organization.ownerMemberId !== client.id || !hasWorkspace(organization))) return <div role="alert" className="p-8">Report access denied. Sign in to the appropriate Member or Organization workspace.</div>
  const body = <ReportBody key={`${owner}:${client.id}:${organization?.id}`} audience={owner ? 'organization' : 'member'} report={report} />
  return owner ? <OwnerShell navigate={navigate} activeView="owner-reports">{body}</OwnerShell> : <ClientShell navigate={navigate} active="reports">{body}</ClientShell>
}
