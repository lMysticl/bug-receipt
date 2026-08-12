import assert from 'node:assert/strict'
import { test } from 'node:test'
import { readFile } from 'node:fs/promises'
import { canonicalReportSha256, evaluateAuditGate, runAuditGate } from '../benchmarks/audit-gate.mjs'
import { evaluateRobustnessGate, runRobustnessGate } from '../benchmarks/robustness-gate.mjs'
import { runValidatorBenchmark } from '../benchmarks/validator-benchmark.mjs'

test('validator benchmark passes every declared invariant case', async () => {
  const report = await runValidatorBenchmark()
  assert.deepEqual(report.summary, { total: 22, passed: 22, failed: 0 })
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

test('robustness cohort is bounded, budgeted, and non-leaking', async () => {
  const raw = await readFile(new URL('../benchmarks/robustness-cases.json', import.meta.url), 'utf8')
  const benchmark = JSON.parse(raw)

  assert.equal(benchmark.schema_version, 1)
  assert.equal(benchmark.cases.length, 4)
  for (const entry of benchmark.cases) {
    assert.equal(entry.skill, 'bug-receipt')
    assert.equal(entry.ab_prompt_mode, 'natural')
    assert.equal(entry.ab_treatment_mode, 'loaded-skill')
    assert.equal(entry.assertions.length, 5)
    assert.equal(entry.efficiency.max_actions, 0)
    assert.ok(!entry.prompt.toLowerCase().includes('bug-receipt'))
    assert.ok(!entry.prompt.includes('BUG RECEIPT'))
    assert.deepEqual(entry.efficiency.forbidden_action_types, [
      'command_execution',
      'file_change',
      'mcp_tool_call',
      'web_search',
    ])
  }
})

test('published audit-gate summary passes every pre-registered decision gate', async () => {
  const result = await runAuditGate()
  assert.equal(result.passed, true)
  assert.deepEqual(result.provenance, {
    source_sha256_verified: true,
    summary_matches_raw: true
  })
  assert.deepEqual(result.metrics, {
    on_passed: 18,
    off_passed: 7,
    assertions: 20,
    on_accuracy_percent: 90,
    off_accuracy_percent: 35,
    quality_delta_percentage_points: 55,
    on_receipt: 4,
    off_receipt: 0,
    receipt_delta_percentage_points: 100,
    safety_regressions: 0
  })
})

test('audit-gate provenance hash is stable across line endings', () => {
  assert.equal(
    canonicalReportSha256(Buffer.from('first\r\nsecond\r\n')),
    canonicalReportSha256(Buffer.from('first\nsecond\n'))
  )
})

test('audit gate rejects a missing ON receipt', async () => {
  const raw = await readFile(new URL('../benchmarks/results/audit-gate-summary.json', import.meta.url), 'utf8')
  const report = JSON.parse(raw)
  report.cases[0].on_receipt = false
  const result = evaluateAuditGate(report)
  assert.equal(result.passed, false)
  assert.equal(result.checks.receipt_contract, false)
})

test('published robustness cohort passes every pre-registered decision gate', async () => {
  const result = await runRobustnessGate()
  assert.equal(result.passed, true)
  assert.deepEqual(result.provenance, {
    source_sha256_verified: true,
    benchmark_fingerprint_verified: true,
  })
  assert.deepEqual(result.metrics, {
    on_passed: 18,
    off_passed: 5,
    assertions: 20,
    on_accuracy_percent: 90,
    off_accuracy_percent: 25,
    quality_delta_percentage_points: 65,
    receipt_and_status_cases: 4,
    source_attribution_cases: 4,
    secret_leaks: 0,
    safety_regressions: 0,
    exact_mcnemar_two_sided_p: 0.000244,
  })
})

test('robustness gate rejects a secret echoed by the ON arm', async () => {
  const raw = await readFile(
    new URL('../benchmarks/results/robustness/model-ab-robustness-gpt-5.6-sol-xhigh.json', import.meta.url),
    'utf8',
  )
  const report = JSON.parse(raw)
  report.results[0].arms.skills_on.candidate_response += ' secret_should_not_be_echoed'
  const result = evaluateRobustnessGate(report)
  assert.equal(result.passed, false)
  assert.equal(result.checks.secret_redaction, false)
})

test('robustness gate rejects a missing supplied-evidence source', async () => {
  const raw = await readFile(
    new URL('../benchmarks/results/robustness/model-ab-robustness-gpt-5.6-sol-xhigh.json', import.meta.url),
    'utf8',
  )
  const report = JSON.parse(raw)
  report.results[2].arms.skills_on.candidate_response = report.results[2].arms.skills_on.candidate_response
    .replace('Source     supplied', 'Source     unknown')
  const result = evaluateRobustnessGate(report)
  assert.equal(result.passed, false)
  assert.equal(result.checks.source_attribution, false)
})
