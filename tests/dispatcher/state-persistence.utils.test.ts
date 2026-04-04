import { PrismaPg } from '@prisma/adapter-pg';
import { PostgreSqlContainer, type StartedPostgreSqlContainer } from '@testcontainers/postgresql';
import { execSync } from 'child_process';
import pg from 'pg';
import { describe, expect, it, vi } from 'vitest';
import { PrismaClient } from '../../generated/prisma/client';
import { InvalidTransitionError } from '@/dispatcher/invalid-transition.error';
import type { StateChangeListener } from '@/dispatcher/state-machine.types';
import { persistIssueTransition, persistRunTransition } from '@/dispatcher/state-persistence.utils';
import { createIssue, createRun } from './factories.utils';

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

describe('persistRunTransition', () => {
  it('should persist a valid run transition to the database', async () => {
    const run = await createRun(prisma);

    const transition = await persistRunTransition({ prisma, runId: run.id, to: 'planning' });

    expect(transition.from).toBe('pending');
    expect(transition.to).toBe('planning');

    const updated = await prisma.run.findUniqueOrThrow({ where: { id: run.id } });
    expect(updated.status).toBe('planning');
  });

  it('should reject an invalid run transition and leave DB unchanged', async () => {
    const run = await createRun(prisma);

    await expect(persistRunTransition({ prisma, runId: run.id, to: 'completed' })).rejects.toThrow(InvalidTransitionError);

    const unchanged = await prisma.run.findUniqueOrThrow({ where: { id: run.id } });
    expect(unchanged.status).toBe('pending');
  });

  it('should call the state change listener on success', async () => {
    const run = await createRun(prisma);
    const listener: StateChangeListener = vi.fn();

    await persistRunTransition({ prisma, runId: run.id, to: 'planning', onStateChange: listener });

    expect(listener).toHaveBeenCalledWith({
      kind: 'run',
      transition: { runId: run.id, from: 'pending', to: 'planning' },
    });
  });

  it('should support resume — transition from mid-lifecycle state', async () => {
    const run = await createRun(prisma, { status: 'planning' });

    const transition = await persistRunTransition({ prisma, runId: run.id, to: 'in_progress' });

    expect(transition.from).toBe('planning');
    expect(transition.to).toBe('in_progress');
  });
});

describe('persistIssueTransition', () => {
  it('should persist a valid issue transition to the database', async () => {
    const run = await createRun(prisma);
    const issue = await createIssue(prisma, run.id);

    const transition = await persistIssueTransition({ prisma, issueId: issue.id, to: 'coding' });

    expect(transition.from).toBe('queued');
    expect(transition.to).toBe('coding');

    const updated = await prisma.issue.findUniqueOrThrow({ where: { id: issue.id } });
    expect(updated.status).toBe('coding');
  });

  it('should reject an invalid issue transition and leave DB unchanged', async () => {
    const run = await createRun(prisma);
    const issue = await createIssue(prisma, run.id);

    await expect(persistIssueTransition({ prisma, issueId: issue.id, to: 'done' })).rejects.toThrow(InvalidTransitionError);

    const unchanged = await prisma.issue.findUniqueOrThrow({ where: { id: issue.id } });
    expect(unchanged.status).toBe('queued');
  });

  it('should call the state change listener on success', async () => {
    const run = await createRun(prisma);
    const issue = await createIssue(prisma, run.id);
    const listener: StateChangeListener = vi.fn();

    await persistIssueTransition({ prisma, issueId: issue.id, to: 'coding', onStateChange: listener });

    expect(listener).toHaveBeenCalledWith({
      kind: 'issue',
      transition: { issueId: issue.id, from: 'queued', to: 'coding' },
    });
  });
});
