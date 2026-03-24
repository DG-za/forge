import { PrismaPg } from '@prisma/adapter-pg';
import { PostgreSqlContainer, type StartedPostgreSqlContainer } from '@testcontainers/postgresql';
import { execSync } from 'child_process';
import pg from 'pg';
import { describe, expect, it, vi } from 'vitest';
import { PrismaClient } from '../../../../generated/prisma/client';
import type { AgentMessage, AgentRunner, Cost } from '../../agent-runner.types';
import type { CommandExecutor } from '../../coder/coder.types';
import type { IssueFetcher, Plan } from '../../planner/planner.types';
import { createPipelineApi } from '../pipeline-api';
import type { PipelineConfig } from '../pipeline.types';

let container: StartedPostgreSqlContainer;
let prisma: PrismaClient;
let pool: pg.Pool;

beforeAll(async () => {
  container = await new PostgreSqlContainer('postgres:16').start();
  const databaseUrl = container.getConnectionUri();
  execSync('npx prisma migrate deploy', {
    env: { ...process.env, DATABASE_URL: databaseUrl },
    stdio: 'pipe',
  });
  pool = new pg.Pool({ connectionString: databaseUrl });
  prisma = new PrismaClient({ adapter: new PrismaPg(pool) });
});

afterAll(async () => {
  // Allow background pipelines from fire-and-forget startRun to settle
  await new Promise((r) => setTimeout(r, 500));
  await prisma.$disconnect();
  await pool.end();
  await container.stop();
});

const zeroCost: Cost = { inputTokens: 0, outputTokens: 0, costUsd: 0 };
const emptyPlan: Plan = { summary: 'Empty', tasks: [] };
const singleTaskPlan: Plan = {
  summary: 'One task.',
  tasks: [{ issueNumber: 1, title: 'Task one', acceptanceCriteria: ['works'], dependencies: [], complexity: 'small' }],
};
const approvalJson = JSON.stringify({ verdict: 'approve', summary: 'LGTM', issues: [] });

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
      yield responses[Math.min(callIndex++, responses.length - 1)];
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

const testInput = () => ({
  config: testConfig(),
  issueFetcher: mockFetcher,
  getDiff: async () => '',
});

describe('createPipelineApi', () => {
  it('should create an api with startRun, getRunStatus, cancelRun, resumeRun', () => {
    const api = createPipelineApi(prisma);

    expect(api.startRun).toBeTypeOf('function');
    expect(api.getRunStatus).toBeTypeOf('function');
    expect(api.cancelRun).toBeTypeOf('function');
    expect(api.resumeRun).toBeTypeOf('function');
  });
});

describe('startRun', () => {
  it('should return a run ID and persist to database', async () => {
    const api = createPipelineApi(prisma);

    const runId = await api.startRun(testInput());

    expect(runId).toBeTypeOf('string');
    expect(runId.length).toBeGreaterThan(0);

    const run = await prisma.run.findUnique({ where: { id: runId } });
    expect(run).not.toBeNull();
    expect(run?.repo).toBe('owner/repo');
  });

  it('should track run status as running initially', async () => {
    const api = createPipelineApi(prisma);

    const runId = await api.startRun(testInput());
    const status = await api.getRunStatus(runId);

    expect(status?.state).toBe('running');
  });
});

describe('getRunStatus', () => {
  it('should return null for unknown run ID', async () => {
    const api = createPipelineApi(prisma);

    expect(await api.getRunStatus('nonexistent')).toBeNull();
  });

  it('should return completed after pipeline finishes', async () => {
    const api = createPipelineApi(prisma);
    const completingConfig: PipelineConfig = {
      ...testConfig(),
      planner: {
        runner: buildRunner('claude', [planResponse(singleTaskPlan), planResponse(emptyPlan)]),
        model: 'claude-opus',
      },
      coder: { runner: buildRunner('claude', [resultMessage('Coded')]), model: 'claude-sonnet' },
      reviewer: {
        runner: buildRunner('openai', [resultMessage('```json\n' + approvalJson + '\n```')]),
        model: 'gpt-4o',
      },
    };
    const runId = await api.startRun({ config: completingConfig, issueFetcher: mockFetcher, getDiff: async () => '' });

    await vi.waitFor(async () => {
      const status = await api.getRunStatus(runId);
      expect(status?.state).toBe('completed');
    });
  });
});

