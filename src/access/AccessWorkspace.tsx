import { DisplayDate } from '../design/foundation'
import { AuditValue } from '../internal/Presentation'
import {PrivilegedPreview} from './PrivilegedPreview'
import {SecurityWorkspace,UserSecurity} from './SecurityWorkspace'
import type {AccessPreview} from './preview'
import { useState } from "react"
import type { View } from "../App"
import { useAccess } from "./AccessContext"
import {
  canAccessModule,
  effectivePermissions,
  hasPermission,
} from "./authorization"
import { catalogue, privilegedRole, sensitivePermissions, type UserStatus } from "./model"
import type { AccessAction } from "./service"
import { InternalDenied, InternalNavigation } from "./InternalNavigation"
const box = "rounded-xl border border-slate-200 bg-white p-5",
  field = "rounded-lg border border-slate-300 p-2 w-full text-sm",
  button =
    "rounded-lg bg-blue-800 text-white px-4 py-2 text-sm disabled:opacity-40"
export function AccessWorkspace({
  navigate,
  initialTab = "Users",
  initialSelected = "",
}: {
  navigate: (v: View) => void
  initialTab?: string
  initialSelected?: string
}) {
  const a = useAccess(),
    [tab, setTab] = useState(initialTab),
    [selected, setSelected] = useState(initialSelected),
    [search, setSearch] = useState(""),
    [filter, setFilter] = useState(""),
    [name, setName] = useState(""),
    [identifier, setIdentifier] = useState(""),
    [initial, setInitial] = useState<"Pending" | "Active">("Pending"),
    [initialRoles, setInitialRoles] = useState<string[]>([]),
    [reason, setReason] = useState(""),
    [error, setError] = useState(""),
    [message, setMessage] = useState(""),
    [preview,setPreview]=useState<AccessPreview|null>(null),
    [privilegedOnly,setPrivilegedOnly]=useState(false)
  if (!canAccessModule(a.session, "access-management"))
    return <InternalDenied navigate={navigate} module="Access Management" />
  if(initialTab==='Security'&&!canAccessModule(a.session,'security'))return <InternalDenied navigate={navigate} module="Security"/>
  const can = (p: string) => hasPermission(a.session, p),
    u = a.state.users.find((u) => u.id === selected),
    r = a.state.roles.find((r) => r.id === selected)
  const run = (action: AccessAction) => {
    try {
      const next=a.preview(action,reason)
      if(next.event?.privileged){setPreview(next);setError('');setMessage('');return}
      a.change(action, reason)
      setError("")
      setMessage(
        "Access change recorded. Permissions are effective immediately.",
      )
    } catch (e) {
      setError((e as Error).message)
      setMessage("")
    }
  }
  const choose = (id: string) => {
    setPreview(null)
    setSelected(id)
    setReason("")
    setError("")
    setMessage("")
    const item =
      a.state.users.find((u) => u.id === id) ||
      a.state.roles.find((r) => r.id === id)
    setName(item?.name || "")
    setIdentifier(
      item && "identifier" in item
        ? item.identifier
        : item && "purpose" in item
          ? item.purpose
          : "",
    )
  }
  const tabs = [
    ...(can("access.users.view") ? ["Users"] : []),
    ...(can("access.roles.view") ? ["Roles", "Permission Catalogue"] : []),
    ...(can('access.users.view')||can('access.roles.view')?['Access Audit']:[]),
    ...(canAccessModule(a.session,'security')?['Security']:[]),
  ]
  const activeTab = tabs.includes(tab) ? tab : tabs[0]
  const permissions = (keys: string[]) =>
    [...new Set(catalogue.map((p) => p.domain))].map((domain) => (
      <section key={domain}>
        <h3 className="font-semibold mt-4 mb-2">{domain}</h3>
        <ul className="text-sm space-y-2">
          {catalogue
            .filter((p) => p.domain === domain && keys.includes(p.key))
            .map((p) => (
              <li key={p.key}>
                {p.label}
                <span className="block text-xs text-slate-500 break-all">
                  {p.key}
                </span>
              </li>
            ))}
        </ul>
      </section>
    ))
  const history = a.state.history.filter(
    (e) => (activeTab === "Access Audit" || e.target === selected)&&(!privilegedOnly||e.privileged),
  )
  return (
    <div className="min-h-screen bg-[#F4F6FA] text-slate-900">
      <InternalNavigation navigate={navigate} current="access-management" />
      <main id="internal-main" tabIndex={-1} className="max-w-7xl mx-auto p-5 space-y-5">
        <h1 className="text-3xl font-bold">Access Management</h1>
        <nav aria-label="Access Management sections" className="flex flex-wrap gap-3">
          {tabs.map((t) => (
            <button
              aria-current={tab === t ? "page" : undefined}
              key={t}
              className={tab === t ? button : "text-sm px-4 py-2"}
              onClick={() => {
                setTab(t)
                choose("")
                setSearch("")
                setFilter("")
              }}
            >
              {t}
            </button>
          ))}
        </nav>
        {activeTab==='Security'&&<SecurityWorkspace key={a.session?.personaId}/>}
        {preview&&<PrivilegedPreview preview={preview} state={a.state} onCancel={()=>setPreview(null)} onApply={()=>{try{a.applyPreview(preview);setPreview(null);setError('');setMessage('Sensitive access change applied and audited.')}catch(e){setError((e as Error).message);setPreview(null)}}}/>}
        {error && (
          <p role="alert" className="text-red-700">
            {error}
          </p>
        )}
        {message && (
          <p role="status" className="text-green-800">
            {message}
          </p>
        )}
        {["Users", "Roles"].includes(activeTab) && (
          <>
            <div className="flex gap-3">
              <input
                aria-label="Search directory"
                className={field}
                placeholder="Search name or identifier"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              {activeTab === "Users" && (
                <select
                  aria-label="Filter status"
                  className={field}
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                >
                  <option value="">All statuses</option>
                  {["Pending", "Active", "Suspended", "Deactivated"].map(
                    (s) => (
                      <option key={s}>{s}</option>
                    ),
                  )}
                </select>
              )}
            </div>
            <div className="grid md:grid-cols-3 gap-4">
              {activeTab === "Users"
                ? a.state.users
                    .filter(
                      (u) =>
                        (!filter || u.status === filter) &&
                        (u.name + " " + u.identifier)
                          .toLowerCase()
                          .includes(search.toLowerCase()),
                    )
                    .map((u) => (
                      <button
                        key={u.id}
                        className={box + " text-left"}
                        onClick={() => choose(u.id)}
                      >
                        <strong>{u.name}</strong>
                        <p className="text-sm break-all">{u.identifier}</p>
                        <p className="text-sm mt-2">{u.status}</p>
                        <p className="text-sm text-slate-600 mt-2">
                          {a.state.roles
                            .filter((r) => u.roleIds.includes(r.id))
                            .map((r) => r.name)
                            .join(", ") || "No roles"}
                        </p>
                        <p className="text-xs mt-2">
                          {
                            effectivePermissions({
                              ...a.session!,
                              personaId: u.id,
                            }).length
                          }{" "}
                          effective permissions
                        </p>
                      </button>
                    ))
                : a.state.roles
                    .filter((r) =>
                      r.name.toLowerCase().includes(search.toLowerCase()),
                    )
                    .map((r) => (
                      <button
                        key={r.id}
                        className={box + " text-left"}
                        onClick={() => choose(r.id)}
                      >
                        <strong>{r.name}</strong>
                        <p className="text-sm mt-2">{r.purpose}</p>
                        <p className="text-xs mt-2">
                          {r.active ? "Active" : "Inactive"} ·{" "}
                          {r.permissions.length} permissions ·{" "}
                          {
                            a.state.users.filter((u) =>
                              u.roleIds.includes(r.id),
                            ).length
                          }{" "}
                          assigned users
                        </p>
                        {r.baseline && (
                          <p className="text-xs mt-2">
                            Protected baseline role
                          </p>
                        )}
                      </button>
                    ))}
            </div>
          </>
        )}
        {((activeTab === "Users" && can("access.users.maintain")) ||
          (activeTab === "Roles" && can("access.roles.maintain"))) &&
          !selected && (
            <section className={box}>
              <h2 className="font-bold">
                Create {activeTab === "Users" ? "internal user" : "role"}
              </h2>
              <div className="grid sm:grid-cols-2 gap-3 mt-4">
                <label>
                  Name
                  <input
                    className={field}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </label>
                <label>
                  {activeTab === "Users"
                    ? "Internal email / identifier"
                    : "Role purpose"}
                  <input
                    className={field}
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                  />
                </label>
              </div>
              {activeTab === "Users" && (
                <>
                  <label className="block mt-3">
                    Initial status
                    <select
                      className={field}
                      value={initial}
                      onChange={(e) =>
                        setInitial(e.target.value as typeof initial)
                      }
                    >
                      <option>Pending</option>
                      <option>Active</option>
                    </select>
                  </label>
                  {can("access.assignments.maintain") && (
                    <fieldset className="mt-3">
                      <legend>Initial roles (optional)</legend>
                      {a.state.roles
                        .filter((r) => r.active)
                        .map((r) => (
                          <label className="block text-sm mt-2" key={r.id}>
                            <input
                              type="checkbox"
                              checked={initialRoles.includes(r.id)}
                              onChange={(e) =>
                                setInitialRoles(
                                  e.target.checked
                                    ? [...initialRoles, r.id]
                                    : initialRoles.filter((id) => id !== r.id),
                                )
                              }
                            />{" "}
                            {r.name}
                          </label>
                        ))}
                    </fieldset>
                  )}
                </>
              )}
              <label className="block mt-3">
                Reason for privileged initial roles
                <input
                  className={field}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                />
              </label>
              <button
                className={button + " mt-4"}
                onClick={() =>
                  run(
                    activeTab === "Users"
                      ? {
                          type: "create-user",
                          name,
                          identifier,
                          status: initial,
                          roleIds: initialRoles,
                        }
                      : { type: "create-role", name, purpose: identifier },
                  )
                }
              >
                Create {activeTab === "Users" ? "user" : "role"}
              </button>
            </section>
          )}
        {selected &&
          ((activeTab === "Users" && u) || (activeTab === "Roles" && r)) && (
            <section className={box}>
              <button className="tcs-link text-sm" onClick={() => choose("")}>
                Close detail
              </button>
              <h2 className="text-2xl font-bold mt-3">{u?.name || r?.name}</h2>
              <label className="block mt-4 text-sm">
                Change reason · required for suspension, deactivation and
                sensitive access changes
                <textarea
                  aria-label="Access change reason"
                  className={field}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                />
              </label>
              {u && activeTab === "Users" && (
                <>
                  <p className="text-sm mt-3">
                    {u.identifier} · {u.status} · ID: {u.id}
                  </p>
                  <p className="text-sm mt-2">
                    Created {u.createdAt} by {u.createdBy}
                  </p>
                  <p className="text-sm mt-2">
                    Activated: {u.activatedAt || "—"} · Suspended:{" "}
                    {u.suspendedAt || "—"} · Deactivated:{" "}
                    {u.deactivatedAt || "—"}
                  </p>
                  <p className="text-sm">{u.reason}</p>
                  {can("access.users.maintain") && (
                    <>
                      <div className="grid sm:grid-cols-2 gap-3 mt-4">
                        <label>
                          Name
                          <input
                            className={field}
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                          />
                        </label>
                        <label>
                          Identifier
                          <input
                            className={field}
                            value={identifier}
                            onChange={(e) => setIdentifier(e.target.value)}
                          />
                        </label>
                      </div>
                      <button
                        className={button + " mt-3"}
                        onClick={() =>
                          run({
                            type: "update-user",
                            id: u.id,
                            name,
                            identifier,
                          })
                        }
                      >
                        Save identity
                      </button>
                      <div className="flex gap-3 mt-4">
                        {({
                          Pending: ["Active", "Deactivated"],
                          Active: ["Suspended", "Deactivated"],
                          Suspended: ["Active", "Deactivated"],
                          Deactivated: [],
                        } as Record<UserStatus, UserStatus[]>)[u.status].map(
                          (status) => (
                            <button
                              className={button}
                              key={status}
                              onClick={() =>
                                run({ type: "status", id: u.id, status })
                              }
                            >
                              {status === "Active"
                                ? u.status === "Suspended"
                                  ? "Reactivate"
                                  : "Activate"
                                : status === "Suspended"
                                  ? "Suspend"
                                  : "Deactivate"}
                            </button>
                          ),
                        )}
                      </div>
                    </>
                  )}
                  <UserSecurity userId={u.id}/><h3 className="font-bold mt-6">Assigned roles</h3>
                  {a.state.roles.map((role) => (
                    <div
                      className="flex justify-between gap-3 border-b py-3 text-sm"
                      key={role.id}
                    >
                      <span>
                        {role.name} {privilegedRole(role) && "· Sensitive"}{" "}
                        {u.roleIds.includes(role.id) ? "· Assigned" : ""}
                      </span>
                      {can("access.assignments.maintain") && (
                        <button
                          className="tcs-link"
                          disabled={
                            !role.active && !u.roleIds.includes(role.id)
                          }
                          onClick={() =>
                            run({
                              type: u.roleIds.includes(role.id)
                                ? "remove"
                                : "assign",
                              id: u.id,
                              roleId: role.id,
                            })
                          }
                        >
                          {u.roleIds.includes(role.id) ? "Remove" : "Assign"}
                        </button>
                      )}
                    </div>
                  ))}
                  <h3 className="font-bold mt-6">
                    Effective permissions (
                    {
                      effectivePermissions({ ...a.session!, personaId: u.id })
                        .length
                    }
                    )
                  </h3>
                  {u.status !== "Active" && (
                    <p className="text-sm">
                      No active access. Assigned roles and history are retained.
                    </p>
                  )}
                  {permissions(
                    effectivePermissions({ ...a.session!, personaId: u.id }),
                  )}
                </>
              )}
              {r && activeTab === "Roles" && (
                <>
                  <p className="mt-3">{r.purpose}</p>
                  <p className="text-sm mt-2">
                    Affected users:{" "}
                    {a.state.users
                      .filter((u) => u.roleIds.includes(r.id))
                      .map((u) => u.name)
                      .join(", ") || "None"}
                  </p>
                  <p className="text-sm mt-2">
                    Resulting bundle: {r.permissions.length} permissions ·{" "}
                    {r.active ? "Active" : "Inactive"}
                    {r.baseline ? " · Protected baseline" : ""}
                  </p>
                  {can("access.roles.maintain") && (
                    <>
                      <label className="block mt-3">
                        Role name
                        <input
                          className={field}
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                        />
                      </label>
                      <label className="block mt-3">
                        Purpose
                        <input
                          className={field}
                          value={identifier}
                          onChange={(e) => setIdentifier(e.target.value)}
                        />
                      </label>
                      <button
                        className={button + " mt-3"}
                        onClick={() =>
                          run({
                            type: "update-role",
                            id: r.id,
                            name,
                            purpose: identifier,
                            active: r.active,
                          })
                        }
                      >
                        Save role
                      </button>
                      {!r.baseline && (
                        <button
                          className={button + " ml-3"}
                          onClick={() =>
                            run({
                              type: "update-role",
                              id: r.id,
                              name: r.name,
                              purpose: r.purpose,
                              active: !r.active,
                            })
                          }
                        >
                          {r.active ? "Disable" : "Enable"} role
                        </button>
                      )}
                    </>
                  )}
                  {[...new Set(catalogue.map((p) => p.domain))].map(
                    (domain) => (
                      <fieldset key={domain} className="mt-5">
                        <legend className="font-bold">{domain}</legend>
                        {catalogue
                          .filter((p) => p.domain === domain)
                          .map((p) => (
                            <label key={p.key} className="block mt-3 text-sm">
                              <input
                                type="checkbox"
                                disabled={!can("access.roles.maintain")}
                                checked={r.permissions.includes(p.key)}
                                onChange={(e) =>
                                  run({
                                    type: e.target.checked
                                      ? "permission-add"
                                      : "permission-remove",
                                    id: r.id,
                                    permission: p.key,
                                  })
                                }
                              />{" "}
                              {p.label}
                              <span className="block ml-5 text-xs text-slate-500 break-all">
                                {p.key}
                              </span>
                            </label>
                          ))}
                      </fieldset>
                    ),
                  )}
                </>
              )}
            </section>
          )}
        {activeTab === "Permission Catalogue" &&
          [...new Set(catalogue.map((p) => p.domain))].map((domain) => (
            <section className={box} key={domain}>
              <h2 className="font-bold">{domain}</h2>
              <div className="grid md:grid-cols-2 gap-5 mt-4">
                {catalogue
                  .filter((p) => p.domain === domain)
                  .map((p) => (
                    <article key={p.key}>
                      <h3 className="font-semibold text-sm">{p.label}{sensitivePermissions.includes(p.key)&&" ? Sensitive"}</h3>
                      <code className="text-xs break-all">{p.key}</code>
                      <p className="text-sm text-slate-600 mt-1">
                        {p.description}
                      </p>
                    </article>
                  ))}
              </div>
            </section>
          ))}
        {(selected || activeTab === "Access Audit") && (
          <section className={box}>
            <h2 className="font-bold">Access history</h2><label className="block text-sm mt-3"><input type="checkbox" checked={privilegedOnly} onChange={e=>setPrivilegedOnly(e.target.checked)}/> Privileged changes only</label>
            {!history.length && (
              <p className="text-sm mt-3">
                No access changes recorded in this prototype session.
              </p>
            )}
            {[...history].reverse().map((e) => (
              <details key={e.id} className="border-b py-3">
                <summary className="text-sm cursor-pointer">
                  {e.privileged ? "Sensitive · " : ""}
                  {e.action} · {e.actor.name} · {<DisplayDate value={e.at}/>}
                </summary>
                <p className="text-sm mt-2">
                  Target:{" "}
                  {a.state.users.find((u) => u.id === e.target)?.name ||
                    a.state.roles.find((r) => r.id === e.target)?.name ||
                    e.target}
                </p>
                <p className="text-sm">
                  Reason: {e.reason || "Ordinary authorized maintenance"}
                </p>
                <p className="text-sm">
                  Authority at action:{" "}
                  {e.actor.roles.map((r) => r.name).join(", ")}
                </p>
                <div className="internal-audit grid gap-4 sm:grid-cols-2 mt-4"><section><h3 className="font-semibold mb-2">Before</h3><AuditValue value={e.before}/></section><section><h3 className="font-semibold mb-2">After</h3><AuditValue value={e.after}/></section></div>
              </details>
            ))}
          </section>
        )}
      </main>
    </div>
  )
}
