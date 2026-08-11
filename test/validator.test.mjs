import assert from 'node:assert/strict'
import { test } from 'node:test'
import { sampleReceipt, validateReceipt } from '../cli/lib/validate.mjs'

const clone = (value) => structuredClone(value)

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
