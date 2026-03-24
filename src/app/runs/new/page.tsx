import { RunForm } from '@/features/runs/new/run-form.component';
import { startRunAction } from '@/features/runs/new/start-run.action';

export default function NewRunPage() {
  return (
    <section>
      <h1 className="text-foreground text-2xl font-bold">New Run</h1>
      <p className="text-muted-foreground mt-2 mb-6">Configure and launch a new epic run.</p>
      <RunForm action={startRunAction} />
    </section>
  );
}
