import { PrismaClient } from '../../../generated/prisma/client.js';
import { PrismaPg } from '@prisma/adapter-pg';
import { PostgreSqlContainer, type StartedPostgreSqlContainer } from '@testcontainers/postgresql';
import { execSync } from 'child_process';
import pg from 'pg';

let container: StartedPostgreSqlContainer;
let prisma: PrismaClient;
let pool: pg.Pool;

beforeAll(async () => {
  container = await new PostgreSqlContainer('postgres:16').start();

  const databaseUrl = container.getConnectionUri();

  execSync(`npx prisma migrate deploy`, {
    env: { ...process.env, DATABASE_URL: databaseUrl },
    stdio: 'pipe',
  });

  pool = new pg.Pool({ connectionString: databaseUrl });
  const adapter = new PrismaPg(pool);
  prisma = new PrismaClient({ adapter });
});

afterAll(async () => {
  await prisma.$disconnect();
  await pool.end();
  await container.stop();
});

describe('Prisma schema', () => {
  it('should create a run with config JSON', async () => {
    const run = await prisma.run.create({
      data: {
        repo: 'DG-za/forge',
        epicNumber: 1,
        budgetUsd: 10.0,
        config: {
          planner: { platform: 'claude', model: 'claude-opus-4-6' },
          coder: { platform: 'openai', model: 'gpt-5.3-codex' },
          reviewer: { platform: 'claude', model: 'claude-sonnet-4-6' },
        },
      },
    });

    expect(run.id).toBeDefined();
    expect(run.status).toBe('pending');
    expect(run.repo).toBe('DG-za/forge');
    expect(run.budgetUsd).toBe(10.0);
    expect(run.config).toEqual({
      planner: { platform: 'claude', model: 'claude-opus-4-6' },
      coder: { platform: 'openai', model: 'gpt-5.3-codex' },
      reviewer: { platform: 'claude', model: 'claude-sonnet-4-6' },
    });
  });

  it('should create issues linked to a run', async () => {
    const run = await prisma.run.create({
      data: {
        repo: 'DG-za/test-repo',
        epicNumber: 5,
        config: {},
      },
    });

    const issue = await prisma.issue.create({
      data: {
        runId: run.id,
        issueNumber: 42,
        title: 'Add user authentication',
      },
    });

    expect(issue.status).toBe('queued');
    expect(issue.costUsd).toBe(0);
    expect(issue.inputTokens).toBe(0);
    expect(issue.outputTokens).toBe(0);
  });

  it('should create agent logs linked to an issue', async () => {
    const run = await prisma.run.create({
      data: {
        repo: 'DG-za/test-repo',
        epicNumber: 3,
        config: {},
      },
    });

    const issue = await prisma.issue.create({
      data: {
        runId: run.id,
        issueNumber: 7,
        title: 'Fix login bug',
      },
    });

    const log = await prisma.agentLog.create({
      data: {
        issueId: issue.id,
        role: 'coder',
        platform: 'claude',
        model: 'claude-sonnet-4-6',
        inputTokens: 5000,
        outputTokens: 2000,
        costUsd: 0.045,
        durationMs: 12000,
        result: 'Implemented fix for login validation',
      },
    });

    expect(log.role).toBe('coder');
    expect(log.costUsd).toBe(0.045);
  });

  it('should query runs with nested issues and agent logs', async () => {
    const run = await prisma.run.create({
      data: {
        repo: 'DG-za/nested-test',
        epicNumber: 10,
        config: {},
        issues: {
          create: {
            issueNumber: 1,
            title: 'First issue',
            agentLogs: {
              create: {
                role: 'planner',
                platform: 'openai',
                model: 'gpt-5.3',
                inputTokens: 1000,
                outputTokens: 500,
                costUsd: 0.01,
                durationMs: 3000,
              },
            },
          },
        },
      },
      include: {
        issues: {
          include: { agentLogs: true },
        },
      },
    });

    expect(run.issues).toHaveLength(1);
    expect(run.issues[0].agentLogs).toHaveLength(1);
    expect(run.issues[0].agentLogs[0].platform).toBe('openai');
  });

  it('should support all run status enum values', async () => {
    const statuses = ['pending', 'planning', 'in_progress', 'completed', 'failed'] as const;

    for (const status of statuses) {
      const run = await prisma.run.create({
        data: {
          repo: 'DG-za/enum-test',
          epicNumber: 1,
          status,
          config: {},
        },
      });
      expect(run.status).toBe(status);
    }
  });

  it('should support all issue status enum values', async () => {
    const run = await prisma.run.create({
      data: { repo: 'DG-za/enum-test', epicNumber: 2, config: {} },
    });

    const statuses = ['queued', 'coding', 'gates', 'reviewing', 'fixing', 'done', 'failed', 'escalated'] as const;

    for (const status of statuses) {
      const issue = await prisma.issue.create({
        data: {
          runId: run.id,
          issueNumber: 1,
          title: `Status: ${status}`,
          status,
        },
      });
      expect(issue.status).toBe(status);
    }
  });

  it('should aggregate costs across agent logs for an issue', async () => {
    const run = await prisma.run.create({
      data: { repo: 'DG-za/cost-test', epicNumber: 1, config: {} },
    });

    const issue = await prisma.issue.create({
      data: { runId: run.id, issueNumber: 1, title: 'Cost test' },
    });

    await prisma.agentLog.createMany({
      data: [
        { issueId: issue.id, role: 'coder', platform: 'claude', model: 'sonnet', inputTokens: 5000, outputTokens: 2000, costUsd: 0.045, durationMs: 10000 },
        { issueId: issue.id, role: 'reviewer', platform: 'openai', model: 'gpt-5.3', inputTokens: 3000, outputTokens: 1000, costUsd: 0.024, durationMs: 8000 },
        { issueId: issue.id, role: 'coder', platform: 'claude', model: 'sonnet', inputTokens: 2000, outputTokens: 1000, costUsd: 0.021, durationMs: 5000 },
      ],
    });

    const aggregate = await prisma.agentLog.aggregate({
      where: { issueId: issue.id },
      _sum: { costUsd: true, inputTokens: true, outputTokens: true },
    });

    expect(aggregate._sum.costUsd).toBeCloseTo(0.09);
    expect(aggregate._sum.inputTokens).toBe(10000);
    expect(aggregate._sum.outputTokens).toBe(4000);
  });
});
