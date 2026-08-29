import fs from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { chromium } from 'playwright';

const args = process.argv.slice(2);
const dayIndex = args.indexOf('--day');
const day = dayIndex >= 0 ? Number(args[dayIndex + 1]) : NaN;
if (!Number.isInteger(day) || day < 1 || day > 30) {
  console.error('Usage: npm run ithome:safe-check -- --day N');
  process.exit(2);
}

const padded = String(day).padStart(2, '0');
const expectedPrefix = `Day ${day}`;
const storageStatePath = path.resolve('.playwright/ithome-storage-state.json');

try {
  await fs.access(storageStatePath);
} catch {
  console.error(`Missing iThome browser session: ${storageStatePath}`);
  console.error('Run: npm run ithome:save-auth');
  process.exit(3);
}

const browser = await chromium.launch({ headless: false });
const context = await browser.newContext({ storageState: storageStatePath });
const page = await context.newPage();

const fail = async (message) => {
  console.error(`SAFE CHECK FAILED: ${message}`);
  await page.screenshot({ path: `.playwright/safe-check-day-${padded}.png`, fullPage: true }).catch(() => {});
  await browser.close();
  process.exit(1);
};

console.log(`[safe-check] Day ${padded}: opening iT 邦幫忙...`);
await page.goto('https://ithelp.ithome.com.tw/', { waitUntil: 'domcontentloaded' });

if (page.url().includes('login')) {
  await fail('saved session is not logged in');
}

const ironPost = page.getByText('鐵人發文', { exact: true }).first();
if (!(await ironPost.isVisible().catch(() => false))) {
  await fail('cannot find 「鐵人發文」 on the logged-in page');
}

console.log('[safe-check] Found 「鐵人發文」.');
await ironPost.click();
await page.waitForLoadState('domcontentloaded');

const seriesText = 'AI 都會寫程式了，我還要學什麼？';
const seriesCandidate = page.getByText(seriesText, { exact: false }).first();
if (await seriesCandidate.isVisible().catch(() => false)) {
  console.log('[safe-check] Found expected ironman series selector.');
  await seriesCandidate.click();
  await page.waitForLoadState('domcontentloaded').catch(() => {});
}

console.log('[safe-check] Looking for the target draft without submitting anything...');

// iT 邦幫忙 may land on a new-post editor first. Search the current page for a
// draft link whose visible text contains the Day marker; if none exists, stop.
const targetByText = page.getByText(new RegExp(`Day\\s*0?${day}\\b`, 'i')).first();
if (await targetByText.isVisible().catch(() => false)) {
  await targetByText.click();
  await page.waitForLoadState('domcontentloaded').catch(() => {});
} else {
  await fail(`could not locate a visible Day ${day} draft link on the current iThome page`);
}

const titleInputs = [
  page.locator('input[name="title"]'),
  page.locator('input[placeholder*="標題"]'),
  page.locator('textarea[placeholder*="標題"]'),
];

let title = '';
for (const locator of titleInputs) {
  if (await locator.first().isVisible().catch(() => false)) {
    title = (await locator.first().inputValue().catch(() => '')) || (await locator.first().textContent().catch(() => '')) || '';
    if (title) break;
  }
}

if (!title) {
  // Some versions render the editable title outside an input.
  title = (await page.locator('h1, h2, [contenteditable="true"]').first().textContent().catch(() => '')) || '';
}

if (!title.includes(expectedPrefix) && !title.match(new RegExp(`Day\\s*0?${day}\\b`, 'i'))) {
  await fail(`opened page does not look like Day ${day}; detected title: ${JSON.stringify(title)}`);
}

const publishText = page.getByText('發表文章', { exact: true }).first();
if (!(await publishText.isVisible().catch(() => false))) {
  // The control may be hidden inside the dropdown next to 「儲存草稿」.
  const draftButton = page.getByText('儲存草稿', { exact: true }).first();
  if (await draftButton.isVisible().catch(() => false)) {
    const nearbyToggle = draftButton.locator('xpath=following-sibling::*[1]');
    if (await nearbyToggle.isVisible().catch(() => false)) {
      await nearbyToggle.click();
    }
  }
}

if (!(await page.getByText('發表文章', { exact: true }).first().isVisible().catch(() => false))) {
  await fail('could not confirm the 「發表文章」 control');
}

await page.screenshot({ path: `.playwright/safe-check-day-${padded}.png`, fullPage: true });
console.log(`[safe-check] PASS: Day ${padded} draft is open and 「發表文章」 is visible.`);
console.log('[safe-check] SAFE MODE: no publish click was performed.');
console.log(`[safe-check] Screenshot: .playwright/safe-check-day-${padded}.png`);

await browser.close();
