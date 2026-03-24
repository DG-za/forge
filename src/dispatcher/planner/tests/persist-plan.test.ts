import { PrismaPg } from '@prisma/adapter-pg';
import { PostgreSqlContainer, type StartedPostgreSqlContainer } from '@testcontainers/postgresql';
import { execSync } from 'child_process';
import pg from 'pg';
import { describe, expect, it } from 'vitest';
import { PrismaClient } from '../../../../generated/prisma/client';
import { createRun } from '../../tests/factories';
import { persistPlan } from '../persist-plan';
import type { Plan } from '../planner.types';

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
  const adapter = new PrismaPg(pool);
  prisma = new PrismaClient({ adapter });
});

afterAll(async () => {
  await prisma.$disconnect();
  await pool.end();
  await container.stop();
});

const plan: Plan = {
  summary: 'Build the auth module',
  tasks: [
    {
      issueNumber: 42,
      title: 'Add login endpoint',
      acceptanceCriteria: ['POST /login returns JWT', 'Invalid creds return 401'],
      dependencies: [],
      complexity: 'medium',
    },
    {
      issueNumber: null,
      title: 'Add signup endpoint',
      acceptanceCriteria: ['POST /signup creates user'],
      dependencies: [42],
      complexity: 'small',
    },
  ],
};

describe('persistPlan', () => {
  it('should persist plan tasks with correct order', async () => {
    const run = await createRun(prisma);

    await persistPlan(prisma, run.id, plan);

    const tasks = await prisma.planTask.findMany({
      where: { runId: run.id },
      orderBy: { orderIndex: 'asc' },
    });

    expect(tasks).toHaveLength(2);
    expect(tasks[0].orderIndex).toBe(0);
    expect(tasks[0].title).toBe('Add login endpoint');
    expect(tasks[0].issueNumber).toBe(42);
    expect(tasks[1].orderIndex).toBe(1);
    expect(tasks[1].title).toBe('Add signup endpoint');
    expect(tasks[1].issueNumber).toBeNull();
  });

  it('should store acceptance criteria as array', async () => {
    const run = await createRun(prisma);
    await persistPlan(prisma, run.id, plan);

    const task = await prisma.planTask.findFirst({
      where: { runId: run.id, orderIndex: 0 },
    });

    expect(task!.acceptanceCriteria).toEqual(['POST /login returns JWT', 'Invalid creds return 401']);
  });

  it('should store dependencies as integer array', async () => {
    const run = await createRun(prisma);
    await persistPlan(prisma, run.id, plan);

    const task = await prisma.planTask.findFirst({
      where: { runId: run.id, orderIndex: 1 },
    });

    expect(task!.dependencies).toEqual([42]);
  });

  it('should replace existing plan tasks on re-plan', async () => {
    const run = await createRun(prisma);
    await persistPlan(prisma, run.id, plan);

    const revisedPlan: Plan = {
      summary: 'Revised plan',
      tasks: [
        {
          issueNumber: 43,
          title: 'Only remaining task',
          acceptanceCriteria: ['It works'],
          dependencies: [],
          complexity: 'large',
        },
      ],
    };

    await persistPlan(prisma, run.id, revisedPlan);

    const tasks = await prisma.planTask.findMany({ where: { runId: run.id } });
    expect(tasks).toHaveLength(1);
    expect(tasks[0].title).toBe('Only remaining task');
  });
});
