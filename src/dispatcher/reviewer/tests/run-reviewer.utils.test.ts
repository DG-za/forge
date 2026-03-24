import { describe, expect, it, vi } from 'vitest';
import type { AgentMessage, AgentRunner, Cost } from '../../agent-runner.types';
import type { CommandExecutor, QualityGateConfig } from '../../coder/coder.types';
import { CrossModelError } from '../cross-model.utils';
import { ReviewerError } from '../reviewer.error';
import type { ReviewContext, ReviewFeedback } from '../reviewer.types';
import { runReviewer } from '../run-reviewer.utils';

const context: ReviewContext = {
  diff: 'diff --git a/src/auth.ts\n+login()',
  issueTitle: 'Add login',
  issueNumber: 42,
  acceptanceCriteria: ['POST /login returns JWT'],
};

const gateConfig: QualityGateConfig = {
  lintCommand: 'npm run lint',
  typecheckCommand: 'npm run typecheck',
  testCommand: 'npm test',
};

const zeroCost: Cost = { inputTokens: 0, outputTokens: 0, costUsd: 0 };

const approvalFeedback: ReviewFeedback = {
  verdict: 'approve',
  summary: 'Looks good.',
  issues: [],
};

const changesFeedback: ReviewFeedback = {
  verdict: 'request_changes',
  summary: 'Found a bug.',
  issues: [{ file: 'src/auth.ts', line: 10, description: 'Missing check', severity: 'critical' }],
};

function resultMessage(text: string, cost: Cost = zeroCost): AgentMessage {
  return { type: 'result', text, cost, durationMs: 1000, turns: 1 };
}

function errorMessage(text: string, cost: Cost = zeroCost): AgentMessage {
  return { type: 'error', text, cost };
}

function buildMockRunner(platform: 'claude' | 'openai', responses: AgentMessage[]): AgentRunner {
  let callIndex = 0;
  return {
    platform,
    async *run() {
      yield responses[callIndex++ % responses.length];
    },
  };
}

function jsonResponse(feedback: ReviewFeedback, cost: Cost = zeroCost): AgentMessage {
  return resultMessage('```json\n' + JSON.stringify(feedback) + '\n```', cost);
}

const allPassExec: CommandExecutor = async () => ({ exitCode: 0, output: '' });

function baseOptions(overrides: Partial<Parameters<typeof runReviewer>[0]> = {}) {
  return {
    reviewerRunner: buildMockRunner('openai', [jsonResponse(approvalFeedback)]),
    coderRunner: buildMockRunner('claude', [resultMessage('Fixed')]),
    reviewerModel: 'gpt-4o',
    coderModel: 'claude-sonnet-4-5-20250514',
    context,
    gateConfig,
    cwd: '/repo',
    maxBudgetUsd: 10,
    exec: allPassExec,
    ...overrides,
  };
}

