import { describe, expect, it, vi } from 'vitest';
import type { AgentMessage, AgentRunner, Cost } from '../../agent-runner.types';
import type { CommandExecutor } from '../../coder/coder.types';
import type { IssueFetcher, Plan } from '../../planner/planner.types';
import type { PipelineConfig } from '../pipeline.types';
import { createPipelineApi } from '../pipeline-api';

const zeroCost: Cost = { inputTokens: 0, outputTokens: 0, costUsd: 0 };

const emptyPlan: Plan = { summary: 'Empty', tasks: [] };

function resultMessage(text: string, cost: Cost = zeroCost): AgentMessage {
  return { type: 'result', text, cost, durationMs: 1000, turns: 1 };
}

function planResponse(plan: Plan): AgentMessage {
  return resultMessage('```json\n' + JSON.stringify(plan) + '\n```');
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

const mockFetcher: IssueFetcher = {
  async fetchEpic() {
    return {
      repo: 'owner/repo',
      epicNumber: 10,
      epicTitle: 'Test',
      epicBody: 'Body',
      issues: [],
      repoIssues: [],
    };
  },
};

function testConfig(): PipelineConfig {
  return {
    repo: 'owner/repo',
    epicNumber: 10,
    planner: { runner: buildRunner('claude', [planResponse(emptyPlan)]), model: 'claude-opus' },
    coder: { runner: buildRunner('claude', [resultMessage('Coded')]), model: 'claude-sonnet' },
    reviewer: { runner: buildRunner('openai', [resultMessage('Approved')]), model: 'gpt-4o' },
    gateConfig: { lintCommand: 'lint', typecheckCommand: 'tsc', testCommand: 'test' },
    cwd: '/repo',
    maxBudgetUsd: 50,
    exec: allPassExec,
  };
}

describe('createPipelineApi', () => {
  it('should create an api with startRun, getRunStatus, cancelRun', () => {
    const api = createPipelineApi();

    expect(api.startRun).toBeTypeOf('function');
    expect(api.getRunStatus).toBeTypeOf('function');
    expect(api.cancelRun).toBeTypeOf('function');
  });
});

describe('startRun', () => {
  it('should return a run ID immediately', async () => {
    const api = createPipelineApi();

    const runId = api.startRun({
      config: testConfig(),
      issueFetcher: mockFetcher,
      getDiff: async () => '',
    });

    expect(runId).toBeTypeOf('string');
    expect(runId.length).toBeGreaterThan(0);
  });

  it('should track run status as running', () => {
    const api = createPipelineApi();

    const runId = api.startRun({
      config: testConfig(),
      issueFetcher: mockFetcher,
      getDiff: async () => '',
    });

    const status = api.getRunStatus(runId);
    expect(status?.state).toBe('running');
  });
});

describe('getRunStatus', () => {
  it('should return null for unknown run ID', () => {
    const api = createPipelineApi();

    expect(api.getRunStatus('nonexistent')).toBeNull();
  });

  it('should return completed after pipeline finishes', async () => {
    const api = createPipelineApi();

    const runId = api.startRun({
      config: testConfig(),
      issueFetcher: mockFetcher,
      getDiff: async () => '',
    });

    // Wait for pipeline to complete
    await vi.waitFor(() => {
      const status = api.getRunStatus(runId);
      expect(status?.state).toBe('completed');
    });
  });
});

describe('cancelRun', () => {
  it('should return false for unknown run ID', () => {
    const api = createPipelineApi();

    expect(api.cancelRun('nonexistent')).toBe(false);
  });

  it('should return true and abort a running pipeline', () => {
    const api = createPipelineApi();

    const runId = api.startRun({
      config: testConfig(),
      issueFetcher: mockFetcher,
      getDiff: async () => '',
    });

    expect(api.cancelRun(runId)).toBe(true);
  });
});
