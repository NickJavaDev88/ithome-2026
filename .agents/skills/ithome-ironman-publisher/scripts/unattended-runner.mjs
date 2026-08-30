#!/usr/bin/env node

import { createHash, randomUUID } from 'node:crypto';

const ALLOWED_STATUSES = new Set(['verified', 'blocked', 'failed', 'uncertain']);

function fingerprint(payload) {
  return `sha256:${createHash('sha256').update(JSON.stringify(payload)).digest('hex')}`;
}

function validPayload(payload, day) {
  const dayString = String(day).padStart(2, '0');
  const canonicalUrl = `https://gcake119.github.io/ithome-2026/day/${dayString}/`;
  const syncLine = `本文同步刊載於[個人連載網站](${canonicalUrl})`;
  return payload?.day === day
    && payload.dayString === dayString
    && payload.sourcePath === `src/content/posts/day-${dayString}.md`
    && typeof payload.title === 'string' && payload.title.trim() !== ''
    && typeof payload.body === 'string' && payload.body.split(/\r?\n/, 1)[0] === syncLine
    && payload.canonicalUrl === canonicalUrl
    && payload.syncLine === syncLine;
}

function eventEnvelope({ day, status, result, completedAt, runId }) {
  return {
    schemaVersion: 1,
    eventId: randomUUID(),
    source: 'codex-ithome-ironman-publisher',
    repository: 'gcake119/ithome-2026',
    series: 'ithome-2026',
    operation: 'publish-day',
    day,
    status,
    completedAt,
    runId,
    result,
  };
}

function abnormalResult(reasonCode, publishClickCount = 0, publicVerification = 'not_started') {
  return { reasonCode, publishClickCount, publicVerification };
}

export async function runUnattendedPublisher({ day, prepare, publish, emit, now = () => new Date().toISOString(), runId = `local-publisher-${randomUUID()}` }) {
  if (!Number.isInteger(day) || day < 1 || day > 30) throw new Error('day must be an integer from 1 to 30');
  if (![prepare, publish, emit].every((value) => typeof value === 'function')) throw new Error('prepare, publish, and emit are required functions');

  let payload;
  try {
    payload = await prepare(day);
  } catch (error) {
    const reasonCode = error?.code === 'ENOENT' ? 'payload_missing' : 'payload_failed';
    const result = abnormalResult(reasonCode);
    await emit(eventEnvelope({ day, status: 'blocked', result, completedAt: now(), runId }));
    return { exitCode: 1, silent: false, status: 'blocked', result };
  }

  if (!validPayload(payload, day)) {
    const result = abnormalResult('payload_mismatch');
    await emit(eventEnvelope({ day, status: 'blocked', result, completedAt: now(), runId }));
    return { exitCode: 1, silent: false, status: 'blocked', result };
  }

  const expectedFingerprint = fingerprint(payload);
  let outcome;
  try {
    outcome = await publish({ payload, fingerprint: expectedFingerprint, runId });
  } catch {
    outcome = { status: 'failed', fingerprint: expectedFingerprint, result: abnormalResult('driver_failed') };
  }

  if (!ALLOWED_STATUSES.has(outcome?.status) || !outcome?.result) {
    outcome = { status: 'failed', fingerprint: expectedFingerprint, result: abnormalResult('driver_contract_invalid') };
  }
  if (outcome.fingerprint !== expectedFingerprint) {
    outcome = {
      status: 'uncertain',
      result: abnormalResult('driver_payload_stale', outcome?.result?.publishClickCount ?? 0, outcome?.result?.publicVerification ?? 'uncertain'),
    };
  }

  await emit(eventEnvelope({ day, status: outcome.status, result: outcome.result, completedAt: now(), runId }));
  const silent = outcome.status === 'verified';
  return { exitCode: silent ? 0 : 1, silent, status: outcome.status, result: outcome.result };
}
