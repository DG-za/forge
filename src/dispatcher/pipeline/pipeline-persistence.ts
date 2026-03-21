import type { PrismaClient } from '../../../generated/prisma/client.js';
import type { Cost } from '../agent-runner.types';
import { persistPlan } from '../planner/persist-plan';
import type { Plan, PlannedTask } from '../planner/planner.types';
import { persistRunTransition } from '../state-persistence';
import type { RunState, StateChangeListener } from '../state-machine.types';

type IssueStatus = 'done' | 'failed' | 'escalated';

export type PipelinePersistence = {
  transitionRun(to: RunState): Promise<void>;
  savePlan(plan: Plan): Promise<void>;
  createIssue(task: PlannedTask): Promise<string>;
  completeIssue(issueId: string, status: IssueStatus, cost: Cost): Promise<void>;
  updateTotalCost(totalCost: Cost): Promise<void>;
};

export function createPipelinePersistence(
  prisma: PrismaClient,
  runId: string,
  onStateChange?: StateChangeListener,
): PipelinePersistence {
  return {
    async transitionRun(to) {
      await persistRunTransition(prisma, runId, to, onStateChange);
    },

    async savePlan(plan) {
      await persistPlan(prisma, runId, plan);
      await prisma.run.update({ where: { id: runId }, data: { planSummary: plan.summary } });
    },

    async createIssue(task) {
      const issue = await prisma.issue.create({
        data: {
          runId,
          issueNumber: task.issueNumber ?? 0,
          title: task.title,
        },
      });
      return issue.id;
    },

    async completeIssue(issueId, status, cost) {
      await prisma.issue.update({
        where: { id: issueId },
        data: {
          status,
          costUsd: cost.costUsd,
          inputTokens: cost.inputTokens,
          outputTokens: cost.outputTokens,
        },
      });
    },

    async updateTotalCost(totalCost) {
      await prisma.run.update({
        where: { id: runId },
        data: { totalCostUsd: totalCost.costUsd },
      });
    },
  };
}
