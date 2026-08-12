import assert from 'node:assert/strict'
import { execFile, spawn } from 'node:child_process'
import { mkdtemp, readFile, readdir, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { promisify } from 'node:util'
import { test } from 'node:test'

const execFileAsync = promisify(execFile)

const temporaryRoot = async (t) => {
  const root = await mkdtemp(join(tmpdir(), 'bug-receipt-install-'))
  t.after(() => rm(root, { recursive: true, force: true }))
  return root
}

test('installs a complete skill into an explicit destination', async (t) => {
  const root = await temporaryRoot(t)
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

test('refuses to overwrite an existing installation by default', async (t) => {
  const root = await temporaryRoot(t)
  const destination = join(root, 'bug-receipt')
  await execFileAsync(process.execPath, ['cli/bug-receipt.mjs', 'install', '--destination', destination])
  await assert.rejects(
    execFileAsync(process.execPath, ['cli/bug-receipt.mjs', 'install', '--destination', destination]),
    (error) => error.code === 2 && error.stderr.includes('already exists'),
  )
})

test('force install preserves one discoverable skill and moves the backup below a non-skill container', async (t) => {
  const root = await temporaryRoot(t)
  const skillsRoot = join(root, 'skills')
  const destination = join(skillsRoot, 'bug-receipt')
  await execFileAsync(process.execPath, ['cli/bug-receipt.mjs', 'install', '--destination', destination])
  const { stdout } = await execFileAsync(process.execPath, ['cli/bug-receipt.mjs', 'install', '--destination', destination, '--force'])

  assert.match(stdout, /Preserved previous installation/)
  assert.match(await readFile(join(destination, 'SKILL.md'), 'utf8'), /name: bug-receipt/)
  const backups = await readdir(join(skillsRoot, '.bug-receipt-backups'))
  assert.equal(backups.length, 1)
  assert.match(await readFile(join(skillsRoot, '.bug-receipt-backups', backups[0], 'SKILL.md'), 'utf8'), /name: bug-receipt/)
  assert.deepEqual((await readdir(skillsRoot)).filter((name) => name.startsWith('bug-receipt.backup-')), [])
})

test('rejects an option as the missing destination value without creating it', async (t) => {
  const root = await temporaryRoot(t)
  await assert.rejects(
    execFileAsync(process.execPath, [resolve('cli/bug-receipt.mjs'), 'install', '--destination', '--force'], { cwd: root }),
    (error) => error.code === 2 && error.stderr.includes('--destination requires a value'),
  )
  await assert.rejects(readFile(join(root, '--force', 'SKILL.md'), 'utf8'), (error) => error.code === 'ENOENT')
})

test('leaves the installed skill intact when backup preparation fails', async (t) => {
  const root = await temporaryRoot(t)
  const skillsRoot = join(root, 'skills')
  const destination = join(skillsRoot, 'bug-receipt')
  await execFileAsync(process.execPath, ['cli/bug-receipt.mjs', 'install', '--destination', destination])
  await writeFile(join(skillsRoot, '.bug-receipt-backups'), 'not a directory', 'utf8')

  await assert.rejects(
    execFileAsync(process.execPath, ['cli/bug-receipt.mjs', 'install', '--destination', destination, '--force']),
    (error) => error.code === 2,
  )
  assert.match(await readFile(join(destination, 'SKILL.md'), 'utf8'), /name: bug-receipt/)
  assert.deepEqual((await readdir(skillsRoot)).filter((name) => name.includes('.installing-')), [])
})

test('refuses to replace the current working directory', async (t) => {
  const root = await temporaryRoot(t)
  await assert.rejects(
    execFileAsync(process.execPath, [resolve('cli/bug-receipt.mjs'), 'install', '--destination', root, '--force'], { cwd: root }),
    (error) => error.code === 2 && error.stderr.includes('Refusing unsafe installation destination'),
  )
})

test('checks a receipt from stdin for agent pipelines', async () => {
  const stdout = await new Promise((resolvePromise, reject) => {
    const child = spawn(process.execPath, ['cli/bug-receipt.mjs', 'check', '-', '--json'])
    let stdoutText = ''
    let stderrText = ''
    child.stdout.setEncoding('utf8').on('data', (chunk) => { stdoutText += chunk })
    child.stderr.setEncoding('utf8').on('data', (chunk) => { stderrText += chunk })
    child.on('error', reject)
    child.on('close', (code) => code === 0 ? resolvePromise(stdoutText) : reject(new Error(stderrText)))
    child.stdin.end(JSON.stringify({
      version: 1,
      status: 'blocked',
      problem: 'Production-only failure.',
      baseline: { command: 'not available', result: 'not-run', evidence: 'No production access.' },
      rootCause: { summary: 'Unresolved.', evidence: [] },
      changes: [],
      verification: [],
      gaps: ['Production access is required.'],
    }))
  })
  assert.deepEqual(JSON.parse(stdout), { valid: true, issues: [] })
})
