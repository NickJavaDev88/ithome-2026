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
const padded = payload.dayString;
const storageStatePath = path.resolve('.playwright/ithome-storage-state.json');
const draftMapPath = path.resolve('.playwright/ithome-drafts.json');
const screenshotPath = `.playwright/sync-draft-day-${padded}.png`;
const diagnosticsPath = `.playwright/sync-draft-day-${padded}-diagnostics.json`;

try {
  await fs.access(storageStatePath);
} catch {
  console.error(`Missing iThome browser session: ${storageStatePath}`);
  process.exit(3);
}

const browser = await chromium.launch({ headless: false });
const context = await browser.newContext({ storageState: storageStatePath });
const page = await context.newPage();
page.setDefaultTimeout(10000);

async function pageLooksLikeCloudflare() {
  const text = (await page.locator('body').innerText().catch(() => '')).slice(0, 4000);
  return /cloudflare|ray id|checking your browser|just a moment|web server is down|bad gateway|gateway time-out|error 5\d\d/i.test(text);
}

async function collectDiagnostics() {
  const controls = await page.locator('input, textarea, [contenteditable="true"], iframe, .CodeMirror, .cm-editor, .cm-content').evaluateAll((els) =>
    els.map((el) => ({
      tag: el.tagName.toLowerCase(),
      name: el.getAttribute('name'),
      id: el.id || null,
      className: typeof el.className === 'string' ? el.className : null,
      placeholder: el.getAttribute('placeholder'),
      contenteditable: el.getAttribute('contenteditable'),
      visible: Boolean(el.offsetWidth || el.offsetHeight || el.getClientRects().length),
      textPreview: String(el.textContent ?? '').trim().replace(/\s+/g, ' ').slice(0, 160),
    })),
  ).catch(() => []);
  const data = { url: page.url(), title: await page.title().catch(() => ''), controls };
  await fs.mkdir(path.dirname(diagnosticsPath), { recursive: true });
  await fs.writeFile(diagnosticsPath, `${JSON.stringify(data, null, 2)}\n`, 'utf8');
  return data;
}

async function fail(message) {
  console.error(`DRAFT SYNC FAILED: ${message}`);
  console.error(`[sync-draft] Current URL: ${page.url()}`);
  const diagnostics = await collectDiagnostics();
  for (const control of diagnostics.controls.filter((item) => item.visible)) {
    console.error(`[sync-draft] visible editor control: ${JSON.stringify(control)}`);
  }
  console.error(`[sync-draft] Diagnostics: ${diagnosticsPath}`);
  await page.screenshot({ path: screenshotPath, fullPage: true }).catch(() => {});
  await browser.close();
  process.exit(1);
}

async function openHome() {
  for (let attempt = 1; attempt <= 2; attempt += 1) {
    try {
      console.log(`[sync-draft] Opening iT 邦幫忙 (attempt ${attempt}/2)...`);
      await page.goto('https://ithelp.ithome.com.tw/', { waitUntil: 'domcontentloaded', timeout: 30000 });
    } catch (error) {
      console.warn(`[sync-draft] Home navigation timed out: ${error.message}`);
    }
    if (page.url().startsWith('https://ithelp.ithome.com.tw/') && !(await pageLooksLikeCloudflare())) return;
    if (await pageLooksLikeCloudflare()) {
      await fail('Cloudflare/iThome error page detected; stop and retry later');
    }
    if (attempt < 2) await page.waitForTimeout(1200);
  }
  await fail('could not load the iThome home page');
}

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
  map[padded] = { day, title: payload.title, draftUrl: url, savedAt: new Date().toISOString() };
  await fs.mkdir(path.dirname(draftMapPath), { recursive: true });
  await fs.writeFile(draftMapPath, `${JSON.stringify(map, null, 2)}\n`, 'utf8');
}

async function fillKeyboardEditor(locator, label) {
  console.log(`[sync-draft] Filling Markdown body via ${label}...`);
  await locator.click();
  await page.keyboard.press(process.platform === 'darwin' ? 'Meta+A' : 'Control+A');
  await page.keyboard.insertText(payload.body);
}

async function fillIframeEditor() {
  const frames = page.frames().filter((frame) => frame !== page.mainFrame());
  for (const frame of frames) {
    const textarea = await visibleFirst([
      frame.locator('textarea'),
      frame.locator('[contenteditable="true"]'),
      frame.locator('body[contenteditable="true"]'),
    ]);
    if (!textarea) continue;
    console.log('[sync-draft] Filling Markdown body via iframe editor...');
    if ((await textarea.evaluate((el) => el.tagName.toLowerCase()).catch(() => '')) === 'textarea') {
      await textarea.fill(payload.body);
    } else {
      await textarea.click();
      await page.keyboard.press(process.platform === 'darwin' ? 'Meta+A' : 'Control+A');
      await page.keyboard.insertText(payload.body);
    }
    return true;
  }
  return false;
}

