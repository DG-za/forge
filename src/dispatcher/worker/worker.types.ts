import type { Cost } from '../agent-runner.types';
import type { CoderTask, CommandExecutor, QualityGateConfig } from '../coder/coder.types';
import type { RoleConfig } from '../pipeline/pipeline.types';
import type { AgentCompleteEvent } from '../pipeline/process-issue.utils';

export type { AgentCompleteEvent };

export type RepoConfig = {
  repo: string;
  basePath: string;
};

export type WorkerOptions = {
  task: CoderTask;
  repoConfig: RepoConfig;
  coder: RoleConfig;
  reviewer: RoleConfig;
  gateConfig: QualityGateConfig;
  maxBudgetUsd: number;
  exec: CommandExecutor;
  onAgentComplete?: (event: AgentCompleteEvent) => Promise<void>;
};

export type WorkerResult = {
  issueNumber: number;
  status: 'done' | 'failed' | 'escalated';
  cost: Cost;
  prUrl: string | null;
  branch: string;
};
