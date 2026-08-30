# Day 1 bootstrap and series state

The public `/ironman/<series-id>` identity does not exist until Day 1 is formally published. Treat Day 1 as a bootstrap workflow and never require, guess, or synthesize a series ID before then.

## State machine

```text
PRE_BOOTSTRAP
→ DAY1_DRAFT_VERIFIED
→ READY_FOR_CONFIRMATION
→ PUBLISH_CLICKED
→ DAY1_ARTICLE_VERIFIED
→ SERIES_IDENTITY_VERIFIED
→ BOOTSTRAPPED
```

Day 1 may be publicly verified while bootstrap remains incomplete. If the article is public but the series link cannot be verified, do not click publish again. Report publish `verified` and bootstrap `incomplete` or `uncertain`.

## Identity extraction

After verifying the public Day 1 article title and canonical sync line:

1. Save the current public article URL as `articleUrl`.
2. Locate the series-name link in the metadata row immediately above the article title. The user-provided UI evidence shows category, linked series name, and `系列第 1 篇` above the title.
3. Match the complete registered series title before using the link. Do not rely on position, category alone, `第 1 篇`, truncated text, or a search result.
4. Read the link's actual destination as `seriesUrl`.
5. Require the expected iThome HTTPS host and an exact `/ironman/<series-id>` path shape.
6. Extract `seriesId` only from that verified URL, then reconstruct the URL from the extracted ID and require exact equality.
7. Open the series URL and verify the complete series title and exact Day 1 article.
8. Obtain `publishedAt` from the verified public article metadata. If it cannot be read reliably, bootstrap is incomplete.

Never use another series shown in screenshots, a prior contest, author profile ordering, URL autocomplete, or inferred numbering.

## Verified state

Default shared state path after the bridge is configured:

```text
/Users/Shared/ithome-ironman-bridge/state/series-bootstrap.json
```

Required shape:

```json
{
  "schemaVersion": 1,
  "source": "codex-ithome-ironman-publisher",
  "repository": "gcake119/ithome-2026",
  "contest": "18th-ironman-2026",
  "bootstrapDay": 1,
  "status": "verified",
  "articleUrl": "https://ithelp.ithome.com.tw/articles/...",
  "seriesUrl": "https://ithelp.ithome.com.tw/ironman/...",
  "seriesId": "...",
  "publishedAt": "RFC3339 timestamp",
  "verifiedAt": "RFC3339 timestamp",
  "runId": "publish-day1-...",
  "verification": {
    "titleMatched": true,
    "canonicalMatched": true,
    "seriesTitleMatched": true,
    "day1ListedOnSeriesPage": true
  }
}
```

Write verified state atomically with `scripts/write-bootstrap-state.mjs --input <state.json>` only after the bridge directory is configured. Never replace verified state with a failed, partial, or uncertain result; emit those as immutable events instead.

## Day 2–30 gate

Before any Day 2–30 publish workflow:

- Load bootstrap state from `ITHOME_BOOTSTRAP_STATE`, or the configured default.
- Validate the loaded file with `scripts/validate-bootstrap-state.mjs --input <series-bootstrap.json>`; do not duplicate or relax the checks in an ad hoc UI run.
- Require a direct non-symlink regular file with schema version 1 and `status: verified`.
- Require article URL, series URL, series ID, publish time, verification time, and all verification booleans.
- Validate series URL and ID against each other without network inference.
- Open the verified series URL and use it for the public duplicate-publish check.

Missing, invalid, unreadable, or inconsistent state blocks publishing with `series_bootstrap_missing` or `series_bootstrap_invalid`. It is not permission to rediscover or guess identity during a Day 2–30 publish run.

## Hermes boundary

Hermes may read the verified bootstrap state but must not log in to iThome or derive identity itself. Before verified state exists, a scheduled Day 1 watchdog cannot determine success and must notify instead of remaining silent. A later verified state may produce one recovery notification before normal series-page monitoring begins.
