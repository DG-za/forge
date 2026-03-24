import { describe, expect, it, vi } from 'vitest';
import type { AgentMessage, AgentRunner, Cost } from '@/dispatcher/agent-runner.types';
import type { CommandExecutor } from '@/dispatcher/coder/coder.types';
import type { IssueFetcher, Plan } from '@/dispatcher/planner/planner.types';
import type { PipelineConfig } from '@/dispatcher/pipeline/pipeline.types';
import { runPipeline, type RunPipelineOptions } from '@/dispatcher/pipeline/run-pipeline.utils';

const zeroCost: Cost = { inputTokens: 0, outputTokens: 0, costUsd: 0 };

const simplePlan: Plan = {
  summary: 'Two tasks for the epic.',
  tasks: [
    { issueNumber: 1, title: 'Task one', acceptanceCriteria: ['works'], dependencies: [], complexity: 'small' },
    { issueNumber: 2, title: 'Task two', acceptanceCriteria: ['also works'], dependencies: [1], complexity: 'small' },
  ],
};

const approvalJson = JSON.stringify({ verdict: 'approve', summary: 'LGTM', issues: [] });
const changesJson = JSON.stringify({
  verdict: 'request_changes',
  summary: 'Bug',
  issues: [{ file: 'a.ts', line: 1, description: 'fix', severity: 'critical' }],
});

function resultMessage(text: string, cost: Cost = zeroCost): AgentMessage {
  return { type: 'result', text, cost, durationMs: 1000, turns: 1 };
}

function errorMessage(text: string, cost: Cost = zeroCost): AgentMessage {
  return { type: 'error', text, cost };
}

function planResponse(plan: Plan, cost: Cost = zeroCost): AgentMessage {
  return resultMessage('```json\n' + JSON.stringify(plan) + '\n```', cost);
}

function buildRunner(platform: 'claude' | 'openai', responses: AgentMessage[]): AgentRunner {
  let callIndex = 0;
  return {
    platform,
    async *run() {
      yield responses[Math.min(callIndex++, responses.length - 1)];
    },
  };
}

const emptyPlan: Plan = { summary: 'No more tasks.', tasks: [] };

const remainingAfterFirstPlan: Plan = {
  summary: 'Remaining after task one.',
  tasks: [simplePlan.tasks[1]],
};

const allPassExec: CommandExecutor = async () => ({ exitCode: 0, output: '' });

const mockFetcher: IssueFetcher = {
  async fetchEpic() {
    return {
      repo: 'owner/repo',
      epicNumber: 10,
      epicTitle: 'Test epic',
      epicBody: 'Epic body',
      issues: [
        { number: 1, title: 'Task one', body: 'Do task one', labels: [], state: 'open' },
        { number: 2, title: 'Task two', body: 'Do task two', labels: [], state: 'open' },
      ],
      repoIssues: [],
    };
  },
};

function baseConfig(overrides: Partial<PipelineConfig> = {}): PipelineConfig {
  return {
    repo: 'owner/repo',
    epicNumber: 10,
    planner: {
      runner: buildRunner('claude', [
        planResponse(simplePlan),
        planResponse(remainingAfterFirstPlan),
        planResponse(emptyPlan),
      ]),
      model: 'claude-opus',
    },
    coder: { runner: buildRunner('claude', [resultMessage('Coded')]), model: 'claude-sonnet' },
    reviewer: { runner: buildRunner('openai', [resultMessage('```json\n' + approvalJson + '\n```')]), model: 'gpt-4o' },
    gateConfig: { lintCommand: 'lint', typecheckCommand: 'tsc', testCommand: 'test' },
    cwd: '/repo',
    maxBudgetUsd: 50,
    exec: allPassExec,
    ...overrides,
  };
}

function baseOptions(overrides: Partial<RunPipelineOptions> = {}): RunPipelineOptions {
  return {
    runId: 'test-run-1',
    config: baseConfig(overrides.config ? overrides.config : {}),
    issueFetcher: mockFetcher,
    getDiff: async () => 'diff content',
    ...overrides,
  };
}

