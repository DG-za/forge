import { getRuns } from '@/app/runs/queries';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Dashboard } from './dashboard.component';

export default async function DashboardPage() {
  const runs = await getRuns();

  return (
    <section>
      <div className="flex items-center justify-between">
        <h1 className="text-text text-2xl font-bold">Dashboard</h1>
        <Button render={<Link href="/runs/new" />}>New Run</Button>
      </div>
      <Dashboard runs={runs} />
    </section>
  );
}
