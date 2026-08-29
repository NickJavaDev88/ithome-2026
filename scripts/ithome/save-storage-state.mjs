import fs from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { chromium } from 'playwright';

const outputPath = path.resolve(
  process.env.ITHOME_STORAGE_STATE || '.playwright/ithome-storage-state.json',
);

await fs.mkdir(path.dirname(outputPath), { recursive: true });

const browser = await chromium.launch({ headless: false });
const context = await browser.newContext();
const page = await context.newPage();

console.log('A browser window has opened. Sign in to iThome manually.');
console.log('After you can see the logged-in iT 邦幫忙 home page, return here and press Enter.');

await page.goto('https://ithelp.ithome.com.tw/', { waitUntil: 'domcontentloaded' });

await new Promise((resolve) => {
  process.stdin.resume();
  process.stdin.once('data', resolve);
});

await context.storageState({ path: outputPath });
console.log(`Saved browser state to ${outputPath}`);
console.log('Treat this file like a password. It is ignored by Git and must not be shared.');

await browser.close();
