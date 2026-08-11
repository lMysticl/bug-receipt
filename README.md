<p align="center">
  <img src="./public/og-cover.png" alt="Bug Receipt — no fixed without receipts" width="100%" />
</p>

<p align="center">
  <strong>A portable agent skill that requires evidence before a bug can be called fixed.</strong>
</p>

<p align="center">
  <a href="https://lmysticl.github.io/bug-receipt/">Live demo</a>
  ·
  <a href="#install">Install</a>
  ·
  <a href="./skill/bug-receipt/SKILL.md">Read the skill</a>
  ·
  <a href="./docs/receipt.schema.json">JSON Schema</a>
</p>

<p align="center">
  <a href="https://github.com/lMysticl/bug-receipt/actions/workflows/ci.yml"><img alt="CI" src="https://github.com/lMysticl/bug-receipt/actions/workflows/ci.yml/badge.svg" /></a>
  <a href="./LICENSE"><img alt="MIT license" src="https://img.shields.io/badge/license-MIT-e8ff65.svg" /></a>
  <img alt="No API required" src="https://img.shields.io/badge/API-none-161817.svg" />
  <img alt="Local first" src="https://img.shields.io/badge/data-local--only-161817.svg" />
</p>

## Why

Coding agents are very good at producing plausible fixes. Plausible is not the same as proven.

Bug Receipt gives an agent one strict completion contract:

1. Observe the failure before editing whenever possible.
2. Trace the responsible root cause, not just the nearest symptom.
3. Make the smallest responsible change.
4. Run direct and adjacent verification.
5. Return `VERIFIED`, `PARTIAL`, or `BLOCKED` with an evidence receipt.

No test result, command, file location, or observation may be invented. A missing proof layer automatically prevents `VERIFIED`.

## Install

Install from GitHub into the portable global Agent Skills directory:

```bash
npx --yes github:lMysticl/bug-receipt install
```

Choose a specific agent or a project-local destination:

```bash
npx --yes github:lMysticl/bug-receipt install --target codex
npx --yes github:lMysticl/bug-receipt install --target claude
npx --yes github:lMysticl/bug-receipt install --target project
npx --yes github:lMysticl/bug-receipt install --target copilot
```

The installer never silently overwrites an existing skill. `--force` keeps the old installation as a timestamped backup.

## Use

Invoke it explicitly:

```text
Use $bug-receipt to fix the checkout regression and prove the result.
```

Or ask naturally:

```text
Debug this flaky failure. Do not call it fixed unless you can reproduce it,
trace the root cause, and show the exact verification evidence.
```

The final answer ends with a compact receipt:

```text
BUG RECEIPT · VERIFIED

Baseline   npm test -- discount.test.ts
           FAIL — expected 90, received 100
Root cause src/pricing.ts:42 applied the discount after rounding
Change     src/pricing.ts — calculate the discounted subtotal first
Proof      focused test: PASS · full suite: PASS · build: PASS
Gaps       none
```

For automation, agents can emit a JSON receipt conforming to [`docs/receipt.schema.json`](./docs/receipt.schema.json):

```bash
bug-receipt check examples/verified-receipt.json
bug-receipt check examples/verified-receipt.json --json
bug-receipt sample
```

## What `VERIFIED` means

`VERIFIED` is accepted only when all of these are true:

- the baseline failure was observed;
- root-cause evidence includes a concrete source or runtime location;
- at least one file or artifact changed;
- every declared verification check passed;
- no material gap remains.

Anything weaker must be reported as `PARTIAL` or `BLOCKED`. The receipt proves what was observed; it does not guarantee that every possible defect is absent.

## Compatibility

The skill uses the portable `SKILL.md` format. The installer supports:

| Target | Destination |
| --- | --- |
| Portable default | `~/.agents/skills/bug-receipt` |
| OpenAI Codex | `~/.codex/skills/bug-receipt` |
| Claude Code | `~/.claude/skills/bug-receipt` |
| Project-local | `./.agents/skills/bug-receipt` |
| GitHub Copilot | `./.github/skills/bug-receipt` |

## Validation

The repository includes:

- structural skill validation with the system `quick_validate.py`;
- deterministic validator and installer tests;
- positive, indirect, negative, and unsupported activation cases;
- verified, partial, and blocked task-contract fixtures;
- TypeScript, lint, production-build, and live-browser checks.

Run everything locally:

```bash
npm install
npm run check
```

The activation corpus is a maintained test surface, not a claim that every model or harness was behaviorally exercised in CI.

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md). Security-sensitive reports belong in [SECURITY.md](./SECURITY.md).

## License

[MIT](./LICENSE)
