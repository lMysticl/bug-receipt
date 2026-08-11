#!/usr/bin/env node
import { access, cp, mkdir, readFile, rename } from 'node:fs/promises'
import { constants } from 'node:fs'
import { homedir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
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

function option(args, name) {
  const index = args.indexOf(name)
  return index >= 0 ? args[index + 1] : undefined
}

async function exists(path) {
  try {
    await access(path, constants.F_OK)
    return true
  } catch {
    return false
  }
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
  const path = args.find((arg) => !arg.startsWith('--'))
  if (!path) throw new Error('check requires a JSON file path.')

  let receipt
  try {
    receipt = JSON.parse(await readFile(resolve(path), 'utf8'))
  } catch (error) {
    throw new Error(`Cannot read valid JSON from ${path}: ${error.message}`)
  }

  const result = validateReceipt(receipt)
  if (args.includes('--json')) {
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
  const target = option(args, '--target') ?? 'agents'
  const customDestination = option(args, '--destination')
  const root = targetRoot(target)
  if (!customDestination && !root) throw new Error(`Unknown target: ${target}`)
  if (!(await exists(bundledSkill))) throw new Error(`Bundled skill not found at ${bundledSkill}`)

  const destination = resolve(customDestination ?? join(root, 'bug-receipt'))
  await mkdir(dirname(destination), { recursive: true })

  let backup
  if (await exists(destination)) {
    if (!args.includes('--force')) throw new Error(`${destination} already exists. Re-run with --force to preserve it as a backup and install.`)
    backup = `${destination}.backup-${new Date().toISOString().replace(/[:.]/g, '-')}`
    await rename(destination, backup)
  }

  const staging = `${destination}.installing-${process.pid}`
  await cp(bundledSkill, staging, { recursive: true, errorOnExist: true })
  await rename(staging, destination)

  process.stdout.write('✓ Validated bundled SKILL.md\n')
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
