import { describe, expect, it, vi } from 'vitest';
import type { AgentMessage, AgentRunner } from '../../agent-runner.types';
import { PlanParseError } from '../planner.schema';
import type { EpicContext, ReplanContext } from '../planner.types';
import { replan, runPlanner } from '../run-planner';

const validPlanJson = JSON.stringify({
  summary: 'Build auth module',
  tasks: [
    {
      issueNumber: 42,
      title: 'Add login endpoint',
      acceptanceCriteria: ['POST /login returns JWT'],
      dependencies: [],
      complexity: 'medium',
    },
  ],
});

const epicContext: EpicContext = {
  repo: 'DG-za/forge',
  epicNumber: 15,
  epicTitle: 'Core Engine',
  epicBody: 'Build the dispatcher.',
  issues: [{ number: 42, title: 'Login', body: 'Add login.', labels: [], state: 'open' }],
};

function buildMockRunner(messages: AgentMessage[]): AgentRunner {
  return {
    platform: 'claude',
    async *run() {
      yield* messages;
    },
  };
}

function resultMessage(text: string): AgentMessage {
  return {
    type: 'result',
    text,
    cost: { inputTokens: 500, outputTokens: 200, costUsd: 0.05 },
    durationMs: 2000,
    turns: 3,
  };
}

function errorMessage(text: string): AgentMessage {
  return {
    type: 'error',
    text,
    cost: { inputTokens: 100, outputTokens: 0, costUsd: 0.01 },
  };
}

describe('runPlanner', () => {
  it('should return a parsed plan and cost', async () => {
    const runner = buildMockRunner([resultMessage(validPlanJson)]);

    const result = await runPlanner({
      runner,
      model: 'claude-opus-4-6',
      epicContext,
      maxBudgetUsd: 5,
    });

    expect(result.plan.summary).toBe('Build auth module');
    expect(result.plan.tasks).toHaveLength(1);
    expect(result.cost.costUsd).toBe(0.05);
  });

  it('should pass model and options to the runner', async () => {
    const runSpy = vi.fn(async function* () {
      yield resultMessage(validPlanJson);
    });
    const runner: AgentRunner = { platform: 'claude', run: runSpy };

    await runPlanner({
      runner,
      model: 'claude-opus-4-6',
      epicContext,
      maxBudgetUsd: 10,
    });

    expect(runSpy).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({ model: 'claude-opus-4-6', maxBudgetUsd: 10 }),
    );
  });

  it('should throw PlanParseError when agent output is invalid', async () => {
    const runner = buildMockRunner([resultMessage('not json')]);

    await expect(runPlanner({ runner, model: 'test', epicContext, maxBudgetUsd: 5 })).rejects.toThrow(PlanParseError);
  });

  it('should throw when runner returns an error message', async () => {
    const runner = buildMockRunner([errorMessage('Budget exceeded')]);

    await expect(runPlanner({ runner, model: 'test', epicContext, maxBudgetUsd: 5 })).rejects.toThrow(
      'Budget exceeded',
    );
  });
});

describe('replan', () => {
  const replanContext: ReplanContext = {
    originalPlan: {
      summary: 'Original plan',
      tasks: [
        {
          issueNumber: 42,
          title: 'Login',
          acceptanceCriteria: ['Works'],
          dependencies: [],
          complexity: 'medium',
        },
      ],
    },
    completedIssues: [{ issueNumber: 42, outcome: 'done', notes: 'Merged' }],
    remainingIssues: [],
  };

  it('should return a revised plan', async () => {
    const revisedPlan = JSON.stringify({
      summary: 'Revised plan after login done',
      tasks: [],
    });
    const runner = buildMockRunner([resultMessage(revisedPlan)]);

    const result = await replan({
      runner,
      model: 'claude-opus-4-6',
      epicContext,
      replanContext,
      maxBudgetUsd: 2,
    });

    expect(result.plan.summary).toBe('Revised plan after login done');
    expect(result.plan.tasks).toHaveLength(0);
  });

  it('should include completed context in the prompt', async () => {
    const runSpy = vi.fn(async function* () {
      yield resultMessage(JSON.stringify({ summary: 'Revised', tasks: [] }));
    });
    const runner: AgentRunner = { platform: 'claude', run: runSpy };

    await replan({
      runner,
      model: 'test',
      epicContext,
      replanContext,
      maxBudgetUsd: 2,
    });

    const prompt = runSpy.mock.calls[0][0] as string;
    expect(prompt).toContain('#42');
    expect(prompt).toContain('done');
    expect(prompt).toContain('Merged');
  });
});
