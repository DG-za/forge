import type { StateChangeEvent } from '@/dispatcher/state-machine.types';
import { useEffect, useRef, useState } from 'react';

const RECONNECT_DELAY_MS = 1000;

export function useRunEvents(runId?: string): StateChangeEvent[] {
  const [events, setEvents] = useState<StateChangeEvent[]>([]);
  const sourceRef = useRef<EventSource | null>(null);

  useEffect(() => {
    let reconnectTimer: ReturnType<typeof setTimeout>;

    function connect() {
      const url = runId ? `/api/runs/events?runId=${runId}` : '/api/runs/events';
      const source = new EventSource(url);
      sourceRef.current = source;

      source.onmessage = (e) => {
        const event = JSON.parse(e.data) as StateChangeEvent;
        setEvents((prev) => [...prev, event]);
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

  return events;
}
