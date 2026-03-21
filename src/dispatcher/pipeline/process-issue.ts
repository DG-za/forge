import type { Cost } from '../agent-runner.types';
import type { CommandExecutor, QualityGateConfig } from '../coder/coder.types';
import type { CoderTask } from '../coder/coder.types';
import { runCoder } from '../coder/run-coder';
import { runReviewer } from '../reviewer/run-reviewer';
import type { RoleConfig } from './pipeline.types';

export type ProcessIssueOptions = {
  task: CoderTask;
  coder: RoleConfig;
  reviewer: RoleConfig;
  gateConfig: QualityGateConfig;
  cwd: string;
  maxBudgetUsd: number;
  exec: CommandExecutor;
  getDiff: () => Promise<string>;
};

type IssueResult = {
  issueNumber: number;
  status: 'done' | 'failed' | 'escalated';
  cost: Cost;
};

export async function processIssue(options: ProcessIssueOptions): Promise<IssueResult> {
  let totalCost: Cost = { inputTokens: 0, outputTokens: 0, costUsd: 0 };
  const issueNumber = options.task.issueNumber ?? 0;

  const coderResult = await runCoder({
    runner: options.coder.runner,
    model: options.coder.model,
    task: options.task,
    gateConfig: options.gateConfig,
    cwd: options.cwd,
    maxBudgetUsd: options.maxBudgetUsd,
    exec: options.exec,
  });
  totalCost = addCost(totalCost, coderResult.cost);

  if (!coderResult.gatesPassed) {
    return { issueNumber, status: 'failed', cost: totalCost };
  }

  const diff = await options.getDiff();
  const remainingBudget = options.maxBudgetUsd - totalCost.costUsd;

  const reviewResult = await runReviewer({
    reviewerRunner: options.reviewer.runner,
    coderRunner: options.coder.runner,
    reviewerModel: options.reviewer.model,
    coderModel: options.coder.model,
    context: {
      diff,
      issueTitle: options.task.title,
      issueNumber: options.task.issueNumber,
      acceptanceCriteria: options.task.acceptanceCriteria,
    },
    gateConfig: options.gateConfig,
    cwd: options.cwd,
    maxBudgetUsd: remainingBudget,
    exec: options.exec,
  });
  totalCost = addCost(totalCost, reviewResult.cost);

  if (reviewResult.escalated) {
    return { issueNumber, status: 'escalated', cost: totalCost };
  }

  return { issueNumber, status: 'done', cost: totalCost };
}

function addCost(a: Cost, b: Cost): Cost {
  return {
    inputTokens: a.inputTokens + b.inputTokens,
    outputTokens: a.outputTokens + b.outputTokens,
    costUsd: a.costUsd + b.costUsd,
  };
}
