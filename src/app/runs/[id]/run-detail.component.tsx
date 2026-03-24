'use client';

import { formatCost, formatRelativeTime } from '@/app/format.utils';
import { StatusBadge } from '@/app/status-badge.component';
import { useRunEvents } from '@/app/use-run-events.hook';
import { Progress } from '@/components/ui/progress';
import { useTransition } from 'react';
import type { RunDetail } from '../runs.types';
import { cancelRunAction } from './cancel-run.action';
import { IssueCard } from './issue-card.component';
import { PlanTaskList } from './plan-task-list.component';

const TERMINAL_STATUSES = new Set(['completed', 'failed']);

export function RunDetailView({ run }: { run: RunDetail }) {
  const statusMap = useRunEvents(run.id);
  const liveStatus = statusMap.get(run.id) ?? run.status;
  const isActive = !TERMINAL_STATUSES.has(liveStatus);
  const [isPending, startTransition] = useTransition();

  const budgetPercent = run.budgetUsd ? Math.min((run.totalCostUsd / run.budgetUsd) * 100, 100) : 0;
  const doneCount = run.issues.filter((i) => i.status === 'done').length;

  function handleCancel() {
    startTransition(async () => {
      await cancelRunAction(run.id);
    });
  }

  return (
    <div className="space-y-6">
      <Header run={run} liveStatus={liveStatus} isActive={isActive} isPending={isPending} onCancel={handleCancel} />

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
        <span>Created {formatRelativeTime(run.createdAt)}</span>
        <span>Updated {formatRelativeTime(run.updatedAt)}</span>
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
        <button
          onClick={onCancel}
          disabled={isPending}
          className="rounded-md border border-red-500/30 bg-red-500/10 px-3 py-1.5 text-sm text-red-400 transition-colors hover:bg-red-500/20 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isPending ? 'Cancelling...' : 'Cancel Run'}
        </button>
      )}
    </div>
  );
}
