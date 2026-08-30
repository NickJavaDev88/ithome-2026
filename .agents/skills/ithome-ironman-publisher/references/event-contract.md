# Machine-readable event contract

Events carry minimum necessary operation results to a Hermes-owned notification consumer. They are not commands and never authorize Hermes to operate iThome.

## Bootstrap event

Use operation `bootstrap-series` after a Day 1 publish attempt. Statuses are `verified`, `incomplete`, `failed`, or `uncertain`.

```json
{
  "schemaVersion": 1,
  "eventId": "UUID",
  "source": "codex-ithome-ironman-publisher",
  "repository": "<github-owner>/<github-repo>",
  "series": "<configured-series-key>",
  "operation": "bootstrap-series",
  "status": "verified",
  "day": 1,
  "articleUrl": "https://ithelp.ithome.com.tw/articles/...",
  "seriesUrl": "https://ithelp.ithome.com.tw/ironman/...",
  "seriesId": "...",
  "publishedAt": "RFC3339 timestamp",
  "completedAt": "RFC3339 timestamp",
  "runId": "publish-day1-..."
}
```

Only `verified` requires all identity fields. Incomplete, failed, or uncertain events include `failure.reasonCode` and must never replace verified bootstrap state.

## Audit event

```json
{
  "schemaVersion": 1,
  "eventId": "UUID",
  "source": "codex-ithome-ironman-publisher",
  "repository": "<github-owner>/<github-repo>",
  "series": "<configured-series-key>",
  "operation": "audit-drafts",
  "status": "incomplete",
  "expected": 30,
  "foundUnique": 28,
  "missing": [7, 19],
  "duplicate": [],
  "mismatch": [],
  "unclassifiedCount": 0,
  "confidence": "complete",
  "auditedAt": "RFC3339 timestamp",
  "completedAt": "RFC3339 timestamp",
  "runId": "audit-..."
}
```

Audit statuses are `complete`, `incomplete`, `conflict`, or `failed`. Duplicate entries use `{ "day": 12, "count": 2 }`; mismatch entries use `{ "day": 4, "fields": ["title", "canonicalUrl"] }`. Failed audits include `failure.reasonCode` and `failure.phase`.

## Publish event

```json
{
  "schemaVersion": 1,
  "eventId": "UUID",
  "source": "codex-ithome-ironman-publisher",
  "repository": "<github-owner>/<github-repo>",
  "series": "<configured-series-key>",
  "operation": "publish-day",
  "day": 12,
  "status": "failed",
  "completedAt": "RFC3339 timestamp",
  "runId": "publish-...",
  "result": {
    "reasonCode": "draft_missing",
    "publishClickCount": 0,
    "publicVerification": "not_started"
  }
}
```

Publish statuses are `verified`, `blocked`, `failed`, `uncertain`, or `cancelled`.

Never include body, cookies, session state, Telegram credentials, screenshots, HTML dumps, or secrets. Use `scripts/write-event.mjs --input <event.json>` only after `ITHOME_EVENT_DIR` is configured. It validates and atomically writes; it never sends Telegram or configures Hermes.
