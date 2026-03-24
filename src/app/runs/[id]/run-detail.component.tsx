'use client';

import { formatCost } from '@/app/format.utils';
import { StatusBadge } from '@/app/status-badge.component';
import { useRunEvents } from '@/app/use-run-events.hook';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useState, useTransition } from 'react';
import type { RunDetail } from '../runs.types';
import { TERMINAL_RUN_STATUSES } from '../runs.types';
import { cancelRunAction } from './cancel-run.action';
import { IssueCard } from './issue-card.component';
import { PlanTaskList } from './plan-task-list.component';

type Props = {
  run: RunDetail;
  createdAtLabel: string;
  updatedAtLabel: string;
};

export function RunDetailView({ run, createdAtLabel, updatedAtLabel }: Props) {
  const statusMap = useRunEvents(run.id);
  const liveStatus = statusMap.get(run.id) ?? run.status;
  const isActive = !TERMINAL_RUN_STATUSES.has(liveStatus);
  const [isPending, startTransition] = useTransition();
  const [cancelError, setCancelError] = useState<string | null>(null);

  const budgetPercent = run.budgetUsd ? Math.min((run.totalCostUsd / run.budgetUsd) * 100, 100) : 0;
  const doneCount = run.issues.filter((i) => i.status === 'done').length;

  function handleCancel() {
    setCancelError(null);
    startTransition(async () => {
      const result = await cancelRunAction(run.id);
      if ('error' in result && result.error) setCancelError(result.error);
    });
  }

  return (
    <div className="space-y-6">
      <Header run={run} liveStatus={liveStatus} isActive={isActive} isPending={isPending} onCancel={handleCancel} />
      {cancelError && <p className="text-sm text-red-400">{cancelError}</p>}

      {run.budgetUsd && (
        <div className="space-y-1">
          <div className="text-text-muted flex justify-between text-xs">
            <span>
              {formatCost(run.totalCostUsd)} / {formatCost(run.budgetUsd)}
            </span>
            <span>{Math.round(budgetPercent)}%</span>
          </div>
          <Progress value={budgetPercent} className="h-2" />
        </div>
      )}

      {run.planSummary && (
        <section>
          <h2 className="text-text mb-2 text-sm font-medium">Plan</h2>
          <p className="text-text-muted text-sm">{run.planSummary}</p>
        </section>
      )}

      {run.planTasks.length > 0 && <PlanTaskList tasks={run.planTasks} issues={run.issues} />}

      {run.issues.length > 0 && (
        <section>
          <h2 className="text-text mb-2 text-sm font-medium">
            Issues ({doneCount}/{run.issues.length} done)
          </h2>
          <div className="space-y-2">
            {run.issues.map((issue) => (
              <IssueCard key={issue.id} issue={issue} />
            ))}
          </div>
        </section>
      )}

      <footer className="text-text-muted flex gap-4 text-xs">
        <span>Created {createdAtLabel}</span>
        <span>Updated {updatedAtLabel}</span>
      </footer>
    </div>
  );
}

function Header({
  run,
  liveStatus,
  isActive,
  isPending,
  onCancel,
}: {
  run: RunDetail;
  liveStatus: string;
  isActive: boolean;
  isPending: boolean;
  onCancel: () => void;
}) {
  return (
    <div className="flex items-start justify-between">
      <div>
        <h1 className="text-text text-2xl font-bold">{run.repo}</h1>
        <p className="text-text-muted mt-1 flex items-center gap-3 text-sm">
          <span>Epic #{run.epicNumber}</span>
          <StatusBadge status={liveStatus} />
        </p>
      </div>
      {isActive && (
        <Button variant="destructive" size="sm" onClick={onCancel} disabled={isPending}>
          {isPending ? 'Cancelling...' : 'Cancel Run'}
        </Button>
      )}
    </div>
  );
}
