import { createHash } from 'node:crypto'
import { readFile, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
import { sampleReceipt, validateReceipt } from '../skills/bug-receipt/scripts/validate-receipt.mjs'

const clone = () => structuredClone(sampleReceipt)

const invalid = (id, expectedIssuePath, mutate) => ({ id, expectedValid: false, expectedIssuePath, mutate })
const valid = (id, mutate = () => {}) => ({ id, expectedValid: true, expectedIssuePath: null, mutate })

export const invariantCases = [
  valid('complete-verified'),
  valid('partial-with-explicit-gap', (receipt) => {
    receipt.status = 'partial'
    receipt.baseline.result = 'not-run'
    receipt.verification = []
    receipt.gaps = ['Production fixture unavailable.']
  }),
  valid('blocked-with-external-condition', (receipt) => {
    receipt.status = 'blocked'
    receipt.baseline.result = 'not-run'
    receipt.rootCause = { summary: 'Unknown.', evidence: [] }
    receipt.changes = []
    receipt.verification = []
    receipt.gaps = ['Identity-provider credentials unavailable.']
  }),
  invalid('verified-without-baseline', 'baseline.result', (receipt) => { receipt.baseline.result = 'not-run' }),
  invalid('verified-without-root-evidence', 'rootCause.evidence', (receipt) => { receipt.rootCause.evidence = [] }),
  invalid('verified-without-change', 'changes', (receipt) => { receipt.changes = [] }),
  invalid('verified-without-verification', 'verification', (receipt) => { receipt.verification = [] }),
  invalid('verified-with-failed-check', 'verification', (receipt) => { receipt.verification[0].result = 'failed' }),
  invalid('verified-with-gap', 'gaps', (receipt) => { receipt.gaps = ['Browser path not exercised.'] }),
  invalid('partial-without-gap', 'gaps', (receipt) => { receipt.status = 'partial' }),
  invalid('blocked-without-condition', 'gaps', (receipt) => { receipt.status = 'blocked' }),
  invalid('unknown-top-level-field', 'confidence', (receipt) => { receipt.confidence = 1 }),
  invalid('unknown-nested-field', 'baseline.duration', (receipt) => { receipt.baseline.duration = '12ms' }),
  invalid('unsupported-version', 'version', (receipt) => { receipt.version = 2 }),
  invalid('unsupported-status', 'status', (receipt) => { receipt.status = 'done' }),
  invalid('baseline-wrong-type', 'baseline', (receipt) => { receipt.baseline = [] }),
  invalid('change-without-file', 'changes[0].file', (receipt) => { receipt.changes[0].file = '' }),
  invalid('unknown-verification-result', 'verification[0].result', (receipt) => { receipt.verification[0].result = 'skipped' }),
  invalid('blank-gap', 'gaps', (receipt) => {
    receipt.status = 'partial'
    receipt.gaps = ['   ']
  }),
  invalid('root-evidence-without-observation', 'rootCause.evidence[0].observation', (receipt) => {
    receipt.rootCause.evidence[0].observation = ''
  }),
]

export async function runValidatorBenchmark() {
  const results = invariantCases.map((entry) => {
    const receipt = clone()
    entry.mutate(receipt)
    const validation = validateReceipt(receipt)
    const issuePaths = validation.issues.map((issue) => issue.path)
    const passed = validation.valid === entry.expectedValid
      && (entry.expectedIssuePath === null || issuePaths.includes(entry.expectedIssuePath))

    return {
      id: entry.id,
      expectedValid: entry.expectedValid,
      actualValid: validation.valid,
      expectedIssuePath: entry.expectedIssuePath,
      issuePaths,
      passed,
    }
  })

  const validatorPath = resolve('skills/bug-receipt/scripts/validate-receipt.mjs')
  const validatorSha256 = createHash('sha256').update(await readFile(validatorPath)).digest('hex')
  const passed = results.filter((entry) => entry.passed).length

  return {
    schemaVersion: 1,
    runtime: { node: process.version },
    validatorSha256,
    summary: { total: results.length, passed, failed: results.length - passed },
    results,
  }
}

const invokedUrl = process.argv[1] ? pathToFileURL(resolve(process.argv[1])).href : ''
if (import.meta.url === invokedUrl) {
  const report = await runValidatorBenchmark()
  const serialized = `${JSON.stringify(report, null, 2)}\n`
  const outputIndex = process.argv.indexOf('--output')
  if (outputIndex >= 0) {
    const outputPath = process.argv[outputIndex + 1]
    if (!outputPath) throw new Error('--output requires a path')
    await writeFile(resolve(outputPath), serialized, 'utf8')
  } else {
    process.stdout.write(serialized)
  }
  if (report.summary.failed > 0) process.exitCode = 1
}
