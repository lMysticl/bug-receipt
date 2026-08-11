import assert from 'node:assert/strict'
import { execFile } from 'node:child_process'
import { mkdtemp, readFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { promisify } from 'node:util'
import { test } from 'node:test'

const execFileAsync = promisify(execFile)

test('installs a complete skill into an explicit destination', async () => {
  const root = await mkdtemp(join(tmpdir(), 'bug-receipt-install-'))
  const destination = join(root, 'bug-receipt')
  const { stdout } = await execFileAsync(process.execPath, ['cli/bug-receipt.mjs', 'install', '--destination', destination])
  assert.match(stdout, /Installed Bug Receipt/)
  assert.match(await readFile(join(destination, 'SKILL.md'), 'utf8'), /name: bug-receipt/)
  assert.match(await readFile(join(destination, 'references', 'receipt-contract.md'), 'utf8'), /Status invariants/)
  const { stdout: validation } = await execFileAsync(process.execPath, [
    join(destination, 'scripts', 'validate-receipt.mjs'),
    join(destination, 'assets', 'receipt.template.json'),
  ])
  assert.match(validation, /valid PARTIAL bug receipt/)
})

test('refuses to overwrite an existing installation by default', async () => {
  const root = await mkdtemp(join(tmpdir(), 'bug-receipt-install-'))
  const destination = join(root, 'bug-receipt')
  await execFileAsync(process.execPath, ['cli/bug-receipt.mjs', 'install', '--destination', destination])
  await assert.rejects(
    execFileAsync(process.execPath, ['cli/bug-receipt.mjs', 'install', '--destination', destination]),
    (error) => error.code === 2 && error.stderr.includes('already exists'),
  )
})
