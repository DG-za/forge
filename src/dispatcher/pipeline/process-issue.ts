import type { Cost, Platform } from '../agent-runner.types';
import type { CoderTask, CommandExecutor, QualityGateConfig } from '../coder/coder.types';
import { runCoder } from '../coder/run-coder';
import { addCost } from '../cost.utils';
import { runReviewer } from '../reviewer/run-reviewer';
import type { IssueOutcome, RoleConfig } from './pipeline.types';

export type AgentCompleteEvent = {
  role: 'coder' | 'reviewer';
  platform: Platform;
  model: string;
  cost: Cost;
  durationMs: number;
};

export type ProcessIssueOptions = {
  task: CoderTask;
  coder: RoleConfig;
  reviewer: RoleConfig;
  gateConfig: QualityGateConfig;
  cwd: string;
  maxBudgetUsd: number;
  exec: CommandExecutor;
  getDiff: () => Promise<string>;
  onAgentComplete?: (event: AgentCompleteEvent) => Promise<void>;
};

export async function processIssue(options: ProcessIssueOptions): Promise<IssueOutcome> {
  let totalCost: Cost = { inputTokens: 0, outputTokens: 0, costUsd: 0 };
  const issueNumber = options.task.issueNumber ?? 0;

  const coderStart = Date.now();
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
  await options.onAgentComplete?.({
    role: 'coder',
    platform: options.coder.runner.platform,
    model: options.coder.model,
    cost: coderResult.cost,
    durationMs: Date.now() - coderStart,
  });

  if (!coderResult.gatesPassed) {
    return { issueNumber, status: 'failed', cost: totalCost };
  }

  const diff = await options.getDiff();
  const remainingBudget = options.maxBudgetUsd - totalCost.costUsd;

  const reviewerStart = Date.now();
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
  await options.onAgentComplete?.({
    role: 'reviewer',
    platform: options.reviewer.runner.platform,
    model: options.reviewer.model,
    cost: reviewResult.cost,
    durationMs: Date.now() - reviewerStart,
  });

  if (reviewResult.escalated) {
    return { issueNumber, status: 'escalated', cost: totalCost };
  }

  return { issueNumber, status: 'done', cost: totalCost };
}
