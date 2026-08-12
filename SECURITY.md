# Security policy

## Supported versions

Security fixes are applied to the latest release.

## Reporting a vulnerability

Do not open a public issue for a vulnerability that could put users at risk. Use GitHub's private vulnerability reporting for this repository instead.

Include the affected version, reproduction steps, impact, and any suggested mitigation. You should receive an acknowledgement within seven days.

## Trust boundary

The validator and website run locally and do not send receipt content to a service. The installer validates and copies the skill bundled in the selected package, refuses unsafe broad destinations, and stores forced-install backups outside the active discovery directory. Receipts should redact credentials, cookies, tokens, personal data, private URLs, and sensitive payloads. Review remote package sources before running any `npx` command.
