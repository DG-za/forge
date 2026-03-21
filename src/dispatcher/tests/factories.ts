import type { PrismaClient } from '../../../generated/prisma/client.js';

export function buildRunData(overrides: Record<string, unknown> = {}) {
  return {
    repo: 'DG-za/forge',
    epicNumber: 1,
    config: {},
    ...overrides,
  };
}

export async function createRun(prisma: PrismaClient, overrides: Record<string, unknown> = {}) {
  return prisma.run.create({ data: buildRunData(overrides) });
}

export async function createIssue(prisma: PrismaClient, runId: string, overrides: Record<string, unknown> = {}) {
  return prisma.issue.create({
    data: {
      runId,
      issueNumber: 1,
      title: 'Test issue',
      ...overrides,
    },
  });
}
