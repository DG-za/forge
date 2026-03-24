import Link from 'next/link';

export default function RunNotFound() {
  return (
    <section className="flex flex-col items-center justify-center py-20">
      <h1 className="text-text text-2xl font-bold">Run not found</h1>
      <p className="text-text-muted mt-2">The run you're looking for doesn't exist.</p>
      <Link href="/" className="text-accent hover:text-accent-hover mt-4 text-sm transition-colors">
        ← Back to dashboard
      </Link>
    </section>
  );
}
