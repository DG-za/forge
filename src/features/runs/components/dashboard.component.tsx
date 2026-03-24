'use client';

import { useMemo } from 'react';
import type { RunSummary } from '../run.types';
import { useRunEvents } from '../use-run-events.hook';
import { RunCard } from './run-card.component';
import { RunListEmpty } from './run-list-empty.component';

export function Dashboard({ runs: initialRuns }: { runs: RunSummary[] }) {
  const statusMap = useRunEvents();

  const runs = useMemo(() => {
    if (statusMap.size === 0) return initialRuns;

    return initialRuns.map((run) => {
      const newStatus = statusMap.get(run.id);
      return newStatus ? { ...run, status: newStatus } : run;
    });
  }, [initialRuns, statusMap]);

  if (runs.length === 0) return <RunListEmpty />;

  return (
    <div className="mt-4 space-y-3">
      {runs.map((run) => (
        <RunCard key={run.id} run={run} />
      ))}
    </div>
  );
}
