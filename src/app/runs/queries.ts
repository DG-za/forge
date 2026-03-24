import type { PipelineApi } from '@/dispatcher/pipeline/pipeline-api';
import type { PrismaClient } from '../../../generated/prisma/client.js';
import type { RunDetail, RunSummary } from './runs.types';

export async function getRuns(prisma: PrismaClient): Promise<RunSummary[]> {
  return prisma.run.findMany({
    select: { id: true, status: true, repo: true, epicNumber: true, totalCostUsd: true, createdAt: true },
    orderBy: { createdAt: 'desc' },
  });
}

export async function getRun(runId: string, prisma: PrismaClient): Promise<RunDetail | null> {
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

export async function getRunStatus(runId: string, api: PipelineApi) {
  return api.getRunStatus(runId);
}
