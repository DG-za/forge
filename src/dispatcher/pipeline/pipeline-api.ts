import type { IssueFetcher } from '../planner/planner.types';
import type { PipelineConfig } from './pipeline.types';
import { runPipeline, type FullPipelineResult } from './run-pipeline';

type RunInput = {
  config: PipelineConfig;
  issueFetcher: IssueFetcher;
  getDiff: () => Promise<string>;
};

type RunStatus = {
  state: 'running' | 'completed' | 'failed';
  result?: FullPipelineResult;
  error?: string;
};

type PipelineApi = {
  startRun(input: RunInput): string;
  getRunStatus(runId: string): RunStatus | null;
  cancelRun(runId: string): boolean;
};

export function createPipelineApi(): PipelineApi {
  const runs = new Map<string, { status: RunStatus; controller: AbortController }>();
  let nextId = 1;

  return { startRun, getRunStatus, cancelRun };

  function startRun(input: RunInput): string {
    const runId = `run-${nextId++}`;
    const controller = new AbortController();

    runs.set(runId, { status: { state: 'running' }, controller });

    runPipeline({ runId, ...input, signal: controller.signal })
      .then((result) => {
        const entry = runs.get(runId);
        if (entry) entry.status = { state: 'completed', result };
      })
      .catch((error) => {
        const entry = runs.get(runId);
        if (entry) entry.status = { state: 'failed', error: String(error) };
      });

    return runId;
  }

  function getRunStatus(runId: string): RunStatus | null {
    return runs.get(runId)?.status ?? null;
  }

  function cancelRun(runId: string): boolean {
    const entry = runs.get(runId);
    if (!entry) return false;
    entry.controller.abort();
    return true;
  }
}

