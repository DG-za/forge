import { describe, expect, it } from 'vitest';
import { InvalidTransitionError } from '../invalid-transition.error';
import { ISSUE_TRANSITIONS, transitionIssue } from '../issue-state-machine';
import type { IssueState } from '../state-machine.types';

describe('transitionIssue', () => {
  it('should allow queued → coding', () => {
    expect(transitionIssue('queued', 'coding')).toBe('coding');
  });

  it('should allow coding → gates', () => {
    expect(transitionIssue('coding', 'gates')).toBe('gates');
  });

  it('should allow coding → failed', () => {
    expect(transitionIssue('coding', 'failed')).toBe('failed');
  });

  it('should allow gates → reviewing', () => {
    expect(transitionIssue('gates', 'reviewing')).toBe('reviewing');
  });

  it('should allow gates → coding (gate failure, back to coder)', () => {
    expect(transitionIssue('gates', 'coding')).toBe('coding');
  });

  it('should allow reviewing → done', () => {
    expect(transitionIssue('reviewing', 'done')).toBe('done');
  });

  it('should allow reviewing → fixing', () => {
    expect(transitionIssue('reviewing', 'fixing')).toBe('fixing');
  });

  it('should allow reviewing → escalated', () => {
    expect(transitionIssue('reviewing', 'escalated')).toBe('escalated');
  });

  it('should allow fixing → gates', () => {
    expect(transitionIssue('fixing', 'gates')).toBe('gates');
  });

  it('should allow fixing → failed', () => {
    expect(transitionIssue('fixing', 'failed')).toBe('failed');
  });

  it('should reject queued → reviewing', () => {
    expect(() => transitionIssue('queued', 'reviewing')).toThrow(InvalidTransitionError);
  });

  it('should reject coding → done', () => {
    expect(() => transitionIssue('coding', 'done')).toThrow(InvalidTransitionError);
  });

  it('should reject gates → done (must go through reviewing)', () => {
    expect(() => transitionIssue('gates', 'done')).toThrow(InvalidTransitionError);
  });

  it('should reject fixing → reviewing (must go through gates)', () => {
    expect(() => transitionIssue('fixing', 'reviewing')).toThrow(InvalidTransitionError);
  });

  it('should reject done → queued (terminal state)', () => {
    expect(() => transitionIssue('done', 'queued')).toThrow(InvalidTransitionError);
  });

  it('should reject failed → queued (terminal state)', () => {
    expect(() => transitionIssue('failed', 'queued')).toThrow(InvalidTransitionError);
  });

  it('should reject escalated → queued (terminal state)', () => {
    expect(() => transitionIssue('escalated', 'queued')).toThrow(InvalidTransitionError);
  });

  it('should include entity and states in the error', () => {
    try {
      transitionIssue('queued', 'done');
    } catch (error) {
      expect(error).toBeInstanceOf(InvalidTransitionError);
      const e = error as InvalidTransitionError;
      expect(e.entity).toBe('issue');
      expect(e.from).toBe('queued');
      expect(e.to).toBe('done');
    }
  });
});

describe('ISSUE_TRANSITIONS', () => {
  it('should have no outgoing transitions for done', () => {
    expect(ISSUE_TRANSITIONS.done).toEqual([]);
  });

  it('should have no outgoing transitions for failed', () => {
    expect(ISSUE_TRANSITIONS.failed).toEqual([]);
  });

  it('should have no outgoing transitions for escalated', () => {
    expect(ISSUE_TRANSITIONS.escalated).toEqual([]);
  });

  it('should cover all IssueState values', () => {
    const allStates: IssueState[] = ['queued', 'coding', 'gates', 'reviewing', 'fixing', 'done', 'failed', 'escalated'];
    expect(Object.keys(ISSUE_TRANSITIONS).sort()).toEqual(allStates.sort());
  });
});
