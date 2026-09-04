import { describe, expect, test } from 'vitest';

import { classifyDay, summarizeAudit } from './audit-classifier.mjs';

const expected = {
  day: 4,
  title: 'Day 4｜預期標題',
  canonicalUrl: 'https://gcake119.github.io/ithome-2026/day/04/',
  syncLine: '本文同步刊載於[個人連載網站](https://gcake119.github.io/ithome-2026/day/04/)',
};

const matchingDraft = {
  id: 'draft-4',
  status: 'draft',
  title: expected.title,
  firstBodyLine: expected.syncLine,
};

describe('audit classifier', () => {
  test('classifies missing, complete, duplicate, mismatch, already published, and conflict', () => {
    expect(classifyDay(expected, [], [])).toMatchObject({ classification: 'missing' });
    expect(classifyDay(expected, [matchingDraft], [])).toMatchObject({ classification: 'complete' });
    expect(classifyDay(expected, [matchingDraft, { ...matchingDraft, id: 'draft-4b' }], [])).toMatchObject({ classification: 'duplicate', count: 2 });
    expect(classifyDay(expected, [{ ...matchingDraft, title: '錯誤標題' }], [])).toMatchObject({ classification: 'mismatch', fields: ['title'] });
    expect(classifyDay(expected, [], [{ title: expected.title, firstBodyLine: expected.syncLine, status: 'published' }])).toMatchObject({ classification: 'already_published' });
    expect(classifyDay(expected, [matchingDraft], [{ title: expected.title, firstBodyLine: expected.syncLine, status: 'published' }])).toMatchObject({ classification: 'conflict' });
  });

  test('never declares complete when scan confidence is incomplete', () => {
    const result = summarizeAudit([classifyDay(expected, [matchingDraft], [])], { scanComplete: false });
    expect(result).toMatchObject({ status: 'failed', confidence: 'partial' });
  });

  test('reports canonical and draft-status mismatches without rewriting', () => {
    expect(classifyDay(expected, [{ ...matchingDraft, firstBodyLine: '錯誤連結' }], [])).toMatchObject({ classification: 'mismatch', fields: ['canonicalUrl'] });
    expect(classifyDay(expected, [{ ...matchingDraft, status: 'unknown' }], [])).toMatchObject({ classification: 'mismatch', fields: ['status'] });
  });

  test('reports a public mismatch and an explicitly unclassified candidate', () => {
    expect(classifyDay(expected, [], [{ title: '錯誤標題', firstBodyLine: expected.syncLine, status: 'published' }])).toMatchObject({ classification: 'mismatch', fields: ['title'], observedStatus: 'published' });
    expect(classifyDay(expected, [{ id: 'unknown', association: 'unclassified' }], [])).toMatchObject({ classification: 'unclassified' });
  });

  test('summarizes complete, incomplete, and conflict outcomes', () => {
    expect(summarizeAudit([classifyDay(expected, [matchingDraft], [])], { scanComplete: true })).toMatchObject({ status: 'complete', foundUnique: 1 });
    expect(summarizeAudit([classifyDay(expected, [], [])], { scanComplete: true })).toMatchObject({ status: 'incomplete', missing: [4] });
    expect(summarizeAudit([classifyDay(expected, [matchingDraft, { ...matchingDraft, id: 'other' }], [])], { scanComplete: true })).toMatchObject({ status: 'conflict', duplicate: [{ day: 4, count: 2 }] });
    expect(summarizeAudit([classifyDay(expected, [{ id: 'unknown', association: 'unclassified' }], [])], { scanComplete: true })).toMatchObject({ status: 'conflict', unclassifiedCount: 1 });
  });
});
