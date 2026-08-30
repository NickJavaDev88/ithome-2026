import { readFile } from 'node:fs/promises';
import { describe, expect, it } from 'vitest';

describe('GitHub Pages deployment schedule', () => {
  it('rebuilds every day at 09:15 Asia/Taipei', async () => {
    const workflow = await readFile('.github/workflows/deploy.yml', 'utf8');

    expect(workflow).toContain("cron: '15 9 * * *'");
    expect(workflow).toContain("timezone: 'Asia/Taipei'");
  });
});
