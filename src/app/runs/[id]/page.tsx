import { RunDetailView } from '@/features/runs/components/run-detail.component';
import { formatRelativeTime } from '@/features/runs/format.utils';
import { getRun } from '@/features/runs/run.queries';
import { notFound } from 'next/navigation';

export default async function RunDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const run = await getRun(id);

  if (!run) notFound();

  return (
    <RunDetailView
      run={run}
      createdAtLabel={formatRelativeTime(run.createdAt)}
      updatedAtLabel={formatRelativeTime(run.updatedAt)}
    />
  );
}
