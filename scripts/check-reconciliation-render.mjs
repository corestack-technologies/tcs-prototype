import { createServer } from "vite"
import { renderToStaticMarkup } from "react-dom/server"
import { createElement } from "react"
import assert from "node:assert/strict"
const server = await createServer({
  server: { middlewareMode: true, hmr: false },
  appType: "custom",
})
try {
  const { ReconciliationBody } = await server.ssrLoadModule(
    "/src/reconciliation/ReconciliationBody.tsx",
  )
  const { PaymentBody } = await server.ssrLoadModule(
    "/src/payments/PaymentBody.tsx",
  )
  const { reconciliationDemo, RECONCILIATION_DEMOS } =
    await server.ssrLoadModule("/src/reconciliation/seeds.ts")
  const { seedPersona } = await server.ssrLoadModule("/src/clients/seeds.ts"),
    { seedOrganization } = await server.ssrLoadModule(
      "/src/organizations/seeds.ts",
    )
  const organization = seedOrganization(seedPersona("verified"), "active")
  let count = 0
  for (const scenario of RECONCILIATION_DEMOS) {
    const { group, state } = reconciliationDemo(
      organization,
      "render-recon-" + scenario,
      scenario,
    )
    const owner = renderToStaticMarkup(
      createElement(ReconciliationBody, {
        organization,
        groups: [group],
        state,
        selected: group,
        onManual: () => true,
        onHandoff: () => true,
      }),
    )
    assert.ok(owner.includes("Settlement &amp; reconciliation"))
    assert.ok(owner.includes("Items requiring attention"))
    assert.ok(!owner.includes("NaN"))
    assert.ok(!owner.includes("undefined"))
    assert.equal(
      owner.includes("Record permitted manual/offline receipt"),
      scenario.startsWith("Manual"),
    )
    assert.ok(!owner.includes("Mark Member Paid"))
    assert.ok(!owner.includes("Waive Organization Fee"))
    for (const memberId of [organization.ownerMemberId, "c2"]) {
      const member = renderToStaticMarkup(
        createElement(PaymentBody, { organization, group, memberId }),
      )
      assert.ok(!member.includes("Provider processing cost"))
      assert.ok(!member.includes("Expected net"))
      assert.ok(!member.includes("settlement batch"))
      assert.ok(!member.replace(/<[^>]*>/g, "").includes("TCS share"))
      if (scenario.startsWith("Manual") && memberId === "c2")
        assert.ok(member.includes("Manual/offline contribution"))
      count++
    }
    count++
  }
  console.log(
    count + " reconciliation Organization and Member render checks passed.",
  )
} finally {
  await server.close()
}