describe('runPipeline', () => {
  it('should execute full pipeline: plan → code → review for each issue', async () => {
    const result = await runPipeline(baseOptions());

    expect(result.outcomes).toHaveLength(2);
    expect(result.outcomes[0].status).toBe('done');
    expect(result.outcomes[1].status).toBe('done');
    expect(result.completedCount).toBe(2);
    expect(result.failedCount).toBe(0);
    expect(result.escalatedCount).toBe(0);
  });

  it('should continue to next issue when one fails', async () => {
    let execCall = 0;
    const failFirstIssueExec: CommandExecutor = async () => {
      execCall++;
      // First 21 calls fail (7 attempts × 3 gates for issue 1), rest pass
      if (execCall <= 21) return { exitCode: 1, output: 'error' };
      return { exitCode: 0, output: '' };
    };

    const result = await runPipeline(baseOptions({ config: baseConfig({ exec: failFirstIssueExec }) }));

    expect(result.outcomes[0].status).toBe('failed');
    expect(result.outcomes[1].status).toBe('done');
    expect(result.failedCount).toBe(1);
    expect(result.completedCount).toBe(1);
  });

  it('should track escalated issues when reviewer cannot approve', async () => {
    const reviewer = {
      runner: buildRunner('openai', [resultMessage('```json\n' + changesJson + '\n```')]),
      model: 'gpt-4o',
    };

    const result = await runPipeline(baseOptions({ config: baseConfig({ reviewer }) }));

    expect(result.outcomes[0].status).toBe('escalated');
    expect(result.escalatedCount).toBeGreaterThanOrEqual(1);
  });

  it('should stop processing when budget is exceeded', async () => {
    const expensiveCost: Cost = { inputTokens: 0, outputTokens: 0, costUsd: 50 };
    const config = baseConfig({
      coder: { runner: buildRunner('claude', [resultMessage('Coded', expensiveCost)]), model: 'claude-sonnet' },
      maxBudgetUsd: 50,
    });

    const result = await runPipeline(baseOptions({ config }));

    // First issue costs $50, hitting the budget — second issue skipped
    expect(result.outcomes).toHaveLength(1);
    expect(result.totalCost.costUsd).toBe(50);
  });

  it('should accumulate costs across all issues', async () => {
    const issueCost: Cost = { inputTokens: 100, outputTokens: 50, costUsd: 0.01 };
    const config = baseConfig({
      coder: { runner: buildRunner('claude', [resultMessage('Coded', issueCost)]), model: 'claude-sonnet' },
      reviewer: {
        runner: buildRunner('openai', [resultMessage('```json\n' + approvalJson + '\n```', issueCost)]),
        model: 'gpt-4o',
      },
    });

    const result = await runPipeline(baseOptions({ config }));

    // 2 issues × (coder + reviewer) costs
    expect(result.totalCost.inputTokens).toBe(400);
    expect(result.totalCost.costUsd).toBeCloseTo(0.04);
  });

  it('should include plan in result', async () => {
    const result = await runPipeline(baseOptions());

    expect(result.plan).toEqual(simplePlan);
  });

  it('should call issueFetcher with repo and epic number', async () => {
    const fetcherSpy = vi.fn(async () => ({
      repo: 'owner/repo',
      epicNumber: 10,
      epicTitle: 'Test',
      epicBody: 'Body',
      issues: [],
      repoIssues: [],
    }));
    const fetcher: IssueFetcher = { fetchEpic: fetcherSpy };

    const emptyPlan: Plan = { summary: 'Nothing', tasks: [] };
    const config = baseConfig({
      planner: { runner: buildRunner('claude', [planResponse(emptyPlan)]), model: 'claude-opus' },
    });

    await runPipeline(baseOptions({ config, issueFetcher: fetcher }));

    expect(fetcherSpy).toHaveBeenCalledWith('owner/repo', 10);
  });

  it('should abort when signal is aborted between issues', async () => {
    const controller = new AbortController();
    let issueCount = 0;

    const trackingExec: CommandExecutor = async () => {
      issueCount++;
      // Abort after first issue completes (after its 3 gates)
      if (issueCount === 3) controller.abort();
      return { exitCode: 0, output: '' };
    };

    const result = await runPipeline(
      baseOptions({
        config: baseConfig({ exec: trackingExec }),
        signal: controller.signal,
      }),
    );

    expect(result.outcomes).toHaveLength(1);
  });

  it('should emit state changes via onStateChange callback', async () => {
    const events: string[] = [];
    const config = baseConfig({
      onStateChange: (event) => {
        if (event.kind === 'run') events.push(`${event.kind}:${event.transition.to}`);
      },
    });

    await runPipeline(baseOptions({ config }));

    expect(events).toContain('run:planning');
    expect(events).toContain('run:in_progress');
    expect(events).toContain('run:completed');
  });

  it('should handle planner error gracefully', async () => {
    const config = baseConfig({
      planner: { runner: buildRunner('claude', [errorMessage('Rate limited')]), model: 'claude-opus' },
    });

    const result = await runPipeline(baseOptions({ config }));

    expect(result.outcomes).toHaveLength(0);
    expect(result.completedCount).toBe(0);
  });
});

