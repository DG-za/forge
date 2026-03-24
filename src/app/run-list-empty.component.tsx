import Link from 'next/link';

export function RunListEmpty() {
  return (
    <div className="py-16 text-center">
      <p className="text-text-muted text-lg">No runs yet.</p>
      <Link href="/runs/new" className="text-accent hover:text-accent-hover mt-2 inline-block text-sm font-medium">
        Start one &rarr;
      </Link>
    </div>
  );
}
