import { createServer } from "vite"
import { createElement as h } from "react"
import { renderToStaticMarkup } from "react-dom/server"
import assert from "node:assert/strict"
const server = await createServer({
  server: { middlewareMode: true, hmr: false },
  appType: "custom",
})
try {
  const load = (p) => server.ssrLoadModule("/src/" + p)
  const { AccessProvider } = await load("access/AccessContext.tsx"),
    { ClientProvider } = await load("clients/ClientContext.tsx"),
    { OrganizationProvider } = await load(
      "organizations/OrganizationContext.tsx",
    ),
    { GroupProvider } = await load("groups/GroupContext.tsx"),
    { OperationsProvider } = await load("operations/OperationsContext.tsx"),
    { default: App } = await load("App.tsx")
  const previous = globalThis.window
  globalThis.window = { location: { pathname: "/settings" } }
  try {
    for (const id of [
      undefined,
      "settings-admin",
      "settings-viewer",
      "runtime-manager",
      "date-manager",
      "ops-analyst",
      "ops-supervisor",
      "access-admin",
      "suspended-user",
    ]) {
      const child = [
          ClientProvider,
          OrganizationProvider,
          GroupProvider,
          OperationsProvider,
        ].reduceRight((c, P) => h(P, null, c), h(App)),
        html = renderToStaticMarkup(
          h(AccessProvider, { initialUserId: id }, child),
        ),
        allowed = [
          "settings-admin",
          "settings-viewer",
          "runtime-manager",
          "date-manager",
        ].includes(id)
      assert.equal(html.includes("Access denied."), !allowed, String(id))
      if (allowed) {
        assert.ok(html.includes("Contact verification mode"))
        assert.equal(
          html.includes("Preview control change"),
          ["settings-admin", "runtime-manager"].includes(id),
        )
        assert.equal(
          html.includes("Environment · Business Date"),
          id !== "runtime-manager",
        )
      }
    }
  } finally {
    globalThis.window = previous
  }
  console.log("9 Settings route and permission render checks passed.")
} finally {
  await server.close()
}
