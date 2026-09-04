# Computer Use UI workflow

The following mapping was verified from user-provided screenshots of the logged-in 2026 Ironman editor on 2026-08-29. Treat the visible labels and structure as the baseline, but never encode brittle coordinates or assume stale element indices remain valid.

## Fixed series identity

The only permitted series for this skill is:

- Category: `Software Development`
- Series title: the exact `seriesTitle` from `ithome.config.json`.
- Visible contest tag: the exact `contestTag` from `ithome.config.json`.

Match the complete category and complete series title. Do not select by card position, category alone, truncated title, current challenge Day, or the fact that only one option is visible.

## Entry flow

1. From the logged-in iThome home page, activate the visible `鐵人發文` control.
2. Inspect the resulting editor before entering any payload.
3. If a `請選擇主題` modal appears, select the card whose category and full title exactly match the fixed series identity.
4. If the modal has no exact match, more than one exact match, or only an unreadable/truncated match, stop. Do not close the modal and continue with an unconfirmed series.
5. After selection, inspect fresh state and verify the editor header still shows the expected category and full series title.

Live Chrome evidence on 2026-08-30 showed that selecting the topic creates a server-side blank draft immediately, before the user activates `儲存草稿`. Therefore complete the missing/duplicate audit before selecting the topic, capture the new `/articles/<id>/draft` URL immediately afterward, and treat any interruption from that point as an existing blank draft requiring audit. Never select the topic again merely because the editor was not filled or saved.

The editor may display text such as `今天挑戰第 1 天，加油！`. This is informational UI only and must never supply or override the explicit `--day N`.

## Editor map

The verified editor contains:

- A title field with placeholder similar to `在這裡幫文章下個好標題...`.
- A Markdown body editor with placeholder similar to `在這裡開始寫文章囉...`.
- A Markdown toolbar and preview control. Do not use toolbar transformations to rewrite the payload.
- A bottom contest tag exactly matching the configured `contestTag`.
- A green split button: the main action is `儲存草稿`; its adjacent arrow opens additional actions.

Paste payload `title` into the title field and the entire payload `body` into the Markdown body editor. Do not paste title into the series header or category area.

The Markdown editor exposes a visible accessibility text area but also a hidden DOM `textarea` whose value may remain empty even after content is present. Do not use the hidden DOM value as save evidence. On an empty new draft, focus the visible text area and paste the body once. On an existing or uncertain draft, focus the visible text area, select all, delete, verify the visible count is zero, then paste exactly once. After a paste timeout, inspect the visible character count before deciding whether any retry is safe; a timeout may still have completed the paste.

Before save, require all of the following fresh visible evidence: exact title, visible character count equal to the fresh payload body length, and preview rendering `個人連載網站` as a link to the exact canonical URL. If a DOM action and the visible editor disagree, trust neither automatically: stop mutation, reconcile through the visible accessibility editor, and re-run every pre-save check.

## Split-button safety map

When collapsed, the safe draft action is the green main button labeled `儲存草稿`.

When its adjacent arrow is expanded, the verified menu contains:

- `發表文章`: allowed only in `publish-day`, after every publish preflight gate and action-time confirmation.
- `刪除草稿`: prohibited in every mode.

For import or repair, do not expand the arrow unless fresh UI inspection is required to distinguish controls; activate only the main `儲存草稿` action. If the accessibility tree does not clearly distinguish the main action, arrow, `發表文章`, and `刪除草稿`, click none and stop.

1. Load the installed `computer-use` skill and follow its confirmation policy.
2. Inspect fresh browser accessibility state and a screenshot when needed.
3. Confirm the logged-in account and target Ironman series from visible evidence.
4. Re-fetch UI state after every navigation or mutation; use only fresh element indices.

Prefer accessibility actions. Use coordinates only when accessibility is insufficient and the visible target is unambiguous. Use paste for exact title and multiline body. Read back title and first body line before save or publish. Stop if the editor transforms payload content.

Distinguish visible save-draft, publish-menu, final-publish, delete, overwrite, and edit-public actions. If save and publish cannot be distinguished, click neither. Delete, overwrite, and edit-public are never allowed.

The draft list and save-success surfaces were mapped with live Chrome evidence on 2026-08-30. A successful save displayed `Tip` and `儲存成功`; the profile article list displayed each item with an explicit `草稿` label and its `/articles/<id>/draft` URL. Treat these labels as required post-save evidence, but still re-inspect fresh state after every mutation. The public-verification surface remains unmapped. Any materially changed UI must be re-mapped before mutation.

## Public Day 1 identity map

User-provided public article evidence shows a metadata row above the article title containing:

- the category label;
- the linked series name;
- text such as `系列第 1 篇`.

After Day 1 publication, use the full linked series name in that row to obtain the actual series URL. The screenshot is structural evidence only; never reuse another article's category, series title, author, article URL, or series ID. Verify the linked series page before writing bootstrap state.
