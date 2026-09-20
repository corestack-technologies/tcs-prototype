import test from 'node:test'
import assert from 'node:assert/strict'
import { formatDate, formatMoneyMinor } from '../src/design/format.ts'
test('date-only business dates remain the same calendar day in every display zone',()=>{for(const zone of ['Africa/Lagos','Africa/Accra','Africa/Nairobi','America/Los_Angeles'])assert.equal(formatDate('2026-09-17',zone),'17 Sept 2026')})
test('actual timestamps display the requested timezone and do not alter the source',()=>{const at='2026-09-17T10:38:37.733Z';assert.match(formatDate(at),/11:38/);assert.match(formatDate(at,'Africa/Accra'),/10:38/);assert.equal(at,'2026-09-17T10:38:37.733Z')})
test('empty or unavailable display values are explicit',()=>{assert.equal(formatDate(''),'Not recorded');assert.equal(formatDate('Not applicable'),'Not applicable');assert.equal(formatMoneyMinor(NaN),'Not available')})
test('money formatting retains kobo precision, grouping, negative and zero presentation',()=>{assert.equal(formatMoneyMinor(123456789),'₦1,234,567.89');assert.equal(formatMoneyMinor(100),'₦1');assert.equal(formatMoneyMinor(1),'₦0.01');assert.equal(formatMoneyMinor(-150),'−₦1.5'.replace('−','-'));assert.equal(formatMoneyMinor(-0),'₦0');assert.equal(formatMoneyMinor(0),'₦0')})
