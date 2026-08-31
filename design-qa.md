# Design QA：手機版文章閱讀介面

## 比對基準

- Source visual truth：`/Users/caiyijun/.codex/generated_images/01a05744-2162-7ae0-9132-84ab1d083fa8/exec-bdb14d4b-7a49-4a41-ad0a-0730ec5c4cd6.png`。
- Implementation screenshot（最終暗色）：`output/playwright/mobile-reader-dark-final.png`。
- Implementation screenshot（亮色）：`output/playwright/mobile-reader-light.png`。
- Implementation screenshot（目錄展開）：`output/playwright/mobile-reader-directory-open.png`。
- Desktop regression screenshot：`output/playwright/desktop-reader-regression.png`。
- Full-view comparison：`output/playwright/mobile-reader-dark-final-comparison.png`。
- Source pixels：853 × 1844；Implementation pixels：375 × 1940；CSS viewport：390 × 844；device scale factor：1。
- Density normalization：來源與實作都等比例縮放到 390px 寬後並排；較短一側只在底部補深灰，不把內容長度差異誤判為版面缺失。
- State：Day 27 文章、390px 手機寬度、暗色主比對；另驗證亮色、目錄展開及 1280px 桌面版。

## Findings

- 沒有尚未處理的 P0、P1 或 P2 問題。
- [P3] 來源示意圖只呈現一個短段落，實作保留完整 Markdown 測試文章，因此整頁較長。
  - Location：文章正文。
  - Evidence：並排圖左側在第一節後進入上下篇，右側仍有第二節、條列與引用。
  - Impact：不影響首屏層級或閱讀操作；這是內容完整性的刻意差異。
  - Follow-up：不調整，避免為了符合示意圖而截斷文章。

## 五項必要檢查

- Fonts and typography：沿用 Noto Sans TC；手機標題約 37px、兩行呈現，正文 17px／1.9 行高。標題、Part、正文及節次層級與來源一致，沒有截斷或水平溢位。
- Spacing and layout rhythm：手機頁首由初版 164px 收斂為 130px；文章標題頂端位於 201px，第一個 844px 視窗可看到標題、導言與第一節。桌面仍維持 350px／915px 雙欄，手機專用內容在桌面為隱藏。
- Colors and visual tokens：延續石墨灰、暖白、檸檬黃；亮暗切換都保留足夠層級，沒有引入漸層或科技藍。
- Image quality and asset fidelity：沿用正式 30 對話氣泡資產，沒有重新繪製或以 CSS／文字符號替代；42px 手機尺寸仍清楚。
- Copy and content：保留原文章、日期、Part 名稱與上下篇標題；手機新增「30 天 AI 協作學習誌」及「系列目錄」白話入口。

## Interaction、accessibility 與 console

- 「系列目錄」使用原生 `details`／`summary`，關閉時只占一列，開啟後顯示 Part 與文章清單；目前文章保留 `aria-current="page"`。
- 目錄按鈕取得焦點後可開合；展開狀態中 Day 27 正確高亮。
- 佈景按鈕維持 44 × 44px；暗色顯示月亮、亮色顯示太陽，`aria-label` 與 `aria-pressed` 同步。
- 上下篇在手機維持雙欄、中央分隔線與左右方向；連結文字完整。
- 390px CSS viewport 下文件沒有水平溢位；Browser console 為 0 errors、0 warnings。
- `prefers-reduced-motion` 既有規則保留。

## Comparison history

1. 初版手機頁首高度為 164px，較來源約多 34px，文章標題頂端為 243px，列為 [P2] 首屏節奏偏鬆。
2. 修正品牌列、進度列、情境列與文章上方間距；最終頁首為 130px，標題頂端為 201px。
3. 修正後重新擷取 `mobile-reader-dark-final.png`，並產生 `mobile-reader-dark-final-comparison.png`；來源與實作的首屏順序、標題兩行、目錄入口及上下篇雙欄一致，先前 P2 已解除。

## Implementation Checklist

- [x] 手機頁首改為緊湊品牌列、系列進度與 Day／Part 情境列。
- [x] 完整系列清單收進可操作的原生目錄。
- [x] 手機文章標題、Part 與正文節奏對齊選定方向。
- [x] 亮暗切換維持單一太陽／月亮圖示與 44px 觸控目標。
- [x] 手機上下篇維持雙欄指示。
- [x] 驗證 390px 暗色、亮色、目錄展開、console 及 1280px 桌面回歸。
- [x] 通過 Astro build 與 `git diff --check`。

final result: passed
