import { createHash } from 'node:crypto'
import { readFile } from 'node:fs/promises'
import { pathToFileURL } from 'node:url'
import { isDeepStrictEqual } from 'node:util'

export function evaluateAuditGate(report) {
  if (report?.schema_version !== 1 || !Array.isArray(report.cases) || report.cases.length !== 4) {
    throw new Error('audit-gate summary must contain exactly four schema-v1 cases')
  }

  const onPassed = report.cases.reduce((sum, entry) => sum + entry.on_passed, 0)
  const offPassed = report.cases.reduce((sum, entry) => sum + entry.off_passed, 0)
  const assertions = report.cases.reduce((sum, entry) => sum + entry.assertions, 0)
  const onReceipt = report.cases.filter((entry) => entry.on_receipt).length
  const offReceipt = report.cases.filter((entry) => entry.off_receipt).length
  const qualityDeltaPp = ((onPassed - offPassed) * 100) / assertions
  const receiptDeltaPp = ((onReceipt - offReceipt) * 100) / report.cases.length
  const safetyRegressions = report.cases.flatMap((entry) => entry.safety)
    .filter((entry) => entry.off === true && entry.on !== true).length
  const budgetsPassed = report.cases.every((entry) => entry.on_budget && entry.off_budget)
  const zeroActions = report.candidate.skills_on.actions === 0 && report.candidate.skills_off.actions === 0
  const treatmentPassed = report.treatment.mode === 'loaded-skill'
    && report.treatment.candidate_prompt_identical_between_arms === true
    && report.treatment.on_contract_marker === true
    && report.treatment.off_contract_marker === false

  const checks = {
    routing: report.routing.passed === 4 && report.routing.total === 4,
    on_quality: onPassed >= 18,
    receipt_contract: onReceipt === 4,
    evidence_safety: safetyRegressions === 0,
    differentiated_value: qualityDeltaPp >= 15 || receiptDeltaPp >= 50,
    budgets: budgetsPassed,
    zero_actions: zeroActions,
    treatment: treatmentPassed
  }

  return {
    passed: Object.values(checks).every(Boolean),
    checks,
    metrics: {
      on_passed: onPassed,
      off_passed: offPassed,
      assertions,
      on_accuracy_percent: (onPassed * 100) / assertions,
      off_accuracy_percent: (offPassed * 100) / assertions,
      quality_delta_percentage_points: qualityDeltaPp,
      on_receipt: onReceipt,
      off_receipt: offReceipt,
      receipt_delta_percentage_points: receiptDeltaPp,
      safety_regressions: safetyRegressions
    }
  }
}

export function canonicalReportSha256(bytes) {
  const text = bytes.toString('utf8').replace(/\r\n/g, '\n')
  return createHash('sha256').update(text, 'utf8').digest('hex')
}

function deriveCompactSummary(source) {
  if (source?.schema_version !== 'skill-ab-v1' || !Array.isArray(source.results)) {
    throw new Error('source report must be a skill-ab-v1 report')
  }

  const armSummary = (arm) => ({
    total_tokens: source.summary.arms[arm].candidate_usage.total_tokens,
    uncached_input_tokens: source.summary.arms[arm].candidate_usage.uncached_input_tokens,
    response_tokens: source.summary.arms[arm].candidate_usage.response_tokens,
    latency_ms: source.summary.arms[arm].candidate_latency_ms.sum,
    actions: source.summary.arms[arm].candidate_actions
  })
  const cases = source.results.map((entry) => {
    const arm = (name) => entry.arms[name]
    const passed = (name, index) => arm(name).judgement.assertion_results[index]?.passed === true
    return {
      id: entry.id,
      on_passed: arm('skills_on').quality.passed,
      off_passed: arm('skills_off').quality.passed,
      assertions: arm('skills_on').quality.total,
      on_receipt: passed('skills_on', 0),
      off_receipt: passed('skills_off', 0),
      on_budget: arm('skills_on').published_budget_diagnostic.passed === true,
      off_budget: arm('skills_off').published_budget_diagnostic.passed === true,
      safety: [1, 2, 4].map((index) => ({
        on: passed('skills_on', index),
        off: passed('skills_off', index)
      }))
    }
  })

  return {
    runtime: {
      codex_cli: source.codex_cli_version,
      model: source.model,
      reasoning_effort: source.reasoning_effort,
      service_tier: source.service_tier,
      sandbox: source.candidate_sandbox
    },
    treatment: {
      mode: source.treatment_mode,
      candidate_prompt_identical_between_arms: source.results.every(
        (entry) => entry.candidate_prompt_identical_between_arms === true
      ),
      on_contract_marker: source.treatment_surfaces.skills_on.loaded_skill_contract_present === true,
      off_contract_marker: source.treatment_surfaces.skills_off.loaded_skill_contract_present === true
    },
    routing: {
      passed: source.summary.routing.passed,
      total: source.summary.routing.total
    },
    candidate: {
      skills_on: armSummary('skills_on'),
      skills_off: armSummary('skills_off')
    },
    cases
  }
}

function verifySummaryMatchesSource(summary, source) {
  const derived = deriveCompactSummary(source)
  for (const key of ['runtime', 'treatment', 'routing', 'candidate', 'cases']) {
    if (!isDeepStrictEqual(summary[key], derived[key])) {
      throw new Error(`audit-gate summary ${key} does not match the raw report`)
    }
  }
  if (summary.source_report.benchmark_fingerprint !== source.benchmark_fingerprint.sha256) {
    throw new Error('audit-gate summary fingerprint does not match the raw report')
  }
}

export async function runAuditGate(path = new URL('./results/audit-gate-summary.json', import.meta.url)) {
  const summaryUrl = path instanceof URL ? path : pathToFileURL(path)
  const summary = JSON.parse(await readFile(summaryUrl, 'utf8'))
  if (!/^[a-z0-9][a-z0-9._-]*\.json$/i.test(summary?.source_report?.name ?? '')) {
    throw new Error('audit-gate source report name is invalid')
  }
  const sourceUrl = new URL(summary.source_report.name, summaryUrl)
  const sourceBytes = await readFile(sourceUrl)
  const sourceSha256 = canonicalReportSha256(sourceBytes)
  if (sourceSha256 !== summary.source_report.sha256) {
    throw new Error('audit-gate source report SHA-256 mismatch')
  }
  const source = JSON.parse(sourceBytes.toString('utf8'))
  verifySummaryMatchesSource(summary, source)
  return {
    ...evaluateAuditGate(summary),
    provenance: {
      source_sha256_verified: true,
      summary_matches_raw: true
    }
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const result = await runAuditGate(process.argv[2])
  console.log(JSON.stringify(result, null, 2))
  process.exitCode = result.passed ? 0 : 1
}
