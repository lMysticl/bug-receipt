import assert from 'node:assert/strict'
import { test } from 'node:test'
import { readFile } from 'node:fs/promises'
import { runValidatorBenchmark } from '../benchmarks/validator-benchmark.mjs'

test('validator benchmark passes every declared invariant case', async () => {
  const report = await runValidatorBenchmark()
  assert.deepEqual(report.summary, { total: 20, passed: 20, failed: 0 })
  assert.ok(report.results.every((entry) => entry.passed))
})

test('audit-gate cases preserve the loaded-skill non-leaking treatment contract', async () => {
  const raw = await readFile(new URL('../benchmarks/audit-gate-cases.json', import.meta.url), 'utf8')
  const benchmark = JSON.parse(raw)

  assert.equal(benchmark.schema_version, 1)
  assert.equal(benchmark.cases.length, 4)
  assert.equal((raw.match(/"ab_treatment_mode"/g) ?? []).length, 4)
  for (const entry of benchmark.cases) {
    assert.equal(entry.skill, 'bug-receipt')
    assert.equal(entry.ab_prompt_mode, 'natural')
    assert.equal(entry.ab_treatment_mode, 'loaded-skill')
    assert.equal(entry.efficiency.max_actions, 0)
    assert.equal(entry.assertions.length, 5)
    assert.ok(!entry.prompt.toLowerCase().includes('bug-receipt'))
    assert.ok(!entry.prompt.includes('BUG RECEIPT'))
    assert.deepEqual(entry.efficiency.forbidden_action_types, [
      'command_execution',
      'file_change',
      'mcp_tool_call',
      'web_search'
    ])
  }
})
