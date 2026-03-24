/**
 * Dispatcher — reads an epic's sub-issues and dispatches worker agents.
 */

export type { AgentMessage, AgentRunner, Cost, Platform, RunOptions } from './agent-runner.types';
export { ClaudeRunner } from './claude-runner.utils';
export * from './coder';
export { addCost } from './cost.utils';
export { InvalidTransitionError } from './invalid-transition.error';
export { ISSUE_TRANSITIONS, transitionIssue } from './issue-state-machine.utils';
export { OpenAIRunner } from './openai-runner.utils';
export * from './pipeline';
export * from './planner';
export * from './reviewer';
export { RUN_TRANSITIONS, transitionRun } from './run-state-machine.utils';
export { createStateEmitter, type StateEmitter } from './state-emitter.utils';
export type {
  IssueState,
  IssueTransition,
  RunState,
  RunTransition,
  StateChangeEvent,
  StateChangeListener,
} from './state-machine.types';
export { persistIssueTransition, persistRunTransition } from './state-persistence.utils';
