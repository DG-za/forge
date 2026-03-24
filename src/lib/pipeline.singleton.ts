import { createPipelineApi, type PipelineApi } from '@/dispatcher/pipeline/pipeline-api.utils';
import { createStateEmitter, type StateEmitter } from '@/dispatcher/state-emitter.utils';
import { prisma } from '@/shared/db.singleton';

const emitter = createStateEmitter();
let instance: PipelineApi | null = null;

export function getPipelineApi(): PipelineApi {
  if (!instance) {
    instance = createPipelineApi(prisma, emitter.emit);
  }
  return instance;
}

export function getStateEmitter(): StateEmitter {
  return emitter;
}
