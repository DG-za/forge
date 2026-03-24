import { getRuns } from '@/app/runs/queries';
import Link from 'next/link';
import { Dashboard } from './dashboard.component';

export default async function DashboardPage() {
  const runs = await getRuns();

  return (
    <section>
      <div className="flex items-center justify-between">
        <h1 className="text-text text-2xl font-bold">Dashboard</h1>
        <Link
          href="/runs/new"
          className="bg-accent hover:bg-accent-hover rounded-md px-4 py-2 text-sm font-medium text-white transition-colors"
        >
          New Run
        </Link>
      </div>
      <Dashboard runs={runs} />
    </section>
  );
}
