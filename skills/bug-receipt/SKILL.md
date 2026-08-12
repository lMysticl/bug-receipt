---
name: bug-receipt
description: 'Close defects with an auditable BUG RECEIPT: classify evidence, trace cause, verify repair, and report VERIFIED, PARTIAL, or BLOCKED. Use for bugs, incidents, and issue closeout.'
---

# Bug Receipt

Use the receipt as the completion gate. For a closeout decision, return it automatically even when the user did not request a special format.

## Establish the evidence boundary

Before editing, record the observed problem, intended behavior, strongest direct check, and evidence source: `executed now`, `supplied`, or `mixed`. Never imply that supplied evidence was executed in the current run.

Reproduce the failure with the narrowest safe check when possible. If reproduction is unavailable, preserve the evidence obtained and cap the result at `PARTIAL` or `BLOCKED`.

## Trace and repair

1. Follow the live owner path from input to symptom.
2. Separate observed facts, bounded inferences, and gaps.
3. Require a concrete location or runtime transition before naming root cause.
4. Make the smallest responsible change; avoid unrelated cleanup, retries, silent fallbacks, and fixture-specific exceptions.

Do not convert a plausible patch, stale log, source read, or passing build into proof of the user-visible behavior.

## Close the proof loop

Run only checks required by the affected contract:

- original reproduction or direct acceptance check;
- nearest negative or regression check;
- affected build or integration gate;
- real UI, API, persistence, concurrency, or runtime path when the claim crosses that boundary.

Use these decisive boundaries:

| Surface | Required direct proof |
| --- | --- |
| Logic or failing test | Original failing input or focused test now passes |
| UI behavior | Real interaction plus relevant console and network observation |
| API or integration | Request, response, and responsible service behavior |
| Persistence | Write/read or reload round trip through the real owner path |
| Race or lifecycle | Repeated concurrent trigger; zero-or-one success; affected-row and transaction evidence; final invariant |
| Cross-system blocker | One sanitized failing request/response with timestamp or request ID, edge and application logs, and identity-provider logs when the trace reaches that owner |

## Assign status

- `VERIFIED`: observed baseline, concrete cause, responsible change, all declared checks passed, no material gap.
- `PARTIAL`: useful evidence exists, but a required proof layer is missing or inconclusive.
- `BLOCKED`: a specific external condition prevents reproduction, repair, or proof.

For `PARTIAL` or `BLOCKED`, name the single minimal experiment or correlated evidence package that closes the decisive gap. Never invent a command, observation, count, location, or result.

## Return the receipt

Finish with this compact structure:

```text
BUG RECEIPT · VERIFIED | PARTIAL | BLOCKED

Problem    <observed defect and intended behavior>
Baseline   <exact command or interaction>
           <decisive observed result>
Root cause <location and evidence-backed mechanism>
Change     <file or artifact — responsible repair>
Proof      <check: result · check: result; label supplied evidence>
Gaps       <none, or the exact missing proof>
Source     executed now | supplied | mixed
```

Use `not run` explicitly where applicable. Do not omit a row to make the receipt look complete.

For a machine-readable receipt or CI integration, read [references/receipt-contract.md](references/receipt-contract.md) and conform to its JSON fields and status invariants.

When a JSON artifact is requested, start from [assets/receipt.template.json](assets/receipt.template.json), write it to a task-owned path, and validate it with `node scripts/validate-receipt.mjs <receipt.json>` from this skill directory. Do not commit the generated receipt unless the user requests it.
