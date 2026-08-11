import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { test } from 'node:test'
import Ajv2020 from 'ajv/dist/2020.js'

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
