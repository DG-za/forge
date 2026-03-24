import { Card, CardContent } from '@/components/ui/card.component';
import type { RunSummary } from '@/features/runs/run.types';
import Link from 'next/link';
import { formatCost, formatRelativeTime } from '../format.utils';
import { StatusBadge } from './status-badge.component';

export function RunCard({ run }: { run: RunSummary }) {
  return (
    <Link href={`/runs/${run.id}`} className="block transition-colors">
      <Card className="hover:bg-muted/50">
        <CardContent>
          <div className="flex items-center justify-between">
            <span className="text-card-foreground font-medium">{run.repo}</span>
            <StatusBadge status={run.status} />
          </div>
          <div className="text-muted-foreground mt-2 flex items-center gap-4 text-sm">
            <span>#{run.epicNumber}</span>
            <span>{formatCost(run.totalCostUsd)}</span>
            <time dateTime={run.createdAt.toISOString()}>{formatRelativeTime(run.createdAt)}</time>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
