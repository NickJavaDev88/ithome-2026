import { describe, expect, test } from 'vitest';
import { prepareIthomePayload } from './prepare.mjs';

describe('iThome payload contract', () => {
  test.each([1, 2, 3, 4, 5, 6])('Day %i without a finalized source Markdown file fails closed', async (day) => {
    await expect(prepareIthomePayload(day)).rejects.toMatchObject({ code: 'ENOENT' });
  });
});
