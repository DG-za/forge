import type { PrismaClient } from '../../../generated/prisma/client';
import type { Cost } from '../agent-runner.types';
import { addCost } from '../cost.utils';
import type { IssueFetcher, Plan, PlannedTask } from '../planner/planner.types';
import { runPlanner } from '../planner/run-planner';
import type { RunState, StateChangeEvent, StateChangeListener } from '../state-machine.types';
import { createPipelinePersistence, type PipelinePersistence } from './pipeline-persistence';
import type { IssueOutcome, PipelineConfig, PipelineResult } from './pipeline.types';
import { processIssue } from './process-issue';
import type { ResumeState } from './resume-run';
import { tryReplan } from './try-replan';

export type RunPipelineOptions = {
  runId: string;
  config: PipelineConfig;
  issueFetcher: IssueFetcher;
  getDiff: () => Promise<string>;
  signal?: AbortSignal;
  prisma?: PrismaClient;
  resumeState?: ResumeState;
};

export type FullPipelineResult = PipelineResult & { plan: Plan };

const BUDGET_WARNING_THRESHOLD = 0.8;

export async function runPipeline(options: RunPipelineOptions): Promise<FullPipelineResult> {
  const { runId, config, issueFetcher, signal, resumeState } = options;
  const emit = buildEmitter(config.onStateChange);
  const db = options.prisma ? createPipelinePersistence(options.prisma, runId, config.onStateChange) : null;
  let totalCost: Cost = resumeState?.startingCost ?? { inputTokens: 0, outputTokens: 0, costUsd: 0 };
  const outcomes: IssueOutcome[] = [...(resumeState?.completedOutcomes ?? [])];
  let budgetWarningEmitted = false;

  const epicContext = await issueFetcher.fetchEpic(config.repo, config.epicNumber);

  let plan: Plan;
  let remainingTasks: PlannedTask[];

  let plannerCost: Cost | undefined;
  let plannerDurationMs = 0;

  if (resumeState) {
    plan = resumeState.initialPlan;
    remainingTasks = [...resumeState.remainingTasks];
  } else {
    await transitionRun(db, emit, runId, 'pending', 'planning');

    try {
      const plannerStart = Date.now();
      const planResult = await runPlanner({
        runner: config.planner.runner,
        model: config.planner.model,
        epicContext,
        maxBudgetUsd: config.maxBudgetUsd,
      });
      plannerCost = planResult.cost;
      plannerDurationMs = Date.now() - plannerStart;
      totalCost = addCost(totalCost, planResult.cost);
      plan = planResult.plan;
      await db?.savePlan(plan);
    } catch {
      await transitionRun(db, emit, runId, 'planning', 'failed');
      return { runId, totalCost, outcomes, plan: { tasks: [], summary: '' }, ...counters(outcomes) };
    }

    await transitionRun(db, emit, runId, 'planning', 'in_progress');
    remainingTasks = [...plan.tasks];
  }

  while (remainingTasks.length > 0) {
    if (signal?.aborted) break;
    if (totalCost.costUsd >= config.maxBudgetUsd) break;

    const task = remainingTasks.shift()!;
    const remainingBudget = config.maxBudgetUsd - totalCost.costUsd;
    const issueId = await db?.createIssue(task);

    // Write planner AgentLog for initial plan (once, on first issue)
    if (plannerCost && outcomes.length === 0 && issueId) {
      await db?.createAgentLog({
        issueId,
        role: 'planner',
        platform: config.planner.runner.platform,
        model: config.planner.model,
        cost: plannerCost,
        durationMs: plannerDurationMs,
      });
    }

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
        onAgentComplete: issueId
          ? async (event) => {
              await db?.createAgentLog({ issueId, ...event });
            }
          : undefined,
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
    budgetWarningEmitted = checkBudgetWarning(emit, runId, totalCost, config.maxBudgetUsd, budgetWarningEmitted);

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

function checkBudgetWarning(
  emit: (event: StateChangeEvent) => void,
  runId: string,
  totalCost: Cost,
  maxBudgetUsd: number,
  alreadyEmitted: boolean,
): boolean {
  if (alreadyEmitted) return true;
  const percentUsed = totalCost.costUsd / maxBudgetUsd;
  if (percentUsed >= BUDGET_WARNING_THRESHOLD) {
    emit({
      kind: 'budget_warning',
      warning: { runId, currentCostUsd: totalCost.costUsd, budgetUsd: maxBudgetUsd, percentUsed },
    });
    return true;
  }
  return false;
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
