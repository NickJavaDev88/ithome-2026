#!/usr/bin/env node

import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createInterface } from 'node:readline/promises';
import { CONFIG_PATH, saveProjectConfig, validateProjectConfig } from './config.mjs';

const REQUIRED = ['account', 'series-title', 'contest-tag', 'contest', 'day1-date', 'github-owner', 'github-repo'];

function validDate(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value ?? '')) return false;
  const date = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(date.valueOf()) && date.toISOString().slice(0, 10) === value;
}

function addDays(date, offset) {
  const value = new Date(`${date}T00:00:00.000Z`);
  value.setUTCDate(value.getUTCDate() + offset);
  return value.toISOString().slice(0, 10);
}

export function buildProjectConfig(input) {
  for (const key of ['account', 'seriesTitle', 'contestTag', 'contest', 'githubOwner', 'githubRepo']) {
    if (typeof input?.[key] !== 'string' || !input[key].trim()) throw new Error(`${key} is required`);
  }
  if (!validDate(input.day1Date)) throw new Error('day1Date must be an explicit YYYY-MM-DD date');
  if (!/^[A-Za-z0-9_.-]+$/.test(input.githubOwner) || !/^[A-Za-z0-9_.-]+$/.test(input.githubRepo)) {
    throw new Error('GitHub owner and repo may contain only letters, numbers, dot, underscore, and hyphen');
  }
  const site = `https://${input.githubOwner}.github.io`;
  const base = input.githubRepo === `${input.githubOwner}.github.io` ? '' : `/${input.githubRepo}`;
  const config = {
    schemaVersion: 1,
    initialized: true,
    account: input.account.trim(),
    seriesTitle: input.seriesTitle.trim(),
    contestTag: input.contestTag.trim(),
    contest: input.contest.trim(),
    repository: `${input.githubOwner}/${input.githubRepo}`,
    seriesKey: input.githubRepo,
    day1Date: input.day1Date,
    schedule: Array.from({ length: 30 }, (_, index) => ({ day: index + 1, date: addDays(input.day1Date, index) })),
    githubPages: { site, base, publicUrl: `${site}${base}` },
  };
  const errors = validateProjectConfig(config, { requireInitialized: true });
  if (errors.length) throw new Error(`Generated invalid config: ${errors.join(', ')}`);
  return config;
}

export async function writeProjectConfig(target, config) {
  await saveProjectConfig(target, config);
}

export function parseSetupArgs(argv) {
  const values = {};
  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    if (!token.startsWith('--')) throw new Error(`Unknown argument: ${token}`);
    const key = token.slice(2);
    if (!REQUIRED.includes(key)) throw new Error(`Unknown argument: ${token}`);
    const value = argv[++index];
    if (!value || value.startsWith('--')) throw new Error(`Missing value for ${token}`);
    values[key] = value;
  }
  for (const key of REQUIRED) if (!values[key]) throw new Error(`--${key} is required`);
  return {
    account: values.account,
    seriesTitle: values['series-title'],
    contestTag: values['contest-tag'],
    contest: values.contest,
    day1Date: values['day1-date'],
    githubOwner: values['github-owner'],
    githubRepo: values['github-repo'],
  };
}

async function askRequired(ask, prompt) {
  const value = (await ask(prompt)).trim();
  if (!value) throw new Error(`${prompt}不可留白`);
  return value;
}

export async function runInteractiveSetup({ ask, output, write = (config) => writeProjectConfig(CONFIG_PATH, config) }) {
  if (![ask, output, write].every((value) => typeof value === 'function')) {
    throw new Error('interactive setup requires ask, output, and write functions');
  }
  output('iThome 鐵人賽模板初始化');
  output('以下只會詢問可公開、可提交的設定；請勿輸入密碼、cookie、token 或登入 session。');
  const input = {
    account: await askRequired(ask, '公開 iThome 帳號：'),
    seriesTitle: await askRequired(ask, '完整系列名稱：'),
    contestTag: await askRequired(ask, 'iThome 畫面顯示的 contest tag：'),
    contest: await askRequired(ask, '穩定的 contest 識別：'),
    day1Date: await askRequired(ask, 'Day 1 日期（YYYY-MM-DD）：'),
    githubOwner: await askRequired(ask, 'GitHub owner：'),
    githubRepo: await askRequired(ask, 'GitHub repo 名稱：'),
  };
  const config = buildProjectConfig(input);
  output('');
  output('請確認即將寫入的公開設定：');
  output(`iThome 帳號：${config.account}`);
  output(`系列名稱：${config.seriesTitle}`);
  output(`contest tag：${config.contestTag}`);
  output(`GitHub Pages：${config.githubPages.publicUrl}`);
  output('Day 1～30 日期：');
  for (const item of config.schedule) output(`Day ${item.day}：${item.date}`);
  const confirmed = (await ask('以上資料正確並寫入 ithome.config.json？（yes／no）：')).trim().toLowerCase();
  if (!['yes', 'y'].includes(confirmed)) {
    output('已取消，沒有修改設定檔。');
    return { status: 'cancelled' };
  }
  await write(config);
  output('初始化完成。請執行 pnpm test:ithome、pnpm build，再檢查 ithome.config.json。');
  return { status: 'configured', config };
}

async function main() {
  const argv = process.argv.slice(2);
  if (argv.length === 0) {
    if (!process.stdin.isTTY || !process.stdout.isTTY) {
      throw new Error('Interactive setup requires a terminal. For an Agent or automation, pass all documented --arguments.');
    }
    const terminal = createInterface({ input: process.stdin, output: process.stdout });
    try {
      await runInteractiveSetup({
        ask: (prompt) => terminal.question(prompt),
        output: (line) => process.stdout.write(`${line}\n`),
      });
    } finally {
      terminal.close();
    }
    return;
  }
  const config = buildProjectConfig(parseSetupArgs(argv));
  await writeProjectConfig(CONFIG_PATH, config);
  process.stdout.write(`${JSON.stringify({ status: 'configured', path: resolve(CONFIG_PATH), publicUrl: config.githubPages.publicUrl, day1Date: config.day1Date, day30Date: config.schedule[29].date }, null, 2)}\n`);
}

if (resolve(process.argv[1] ?? '') === fileURLToPath(import.meta.url)) {
  main().catch((error) => { process.stderr.write(`[ithome:setup] ${error.message}\n`); process.exitCode = 1; });
}
