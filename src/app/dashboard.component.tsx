'use client';

import { useMemo } from 'react';
import { RunCard } from './run-card.component';
import { RunListEmpty } from './run-list-empty.component';
import type { RunSummary } from './runs/runs.types';
import { useRunEvents } from './use-run-events.hook';

export function Dashboard({ runs: initialRuns }: { runs: RunSummary[] }) {
  const events = useRunEvents();

  const runs = useMemo(() => {
    const statusOverrides = new Map<string, string>();
    for (const event of events) {
      if (event.kind === 'run') {
        statusOverrides.set(event.transition.runId, event.transition.to);
      }
    }
    if (statusOverrides.size === 0) return initialRuns;

    return initialRuns.map((run) => {
      const newStatus = statusOverrides.get(run.id);
      return newStatus ? { ...run, status: newStatus } : run;
    });
  }, [initialRuns, events]);

  if (runs.length === 0) return <RunListEmpty />;

  return (
    <div className="mt-4 space-y-3">
      {runs.map((run) => (
        <RunCard key={run.id} run={run} />
      ))}
    </div>
  );
}
