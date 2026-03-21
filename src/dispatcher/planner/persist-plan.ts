import type { PrismaClient } from '../../../generated/prisma/client.js';
import type { Plan } from './planner.types';

export async function persistPlan(prisma: PrismaClient, runId: string, plan: Plan): Promise<void> {
  await prisma.$transaction(async (tx) => {
    await tx.planTask.deleteMany({ where: { runId } });

    await tx.planTask.createMany({
      data: plan.tasks.map((task, index) => ({
        runId,
        orderIndex: index,
        issueNumber: task.issueNumber,
        title: task.title,
        acceptanceCriteria: task.acceptanceCriteria,
        dependencies: task.dependencies,
        complexity: task.complexity,
      })),
    });
  });
}
