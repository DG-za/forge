import type { PipelineApi, RunStatus } from '@/dispatcher/pipeline/pipeline-api';
import { describe, expect, it, vi } from 'vitest';
import { getRun, getRuns, getRunStatus } from './queries';

function buildMockPrisma(data: { runs?: unknown[]; run?: unknown | null }) {
  return {
    run: {
      findMany: vi.fn().mockResolvedValue(data.runs ?? []),
      findUnique: vi.fn().mockResolvedValue(data.run ?? null),
    },
  };
}

function buildMockApi(status: RunStatus | null = null): PipelineApi {
  return {
    startRun: vi.fn(),
    getRunStatus: vi.fn().mockResolvedValue(status),
    cancelRun: vi.fn(),
    resumeRun: vi.fn(),
  };
}

const sampleRun = {
  id: 'run-1',
  status: 'completed',
  repo: 'owner/repo',
  epicNumber: 10,
  totalCostUsd: 1.25,
  createdAt: new Date('2026-01-01'),
};

const sampleRunDetail = {
  ...sampleRun,
  budgetUsd: 50,
  planSummary: 'A plan',
  updatedAt: new Date('2026-01-02'),
  issues: [
    {
      id: 'issue-1',
      issueNumber: 1,
      title: 'Task one',
      status: 'done',
      costUsd: 0.5,
      agentLogs: [
        {
          id: 'log-1',
          role: 'coder',
          platform: 'claude',
          model: 'sonnet',
          costUsd: 0.3,
          durationMs: 5000,
          createdAt: new Date(),
        },
      ],
    },
  ],
  planTasks: [
    {
      id: 'pt-1',
      orderIndex: 0,
      issueNumber: 1,
      title: 'Task one',
      acceptanceCriteria: ['works'],
      complexity: 'small',
    },
  ],
};

describe('getRuns', () => {
  it('should return runs ordered by createdAt desc', async () => {
    const prisma = buildMockPrisma({ runs: [sampleRun] });

    const runs = await getRuns(prisma as never);

    expect(prisma.run.findMany).toHaveBeenCalledWith({
      select: { id: true, status: true, repo: true, epicNumber: true, totalCostUsd: true, createdAt: true },
      orderBy: { createdAt: 'desc' },
    });
    expect(runs).toEqual([sampleRun]);
  });

  it('should return empty array when no runs exist', async () => {
    const prisma = buildMockPrisma({ runs: [] });

    const runs = await getRuns(prisma as never);

    expect(runs).toEqual([]);
  });
});

describe('getRun', () => {
  it('should return run detail with issues, agent logs, and plan tasks', async () => {
    const prisma = buildMockPrisma({ run: sampleRunDetail });

    const run = await getRun('run-1', prisma as never);

    expect(prisma.run.findUnique).toHaveBeenCalledWith({
      where: { id: 'run-1' },
      include: {
        issues: {
          orderBy: { createdAt: 'asc' },
          include: { agentLogs: { orderBy: { createdAt: 'asc' } } },
        },
        planTasks: { orderBy: { orderIndex: 'asc' } },
      },
    });
    expect(run).toEqual(sampleRunDetail);
  });

  it('should return null for missing run', async () => {
    const prisma = buildMockPrisma({ run: null });

    const run = await getRun('nonexistent', prisma as never);

    expect(run).toBeNull();
  });
});

describe('getRunStatus', () => {
  it('should delegate to PipelineApi.getRunStatus', async () => {
    const api = buildMockApi({ state: 'running' });

    const status = await getRunStatus('run-1', api);

    expect(api.getRunStatus).toHaveBeenCalledWith('run-1');
    expect(status).toEqual({ state: 'running' });
  });

  it('should return null for unknown run', async () => {
    const api = buildMockApi(null);

    const status = await getRunStatus('nonexistent', api);

    expect(status).toBeNull();
  });
});
