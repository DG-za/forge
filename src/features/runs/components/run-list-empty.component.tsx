import { Button } from '@/components/ui/button.component';
import Link from 'next/link';

export function RunListEmpty() {
  return (
    <div className="py-16 text-center">
      <p className="text-muted-foreground text-lg">No runs yet.</p>
      <Button variant="link" className="mt-2" render={<Link href="/runs/new" />}>
        Start one &rarr;
      </Button>
    </div>
  );
}
