import { formatCost } from '@/app/format.utils';
import { StatusBadge } from '@/app/status-badge.component';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronRight } from 'lucide-react';
import type { RunDetail } from '../runs.types';

type Issue = RunDetail['issues'][number];

export function IssueCard({ issue }: { issue: Issue }) {
  return (
    <Collapsible className="bg-surface border-border rounded-lg border">
      <CollapsibleTrigger className="flex w-full items-center justify-between px-4 py-3 text-left">
        <div className="flex items-center gap-3">
          <ChevronRight className="text-text-muted h-4 w-4 transition-transform [[data-state=open]>&]:rotate-90" />
          <span className="text-text-muted text-sm">#{issue.issueNumber}</span>
          <span className="text-text text-sm font-medium">{issue.title}</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-text-muted text-xs">{formatCost(issue.costUsd)}</span>
          <StatusBadge status={issue.status} />
        </div>
      </CollapsibleTrigger>
      <CollapsibleContent>
        {issue.agentLogs.length > 0 && (
          <div className="border-border border-t px-4 py-3">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-text-muted text-left">
                  <th className="pb-1 font-medium">Role</th>
                  <th className="pb-1 font-medium">Platform</th>
                  <th className="pb-1 font-medium">Model</th>
                  <th className="pb-1 text-right font-medium">Cost</th>
                  <th className="pb-1 text-right font-medium">Duration</th>
                </tr>
              </thead>
              <tbody>
                {issue.agentLogs.map((log) => (
                  <tr key={log.id} className="text-text">
                    <td className="py-0.5 capitalize">{log.role}</td>
                    <td className="py-0.5 capitalize">{log.platform}</td>
                    <td className="py-0.5">{log.model}</td>
                    <td className="py-0.5 text-right">{formatCost(log.costUsd)}</td>
                    <td className="text-text-muted py-0.5 text-right">{formatDuration(log.durationMs)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CollapsibleContent>
    </Collapsible>
  );
}

function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  const seconds = Math.round(ms / 1000);
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  const remaining = seconds % 60;
  return `${minutes}m ${remaining}s`;
}
