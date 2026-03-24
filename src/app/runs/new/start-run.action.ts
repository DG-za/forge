'use server';

import { redirect } from 'next/navigation';
import { startRun } from '../actions';
import { getPipelineApi } from '../pipeline.singleton';
import type { ActionResult } from '../runs.types';
import { buildRunInput } from './build-run-input';

export async function startRunAction(formData: FormData): Promise<ActionResult<{ runId: string }>> {
  const result = await startRun(formData, getPipelineApi(), buildRunInput);

  if ('runId' in result) {
    redirect(`/runs/${result.runId}`);
  }

  return result;
}
