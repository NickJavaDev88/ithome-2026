import { describe, expect, test } from 'vitest';

import { validateBootstrapState } from './validate-bootstrap-state.mjs';

const verifiedState = {
  schemaVersion: 1,
  source: 'codex-ithome-ironman-publisher',
  repository: 'gcake119/ithome-2026',
  contest: '18th-ironman-2026',
  bootstrapDay: 1,
  status: 'verified',
  articleUrl: 'https://ithelp.ithome.com.tw/articles/123',
  seriesUrl: 'https://ithelp.ithome.com.tw/ironman/456',
  seriesId: '456',
  publishedAt: '2026-09-01T01:00:00.000Z',
  verifiedAt: '2026-09-01T01:01:00.000Z',
  runId: 'publish-day1-test',
  verification: { titleMatched: true, canonicalMatched: true, seriesTitleMatched: true, day1ListedOnSeriesPage: true },
};

describe('Day 2-30 bootstrap gate', () => {
  test('accepts only complete verified identity', () => {
    expect(validateBootstrapState(verifiedState)).toEqual([]);
  });

  test.each([
    ['missing state', null],
    ['unverified state', { ...verifiedState, status: 'incomplete' }],
    ['mismatched identity', { ...verifiedState, seriesId: '999' }],
    ['non-iThome series URL', { ...verifiedState, seriesUrl: 'https://example.com/ironman/456' }],
    ['incomplete verification', { ...verifiedState, verification: { ...verifiedState.verification, canonicalMatched: false } }],
  ])('rejects %s', (_name, state) => {
    expect(validateBootstrapState(state)).not.toEqual([]);
  });
});
