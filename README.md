# iThome 鐵人賽 30 天發布模板

這是一個可以 fork 或下載後改成自己系列的模板。同一份 Day 1～30 Markdown 文章會用在兩個地方：

1. Astro 建置的 GitHub Pages 公開網站。
2. 本機 publisher 準備並核對 iThome 發布內容。

Hermes 監控是選配。沒有 Hermes，網站與 publisher 仍能使用。

> 這個 repo 不會替你保存 iThome 登入資料，也不會因為執行測試就發布文章。正式 iThome 發布、GitHub Pages 部署與本機排程都需要另外明確操作及驗收。

## 先認識三種資料

- `src/content/posts/day-01.md`～`day-30.md`：文章唯一正式來源。
- `ithome.config.json`：可提交的公開設定，例如帳號顯示名稱、系列名稱、比賽標籤、30 天日期與 GitHub Pages 網址。
- repo 外的本機資料：Chrome profile、cookie、登入 session、事件目錄、bootstrap state、Telegram credential。這些永遠不能 commit。

## 1．Fork 或下載

Fork 後 clone：

```bash
git clone https://github.com/YOUR_GITHUB_NAME/YOUR_REPO.git
cd YOUR_REPO
pnpm install
```

也可以下載 ZIP、解壓縮後進入資料夾，再執行 `pnpm install`。若使用 ZIP，之後要自行建立 GitHub repo 才能發布 Pages。

## 2．換成自己的 Day 1～30 文章

建立 `src/content/posts/day-01.md` 到 `day-30.md`，檔名不能跳號。每篇至少包含：

```yaml
---
title: "文章標題"
description: "文章摘要"
publishDate: 2026-09-01
tags: [AI, Agent]
draft: true
series: "你的系列名稱"
day: 1
---

文章正文
```

`day`、檔名與 `publishDate` 必須吻合初始化後的日期表。iThome 專用同步連結會在產生 payload 時加入，不要寫回 Markdown。

## 3．只做一次初始化

你必須明確提供 Day 1 的完整日期。程式不會從今天、文章順序或 iThome 畫面猜日期。

一般使用者建議直接執行互動式精靈：

```bash
pnpm ithome:setup
```

精靈會逐題詢問 7 項公開資料，接著顯示 GitHub Pages 網址與完整 Day 1～30 日期表。只有最後回答 `yes` 或 `y` 才會寫入；回答其他內容會取消，不修改設定檔。精靈不會詢問密碼、cookie、token、Chrome profile 或登入 session。

如果把 repo 交給 AI Agent，Agent 可以逐題向你詢問缺少的資料，再使用以下明確參數模式：

```bash
pnpm ithome:setup -- \
  --account "你的公開 iThome 帳號" \
  --series-title "你的完整系列名稱" \
  --contest-tag "畫面顯示的比賽標籤" \
  --contest "穩定的比賽識別，例如 18th-ironman-2026" \
  --day1-date "2026-09-01" \
  --github-owner "YOUR_GITHUB_NAME" \
  --github-repo "YOUR_REPO"
```

兩種模式都會產生相同的 `ithome.config.json`，並明確列出 Day 1～30 的每一天。它們可以用相同資料重跑；不會建立 cookie、登入資料、排程或秘密。請人工檢查設定檔，再把它與文章一起 commit。

若使用 GitHub 使用者首頁 repo（repo 名稱剛好是 `帳號.github.io`），初始化器會使用空的 Pages base；一般 project Pages 則使用 `/<repo 名稱>`。

## 4．本機驗證

```bash
pnpm test:ithome
pnpm build
pnpm ithome:prepare -- --day 1 --json
```

`ithome:prepare` 只讀 repo 並產生 payload，不會開 Chrome 或連到 iThome。它會檢查 Day、日期、標題、正文與公開網址；缺設定或不一致就停止。

## 5．啟用 GitHub Pages

1. 把變更推到 GitHub 的 `main` 分支。
2. 到 repo 的 **Settings → Pages**。
3. 在 **Build and deployment** 選擇 **GitHub Actions**。
4. 手動執行一次 `Deploy to GitHub Pages` workflow，確認成功且網址與 `ithome.config.json` 一致。

workflow 也會每天在 Asia／Taipei 09:15 建置。測試通過不等於已部署；必須看到 GitHub Actions 成功與實際公開頁面。

## 6．準備專用 Chrome

請建立獨立 Chrome profile，並由人手動登入正確的 iThome 帳號。profile 必須放在 repo 外。

macOS 範例：

```bash
/Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome \
  --remote-debugging-address=127.0.0.1 \
  --remote-debugging-port=9223 \
  --user-data-dir="/你自己的/repo外路徑/ithome-publisher-chrome" \
  https://ithelp.ithome.com.tw/
```

CDP 只能使用 `127.0.0.1`、`localhost` 或 `::1`。不可綁到 LAN／公開網路，也不可把 profile、cookie、session、密碼或一次性驗證碼交給 repo 或 Agent。

## 7．設定本機 publisher

以下值只放在本機執行環境，不提交：

