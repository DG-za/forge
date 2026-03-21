import type { PrismaClient } from '../../../generated/prisma/client.js';
import type { Cost } from '../agent-runner.types';
import { addCost } from '../cost.utils';
import type { IssueFetcher, Plan } from '../planner/planner.types';
import { runPlanner } from '../planner/run-planner';
import type { RunState, StateChangeEvent, StateChangeListener } from '../state-machine.types';
import { createPipelinePersistence, type PipelinePersistence } from './pipeline-persistence';
import type { IssueOutcome, PipelineConfig, PipelineResult } from './pipeline.types';
import { processIssue } from './process-issue';
import { tryReplan } from './try-replan';

export type RunPipelineOptions = {
  runId: string;
  config: PipelineConfig;
  issueFetcher: IssueFetcher;
  getDiff: () => Promise<string>;
  signal?: AbortSignal;
  prisma?: PrismaClient;
};

export type FullPipelineResult = PipelineResult & { plan: Plan };

export async function runPipeline(options: RunPipelineOptions): Promise<FullPipelineResult> {
  const { runId, config, issueFetcher, signal } = options;
  const emit = buildEmitter(config.onStateChange);
  const db = options.prisma ? createPipelinePersistence(options.prisma, runId, config.onStateChange) : null;
  let totalCost: Cost = { inputTokens: 0, outputTokens: 0, costUsd: 0 };
  const outcomes: IssueOutcome[] = [];

  await transitionRun(db, emit, runId, 'pending', 'planning');

  const epicContext = await issueFetcher.fetchEpic(config.repo, config.epicNumber);

  let plan: Plan;
  try {
    const planResult = await runPlanner({
      runner: config.planner.runner,
      model: config.planner.model,
      epicContext,
      maxBudgetUsd: config.maxBudgetUsd,
    });
    totalCost = addCost(totalCost, planResult.cost);
    plan = planResult.plan;
    await db?.savePlan(plan);
  } catch {
    await transitionRun(db, emit, runId, 'planning', 'failed');
    return { runId, totalCost, outcomes, plan: { tasks: [], summary: '' }, ...counters(outcomes) };
  }

  await transitionRun(db, emit, runId, 'planning', 'in_progress');

  let remainingTasks = [...plan.tasks];

  while (remainingTasks.length > 0) {
    if (signal?.aborted) break;
    if (totalCost.costUsd >= config.maxBudgetUsd) break;

    const task = remainingTasks.shift()!;
    const remainingBudget = config.maxBudgetUsd - totalCost.costUsd;
    const issueId = await db?.createIssue(task);

    try {
      const outcome = await processIssue({
        task: {
          issueNumber: task.issueNumber,
          title: task.title,
          body: '',
          acceptanceCriteria: task.acceptanceCriteria,
        },
        coder: config.coder,
        reviewer: config.reviewer,
        gateConfig: config.gateConfig,
        cwd: config.cwd,
        maxBudgetUsd: remainingBudget,
        exec: config.exec,
        getDiff: options.getDiff,
      });

      totalCost = addCost(totalCost, outcome.cost);
      outcomes.push(outcome);
      if (issueId) await db?.completeIssue(issueId, outcome.status, outcome.cost);
    } catch {
      const failedOutcome: IssueOutcome = {
        issueNumber: task.issueNumber ?? 0,
        status: 'failed',
        cost: { inputTokens: 0, outputTokens: 0, costUsd: 0 },
      };
      outcomes.push(failedOutcome);
      if (issueId) await db?.completeIssue(issueId, 'failed', failedOutcome.cost);
    }

    await db?.updateTotalCost(totalCost);

    if (remainingTasks.length > 0) {
      const replanResult = await tryReplan(config, epicContext, plan, outcomes);
      if (replanResult) {
        totalCost = addCost(totalCost, replanResult.cost);
        remainingTasks = replanResult.tasks;
        await db?.savePlan({ tasks: replanResult.tasks, summary: plan.summary });
      }
    }
  }

  const finalState = outcomes.some((o) => o.status === 'done') ? 'completed' : 'failed';
  await transitionRun(db, emit, runId, 'in_progress', finalState);

  return { runId, totalCost, outcomes, plan, ...counters(outcomes) };
}

function counters(outcomes: IssueOutcome[]) {
  return {
    completedCount: outcomes.filter((o) => o.status === 'done').length,
    failedCount: outcomes.filter((o) => o.status === 'failed').length,
    escalatedCount: outcomes.filter((o) => o.status === 'escalated').length,
  };
}

async function transitionRun(
  db: PipelinePersistence | null,
  emit: (event: StateChangeEvent) => void,
  runId: string,
  from: RunState,
  to: RunState,
): Promise<void> {
  if (db) {
    await db.transitionRun(to);
  } else {
    emit({ kind: 'run', transition: { runId, from, to } });
  }
}

function buildEmitter(listener?: StateChangeListener): (event: StateChangeEvent) => void {
  return listener ? (event) => listener(event) : () => {};
}
