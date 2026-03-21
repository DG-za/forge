import { InvalidTransitionError } from './invalid-transition.error';
import type { IssueState } from './state-machine.types';

export const ISSUE_TRANSITIONS: Record<IssueState, IssueState[]> = {
  queued: ['coding'],
  coding: ['gates', 'failed'],
  gates: ['reviewing', 'coding'],
  reviewing: ['done', 'fixing', 'escalated'],
  fixing: ['gates', 'failed'],
  done: [],
  failed: [],
  escalated: [],
};

export function transitionIssue(from: IssueState, to: IssueState): IssueState {
  if (!ISSUE_TRANSITIONS[from].includes(to)) {
    throw new InvalidTransitionError('issue', from, to);
  }
  return to;
}
