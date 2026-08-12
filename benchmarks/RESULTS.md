# Bug Receipt benchmarks

Measured on 2026-08-12. The evidence below is intentionally narrower than a marketing claim.

## Results

| Surface | Result | What it supports |
| --- | ---: | --- |
| Deterministic receipt invariants | 20/20 passed | The bundled validator accepts the declared valid states and rejects each tested invalid state at the expected field. |
| Fresh routing probes | 3/3 selected `bug-receipt` | The installed skill was discoverable for the three selected defect-proof tasks. |
| Skills ON, blind-judged quality | 12/12 assertions; 3/3 cases | With skills enabled, the model correctly handled verified, partial, UI-proof, and concurrency-proof boundaries in this cohort. |
| Skills OFF, blind-judged quality | 12/12 assertions; 3/3 cases | The same model also solved this small supplied-evidence cohort without skill instructions. No quality lift was measured. |
| Paired significance | McNemar p = 1.0 | Zero discordant assertions; the comparison is not statistically conclusive. |
| Candidate total tokens, ON vs OFF | 61,787 vs 47,367; +30.4% | Enabling the complete skill surface increased total candidate tokens in this run. |
| Candidate uncached input, ON vs OFF | 21,726 vs 23,967; -9.4% | Cache effects differed between treatments; uncached input did not show a premium. |
| Candidate latency sum, ON vs OFF | 43.79 s vs 37.78 s; +15.9% | ON was slower in this single counterbalanced observation. |

The defensible conclusion is: Bug Receipt routed correctly and produced fully compliant evidence decisions on the selected tasks, while this benchmark did **not** demonstrate a quality improvement over `gpt-5.6-sol` at `xhigh`.

## Method

- Codex CLI `0.147.0`, `gpt-5.6-sol`, `xhigh`, fast service tier.
- Isolated config and read-only candidate sandbox.
- Three exact, pre-budgeted tasks from [model-cases.json](./model-cases.json).
- Byte-identical candidate prompts in both arms.
- Counterbalanced ON/OFF order.
- OFF treatment: `skills.include_instructions=false`.
- Blind judges received assertions, candidate response, and bounded telemetry but not the treatment identity.
- Judge and routing-probe usage is excluded from candidate cost.
- Zero candidate tool actions in both arms.
- Skill, cases, runtime/config, harness, routing contracts, and treatment surfaces are SHA-256 fingerprinted in the raw report.

## Failed holdout

An external SSO-blocker case was quarantined rather than added to the passing cohort. The initial candidate passed 3/4 assertions but requested a browser HAR without both IdP and application logs. A skill revision made the correlated-evidence rule explicit. Two subsequent judges still rejected the response for omitting a literal conditional IdP-log follow-up, even though the candidate requested a correlated HAR and responsible server-side authentication logs.

The failed and revised attempts remain under [results/quarantine](./results/quarantine). They are not counted in the 3-case A/B result.

## Reproduce

Run the deterministic validator benchmark:

```bash
npm run benchmark:validator
```

Run the complete repository gate:

```bash
npm run check
```

The model benchmark requires Codex CLI access and an ON/OFF harness that disables skills with `skills.include_instructions=false`. The exact prompts, responses, assertions, telemetry, fingerprints, treatment surfaces, and limitations are preserved in [model-ab-gpt-5.6-sol-xhigh.json](./results/model-ab-gpt-5.6-sol-xhigh.json).

## Limits

- One paired observation per case; sampling variance is not estimated.
- Three supplied-evidence tasks are not representative of all debugging work.
- Blind-judge assertion accuracy is not a human preference score.
- OFF disables the full skill-instruction surface, so token deltas are not attributable only to Bug Receipt.
- Treatment changes the system prompt; cache state cannot be byte-identical. The harness counterbalances order and reports uncached tokens separately.
- The failed holdout and post-hoc rubric history prevent a credible 4/4 claim.
