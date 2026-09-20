import { createServer } from "vite"
import { renderToStaticMarkup } from "react-dom/server"
import { createElement } from "react"
import assert from "node:assert/strict"
const server = await createServer({
  server: { middlewareMode: true, hmr: false },
  appType: "custom",
})
try {
  const { LifecycleHistory } = await server.ssrLoadModule(
    "/src/lifecycle/LifecycleHistory.tsx",
  )
  const { ActiveCycleBody } = await server.ssrLoadModule(
    "/src/rounds/ActiveCycleBody.tsx",
  )
  const { lifecycleDemo, LIFECYCLE_DEMOS } = await server.ssrLoadModule(
    "/src/lifecycle/seeds.ts",
  )
  const { seedOrganization } = await server.ssrLoadModule(
    "/src/organizations/seeds.ts",
  )
  const { seedPersona } = await server.ssrLoadModule("/src/clients/seeds.ts")
  const organization = seedOrganization(seedPersona("verified"), "active")
  let count = 0
  for (const name of LIFECYCLE_DEMOS) {
    const group = lifecycleDemo(organization, "render-" + name, name)
    for (const cycle of group.cycles)
      for (const memberId of [undefined, organization.ownerMemberId]) {
        const html = renderToStaticMarkup(
          createElement(LifecycleHistory, { group, cycle, memberId }),
        )
        assert.ok(html.includes("Cycle " + cycle.number))
        assert.ok(!html.includes("NaN"))
        assert.ok(!html.includes("undefined"))
        assert.ok(!html.includes("Pay now"))
        count++
        if (cycle.status === "activated") {
          const active = renderToStaticMarkup(
            createElement(ActiveCycleBody, {
              group,
              cycle,
              active: cycle.active,
              organization,
              memberId,
            }),
          )
          assert.ok(!active.includes("NaN"))
          assert.ok(!active.includes("undefined"))
          count++
        }
        if (name === "Completed with recovery")
          assert.ok(html.includes("COMPLETED WITH OUTSTANDING RECOVERY"))
      }
  }
  console.log(
    count +
      " lifecycle and active-cycle Member/Organization render checks passed.",
  )
} finally {
  await server.close()
}
