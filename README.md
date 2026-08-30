# iThome 2026 連載網站

以 Astro 建置的 2026 iThome 鐵人賽個人連載網站。

## 開發

```bash
pnpm install
pnpm dev
```

## 內容

文章放在 `src/content/posts/`，每篇使用固定 `day` 編號產生 `/day/01/`～`/day/30/` 網址。

正式發布前請設定正確的 `publishDate`，並將 `draft` 改為 `false`。每日 GitHub Actions 會重新建置網站；尚未到發布日期的文章不會出現在網站上。

## Codex 發文 skill

專案內包含 [`ithome-ironman-publisher`](.agents/skills/ithome-ironman-publisher/README.md) Codex skill。它以 `pnpm ithome:prepare` 的輸出為唯一 iThome 內容來源，透過 Computer Use 執行草稿盤點、匯入、修復及每日發布，並保留一次 publish click、衝突不覆寫及反自動化立即停止等安全界線。

skill、契約文件與 deterministic helpers 可以隨 repo 共同審查；登入 session、cookie、跨使用者 runtime state 與 Telegram credential 不得提交到 Git。

## License

本專案採用 [MIT License](LICENSE)。
