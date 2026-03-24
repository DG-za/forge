// @vitest-environment jsdom
import type { StateChangeEvent } from '@/dispatcher/state-machine.types';
import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { useRunEvents } from './use-run-events.hook';

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

  it('should return events as they arrive', () => {
    const { result } = renderHook(() => useRunEvents());
    const source = MockEventSource.instances[0];

    const event: StateChangeEvent = {
      kind: 'run',
      transition: { runId: 'run-1', from: 'pending', to: 'planning' },
    };

    act(() => source.simulateMessage(event));

    expect(result.current).toHaveLength(1);
    expect(result.current[0]).toEqual(event);
  });

  it('should accumulate multiple events', () => {
    const { result } = renderHook(() => useRunEvents());
    const source = MockEventSource.instances[0];

    act(() => {
      source.simulateMessage({ kind: 'run', transition: { runId: 'r1', from: 'pending', to: 'planning' } });
      source.simulateMessage({ kind: 'run', transition: { runId: 'r1', from: 'planning', to: 'in_progress' } });
    });

    expect(result.current).toHaveLength(2);
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

    // Simulate tab hidden
    Object.defineProperty(document, 'hidden', { value: true, configurable: true });
    act(() => document.dispatchEvent(new Event('visibilitychange')));
    expect(initialSource.closed).toBe(true);

    // Simulate tab visible
    Object.defineProperty(document, 'hidden', { value: false, configurable: true });
    act(() => document.dispatchEvent(new Event('visibilitychange')));
    expect(MockEventSource.instances).toHaveLength(2);
    expect(MockEventSource.instances[1].closed).toBe(false);
  });

  it('should reconnect on error', async () => {
    renderHook(() => useRunEvents());
    const source = MockEventSource.instances[0];

    act(() => source.onerror?.());

    // Wait for reconnect timeout
    await act(async () => {
      await new Promise((r) => setTimeout(r, 1100));
    });

    expect(MockEventSource.instances).toHaveLength(2);
    expect(MockEventSource.instances[1].closed).toBe(false);
  });
});
