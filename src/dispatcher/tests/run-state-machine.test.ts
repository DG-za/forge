import { describe, it, expect } from 'vitest';
import { transitionRun, RUN_TRANSITIONS } from '../run-state-machine';
import { InvalidTransitionError } from '../invalid-transition.error';
import type { RunState } from '../state-machine.types';

describe('transitionRun', () => {
  it('should allow pending → planning', () => {
    expect(transitionRun('pending', 'planning')).toBe('planning');
  });

  it('should allow planning → in_progress', () => {
    expect(transitionRun('planning', 'in_progress')).toBe('in_progress');
  });

  it('should allow planning → failed', () => {
    expect(transitionRun('planning', 'failed')).toBe('failed');
  });

  it('should allow in_progress → completed', () => {
    expect(transitionRun('in_progress', 'completed')).toBe('completed');
  });

  it('should allow in_progress → failed', () => {
    expect(transitionRun('in_progress', 'failed')).toBe('failed');
  });

  it('should reject pending → completed', () => {
    expect(() => transitionRun('pending', 'completed')).toThrow(
      InvalidTransitionError,
    );
  });

  it('should reject pending → in_progress', () => {
    expect(() => transitionRun('pending', 'in_progress')).toThrow(
      InvalidTransitionError,
    );
  });

  it('should reject completed → pending (terminal state)', () => {
    expect(() => transitionRun('completed', 'pending')).toThrow(
      InvalidTransitionError,
    );
  });

  it('should reject failed → pending (terminal state)', () => {
    expect(() => transitionRun('failed', 'pending')).toThrow(
      InvalidTransitionError,
    );
  });

  it('should include entity and states in the error', () => {
    try {
      transitionRun('pending', 'completed');
    } catch (error) {
      expect(error).toBeInstanceOf(InvalidTransitionError);
      const e = error as InvalidTransitionError;
      expect(e.entity).toBe('run');
      expect(e.from).toBe('pending');
      expect(e.to).toBe('completed');
    }
  });
});

describe('RUN_TRANSITIONS', () => {
  it('should have no outgoing transitions for completed', () => {
    expect(RUN_TRANSITIONS.completed).toEqual([]);
  });

  it('should have no outgoing transitions for failed', () => {
    expect(RUN_TRANSITIONS.failed).toEqual([]);
  });

  it('should cover all RunState values', () => {
    const allStates: RunState[] = [
      'pending',
      'planning',
      'in_progress',
      'completed',
      'failed',
    ];
    expect(Object.keys(RUN_TRANSITIONS).sort()).toEqual(allStates.sort());
  });
});
