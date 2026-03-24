import { RunForm } from './run-form.component';
import { startRunAction } from './start-run.action';

export default function NewRunPage() {
  return (
    <section>
      <h1 className="text-text text-2xl font-bold">New Run</h1>
      <p className="text-text-muted mt-2 mb-6">Configure and launch a new epic run.</p>
      <RunForm action={startRunAction} />
    </section>
  );
}
