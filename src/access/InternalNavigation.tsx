import '../internal/internal.css'
import { ResponsiveNavigation } from '../design/foundation'
import { canReport } from '../reports/permissions'
import type { View } from "../App"
import { useAccess } from "./AccessContext"
import { canAccessModule, currentUser } from "./authorization"
export function InternalNavigation({
  navigate,
  current,
}: {
  navigate: (v: View) => void
  current?: View
}) {
  const a = useAccess()
  return (
    <header className="internal-header p-5">
      <a href="#internal-main" className="sr-only focus:not-sr-only focus:block focus:p-3">Skip to workspace content</a>
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="font-bold text-xl">TCS · Internal workspace</p>
          <p className="text-xs text-slate-300 mt-1">
            Prototype user selection · no real authentication
          </p>
        </div>
        <details className="text-sm w-full sm:w-auto sm:max-w-sm"><summary>Demo user selection</summary><label className="block mt-3 min-w-0">
          Active internal user
          <select
            aria-label="Active internal user"
            className="block w-full max-w-full rounded-lg bg-white text-slate-900 p-2 mt-1"
            value={a.session?.personaId || ""}
            onChange={(e) => a.select(e.target.value || null)}
          >
            <option value="">Select a user</option>
            {a.state.users.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name} · {u.status}
              </option>
            ))}
          </select>
        </label></details>
        <ResponsiveNavigation label="Internal navigation" currentLabel="Internal workspace menu">
 {canAccessModule(a.session,"scheduled-processes") && <button aria-current={current === "scheduled-processes" ? "page" : undefined} onClick={()=>navigate("scheduled-processes")}>Scheduled Processes</button>}
 {canAccessModule(a.session, "settings") && <button aria-current={current === 'settings' ? 'page' : undefined} onClick={() => navigate("settings")}>Settings</button>}
          {canReport(a.session) && <button aria-current={current === 'internal-reports' ? 'page' : undefined} onClick={() => navigate("internal-reports")}>Reports</button>}
          {canAccessModule(a.session, "operations") && (
            <button aria-current={current === 'operations' ? 'page' : undefined} onClick={() => navigate("operations")}>Operations</button>
          )}
          {canAccessModule(a.session, "access-management") && (
            <button aria-current={(current === 'access-management' || current === 'security') ? 'page' : undefined} onClick={() => navigate("access-management")}>
              Access Management
            </button>
          )}
          <button
            onClick={() => {
              a.select(null)
              navigate("login")
            }}
          >
            Exit internal workspace
          </button>
        </ResponsiveNavigation>
      </div>
      {a.session && (
        <p className="max-w-7xl mx-auto text-xs mt-3">
          {currentUser(a.session)?.name} ·{" "}
          {a.state.roles
            .filter((r) => currentUser(a.session)?.roleIds.includes(r.id))
            .map((r) => r.name)
            .join(", ") || "No roles assigned"}
        </p>
      )}
    </header>
  )
}
export function InternalDenied({
  navigate,
  module,
}: {
  navigate: (v: View) => void
  module: string
}) {
  return (
    <>
      <InternalNavigation navigate={navigate} />
      <main id="internal-main" tabIndex={-1} className="max-w-3xl mx-auto p-8">
        <h1 className="text-2xl font-bold">{module}</h1>
        <p role="alert" className="mt-4">
          Access denied. Select an Active internal user with the required
          permissions.
        </p>
      </main>
    </>
  )
}
