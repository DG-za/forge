import type { Cost } from '../agent-runner.types';
import type { CommandExecutor, CoderTask, QualityGateConfig } from '../coder/coder.types';
import type { RoleConfig } from '../pipeline/pipeline.types';

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

export type AgentCompleteEvent = {
  role: 'coder' | 'reviewer';
  platform: string;
  model: string;
  cost: Cost;
  durationMs: number;
};

export type WorkerResult = {
  issueNumber: number;
  status: 'done' | 'failed' | 'escalated';
  cost: Cost;
  prUrl: string | null;
  branch: string;
};