describe('runPipeline — re-planning', () => {
  it('should call planner once for initial plan plus once per issue for replan', async () => {
    let plannerCall = 0;
    const plannerSpy = vi.fn(async function* () {
      plannerCall++;
      if (plannerCall === 1) yield planResponse(simplePlan);
      else if (plannerCall === 2) yield planResponse(remainingAfterFirstPlan);
      else yield planResponse(emptyPlan);
    });
    const plannerRunner: AgentRunner = { platform: 'claude', run: plannerSpy };
    const config = baseConfig({ planner: { runner: plannerRunner, model: 'claude-opus' } });

    await runPipeline(baseOptions({ config }));

    // 1 initial plan + 1 replan after issue 1 (issue 2 is the last, no replan)
    expect(plannerSpy).toHaveBeenCalledTimes(2);
  });

  it('should use revised plan for subsequent issues', async () => {
    const revisedPlan: Plan = {
      summary: 'Revised after task one.',
      tasks: [
        {
          issueNumber: 99,
          title: 'New task from replan',
          acceptanceCriteria: ['new'],
          dependencies: [],
          complexity: 'small',
        },
      ],
    };

    let plannerCall = 0;
    const plannerRun = vi.fn(async function* () {
      plannerCall++;
      if (plannerCall === 1) yield planResponse(simplePlan);
      else if (plannerCall === 2) yield planResponse(revisedPlan);
      else yield planResponse(emptyPlan);
    });
    const plannerRunner: AgentRunner = { platform: 'claude', run: plannerRun };
    const config = baseConfig({ planner: { runner: plannerRunner, model: 'claude-opus' } });

    const result = await runPipeline(baseOptions({ config }));

    // Issue 1 from initial plan, replan returns issue 99 (last task, no further replan)
    expect(result.outcomes).toHaveLength(2);
    expect(result.outcomes[0].issueNumber).toBe(1);
    expect(result.outcomes[1].issueNumber).toBe(99);
  });

  it('should continue with remaining original tasks when replan fails', async () => {
    let plannerCall = 0;
    const plannerRun = vi.fn(async function* () {
      plannerCall++;
      if (plannerCall === 1) {
        yield planResponse(simplePlan);
      } else {
        yield errorMessage('Replan failed');
      }
    });
    const plannerRunner: AgentRunner = { platform: 'claude', run: plannerRun };
    const config = baseConfig({ planner: { runner: plannerRunner, model: 'claude-opus' } });

    const result = await runPipeline(baseOptions({ config }));

    // Both original tasks should complete despite replan failure
    expect(result.outcomes).toHaveLength(2);
    expect(result.outcomes[0].issueNumber).toBe(1);
    expect(result.outcomes[1].issueNumber).toBe(2);
  });

  it('should not replan after the last issue', async () => {
    const singleTaskPlan: Plan = {
      summary: 'One task only.',
      tasks: [
        { issueNumber: 1, title: 'Only task', acceptanceCriteria: ['works'], dependencies: [], complexity: 'small' },
      ],
    };

    const plannerSpy = vi.fn(async function* () {
      yield planResponse(singleTaskPlan);
    });
    const plannerRunner: AgentRunner = { platform: 'claude', run: plannerSpy };
    const config = baseConfig({ planner: { runner: plannerRunner, model: 'claude-opus' } });

    await runPipeline(baseOptions({ config }));

    // 1 initial plan, no replan after the only issue
    expect(plannerSpy).toHaveBeenCalledTimes(1);
  });

  it('should accumulate replan cost in totalCost', async () => {
    const planCost: Cost = { inputTokens: 500, outputTokens: 200, costUsd: 0.05 };
    let plannerCall = 0;
    const plannerRun = vi.fn(async function* () {
      plannerCall++;
      if (plannerCall === 1) yield planResponse(simplePlan, planCost);
      else if (plannerCall === 2) yield planResponse(remainingAfterFirstPlan, planCost);
      else yield planResponse(emptyPlan, planCost);
    });
    const plannerRunner: AgentRunner = { platform: 'claude', run: plannerRun };
    const config = baseConfig({ planner: { runner: plannerRunner, model: 'claude-opus' } });

    const result = await runPipeline(baseOptions({ config }));

    // 1 initial plan + 1 replan after issue 1 = 2 × $0.05 = $0.10 planner cost
    expect(result.totalCost.costUsd).toBeGreaterThanOrEqual(0.1);
    expect(result.totalCost.inputTokens).toBeGreaterThanOrEqual(1000);
  });
});

