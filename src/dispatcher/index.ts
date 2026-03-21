/**
 * Dispatcher — reads an epic's sub-issues and dispatches worker agents.
 */

export type { AgentMessage, AgentRunner, Cost, Platform, RunOptions } from './agent-runner.types';
export { ClaudeRunner } from './claude-runner';
export { InvalidTransitionError } from './invalid-transition.error';
export { ISSUE_TRANSITIONS, transitionIssue } from './issue-state-machine';
export { OpenAIRunner } from './openai-runner';
export { RUN_TRANSITIONS, transitionRun } from './run-state-machine';
export { createStateEmitter, type StateEmitter } from './state-emitter';
export type {
  IssueState,
  IssueTransition,
  RunState,
  RunTransition,
  StateChangeEvent,
  StateChangeListener,
} from './state-machine.types';
export { persistIssueTransition, persistRunTransition } from './state-persistence';
