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
const draftMapPath = path.resolve('.playwright/ithome-drafts.json');
const padded = payload.dayString;
const screenshotPath = `.playwright/sync-draft-day-${padded}.png`;
const diagnosticsPath = `.playwright/sync-draft-day-${padded}-diagnostics.json`;

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
page.setDefaultTimeout(10000);

async function collectDiagnostics() {
  const controls = await page.locator('input, textarea, [contenteditable="true"], iframe, button, a').evaluateAll((elements) =>
    elements.map((el, index) => ({
      index,
      tag: el.tagName.toLowerCase(),
      type: el.getAttribute('type'),
      name: el.getAttribute('name'),
      id: el.id || null,
      href: el.getAttribute('href'),
      placeholder: el.getAttribute('placeholder'),
      ariaLabel: el.getAttribute('aria-label'),
      role: el.getAttribute('role'),
      className: typeof el.className === 'string' ? el.className : null,
      contenteditable: el.getAttribute('contenteditable'),
      visible: Boolean(el.offsetWidth || el.offsetHeight || el.getClientRects().length),
      valuePreview: 'value' in el ? String(el.value ?? '').slice(0, 120) : null,
      textPreview: String(el.textContent ?? '').trim().replace(/\s+/g, ' ').slice(0, 180),
    })),
  ).catch(() => []);

  const diagnostics = {
    url: page.url(),
    title: await page.title().catch(() => ''),
    dialogs: await page.locator('[role="dialog"], .modal, [class*="modal" i]').evaluateAll((els) =>
      els.map((el) => ({
        visible: Boolean(el.offsetWidth || el.offsetHeight || el.getClientRects().length),
        textPreview: String(el.textContent ?? '').trim().replace(/\s+/g, ' ').slice(0, 500),
      })),
    ).catch(() => []),
    controls,
  };
  await fs.mkdir(path.dirname(diagnosticsPath), { recursive: true });
  await fs.writeFile(diagnosticsPath, `${JSON.stringify(diagnostics, null, 2)}\n`, 'utf8');
  return diagnostics;
}

