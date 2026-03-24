import type { PipelineApi } from '@/dispatcher/pipeline/pipeline-api';
import { describe, expect, it, vi } from 'vitest';
import { cancelRun, startRun, type RunInputBuilder } from './run.actions';

function buildMockApi(overrides: Partial<PipelineApi> = {}): PipelineApi {
  return {
    startRun: vi.fn().mockResolvedValue('new-run-id'),
    getRunStatus: vi.fn(),
    cancelRun: vi.fn().mockResolvedValue(true),
    resumeRun: vi.fn(),
    ...overrides,
  };
}

const stubBuilder: RunInputBuilder = (input) =>
  ({ config: { repo: input.repo, epicNumber: input.epicNumber, maxBudgetUsd: input.budgetUsd } }) as never;

const validRoleFields = {
  plannerPlatform: 'claude',
  plannerModel: 'claude-sonnet-4-6',
  coderPlatform: 'openai',
  coderModel: 'gpt-4.1',
  reviewerPlatform: 'claude',
  reviewerModel: 'claude-sonnet-4-6',
  lintCommand: 'npm run lint',
  typecheckCommand: 'npm run typecheck',
  testCommand: 'npm test',
};

function formData(entries: Record<string, string>): FormData {
  const fd = new FormData();
  for (const [key, value] of Object.entries(entries)) {
    fd.set(key, value);
  }
  return fd;
}

function validFormData(overrides: Record<string, string> = {}): FormData {
  return formData({
    repo: 'owner/repo',
    epicNumber: '10',
    budgetUsd: '25',
    ...validRoleFields,
    ...overrides,
  });
}

describe('startRun', () => {
  it('should validate input and return runId on success', async () => {
    const api = buildMockApi();

    const result = await startRun(validFormData(), api, stubBuilder);

    expect(result).toEqual({ runId: 'new-run-id' });
    expect(api.startRun).toHaveBeenCalledOnce();
  });

  it('should return error for invalid repo format', async () => {
    const api = buildMockApi();

    const result = await startRun(validFormData({ repo: 'invalid' }), api);

    expect(result).toEqual({ error: expect.stringContaining('owner/name') });
    expect(api.startRun).not.toHaveBeenCalled();
  });

  it('should return error for missing fields', async () => {
    const api = buildMockApi();

    const result = await startRun(formData({}), api);

    expect(result).toHaveProperty('error');
    expect(api.startRun).not.toHaveBeenCalled();
  });

  it('should return error for budget out of range', async () => {
    const api = buildMockApi();

    const result = await startRun(validFormData({ budgetUsd: '999' }), api);

    expect(result).toHaveProperty('error');
    expect(api.startRun).not.toHaveBeenCalled();
  });

  it('should return error when PipelineApi.startRun throws', async () => {
    const api = buildMockApi({ startRun: vi.fn().mockRejectedValue(new Error('DB down')) });

    const result = await startRun(validFormData(), api, stubBuilder);

    expect(result).toEqual({ error: 'DB down' });
  });

  it('should return error when buildRunInput is not implemented', async () => {
    const api = buildMockApi();

    const result = await startRun(validFormData(), api);

    expect(result).toEqual({
      error: expect.stringContaining('No RunInputBuilder provided'),
    });
    expect(api.startRun).not.toHaveBeenCalled();
  });
});

describe('cancelRun', () => {
  it('should return success when cancellation succeeds', async () => {
    const api = buildMockApi();

    const result = await cancelRun('run-1', api);

    expect(result).toEqual({ success: true });
    expect(api.cancelRun).toHaveBeenCalledWith('run-1');
  });

  it('should return error when run is not found or not running', async () => {
    const api = buildMockApi({ cancelRun: vi.fn().mockResolvedValue(false) });

    const result = await cancelRun('nonexistent', api);

    expect(result).toEqual({ error: 'Run not found or not running' });
  });

  it('should return error when cancelRun throws', async () => {
    const api = buildMockApi({ cancelRun: vi.fn().mockRejectedValue(new Error('Abort failed')) });

    const result = await cancelRun('run-1', api);

    expect(result).toEqual({ error: 'Abort failed' });
  });
});
