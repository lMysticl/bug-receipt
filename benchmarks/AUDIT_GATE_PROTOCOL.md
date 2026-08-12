# Audit-gate benchmark protocol

Revision 4 pre-registered on 2026-08-12 before its candidate execution.

Revision 1 exposed the normal catalog but did not prove that the task candidate loaded the selected `SKILL.md`; it measured description-level behavior and is retained only as a diagnostic. Revision 2 required the candidate to load the skill, but privacy-minimal action telemetry could not prove which file was read. Revision 3 separated the activation probe from the task-output treatment and machine-checked the instruction surface. Revision 4 keeps that valid treatment and evaluates a new candidate skill revision after Revision 3 exposed a product-behavior failure.

## Decision

Test the product's narrow claim: when a user asks whether a bug can be closed, Bug Receipt should automatically return an auditable closeout decision without requiring the user to request a special format.

This benchmark does **not** test whether the model can write generally good debugging advice, and it cannot support a universal "best debugging skill" claim.

## Treatments

- **Skills ON:** the exact selected `bug-receipt/SKILL.md` body is injected as developer instructions by the trusted harness.
- **Skills OFF:** the same candidate prompt without those instructions.
- Both arms use the same natural user-task wrapper. It does not name `bug-receipt`, request a BUG RECEIPT, or otherwise disclose the target workflow.
- The independent routing probe uses the natural request and must select `bug-receipt`. In the task-output pair, ON receives that selected `SKILL.md` as developer instructions while the skill catalog is disabled in both arms; OFF receives neither. Prompt-surface markers prove the treatment difference without candidate file reads.
- Same Codex model, `xhigh` reasoning effort, fast service tier, and read-only sandbox. Both candidates must perform zero actions.
- Counterbalanced treatment order and blind assertion judges.

The four exact prompts and assertions are frozen in [audit-gate-cases.json](./audit-gate-cases.json). Any later wording change creates a new cohort rather than replacing this result.

## Harness correction recorded before the valid run

The first execution at 2026-08-12T00:24Z did not implement the declared discovery treatment: the legacy candidate wrapper inserted `Use $bug-receipt` into both ON and OFF prompts. That leaked the product identity and invalidated the run for this decision. Its raw output is retained in quarantine.

The user prompts and assertions remain byte-for-byte unchanged. The corrected harness, case metadata, and treatment implementation produce new fingerprints, so each correction is a changed-input run rather than an identical retry.

Each case declares `"ab_prompt_mode": "natural"` and `"ab_treatment_mode": "loaded-skill"`; a harness that ignores or rejects either field is not protocol-compatible.

A second diagnostic at 2026-08-12T00:35Z exposed only the catalog metadata, not the selected `SKILL.md` body, because the zero-action contract prevented a model-side file read. It measured 4/4 routing and 45% versus 30% assertion accuracy, but it is not the declared instruction-loaded treatment and does not satisfy the success gate.

A third diagnostic at 2026-08-12T00:46Z let ON select and read a skill at runtime. It measured 4/4 routing and 95% versus 25% assertion accuracy, but the stored action fingerprint could not prove that ON read the selected `SKILL.md`, and one OFF candidate acted. It is strong diagnostic evidence, not the final protocol-valid result.

Revision 3 at 2026-08-12T00:55Z was treatment-valid but failed the success gate: ON scored 5/20 (25%) and OFF 4/20 (20%). The failure was product-relevant: the selected skill usually returned ordinary closeout prose instead of its promised complete receipt. Revision 4 changes only the generic candidate skill instructions to make the complete receipt mandatory for every closeout decision, including concise requests. The four user prompts and 20 assertions remain unchanged.

The final treatment keeps real discovery as a separate routing probe. For task-output pairs, both arms have the catalog disabled and receive the byte-identical natural wrapper. The trusted harness injects the exact fingerprinted `SKILL.md` body only into ON, marks that surface, and requires zero candidate actions in both arms. Each case declares `"ab_treatment_mode": "loaded-skill"`; the harness fingerprints the skill body, treatment surfaces, cases, runtime, and implementation. Revision 4 is admissible as new input because the skill-body fingerprint changes; an identical retry of either revision remains forbidden.

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

The prior passing paired report is the token baseline. Its largest comparable candidate observation was 24,984 uncached input tokens, 376 response tokens, and 50,447 case-total tokens with zero actions. The frozen cases use ceilings of 31,200, 470, and 63,000 respectively: no more than 25% headroom.

## Interpretation limits

- One paired observation per case does not estimate sampling variance.
- Exact receipt conformance measures workflow automation, not raw model intelligence.
- Skills OFF disables the complete skill-instruction surface, so cost deltas are not attributable only to Bug Receipt.
- A win supports the category "audit gate for coding-agent bug closeout," not a universal superiority claim.
