import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { test } from 'node:test'

test('activation corpus covers positive, negative, and unsupported boundaries', async () => {
  const cases = JSON.parse(await readFile('evals/activation-cases.json', 'utf8'))
  assert.ok(cases.filter((entry) => entry.expect === 'activate').length >= 10)
  assert.ok(cases.filter((entry) => entry.expect === 'skip').length >= 7)
  assert.ok(cases.some((entry) => entry.kind === 'unsupported-action'))
  assert.deepEqual(
    new Set(cases.map((entry) => entry.kind)),
    new Set(['direct', 'indirect', 'negative', 'unsupported-action']),
  )
  assert.equal(new Set(cases.map((entry) => entry.id)).size, cases.length)
})

test('task corpus covers all three receipt statuses', async () => {
  const cases = JSON.parse(await readFile('evals/task-cases.json', 'utf8'))
  assert.deepEqual(new Set(cases.map((entry) => entry.expectedStatus)), new Set(['verified', 'partial', 'blocked']))
  assert.deepEqual(
    new Set(cases.map((entry) => entry.surface)),
    new Set(['logic', 'ui', 'api', 'persistence', 'concurrency', 'environment', 'security', 'recovery']),
  )
  assert.ok(cases.filter((entry) => entry.expectedStatus === 'verified').every((entry) => entry.gaps === 0))
  assert.ok(cases.filter((entry) => entry.expectedStatus !== 'verified').every((entry) => entry.gaps > 0))
  assert.ok(cases.filter((entry) => entry.redactionRequired).every((entry) => entry.evidenceSource === 'mixed'))
  assert.ok(cases.filter((entry) => entry.evidenceSource).every((entry) => ['executed-now', 'supplied', 'mixed'].includes(entry.evidenceSource)))
})
