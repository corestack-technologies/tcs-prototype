import { InternalFacts } from '../internal/Presentation'
import { Dialog, DisplayDate } from '../design/foundation'
﻿import { useState, useEffect } from "react"
import type { View } from "../App"
import { useAccess } from "../access/AccessContext"
import { hasPermission } from "../access/authorization"
import {
  InternalNavigation,
  InternalDenied,
} from "../access/InternalNavigation"
import { useGroups } from "../groups/GroupContext"
import {
  businessClock,
  platformSettings,
  controls,
  previewChange,
  applyChange,
  readHistory,
  type Preview,
  type Request,
} from "./service"
export function SettingsWorkspace({
  navigate,
}: {
  navigate: (v: View) => void
}) {
  const access = useAccess()
  if (!hasPermission(access.session, "settings.view"))
    return <InternalDenied navigate={navigate} module="Settings" />
  return (
    <>
      <InternalNavigation navigate={navigate} current="settings" />
      {hasPermission(access.session,'settings.diagnostics.view') && <div className="max-w-6xl mx-auto px-6 pt-4"><button className="underline" onClick={()=>navigate('diagnostics')}>Settings / System Diagnostics</button></div>}
      <SettingsBody key={access.session!.personaId} />
    </>
  )
}
export function SettingsBody() {
  const a = useAccess(),
    groups = useGroups(),
    [tab, setTab] = useState("Runtime Controls"),
    [date, setDate] = useState(""),
    [reason, setReason] = useState(""),
    [value, setValue] = useState<string>(platformSettings.verificationMode),
    [preview, setPreview] = useState<Preview | null>(null),
    [error, setError] = useState(""),
    [category, setCategory] = useState(""),
    [actor, setActor] = useState(""),
    [from, setFrom] = useState(""),
    [to, setTo] = useState(""),
    [query, setQuery] = useState(""),
    [, refresh] = useState(0)
  useEffect(() => {
    const timer = setInterval(() => refresh((v) => v + 1), 1000)
    return () => clearInterval(timer)
  }, [])
  const can = (p: string) => hasPermission(a.session, p),
    clock = businessClock(),
    last = platformSettings.history
      .filter((e) => e.category === "Business Date")
      .at(-1)
  const boundary = () => groups.protectedThrough(a.currentSession())
  const propose = (request: Request) => {
    try {
      setPreview(
        previewChange(
          a.currentSession(),
          request,
          reason,
          request.category === "Business Date" ? boundary() : "",
        ),
      )
      setError("")
    } catch (e) {
      setError((e as Error).message)
    }
  }
  const confirm = () => {
    try {
      applyChange(
        a.currentSession(),
        preview!,
        true,
        preview!.request.category === "Business Date" ? boundary() : "",
      )
      setPreview(null)
      setReason("")
      setError("Change applied; immutable configuration history recorded. After a Business Date change, authorized operators can evaluate lifecycle processing in Operations > Scheduled Processes.")
      refresh((v) => v + 1)
    } catch (e) {
      setPreview(null)
      setError((e as Error).message)
    }
  }
  const field = "border rounded-lg p-2 bg-white",
    button = "rounded-lg bg-[#10243A] text-white px-4 py-2 disabled:opacity-40"
  return (
    <main id="internal-main" tabIndex={-1} className="max-w-6xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-bold">Settings</h1>
      <p>
        Platform configuration · {clock.environment} · Shared prototype
        environment state
      </p>
      <nav aria-label="Settings sections" className="flex flex-wrap gap-3">
        <button aria-current={tab === "Runtime Controls" ? "page" : undefined} onClick={() => setTab("Runtime Controls")}>
          Platform · Runtime Controls
        </button>
        {can("settings.business_date.view") && (
          <button aria-current={tab === "Business Date" ? "page" : undefined} onClick={() => setTab("Business Date")}>
            Environment · Business Date
          </button>
        )}
        {can("settings.audit.view") && (
          <button aria-current={tab === "Configuration Changes" ? "page" : undefined} onClick={() => setTab("Configuration Changes")}>
            History · Configuration Changes
          </button>
        )}
      </nav>
      {error && (
        <p role="status" className="p-3 bg-amber-50 border rounded-lg">
          {error}
        </p>
      )}
      <section className="bg-white border rounded-xl p-6 space-y-4">
        <h2 className="text-xl font-semibold">{tab}</h2>
        {tab === "Runtime Controls" &&
          controls.map((c) => (
            <article key={c.key} className="internal-control space-y-3">
              <h3 className="font-semibold">{c.name}</h3>
              <p>{c.description}</p>
              <p className="text-sm text-slate-600">
                {c.key} · {c.valueType} · {c.scope} · {c.sensitivity}
              </p>
              <p>Applicable environments: {c.environments.join(", ")}</p>
              <p>
                Current value: {platformSettings.verificationMode} · Allowed:{" "}
                {c.allowed.join(", ")}
              </p>
              <p>
                Last changed:{" "}
                {platformSettings.history
                  .filter((e) => e.category === "Runtime Control")
                  .at(-1)?.actor || "Prototype seed"}{" "}
                ·{" "}
                {platformSettings.history
                  .filter((e) => e.category === "Runtime Control")
                  .at(-1)?.at || "No changes recorded"}
              </p>
              {can("settings.runtime_controls.manage") && (
                <div className="internal-action space-y-3">
                  <label>
                    New value{" "}
                    <select
                      className={field}
                      value={value}
                      onChange={(e) => setValue(e.target.value)}
                    >
                      {c.allowed.map((v) => (
                        <option key={v}>{v}</option>
                      ))}
                    </select>
                  </label>
                  <label className="block">
                    Reason{" "}
                    <textarea
                      className={field + " block w-full"}
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                    />
                  </label>
                  <button
                    className={button}
                    onClick={() =>
                      propose({
                        category: "Runtime Control",
                        key: c.key,
                        value,
                      })
                    }
                  >
                    Preview control change
                  </button>
                </div>
              )}
            </article>
          ))}
        {tab === "Business Date" && can("settings.business_date.view") && (
          <>
            <p>
              Business Date control is intended for non-production environments
              only.
            </p>
            <InternalFacts items={[{label:'Effective Business Date (Africa/Lagos)',value:<DisplayDate value={clock.businessDate}/>},{label:'Actual Date/Time',value:<DisplayDate value={clock.actualTimestamp}/>},{label:'Mode',value:clock.mode},{label:'Environment',value:clock.environment},{label:'Last Changed By',value:last?.actor||'Prototype seed'},{label:'Last Change Time',value:last?.at?<DisplayDate value={last.at}/>:'No changes recorded'}]}/>
            <p>
              Changing the date changes effective business time. It does not
              execute processes, generate obligations or apply penalties.
              Authorized operators can run lifecycle evaluation in Operations / Scheduled Processes. Explicit demo scenarios retain their reference time.
            </p>
            {can("settings.business_date.manage") &&
              clock.environment !== "Production" && (
                <div className="internal-action space-y-3">
                  <label>
                    Selected Business Date{" "}
                    <input
                      className={field}
                      type="date"
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                    />
                  </label>
                  {clock.mode === "CONTROLLED" && (
                    <button
                      className={field}
                      onClick={() =>
                        setDate(
                          new Date(Date.parse(clock.businessDate) + 86400000)
                            .toISOString()
                            .slice(0, 10),
                        )
                      }
                    >
                      Select next day
                    </button>
                  )}
                  <label className="block">
                    Reason{" "}
                    <textarea
                      className={field + " block w-full"}
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                    />
                  </label>
                  <div className="flex gap-3">
                    <button
                      className={button}
                      onClick={() =>
                        propose({
                          category: "Business Date",
                          mode: "CONTROLLED",
                          date,
                        })
                      }
                    >
                      {clock.mode === "CONTROLLED"
                        ? "Preview advancement"
                        : "Preview controlled date"}
                    </button>
                    {clock.mode === "CONTROLLED" && (
                      <button
                        className="border border-amber-600 text-amber-900 rounded-lg px-4"
                        onClick={() =>
                          propose({
                            category: "Business Date",
                            mode: "REAL_TIME",
                          })
                        }
                      >
                        Preview reset to Real Time
                      </button>
                    )}
                  </div>
                </div>
              )}
          </>
        )}
        {tab === "Configuration Changes" && can("settings.audit.view") && (
          <>
            <div className="flex flex-wrap gap-3">
              <label>
                Category{" "}
                <select
                  className={field}
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                >
                  <option value="">All</option>
                  <option>Runtime Control</option>
                  {can("settings.business_date.view") && (
                    <option>Business Date</option>
                  )}
                </select>
              </label>
              <label>
                Actor{" "}
                <input
                  className={field}
                  value={actor}
                  onChange={(e) => setActor(e.target.value)}
                />
              </label>
              <label>
                From{" "}
                <input
                  type="date"
                  className={field}
                  value={from}
                  onChange={(e) => setFrom(e.target.value)}
                />
              </label>
              <label>
                To{" "}
                <input
                  type="date"
                  className={field}
                  value={to}
                  onChange={(e) => setTo(e.target.value)}
                />
              </label>
              <label>
                Control/action{" "}
                <input
                  className={field}
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />
              </label>
            </div>
            <p>Read-only historical facts. Corrections require a new change.</p>
            {readHistory(a.session)
              .filter(
                (e) =>
                  (!category || category === e.category) &&
                  e.actor.toLowerCase().includes(actor.toLowerCase()) &&
                  e.action.toLowerCase().includes(query.toLowerCase()) &&
                  (!from || e.at.slice(0, 10) >= from) &&
                  (!to || e.at.slice(0, 10) <= to),
              )
              .reverse()
              .map((e) => (
                <article className="border rounded-lg p-4" key={e.id}>
                  <p className="font-semibold">
                    {e.category} · {e.action}
                  </p>
                  <p>
                    {e.before} → {e.after}
                  </p>
                  <details className="mt-2"><summary>Reason and audit context</summary><p>{e.reason}</p>
                  <p className="text-sm">
                    {e.actor} ({e.actorId}) · {e.at} · {e.environment} · {e.id}
                  </p></details>
                </article>
              ))}
            {!readHistory(a.session).length && (
              <p>No configuration changes recorded.</p>
            )}
          </>
        )}
      </section>
      {preview && (
        <Dialog label="Configuration change preview" onClose={()=>setPreview(null)}><div className="space-y-3">
          <h2 className="text-xl font-semibold">
            Confirm configuration change
          </h2>
          <p>Current: {preview.before}</p>
          <p>
            Proposed: {preview.after} · {preview.direction}
          </p>
          <p>Reason: {preview.reason}</p>
          {preview.warnings.map((w) => (
            <p key={w}>{w}</p>
          ))}
          <p>
            {preview.request.category === "Business Date"
              ? "No process execution or history rollback occurs. Reset to Real Time preserves every business record."
              : "Future contact eligibility uses this value immediately. Prior KYC decisions remain preserved."}
          </p>
          <button className={button} onClick={confirm}>
            Confirm and apply
          </button>{" "}
          <button className={field} onClick={() => setPreview(null)}>
            Cancel
          </button>
        </div></Dialog>
      )}
    </main>
  )
}
