import type { StateChangeEvent, StateChangeListener } from './state-machine.types';

export type StateEmitter = {
  on(listener: StateChangeListener): void;
  off(listener: StateChangeListener): void;
  emit(event: StateChangeEvent): void;
};

export function createStateEmitter(): StateEmitter {
  const listeners = new Set<StateChangeListener>();

  return {
    on: (listener) => listeners.add(listener),
    off: (listener) => listeners.delete(listener),
    emit: (event) => listeners.forEach((listener) => listener(event)),
  };
}
