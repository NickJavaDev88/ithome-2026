# iThome publishing payload

這個目錄只負責從 repo 內的 Markdown 產生 iThome 發文用 payload，不直接操作 iThome 網站。

## 設計

- `src/content/posts/*.md` 是文章唯一來源。
- iThome 專用第一行會在輸出 payload 時動態加入，不寫回原始 Markdown。
- 產生的第一行使用明確 Markdown 連結：`本文同步刊載於[個人連載網站](<canonicalUrl>)`。
- GitHub Pages 文章網址固定由 Day 編號推導，例如 Day 5 對應 `https://gcake119.github.io/ithome-2026/day/05/`。
- 瀏覽器操作、登入狀態與正式發文交給外部 Computer Use agent（例如 Codex）處理。
- Repo 不保存 iThome Cookie、session、browser state 或其他登入憑證。

## 指令

```bash
pnpm ithome:prepare -- --day 5
pnpm ithome:prepare -- --day 5 --json
```

`ithome:prepare` 不會開瀏覽器，也不會對 iThome 發出任何 request。

一般模式會輸出人類可讀的標題、網址與正文預覽；`--json` 則輸出可直接交給 Computer Use agent 的結構化 payload。

## 發布分工

```text
src/content/posts/day-NN.md
        ↓
pnpm ithome:prepare -- --day N --json
        ↓
Computer Use agent
        ↓
iThome 草稿 / 發表
        ↓
Hermes watchdog 驗證公開頁
```

Computer Use agent 應完全使用 payload 的標題與正文，不自行改寫文章內容。
