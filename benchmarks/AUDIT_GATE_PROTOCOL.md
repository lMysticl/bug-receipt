# Audit-gate benchmark protocol

Pre-registered on 2026-08-12 before candidate execution.

## Decision

Test the product's narrow claim: when a user asks whether a bug can be closed, Bug Receipt should automatically return an auditable closeout decision without requiring the user to request a special format.

This benchmark does **not** test whether the model can write generally good debugging advice, and it cannot support a universal "best debugging skill" claim.

## Treatments

- **Skills ON:** normal isolated skill discovery and instructions.
- **Skills OFF:** identical candidate prompt with skill instructions disabled.
- Same Codex model, `xhigh` reasoning effort, fast service tier, read-only sandbox, and zero candidate actions.
- Counterbalanced treatment order and blind assertion judges.

The four exact prompts and assertions are frozen in [audit-gate-cases.json](./audit-gate-cases.json). Any later wording change creates a new cohort rather than replacing this result.

## Dimensions

Each case has five assertions in this fixed order:

1. automatic receipt contract;
2. correct closeout status;
3. correct evidence classification;
4. decisive verification or unblock action;
5. no fabricated execution or evidence.

## Success gate

The skill demonstrates differentiated audit-gate value only if all conditions pass:

- routing selects `bug-receipt` in 4/4 probes;
- Skills ON passes at least 18/20 assertions;
- Skills ON has no evidence-safety regression against Skills OFF on assertions 2, 3, and 5;
- Skills ON passes automatic receipt contract in 4/4 cases; and
- either overall accuracy improves by at least 15 percentage points, or receipt-contract accuracy improves by at least 50 percentage points without an evidence-safety regression.

If the gate fails, publish the failure and do not use the benchmark as marketing proof.

## Budget

The prior passing paired report is the measurement baseline. Its largest comparable candidate observation was 24,984 uncached input tokens, 376 response tokens, and 50,447 case-total tokens with zero actions. The frozen cases use ceilings of 31,200, 470, and 63,000 respectively: no more than 25% headroom.

## Interpretation limits

- One paired observation per case does not estimate sampling variance.
- Exact receipt conformance measures workflow automation, not raw model intelligence.
- Skills OFF disables the complete skill-instruction surface, so cost deltas are not attributable only to Bug Receipt.
- A win supports the category "audit gate for coding-agent bug closeout," not a universal superiority claim.
