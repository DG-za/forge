// @vitest-environment jsdom
import type { StateChangeEvent } from '@/dispatcher/state-machine.types';
import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { useRunEvents } from '@/features/runs/use-run-events.hook';

type EventSourceListener = (e: MessageEvent) => void;

class MockEventSource {
  static instances: MockEventSource[] = [];
  url: string;
  onmessage: EventSourceListener | null = null;
  onerror: (() => void) | null = null;
  closed = false;

  constructor(url: string) {
    this.url = url;
    MockEventSource.instances.push(this);
  }

  close() {
    this.closed = true;
  }

  simulateMessage(event: StateChangeEvent) {
    this.onmessage?.({ data: JSON.stringify(event) } as MessageEvent);
  }
}

beforeEach(() => {
  MockEventSource.instances = [];
  globalThis.EventSource = MockEventSource as unknown as typeof EventSource;
});

afterEach(() => {
  delete (globalThis as Record<string, unknown>).EventSource;
});

describe('useRunEvents', () => {
  it('should connect to SSE endpoint', () => {
    renderHook(() => useRunEvents());

    expect(MockEventSource.instances).toHaveLength(1);
    expect(MockEventSource.instances[0].url).toBe('/api/runs/events');
  });

  it('should pass runId as query param when provided', () => {
    renderHook(() => useRunEvents('run-123'));

    expect(MockEventSource.instances[0].url).toBe('/api/runs/events?runId=run-123');
  });

  it('should return latest status per run', () => {
    const { result } = renderHook(() => useRunEvents());
    const source = MockEventSource.instances[0];

    act(() => {
      source.simulateMessage({ kind: 'run', transition: { runId: 'run-1', from: 'pending', to: 'planning' } });
    });

    expect(result.current.get('run-1')).toBe('planning');
  });

  it('should keep only latest status when multiple events arrive for same run', () => {
    const { result } = renderHook(() => useRunEvents());
    const source = MockEventSource.instances[0];

    act(() => {
      source.simulateMessage({ kind: 'run', transition: { runId: 'r1', from: 'pending', to: 'planning' } });
      source.simulateMessage({ kind: 'run', transition: { runId: 'r1', from: 'planning', to: 'in_progress' } });
    });

    expect(result.current.get('r1')).toBe('in_progress');
    expect(result.current.size).toBe(1);
  });

  it('should track multiple runs independently', () => {
    const { result } = renderHook(() => useRunEvents());
    const source = MockEventSource.instances[0];

    act(() => {
      source.simulateMessage({ kind: 'run', transition: { runId: 'r1', from: 'pending', to: 'planning' } });
      source.simulateMessage({ kind: 'run', transition: { runId: 'r2', from: 'pending', to: 'in_progress' } });
    });

    expect(result.current.get('r1')).toBe('planning');
    expect(result.current.get('r2')).toBe('in_progress');
    expect(result.current.size).toBe(2);
  });

  it('should ignore non-run events', () => {
    const { result } = renderHook(() => useRunEvents());
    const source = MockEventSource.instances[0];

    act(() => {
      source.simulateMessage({
        kind: 'budget_warning',
        warning: { runId: 'r1', currentCostUsd: 8, budgetUsd: 10, percentUsed: 0.8 },
      });
    });

    expect(result.current.size).toBe(0);
  });

  it('should close connection on unmount', () => {
    const { unmount } = renderHook(() => useRunEvents());
    const source = MockEventSource.instances[0];

    unmount();

    expect(source.closed).toBe(true);
  });

  it('should disconnect when tab is hidden and reconnect when visible', () => {
    renderHook(() => useRunEvents());
    const initialSource = MockEventSource.instances[0];
    expect(initialSource.closed).toBe(false);

    Object.defineProperty(document, 'hidden', { value: true, configurable: true });
    act(() => document.dispatchEvent(new Event('visibilitychange')));
    expect(initialSource.closed).toBe(true);

    Object.defineProperty(document, 'hidden', { value: false, configurable: true });
    act(() => document.dispatchEvent(new Event('visibilitychange')));
    expect(MockEventSource.instances).toHaveLength(2);
    expect(MockEventSource.instances[1].closed).toBe(false);
  });

  it('should reconnect on error', async () => {
    renderHook(() => useRunEvents());
    const source = MockEventSource.instances[0];

    act(() => source.onerror?.());

    await act(async () => {
      await new Promise((r) => setTimeout(r, 1100));
    });

    expect(MockEventSource.instances).toHaveLength(2);
    expect(MockEventSource.instances[1].closed).toBe(false);
  });
});
