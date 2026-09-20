import { createServer } from "vite"
import { renderToStaticMarkup } from "react-dom/server"
import { createElement } from "react"
import assert from "node:assert/strict"
const server = await createServer({
  server: { middlewareMode: true, hmr: false },
  appType: "custom",
})
try {
  const { ActiveCycleBody } = await server.ssrLoadModule(
    "/src/rounds/ActiveCycleBody.tsx",
  )
  const { roundDemo } = await server.ssrLoadModule("/src/rounds/seeds.ts")
  const { seedOrganization } = await server.ssrLoadModule(
    "/src/organizations/seeds.ts",
  )
  const { seedPersona } = await server.ssrLoadModule("/src/clients/seeds.ts")
  const { cycleOf, exampleFeeBoundary } = await server.ssrLoadModule(
    "/src/groups/model.ts",
  )
  const organization = seedOrganization(seedPersona("verified"), "active")
  for (const scenario of [
    "Upcoming",
    "Late / partial",
    "Collection ready · optional skipped",
    "Half recipients · prior history",
  ]) {
    const group = roundDemo(
        organization,
        "render-" + scenario,
        exampleFeeBoundary(),
        "Monthly",
        scenario,
      ),
      cycle = cycleOf(group)
    for (const memberId of [undefined, organization.ownerMemberId]) {
      const html = renderToStaticMarkup(
        createElement(ActiveCycleBody, {
          group,
          cycle,
          active: cycle.active,
          organization,
          memberId,
        }),
      )
      assert.ok(html.includes(group.name.replaceAll("&", "&amp;")))
      assert.ok(html.includes("Cycle 1"))
      assert.ok(!html.includes("NaN"))
      assert.ok(!html.includes("Pay now"))
      if (scenario === "Upcoming")
        assert.ok(html.includes("Upcoming contribution preview"))
      if (memberId) assert.ok(html.includes("My contribution"))
      else assert.ok(html.includes("Scheduled Payout Value"))
    }
  }
  console.log("8 Active Cycle Member/Organization render smoke checks passed.")
} finally {
  await server.close()
}
