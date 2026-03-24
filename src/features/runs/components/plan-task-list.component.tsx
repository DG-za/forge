import { Badge } from '@/components/ui/badge.component';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible.component';
import { StatusBadge } from '@/features/runs/components/status-badge.component';
import { ChevronRight } from 'lucide-react';
import type { RunDetail } from '../run.types';

type PlanTask = RunDetail['planTasks'][number];
type Issue = RunDetail['issues'][number];

export function PlanTaskList({ tasks, issues }: { tasks: PlanTask[]; issues: Issue[] }) {
  const issueByNumber = new Map(issues.map((i) => [i.issueNumber, i]));

  return (
    <section>
      <h2 className="text-foreground mb-2 text-sm font-medium">Plan tasks</h2>
      <div className="space-y-2">
        {tasks.map((task) => {
          const issue = task.issueNumber ? issueByNumber.get(task.issueNumber) : undefined;
          return <PlanTaskRow key={task.id} task={task} issue={issue} />;
        })}
      </div>
    </section>
  );
}

function PlanTaskRow({ task, issue }: { task: PlanTask; issue?: Issue }) {
  return (
    <Collapsible className="bg-card border-border rounded-lg border">
      <CollapsibleTrigger className="flex w-full items-center justify-between px-4 py-3 text-left">
        <div className="flex items-center gap-3">
          <ChevronRight className="text-muted-foreground h-4 w-4 transition-transform [[data-state=open]>&]:rotate-90" />
          <span className="text-muted-foreground text-xs">{task.orderIndex + 1}.</span>
          <span className="text-foreground text-sm font-medium">{task.title}</span>
          <Badge variant="outline" className="text-muted-foreground text-xs capitalize">
            {task.complexity}
          </Badge>
        </div>
        {issue && <StatusBadge status={issue.status} />}
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="border-border border-t px-4 py-3">
          {task.acceptanceCriteria.length > 0 && (
            <ul className="text-muted-foreground list-disc space-y-1 pl-5 text-xs">
              {task.acceptanceCriteria.map((ac, i) => (
                <li key={i}>{ac}</li>
              ))}
            </ul>
          )}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
