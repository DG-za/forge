import type { Cost } from '../agent-runner.types';

export type ReviewVerdict = 'approve' | 'request_changes';

export type ReviewIssue = {
  file: string;
  line: number | null;
  description: string;
  severity: 'critical' | 'suggestion';
};

export type ReviewFeedback = {
  verdict: ReviewVerdict;
  summary: string;
  issues: ReviewIssue[];
};

export type ReviewContext = {
  diff: string;
  issueTitle: string;
  issueNumber: number | null;
  acceptanceCriteria: string[];
};

export type ReviewResult = {
  cost: Cost;
  feedback: ReviewFeedback;
  iterations: number;
  escalated: boolean;
};
