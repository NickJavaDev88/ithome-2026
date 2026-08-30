# Hermes watcher integration

`scripts/hermes-watcher.mjs` is a read-only bridge consumer and notification decision engine. It does not log in to iThome, fetch article bodies, obtain Telegram credentials, send Telegram, install a schedule, or replace Hermes's existing Telegram poller and public-series watchdog.

## Inputs and output

The watcher reads:

- publisher events from `/Users/Shared/ithome-ironman-bridge/events/`;
- verified Day 1 state from `/Users/Shared/ithome-ironman-bridge/state/series-bootstrap.json`;
- deduplication state from a Hermes-owned absolute path ending in `watcher-state.json`.

It prints one JSON result. `notifications` contains messages that Hermes may relay through its existing Telegram capability. `watchdog.status: "ready"` hands the verified `seriesUrl` and `seriesId` to the existing public-series watchdog. A blocked watchdog must not guess the series identity.

The watcher refuses to store its own state anywhere below `/Users/Shared/ithome-ironman-bridge`. The state directory must already exist and be owned and writable by the Hermes service environment.

## Dry run

Use fixture paths for local verification; do not point a development run at Hermes's production state file.

```bash
node .agents/skills/ithome-ironman-publisher/scripts/hermes-watcher.mjs \
  --events /absolute/fixture/events \
  --bootstrap /absolute/fixture/state/series-bootstrap.json \
  --state /absolute/hermes-owned-fixture/watcher-state.json \
  --checkpoint day1-1900 \
  --dry-run
```

`--dry-run` never writes watcher state. Without `--dry-run`, state is written atomically. Repeated `eventId` values and repeated Day 1 checkpoints remain silent after their first recorded handling.

## Notification rules

- A fresh `audit-drafts: complete` event is silent.
- Missing, duplicate, mismatch, unclassified, and failed audit results produce distinct notification decisions.
- Blocked, failed, or uncertain publish results and non-verified bootstrap events produce failure notification decisions.
- Events older than the default 36-hour window produce `stale_event` instead of being presented as current evidence. Override only with an explicit `--max-age-hours` value.
- Invoke with `--checkpoint day1-1900` at the Day 1 19:00 schedule and `--checkpoint day1-2230` at the 22:30 schedule. Missing or invalid verified state produces one reminder per checkpoint.
- After a checkpoint has observed missing or invalid bootstrap state, the first later valid state produces one `bootstrap_recovered` decision. Later runs remain silent.

Scheduling, Telegram relay, service-account filesystem verification, and the public-page network check remain Hermes deployment work and require separate authorization and live acceptance.
