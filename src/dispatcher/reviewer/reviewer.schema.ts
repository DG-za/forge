import { z } from 'zod/v4';
import type { ReviewFeedback } from './reviewer.types';

const reviewIssueSchema = z.object({
  file: z.string(),
  line: z.number().nullable(),
  description: z.string(),
  severity: z.enum(['critical', 'suggestion']),
});

const reviewFeedbackSchema = z.object({
  verdict: z.enum(['approve', 'request_changes']),
  summary: z.string(),
  issues: z.array(reviewIssueSchema),
});

export class ReviewParseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ReviewParseError';
  }
}

export function parseReview(agentOutput: string): ReviewFeedback {
  const json = extractJson(agentOutput);

  let parsed: unknown;
  try {
    parsed = JSON.parse(json);
  } catch {
    throw new ReviewParseError(`Invalid JSON in reviewer output: ${json.slice(0, 100)}`);
  }

  const result = reviewFeedbackSchema.safeParse(parsed);
  if (!result.success) {
    throw new ReviewParseError(`Review validation failed: ${z.prettifyError(result.error)}`);
  }

  return result.data;
}

function extractJson(text: string): string {
  const fenceMatch = text.match(/```(?:json)?\s*\n([\s\S]*?)\n```/);
  return fenceMatch ? fenceMatch[1] : text.trim();
}
