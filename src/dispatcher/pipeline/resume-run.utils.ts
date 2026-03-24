import type { Cost } from '../agent-runner.types';
import { addCost } from '../cost.utils';
import type { Plan, PlannedTask, TaskComplexity } from '../planner/planner.types';
import type { IssueOutcome } from './pipeline.types';

export type PersistedPlanTask = {
  orderIndex: number;
  issueNumber: number | null;
  title: string;
  acceptanceCriteria: string[];
  dependencies: number[];
  complexity: string;
};

export type PersistedIssue = {
  issueNumber: number;
  status: string;
  costUsd: number;
  inputTokens: number;
  outputTokens: number;
};

export type PersistedRun = {
  planTasks: PersistedPlanTask[];
  planSummary: string | null;
  issues: PersistedIssue[];
};

export type ResumeState = {
  startingCost: Cost;
  completedOutcomes: IssueOutcome[];
  initialPlan: Plan;
  remainingTasks: PlannedTask[];
};

export function computeResumeState(run: PersistedRun): ResumeState {
  const completedNumbers = new Set(run.issues.map((i) => i.issueNumber));

  const completedOutcomes: IssueOutcome[] = run.issues.map((i) => ({
    issueNumber: i.issueNumber,
    status: i.status as IssueOutcome['status'],
    cost: { inputTokens: i.inputTokens, outputTokens: i.outputTokens, costUsd: i.costUsd },
  }));

  const startingCost = completedOutcomes.reduce((total, o) => addCost(total, o.cost), {
    inputTokens: 0,
    outputTokens: 0,
    costUsd: 0,
  });

  const sortedTasks = [...run.planTasks].sort((a, b) => a.orderIndex - b.orderIndex);
  const allTasks: PlannedTask[] = sortedTasks.map(toPlannedTask);

  const remainingTasks = sortedTasks.filter((t) => !completedNumbers.has(t.issueNumber ?? -1)).map(toPlannedTask);

  return {
    startingCost,
    completedOutcomes,
    initialPlan: { tasks: allTasks, summary: run.planSummary ?? '' },
    remainingTasks,
  };
}

function toPlannedTask(t: PersistedPlanTask): PlannedTask {
  return {
    issueNumber: t.issueNumber,
    title: t.title,
    acceptanceCriteria: t.acceptanceCriteria,
    dependencies: t.dependencies,
    complexity: t.complexity as TaskComplexity,
  };
}
