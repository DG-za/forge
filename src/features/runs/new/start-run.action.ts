'use server';

import { getPipelineApi } from '@/lib/pipeline.singleton';
import { redirect } from 'next/navigation';
import { startRun } from '../run.actions';
import type { ActionResult } from '../run.types';
import { buildRunInput } from './build-run-input';

export async function startRunAction(formData: FormData): Promise<ActionResult<{ runId: string }>> {
  const result = await startRun(formData, getPipelineApi(), buildRunInput);

  if ('runId' in result) {
    redirect(`/runs/${result.runId}`);
  }

  return result;
}