describe('runReviewer', () => {
  it('should return approved result when reviewer approves on first pass', async () => {
    const result = await runReviewer(baseOptions());

    expect(result.feedback.verdict).toBe('approve');
    expect(result.iterations).toBe(1);
    expect(result.escalated).toBe(false);
  });

  it('should throw CrossModelError when coder and reviewer use same platform', async () => {
    const sameRunner = buildMockRunner('claude', [jsonResponse(approvalFeedback)]);

    const error = await runReviewer(baseOptions({ reviewerRunner: sameRunner })).catch((e) => e);

    expect(error).toBeInstanceOf(CrossModelError);
  });

  it('should pass review feedback to coder for fixing when changes requested', async () => {
    const coderSpy = vi.fn(async function* () {
      yield resultMessage('Fixed');
    });
    const coderRunner: AgentRunner = { platform: 'claude', run: coderSpy };

    let reviewCall = 0;
    const reviewerRunner: AgentRunner = {
      platform: 'openai',
      async *run() {
        reviewCall++;
        if (reviewCall === 1) yield jsonResponse(changesFeedback);
        else yield jsonResponse(approvalFeedback);
      },
    };

    await runReviewer(baseOptions({ reviewerRunner, coderRunner }));

    const coderPrompt = coderSpy.mock.calls[0][0] as string;
    expect(coderPrompt).toContain('Missing check');
  });

  it('should re-run quality gates after coder fixes', async () => {
    const execSpy = vi.fn(async () => ({ exitCode: 0, output: '' }));

    let reviewCall = 0;
    const reviewerRunner: AgentRunner = {
      platform: 'openai',
      async *run() {
        reviewCall++;
        if (reviewCall === 1) yield jsonResponse(changesFeedback);
        else yield jsonResponse(approvalFeedback);
      },
    };

    await runReviewer(baseOptions({ reviewerRunner, exec: execSpy }));

    // Gates run once after coder fixes (3 gates: lint, typecheck, test)
    expect(execSpy).toHaveBeenCalled();
  });

  it('should iterate up to maxIterations then escalate', async () => {
    const reviewerRunner = buildMockRunner('openai', [jsonResponse(changesFeedback)]);
    const coderSpy = vi.fn(async function* () {
      yield resultMessage('Fixed');
    });
    const coderRunner: AgentRunner = { platform: 'claude', run: coderSpy };

    const result = await runReviewer(baseOptions({ reviewerRunner, coderRunner, maxIterations: 3 }));

    expect(result.escalated).toBe(true);
    expect(result.iterations).toBe(3);
    expect(result.feedback.verdict).toBe('request_changes');
  });

  it('should default to 4 max iterations', async () => {
    const reviewerRunner = buildMockRunner('openai', [jsonResponse(changesFeedback)]);
    const coderSpy = vi.fn(async function* () {
      yield resultMessage('Fixed');
    });
    const coderRunner: AgentRunner = { platform: 'claude', run: coderSpy };

    const result = await runReviewer(baseOptions({ reviewerRunner, coderRunner }));

    expect(result.iterations).toBe(4);
    expect(result.escalated).toBe(true);
  });

  it('should accumulate cost across reviewer and coder iterations', async () => {
    const reviewerCost: Cost = { inputTokens: 100, outputTokens: 50, costUsd: 0.01 };
    const coderCost: Cost = { inputTokens: 200, outputTokens: 100, costUsd: 0.02 };

    let reviewCall = 0;
    const reviewerRunner: AgentRunner = {
      platform: 'openai',
      async *run() {
        reviewCall++;
        if (reviewCall === 1) yield jsonResponse(changesFeedback, reviewerCost);
        else yield jsonResponse(approvalFeedback, reviewerCost);
      },
    };
    const coderRunner: AgentRunner = {
      platform: 'claude',
      async *run() {
        yield resultMessage('Fixed', coderCost);
      },
    };

    const result = await runReviewer(baseOptions({ reviewerRunner, coderRunner }));

    // 2 reviewer calls + 1 coder call
    expect(result.cost.inputTokens).toBe(400);
    expect(result.cost.costUsd).toBeCloseTo(0.04);
  });

  it('should throw ReviewerError when reviewer agent returns error', async () => {
    const cost: Cost = { inputTokens: 50, outputTokens: 0, costUsd: 0.01 };
    const reviewerRunner = buildMockRunner('openai', [errorMessage('Rate limited', cost)]);

    const error = await runReviewer(baseOptions({ reviewerRunner })).catch((e) => e);

    expect(error).toBeInstanceOf(ReviewerError);
    expect(error.message).toBe('Rate limited');
    expect(error.cost).toEqual(cost);
  });

  it('should stop iterating once reviewer approves', async () => {
    let reviewCall = 0;
    const reviewerSpy = vi.fn(async function* () {
      reviewCall++;
      if (reviewCall <= 2) yield jsonResponse(changesFeedback);
      else yield jsonResponse(approvalFeedback);
    });
    const reviewerRunner: AgentRunner = { platform: 'openai', run: reviewerSpy };

    const result = await runReviewer(baseOptions({ reviewerRunner }));

    expect(result.feedback.verdict).toBe('approve');
    expect(result.iterations).toBe(3);
    expect(result.escalated).toBe(false);
  });

  it('should retry coder when quality gates fail after fix', async () => {
    let reviewCall = 0;
    const reviewerRunner: AgentRunner = {
      platform: 'openai',
      async *run() {
        reviewCall++;
        if (reviewCall === 1) yield jsonResponse(changesFeedback);
        else yield jsonResponse(approvalFeedback);
      },
    };

    const coderSpy = vi.fn(async function* () {
      yield resultMessage('Fixed');
    });
    const coderRunner: AgentRunner = { platform: 'claude', run: coderSpy };

    const failOnceExec: CommandExecutor = vi.fn(async (command: string) => {
      // First lint call fails, everything else passes
      if (command === 'npm run lint' && (failOnceExec as ReturnType<typeof vi.fn>).mock.calls.length <= 3) {
        return { exitCode: 1, output: 'Lint error: unused var' };
      }
      return { exitCode: 0, output: '' };
    });

    await runReviewer(baseOptions({ reviewerRunner, coderRunner, exec: failOnceExec }));

    // Coder called twice: once for review fix, once for gate failure retry
    expect(coderSpy).toHaveBeenCalledTimes(2);
    const retryPrompt = coderSpy.mock.calls[1][0] as string;
    expect(retryPrompt).toContain('Quality gates failed');
  });

  it('should pass reviewer model and cwd to the reviewer runner', async () => {
    const runSpy = vi.fn(async function* () {
      yield jsonResponse(approvalFeedback);
    });
    const reviewerRunner: AgentRunner = { platform: 'openai', run: runSpy };

    await runReviewer(baseOptions({ reviewerRunner, reviewerModel: 'gpt-4o', cwd: '/my/repo' }));

    expect(runSpy).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({ model: 'gpt-4o', cwd: '/my/repo' }),
    );
  });
});
