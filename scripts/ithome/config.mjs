import { writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import bundledConfig from '../../ithome.config.json' with { type: 'json' };

export const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
export const CONFIG_PATH = path.join(REPO_ROOT, 'ithome.config.json');

export function validateProjectConfig(config, { requireInitialized = false } = {}) {
  const errors = [];
  if (config?.schemaVersion !== 1) errors.push('schemaVersion');
  for (const key of ['account', 'seriesTitle', 'contestTag', 'contest', 'repository', 'seriesKey']) {
    if (typeof config?.[key] !== 'string' || !config[key].trim()) errors.push(key);
  }
  for (const key of ['site', 'base', 'publicUrl']) {
    if (typeof config?.githubPages?.[key] !== 'string' || !config.githubPages[key]) errors.push(`githubPages.${key}`);
  }
  try {
    const publicUrl = new URL(config?.githubPages?.publicUrl);
    if (publicUrl.protocol !== 'https:' || publicUrl.href.replace(/\/$/, '') !== config.githubPages.publicUrl) errors.push('githubPages.publicUrl');
    if (`${config.githubPages.site}${config.githubPages.base}` !== config.githubPages.publicUrl) errors.push('githubPages.urlInvariant');
  } catch { errors.push('githubPages.publicUrl'); }
  if (requireInitialized) {
    if (config?.initialized !== true) errors.push('initialized');
    if (!/^\d{4}-\d{2}-\d{2}$/.test(config?.day1Date ?? '')) errors.push('day1Date');
    if (!Array.isArray(config?.schedule) || config.schedule.length !== 30) errors.push('schedule');
    else {
      for (let index = 0; index < 30; index += 1) {
        const expected = new Date(`${config.day1Date}T00:00:00.000Z`);
        expected.setUTCDate(expected.getUTCDate() + index);
        if (config.schedule[index]?.day !== index + 1 || config.schedule[index]?.date !== expected.toISOString().slice(0, 10)) {
          errors.push('schedule');
          break;
        }
      }
    }
  }
  return [...new Set(errors)];
}

export function loadProjectConfigSync(options) {
  const config = structuredClone(bundledConfig);
  const errors = validateProjectConfig(config, options);
  if (errors.length) throw new Error(`Invalid ithome.config.json fields: ${errors.join(', ')}`);
  return config;
}

export async function loadProjectConfig(options) {
  return loadProjectConfigSync(options);
}

export async function saveProjectConfig(target, config) {
  await writeFile(target, `${JSON.stringify(config, null, 2)}\n`, { encoding: 'utf8', mode: 0o644 });
}
