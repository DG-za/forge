import type { Cost } from '../agent-runner.types';

export type CoderTask = {
  issueNumber: number | null;
  title: string;
  body: string;
  acceptanceCriteria: string[];
};

export type QualityGateConfig = {
  lintCommand: string;
  typecheckCommand: string;
  testCommand: string;
};

export type GateKind = 'lint' | 'typecheck' | 'test';

export type GateResult = {
  gate: GateKind;
  passed: boolean;
  output: string;
};

export type QualityGateResult = {
  passed: boolean;
  gates: GateResult[];
};

export type CommandExecutor = (command: string, cwd: string) => Promise<{ exitCode: number; output: string }>;

export type CoderResult = {
  cost: Cost;
  gatesPassed: boolean;
  attempts: number;
};
