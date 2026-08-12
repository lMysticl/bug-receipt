import assert from 'node:assert/strict'
import { test } from 'node:test'
import { runValidatorBenchmark } from '../benchmarks/validator-benchmark.mjs'

test('validator benchmark passes every declared invariant case', async () => {
  const report = await runValidatorBenchmark()
  assert.deepEqual(report.summary, { total: 20, passed: 20, failed: 0 })
  assert.ok(report.results.every((entry) => entry.passed))
})
