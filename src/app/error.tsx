'use client';

import { Button } from '@/components/ui/button';

export default function ErrorPage({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <section className="flex flex-col items-center justify-center py-20 text-center">
      <h1 className="text-text text-2xl font-bold">Something went wrong</h1>
      <p className="text-text-muted mt-2">{error.message}</p>
      <Button onClick={reset} className="mt-6">
        Try again
      </Button>
    </section>
  );
}
