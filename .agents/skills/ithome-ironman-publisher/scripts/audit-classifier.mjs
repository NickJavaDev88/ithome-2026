function exactFields(expected, candidate) {
  const fields = [];
  if (candidate?.title !== expected.title) fields.push('title');
  if (candidate?.firstBodyLine !== expected.syncLine) fields.push('canonicalUrl');
  return fields;
}

export function classifyDay(expected, drafts, publicEntries) {
  if (!expected || !Number.isInteger(expected.day)) throw new Error('Expected payload must contain an integer day.');
  if (!Array.isArray(drafts) || !Array.isArray(publicEntries)) throw new Error('Observed drafts and public entries must be arrays.');

  if ([...drafts, ...publicEntries].some((candidate) => candidate?.association === 'unclassified')) {
    return { day: expected.day, classification: 'unclassified' };
  }

  if (drafts.length > 0 && publicEntries.length > 0) {
    return { day: expected.day, classification: 'conflict', draftCount: drafts.length, publicCount: publicEntries.length };
  }
  if (drafts.length > 1) return { day: expected.day, classification: 'duplicate', count: drafts.length };
  if (publicEntries.length > 1) return { day: expected.day, classification: 'conflict', draftCount: 0, publicCount: publicEntries.length };

  if (publicEntries.length === 1) {
    const fields = exactFields(expected, publicEntries[0]);
    return fields.length
      ? { day: expected.day, classification: 'mismatch', fields, observedStatus: 'published' }
      : { day: expected.day, classification: 'already_published' };
  }

  if (drafts.length === 0) return { day: expected.day, classification: 'missing' };
  const fields = exactFields(expected, drafts[0]);
  if (drafts[0]?.status !== 'draft') fields.push('status');
  return fields.length
    ? { day: expected.day, classification: 'mismatch', fields: [...new Set(fields)] }
    : { day: expected.day, classification: 'complete' };
}

export function summarizeAudit(results, { scanComplete }) {
  if (!Array.isArray(results)) throw new Error('Audit results must be an array.');
  if (!scanComplete) return { status: 'failed', confidence: 'partial', results };

  const duplicate = results.filter((result) => result.classification === 'duplicate').map(({ day, count }) => ({ day, count }));
  const mismatch = results.filter((result) => result.classification === 'mismatch').map(({ day, fields }) => ({ day, fields }));
  const missing = results.filter((result) => result.classification === 'missing').map((result) => result.day);
  const conflicts = results.filter((result) => result.classification === 'conflict');
  const unclassified = results.filter((result) => result.classification === 'unclassified');
  const foundUnique = results.filter((result) => ['complete', 'already_published'].includes(result.classification)).length;

  let status = 'complete';
  if (conflicts.length || duplicate.length || mismatch.length || unclassified.length) status = 'conflict';
  else if (missing.length) status = 'incomplete';

  return { status, confidence: 'complete', expected: results.length, foundUnique, missing, duplicate, mismatch, unclassifiedCount: unclassified.length, results };
}
