import fs from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { chromium } from 'playwright';
import { prepareIthomePayload } from './prepare.mjs';

const args = process.argv.slice(2);
const dayIndex = args.indexOf('--day');
const day = dayIndex >= 0 ? Number(args[dayIndex + 1]) : NaN;
if (!Number.isInteger(day) || day < 1 || day > 30) {
  console.error('Usage: pnpm ithome:sync-draft -- --day N');
  process.exit(2);
}

const payload = await prepareIthomePayload(day);
const storageStatePath = path.resolve('.playwright/ithome-storage-state.json');
const padded = payload.dayString;

try {
  await fs.access(storageStatePath);
} catch {
  console.error(`Missing iThome browser session: ${storageStatePath}`);
  console.error('Run: pnpm ithome:save-auth');
  process.exit(3);
}

const browser = await chromium.launch({ headless: false });
const context = await browser.newContext({ storageState: storageStatePath });
const page = await context.newPage();

const screenshotPath = `.playwright/sync-draft-day-${padded}.png`;
const fail = async (message) => {
  console.error(`DRAFT SYNC FAILED: ${message}`);
  await page.screenshot({ path: screenshotPath, fullPage: true }).catch(() => {});
  await browser.close();
  process.exit(1);
};

async function visibleFirst(locators) {
  for (const locator of locators) {
    const candidate = locator.first();
    if (await candidate.isVisible().catch(() => false)) return candidate;
  }
  return null;
}

console.log(`[sync-draft] Day ${padded}: opening iT 邦幫忙...`);
await page.goto('https://ithelp.ithome.com.tw/', { waitUntil: 'domcontentloaded' });
if (page.url().includes('login')) await fail('saved session is not logged in');

const ironPost = page.getByText('鐵人發文', { exact: true }).first();
if (!(await ironPost.isVisible().catch(() => false))) {
  await fail('cannot find 「鐵人發文」 on the logged-in page');
}
await ironPost.click();
await page.waitForLoadState('domcontentloaded').catch(() => {});

const seriesText = 'AI 都會寫程式了，我還要學什麼？';
const seriesCandidate = page.getByText(seriesText, { exact: false }).first();
if (await seriesCandidate.isVisible().catch(() => false)) {
  console.log('[sync-draft] Selecting the expected ironman series...');
  await seriesCandidate.click();
  await page.waitForLoadState('domcontentloaded').catch(() => {});
}

const titleInput = await visibleFirst([
  page.locator('input[name="title"]'),
  page.locator('input[placeholder*="標題"]'),
  page.locator('textarea[placeholder*="標題"]'),
]);
if (!titleInput) await fail('could not locate the article title field');

const bodyTextarea = await visibleFirst([
  page.locator('textarea[name="content"]'),
  page.locator('textarea[name="body"]'),
  page.locator('textarea[placeholder*="內容"]'),
  page.locator('textarea[placeholder*="文章"]'),
]);

console.log(`[sync-draft] Filling title: ${payload.title}`);
await titleInput.fill(payload.title);

if (bodyTextarea) {
  console.log('[sync-draft] Filling Markdown body via textarea...');
  await bodyTextarea.fill(payload.body);
} else {
  const codeMirror = page.locator('.CodeMirror').first();
  const contentEditable = page.locator('[contenteditable="true"]').first();
  if (await codeMirror.isVisible().catch(() => false)) {
    console.log('[sync-draft] Filling Markdown body via CodeMirror...');
    await codeMirror.click();
    await page.keyboard.press(process.platform === 'darwin' ? 'Meta+A' : 'Control+A');
    await page.keyboard.insertText(payload.body);
  } else if (await contentEditable.isVisible().catch(() => false)) {
    console.log('[sync-draft] Filling Markdown body via contenteditable editor...');
    await contentEditable.click();
    await page.keyboard.press(process.platform === 'darwin' ? 'Meta+A' : 'Control+A');
    await page.keyboard.insertText(payload.body);
  } else {
    await fail('could not locate a writable article body editor');
  }
}

const currentTitle = await titleInput.inputValue().catch(() => '');
if (currentTitle !== payload.title) {
  await fail(`title verification failed; got ${JSON.stringify(currentTitle)}`);
}

const pageText = await page.locator('body').innerText().catch(() => '');
if (!pageText.includes(payload.syncLine) && bodyTextarea) {
  const bodyValue = await bodyTextarea.inputValue().catch(() => '');
  if (!bodyValue.includes(payload.syncLine)) {
    await fail('body verification failed: canonical sync line is missing');
  }
}

await page.screenshot({ path: `.playwright/sync-draft-day-${padded}-before-save.png`, fullPage: true });

const saveDraft = page.getByText('儲存草稿', { exact: true }).first();
if (!(await saveDraft.isVisible().catch(() => false))) {
  await fail('could not locate 「儲存草稿」; nothing was submitted');
}

console.log('[sync-draft] Title/body verified. Saving as draft once...');
await saveDraft.click();
await page.waitForLoadState('domcontentloaded').catch(() => {});
await page.waitForTimeout(1200);

await page.screenshot({ path: screenshotPath, fullPage: true });
console.log(`[sync-draft] DONE: Day ${padded} was submitted only as a draft.`);
console.log('[sync-draft] No 「發表文章」 action was performed.');
console.log(`[sync-draft] Screenshot: ${screenshotPath}`);

await browser.close();
