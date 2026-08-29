import fs from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { chromium } from 'playwright';

const args = process.argv.slice(2);
const dayIndex = args.indexOf('--day');
const day = dayIndex >= 0 ? Number(args[dayIndex + 1]) : NaN;
if (!Number.isInteger(day) || day < 1 || day > 30) {
  console.error('Usage: pnpm ithome:safe-check -- --day N');
  process.exit(2);
}

const padded = String(day).padStart(2, '0');
const expectedPrefix = `Day ${day}`;
const storageStatePath = path.resolve('.playwright/ithome-storage-state.json');
const draftMapPath = path.resolve('.playwright/ithome-drafts.json');

for (const required of [storageStatePath, draftMapPath]) {
  try {
    await fs.access(required);
  } catch {
    console.error(`Missing local iThome state: ${required}`);
    console.error('Run: pnpm ithome:save-auth and pnpm ithome:sync-draft -- --day N');
    process.exit(3);
  }
}

const draftMap = JSON.parse(await fs.readFile(draftMapPath, 'utf8'));
const draftEntry = draftMap[padded];
if (!draftEntry?.draftUrl) {
  console.error(`No saved draft URL for Day ${padded}. Run: pnpm ithome:sync-draft -- --day ${day}`);
  process.exit(4);
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

console.log(`[safe-check] Day ${padded}: opening saved draft directly...`);
console.log(`[safe-check] Draft URL: ${draftEntry.draftUrl}`);
await page.goto(draftEntry.draftUrl, { waitUntil: 'domcontentloaded' });
if (page.url().includes('login')) await fail('saved session is not logged in');

const titleInputs = [
  page.locator('input[name="title"]'),
  page.locator('input[name*="title" i]'),
  page.locator('input[id*="title" i]'),
  page.locator('input[placeholder*="標題"]'),
  page.locator('textarea[placeholder*="標題"]'),
];

let title = '';
for (const locator of titleInputs) {
  if (await locator.first().isVisible().catch(() => false)) {
    title = (await locator.first().inputValue().catch(() => '')) || '';
    if (title) break;
  }
}

if (!title) title = (await page.locator('h1, h2, [contenteditable="true"]').first().textContent().catch(() => '')) || '';

if (!title.includes(expectedPrefix) && !title.match(new RegExp(`Day\\s*0?${day}\\b`, 'i'))) {
  await fail(`opened draft does not look like Day ${day}; detected title: ${JSON.stringify(title)}`);
}

const publishText = page.getByText('發表文章', { exact: true }).first();
if (!(await publishText.isVisible().catch(() => false))) {
  const draftButton = page.getByText('儲存草稿', { exact: true }).first();
  if (await draftButton.isVisible().catch(() => false)) {
    const nearbyToggle = draftButton.locator('xpath=following-sibling::*[1]');
    if (await nearbyToggle.isVisible().catch(() => false)) await nearbyToggle.click();
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
