/**
 * AgentRunner — platform-agnostic interface for running AI coding agents.
 *
 * Implementations: ClaudeRunner, OpenAIRunner
 * See docs/decisions/001-multi-platform-agent-support.md
 */

export type Platform = 'claude' | 'openai';

export type RunOptions = {
  model: string;
  systemPrompt: string;
  cwd: string;
  maxTurns: number;
  maxBudgetUsd: number;
  allowedTools: string[];
};

export type Cost = {
  inputTokens: number;
  outputTokens: number;
  costUsd: number;
};

export type ProgressMessage = {
  type: 'progress';
  text: string;
};

export type ToolUseMessage = {
  type: 'tool_use';
  tool: string;
  input: string;
};

export type ResultMessage = {
  type: 'result';
  text: string;
  cost: Cost;
  durationMs: number;
  turns: number;
};

export type ErrorMessage = {
  type: 'error';
  text: string;
  cost: Cost;
};

export type AgentMessage =
  | ProgressMessage
  | ToolUseMessage
  | ResultMessage
  | ErrorMessage;

export interface AgentRunner {
  readonly platform: Platform;
  run(task: string, options: RunOptions): AsyncGenerator<AgentMessage>;
}
