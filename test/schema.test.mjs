import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { test } from 'node:test'
import Ajv2020 from 'ajv/dist/2020.js'
import { sampleReceipt, validateReceipt } from '../skills/bug-receipt/scripts/validate-receipt.mjs'

const load = async (path) => JSON.parse(await readFile(path, 'utf8'))
const canonicalSchema = 'skills/bug-receipt/references/receipt.schema.json'

test('repository schema mirror matches the self-contained skill schema', async () => {
  assert.deepEqual(await load('docs/receipt.schema.json'), await load(canonicalSchema))
})

test('JSON Schema accepts verified and partial examples', async () => {
  const ajv = new Ajv2020({ allErrors: true, strict: true })
  const validate = ajv.compile(await load(canonicalSchema))
  assert.equal(validate(await load('examples/verified-receipt.json')), true, JSON.stringify(validate.errors))
  assert.equal(validate(await load('examples/partial-receipt.json')), true, JSON.stringify(validate.errors))
})

test('JSON Schema rejects verified receipts with gaps', async () => {
  const ajv = new Ajv2020({ allErrors: true, strict: true })
  const validate = ajv.compile(await load(canonicalSchema))
  const receipt = await load('examples/verified-receipt.json')
  receipt.gaps = ['Browser verification was not run.']
  assert.equal(validate(receipt), false)
  assert.ok(validate.errors?.some((error) => error.instancePath === '/gaps'))
})

test('JSON Schema requires provenance for version 2 and accepts legacy version 1', async () => {
  const ajv = new Ajv2020({ allErrors: true, strict: true })
  const validate = ajv.compile(await load(canonicalSchema))
  const receipt = structuredClone(sampleReceipt)
  delete receipt.evidenceSource
  assert.equal(validate(receipt), false)
  assert.ok(validate.errors?.some((error) => error.params?.missingProperty === 'evidenceSource'))

  receipt.version = 1
  assert.equal(validate(receipt), true, JSON.stringify(validate.errors))
})

test('hand validator and JSON Schema reject malformed container shapes consistently', async () => {
  const ajv = new Ajv2020({ allErrors: true, strict: true })
  const validateSchema = ajv.compile(await load(canonicalSchema))
  const mutations = [
    (receipt) => { receipt.baseline = null },
    (receipt) => { receipt.rootCause = [] },
    (receipt) => { receipt.rootCause.evidence = [null] },
    (receipt) => { receipt.changes = {} },
    (receipt) => { receipt.changes = [false] },
    (receipt) => { receipt.verification = {} },
    (receipt) => { receipt.verification = ['passed'] },
    (receipt) => { receipt.gaps = {} },
    (receipt) => { receipt.evidenceSource = 'guessed' },
  ]

  for (const mutate of mutations) {
    const receipt = structuredClone(sampleReceipt)
    mutate(receipt)
    assert.equal(validateReceipt(receipt).valid, false)
    assert.equal(validateSchema(receipt), false)
  }
})
