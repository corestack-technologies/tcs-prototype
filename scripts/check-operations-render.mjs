import { createServer } from "vite"
import { renderToStaticMarkup } from "react-dom/server"
import { createElement } from "react"
import assert from "node:assert/strict"
const server = await createServer({
  server: { middlewareMode: true, hmr: false },
  appType: "custom",
})
try {
  const {seedSession}=await server.ssrLoadModule('/src/access/seeds.ts')
  const { CaseDetail, OperationsQueue, Overview } = await server.ssrLoadModule(
    "/src/operations/OperationsBody.tsx",
  )
  const { SourceRecord, OperationsWorkspace } = await server.ssrLoadModule(
    "/src/operations/OperationsWorkspace.tsx",
  )
  const { operationsDemoWorld } = await server.ssrLoadModule(
    "/src/operations/seeds.ts",
  )
  const { projectCases } = await server.ssrLoadModule(
    "/src/operations/sources.ts",
  )
  const { seedPersona, demoPersonas } = await server.ssrLoadModule(
    "/src/clients/seeds.ts",
  )
  const { seedOrganization } = await server.ssrLoadModule(
    "/src/organizations/seeds.ts",
  )
  const { ClientProvider } = await server.ssrLoadModule(
      "/src/clients/ClientContext.tsx",
    ),
    { OrganizationProvider } = await server.ssrLoadModule(
      "/src/organizations/OrganizationContext.tsx",
    ),
    { GroupProvider } = await server.ssrLoadModule(
      "/src/groups/GroupContext.tsx",
    ),
    { OperationsProvider } = await server.ssrLoadModule(
      "/src/operations/OperationsContext.tsx",
    )
  const org = seedOrganization(seedPersona("verified"), "active"),
    sources = {
      clients: demoPersonas.map((p) => seedPersona(p.id)),
      organizations: [
        org,
        seedOrganization(seedPersona("verified"), "pending"),
      ],
      worlds: [operationsDemoWorld(org)],
    },
    session = seedSession("ops-analyst"),
    cases = projectCases(sources, session),
    noop = () => {},
    now = "2100-01-01T00:00:00Z"
  let count = 0
  for (const item of cases) {
    const html = renderToStaticMarkup(
      createElement(CaseDetail, {
        item,
        now,
        onAction: noop,
        onSource: noop,
        onBack: noop,
      }),
    )
    assert.ok(html.includes(item.reference))
    assert.ok(html.includes("Business context"))
    assert.ok(html.includes("Evidence"))
    assert.ok(html.includes("Timeline"))
    assert.ok(!html.includes("NaN"))
    assert.ok(!html.includes("undefined"))
    assert.ok(!html.includes("Invalid Date"))
    const source = renderToStaticMarkup(
      createElement(SourceRecord, { item, sources }),
    )
    assert.ok(source.includes("Read-only source record"))
    assert.ok(!source.includes("<input"))
    assert.ok(!source.includes("<textarea"))
    assert.ok(!source.includes("Record transfer from Organization bank"))
    assert.ok(!source.includes("Refresh validated bank instruction"))
    assert.ok(!source.includes("NaN"))
    assert.ok(!source.includes("undefined"))
    count += 2
  }
  for (const view of [
    "Overview",
    "All Cases",
    "My Queue",
    "Reviews",
    "Financial Exceptions",
    "Disputes / Escalations",
    "History / Resolved",
  ]) {
    const html = renderToStaticMarkup(
      createElement(OperationsQueue, {
        cases,
        session,
        now,
        filters: { view },
        onFilters: noop,
        onOpen: noop,
      }),
    )
    assert.ok(html.includes("Search cases"))
    assert.ok(html.includes("Case status"))
    count++
  }
  assert.ok(
    renderToStaticMarkup(
      createElement(Overview, { cases, session, onView: noop }),
    ).includes("Operations overview"),
  )
  count++
  const { AccessProvider } = await server.ssrLoadModule("/src/access/AccessContext.tsx")
  const entry = renderToStaticMarkup(
    createElement(
      AccessProvider,
      null,
      createElement(ClientProvider,
      null,
      createElement(
        OrganizationProvider,
        null,
        createElement(
          GroupProvider,
          null,
          createElement(
            OperationsProvider,
            null,
            createElement(OperationsWorkspace, { navigate: noop }),
          ),
        ),
      ),
    ),
  ))
  assert.ok(entry.includes("Active internal user"))
  assert.ok(!entry.includes("Case status"))
  count++
  console.log(
    `${count} Operations detail, source, queue, overview and internal-entry render checks passed.`,
  )
} finally {
  await server.close()
}
