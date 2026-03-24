'use server';

import { cancelRun } from '@/features/runs/run.actions';
import type { ActionResult } from '@/features/runs/run.types';
import { getPipelineApi } from '@/lib/pipeline.singleton';

export async function cancelRunAction(runId: string): Promise<ActionResult<{ success: boolean }>> {
  return cancelRun(runId, getPipelineApi());
}
