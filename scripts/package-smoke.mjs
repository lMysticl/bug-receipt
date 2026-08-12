import assert from 'node:assert/strict'
import { execFile } from 'node:child_process'
import { mkdtemp, readFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { promisify } from 'node:util'

const execFileAsync = promisify(execFile)
const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm'
const npmOptions = process.platform === 'win32' ? { shell: true } : {}
const root = await mkdtemp(join(tmpdir(), 'bug-receipt-package-'))

try {
  const { stdout: packOutput } = await execFileAsync(npm, [
    'pack',
    '--ignore-scripts',
    '--json',
    '--pack-destination',
    root,
  ], { ...npmOptions, maxBuffer: 4 * 1024 * 1024 })
  const [{ filename }] = JSON.parse(packOutput)
  const archive = join(root, filename)
  const consumer = join(root, 'consumer')

  await execFileAsync(npm, [
    'install',
    '--ignore-scripts',
    '--no-audit',
    '--no-fund',
    '--prefix',
    consumer,
    archive,
  ], { ...npmOptions, maxBuffer: 4 * 1024 * 1024 })

  const packageRoot = join(consumer, 'node_modules', 'bug-receipt')
  const cli = join(packageRoot, 'cli', 'bug-receipt.mjs')
  const { stdout: sampleOutput } = await execFileAsync(process.execPath, [cli, 'sample'])
  const sample = JSON.parse(sampleOutput)
  assert.equal(sample.version, 2)
  assert.equal(sample.evidenceSource, 'executed-now')

  const destination = join(root, 'installed', 'bug-receipt')
  await execFileAsync(process.execPath, [cli, 'install', '--destination', destination])
  assert.match(await readFile(join(destination, 'SKILL.md'), 'utf8'), /name: bug-receipt/)
  assert.match(await readFile(join(destination, 'agents', 'openai.yaml'), 'utf8'), /allow_implicit_invocation: true/)

  process.stdout.write('OK: packed artifact installs and runs as a self-contained skill.\n')
} finally {
  await rm(root, { recursive: true, force: true })
}
