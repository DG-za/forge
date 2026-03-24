'use server';

import { cancelRun } from '@/app/runs/actions';
import { getPipelineApi } from '@/app/runs/pipeline.singleton';
import type { ActionResult } from '@/app/runs/runs.types';

export async function cancelRunAction(runId: string): Promise<ActionResult<{ success: boolean }>> {
  return cancelRun(runId, getPipelineApi());
}
