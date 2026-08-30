import { describe, expect, test } from 'vitest';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { prepareIthomePayload } from './prepare.mjs';

describe('iThome payload contract', () => {
  test.each([1, 2, 3, 4, 5])('Day %i has the exact source, URL, and Markdown sync line', async (day) => {
    const payload = await prepareIthomePayload(day);
    const dayString = String(day).padStart(2, '0');
    const canonicalUrl = `https://gcake119.github.io/ithome-2026/day/${dayString}/`;
    const expected = `本文同步刊載於[個人連載網站](${canonicalUrl})`;

    expect(payload).toMatchObject({
      day,
      dayString,
      sourcePath: `src/content/posts/day-${dayString}.md`,
      canonicalUrl,
      syncLine: expected,
    });
    expect(payload.title.trim()).not.toBe('');
    expect(payload.body.split(/\r?\n/, 1)[0]).toBe(expected);
    expect(payload.body).not.toContain(`本文同步刊載於個人連載網站：${canonicalUrl}`);
  });

  test('a Day without a source Markdown file fails closed', async () => {
    await expect(prepareIthomePayload(6)).rejects.toMatchObject({ code: 'ENOENT' });
  });

  test('resolves the repository source independently from the caller working directory', async () => {
    const originalCwd = process.cwd();
    process.chdir(mkdtempSync(join(tmpdir(), 'ithome-cwd-')));
    try {
      await expect(prepareIthomePayload(1)).resolves.toMatchObject({ sourcePath: 'src/content/posts/day-01.md' });
    } finally {
      process.chdir(originalCwd);
    }
  });
});
