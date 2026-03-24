import type { RunSummary } from '@/app/runs/runs.types';
import Link from 'next/link';
import { formatCost, formatRelativeTime } from './format.utils';
import { StatusBadge } from './status-badge.component';

export function RunCard({ run }: { run: RunSummary }) {
  return (
    <Link
      href={`/runs/${run.id}`}
      className="bg-surface border-border hover:bg-surface-alt block rounded-lg border p-4 transition-colors"
    >
      <div className="flex items-center justify-between">
        <span className="text-text font-medium">{run.repo}</span>
        <StatusBadge status={run.status} />
      </div>
      <div className="text-text-muted mt-2 flex items-center gap-4 text-sm">
        <span>#{run.epicNumber}</span>
        <span>{formatCost(run.totalCostUsd)}</span>
        <time dateTime={run.createdAt.toISOString()}>{formatRelativeTime(run.createdAt)}</time>
      </div>
    </Link>
  );
}
