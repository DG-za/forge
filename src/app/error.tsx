'use client';

export default function ErrorPage({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <section className="flex flex-col items-center justify-center py-20 text-center">
      <h1 className="text-text text-2xl font-bold">Something went wrong</h1>
      <p className="text-text-muted mt-2">{error.message}</p>
      <button
        onClick={reset}
        className="bg-accent hover:bg-accent-hover mt-6 rounded-md px-4 py-2 text-sm font-medium text-white transition-colors"
      >
        Try again
      </button>
    </section>
  );
}
