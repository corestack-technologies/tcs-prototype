import { availableReviewers, hasPermission } from '../access/authorization'
import { useEffect, useState, type ReactNode } from "react"
import {
  ageLabel,
  isResolved,
  money,
  type OperationsCase,
  type CaseFilters,
  type ContextField,
  type Evidence,
  type InternalSession,
  type TriageAction,
  filterCases,
} from "./model"
export const panel = "rounded-2xl border border-[#E2E6F0] bg-white p-5 sm:p-6"
const control =
  "rounded-lg border border-[#D6DDE8] bg-white px-3 py-2 text-sm min-h-10"
export function Chip({
  children,
  high = false,
}: {
  children: ReactNode
  high?: boolean
}) {
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
        high ? "bg-amber-50 text-amber-900" : "bg-slate-100 text-slate-700"
      }`}
    >
      {children}
    </span>
  )
}
export function Fields({ items }: { items: ContextField[] }) {
  return (
    <dl className="grid gap-x-8 gap-y-4 sm:grid-cols-2">
      {items.map((f, i) => (
        <div key={i} className="min-w-0">
          <dt className="text-xs text-slate-500">{f.label}</dt>
          <dd className="mt-1 break-words text-sm font-medium text-slate-900">
            {f.value}
          </dd>
        </div>
      ))}
    </dl>
  )
}
function EvidenceItem({ item }: { item: Evidence }) {
  const [url, setUrl] = useState("")
  useEffect(() => {
    if (!item.file) return
    const value = URL.createObjectURL(item.file)
    setUrl(value)
    return () => URL.revokeObjectURL(value)
  }, [item.file])
  return (
    <li className="rounded-lg bg-slate-50 p-3 text-sm">
      <p className="font-medium break-words">{item.name}</p>
      <p className="mt-1 text-xs text-slate-500">
        {item.detail ||
          (item.file
            ? "Uploaded evidence"
            : "Prototype evidence metadata; no file content attached")}
      </p>
      {url && (
        <a
          href={url}
          download={item.name}
          className="tcs-link mt-2 inline-block"
        >
          Download evidence
        </a>
      )}
    </li>
  )
}
export function CaseDetail({
  session,
  item,
  decisionPanel,
  now,
  onAction,
  onSource,
  onBack,
}: {
  item: OperationsCase
  session?: InternalSession
  decisionPanel?: ReactNode
  now: string
  onAction: (a: TriageAction) => void
  onSource: () => void
  onBack: () => void
}) {
  const [note, setNote] = useState(""),
    [error, setError] = useState("")
  const action = (a: TriageAction) => {
    try {
      onAction(a)
      setError("")
      if (a.type === "note" || a.type === "status") setNote("")
    } catch (e) {
      setError((e as Error).message)
    }
  }
  return (
    <div className="space-y-5">
      <button onClick={onBack} className="tcs-link text-sm">
        ← Back to queue
      </button>
      <section className={panel}>
        <div className="flex flex-wrap justify-between gap-4">
          <div>
            <p className="text-xs font-semibold tracking-wider text-slate-500">
              {item.reference} · {item.module}
            </p>
            <h1 className="text-2xl font-bold mt-2">{item.type}</h1>
          </div>
          <div className="flex items-start flex-wrap gap-2">
            <Chip>{item.status}</Chip>
            <Chip high={item.priority !== "Normal"}>{item.priority}</Chip>
          </div>
        </div>
        <p className="mt-3 text-sm text-slate-600">
          {[item.organization, item.member].filter(Boolean).join(" · ") ||
            "Platform Member review"}{" "}
          · {ageLabel(item, now)}
        </p>
        {item.amountMinor !== undefined && (
          <p className="mt-4 text-3xl font-bold tabular-nums">
            {money(item.amountMinor)}
          </p>
        )}
        <p className="mt-4 text-slate-800">{item.reason}</p>
        {item.referenceAt && item.referenceAt > now && (
          <p className="mt-2 text-xs text-slate-500">
            Age uses the source scenario clock:{" "}
            {new Date(item.referenceAt).toLocaleString("en-GB")}. No fixed SLA
            is assumed.
          </p>
        )}
        <div className="mt-5 border-t pt-4 flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm">
            <span className="text-slate-500">Source status:</span>{" "}
            {item.sourceStatus}
          </p>
          <button onClick={onSource} className="tcs-link text-sm">
            {item.source.label} ↗
          </button>
        </div>
      </section>
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_340px]">
        <div className="space-y-5">
          <section className={panel}>
            <h2 className="font-bold mb-4">Business context</h2>
            <Fields items={item.context} />
          </section>
          {item.financial.length > 0 && (
            <section className={panel}>
              <h2 className="font-bold mb-4">Financial context</h2>
              <Fields items={item.financial} />
            </section>
          )}
          <section className={panel}>
            <h2 className="font-bold mb-4">Evidence</h2>
            {item.evidence.length ? (
              <ul className="grid gap-3 sm:grid-cols-2">
                {item.evidence
                  .filter(
                    (e, i, all) =>
                      all.findIndex((o) => o.name === e.name) === i,
                  )
                  .map((e, i) => (
                    <EvidenceItem key={i} item={e} />
                  ))}
              </ul>
            ) : (
              <p className="text-sm text-slate-500">
                No evidence attached to the source record.
              </p>
            )}
          </section>
          <details className={panel}>
            <summary className="font-semibold mb-4">Timeline and case history</summary>
            <ol className="space-y-5 border-l border-slate-200 pl-5">
              {item.timeline.map((e, i) => (
                <li key={i}>
                  <p className="text-xs text-slate-500">
                    {new Date(e.at).toLocaleString("en-GB")} · {e.actor} ·{" "}
                    {e.origin}
                  </p>
                  <p className="mt-1 text-sm font-semibold">{e.action}</p>
                  {e.before && (
                    <p className="text-xs mt-1 text-slate-600">
                      {e.before} → {e.after}
                    </p>
                  )}
                  {e.reason && (
                    <p className="text-sm mt-1 whitespace-pre-wrap break-words">
                      {e.reason}
                    </p>
                  )}
                </li>
              ))}
            </ol>
          </details>
        </div>
        <aside className="space-y-5">
          {decisionPanel}
          <section className={panel}>
            <h2 className="font-bold mb-3">Next expected action</h2>
            <p className="text-sm leading-6 text-slate-600">
              {item.nextAction}
            </p>
          </section>
          <section className={panel}>
            <h2 className="font-bold mb-4">Assignment & triage</h2>
            {isResolved(item) ? (
              <p className="text-sm text-slate-600">
                Resolved source outcome. This case is read-only.
              </p>
            ) : (
              <div className="space-y-4">
                <label className="block text-sm">
                  Assigned reviewer
                  <select
                    aria-label="Assigned reviewer"
                    disabled={!hasPermission(session,'operations.case.assign')}
                    className={control + " w-full mt-1"}
                    value={item.assignee || ""}
                    onChange={(e) =>
                      action({ type: "assign", assignee: e.target.value })
                    }
                  >
                    <option value="">Unassigned</option>
                    {(session?availableReviewers(session):[]).map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </label>
                <button
                  className="tcs-link text-sm"
                  disabled={!hasPermission(session,'operations.case.assign')}
                  onClick={() =>
                    onAction({ type: "assign", assignee: "__me__" })
                  }
                >
                  Assign to me
                </button>
                <label className="block text-sm">
                  Priority
                  <select
                    className={control + " w-full mt-1"}
                    disabled={!hasPermission(session,'operations.case.assign')}
                    value={item.priority}
                    onChange={(e) =>
                      action({
                        type: "priority",
                        priority: e.target.value as OperationsCase["priority"],
                      })
                    }
                  >
                    {["Normal", "High", "Critical"].map((p) => (
                      <option key={p}>{p}</option>
                    ))}
                  </select>
                </label>
                <label className="block text-sm">
                  Internal note / request
                  <textarea
                    className={control + " mt-1 w-full min-h-28"}
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    maxLength={4000}
                    placeholder="Record findings, the information needed, or escalation reason."
                  />
                </label>
                <p className="text-xs text-slate-500">
                  Internal only. Requests preserve an awaiting-response state;
                  they do not send a Member or Organization message.
                </p>
                <button
                  className={control + " w-full font-semibold"}
                  disabled={!hasPermission(session,'operations.case.note')}
                  onClick={() => action({ type: "note", text: note })}
                >
                  Add internal note
                </button>
                <div className="grid gap-2">
                  {([
                    "In Review",
                    "Awaiting Information",
                    "Awaiting External Action",
                    "Awaiting Approval",
                    "Escalated",
                  ] as const).map((status) => (
                    <button
                      key={status}
                      disabled={!hasPermission(session,status==='Escalated'?'operations.case.escalate':'operations.case.assign')}
                      className={control + " text-left"}
                      onClick={() =>
                        action({ type: "status", status, text: note })
                      }
                    >
                      {
                        {
                          "In Review": "Mark ready for review",
                          "Awaiting Information": "Request information",
                          "Awaiting External Action": "Await external action",
                          "Awaiting Approval": "Prepare for approval",
                          Escalated: "Escalate case",
                        }[status]
                      }
                    </button>
                  ))}
                </div>
              </div>
            )}
            {error && (
              <p role="alert" className="text-sm text-red-700 mt-3">
                {error}
              </p>
            )}
          </section>
          <section className={panel}>
            <h2 className="font-bold mb-3">Policy context</h2>
            <p className="text-sm leading-6 text-slate-600">{item.policy}</p>
            <p className="text-xs mt-3 text-slate-500">
              Case-specific decisions use authorized review. Disputes and intervention remain for Module 5C.
            </p>
          </section>
        </aside>
      </div>
    </div>
  )
}
export function OperationsQueue({
  cases,
  session,
  now,
  filters,
  onFilters,
  onOpen,
}: {
  cases: OperationsCase[]
  session: InternalSession
  now: string
  filters: CaseFilters
  onFilters: (f: CaseFilters) => void
  onOpen: (id: string) => void
}) {
  const filtered = filterCases(cases, filters, session, now)
  const set = (key: keyof CaseFilters, value: string) =>
    onFilters({ ...filters, [key]: value })
  const select = (
    label: string,
    key: keyof CaseFilters,
    values: { value: string; label: string }[],
  ) => (
    <label className="text-xs text-slate-600">
      {label}
      <select
        aria-label={label}
        className={control + " block mt-1 w-full"}
        value={String(filters[key] || "")}
        onChange={(e) => set(key, e.target.value)}
      >
        <option value="">All</option>
        {values.map((v) => (
          <option value={v.value} key={v.value}>
            {v.label}
          </option>
        ))}
      </select>
    </label>
  )
  const values = (list: string[]) =>
    [...new Set(list)].sort().map((v) => ({ value: v, label: v }))
  return (
    <section className={panel}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xl font-bold">
          {filters.view === "Overview"
            ? "Needs attention"
            : filters.view || "All Cases"}{" "}
          <span className="text-sm font-normal text-slate-500">
            {filtered.length} cases
          </span>
        </h2>
        <button
          className="tcs-link text-sm"
          onClick={() => onFilters({ view: filters.view })}
        >
          Clear filters
        </button>
      </div>
      <input
        className={control + " mt-5 w-full"}
        aria-label="Search cases"
        placeholder="Search case reference, Member, Organization or issue"
        value={filters.search || ""}
        onChange={(e) => set("search", e.target.value)}
      />
      <div className="mt-3 grid gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {select(
          "Case status",
          "status",
          values([
            "New",
            "Assigned",
            "In Review",
            "Awaiting Information",
            "Awaiting External Action",
            "Awaiting Approval",
            "Escalated",
            "Resolved",
            "Closed",
          ]),
        )}
        {select("Case type", "type", values(cases.map((c) => c.type)))}
        {select("Priority", "priority", values(["Normal", "High", "Critical"]))}
        {select(
          "Source module",
          "module",
          values(["Clients", "Organizations", "Thrift", "Payments"]),
        )}
        {select("Organization", "organizationId", [
          ...new Map(
            cases
              .filter((c) => c.organizationId)
              .map((c) => [
                c.organizationId!,
                { value: c.organizationId!, label: c.organization! },
              ]),
          ).values(),
        ])}
        {select("Assignment", "assignment", [
          { value: "assigned", label: "Assigned" },
          { value: "unassigned", label: "Unassigned" },
        ])}
        {select("Case age", "olderThanHours", [
          { value: "24", label: "At least 1 day" },
          { value: "72", label: "At least 3 days" },
          { value: "168", label: "At least 7 days" },
        ])}
      </div>
      <div className="mt-5 overflow-x-auto">
        <table role="table" aria-label="Operations case queue" className="tcs-card-table w-full text-sm text-left">
          <thead className="border-y border-slate-200 text-xs text-slate-500">
            <tr>
              {[
                "Case / issue",
                "Organization / Member",
                "Amount",
                "Priority / age",
                "Status / reviewer",
              ].map((h) => (
                <th scope="col" key={h} className="px-3 py-3 font-medium">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody role="rowgroup">
            {filtered.map((c) => (
              <tr
                key={c.id}
                role="row"
                className="border-b border-slate-100 hover:bg-slate-50"
              >
                <td role="cell" data-label="Case / issue" className="px-3 py-4 min-w-64 max-w-96">
                  <button
                    className="text-left font-semibold text-blue-800 hover:underline"
                    onClick={() => onOpen(c.id)}
                  >
                    {c.type}
                  </button>
                  <p className="text-xs text-slate-500 mt-1">
                    {c.reference} · {c.module}
                  </p>
                  <p className="text-xs text-slate-600 mt-2 line-clamp-2">
                    {c.reason}
                  </p>
                  <p className="text-xs mt-1 text-slate-500">
                    Next: {c.nextAction}
                  </p>
                </td>
                <td role="cell" data-label="Organization / Member" className="px-3 py-4 min-w-40">
                  <p>{c.organization || "Platform Member"}</p>
                  <p className="text-xs text-slate-500 mt-1">{c.member}</p>
                </td>
                <td role="cell" data-label="Amount" className="px-3 py-4 whitespace-nowrap tabular-nums">
                  {c.amountMinor === undefined ? "—" : money(c.amountMinor)}
                </td>
                <td role="cell" data-label="Priority / age" className="px-3 py-4 min-w-32">
                  <Chip high={c.priority !== "Normal"}>{c.priority}</Chip>
                  <p className="mt-2 text-xs text-slate-500">
                    {ageLabel(c, now)}
                  </p>
                </td>
                <td role="cell" data-label="Status / reviewer" className="px-3 py-4 min-w-40">
                  <Chip>{c.status}</Chip>
                  <p className="mt-2 text-xs text-slate-500">
                    {availableReviewers(session).find((p) => p.id === c.assignee)?.name ||
                      "Unassigned"}
                  </p>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!filtered.length && (
          <p className="p-8 text-center text-slate-500">
            No cases match this view. Try clearing the filters.
          </p>
        )}
      </div>
    </section>
  )
}
export function Overview({
  cases,
  session,
  onView,
}: {
  cases: OperationsCase[]
  session: InternalSession
  onView: (f: CaseFilters) => void
}) {
  const open = cases.filter((c) => !isResolved(c))
  return (
    <section className={panel}>
      <h1 className="text-2xl font-bold">Operations overview</h1>
      <p className="mt-2 text-sm text-slate-500">
        Review exceptions, establish the facts and prepare controlled decisions.
      </p>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
        {[
          { label: "Open cases", count: open.length, f: { view: "All Cases" } },
          {
            label: "Assigned to me",
            count: open.filter((c) => c.assignee === session.personaId).length,
            f: { view: "My Queue" },
          },
          {
            label: "Unassigned",
            count: open.filter((c) => !c.assignee).length,
            f: { view: "All Cases", assignment: "unassigned" },
          },
          {
            label: "Awaiting information",
            count: open.filter((c) => c.status === "Awaiting Information")
              .length,
            f: { view: "All Cases", status: "Awaiting Information" },
          },
        ].map((x) => (
          <button
            key={x.label}
            className="text-left border-l-2 border-blue-100 pl-4"
            onClick={() => onView(x.f)}
          >
            <p className="text-3xl font-bold">{x.count}</p>
            <p className="text-sm text-slate-500 mt-1">{x.label}</p>
          </button>
        ))}
      </div>
      <div className="flex flex-wrap gap-3 text-sm mt-6 border-t pt-4">
        {[
          "Reviews",
          "Financial Exceptions",
          "Disputes / Escalations",
          "History / Resolved",
        ].map((view) => (
          <button
            className="tcs-link"
            key={view}
            onClick={() => onView({ view })}
          >
            {view}:{" "}
            {view === "History / Resolved"
              ? cases.filter(isResolved).length
              : open.filter((c) => c.category === view).length}
          </button>
        ))}
        <span className="text-slate-600">
          High / Critical: {open.filter((c) => c.priority !== "Normal").length}
        </span>
      </div>
    </section>
  )
}
