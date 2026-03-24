import { describe, expect, it } from 'vitest';
import { buildReviewFixPrompt, buildReviewPrompt } from '../reviewer-prompt.utils';
import { REVIEWER_SYSTEM_PROMPT } from '../reviewer-system-prompt.utils';
import type { ReviewContext, ReviewFeedback } from '../reviewer.types';

const context: ReviewContext = {
  diff: 'diff --git a/src/auth.ts\n+export function login() { return jwt; }',
  issueTitle: 'Add login endpoint',
  issueNumber: 42,
  acceptanceCriteria: ['POST /login returns JWT', 'Invalid credentials return 401'],
};

describe('REVIEWER_SYSTEM_PROMPT', () => {
  it('should describe the JSON output format', () => {
    expect(REVIEWER_SYSTEM_PROMPT).toContain('verdict');
    expect(REVIEWER_SYSTEM_PROMPT).toContain('issues');
  });
});

describe('buildReviewPrompt', () => {
  it('should include the diff', () => {
    const prompt = buildReviewPrompt(context);

    expect(prompt).toContain('diff --git a/src/auth.ts');
  });

  it('should include acceptance criteria', () => {
    const prompt = buildReviewPrompt(context);

    expect(prompt).toContain('POST /login returns JWT');
    expect(prompt).toContain('Invalid credentials return 401');
  });

  it('should include issue title and number', () => {
    const prompt = buildReviewPrompt(context);

    expect(prompt).toContain('Add login endpoint');
    expect(prompt).toContain('#42');
  });

  it('should handle null issue number', () => {
    const noIssue: ReviewContext = { ...context, issueNumber: null };
    const prompt = buildReviewPrompt(noIssue);

    expect(prompt).toContain('Add login endpoint');
    expect(prompt).not.toContain('#null');
  });
});

describe('buildReviewFixPrompt', () => {
  const feedback: ReviewFeedback = {
    verdict: 'request_changes',
    summary: 'Auth has a bug.',
    issues: [
      { file: 'src/auth.ts', line: 42, description: 'Missing null check on user', severity: 'critical' },
      { file: 'src/auth.ts', line: null, description: 'Consider better name', severity: 'suggestion' },
    ],
  };

  it('should include all review issues', () => {
    const prompt = buildReviewFixPrompt(feedback);

    expect(prompt).toContain('Missing null check on user');
    expect(prompt).toContain('Consider better name');
  });

  it('should include file and line references', () => {
    const prompt = buildReviewFixPrompt(feedback);

    expect(prompt).toContain('src/auth.ts:42');
  });

  it('should instruct the coder to fix issues', () => {
    const prompt = buildReviewFixPrompt(feedback);

    expect(prompt).toContain('Fix');
  });
});
