import { getStateEmitter } from '@/app/runs/pipeline.singleton';
import type { StateChangeEvent } from '@/dispatcher/state-machine.types';

function getRunId(event: StateChangeEvent): string | null {
  if (event.kind === 'run') return event.transition.runId;
  if (event.kind === 'budget_warning') return event.warning.runId;
  return null;
}

export function GET(request: Request): Response {
  const url = new URL(request.url);
  const filterRunId = url.searchParams.get('runId');
  const emitter = getStateEmitter();
  let cleanup: (() => void) | null = null;

  const stream = new ReadableStream({
    start(controller) {
      let closed = false;

      const listener = (event: StateChangeEvent) => {
        if (closed) return;
        if (filterRunId && getRunId(event) !== filterRunId) return;
        controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify(event)}\n\n`));
      };

      emitter.on(listener);

      cleanup = () => {
        if (closed) return;
        closed = true;
        emitter.off(listener);
        try {
          controller.close();
        } catch {
          // Already closed
        }
      };

      request.signal?.addEventListener('abort', () => cleanup?.());
    },
    cancel() {
      cleanup?.();
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  });
}
