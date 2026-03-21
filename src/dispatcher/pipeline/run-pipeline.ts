import type { Cost } from '../agent-runner.types';
import { addCost } from '../cost.utils';
import type { CompletedIssue, EpicContext, IssueFetcher, Plan, PlannedTask } from '../planner/planner.types';
import { replan, runPlanner } from '../planner/run-planner';
import type { StateChangeEvent, StateChangeListener } from '../state-machine.types';
import type { IssueOutcome, PipelineConfig, PipelineResult } from './pipeline.types';
import { processIssue } from './process-issue';

export type RunPipelineOptions = {
  runId: string;
  config: PipelineConfig;
  issueFetcher: IssueFetcher;
  getDiff: () => Promise<string>;
  signal?: AbortSignal;
};

export type FullPipelineResult = PipelineResult & { plan: Plan };

export async function runPipeline(options: RunPipelineOptions): Promise<FullPipelineResult> {
  const { runId, config, issueFetcher, signal } = options;
  const emit = buildEmitter(config.onStateChange);
  let totalCost: Cost = { inputTokens: 0, outputTokens: 0, costUsd: 0 };
  const outcomes: IssueOutcome[] = [];

  emit({ kind: 'run', transition: { runId, from: 'pending', to: 'planning' } });

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
  } catch {
    emit({ kind: 'run', transition: { runId, from: 'planning', to: 'failed' } });
    return { runId, totalCost, outcomes, plan: { tasks: [], summary: '' }, ...counters(outcomes) };
  }

  emit({ kind: 'run', transition: { runId, from: 'planning', to: 'in_progress' } });

  let remainingTasks = [...plan.tasks];

  while (remainingTasks.length > 0) {
    if (signal?.aborted) break;
    if (totalCost.costUsd >= config.maxBudgetUsd) break;

    const task = remainingTasks.shift()!;
    const remainingBudget = config.maxBudgetUsd - totalCost.costUsd;

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
    } catch {
      outcomes.push({
        issueNumber: task.issueNumber ?? 0,
        status: 'failed',
        cost: { inputTokens: 0, outputTokens: 0, costUsd: 0 },
      });
    }

    if (remainingTasks.length > 0) {
      const replanResult = await tryReplan(config, epicContext, plan, outcomes);
      if (replanResult) {
        totalCost = addCost(totalCost, replanResult.cost);
        remainingTasks = replanResult.tasks;
      }
    }
  }

  const finalState = outcomes.some((o) => o.status === 'done') ? 'completed' : 'failed';
  emit({ kind: 'run', transition: { runId, from: 'in_progress', to: finalState } });

  return { runId, totalCost, outcomes, plan, ...counters(outcomes) };
}

function counters(outcomes: IssueOutcome[]) {
  return {
    completedCount: outcomes.filter((o) => o.status === 'done').length,
    failedCount: outcomes.filter((o) => o.status === 'failed').length,
    escalatedCount: outcomes.filter((o) => o.status === 'escalated').length,
  };
}

async function tryReplan(
  config: PipelineConfig,
  epicContext: EpicContext,
  originalPlan: Plan,
  outcomes: IssueOutcome[],
): Promise<{ tasks: PlannedTask[]; cost: Cost } | null> {
  try {
    const result = await replan({
      runner: config.planner.runner,
      model: config.planner.model,
      epicContext,
      maxBudgetUsd: config.maxBudgetUsd,
      replanContext: {
        originalPlan,
        completedIssues: toCompletedIssues(outcomes),
        remainingIssues: epicContext.issues.filter(
          (i) => !outcomes.some((o) => o.issueNumber === i.number),
        ),
      },
    });
    return { tasks: result.plan.tasks, cost: result.cost };
  } catch {
    return null;
  }
}

function toCompletedIssues(outcomes: IssueOutcome[]): CompletedIssue[] {
  return outcomes.map((o) => ({
    issueNumber: o.issueNumber,
    outcome: o.status,
    notes: '',
  }));
}

function buildEmitter(listener?: StateChangeListener): (event: StateChangeEvent) => void {
  return listener ? (event) => listener(event) : () => {};
}
