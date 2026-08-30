import { mkdtemp, readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, test } from 'vitest';

import { buildProjectConfig, runInteractiveSetup, writeProjectConfig } from './setup.mjs';
import { validateProjectConfig } from './config.mjs';

describe('iThome template setup', () => {
  test('creates an explicit 30-day calendar and GitHub Pages URL', () => {
    const config = buildProjectConfig({
      account: 'example-user',
      seriesTitle: '我的 30 天系列',
      contestTag: '18th鐵人賽',
      contest: '18th-ironman-2026',
      day1Date: '2026-09-01',
      githubOwner: 'example-user',
      githubRepo: 'my-ironman',
    });

    expect(config.githubPages).toEqual({
      site: 'https://example-user.github.io',
      base: '/my-ironman',
      publicUrl: 'https://example-user.github.io/my-ironman',
    });
    expect(config.schedule).toHaveLength(30);
    expect(config.schedule[0]).toEqual({ day: 1, date: '2026-09-01' });
    expect(config.schedule[29]).toEqual({ day: 30, date: '2026-09-30' });
  });

  test('rejects ambiguous dates instead of guessing', () => {
    expect(() => buildProjectConfig({
      account: 'example-user', seriesTitle: '系列', contestTag: '18th鐵人賽',
      contest: '18th-ironman-2026', day1Date: '開賽日', githubOwner: 'example-user', githubRepo: 'repo',
    })).toThrow(/YYYY-MM-DD/);
  });

  test('is rerunnable and writes no credentials', async () => {
    const root = await mkdtemp(join(tmpdir(), 'ithome-setup-'));
    const target = join(root, 'ithome.config.json');
    const input = {
      account: 'example-user', seriesTitle: '系列', contestTag: '18th鐵人賽',
      contest: '18th-ironman-2026', day1Date: '2026-09-01', githubOwner: 'example-user', githubRepo: 'repo',
    };
    await writeProjectConfig(target, buildProjectConfig(input));
    await writeProjectConfig(target, buildProjectConfig(input));
    const text = await readFile(target, 'utf8');
    expect(JSON.parse(text).account).toBe('example-user');
    expect(text).not.toMatch(/cookie|password|token|session/i);
  });

  test('rejects a tampered or incomplete date mapping', () => {
    const config = buildProjectConfig({
      account: 'example-user', seriesTitle: '系列', contestTag: '18th鐵人賽',
      contest: '18th-ironman-2026', day1Date: '2026-09-01', githubOwner: 'example-user', githubRepo: 'repo',
    });
    config.schedule[12].date = '2026-12-31';
    expect(validateProjectConfig(config, { requireInitialized: true })).toContain('schedule');
  });

  test('interactive mode asks every public field, previews dates, and writes only after confirmation', async () => {
    const answers = [
      'example-user', '我的 30 天系列', '18th鐵人賽', '18th-ironman-2026',
      '2026-09-01', 'example-user', 'my-ironman', 'yes',
    ];
    const prompts = [];
    const output = [];
    const written = [];
    const result = await runInteractiveSetup({
      ask: async (prompt) => { prompts.push(prompt); return answers.shift(); },
      output: (line) => output.push(line),
      write: async (config) => written.push(config),
    });

    expect(prompts).toHaveLength(8);
    expect(output.join('\n')).toContain('Day 1：2026-09-01');
    expect(output.join('\n')).toContain('Day 30：2026-09-30');
    expect(output.join('\n')).toContain('https://example-user.github.io/my-ironman');
    expect(written).toHaveLength(1);
    expect(result.status).toBe('configured');
  });

  test('interactive mode does not write when final confirmation is declined', async () => {
    const answers = ['a', '系列', 'tag', 'contest', '2026-09-01', 'owner', 'repo', 'no'];
    const write = async () => { throw new Error('must not write'); };
    const result = await runInteractiveSetup({ ask: async () => answers.shift(), output: () => {}, write });
    expect(result).toEqual({ status: 'cancelled' });
  });
});
