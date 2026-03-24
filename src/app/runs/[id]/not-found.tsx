import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function RunNotFound() {
  return (
    <section className="flex flex-col items-center justify-center py-20">
      <h1 className="text-foreground text-2xl font-bold">Run not found</h1>
      <p className="text-muted-foreground mt-2">The run you&apos;re looking for doesn&apos;t exist.</p>
      <Button variant="link" className="mt-4" render={<Link href="/" />}>
        &larr; Back to dashboard
      </Button>
    </section>
  );
}
