# iThome publishing automation

This directory contains the publishing tooling for the 2026 iThome Ironman series.

## Design

- `src/content/posts/*.md` remains the canonical article source.
- The iThome-only first line is generated at publish time and is never written back into the Markdown source.
- Draft preparation and daily publishing are separate operations.
- Publishing is fail-closed: automation must not click the final publish action unless all preflight checks pass.
- A publish attempt must never blindly submit twice. After any uncertain submit result, verify the public series page before retrying.
- Browser authentication state must remain outside the repository.

## Commands

```bash
npm run ithome:prepare -- --day 5
npm run ithome:prepare -- --day 5 --json
npm run ithome:publish -- --day 5
```

`ithome:prepare` is deterministic and does not open a browser. It prints the exact title/body that should be stored as an iThome draft.

`ithome:publish` currently operates in safe mode: it validates the local payload and browser session, but final publishing remains disabled until the iThome selectors and draft workflow have been verified against the real account.

## Browser state

The Playwright publisher expects a local storage-state file. By default:

```text
.playwright/ithome-storage-state.json
```

Override it with:

```bash
ITHOME_STORAGE_STATE=/absolute/path/to/state.json npm run ithome:publish -- --day 5
```

Never commit browser state, cookies, passwords, or session tokens.
