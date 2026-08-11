import assert from 'node:assert/strict'
import { spawn } from 'node:child_process'
import { test } from 'node:test'
import { sampleReceipt, validateReceipt } from '../skills/bug-receipt/scripts/validate-receipt.mjs'

const clone = (value) => structuredClone(value)

const validateFromStdin = (receipt) => new Promise((resolve, reject) => {
  const child = spawn(process.execPath, ['skills/bug-receipt/scripts/validate-receipt.mjs', '-', '--json'])
  let stdout = ''
  let stderr = ''
  child.stdout.setEncoding('utf8').on('data', (chunk) => { stdout += chunk })
  child.stderr.setEncoding('utf8').on('data', (chunk) => { stderr += chunk })
  child.on('error', reject)
  child.on('close', (code) => code === 0 ? resolve(stdout) : reject(new Error(stderr)))
  child.stdin.end(JSON.stringify(receipt))
})

test('accepts a complete verified receipt', () => {
  assert.deepEqual(validateReceipt(sampleReceipt), { valid: true, issues: [] })
})

test('rejects verified status without an observed baseline', () => {
  const receipt = clone(sampleReceipt)
  receipt.baseline.result = 'not-run'
  const result = validateReceipt(receipt)
  assert.equal(result.valid, false)
  assert.ok(result.issues.some((issue) => issue.path === 'baseline.result' && issue.message.includes('observed baseline')))
})

test('rejects verified status when a declared check failed', () => {
  const receipt = clone(sampleReceipt)
  receipt.verification[0].result = 'failed'
  const result = validateReceipt(receipt)
  assert.equal(result.valid, false)
  assert.ok(result.issues.some((issue) => issue.path === 'verification' && issue.message.includes('must pass')))
})

test('rejects verified status with a proof gap', () => {
  const receipt = clone(sampleReceipt)
  receipt.gaps.push('Production browser path was not exercised.')
  const result = validateReceipt(receipt)
  assert.equal(result.valid, false)
  assert.ok(result.issues.some((issue) => issue.path === 'gaps'))
})

test('accepts partial status when the exact gap is named', () => {
  const receipt = clone(sampleReceipt)
  receipt.status = 'partial'
  receipt.baseline.result = 'not-run'
  receipt.verification = []
  receipt.gaps = ['The production-only fixture is unavailable.']
  assert.deepEqual(validateReceipt(receipt), { valid: true, issues: [] })
})

test('requires blocked status to name its external condition', () => {
  const receipt = clone(sampleReceipt)
  receipt.status = 'blocked'
  receipt.gaps = []
  const result = validateReceipt(receipt)
  assert.equal(result.valid, false)
  assert.ok(result.issues.some((issue) => issue.message.includes('blocking condition')))
})

test('rejects unknown fields exactly like the JSON Schema', () => {
  const receipt = clone(sampleReceipt)
  receipt.confidence = 1
  receipt.baseline.duration = '12ms'
  const result = validateReceipt(receipt)
  assert.equal(result.valid, false)
  assert.ok(result.issues.some((issue) => issue.path === 'confidence' && issue.message === 'Unknown field.'))
  assert.ok(result.issues.some((issue) => issue.path === 'baseline.duration' && issue.message === 'Unknown field.'))
})

test('bundled validator accepts a receipt on stdin', async () => {
  const stdout = await validateFromStdin(sampleReceipt)
  assert.deepEqual(JSON.parse(stdout), { valid: true, issues: [] })
})
