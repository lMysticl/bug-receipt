#!/usr/bin/env node
import { access, cp, mkdir, readFile, rename, rm, stat } from 'node:fs/promises'
import { constants } from 'node:fs'
import { homedir } from 'node:os'
import { basename, dirname, join, parse, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { sampleReceipt, validateReceipt } from '../skills/bug-receipt/scripts/validate-receipt.mjs'

const packageRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const bundledSkill = join(packageRoot, 'skills', 'bug-receipt')
const { version } = JSON.parse(await readFile(join(packageRoot, 'package.json'), 'utf8'))

const help = `Bug Receipt ${version}

Usage:
  bug-receipt check <receipt.json> [--json]
  bug-receipt sample
  bug-receipt install [--target agents|codex|claude|cursor|project|copilot]
                      [--destination <path>] [--force]

Exit codes: 0 valid/success, 1 invalid receipt, 2 usage or environment error.`

function parseArguments(args, { flags = [], values = [] }) {
  const allowedFlags = new Set(flags)
  const allowedValues = new Set(values)
  const parsedFlags = new Set()
  const parsedValues = new Map()
  const positionals = []

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index]
    if (allowedFlags.has(arg)) {
      if (parsedFlags.has(arg)) throw new Error(`${arg} may only be provided once.`)
      parsedFlags.add(arg)
      continue
    }
    if (allowedValues.has(arg)) {
      if (parsedValues.has(arg)) throw new Error(`${arg} may only be provided once.`)
      const value = args[index + 1]
      if (!value || value.startsWith('-')) throw new Error(`${arg} requires a value.`)
      parsedValues.set(arg, value)
      index += 1
      continue
    }
    if (arg !== '-' && arg.startsWith('-')) throw new Error(`Unknown option: ${arg}`)
    positionals.push(arg)
  }

  return { flags: parsedFlags, values: parsedValues, positionals }
}

async function exists(path) {
  try {
    await access(path, constants.F_OK)
    return true
  } catch {
    return false
  }
}

async function readStdin() {
  process.stdin.setEncoding('utf8')
  let input = ''
  for await (const chunk of process.stdin) input += chunk
  return input
}

async function validateBundledSkill() {
  const requiredFiles = [
    'SKILL.md',
    join('agents', 'openai.yaml'),
    join('assets', 'receipt.template.json'),
    join('references', 'receipt-contract.md'),
    join('references', 'receipt.schema.json'),
    join('scripts', 'validate-receipt.mjs'),
  ]
  await Promise.all(requiredFiles.map((path) => access(join(bundledSkill, path), constants.R_OK)))

  const skill = await readFile(join(bundledSkill, 'SKILL.md'), 'utf8')
  if (!/^---\r?\nname:\s*bug-receipt\s*$/m.test(skill)) {
    throw new Error('Bundled SKILL.md does not declare name: bug-receipt.')
  }
  const template = JSON.parse(await readFile(join(bundledSkill, 'assets', 'receipt.template.json'), 'utf8'))
  const result = validateReceipt(template)
  if (!result.valid) throw new Error('Bundled receipt template does not satisfy the validator.')
}

function targetRoot(target) {
  const roots = {
    agents: join(homedir(), '.agents', 'skills'),
    codex: join(homedir(), '.codex', 'skills'),
    claude: join(homedir(), '.claude', 'skills'),
    cursor: join(homedir(), '.cursor', 'skills'),
    project: join(process.cwd(), '.agents', 'skills'),
    copilot: join(process.cwd(), '.github', 'skills'),
  }
  return roots[target]
}

async function checkCommand(args) {
  const parsed = parseArguments(args, { flags: ['--json'] })
  if (parsed.positionals.length !== 1) throw new Error('check requires exactly one JSON file path or - for stdin.')
  const path = parsed.positionals[0]

  let receipt
  try {
    receipt = JSON.parse(path === '-' ? await readStdin() : await readFile(resolve(path), 'utf8'))
  } catch (error) {
    throw new Error(`Cannot read valid JSON from ${path}: ${error.message}`)
  }

  const result = validateReceipt(receipt)
  if (parsed.flags.has('--json')) {
    process.stdout.write(`${JSON.stringify(result)}\n`)
  } else if (result.valid) {
    process.stdout.write(`✓ ${path} is a valid ${receipt.status.toUpperCase()} bug receipt.\n`)
  } else {
    process.stderr.write(`✗ ${path} is not a valid bug receipt:\n`)
    for (const issue of result.issues) process.stderr.write(`  ${issue.path}: ${issue.message}\n`)
  }
  process.exitCode = result.valid ? 0 : 1
}

async function installCommand(args) {
  const parsed = parseArguments(args, {
    flags: ['--force'],
    values: ['--target', '--destination'],
  })
  if (parsed.positionals.length > 0) throw new Error(`Unexpected argument: ${parsed.positionals[0]}`)

  const target = parsed.values.get('--target') ?? 'agents'
  const customDestination = parsed.values.get('--destination')
  const root = targetRoot(target)
  if (!customDestination && !root) throw new Error(`Unknown target: ${target}`)
  await validateBundledSkill()

  const destination = resolve(customDestination ?? join(root, 'bug-receipt'))
  const unsafeDestinations = new Set([parse(destination).root, resolve(homedir()), resolve(process.cwd())])
  if (unsafeDestinations.has(destination)) throw new Error(`Refusing unsafe installation destination: ${destination}`)
  await mkdir(dirname(destination), { recursive: true })

  if (await exists(destination)) {
    const destinationStat = await stat(destination)
    if (!destinationStat.isDirectory()) throw new Error(`${destination} exists and is not a directory.`)
  }

  let backup
  if (await exists(destination)) {
    if (!parsed.flags.has('--force')) throw new Error(`${destination} already exists. Re-run with --force to preserve it as a backup and install.`)
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
  const staging = join(dirname(destination), `.${basename(destination)}.installing-${process.pid}-${Date.now()}`)
  await cp(bundledSkill, staging, { recursive: true, errorOnExist: true })

  try {
    if (await exists(destination)) {
      const backupRoot = customDestination
        ? join(dirname(destination), '.bug-receipt-backups')
        : join(dirname(root), 'skill-backups', 'bug-receipt')
      await mkdir(backupRoot, { recursive: true })
      backup = join(backupRoot, `${timestamp}-${process.pid}`)
      await rename(destination, backup)
    }

    try {
      await rename(staging, destination)
    } catch (error) {
      if (backup && !(await exists(destination))) {
        try {
          await rename(backup, destination)
          backup = undefined
        } catch (rollbackError) {
          throw new Error(`Installation failed: ${error.message}. Rollback also failed: ${rollbackError.message}.`)
        }
      }
      throw error
    }
  } finally {
    if (await exists(staging)) await rm(staging, { recursive: true, force: true })
  }

  process.stdout.write('✓ Validated bundled skill package\n')
  process.stdout.write(`✓ Installed Bug Receipt to ${destination}\n`)
  if (backup) process.stdout.write(`✓ Preserved previous installation at ${backup}\n`)
}

async function main() {
  const [command = 'help', ...args] = process.argv.slice(2)
  if (command === 'check') return checkCommand(args)
  if (command === 'sample') return process.stdout.write(`${JSON.stringify(sampleReceipt, null, 2)}\n`)
  if (command === 'install') return installCommand(args)
  if (command === 'help' || command === '--help' || command === '-h') return process.stdout.write(`${help}\n`)
  throw new Error(`Unknown command: ${command}\n\n${help}`)
}

main().catch((error) => {
  process.stderr.write(`bug-receipt: ${error.message}\n`)
  process.exitCode = 2
})