const fail = async (message) => {
  console.error(`DRAFT SYNC FAILED: ${message}`);
  console.error(`[sync-draft] Current URL: ${page.url()}`);
  const diagnostics = await collectDiagnostics();
  const visibleControls = diagnostics.controls.filter((control) => control.visible);
  if (visibleControls.length) {
    console.error('[sync-draft] Visible controls:');
    for (const control of visibleControls.slice(0, 30)) console.error(`  ${JSON.stringify(control)}`);
  } else {
    console.error('[sync-draft] No visible controls detected.');
  }
  if (diagnostics.dialogs.length) console.error(`[sync-draft] Dialogs: ${JSON.stringify(diagnostics.dialogs)}`);
  console.error(`[sync-draft] Diagnostics: ${diagnosticsPath}`);
  await page.screenshot({ path: screenshotPath, fullPage: true }).catch(() => {});
  console.error(`[sync-draft] Screenshot: ${screenshotPath}`);
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

async function saveDraftUrl(url) {
  let map = {};
  try {
    map = JSON.parse(await fs.readFile(draftMapPath, 'utf8'));
  } catch {}
  map[padded] = {
    day,
    title: payload.title,
    draftUrl: url,
    savedAt: new Date().toISOString(),
  };
  await fs.mkdir(path.dirname(draftMapPath), { recursive: true });
  await fs.writeFile(draftMapPath, `${JSON.stringify(map, null, 2)}\n`, 'utf8');
}

async function gotoResilient(url, label) {
  try {
    await page.goto(url, { waitUntil: 'commit', timeout: 15000 });
  } catch (error) {
    console.warn(`[sync-draft] ${label} navigation timed out after request commit; continuing with current page: ${page.url()}`);
  }
  await page.waitForTimeout(600);
}

console.log(`[sync-draft] Day ${padded}: opening iT 邦幫忙...`);
await gotoResilient('https://ithelp.ithome.com.tw/', 'home');
if (page.url().includes('login')) await fail('saved session is not logged in');

const ironPost = page.getByText('鐵人發文', { exact: true }).first();
if (!(await ironPost.isVisible().catch(() => false))) await fail('cannot find 「鐵人發文」 on the logged-in page');

console.log('[sync-draft] Clicking 「鐵人發文」 to open the series chooser...');
await ironPost.click({ noWaitAfter: true });
await page.waitForTimeout(700);

const chooserText = page.getByText(/選擇.*鐵人.*主題|選擇.*發文/i).first();
if (await chooserText.isVisible().catch(() => false)) console.log('[sync-draft] Series chooser is visible.');
else console.log('[sync-draft] No chooser heading detected; looking for the series directly.');

const seriesText = 'AI 都會寫程式了，我還要學什麼？';
const seriesCandidate = page.getByText(seriesText, { exact: false }).first();
if (!(await seriesCandidate.isVisible().catch(() => false))) await fail('could not find the expected ironman series in the chooser');

console.log('[sync-draft] Selecting the expected ironman series...');
await seriesCandidate.click({ noWaitAfter: true });

// iThome can complete the click but keep Playwright waiting on slow navigation.
// Judge success from the editor URL or editor controls instead of a full page-load event.
let editorReady = false;
for (let attempt = 0; attempt < 20; attempt += 1) {
  if (/\/articles\/\d+\/draft(?:$|[?#])/.test(page.url())) {
    editorReady = true;
    break;
  }
  const visibleTitle = await visibleFirst([
    page.locator('input[name="title"]'),
    page.locator('input[name*="title" i]'),
    page.locator('input[id*="title" i]'),
    page.locator('input[placeholder*="標題"]'),
  ]);
  if (visibleTitle) {
    editorReady = true;
    break;
  }
  await page.waitForTimeout(250);
}
if (!editorReady) await fail('series selection did not reach an iThome draft editor');
console.log(`[sync-draft] Editor URL: ${page.url()}`);

const titleInput = await visibleFirst([
  page.locator('input[name="title"]'),
  page.locator('input[name*="title" i]'),
  page.locator('input[id*="title" i]'),
  page.locator('input[placeholder*="標題"]'),
  page.locator('textarea[placeholder*="標題"]'),
  page.getByLabel(/標題/).locator('input'),
  page.locator('label').filter({ hasText: /標題/ }).locator('input'),
]);
if (!titleInput) await fail('could not locate the article title field after selecting the series');

const bodyTextarea = await visibleFirst([
  page.locator('textarea[name="content"]'),
  page.locator('textarea[name="body"]'),
  page.locator('textarea[name*="content" i]'),
  page.locator('textarea[id*="content" i]'),
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
if (currentTitle !== payload.title) await fail(`title verification failed; got ${JSON.stringify(currentTitle)}`);

if (bodyTextarea) {
  const bodyValue = await bodyTextarea.inputValue().catch(() => '');
  if (!bodyValue.includes(payload.syncLine)) await fail('body verification failed: canonical sync line is missing');
}

await page.screenshot({ path: `.playwright/sync-draft-day-${padded}-before-save.png`, fullPage: true });

const saveDraft = page.getByText('儲存草稿', { exact: true }).first();
if (!(await saveDraft.isVisible().catch(() => false))) await fail('could not locate 「儲存草稿」; nothing was submitted');

console.log('[sync-draft] Title/body verified. Saving as draft once...');
await saveDraft.click({ noWaitAfter: true });

let draftUrl = page.url();
for (let attempt = 0; attempt < 20; attempt += 1) {
  draftUrl = page.url();
  if (/\/articles\/\d+\/draft(?:$|[?#])/.test(draftUrl)) break;
  await page.waitForTimeout(250);
}
if (!/\/articles\/\d+\/draft(?:$|[?#])/.test(draftUrl)) {
  await fail(`draft save completed but current URL does not look like an iThome draft URL: ${draftUrl}`);
}
await saveDraftUrl(draftUrl);

await page.screenshot({ path: screenshotPath, fullPage: true });
console.log(`[sync-draft] DONE: Day ${padded} was submitted only as a draft.`);
console.log(`[sync-draft] Draft URL: ${draftUrl}`);
console.log(`[sync-draft] Local draft map: ${draftMapPath}`);
console.log('[sync-draft] No 「發表文章」 action was performed.');
console.log(`[sync-draft] Screenshot: ${screenshotPath}`);

await browser.close();
