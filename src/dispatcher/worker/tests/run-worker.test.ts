import { describe, expect, it, vi } from 'vitest';
import type { CommandExecutor } from '../../coder/coder.types';
import type { IssueOutcome } from '../../pipeline/pipeline.types';
import { runWorker } from '../run-worker';
import type { WorkerOptions } from '../worker.types';

vi.mock('../git-auth', () => ({
  verifyGitAccess: vi.fn().mockResolvedValue({ ok: true }),
}));

vi.mock('../repo-manager', () => ({
  ensureRepo: vi.fn().mockResolvedValue({ ok: true, repoDir: '/repos/owner/repo' }),
}));

vi.mock('../worktree', () => ({
  createWorktree: vi.fn().mockResolvedValue({ ok: true, worktreePath: '/repos/owner/repo/.worktrees/feature/42-add-auth' }),
  cleanupWorktree: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('../context-builder', () => ({
  buildWorkerContext: vi.fn().mockResolvedValue('Issue context here'),
}));

vi.mock('../pr-creator', () => ({
  createPullRequest: vi.fn().mockResolvedValue('https://github.com/owner/repo/pull/1'),
}));

vi.mock('../../pipeline/process-issue', () => ({
  processIssue: vi.fn().mockResolvedValue({
    issueNumber: 42,
    status: 'done',
    cost: { inputTokens: 100, outputTokens: 50, costUsd: 0.01 },
  } satisfies IssueOutcome),
}));

const mockRunner = { platform: 'claude' as const, run: vi.fn() };

function buildOptions(overrides: Partial<WorkerOptions> = {}): WorkerOptions {
  return {
    task: {
      issueNumber: 42,
      title: 'Add user authentication',
      body: 'Implement OAuth2 login flow',
      acceptanceCriteria: ['Users can log in with GitHub'],
    },
    repoConfig: { repo: 'owner/repo', basePath: '/repos' },
    coder: { runner: mockRunner, model: 'claude-sonnet-4-6' },
    reviewer: { runner: { ...mockRunner, platform: 'openai' }, model: 'gpt-4.1' },
    gateConfig: { lintCommand: 'npm run lint', typecheckCommand: 'npm run typecheck', testCommand: 'npm test' },
    maxBudgetUsd: 10,
    exec: vi.fn().mockResolvedValue({ exitCode: 0, output: '' }),
    ...overrides,
  };
}

describe('runWorker', () => {
  it('should return done with PR URL on success', async () => {
    const result = await runWorker(buildOptions());

    expect(result.status).toBe('done');
    expect(result.prUrl).toBe('https://github.com/owner/repo/pull/1');
    expect(result.issueNumber).toBe(42);
  });

  it('should return the branch name', async () => {
    const result = await runWorker(buildOptions());

    expect(result.branch).toContain('42');
  });

  it('should return failed when git auth fails', async () => {
    const { verifyGitAccess } = await import('../git-auth');
    vi.mocked(verifyGitAccess).mockResolvedValueOnce({ ok: false, error: 'Auth failed' });

    const result = await runWorker(buildOptions());

    expect(result.status).toBe('failed');
    expect(result.prUrl).toBeNull();
  });

  it('should return failed when repo clone fails', async () => {
    const { ensureRepo } = await import('../repo-manager');
    vi.mocked(ensureRepo).mockResolvedValueOnce({ ok: false, error: 'Clone failed' });

    const result = await runWorker(buildOptions());

    expect(result.status).toBe('failed');
  });

  it('should return failed when worktree creation fails', async () => {
    const { createWorktree } = await import('../worktree');
    vi.mocked(createWorktree).mockResolvedValueOnce({ ok: false, error: 'Worktree failed' });

    const result = await runWorker(buildOptions());

    expect(result.status).toBe('failed');
  });

  it('should not create PR when processIssue fails', async () => {
    const { processIssue } = await import('../../pipeline/process-issue');
    vi.mocked(processIssue).mockResolvedValueOnce({
      issueNumber: 42,
      status: 'failed',
      cost: { inputTokens: 100, outputTokens: 50, costUsd: 0.01 },
    });

    const result = await runWorker(buildOptions());

    expect(result.status).toBe('failed');
    expect(result.prUrl).toBeNull();
  });

  it('should cleanup worktree even when processIssue fails', async () => {
    const { processIssue } = await import('../../pipeline/process-issue');
    const { cleanupWorktree } = await import('../worktree');
    vi.mocked(processIssue).mockRejectedValueOnce(new Error('Agent crashed'));

    const result = await runWorker(buildOptions());

    expect(result.status).toBe('failed');
    expect(cleanupWorktree).toHaveBeenCalled();
  });

  it('should propagate escalated status', async () => {
    const { processIssue } = await import('../../pipeline/process-issue');
    vi.mocked(processIssue).mockResolvedValueOnce({
      issueNumber: 42,
      status: 'escalated',
      cost: { inputTokens: 100, outputTokens: 50, costUsd: 0.01 },
    });

    const result = await runWorker(buildOptions());

    expect(result.status).toBe('escalated');
    expect(result.prUrl).toBeNull();
  });

  it('should return cost from processIssue', async () => {
    const result = await runWorker(buildOptions());

    expect(result.cost.costUsd).toBe(0.01);
  });
});
