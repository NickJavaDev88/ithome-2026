# Independent unattended publisher runner

## Why it is separate

Codex／Computer Use treats the final public publish action as representational communication and requires action-time confirmation. Project files cannot turn that platform rule off. Therefore the `publish-day` skill remains an attended recovery and manual-control path, not the scheduled publisher.

The unattended target is a separately installed local process that the user owns and authorizes outside Codex／Computer Use. It may use a dedicated browser profile or another locally approved iThome adapter. Its session, cookies, browser profile, and any credential material stay outside this repository and outside `/Users/Shared/ithome-ironman-bridge`.

## Runner contract

The reusable fail-closed decision core is `scripts/unattended-runner.mjs`. A separately reviewed local adapter supplies three functions:

1. `prepare(day)` creates a fresh repository payload.
2. `publish({ payload, fingerprint, runId })` performs all remote preflight and at most one publish action, then returns `verified`, `blocked`, `failed`, or `uncertain` with the same fingerprint.
3. `emit(event)` validates and atomically writes the minimal event to the configured event directory.

The adapter must audit the intended account, exact unique draft, title, canonical URL, sync line, public duplicate state, bootstrap state, and anti-automation／login state immediately before publishing. Missing, duplicate, mismatch, blocked, failed, uncertain, or stale evidence fails closed. It must never retry a publish click whose result is uncertain.

The core is silent only when the result is `verified`. Every result still writes a machine-readable event so the Hermes watcher can deduplicate it. Hermes decides whether an anomaly needs Telegram relay; Hermes does not invoke the runner and does not hold iThome credentials.

## Current readiness

The decision core and event／watcher contracts are repository-controlled. A real browser adapter, its isolated profile, service definition, production schedule, and live iThome acceptance are intentionally not installed or enabled by this repository change. Until those items pass on-host acceptance, unattended publishing is a target architecture rather than a current production capability.
