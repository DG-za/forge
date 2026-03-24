import { describe, expect, it, vi } from 'vitest';
import { createStateEmitter } from '../state-emitter.utils';
import type { StateChangeEvent } from '../state-machine.types';

const runEvent: StateChangeEvent = {
  kind: 'run',
  transition: { runId: 'run-1', from: 'pending', to: 'planning' },
};

const issueEvent: StateChangeEvent = {
  kind: 'issue',
  transition: { issueId: 'issue-1', from: 'queued', to: 'coding' },
};

describe('createStateEmitter', () => {
  it('should emit events to a registered listener', () => {
    const emitter = createStateEmitter();
    const listener = vi.fn();

    emitter.on(listener);
    emitter.emit(runEvent);

    expect(listener).toHaveBeenCalledWith(runEvent);
  });

  it('should emit events to multiple listeners', () => {
    const emitter = createStateEmitter();
    const listener1 = vi.fn();
    const listener2 = vi.fn();

    emitter.on(listener1);
    emitter.on(listener2);
    emitter.emit(issueEvent);

    expect(listener1).toHaveBeenCalledWith(issueEvent);
    expect(listener2).toHaveBeenCalledWith(issueEvent);
  });

  it('should stop emitting to removed listeners', () => {
    const emitter = createStateEmitter();
    const listener = vi.fn();

    emitter.on(listener);
    emitter.off(listener);
    emitter.emit(runEvent);

    expect(listener).not.toHaveBeenCalled();
  });

  it('should not error when emitting with no listeners', () => {
    const emitter = createStateEmitter();
    expect(() => emitter.emit(runEvent)).not.toThrow();
  });

  it('should not add the same listener twice', () => {
    const emitter = createStateEmitter();
    const listener = vi.fn();

    emitter.on(listener);
    emitter.on(listener);
    emitter.emit(runEvent);

    expect(listener).toHaveBeenCalledTimes(1);
  });
});
