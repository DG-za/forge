import type { StateChangeEvent, StateChangeListener } from '@/dispatcher/state-machine.types';
import { describe, expect, it, vi } from 'vitest';
import { GET } from './route';

const listeners = new Set<StateChangeListener>();

vi.mock('@/lib/pipeline.singleton', () => ({
  getStateEmitter: () => ({
    on: (fn: StateChangeListener) => listeners.add(fn),
    off: (fn: StateChangeListener) => listeners.delete(fn),
    emit: (event: StateChangeEvent) => listeners.forEach((fn) => fn(event)),
  }),
}));

async function readChunks(stream: ReadableStream<Uint8Array>, count: number): Promise<string[]> {
  const reader = stream.getReader();
  const decoder = new TextDecoder();
  const chunks: string[] = [];
  for (let i = 0; i < count; i++) {
    const { value, done } = await reader.read();
    if (done) break;
    chunks.push(decoder.decode(value));
  }
  reader.cancel();
  return chunks;
}

describe('GET /api/runs/events', () => {
  it('should return a streaming response with correct SSE headers', async () => {
    const response = await GET(new Request('http://localhost/api/runs/events'));

    expect(response.status).toBe(200);
    expect(response.headers.get('Content-Type')).toBe('text/event-stream');
    expect(response.headers.get('Cache-Control')).toBe('no-cache');
    expect(response.headers.get('Connection')).toBe('keep-alive');

    response.body?.cancel();
  });

  it('should stream state change events as SSE data', async () => {
    const response = await GET(new Request('http://localhost/api/runs/events'));

    // Give the stream a tick to set up
    await new Promise((r) => setTimeout(r, 10));

    const event: StateChangeEvent = {
      kind: 'run',
      transition: { runId: 'run-1', from: 'pending', to: 'planning' },
    };
    listeners.forEach((fn) => fn(event));

    const chunks = await readChunks(response.body!, 1);
    expect(chunks[0]).toContain('data: ');
    expect(chunks[0]).toContain('"kind":"run"');
    expect(chunks[0]).toContain('"runId":"run-1"');
  });

  it('should filter events by runId query param', async () => {
    const response = await GET(new Request('http://localhost/api/runs/events?runId=run-1'));

    await new Promise((r) => setTimeout(r, 10));

    // Emit event for a different run — should be filtered out
    const otherEvent: StateChangeEvent = {
      kind: 'run',
      transition: { runId: 'run-2', from: 'pending', to: 'planning' },
    };
    listeners.forEach((fn) => fn(otherEvent));

    // Emit event for the target run
    const matchEvent: StateChangeEvent = {
      kind: 'run',
      transition: { runId: 'run-1', from: 'planning', to: 'in_progress' },
    };
    listeners.forEach((fn) => fn(matchEvent));

    const chunks = await readChunks(response.body!, 1);
    expect(chunks[0]).toContain('"runId":"run-1"');
    expect(chunks[0]).not.toContain('"runId":"run-2"');
  });

  it('should remove listener when client disconnects', async () => {
    const beforeCount = listeners.size;

    const response = await GET(new Request('http://localhost/api/runs/events'));
    await new Promise((r) => setTimeout(r, 10));
    expect(listeners.size).toBe(beforeCount + 1);

    await response.body?.cancel();
    await new Promise((r) => setTimeout(r, 10));
    expect(listeners.size).toBe(beforeCount);
  });
});
