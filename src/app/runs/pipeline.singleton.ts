import { createPipelineApi, type PipelineApi } from '@/dispatcher/pipeline/pipeline-api';
import { prisma } from '@/shared/db';

let instance: PipelineApi | null = null;

export function getPipelineApi(): PipelineApi {
  if (!instance) {
    instance = createPipelineApi(prisma);
  }
  return instance;
}
