import { createServer } from "vite"
import { renderToStaticMarkup } from "react-dom/server"
import { createElement } from "react"
import assert from "node:assert/strict"
const server = await createServer({
  server: { middlewareMode: true, hmr: false },
  appType: "custom",
})
try {
  const { PaymentBody, PaymentReceipt } = await server.ssrLoadModule(
    "/src/payments/PaymentBody.tsx",
  )
  const { paymentDemo, PAYMENT_DEMOS } = await server.ssrLoadModule(
    "/src/payments/seeds.ts",
  )
  const { seedOrganization } = await server.ssrLoadModule(
    "/src/organizations/seeds.ts",
  )
  const { seedPersona } = await server.ssrLoadModule("/src/clients/seeds.ts")
  const { cycleOf } = await server.ssrLoadModule("/src/groups/model.ts")
  const organization = seedOrganization(seedPersona("verified"), "active")
  let count = 0
  for (const scenario of PAYMENT_DEMOS) {
    const group = paymentDemo(organization, "render-" + scenario, scenario),
      cycle = cycleOf(group)
    for (const memberId of [
      undefined,
      organization.ownerMemberId,
      "c3",
      "c2",
    ]) {
      const html = renderToStaticMarkup(
        createElement(PaymentBody, {
          group,
          organization,
          memberId,
          initialRoundId:
            scenario === "Optional-only recipient"
              ? cycle.active.rounds[1].id
              : undefined,
        }),
      )
      assert.ok(html.includes("Cycle 1"))
      assert.ok(!html.includes("NaN"))
      assert.ok(!html.includes("undefined"))
      assert.ok(!html.includes("Mark Member Paid"))
      assert.ok(!html.includes("Approve contribution"))
      count++
      if (memberId) {
        assert.ok(!html.includes("Members still outstanding"))
        assert.ok(!html.includes("Payments needing attention"))
      }
      if (!memberId && scenario === "Optional contribution skipped / ready")
        assert.ok(html.includes("Ready for payout"))
      if (memberId === "c2" && scenario === "Optional-only recipient") {
        assert.ok(
          html.includes("No required contribution outstanding this Round"),
        )
        assert.ok(!html.includes("Pay required amount"))
      }
    }
    for (const transaction of group.payments?.transactions || []) {
      const receipt = renderToStaticMarkup(
        createElement(PaymentReceipt, { group, transaction }),
      )
      assert.ok(receipt.includes(transaction.providerReference))
      assert.ok(!receipt.includes("NaN"))
      assert.ok(!receipt.includes("undefined"))
      assert.ok(receipt.includes("Prototype payment receipt"))
      count++
    }
  }
  console.log(
    count +
      " Member, Organization and contribution receipt render checks passed.",
  )
} finally {
  await server.close()
}
