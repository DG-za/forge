import type { Cost } from '../agent-runner.types';
import type { CompletedIssue, EpicContext, Plan, PlannedTask } from '../planner/planner.types';
import { replan } from '../planner/run-planner';
import type { IssueOutcome, PipelineConfig } from './pipeline.types';

export async function tryReplan(
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
