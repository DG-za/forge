import type { AgentRunner, Cost } from '../agent-runner.types';
import type { CommandExecutor, QualityGateConfig } from '../coder/coder.types';
import type { StateChangeListener } from '../state-machine.types';

export type RoleConfig = {
  runner: AgentRunner;
  model: string;
};

export type PipelineConfig = {
  repo: string;
  epicNumber: number;
  planner: RoleConfig;
  coder: RoleConfig;
  reviewer: RoleConfig;
  gateConfig: QualityGateConfig;
  cwd: string;
  maxBudgetUsd: number;
  exec: CommandExecutor;
  onStateChange?: StateChangeListener;
};

export type IssueOutcome = {
  issueNumber: number;
  status: 'done' | 'failed' | 'escalated';
  cost: Cost;
};

export type PipelineResult = {
  runId: string;
  totalCost: Cost;
  outcomes: IssueOutcome[];
  completedCount: number;
  failedCount: number;
  escalatedCount: number;
};