await openHome();
if (page.url().includes('login')) await fail('saved session is not logged in');

const ironPost = page.getByText('鐵人發文', { exact: true }).first();
if (!(await ironPost.isVisible().catch(() => false))) await fail('cannot find 「鐵人發文」');

console.log('[sync-draft] Opening the ironman series chooser...');
await ironPost.click({ noWaitAfter: true });
await page.waitForTimeout(700);

const series = page.getByText('AI 都會寫程式了，我還要學什麼？', { exact: false }).first();
if (!(await series.isVisible().catch(() => false))) await fail('could not find the expected ironman series');

console.log('[sync-draft] Selecting the expected ironman series...');
await series.click({ noWaitAfter: true, timeout: 10000 });

let editorReady = false;
for (let attempt = 0; attempt < 40; attempt += 1) {
  if (await pageLooksLikeCloudflare()) await fail('Cloudflare/iThome error page detected after series selection');
  if (/\/articles\/\d+\/draft(?:$|[?#])/.test(page.url())) {
    editorReady = true;
    break;
  }
  const title = await visibleFirst([
    page.locator('input[name="title"]'),
    page.locator('input[name*="title" i]'),
    page.locator('input[placeholder*="標題"]'),
  ]);
  if (title) {
    editorReady = true;
    break;
  }
  await page.waitForTimeout(250);
}
if (!editorReady) await fail('series selection did not reach a draft editor');
console.log(`[sync-draft] Editor URL: ${page.url()}`);

const titleInput = await visibleFirst([
  page.locator('input[name="title"]'),
  page.locator('input[name*="title" i]'),
  page.locator('input[id*="title" i]'),
  page.locator('input[placeholder*="標題"]'),
]);
if (!titleInput) await fail('could not locate the article title field');

console.log(`[sync-draft] Filling title: ${payload.title}`);
await titleInput.fill(payload.title);

const bodyTextarea = await visibleFirst([
  page.locator('textarea[name="content"]'),
  page.locator('textarea[name="body"]'),
  page.locator('textarea[name*="content" i]'),
  page.locator('textarea[id*="content" i]'),
  page.locator('textarea[placeholder*="內容"]'),
  page.locator('textarea[placeholder*="文章"]'),
]);

let bodyFilled = false;
if (bodyTextarea) {
  console.log('[sync-draft] Filling Markdown body via textarea...');
  await bodyTextarea.fill(payload.body);
  bodyFilled = true;
}

if (!bodyFilled) {
  const cm5 = page.locator('.CodeMirror').first();
  if (await cm5.isVisible().catch(() => false)) {
    await fillKeyboardEditor(cm5, 'CodeMirror 5');
    bodyFilled = true;
  }
}

if (!bodyFilled) {
  const cm6 = await visibleFirst([
    page.locator('.cm-editor .cm-content'),
    page.locator('.cm-content[contenteditable="true"]'),
    page.locator('.cm-editor'),
  ]);
  if (cm6) {
    await fillKeyboardEditor(cm6, 'CodeMirror 6');
    bodyFilled = true;
  }
}

if (!bodyFilled) {
  const contentEditable = await visibleFirst([
    page.locator('[contenteditable="true"][role="textbox"]'),
    page.locator('[contenteditable="true"]'),
  ]);
  if (contentEditable) {
    await fillKeyboardEditor(contentEditable, 'contenteditable editor');
    bodyFilled = true;
  }
}

if (!bodyFilled) bodyFilled = await fillIframeEditor();
if (!bodyFilled) await fail('could not locate the article body editor');

if ((await titleInput.inputValue().catch(() => '')) !== payload.title) await fail('title verification failed');

await page.screenshot({ path: `.playwright/sync-draft-day-${padded}-before-save.png`, fullPage: true });

const saveDraft = page.getByText('儲存草稿', { exact: true }).first();
if (!(await saveDraft.isVisible().catch(() => false))) await fail('could not locate 「儲存草稿」');

console.log('[sync-draft] Saving as draft once...');
await saveDraft.click({ noWaitAfter: true });

let draftUrl = page.url();
for (let attempt = 0; attempt < 40; attempt += 1) {
  draftUrl = page.url();
  if (/\/articles\/\d+\/draft(?:$|[?#])/.test(draftUrl)) break;
  await page.waitForTimeout(250);
}
if (!/\/articles\/\d+\/draft(?:$|[?#])/.test(draftUrl)) await fail(`could not confirm draft URL after save: ${draftUrl}`);

await saveDraftUrl(draftUrl);
await page.screenshot({ path: screenshotPath, fullPage: true });
console.log(`[sync-draft] DONE: Day ${padded} saved as draft only.`);
console.log(`[sync-draft] Draft URL: ${draftUrl}`);
console.log(`[sync-draft] Local draft map: ${draftMapPath}`);
console.log('[sync-draft] No 「發表文章」 action was performed.');
await browser.close();
