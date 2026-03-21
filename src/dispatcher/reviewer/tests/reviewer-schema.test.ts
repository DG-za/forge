import { describe, expect, it } from 'vitest';
import { parseReview, ReviewParseError } from '../reviewer.schema';

const approval = {
  verdict: 'approve' as const,
  summary: 'Code looks good.',
  issues: [],
};

const requestChanges = {
  verdict: 'request_changes' as const,
  summary: 'Found a bug in auth logic.',
  issues: [
    { file: 'src/auth.ts', line: 42, description: 'Missing null check', severity: 'critical' as const },
    { file: 'src/auth.ts', line: null, description: 'Consider renaming', severity: 'suggestion' as const },
  ],
};

describe('parseReview', () => {
  it('should parse valid approval JSON', () => {
    const result = parseReview(JSON.stringify(approval));

    expect(result).toEqual(approval);
  });

  it('should parse valid request_changes JSON with issues', () => {
    const result = parseReview(JSON.stringify(requestChanges));

    expect(result).toEqual(requestChanges);
  });

  it('should extract JSON from markdown code fences', () => {
    const wrapped = '```json\n' + JSON.stringify(approval) + '\n```';

    const result = parseReview(wrapped);

    expect(result).toEqual(approval);
  });

  it('should throw ReviewParseError on invalid JSON', () => {
    expect(() => parseReview('not json at all')).toThrow(ReviewParseError);
  });

  it('should throw ReviewParseError when verdict is missing', () => {
    const invalid = JSON.stringify({ summary: 'No verdict', issues: [] });

    expect(() => parseReview(invalid)).toThrow(ReviewParseError);
  });

  it('should throw ReviewParseError when severity is invalid', () => {
    const invalid = JSON.stringify({
      verdict: 'approve',
      summary: 'Ok',
      issues: [{ file: 'a.ts', line: 1, description: 'x', severity: 'low' }],
    });

    expect(() => parseReview(invalid)).toThrow(ReviewParseError);
  });
});
