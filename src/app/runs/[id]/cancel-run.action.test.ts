import type { PipelineApi } from '@/dispatcher/pipeline/pipeline-api';
import { describe, expect, it, vi } from 'vitest';

vi.mock('@/app/runs/pipeline.singleton', () => ({
  getPipelineApi: (): PipelineApi => mockApi,
}));

let mockApi: PipelineApi;

import { cancelRunAction } from './cancel-run.action';

function buildMockApi(overrides: Partial<PipelineApi> = {}): PipelineApi {
  return {
    startRun: vi.fn(),
    getRunStatus: vi.fn(),
    cancelRun: vi.fn().mockResolvedValue(true),
    resumeRun: vi.fn(),
    ...overrides,
  };
}

describe('cancelRunAction', () => {
  it('should return success when cancellation succeeds', async () => {
    mockApi = buildMockApi();

    const result = await cancelRunAction('run-1');

    expect(result).toEqual({ success: true });
    expect(mockApi.cancelRun).toHaveBeenCalledWith('run-1');
  });

  it('should return error when run is not found or not running', async () => {
    mockApi = buildMockApi({ cancelRun: vi.fn().mockResolvedValue(false) });

    const result = await cancelRunAction('nonexistent');

    expect(result).toEqual({ error: 'Run not found or not running' });
  });

  it('should return error when cancelRun throws', async () => {
    mockApi = buildMockApi({ cancelRun: vi.fn().mockRejectedValue(new Error('Abort failed')) });

    const result = await cancelRunAction('run-1');

    expect(result).toEqual({ error: 'Abort failed' });
  });
});