```bash
export ITHOME_CDP_ENDPOINT="http://127.0.0.1:9223"
export ITHOME_DRAFTS_URL="https://ithelp.ithome.com.tw/你的草稿列表"
export ITHOME_PUBLIC_ARTICLES_URL="https://ithelp.ithome.com.tw/你的公開文章列表"
export ITHOME_EVENT_DIR="/repo外的絕對路徑/events"
export ITHOME_BOOTSTRAP_STATE="/repo外的絕對路徑/state/series-bootstrap.json"
```

公開帳號、系列名稱與 contest tag 由 `ithome.config.json` 讀取，不再寫死在 publisher。

`pnpm ithome:publish-local -- --day 1` 會操作真實網站。只有在使用者另外明確授權真實發布時才能執行。Day 必須明確指定 1～30；publisher 最多點一次發布，結果不明就停止且不可重試。

Day 1 發布後，還必須從公開文章驗證系列連結，才可建立 verified bootstrap state。Day 2～30 缺少有效 state 時會 fail closed，不會猜 series ID。

## 8．選配 Hermes 監控

Hermes 只讀取 publisher 的 machine-readable event 與 verified bootstrap state，不登入 iThome、不讀草稿正文、不持有 Chrome 或 Telegram credential，也不負責發布。

bootstrap 就緒後，watcher 會把已驗證的 `seriesUrl` 交給既有公開系列頁 watchdog。Hermes 自己的 deduplication state 必須放在 Hermes 私有可寫目錄，共享 event／bootstrap 位置只給它讀取權限。

啟用 Hermes 需要在目標主機另行完成：目錄權限、watcher 安裝、既有 Telegram relay 串接與公開系列頁真實驗收。本 repo 不會安裝排程、不會發 Telegram，也不會建立第二個 poller。

## Fail closed 安全規則

- payload 只能由 `pnpm ithome:prepare -- --day N --json` 新鮮產生。
- Day 必須明確指定，且只能是 1～30。
- cookie、Chrome profile、session、Telegram credential 與 Hermes 私有 state 永遠留在 repo 外。
- CDP 只允許 loopback。
- 不刪草稿、不覆寫衝突草稿、不修改已公開文章。
- 發布前要核對帳號、系列、contest tag、唯一草稿、標題、同步連結與正文。
- 每次 run 最多一次 publish click。
- Cloudflare、CAPTCHA、429、登入失效、重複草稿、頁面改版或結果不明時立即停止。
- publish click 後若結果不明，不可自動重試。

## 可直接交給 AI Agent 的指令

```text
請協助設定這個 iThome 鐵人賽模板。

先完整閱讀 README.md、AGENTS.md（如有）、.agents/skills/ithome-ironman-publisher/SKILL.md 與它要求的 references。先執行 git status，保護 dirty worktree；不可 reset、restore、checkout 或 clean。

確認 Day 1～30 文章後，逐題詢問我尚未提供的資料：公開 iThome 帳號、完整系列名稱、contest tag、contest 識別、Day 1 YYYY-MM-DD、GitHub owner 與 repo 名稱。一次只問一題，不可猜日期或自行補值。資料齊全後使用明確參數執行 pnpm ithome:setup，再檢查 ithome.config.json 的 30 天日期與 Pages 網址。

接著執行 pnpm test:ithome、pnpm build、pnpm ithome:prepare -- --day 1 --json 與 git diff --check。掃描 repo 是否出現真實草稿 ID、個人絕對路徑、cookie、token、密碼、Chrome profile、登入 session 或 Hermes 私有 runtime state。

除非我另外明確授權，不可登入或操作真實 iThome、不可點擊發布、不可 commit／push／merge／部署、不可安裝排程、不可操作 Hermes 或發 Telegram。任何遠端結果不確定時 fail closed，不可重試 publish click。
```

## 目前模板提供的能力

- Astro／GitHub Pages 網站。
- 可重跑、可測試的 `pnpm ithome:setup`。
- 明確的 Day 1～30 日期表與 Pages URL 設定。
- repo payload producer、inventory、event、bootstrap 與 browser adapter 契約。
- loopback-only CDP 與最多一次 publish click 的 fail-closed publisher。
- 選配、只讀的 Hermes watcher 交接契約。

仍需每位使用者自己完成並驗收：30 篇正式文章、GitHub Pages 首次成功部署、專用 Chrome 登入、本機 event／state 目錄、Day 1 真實發布與 bootstrap、Day 2～30 真實運作，以及選配 Hermes 的主機設定。

## 技術文件

- Publisher 規則：`.agents/skills/ithome-ironman-publisher/SKILL.md`
- 本機設定：`.agents/skills/ithome-ironman-publisher/references/local-configuration.md`
- 發布安全：`.agents/skills/ithome-ironman-publisher/references/safety-policy.md`
- 事件契約：`.agents/skills/ithome-ironman-publisher/references/event-contract.md`
- Day 1 bootstrap：`.agents/skills/ithome-ironman-publisher/references/bootstrap-state.md`
- 選配 Hermes：`.agents/skills/ithome-ironman-publisher/references/hermes-watcher.md`
