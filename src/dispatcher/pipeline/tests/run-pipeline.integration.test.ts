import { PrismaPg } from '@prisma/adapter-pg';
import { PostgreSqlContainer, type StartedPostgreSqlContainer } from '@testcontainers/postgresql';
import { execSync } from 'child_process';
import pg from 'pg';
import { describe, expect, it } from 'vitest';
import { PrismaClient } from '../../../../generated/prisma/client.js';
import type { AgentMessage, AgentRunner, Cost } from '../../agent-runner.types';
import type { CommandExecutor } from '../../coder/coder.types';
import type { IssueFetcher, Plan } from '../../planner/planner.types';
import type { PipelineConfig } from '../pipeline.types';
import { runPipeline } from '../run-pipeline';

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
  await prisma.$disconnect();
  await pool.end();
  await container.stop();
});

const zeroCost: Cost = { inputTokens: 0, outputTokens: 0, costUsd: 0 };
const smallCost: Cost = { inputTokens: 100, outputTokens: 50, costUsd: 0.01 };

const simplePlan: Plan = {
  summary: 'Two tasks.',
  tasks: [
    { issueNumber: 1, title: 'Task one', acceptanceCriteria: ['works'], dependencies: [], complexity: 'small' },
    { issueNumber: 2, title: 'Task two', acceptanceCriteria: ['also works'], dependencies: [1], complexity: 'small' },
  ],
};
const emptyPlan: Plan = { summary: 'No tasks.', tasks: [] };
const remainingPlan: Plan = { summary: 'Remaining.', tasks: [simplePlan.tasks[1]] };

const approvalJson = JSON.stringify({ verdict: 'approve', summary: 'LGTM', issues: [] });

