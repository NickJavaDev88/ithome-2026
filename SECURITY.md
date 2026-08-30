# Security policy

## Reporting a vulnerability

Please use GitHub's private security advisory workflow for vulnerabilities that could expose credentials, browser sessions, unpublished article content, cross-user state, or unintended publishing actions. Do not include live secrets in the report; provide redacted reproduction details and synthetic fixtures instead.

## Supported scope

Security-sensitive components include:

- the iThome payload producer;
- Computer Use publishing instructions and authorization gates;
- event and Day 1 bootstrap validators and atomic writers;
- Hermes watcher input validation and notification deduplication;
- local runtime-state permissions.

## Credential boundary

This repository must not contain iThome session state or Telegram credentials. Codex operates the iThome UI without receiving Telegram credentials. Hermes consumes minimum machine-readable results without receiving an iThome session or permission to operate iThome.
