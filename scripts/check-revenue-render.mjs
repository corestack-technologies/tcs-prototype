import { createServer } from "vite"
import { createElement } from "react"
import { renderToStaticMarkup } from "react-dom/server"
import assert from "node:assert/strict"
const server = await createServer({
  server: { middlewareMode: true, hmr: false },
  appType: "custom",
})
try {
  const { RevenuePanel } = await server.ssrLoadModule(
    "/src/reconciliation/RevenuePanel.tsx",
  )
  const { reconciliationDemo } = await server.ssrLoadModule(
    "/src/reconciliation/seeds.ts",
  )
  const { seedPersona } = await server.ssrLoadModule("/src/clients/seeds.ts"),
    { seedOrganization } = await server.ssrLoadModule(
      "/src/organizations/seeds.ts",
    )
  const org = seedOrganization(seedPersona("verified"), "active")
  const scenarios = [
    "TCS share due",
    "TCS share awaiting confirmation",
    "TCS share settled",
    "TCS share overdue",
    "TCS share restricted",
    "TCS share partial payout",
    "TCS share payment exception",
  ]
  for (const scenario of scenarios) {
    const { state } = reconciliationDemo(
      org,
      "render-revenue-" + scenario,
      scenario,
    )
    const html = renderToStaticMarkup(
      createElement(RevenuePanel, { state, onRecord: () => true }),
    )
    assert.ok(html.includes("Corestack Technologies Ltd. (demo)"))
    assert.ok(html.includes("DEMO-TCS-001"))
    assert.ok(html.includes("Unique payment reference"))
    assert.ok(!html.includes("NaN"))
    assert.ok(!html.includes("undefined"))
    assert.ok(!html.includes(">Confirm receipt<"))
    if (scenario === "TCS share awaiting confirmation") {
      assert.ok(html.includes("Awaiting TCS confirmation"))
      assert.ok(!html.includes("Record Payment"))
    }
    if (scenario === "TCS share settled")
      assert.ok(html.includes("finance-reviewer"))
    if (scenario === "TCS share payment exception")
      assert.ok(html.includes("Amount mismatch"))
    if (scenario === "TCS share due")
      assert.ok(html.includes("Record transfer · Await TCS confirmation"))
  }
  console.log("7 revenue-share payment render checks passed.")
} finally {
  await server.close()
}
