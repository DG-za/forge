import type { RunState, StateChangeEvent } from '@/dispatcher/state-machine.types';
import { useEffect, useRef, useState } from 'react';

const RECONNECT_DELAY_MS = 1000;

/** Returns a map of runId → latest RunState, updated in real-time via SSE. */
export function useRunEvents(runId?: string): Map<string, RunState> {
  const [statusMap, setStatusMap] = useState<Map<string, RunState>>(new Map());
  const sourceRef = useRef<EventSource | null>(null);

  useEffect(() => {
    let reconnectTimer: ReturnType<typeof setTimeout>;

    function connect() {
      const url = runId ? `/api/runs/events?runId=${runId}` : '/api/runs/events';
      const source = new EventSource(url);
      sourceRef.current = source;

      source.onmessage = (e) => {
        const event = JSON.parse(e.data) as StateChangeEvent;
        if (event.kind !== 'run') return;
        const { runId: id, to } = event.transition;
        setStatusMap((prev) => new Map(prev).set(id, to));
      };

      source.onerror = () => {
        source.close();
        reconnectTimer = setTimeout(connect, RECONNECT_DELAY_MS);
      };
    }

    function disconnect() {
      clearTimeout(reconnectTimer);
      sourceRef.current?.close();
      sourceRef.current = null;
    }

    function handleVisibility() {
      if (document.hidden) {
        disconnect();
      } else if (!sourceRef.current) {
        connect();
      }
    }

    connect();
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibility);
      disconnect();
    };
  }, [runId]);

  return statusMap;
}
