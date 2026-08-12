# Bug Receipt benchmarks

Measured on 2026-08-12. The evidence below is intentionally narrower than a marketing claim.

## Results

| Surface | Result | What it supports |
| --- | ---: | --- |
| Deterministic receipt invariants | 20/20 passed | The bundled validator accepts the declared valid states and rejects each tested invalid state at the expected field. |
| Fresh natural routing probes | 4/4 selected `bug-receipt` | The description routed UI pressure, complete API proof, a race, and a cross-system blocker correctly. |
| Loaded-skill ON quality | 18/20 assertions; 90% | The full skill produced the automatic receipt in 4/4 cases and passed two cases completely. |
| Skills OFF quality | 7/20 assertions; 35% | The same natural prompts without the selected skill did not produce the receipt in any case. |
| Quality lift | +55 percentage points | The pre-registered +15-point differentiated-value gate passed. |
| Evidence safety | 0 regressions | ON never lost a status, evidence-classification, or anti-fabrication assertion that OFF passed. |
| Paired significance | McNemar p = 0.003418 | Twelve assertions passed only in ON and one only in OFF in this bounded sample. |
| Candidate total tokens, ON vs OFF | 61,286 vs 57,315; +6.9% | The selected 4.0k-character workflow has a small raw total-token premium. |
| Cost per passed assertion | 3,404.8 vs 8,187.9 total tokens; -58.4% | The quality gain more than offsets raw token overhead on this cohort. |
| Uncached input per passed assertion | 914.9 vs 976.0; -6.3% | Effective uncached cost per successful requirement improved slightly. |
| Candidate latency sum, ON vs OFF | 31.17 s vs 25.01 s; +24.6% | The structured receipt remains slower in this single observation. |

The defensible conclusion is: Bug Receipt passed its bounded audit gate and materially improved closeout accuracy and cost per satisfied requirement over the no-skill arm. The two misses were narrow: the race receipt did not explicitly say the final stock invariant must be non-negative, and the cross-system receipt did not explicitly request both callback request and response or make identity-provider logs conditional on trace ownership.

A separate corroborating run on the same frozen cohort scored 19/20 ON versus 7/20 OFF (+60 points, `p = 0.000488`), with 4/4 receipts and zero safety regressions. It supports repeatability but is not substituted for the pre-registered primary result; its [raw report](./results/corroborating/model-ab-audit-gate-replication.json) and [compact summary](./results/corroborating/audit-gate-replication-summary.json) are published separately.

## Method

- Codex CLI `0.147.0`, `gpt-5.6-sol`, `xhigh`, fast service tier.
- Isolated config and read-only candidate sandbox.
- Four exact, pre-budgeted tasks from [audit-gate-cases.json](./audit-gate-cases.json).
- Byte-identical candidate prompts in both arms.
- Counterbalanced ON/OFF order.
- Independent natural routing probes, followed by a task-output pair with the catalog disabled in both arms.
- ON treatment: the selected full `SKILL.md` injected as developer instructions; OFF treatment: no selected skill instructions.
- Prompt-surface gates prove the full mandatory receipt contract appears only in ON.
- Blind judges received assertions, candidate response, and bounded telemetry but not the treatment identity.
- Judge and routing-probe usage is excluded from candidate cost.
- Zero candidate tool actions in both arms.
- Skill, cases, runtime/config, harness, routing contracts, and treatment surfaces are SHA-256 fingerprinted.

The machine-checkable [compact result](./results/audit-gate-summary.json) is checked against the [raw report](./results/model-ab-audit-gate-gpt-5.6-sol-xhigh.json): `npm run benchmark:audit-gate` verifies its SHA-256, derives the compact fields from raw responses and blind judgements, then applies the pre-registered decision gate.

## Historical baseline

The earlier three-case catalog-wide comparison remains in [model-ab-gpt-5.6-sol-xhigh.json](./results/model-ab-gpt-5.6-sol-xhigh.json). It scored 12/12 in both arms and had +30.4% total-token overhead. That run remains useful as history but does not isolate Bug Receipt: ON exposed the complete installed skill surface, and the explicit candidate wrapper disclosed the target skill name to both arms.

## Quarantined diagnostics

Earlier attempts remain under [results/quarantine](./results/quarantine) and are excluded from the headline result. They include an explicit-skill leak into both arms, a metadata-only treatment, an implicit-read treatment whose action telemetry could not prove which file was loaded, and two instruction-transport failures. These failures drove the final isolation controls; none is counted as a passing run.

The older external SSO holdout attempts also remain there. Their failure to request the complete correlated authentication evidence package informed the cross-system contract, but they are not part of the four-case primary cohort.

## Reproduce

Run the deterministic validator benchmark:

```bash
npm run benchmark:validator
```

Verify the published model gate summary:

```bash
npm run benchmark:audit-gate
```

Run the complete repository gate:

```bash
npm run check
```

The fresh model benchmark requires Codex CLI access and a loaded-skill ON/OFF harness. The exact prompt and budget contract is in [AUDIT_GATE_PROTOCOL.md](./AUDIT_GATE_PROTOCOL.md); the compact result preserves the source report hash and fingerprint.

## Limits

- One paired observation per case; sampling variance is not estimated.
- Four supplied-evidence tasks are not representative of all debugging work.
- Blind-judge assertion accuracy is not a human preference score.
- Treatment changes the system prompt, so cache state cannot be byte-identical; order is counterbalanced and uncached tokens are reported separately.
- The task-output pair isolates the selected skill body, while activation is verified by separate routing probes; it is not a single end-to-end host-invocation trace.
- Two cases passed 4/5 assertions, so this is a 90% assertion claim, not a 4/4 fully-passed-case claim.
