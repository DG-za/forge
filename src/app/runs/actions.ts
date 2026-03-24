'use server';

import type { PipelineApi } from '@/dispatcher/pipeline/pipeline-api';
import type { ActionResult } from './runs.types';
import type { StartRunInput } from './validation';
import { startRunSchema } from './validation';

export type RunInputBuilder = (input: StartRunInput) => Parameters<PipelineApi['startRun']>[0];

// TODO (#48): Build a real RunInput from validated form data + user config.
// PipelineConfig requires planner/coder/reviewer roles, gateConfig, cwd, and exec —
// these need a config UI or stored defaults. For now, this throws at runtime.
const defaultBuildRunInput: RunInputBuilder = (input) => {
  throw new Error(`Run input construction not yet implemented for ${input.repo}#${input.epicNumber}`);
};

export async function startRun(
  formData: FormData,
  api: PipelineApi,
  buildRunInput: RunInputBuilder = defaultBuildRunInput,
): Promise<ActionResult<{ runId: string }>> {
  const parsed = startRunSchema.safeParse({
    repo: formData.get('repo'),
    epicNumber: formData.get('epicNumber'),
    budgetUsd: formData.get('budgetUsd'),
  });

  if (!parsed.success) {
    const firstError = parsed.error.issues[0]?.message ?? 'Invalid input';
    return { error: firstError };
  }

  try {
    const runId = await api.startRun(buildRunInput(parsed.data));
    return { runId };
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Failed to start run' };
  }
}

export async function cancelRun(runId: string, api: PipelineApi): Promise<ActionResult<{ success: boolean }>> {
  try {
    const cancelled = await api.cancelRun(runId);
    if (!cancelled) return { error: 'Run not found or not running' };
    return { success: true };
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Failed to cancel run' };
  }
}
