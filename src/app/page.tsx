import { Button } from '@/components/ui/button';
import { Dashboard } from '@/features/runs/components/dashboard.component';
import { getRuns } from '@/features/runs/run.queries';
import Link from 'next/link';

export default async function DashboardPage() {
  const runs = await getRuns();

  return (
    <section>
      <div className="flex items-center justify-between">
        <h1 className="text-foreground text-2xl font-bold">Dashboard</h1>
        <Button render={<Link href="/runs/new" />}>New Run</Button>
      </div>
      <Dashboard runs={runs} />
    </section>
  );
}
