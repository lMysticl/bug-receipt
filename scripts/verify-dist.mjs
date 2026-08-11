import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

const [sourceSchema, publishedSchema, llms, robots, sitemap] = await Promise.all([
  readFile('skills/bug-receipt/references/receipt.schema.json', 'utf8'),
  readFile('dist/receipt.schema.json', 'utf8'),
  readFile('dist/llms.txt', 'utf8'),
  readFile('dist/robots.txt', 'utf8'),
  readFile('dist/sitemap.xml', 'utf8'),
])

assert.deepEqual(JSON.parse(publishedSchema), JSON.parse(sourceSchema))
assert.match(llms, /skills\/bug-receipt\/SKILL\.md/)
assert.match(llms, /VERIFIED, PARTIAL, or BLOCKED/)
assert.match(robots, /Sitemap: https:\/\/lmysticl\.github\.io\/bug-receipt\/sitemap\.xml/)
assert.match(sitemap, /receipt\.schema\.json/)

process.stdout.write('OK: dist contains the canonical schema and AI discovery artifacts.\n')
