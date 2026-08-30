import { describe, expect, test } from 'vitest';

import { formatNotifications } from './hermes-watcher-notify.mjs';

describe('Hermes watcher Telegram formatter', () => {
  test('keeps an empty notification list completely silent', () => {
    expect(formatNotifications([])).toBe('');
  });

  test('formats audit problems without article content or credentials', () => {
    expect(formatNotifications([
      { kind: 'audit_missing', days: [7, 19] },
      { kind: 'audit_duplicate', entries: [{ day: 12, count: 2 }] },
      { kind: 'audit_mismatch', entries: [{ day: 4, fields: ['title'] }] },
    ])).toBe([
      'iThome 草稿盤點異常：缺少 Day 07、Day 19。',
      'iThome 草稿盤點異常：Day 12 有 2 份重複草稿，未自動刪除。',
      'iThome 草稿盤點異常：Day 04 的 title 不一致，未自動覆寫。',
    ].join('\n'));
  });

  test('formats checkpoint, stale, failure, and recovery decisions', () => {
    expect(formatNotifications([{ kind: 'bootstrap_missing', checkpoint: 'day1-1900' }])).toContain('Day 1 19:00');
    expect(formatNotifications([{ kind: 'stale_event', operation: 'audit-drafts', ageHours: 48 }])).toContain('已超過 48 小時');
    expect(formatNotifications([{ kind: 'audit_failed', failure: { reasonCode: 'ui_unreadable' } }])).toContain('ui_unreadable');
    expect(formatNotifications([{ kind: 'bootstrap_recovered' }])).toBe('iThome Day 1 verified bootstrap state 已就緒，公開系列頁 watchdog 可以開始監控。');
  });
});
