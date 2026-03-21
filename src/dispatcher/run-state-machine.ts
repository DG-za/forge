import { InvalidTransitionError } from './invalid-transition.error';
import type { RunState } from './state-machine.types';

export const RUN_TRANSITIONS: Record<RunState, RunState[]> = {
  pending: ['planning'],
  planning: ['in_progress', 'failed'],
  in_progress: ['completed', 'failed'],
  completed: [],
  failed: [],
};

export function transitionRun(from: RunState, to: RunState): RunState {
  if (!RUN_TRANSITIONS[from].includes(to)) {
    throw new InvalidTransitionError('run', from, to);
  }
  return to;
}