describe('runPipeline — budget warning', () => {
  it('should emit budget_warning when cost crosses 80% of budget', async () => {
    const events: Array<{ kind: string; threshold?: number }> = [];
    const expensiveCost: Cost = { inputTokens: 0, outputTokens: 0, costUsd: 9 };
    const config = baseConfig({
      coder: { runner: buildRunner('claude', [resultMessage('Coded', expensiveCost)]), model: 'claude-sonnet' },
      maxBudgetUsd: 20,
      onStateChange: (event) => {
        if (event.kind === 'budget_warning') events.push(event);
      },
    });

    await runPipeline(baseOptions({ config }));

    // First issue coder costs $9 (45%), reviewer ~$0 (45%) — no warning
    // Second issue coder costs $9 (90%) — warning emitted
    expect(events).toHaveLength(1);
    expect(events[0].kind).toBe('budget_warning');
  });

  it('should emit budget_warning only once per run', async () => {
    const warningCount: string[] = [];
    // $5 per issue × 2 issues = $10. 80% of $10 = $8.
    // After issue 1: $5 (50%) — no warning
    // After issue 2: $10 (100%) — warning fires. Only once.
    const issueCost: Cost = { inputTokens: 0, outputTokens: 0, costUsd: 5 };
    const config = baseConfig({
      coder: { runner: buildRunner('claude', [resultMessage('Coded', issueCost)]), model: 'claude-sonnet' },
      maxBudgetUsd: 10,
      onStateChange: (event) => {
        if (event.kind === 'budget_warning') warningCount.push('warned');
      },
    });

    await runPipeline(baseOptions({ config }));

    expect(warningCount).toHaveLength(1);
  });

  it('should not emit budget_warning when cost stays below 80%', async () => {
    const warnings: string[] = [];
    const cheapCost: Cost = { inputTokens: 10, outputTokens: 5, costUsd: 0.001 };
    const config = baseConfig({
      coder: { runner: buildRunner('claude', [resultMessage('Coded', cheapCost)]), model: 'claude-sonnet' },
      maxBudgetUsd: 50,
      onStateChange: (event) => {
        if (event.kind === 'budget_warning') warnings.push('warned');
      },
    });

    await runPipeline(baseOptions({ config }));

    expect(warnings).toHaveLength(0);
  });
});
