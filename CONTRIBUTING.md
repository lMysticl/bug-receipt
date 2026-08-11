# Contributing

Thanks for helping make bug-fix claims more trustworthy.

## Before opening a pull request

1. Keep the receipt contract small and deterministic.
2. Add or update a boundary case in `evals/` when activation or status behavior changes.
3. Add a validator test for every contract change.
4. Run `npm install` and `npm run check`.
5. Describe what was observed, changed, verified, and left unverified.

Use an issue before widening the JSON contract or adding network services. Bug Receipt intentionally stays local, portable, and dependency-light.
