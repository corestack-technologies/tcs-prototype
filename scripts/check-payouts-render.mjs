import { createServer } from "vite"
import { renderToStaticMarkup } from "react-dom/server"
import { createElement } from "react"
import assert from "node:assert/strict"
const server = await createServer({
  server: { middlewareMode: true, hmr: false },
  appType: "custom",
})
try {
  const { PayoutBody } = await server.ssrLoadModule(
    "/src/payouts/PayoutBody.tsx",
  )
  const { payoutDemo, PAYOUT_DEMOS } = await server.ssrLoadModule(
    "/src/payouts/seeds.ts",
  )
  const { seedPersona } = await server.ssrLoadModule("/src/clients/seeds.ts")
  const { seedOrganization } = await server.ssrLoadModule(
    "/src/organizations/seeds.ts",
  )
  const organization = seedOrganization(seedPersona("verified"), "active")
  let count = 0
  for (const name of PAYOUT_DEMOS) {
    const group = payoutDemo(organization, "render-" + name, name)
    for (const memberId of [undefined, ...new Set(group.payouts.records.map(p=>p.memberId))]) {
      const html = renderToStaticMarkup(
        createElement(PayoutBody, {
          group,
          organization,
          memberId,
          banks: group.payouts.demoBanks,
          onAction: () => true,
        }),
      )
      assert.ok(html.includes("Scheduled Payout Value"))
      assert.ok(!html.includes("undefined"))
      assert.ok(!html.includes("NaN"))
      assert.ok(!html.includes("Send Money"))
      assert.ok(html.includes("Organization Fee"))
      if (memberId) {
        assert.ok(!html.includes("Record transfer from Organization bank"))
        assert.ok(!html.includes("TCS share attributable"))
      } else assert.ok(!html.includes("Confirm receipt ·"))
      if (name === "Confirmation window elapsed")
        assert.ok(html.includes("no Member confirmation was recorded"))
      count++
    }
  }
  console.log(count + " payout Member/Organization render checks passed.")
} finally {
  await server.close()
}
