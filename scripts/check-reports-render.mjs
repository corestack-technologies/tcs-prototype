import { createServer } from 'vite'
import { createElement as h } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import assert from 'node:assert/strict'
const server = await createServer({ server: { middlewareMode: true, hmr: false }, appType: 'custom' })
try {
  const load = p => server.ssrLoadModule('/src/' + p)
  const { ReportBody, ReportsWorkspace } = await load('reports/ReportsWorkspace.tsx')
  const { reportCatalogue } = await load('reports/catalogue.ts')
  const { generateReport } = await load('reports/service.ts')
  const { seedPersona } = await load('clients/seeds.ts'), { seedOrganization } = await load('organizations/seeds.ts')
  const { paymentDemo, PAYMENT_DEMOS } = await load('payments/seeds.ts'), { payoutDemo, PAYOUT_DEMOS } = await load('payouts/seeds.ts')
  const { lifecycleDemo, LIFECYCLE_DEMOS } = await load('lifecycle/seeds.ts'), { reconciliationDemo, RECONCILIATION_DEMOS } = await load('reconciliation/seeds.ts')
  const org = seedOrganization(seedPersona('verified'), 'active')
  const directory = [{ id: org.id, name: org.form.name, ownerMemberId: org.ownerMemberId, workspace: true }]
  let count = 0
  for (const [family, scenarios, create, ids] of [
    ['payments', PAYMENT_DEMOS, paymentDemo, ['member-contributions', 'member-obligations', 'organization-collections', 'organization-payments', 'organization-rounds']],
    ['payouts', PAYOUT_DEMOS, payoutDemo, ['member-payouts', 'organization-payouts', 'organization-fees']],
    ['lifecycle', LIFECYCLE_DEMOS, lifecycleDemo, ['member-participation', 'organization-cycles', 'organization-recovery', 'organization-exits', 'organization-obligations']],
    ['reconciliation', RECONCILIATION_DEMOS, reconciliationDemo, ['organization-collections', 'organization-payments', 'organization-fees', 'organization-revenue']],
  ]) for (const scenario of scenarios) {
    const demo = create(org, 'report-render-' + family + scenario, scenario)
    const sources = { organizations: directory, worlds: [{ groups: [demo.group || demo], finance: demo.state }] }
    for (const id of ids) {
      const definition = reportCatalogue.find(d => d.id === id), audience = definition.audience
      const actor = audience === 'member' ? { kind: audience, memberId: org.ownerMemberId } : { kind: audience, memberId: org.ownerMemberId, organizationId: org.id }
      const report = (id, filters) => generateReport(sources, actor, id, filters, '2100-01-01T00:00:00.000Z')
      const html = renderToStaticMarkup(h(ReportBody, { audience, report, initialReport: id }))
      assert.ok(html.includes(definition.name.replaceAll('&', '&amp;')), id + ' title')
      assert.ok(html.includes('Generated:') && html.includes('Source reference dates:'))
      assert.ok(!html.includes('NaN') && !html.includes('undefined'), family + scenario + id)
      if (report(id).rows.length) assert.ok(html.includes('Source record &amp; details'))
      if (id === 'organization-obligations' && scenario === 'Recovery cleared / review due') {
        for (const label of ['CLEARED BY RECOVERY', 'Original Principal', 'Recovery Applied', 'Net Principal Outstanding', 'Penalty Outstanding', 'Original Due Date']) assert.ok(html.includes(label), label)
        assert.equal(report(id).summaries.find(s => s.key === 'outstanding').value, 0)
        assert.equal(report(id).summaries.find(s => s.key === 'penaltyOutstanding').value, 0)
      }
      count++
    }
  }
  for (const audience of ['member', 'organization']) {
    const html = renderToStaticMarkup(h(ReportBody, { audience, report: () => { throw Error('Catalogue must not generate data') } }))
    for (const d of reportCatalogue.filter(d => d.audience === audience)) assert.ok(html.includes(d.name.replaceAll('&', '&amp;')))
    assert.ok(!html.includes('Internal audit')); count++
  }
  for (const status of ['completed', 'cancelled', 'force-closed']) {
    const group = paymentDemo(org, 'historical-report-' + status, 'Exact contribution / settlement pending')
    group.cycles[0].status = status
    const report = id => generateReport({ organizations: directory, worlds: [{ groups: [group] }] }, { kind: 'organization', memberId: org.ownerMemberId, organizationId: org.id }, id)
    const html = renderToStaticMarkup(h(ReportBody, { audience: 'organization', report, initialReport: 'organization-cycles' }))
    assert.ok(html.includes(status)); assert.ok(html.includes('Source record &amp; details'))
    assert.equal(report('organization-cycles').rows.length, 1); count++
  }
  const empty = renderToStaticMarkup(h(ReportBody, { audience: 'member', initialReport: 'member-contributions', report: id => generateReport({ organizations: [], worlds: [] }, { kind: 'member', memberId: 'empty' }, id) }))
  assert.ok(empty.includes('No source records match')); count++
  const denied = renderToStaticMarkup(h(ReportBody, { audience: 'organization', initialReport: 'organization-cycles', report: () => { throw Error('Report access denied.') } }))
  assert.ok(denied.includes('Report access denied.')); count++
  const { AccessProvider } = await load('access/AccessContext.tsx'), { ClientProvider, useClient } = await load('clients/ClientContext.tsx')
  const { OrganizationProvider } = await load('organizations/OrganizationContext.tsx'), { GroupProvider, useGroups } = await load('groups/GroupContext.tsx')
  const { OperationsProvider } = await load('operations/OperationsContext.tsx'), { default: App } = await load('App.tsx')
  const wrap = child => [AccessProvider, ClientProvider, OrganizationProvider, GroupProvider, OperationsProvider].reduceRight((child, P) => h(P, null, child), child)
  const previous = globalThis.window
  try {
    for (const path of ['/reports/member', '/reports/organization']) {
      globalThis.window = { location: { pathname: path } }
      const html = renderToStaticMarkup(wrap(h(App)))
      assert.ok(!html.includes('Source reference dates:') && !html.includes('All reports'))
      assert.ok(html.includes('Sign in') || html.includes('Welcome')); count++
    }
    for (const owner of [false, true]) {
      assert.ok(renderToStaticMarkup(wrap(h(ReportsWorkspace, { owner, navigate: () => {} }))).includes('Report access denied.')); count++
    }
    function Probe() {
      const { report } = useGroups()
      const client = useClient()
      for (const id of ['member-contributions', 'organization-cycles']) assert.throws(() => report(id), /denied/)
      // The retained callable must read live identity, including an immediate logout.
      client.openPersona('verified')
      assert.equal(report('member-contributions').rows.length, 0)
      assert.throws(() => report('member-contributions', { memberId: 'foreign-member' }), /denied/)
      client.logout()
      assert.throws(() => report('member-contributions'), /denied/)
      return h('div', null, 'Bound service denial verified')
    }
    assert.ok(renderToStaticMarkup(wrap(h(Probe))).includes('Bound service denial verified')); count++
  } finally { if (previous === undefined) delete globalThis.window; else globalThis.window = previous }
  console.log(`${count} report catalogue, detail, empty/error, source scenario and route/service authorization render checks passed.`)
} finally { await server.close() }
