import { getRun } from '@/app/runs/queries';
import { notFound } from 'next/navigation';
import { RunDetailView } from './run-detail.component';

export default async function RunDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const run = await getRun(id);

  if (!run) notFound();

  return <RunDetailView run={run} />;
}
