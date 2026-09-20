import { InternalDenied, InternalNavigation } from '../access/InternalNavigation'
import { DecisionPanel } from './DecisionPanel'
import { useState } from "react"
import type { View, NavMeta } from "../App"
import { useOperations } from "./OperationsContext"
import {
  CaseDetail,
  OperationsQueue,
  Overview,
  Fields,
  panel,
} from "./OperationsBody"
import {
  type CaseFilters,
  type OperationsCase,
} from "./model"
import type { OperationsSources } from "./sources"
import { PaymentReceipt } from "../payments/PaymentBody"
import { LifecycleHistory } from "../lifecycle/LifecycleHistory"
import { RevenuePanel } from "../reconciliation/RevenuePanel"
import { PayoutCard } from "../payouts/PayoutBody"
export function SourceRecord({
  item,
  sources,
}: {
  item: OperationsCase
  sources: OperationsSources
}) {
  const world = sources.worlds.find(
    (w) =>
      w.finance?.organizationId === item.organizationId ||
      w.groups.some((g) => g.organizationId === item.organizationId),
  )
  const group = world?.groups.find(
    (g) => g.id === item.groupId && g.organizationId === item.organizationId,
  )
  const payment = group?.payments?.transactions.find(
    (t) => t.id === item.source.id,
  )
  const cycle = group?.cycles.find((c) => c.id === item.cycleId)
  const payout = group?.payouts?.records.find((p) => p.id === item.source.id)
  const receivable = world?.finance?.receivables.find(
    (r) => r.id === item.source.id && r.organizationId === item.organizationId,
  )
  return (
    <div className="space-y-5">
      <section className={panel}>
        <p className="text-xs text-slate-500">
          {item.module} · Read-only source record
        </p>
        <h1 className="text-2xl font-bold mt-2">{item.source.kind}</h1>
        <p className="mt-2 text-sm break-all">{item.source.id}</p>
        <p className="mt-3">
          {item.organization} {item.member && "· " + item.member}
        </p>
        <p className="text-sm mt-2">
          Current source status: {item.sourceStatus}
        </p>
      </section>
      {payment && group ? (
        <PaymentReceipt group={group} transaction={payment} />
      ) : payout && group ? (
        <PayoutCard group={group} record={payout} owner />
      ) : receivable && world?.finance ? (
        <RevenuePanel state={{ ...world.finance, receivables: [receivable] }} />
      ) : item.module === "Thrift" && group && cycle ? (
        <LifecycleHistory group={group} cycle={cycle} />
      ) : (
        <section className={panel}>
          <Fields items={[...item.context, ...item.financial]} />
        </section>
      )}
    </div>
  )
}
export function OperationsWorkspace({
  navigate, initialCaseId,
}: {
  navigate: (view: View, meta?: NavMeta) => void
  initialCaseId?: string
}) {
  const ops = useOperations(),
    [filters, setFilters] = useState<CaseFilters>({ view: "Overview" }),
    [selected, setSelected] = useState<string | null>(initialCaseId || null),
    [source, setSource] = useState(false),
    [error, setError] = useState("")
  const now = new Date().toISOString()
  if (!ops.session) return <InternalDenied navigate={navigate} module="Operations"/>
  const session = ops.session,
    item = ops.cases.find((c) => c.id === selected)
  const changeView = (f: CaseFilters) => {
    setFilters(f)
    setSelected(null)
    setSource(false)
  }
  return (
    <div className="min-h-screen text-slate-900">
      <InternalNavigation navigate={navigate} current="operations" />
      <main id="internal-main" tabIndex={-1} className="tcs-container">
        <nav
          aria-label="Operations views"
          className="flex overflow-x-auto gap-1 border-b border-slate-200 mb-6"
        >
          {[
            "Overview",
            "My Queue",
            "All Cases",
            "Reviews",
            "Financial Exceptions",
            "Disputes / Escalations",
            "History / Resolved",
          ].map((view) => (
            <button
              className={`px-4 py-3 text-sm whitespace-nowrap border-b-2 ${
                filters.view === view
                  ? "border-blue-800 font-semibold text-blue-800"
                  : "border-transparent text-slate-500"
              }`}
              key={view}
              onClick={() => changeView({ view })}
            >
              {view}
            </button>
          ))}
        </nav>
        {error && (
          <p role="alert" className="mb-4 text-red-700">
            {error}
          </p>
        )}
        {item ? (
          source ? (
            <div className="space-y-5">
              <button
                className="tcs-link text-sm"
                onClick={() => setSource(false)}
              >
                ← Back to {item.reference}
              </button>
              <SourceRecord item={item} sources={ops.sources} />
            </div>
          ) : (
            <CaseDetail session={session}
              key={item.id}
              item={item}
              decisionPanel={<DecisionPanel key={item.id+session.personaId} item={item} sources={ops.sources} session={session} onPreview={input=>ops.preview(item.id,input)} onDecide={ops.decide} onProviderDemo={()=>ops.providerUpdateDemo(item.id)}/>}
              now={now}
              onBack={() => setSelected(null)}
              onSource={() => {
                ops.act(item.id, { type: "source-view" })
                setSource(true)
              }}
              onAction={(a) =>
                ops.act(
                  item.id,
                  a.type === "assign" && a.assignee === "__me__"
                    ? { type: "assign", assignee: session.personaId }
                    : a,
                )
              }
            />
          )
        ) : (
          <div className="space-y-5">
            {filters.view === "Overview" && (
              <Overview
                cases={ops.cases}
                session={session}
                onView={changeView}
              />
            )}
            <OperationsQueue
              cases={ops.cases}
              session={session}
              now={now}
              filters={filters}
              onFilters={setFilters}
              onOpen={(id) => {
                setSelected(id)
                setSource(false)
              }}
            />
            <details className="text-sm text-slate-500">
              <summary className="cursor-pointer">Prototype scenarios</summary>
              <p className="mt-3">
                Load representative scenarios into the existing Member,
                Organization, Thrift and Payments stores. Repeated loading
                preserves the same cases. Changes remain in memory for this
                session.
              </p>
              <button
                className="tcs-link mt-3"
                onClick={() => {
                  try {
                    ops.loadDemo()
                    setError("")
                  } catch (e) {
                    setError((e as Error).message)
                  }
                }}
              >
                Load shared Operations scenarios
              </button>
              <button className="tcs-link mt-3 block" onClick={()=>{try{ops.loadDecisionDemo();setError('')}catch(e){setError((e as Error).message)}}}>Load shared 5B decision scenarios</button>
              <button className="tcs-link mt-3 block" onClick={()=>{try{ops.loadInterventionDemo();setError('')}catch(e){setError((e as Error).message)}}}>Load shared 5C dispute and intervention scenarios</button>
            </details>
          </div>
        )}
      </main>
    </div>
  )
}
