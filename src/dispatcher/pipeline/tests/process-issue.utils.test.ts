import { describe, expect, it, vi } from 'vitest';
import type { AgentMessage, AgentRunner, Cost } from '../../agent-runner.types';
import type { CoderTask, CommandExecutor } from '../../coder/coder.types';
import type { ReviewFeedback } from '../../reviewer/reviewer.types';
import { processIssue, type ProcessIssueOptions } from '../process-issue.utils';

const zeroCost: Cost = { inputTokens: 0, outputTokens: 0, costUsd: 0 };
const smallCost: Cost = { inputTokens: 100, outputTokens: 50, costUsd: 0.01 };

const task: CoderTask = {
  issueNumber: 42,
  title: 'Add login endpoint',
  body: 'Implement POST /login',
  acceptanceCriteria: ['POST /login returns JWT', 'Invalid credentials return 401'],
};

const approvalFeedback: ReviewFeedback = {
  verdict: 'approve',
  summary: 'Looks good.',
  issues: [],
};

const escalatedFeedback: ReviewFeedback = {
  verdict: 'request_changes',
  summary: 'Still broken.',
  issues: [{ file: 'src/auth.ts', line: 10, description: 'Bug', severity: 'critical' }],
};

function resultMessage(text: string, cost: Cost = zeroCost): AgentMessage {
  return { type: 'result', text, cost, durationMs: 1000, turns: 1 };
}

function jsonReview(feedback: ReviewFeedback, cost: Cost = zeroCost): AgentMessage {
  return resultMessage('```json\n' + JSON.stringify(feedback) + '\n```', cost);
}

function buildRunner(platform: 'claude' | 'openai', responses: AgentMessage[]): AgentRunner {
  let callIndex = 0;
  return {
    platform,
    async *run() {
      yield responses[callIndex++ % responses.length];
    },
  };
}

const allPassExec: CommandExecutor = async () => ({ exitCode: 0, output: '' });
const allFailExec: CommandExecutor = async () => ({ exitCode: 1, output: 'error' });

function baseOptions(overrides: Partial<ProcessIssueOptions> = {}): ProcessIssueOptions {
  return {
    task,
    coder: { runner: buildRunner('claude', [resultMessage('Done', smallCost)]), model: 'claude-sonnet' },
    reviewer: { runner: buildRunner('openai', [jsonReview(approvalFeedback, smallCost)]), model: 'gpt-4o' },
    gateConfig: { lintCommand: 'lint', typecheckCommand: 'tsc', testCommand: 'test' },
    cwd: '/repo',
    maxBudgetUsd: 10,
    exec: allPassExec,
    getDiff: async () => 'diff --git a/src/auth.ts\n+login()',
    ...overrides,
  };
}

describe('processIssue', () => {
  it('should return done when coder passes gates and reviewer approves', async () => {
    const result = await processIssue(baseOptions());

    expect(result.status).toBe('done');
    expect(result.issueNumber).toBe(42);
  });

  it('should return failed when coder cannot pass quality gates', async () => {
    const result = await processIssue(baseOptions({ exec: allFailExec }));

    expect(result.status).toBe('failed');
  });

  it('should not call reviewer when coder fails gates', async () => {
    const reviewerSpy = vi.fn(async function* () {
      yield jsonReview(approvalFeedback);
    });
    const reviewer = { runner: { platform: 'openai' as const, run: reviewerSpy }, model: 'gpt-4o' };

    await processIssue(baseOptions({ exec: allFailExec, reviewer }));

    expect(reviewerSpy).not.toHaveBeenCalled();
  });

  it('should return escalated when reviewer exhausts iterations', async () => {
    const reviewer = {
      runner: buildRunner('openai', [jsonReview(escalatedFeedback, smallCost)]),
      model: 'gpt-4o',
    };

    const result = await processIssue(baseOptions({ reviewer }));

    expect(result.status).toBe('escalated');
  });

  it('should accumulate cost from coder and reviewer', async () => {
    const coderCost: Cost = { inputTokens: 100, outputTokens: 50, costUsd: 0.01 };
    const reviewerCost: Cost = { inputTokens: 200, outputTokens: 100, costUsd: 0.02 };

    const result = await processIssue(
      baseOptions({
        coder: { runner: buildRunner('claude', [resultMessage('Done', coderCost)]), model: 'claude-sonnet' },
        reviewer: { runner: buildRunner('openai', [jsonReview(approvalFeedback, reviewerCost)]), model: 'gpt-4o' },
      }),
    );

    expect(result.cost.inputTokens).toBe(300);
    expect(result.cost.costUsd).toBeCloseTo(0.03);
  });

  it('should pass diff from getDiff to reviewer context', async () => {
    const reviewerSpy = vi.fn(async function* () {
      yield jsonReview(approvalFeedback);
    });
    const reviewer = { runner: { platform: 'openai' as const, run: reviewerSpy }, model: 'gpt-4o' };

    await processIssue(
      baseOptions({
        reviewer,
        getDiff: async () => 'custom diff content',
      }),
    );

    const prompt = reviewerSpy.mock.calls[0][0] as string;
    expect(prompt).toContain('custom diff content');
  });

  it('should handle null issue number', async () => {
    const nullTask: CoderTask = { ...task, issueNumber: null };

    const result = await processIssue(baseOptions({ task: nullTask }));

    expect(result.issueNumber).toBe(0);
    expect(result.status).toBe('done');
  });

  it('should reduce reviewer budget by coder cost', async () => {
    const coderCost: Cost = { inputTokens: 0, outputTokens: 0, costUsd: 3.0 };
    const reviewerSpy = vi.fn(async function* () {
      yield jsonReview(approvalFeedback);
    });

    await processIssue(
      baseOptions({
        coder: { runner: buildRunner('claude', [resultMessage('Done', coderCost)]), model: 'claude-sonnet' },
        reviewer: { runner: { platform: 'openai' as const, run: reviewerSpy }, model: 'gpt-4o' },
        maxBudgetUsd: 10,
      }),
    );

    const options = reviewerSpy.mock.calls[0][1] as { maxBudgetUsd: number };
    expect(options.maxBudgetUsd).toBe(7);
  });
});