describe('cancelRun', () => {
  it('should return false for unknown run ID', async () => {
    const api = createPipelineApi(prisma);

    expect(await api.cancelRun('nonexistent')).toBe(false);
  });

  it('should return true and abort a running pipeline', async () => {
    const api = createPipelineApi(prisma);
    const runId = await api.startRun(testInput());

    expect(await api.cancelRun(runId)).toBe(true);
  });
});

const twoTaskPlan: Plan = {
  summary: 'Two tasks.',
  tasks: [
    { issueNumber: 1, title: 'Task one', acceptanceCriteria: ['works'], dependencies: [], complexity: 'small' },
    { issueNumber: 2, title: 'Task two', acceptanceCriteria: ['also works'], dependencies: [], complexity: 'small' },
  ],
};

describe('resumeRun', () => {
  it('should return false for unknown run ID', async () => {
    const api = createPipelineApi(prisma);

    expect(await api.resumeRun('nonexistent', testInput())).toBe(false);
  });

  it('should return false for a completed run', async () => {
    const api = createPipelineApi(prisma);
    const config: PipelineConfig = {
      ...testConfig(),
      planner: {
        runner: buildRunner('claude', [planResponse(singleTaskPlan), planResponse(emptyPlan)]),
        model: 'claude-opus',
      },
      coder: { runner: buildRunner('claude', [resultMessage('Coded')]), model: 'claude-sonnet' },
      reviewer: {
        runner: buildRunner('openai', [resultMessage('```json\n' + approvalJson + '\n```')]),
        model: 'gpt-4o',
      },
    };
    const runId = await api.startRun({ config, issueFetcher: mockFetcher, getDiff: async () => '' });

    await vi.waitFor(async () => {
      const status = await api.getRunStatus(runId);
      expect(status?.state).toBe('completed');
    });

    expect(await api.resumeRun(runId, testInput())).toBe(false);
  });

  it('should resume a partially completed run and finish remaining tasks', async () => {
    const api = createPipelineApi(prisma);

    // Seed a run that looks like it was interrupted after completing task 1
    const run = await prisma.run.create({
      data: { repo: 'owner/repo', epicNumber: 10, config: {}, status: 'in_progress', planSummary: 'Two tasks.' },
    });
    await prisma.planTask.createMany({
      data: twoTaskPlan.tasks.map((t, i) => ({
        runId: run.id,
        orderIndex: i,
        issueNumber: t.issueNumber ?? 0,
        title: t.title,
        acceptanceCriteria: t.acceptanceCriteria,
        dependencies: t.dependencies,
        complexity: t.complexity,
      })),
    });
    await prisma.issue.create({
      data: { runId: run.id, issueNumber: 1, title: 'Task one', status: 'done', costUsd: 0.05 },
    });

    // Resume — should pick up task 2 only
    const resumeConfig: PipelineConfig = {
      ...testConfig(),
      planner: { runner: buildRunner('claude', [planResponse(emptyPlan)]), model: 'claude-opus' },
      coder: { runner: buildRunner('claude', [resultMessage('Coded on resume')]), model: 'claude-sonnet' },
      reviewer: {
        runner: buildRunner('openai', [resultMessage('```json\n' + approvalJson + '\n```')]),
        model: 'gpt-4o',
      },
    };

    const resumed = await api.resumeRun(run.id, {
      config: resumeConfig,
      issueFetcher: mockFetcher,
      getDiff: async () => '',
    });
    expect(resumed).toBe(true);

    await vi.waitFor(async () => {
      const status = await api.getRunStatus(run.id);
      expect(status?.state).toBe('completed');
    });

    const issues = await prisma.issue.findMany({ where: { runId: run.id }, orderBy: { issueNumber: 'asc' } });
    expect(issues).toHaveLength(2);
    expect(issues[0].issueNumber).toBe(1);
    expect(issues[1].issueNumber).toBe(2);
  });
});
