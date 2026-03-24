import type { PipelineApi, RunStatus } from '@/dispatcher/pipeline/pipeline-api';
import { describe, expect, it, vi } from 'vitest';

const { mockFindMany, mockFindUnique } = vi.hoisted(() => ({
  mockFindMany: vi.fn(),
  mockFindUnique: vi.fn(),
}));

vi.mock('@/shared/db', () => ({
  prisma: { run: { findMany: mockFindMany, findUnique: mockFindUnique } },
}));

import { getRun, getRuns, getRunStatus } from './queries';

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
    mockFindMany.mockResolvedValue([sampleRun]);

    const runs = await getRuns();

    expect(mockFindMany).toHaveBeenCalledWith({
      select: { id: true, status: true, repo: true, epicNumber: true, totalCostUsd: true, createdAt: true },
      orderBy: { createdAt: 'desc' },
    });
    expect(runs).toEqual([sampleRun]);
  });

  it('should return empty array when no runs exist', async () => {
    mockFindMany.mockResolvedValue([]);

    const runs = await getRuns();

    expect(runs).toEqual([]);
  });
});

describe('getRun', () => {
  it('should return run detail with issues, agent logs, and plan tasks', async () => {
    mockFindUnique.mockResolvedValue(sampleRunDetail);

    const run = await getRun('run-1');

    expect(mockFindUnique).toHaveBeenCalledWith({
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
    mockFindUnique.mockResolvedValue(null);

    const run = await getRun('nonexistent');

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