function resultMessage(text: string, cost: Cost = zeroCost): AgentMessage {
  return { type: 'result', text, cost, durationMs: 100, turns: 1 };
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

const allPassExec: CommandExecutor = async () => ({ exitCode: 0, output: '' });

const mockFetcher: IssueFetcher = {
  async fetchEpic() {
    return {
      repo: 'owner/repo',
      epicNumber: 10,
      epicTitle: 'Test epic',
      epicBody: 'Epic body',
      issues: [
        { number: 1, title: 'Task one', body: 'Do task one', labels: [], state: 'open' as const },
        { number: 2, title: 'Task two', body: 'Do task two', labels: [], state: 'open' as const },
      ],
      repoIssues: [],
    };
  },
};

function testConfig(overrides: Partial<PipelineConfig> = {}): PipelineConfig {
  return {
    repo: 'owner/repo',
    epicNumber: 10,
    planner: {
      runner: buildRunner('claude', [planResponse(simplePlan), planResponse(remainingPlan), planResponse(emptyPlan)]),
      model: 'claude-opus',
    },
    coder: { runner: buildRunner('claude', [resultMessage('Coded', smallCost)]), model: 'claude-sonnet' },
    reviewer: {
      runner: buildRunner('openai', [resultMessage('```json\n' + approvalJson + '\n```', smallCost)]),
      model: 'gpt-4o',
    },
    gateConfig: { lintCommand: 'lint', typecheckCommand: 'tsc', testCommand: 'test' },
    cwd: '/repo',
    maxBudgetUsd: 50,
    exec: allPassExec,
    ...overrides,
  };
}

async function createTestRun() {
  return prisma.run.create({
    data: { repo: 'owner/repo', epicNumber: 10, config: {} },
  });
}

describe('runPipeline with persistence', () => {
  it('should transition run state through planning → in_progress → completed', async () => {
    const run = await createTestRun();

    await runPipeline({
      runId: run.id,
      config: testConfig(),
      issueFetcher: mockFetcher,
      getDiff: async () => 'diff',
      prisma,
    });

    const updated = await prisma.run.findUniqueOrThrow({ where: { id: run.id } });
    expect(updated.status).toBe('completed');
  });

  it('should create issue rows for each planned task', async () => {
    const run = await createTestRun();

    await runPipeline({
      runId: run.id,
      config: testConfig(),
      issueFetcher: mockFetcher,
      getDiff: async () => 'diff',
      prisma,
    });

    const issues = await prisma.issue.findMany({ where: { runId: run.id }, orderBy: { issueNumber: 'asc' } });
    expect(issues).toHaveLength(2);
    expect(issues[0].issueNumber).toBe(1);
    expect(issues[1].issueNumber).toBe(2);
  });

  it('should persist plan tasks to database', async () => {
    const run = await createTestRun();

    await runPipeline({
      runId: run.id,
      config: testConfig(),
      issueFetcher: mockFetcher,
      getDiff: async () => 'diff',
      prisma,
    });

    const planTasks = await prisma.planTask.findMany({
      where: { runId: run.id },
      orderBy: { orderIndex: 'asc' },
    });
    // After re-planning, DB has the final plan's tasks
    expect(planTasks.length).toBeGreaterThanOrEqual(1);
  });

  it('should update issue status to done on success', async () => {
    const run = await createTestRun();

    await runPipeline({
      runId: run.id,
      config: testConfig(),
      issueFetcher: mockFetcher,
      getDiff: async () => 'diff',
      prisma,
    });

    const issues = await prisma.issue.findMany({ where: { runId: run.id } });
    expect(issues.every((i) => i.status === 'done')).toBe(true);
  });

  it('should update totalCostUsd on run after completion', async () => {
    const run = await createTestRun();

    await runPipeline({
      runId: run.id,
      config: testConfig(),
      issueFetcher: mockFetcher,
      getDiff: async () => 'diff',
      prisma,
    });

    const updated = await prisma.run.findUniqueOrThrow({ where: { id: run.id } });
    expect(updated.totalCostUsd).toBeGreaterThan(0);
  });

  it('should persist planSummary on run', async () => {
    const run = await createTestRun();

    await runPipeline({
      runId: run.id,
      config: testConfig(),
      issueFetcher: mockFetcher,
      getDiff: async () => 'diff',
      prisma,
    });

    const updated = await prisma.run.findUniqueOrThrow({ where: { id: run.id } });
    expect(updated.planSummary).toBe('Two tasks.');
  });

  it('should write AgentLog records for planner, coder, and reviewer', async () => {
    const planCost: Cost = { inputTokens: 500, outputTokens: 200, costUsd: 0.05 };
    const coderCost: Cost = { inputTokens: 100, outputTokens: 50, costUsd: 0.01 };
    const reviewerCost: Cost = { inputTokens: 200, outputTokens: 100, costUsd: 0.02 };

    const singleTaskPlan: Plan = {
      summary: 'One task.',
      tasks: [
        { issueNumber: 1, title: 'Task one', acceptanceCriteria: ['works'], dependencies: [], complexity: 'small' },
      ],
    };

    const run = await createTestRun();
    await runPipeline({
      runId: run.id,
      config: testConfig({
        planner: {
          runner: buildRunner('claude', [planResponse(singleTaskPlan, planCost), planResponse(emptyPlan)]),
          model: 'claude-opus',
        },
        coder: { runner: buildRunner('claude', [resultMessage('Coded', coderCost)]), model: 'claude-sonnet' },
        reviewer: {
          runner: buildRunner('openai', [resultMessage('```json\n' + approvalJson + '\n```', reviewerCost)]),
          model: 'gpt-4o',
        },
      }),
      issueFetcher: mockFetcher,
      getDiff: async () => 'diff',
      prisma,
    });

    const logs = await prisma.agentLog.findMany({
      where: { issue: { runId: run.id } },
      orderBy: { createdAt: 'asc' },
    });

    const plannerLogs = logs.filter((l) => l.role === 'planner');
    const coderLogs = logs.filter((l) => l.role === 'coder');
    const reviewerLogs = logs.filter((l) => l.role === 'reviewer');

    expect(plannerLogs).toHaveLength(1);
    expect(plannerLogs[0].platform).toBe('claude');
    expect(plannerLogs[0].model).toBe('claude-opus');
    expect(plannerLogs[0].costUsd).toBe(0.05);
    expect(plannerLogs[0].inputTokens).toBe(500);

    expect(coderLogs).toHaveLength(1);
    expect(coderLogs[0].platform).toBe('claude');
    expect(coderLogs[0].model).toBe('claude-sonnet');
    expect(coderLogs[0].costUsd).toBe(0.01);

    expect(reviewerLogs).toHaveLength(1);
    expect(reviewerLogs[0].platform).toBe('openai');
    expect(reviewerLogs[0].model).toBe('gpt-4o');
    expect(reviewerLogs[0].costUsd).toBe(0.02);
  });
});
