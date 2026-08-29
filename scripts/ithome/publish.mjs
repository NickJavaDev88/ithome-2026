import fs from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { chromium } from 'playwright';
import { prepareIthomePayload } from './prepare.mjs';

const DEFAULT_STORAGE_STATE = path.resolve('.playwright/ithome-storage-state.json');
const ITHOME_HOME = 'https://ithelp.ithome.com.tw/';

function parseArgs(argv) {
  let day = null;
  for (let i = 0; i < argv.length; i += 1) {
    if (argv[i] === '--day') day = Number(argv[++i]);
  }
  if (!Number.isInteger(day) || day < 1 || day > 30) {
    throw new Error('Use --day with an integer from 1 to 30.');
  }
  return { day };
}

async function assertReadable(filePath) {
  try {
    await fs.access(filePath);
  } catch {
    throw new Error(
      `iThome browser state not found: ${filePath}. Create it locally after signing in; never commit it.`,
    );
  }
}

async function main() {
  const { day } = parseArgs(process.argv.slice(2));
  const payload = await prepareIthomePayload(day);
  const storageState = path.resolve(process.env.ITHOME_STORAGE_STATE || DEFAULT_STORAGE_STATE);
  await assertReadable(storageState);

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ storageState });
  const page = await context.newPage();

  try {
    await page.goto(ITHOME_HOME, { waitUntil: 'domcontentloaded' });

    const pageText = await page.locator('body').innerText();
    const appearsLoggedIn = pageText.includes('鐵人發文') || pageText.includes('gcake119');
    if (!appearsLoggedIn) {
      throw new Error('The saved iThome session does not appear to be logged in. Aborting before any write action.');
    }

    console.log(`[ithome:publish] Session looks valid for Day ${payload.dayString}.`);
    console.log(`[ithome:publish] Title: ${payload.title}`);
    console.log(`[ithome:publish] Canonical: ${payload.canonicalUrl}`);
    console.log('[ithome:publish] SAFE MODE: final draft lookup/edit/publish actions are intentionally disabled.');
    console.log('[ithome:publish] Next step is to verify the real draft-list/editor selectors with the account before enabling writes.');
  } finally {
    await browser.close();
  }
}

main().catch((error) => {
  console.error(`[ithome:publish] ${error.message}`);
  process.exitCode = 1;
});
