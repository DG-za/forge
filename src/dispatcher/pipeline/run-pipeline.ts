import type { Cost } from '../agent-runner.types';
import type { IssueFetcher, Plan } from '../planner/planner.types';
import { runPlanner } from '../planner/run-planner';
import type { StateChangeEvent, StateChangeListener } from '../state-machine.types';
import type { IssueOutcome, PipelineConfig, PipelineResult } from './pipeline.types';
import { processIssue } from './process-issue';

export type RunPipelineOptions = {
  config: PipelineConfig;
  issueFetcher: IssueFetcher;
  getDiff: () => Promise<string>;
  signal?: AbortSignal;
};

export type FullPipelineResult = PipelineResult & { plan: Plan };

export async function runPipeline(options: RunPipelineOptions): Promise<FullPipelineResult> {
  const { config, issueFetcher, signal } = options;
  const emit = buildEmitter(config.onStateChange);
  let totalCost: Cost = { inputTokens: 0, outputTokens: 0, costUsd: 0 };
  const outcomes: IssueOutcome[] = [];

  emit({ kind: 'run', transition: { runId: '', from: 'pending', to: 'planning' } });

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
    emit({ kind: 'run', transition: { runId: '', from: 'planning', to: 'failed' } });
    return { runId: '', totalCost, outcomes, plan: { tasks: [], summary: '' }, ...counters(outcomes) };
  }

  emit({ kind: 'run', transition: { runId: '', from: 'planning', to: 'in_progress' } });

  for (const task of plan.tasks) {
    if (signal?.aborted) break;
    if (totalCost.costUsd >= config.maxBudgetUsd) break;

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
  }

  const finalState = outcomes.some((o) => o.status === 'done') ? 'completed' : 'failed';
  emit({ kind: 'run', transition: { runId: '', from: 'in_progress', to: finalState } });

  return { runId: '', totalCost, outcomes, plan, ...counters(outcomes) };
}

function counters(outcomes: IssueOutcome[]) {
  return {
    completedCount: outcomes.filter((o) => o.status === 'done').length,
    failedCount: outcomes.filter((o) => o.status === 'failed').length,
    escalatedCount: outcomes.filter((o) => o.status === 'escalated').length,
  };
}

function buildEmitter(listener?: StateChangeListener): (event: StateChangeEvent) => void {
  return listener ? (event) => listener(event) : () => {};
}

function addCost(a: Cost, b: Cost): Cost {
  return {
    inputTokens: a.inputTokens + b.inputTokens,
    outputTokens: a.outputTokens + b.outputTokens,
    costUsd: a.costUsd + b.costUsd,
  };
}
