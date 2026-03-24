import type { PipelineApi } from '@/dispatcher/pipeline/pipeline-api';
import type { ActionResult } from './runs.types';
import type { StartRunInput } from './validation';
import { startRunSchema } from './validation';

export type RunInputBuilder = (input: StartRunInput) => Parameters<PipelineApi['startRun']>[0];

const defaultBuildRunInput: RunInputBuilder = (input) => {
  throw new Error(`No RunInputBuilder provided for ${input.repo}#${input.epicNumber}`);
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
    plannerPlatform: formData.get('plannerPlatform'),
    plannerModel: formData.get('plannerModel'),
    coderPlatform: formData.get('coderPlatform'),
    coderModel: formData.get('coderModel'),
    reviewerPlatform: formData.get('reviewerPlatform'),
    reviewerModel: formData.get('reviewerModel'),
    lintCommand: formData.get('lintCommand'),
    typecheckCommand: formData.get('typecheckCommand'),
    testCommand: formData.get('testCommand'),
    repoBasePath: formData.get('repoBasePath'),
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
