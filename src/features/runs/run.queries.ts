import type { PipelineApi, RunStatus } from '@/dispatcher/pipeline/pipeline-api';
import { prisma } from '@/shared/db';
import type { RunDetail, RunSummary } from './run.types';

export async function getRuns(): Promise<RunSummary[]> {
  return prisma.run.findMany({
    select: { id: true, status: true, repo: true, epicNumber: true, totalCostUsd: true, createdAt: true },
    orderBy: { createdAt: 'desc' },
  });
}

export async function getRun(runId: string): Promise<RunDetail | null> {
  return prisma.run.findUnique({
    where: { id: runId },
    include: {
      issues: {
        orderBy: { createdAt: 'asc' },
        include: { agentLogs: { orderBy: { createdAt: 'asc' } } },
      },
      planTasks: { orderBy: { orderIndex: 'asc' } },
    },
  });
}

export async function getRunStatus(runId: string, api: PipelineApi): Promise<RunStatus | null> {
  return api.getRunStatus(runId);
}
