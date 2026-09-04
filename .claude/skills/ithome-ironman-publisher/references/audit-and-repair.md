# Audit, import, and repair

## Audit

Build three evidence sets: fresh expected repo payloads, all observed drafts in the confirmed series, and relevant public series entries. Traverse every draft page or load-more surface. Open candidates when the list does not show exact title, status, and first body line.

Before Day 1 bootstrap, the public series set does not exist. Audit drafts using the exact registered topic identity and report the public-series portion as `not_available_pre_bootstrap`, not empty or complete. After bootstrap, load the verified series state for public checks.

Match exact title and the first non-empty body line. Do not assign Day merely because a title contains a number.

Use `scripts/audit-classifier.mjs` for deterministic classification after Computer Use has produced complete observations. The helper does not scan iThome and must not be used to upgrade incomplete UI evidence into a complete audit.

- `complete`: exactly one draft matches; title and canonical sync line are exact; it remains a draft.
- `missing`: no associated draft or public entry exists after a complete scan.
- `duplicate`: at least two drafts associate with one Day.
- `mismatch`: one identifier associates the draft with a Day but an expected field differs.
- `conflict`: title and canonical line associate with different Days, or draft/public states conflict.
- `already_published`: an exact public entry exists.
- `unclassified`: a candidate cannot be safely associated.
- `failed`: the scan is incomplete or unreliable.

Incomplete pagination or an unreadable candidate makes confidence partial or unknown. Never report `30/30 complete` without a reliable complete scan.

## Import

Before each create: audit the Day, continue only for `missing`, build a fresh payload, open the confirmed series form, paste exact title and body, verify the first line, click only save-draft, then verify the saved item exists as a draft.

`import-drafts --all` remains disabled until live Computer Use evidence proves how iThome handles the intended batch size. Live Chrome evidence on 2026-08-30 proved that distinct Day 1, Day 2, and Day 3 drafts can coexist before bootstrap without overwrite. It also showed that topic selection creates a blank server-side draft immediately. This proves limited future-Day multi-draft support only; it does not prove that 30 drafts are accepted or that no count/rate limit exists.

Once capability is verified and recorded in the process baseline, `--all` may create at most five drafts per run. Verify and checkpoint each one; perform a small audit after every three creations and at run end. Every later run begins with a fresh audit and resumes from confirmed missing Days, never from `lastDay + 1` alone.

Until then, the safe pre-contest default is local payload inventory plus at most a Day 1 draft. Do not treat registered topic selection as proof that 30 remote drafts are supported.

Do not promise that a fixed delay prevents rate limiting. Use a conservative human pace and stop at the first anti-automation or ambiguous signal.

## Repair

Audit first, create only confirmed missing Days in the explicit target, and report all other classifications without mutation. Always run a new audit after repair. Repair completion only means create actions finished; only the post-repair audit may declare complete.
