'use server';

import type { PipelineApi } from '@/dispatcher/pipeline/pipeline-api';
import type { ActionResult } from './runs.types';
import { startRunSchema } from './validation';

export async function startRun(formData: FormData, api: PipelineApi): Promise<ActionResult<{ runId: string }>> {
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
    const { repo, epicNumber, budgetUsd } = parsed.data;
    const runId = await api.startRun({
      config: { repo, epicNumber, maxBudgetUsd: budgetUsd } as never,
      issueFetcher: {} as never,
      getDiff: async () => '',
    });
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
