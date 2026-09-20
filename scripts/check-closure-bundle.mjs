import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { gzipSync } from 'node:zlib'
const manifest=JSON.parse(readFileSync('dist/.vite/manifest.json','utf8')),entry=Object.entries(manifest).find(([,v])=>v.isEntry)
assert.ok(entry,'Built entry is recorded')
const initial=new Set();function visit(key){if(initial.has(key))return;initial.add(key);for(const dependency of manifest[key].imports||[])visit(dependency)}visit(entry[0])
for(const route of ['operations/OperationsWorkspace','access/AccessWorkspace','reports/ReportsWorkspace','reports/InternalReportsWorkspace','settings/SettingsWorkspace','processes/ScheduledProcessesWorkspace','processes/DiagnosticsWorkspace','payments/PaymentWorkspace','payouts/PayoutWorkspace','components/org/GroupSetupWizard']){
 const key=Object.keys(manifest).find(k=>k==='src/'+route+'.tsx');assert.ok(key,'Deferred workspace '+route);assert.ok(!initial.has(key),route+' must not be eagerly imported by the public entry')
}
const size=keys=>[...keys].reduce((n,key)=>{const data=readFileSync('dist/'+manifest[key].file);return {raw:n.raw+data.length,gzip:n.gzip+gzipSync(data).length}},{raw:0,gzip:0})
const root=size([entry[0]]),startup=size(initial)
console.log('Bundle dependency check passed. Entry '+(root.raw/1000).toFixed(2)+' KB / '+(root.gzip/1000).toFixed(2)+' KB gzip. Initial JS including shared imports '+(startup.raw/1000).toFixed(2)+' KB / '+(startup.gzip/1000).toFixed(2)+' KB gzip. '+Object.keys(manifest).filter(k=>manifest[k].isDynamicEntry).length+' dynamic entry chunks.')
