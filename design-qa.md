# Design QA：鐵人賽 30 天系列識別

## 比對基準

- Source visual truth：`/Users/caiyijun/.codex/generated_images/01a05697-5051-7122-bd45-8aae03504046/exec-16680281-ee1e-48e8-b091-395eae42e245.png`
- Implementation screenshot（亮色）：`/Users/caiyijun/project/ithome-2026/output/playwright/ironman-30-mark-light-revised.png`
- Implementation screenshot（暗色）：`/Users/caiyijun/project/ithome-2026/output/playwright/ironman-30-mark-dark-revised.png`
- Implementation screenshot（手機）：`/Users/caiyijun/project/ithome-2026/output/playwright/ironman-30-mark-mobile.png`
- Theme toggle（桌面）：`/Users/caiyijun/project/ithome-2026/output/playwright/theme-toggle-top-right-desktop.png`
- Theme toggle（手機）：`/Users/caiyijun/project/ithome-2026/output/playwright/theme-toggle-top-right-mobile.png`
- Full-view comparison：`/Users/caiyijun/project/ithome-2026/output/playwright/ironman-30-mark-comparison.png`
- Focused comparison：`/Users/caiyijun/project/ithome-2026/output/playwright/ironman-30-mark-revised-comparison.png`
- Favicon 16px evidence：`/Users/caiyijun/project/ithome-2026/output/playwright/ironman-30-favicon-16px.png`
- Source pixels：1254 × 1254。
- Desktop implementation pixels：1280 × 1113；CSS viewport：1280 × 1024；device scale factor：1。
- Mobile CSS viewport：390 × 844；device scale factor：1。
- Density normalization：focused comparison 以等比例縮放並排；未將不同密度造成的差異列為缺失。
- State：首頁、亮色與暗色佈景、桌面與 390px 手機寬度。

## Findings

- 沒有尚未處理的 P0、P1 或 P2 問題。
- [P3] 16px favicon 的斜角與氣泡指向帶有些微點陣柔化。
  - Location：`public/favicon.png`。
  - Evidence：16px 放大檢查仍可讀為「30」，但對話指向比 52px 側欄版本柔和。
  - Impact：不影響辨識或操作，僅是極小尺寸的光學微調空間。
  - Follow-up：若未來需要更銳利，可另製作 16px 專用像素修正版。

## 五項必要檢查

- Fonts and typography：Noto Sans TC 已載入；首頁標題為 76px；字重、行高、換行與方案字級一致。
- Spacing and layout rhythm：桌面維持雙欄；標誌為 52 × 52px。佈景按鈕固定在整個視窗右上角，桌面距上、右各 20px，手機距上、右各 14px。手機標誌為 46 × 46px，頁面 `scrollWidth` 與 `clientWidth` 同為 390px，沒有水平溢位。
- Colors and visual tokens：側欄固定使用暖白 3＋檸檬黃 0，favicon 使用石墨黑＋檸檬黃；與石墨灰、暖白、檸檬黃系統一致。
- Image quality and asset fidelity：正式圖示來自選定提案的生成資產並經透明背景與純色整理；0 的下方指向已移除，只保留 3 的單一指向；沒有以手工 SVG 或 CSS 圖形替代。
- Copy and content：無障礙名稱為「鐵人賽 30 天 AI 協作開發系列」；系列文案與既有內容未被圖示更新改寫。

## Interaction and console checks

- 佈景切換可在亮色／暗色間切換，`aria-label` 同步更新。
- 按鈕為 44 × 44px 圓形觸控目標；亮色顯示太陽，暗色顯示月亮，沒有可見文字標籤。
- 亮色與暗色狀態皆顯示正確側欄圖示資產。
- 瀏覽器分頁圖示連結解析至 `/ithome-2026/favicon.png`。
- Browser console：0 errors、0 warnings。

## Comparison history

1. 初次實作發現 [P1]：亮色頁面的深色側欄載入黑色 3，造成 3 與背景融合，只剩黃色 0 清楚可見。
2. 修正：側欄固定使用暖白 3＋黃色 0；黑黃版本保留給 favicon。
3. 使用者調整：移除 0 下方的對話指向，重新生成圖示，只保留 3 左下方的單一指向。
4. 修正後證據：`ironman-30-mark-light-revised.png`、`ironman-30-mark-dark-revised.png` 與 `ironman-30-mark-revised-comparison.png`。桌面與手機皆可辨識「30」，沒有新的 P0、P1 或 P2。
5. 佈景按鈕由側欄左下移至整個視窗右上角，改為單一太陽／月亮圖示。桌面與 390px 手機版皆無溢位，切換狀態與無障礙名稱同步。

## Implementation Checklist

- [x] 以修正版 30 對話氣泡取代舊圖示。
- [x] 建立亮色、暗色、favicon 與 Apple touch icon 資產。
- [x] 驗證桌面雙欄、390px 手機版及佈景切換。
- [x] 將佈景按鈕固定於視窗右上角，驗證太陽／月亮圖示狀態。
- [x] 通過 Astro build、91 項測試與 `git diff --check`。

final result: passed
