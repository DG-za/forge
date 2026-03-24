import type { ReviewContext, ReviewFeedback } from './reviewer.types';

export function buildReviewPrompt(context: ReviewContext): string {
  const issueRef = context.issueNumber !== null ? ` (#${context.issueNumber})` : '';
  const criteria = context.acceptanceCriteria.map((c) => `- ${c}`).join('\n');

  return `Review the following code changes.

## Issue: ${context.issueTitle}${issueRef}

## Acceptance Criteria

${criteria}

## Diff

\`\`\`
${context.diff}
\`\`\`

Check correctness, readability, and whether the acceptance criteria are met. Return structured JSON feedback.`;
}

export function buildReviewFixPrompt(feedback: ReviewFeedback): string {
  const issues = feedback.issues
    .map((issue) => {
      const location = issue.line !== null ? `${issue.file}:${issue.line}` : issue.file;
      return `- **${location}** (${issue.severity}): ${issue.description}`;
    })
    .join('\n');

  return `Fix the following review issues and ensure all quality gates still pass.

## Reviewer Summary

${feedback.summary}

## Issues

${issues}`;
}
